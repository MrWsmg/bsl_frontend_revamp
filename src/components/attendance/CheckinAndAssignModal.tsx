"use client";

/**
 * CheckinAndAssignModal — v2 with Face Verification
 *
 * Two-step workflow:
 *   Step 1 — Task Details   : farm, date, block, task code, rate, quantity
 *   Step 2 — Face Capture   : supervisor takes a live photo of the worker
 *
 * On submit the modal sends a single multipart POST to:
 *   POST /supervisor/workers/{id}/checkin-assign-with-face
 * which atomically records check-in + task assignment + face verification.
 *
 * Face verification is best-effort:
 *   - Worker has face_id  → verified / failed shown; supervisor can always proceed
 *   - Worker has no face  → records as manual; photo still captured for audit trail
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserCheck,
  ClipboardList,
  Camera,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  IndentIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import apiService from '../../services/api';
import type { CheckinAssignWithFaceResult } from '../../services/api/attendance';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Zod schema ────────────────────────────────────────────────────────────────

const schema = z.object({
  farm_id:        z.number({ required_error: 'Farm is required' }).min(1),
  date:           z.string().min(1, 'Date is required'),
  notes:          z.string().optional(),
  task_code:      z.string().min(1, 'Task code is required'),
  block_id:       z.number({ required_error: 'Block is required' }).min(1),
  crop_type:      z.string().optional(),
  // quantity is only shown (and required) for per_task; per_day defaults to 1
  quantity:       z.number({ invalid_type_error: 'Enter a number' }).positive('Must be > 0').optional(),
  rate:           z.number({ invalid_type_error: 'Enter a number' }).positive('Must be > 0'),
  payment_method: z.enum(['per_task', 'per_day']),
  task_notes:     z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.payment_method === 'per_task' && (data.quantity == null || data.quantity <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Quantity is required for per-task payment',
      path: ['quantity'],
    });
  }
});

type CheckinFormValues = z.infer<typeof schema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function localDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTZS(n: number): string {
  return `TZS ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Worker {
  id: number;
  name?: string;
  full_name?: string;
  worker_type?: string;
  face_id?: string | null;
}

interface Farm {
  id?: number | null;
  farm_id?: number | null;
  name: string;
  location?: string;
}

interface TaskCode {
  code?: string;
  task_code?: string;
  description?: string;
  name?: string;
  cost_per_unit?: number;
}

interface Block {
  id: number;
  name: string;
  code?: string;
}

export interface CheckinAndAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
  farms: Farm[];
  taskCodes: TaskCode[];
  onSuccess?: (result: CheckinAssignWithFaceResult) => void;
}

// ── Face verification badge ────────────────────────────────────────────────────

type FaceStatus = 'verified' | 'failed' | 'manual' | null;

function FaceBadge({ status, confidence }: { status: FaceStatus; confidence?: number }) {
  if (!status) return null;
  if (status === 'verified') {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-900">Face Verified</p>
          {confidence != null && (
            <p className="text-xs text-green-700">Confidence: {confidence.toFixed(1)}%</p>
          )}
        </div>
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5">
        <XCircle className="w-5 h-5 text-yellow-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-yellow-900">Face Not Matched</p>
          <p className="text-xs text-yellow-700">Will be flagged for supervisor review</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
      <AlertCircle className="w-5 h-5 text-gray-500 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-gray-700">Manual Check-in</p>
        <p className="text-xs text-gray-500">No face enrolled — photo saved for records</p>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CheckinAndAssignModal({
  isOpen,
  onClose,
  worker,
  farms,
  taskCodes,
  onSuccess,
}: CheckinAndAssignModalProps) {
  // ── Step state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);

  // ── Task form ──────────────────────────────────────────────────────────────
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  // ── Face capture ──────────────────────────────────────────────────────────
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Submission ────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);

  const workerName = worker.full_name || worker.name || `Worker #${worker.id}`;
  const hasFace    = Boolean(worker.face_id);

  const initials = useMemo(() => {
    const parts = workerName.trim().split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase();
  }, [workerName]);

  // ── Form ───────────────────────────────────────────────────────────────────
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors: _errors },
  } = useForm<CheckinFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date:           localDateString(),
      payment_method: 'per_task' as const,
      // Ensure optional string fields always start as '' so inputs are always controlled
      notes:          '',
      crop_type:      '',
      task_notes:     '',
    },
  });

  const watchedFarmId        = watch('farm_id');
  const watchedPaymentMethod = watch('payment_method');
  const watchedQuantity      = watch('quantity');
  const watchedRate          = watch('rate');

  const liveTotal = useMemo(() => {
    const q = watchedQuantity ?? 0;
    const r = watchedRate ?? 0;
    return Number.isFinite(q) && Number.isFinite(r) ? q * r : 0;
  }, [watchedQuantity, watchedRate]);

  // ── Side effects ───────────────────────────────────────────────────────────

  // Auto-select single farm
  useEffect(() => {
    if (farms.length === 1) {
      const id = farms[0].id ?? farms[0].farm_id;
      if (id != null) setValue('farm_id', id as number);
    }
  }, [farms, setValue]);

  // Lazy-load blocks when farm changes
  useEffect(() => {
    if (!watchedFarmId) { setBlocks([]); return; }
    setLoadingBlocks(true);
    apiService
      .getBlocksForFarm(watchedFarmId)
      .then((data: Block[]) => setBlocks(data ?? []))
      .catch(() => setBlocks([]))
      .finally(() => setLoadingBlocks(false));
  }, [watchedFarmId]);

  // Attach stream to video element after camera starts
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isCameraActive]);

  // Stop camera when modal closes or step changes back to 1
  useEffect(() => {
    if (!isOpen || step === 1) stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step]);

  // ── Camera helpers ─────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
      });
      setCameraStream(stream);
      setIsCameraActive(true);
    } catch {
      toast.error('Unable to access camera. Use "Upload Photo" instead.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
      setIsCameraActive(false);
    }
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File(
        [blob],
        `checkin-${worker.id}-${Date.now()}.jpg`,
        { type: 'image/jpeg' },
      );
      setCapturedFile(file);
      if (capturedPreview) URL.revokeObjectURL(capturedPreview);
      setCapturedPreview(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.95);
  }, [worker.id, capturedPreview, stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedFile(null);
    if (capturedPreview) URL.revokeObjectURL(capturedPreview);
    setCapturedPreview(null);
    startCamera();
  }, [capturedPreview, startCamera]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    setCapturedFile(file);
    if (capturedPreview) URL.revokeObjectURL(capturedPreview);
    setCapturedPreview(URL.createObjectURL(file));
  }, [capturedPreview]);

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goToStep2 = async () => {
    const valid = await trigger(); // validate all fields first
    if (!valid) return;
    setStep(2);
    // Auto-open camera when entering step 2
    setTimeout(() => startCamera(), 150);
  };

  const handleClose = () => {
    stopCamera();
    if (capturedPreview) URL.revokeObjectURL(capturedPreview);
    setCapturedFile(null);
    setCapturedPreview(null);
    setStep(1);
    reset();
    setBlocks([]);
    onClose();
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = handleSubmit(async (data: CheckinFormValues) => {
    if (!capturedFile) {
      toast.error('Please capture or upload a face photo first');
      return;
    }
    setSubmitting(true);
    try {
      const result = await apiService.attendance.checkinAssignWithFace(worker.id, {
        file:           capturedFile,
        farm_id:        data.farm_id,
        date_worked:    data.date,
        notes:          data.notes || undefined,
        task_code:      data.task_code,
        block_id:       data.block_id,
        crop_type:      data.crop_type || undefined,
        // per_day hides the quantity field — backend still needs a value, default to 1
        quantity:       data.quantity ?? 1,
        rate:           data.rate,
        payment_method: data.payment_method,
        task_notes:     data.task_notes || undefined,
      });

      const faceMsg =
        result.face_verification_status === 'verified'
          ? `✓ Face verified (${result.confidence.toFixed(1)}%)`
          : result.face_verification_status === 'failed'
          ? '⚠ Face not matched — flagged for review'
          : 'Manual check-in';

      toast.success(
        `${workerName} checked in & assigned ${result.task_code} · ${result.block} · ${faceMsg}`,
      );
      onSuccess?.(result);
      handleClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || err?.message || 'Check-in and task assignment failed',
      );
    } finally {
      setSubmitting(false);
    }
  });

  // ── Task code auto-fill rate ───────────────────────────────────────────────

  const handleTaskCodeChange = (code: string, onChange: (v: string) => void) => {
    onChange(code);
    const tc = taskCodes.find((t) => (t.code ?? t.task_code) === code);
    if (tc?.cost_per_unit != null) setValue('rate', tc.cost_per_unit);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Check In &amp; Assign Task
          </DialogTitle>
        </DialogHeader>

        {/* ── Worker identity strip ──────────────────────────────────────── */}
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <span className="w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0 select-none">
            {initials}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{workerName}</p>
            <p className="text-xs text-gray-500">
              ID {worker.id} · {worker.worker_type || 'Worker'}
              {hasFace
                ? <span className="ml-2 text-green-600 font-medium">· Face Registered ✓</span>
                : <span className="ml-2 text-yellow-600 font-medium">· No Face Enrolled</span>}
            </p>
          </div>
        </div>

        {/* ── Step progress indicator ────────────────────────────────────── */}
        <nav aria-label="Form steps" className="flex items-center gap-1 select-none">
          {/* Step 1 pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            step === 1
              ? 'bg-blue-600 text-white'
              : 'bg-green-100 text-green-700'
          }`}>
            {step > 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ClipboardList className="w-3.5 h-3.5" />}
            1 · Task Details
          </div>
          <div className="flex-1 h-px bg-gray-200 mx-1" aria-hidden="true" />
          {/* Step 2 pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            step === 2
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-400'
          }`}>
            <Camera className="w-3.5 h-3.5" />
            2 · Face Capture
          </div>
        </nav>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STEP 1 — Task Details                                           */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); goToStep2(); }} className="space-y-5" noValidate>

            {/* Check-in section */}
            <fieldset className="border border-blue-200 rounded-lg p-4 space-y-4">
              <legend className="px-1 text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />Attendance
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Farm */}
                <Controller
                  name="farm_id"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Farm <span className="text-red-500">*</span></FieldLabel>
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Select farm…" />
                        </SelectTrigger>
                        <SelectContent>
                          {farms
                            .filter((f) => (f.id ?? f.farm_id) != null)
                            .map((f) => {
                              const id = (f.id ?? f.farm_id) as number;
                              return (
                                <SelectItem key={id} value={String(id)}>
                                  {f.name}{f.location ? ` — ${f.location}` : ''}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                {/* Date */}
                <Controller
                  name="date"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Date <span className="text-red-500">*</span></FieldLabel>
                      <Input {...field} type="date" aria-invalid={fieldState.invalid} className="h-10" />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Notes (optional)</FieldLabel>
                    <Input {...field} placeholder="Attendance notes…" className="h-10" />
                  </Field>
                )}
              />
            </fieldset>

            {/* Task section */}
            <fieldset className="border border-emerald-200 rounded-lg p-4 space-y-4">
              <legend className="px-1 text-xs font-semibold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                <ClipboardList className="w-3.5 h-3.5" />Task Assignment
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Task code */}
                <Controller
                  name="task_code"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Task Code <span className="text-red-500">*</span></FieldLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(v) => handleTaskCodeChange(v, field.onChange)}
                      >
                        <SelectTrigger aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Select task…" />
                        </SelectTrigger>
                        <SelectContent>
                          {taskCodes.map((tc) => {
                            const code = tc.code ?? tc.task_code ?? '';
                            return (
                              <SelectItem key={code} value={code}>
                                {code} — {tc.description ?? tc.name ?? ''}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                {/* Block */}
                <Controller
                  name="block_id"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Block <span className="text-red-500">*</span></FieldLabel>
                      <Select
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(v) => field.onChange(Number(v))}
                        disabled={!watchedFarmId || loadingBlocks}
                      >
                        <SelectTrigger aria-invalid={fieldState.invalid}>
                          <SelectValue
                            placeholder={
                              !watchedFarmId ? 'Select farm first'
                              : loadingBlocks ? 'Loading…'
                              : 'Select block…'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {blocks.map((b) => (
                            <SelectItem key={b.id} value={String(b.id)}>
                              {b.code ? `${b.code} — ` : ''}{b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                {/* Payment method */}
                <Controller
                  name="payment_method"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Payment Method</FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_task">Per Task</SelectItem>
                          <SelectItem value="per_day">Per Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />

                {/* Crop type */}
                <Controller
                  name="crop_type"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Crop Type (optional)</FieldLabel>
                      <Input {...field} placeholder="e.g. coffee, maize…" className="h-10" />
                    </Field>
                  )}
                />

                {/* Quantity — per_task only */}
                {watchedPaymentMethod === 'per_task' && (
                  <Controller
                    name="quantity"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Quantity (kg) <span className="text-red-500">*</span></FieldLabel>
                        <Input
                          {...field}
                          value={field.value == null || Number.isNaN(field.value) ? '' : field.value}
                          type="number" step="0.01" min="0.01"
                          placeholder="0.00"
                          onChange={(e) => {
                            const n = e.target.valueAsNumber;
                            field.onChange(Number.isNaN(n) ? undefined : n);
                          }}
                          aria-invalid={fieldState.invalid}
                          className="h-10"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                )}

                {/* Rate */}
                <Controller
                  name="rate"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Rate (TZS) <span className="text-red-500">*</span></FieldLabel>
                      <Input
                        {...field}
                        value={field.value == null || Number.isNaN(field.value) ? '' : field.value}
                        type="number" step="0.01" min="0.01"
                        placeholder="0.00"
                        onChange={(e) => {
                          const n = e.target.valueAsNumber;
                          field.onChange(Number.isNaN(n) ? undefined : n);
                        }}
                        aria-invalid={fieldState.invalid}
                        className="h-10"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              {/* Live total preview */}
              {liveTotal > 0 && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
                  <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <IndentIcon className="w-3.5 h-3.5" />Estimated Total
                  </span>
                  <span className="text-sm font-bold text-emerald-900">{formatTZS(liveTotal)}</span>
                </div>
              )}

              {/* Task notes */}
              <Controller
                name="task_notes"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Task Notes (optional)</FieldLabel>
                    <Input {...field} placeholder="Additional task notes…" className="h-10" />
                  </Field>
                )}
              />
            </fieldset>

            {/* Step 1 → 2 action */}
            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2 min-w-[160px]">
                Continue to Face Capture
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* STEP 2 — Face Capture                                           */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-4">
            {/* No-face warning */}
            {!hasFace && (
              <div className="flex items-start gap-2.5 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-900">No face registered for this worker</p>
                  <p className="text-yellow-700 text-xs mt-0.5">
                    Photo will be saved as a manual attendance record. Ask the supervisor to register
                    their face later to enable automatic verification.
                  </p>
                </div>
              </div>
            )}

            {/* Camera / preview area */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-black/5">
              {/* Preview — photo already taken */}
              {capturedFile && capturedPreview ? (
                <div className="relative">
                  <img
                    src={capturedPreview}
                    alt="Captured face photo"
                    crossOrigin="anonymous"
                    className="w-full rounded-lg object-cover max-h-72"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2 gap-1 shadow-md"
                    onClick={retakePhoto}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retake
                  </Button>
                </div>
              ) : isCameraActive ? (
                /* Live camera view */
                <div className="space-y-3 p-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg bg-black max-h-72 object-cover"
                  />
                  <div className="flex gap-3 justify-center pb-1">
                    <Button
                      type="button"
                      onClick={capturePhoto}
                      className="gap-2 px-6 min-h-[44px]"
                    >
                      <Camera className="w-5 h-5" />
                      Capture Photo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-[44px]"
                    >
                      Upload Instead
                    </Button>
                  </div>
                </div>
              ) : (
                /* Camera not yet started */
                <div className="text-center py-10 px-6 space-y-4">
                  <Camera className="w-14 h-14 text-gray-300 mx-auto" />
                  <div>
                    <p className="font-medium text-gray-700 text-sm">Capture worker&apos;s face</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Take a clear front-facing photo in good lighting
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button type="button" onClick={startCamera} className="gap-2 min-h-[44px]">
                      <Camera className="w-4 h-4" />
                      Open Camera
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-[44px]"
                    >
                      Upload Photo
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              aria-hidden="true"
            />

            {/* Photo guidelines */}
            {!capturedFile && (
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-gray-600 mb-1.5">Photo guidelines:</p>
                <ul className="text-xs text-gray-500 space-y-0.5 list-none m-0 p-0">
                  <li>• Clear, front-facing, single person in frame</li>
                  <li>• Good lighting — avoid shadows on face</li>
                  <li>• Remove hats, sunglasses, or face coverings</li>
                </ul>
              </div>
            )}

            {/* Step 2 actions */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => { stopCamera(); setStep(1); }}
                className="gap-1.5 min-h-[44px]"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              <Button
                type="button"
                onClick={onSubmit}
                disabled={submitting || !capturedFile}
                className="gap-2 min-w-[200px] min-h-[44px] bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Check-In &amp; Assign
                  </>
                )}
              </Button>
            </div>

            {/* Helper when no photo yet */}
            {!capturedFile && (
              <p className="text-xs text-center text-gray-400">
                Capture or upload a photo to enable the submit button
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
