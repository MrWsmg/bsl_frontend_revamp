"use client";

/**
 * AttendancePhotoViewer
 * ---------------------
 * Shows the check-in and check-out verification photos for an attendance record
 * using the same upload-card pattern as PhotoCaptureModal.
 *
 * Each card:
 *  - Displays the existing stored photo (resolves S3 presigned URLs)
 *  - Lets the supervisor capture / pick a replacement photo
 *  - Uploads it to PATCH /supervisor/attendance/{id}/update-photos
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Camera, UploadCloud, Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { resolvePhotoUrl } from '@/hooks/usePresignedUrl';
import apiService from '@/services/api';

interface AttendanceRecord {
  id: number;
  worker_id?: number | null;
  worker_name?: string | null;
  date: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  face_verification_status?: string;
  face_verification_confidence?: number | null;
  checkout_face_verification_status?: string;
  checkout_face_verification_confidence?: number | null;
  verification_photo_url?: string | null;
  checkout_photo_url?: string | null;
}

interface AttendancePhotoViewerProps {
  record: AttendanceRecord | null;
  workerName?: string;
  isOpen: boolean;
  onClose: () => void;
  onPhotoUpdated?: () => void;
}

type PhotoSlot = 'checkin' | 'checkout';

interface SlotState {
  resolvedUrl: string | null;
  loading: boolean;
  selectedFile: File | null;
  previewUrl: string | null;
  uploading: boolean;
}

const emptySlot = (): SlotState => ({
  resolvedUrl: null,
  loading: false,
  selectedFile: null,
  previewUrl: null,
  uploading: false,
});

export function AttendancePhotoViewer({
  record,
  workerName,
  isOpen,
  onClose,
  onPhotoUpdated,
}: AttendancePhotoViewerProps) {
  const [slots, setSlots] = useState<Record<PhotoSlot, SlotState>>({
    checkin: emptySlot(),
    checkout: emptySlot(),
  });

  const previewUrlsRef = useRef<Set<string>>(new Set());
  const fileInputRefs = useRef<Partial<Record<PhotoSlot, HTMLInputElement | null>>>({});

  // ── helpers ─────────────────────────────────────────────────────────────────

  const updateSlot = useCallback((slot: PhotoSlot, patch: Partial<SlotState>) => {
    setSlots((prev) => ({ ...prev, [slot]: { ...prev[slot], ...patch } }));
  }, []);

  const makePreviewUrl = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    previewUrlsRef.current.add(url);
    return url;
  }, []);

  const revokePreview = useCallback((url?: string | null) => {
    if (url) {
      URL.revokeObjectURL(url);
      previewUrlsRef.current.delete(url);
    }
  }, []);

  const cleanupPreviews = useCallback(() => {
    previewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    previewUrlsRef.current.clear();
  }, []);

  // ── load + resolve existing photos ──────────────────────────────────────────

  useEffect(() => {
    if (!isOpen || !record) {
      setSlots({ checkin: emptySlot(), checkout: emptySlot() });
      cleanupPreviews();
      return;
    }

    const resolve = async (slot: PhotoSlot, rawUrl: string | null | undefined) => {
      if (!rawUrl) return;
      updateSlot(slot, { loading: true });
      const resolved = await resolvePhotoUrl(rawUrl);
      updateSlot(slot, { resolvedUrl: resolved, loading: false });
    };

    resolve('checkin', record.verification_photo_url);
    resolve('checkout', record.checkout_photo_url);
  }, [isOpen, record, updateSlot, cleanupPreviews]);

  useEffect(() => () => cleanupPreviews(), [cleanupPreviews]);

  // ── file selection ───────────────────────────────────────────────────────────

  const handleFileChange = useCallback(
    (slot: PhotoSlot, file: File | null) => {
      setSlots((prev) => {
        revokePreview(prev[slot].previewUrl);
        return {
          ...prev,
          [slot]: {
            ...prev[slot],
            selectedFile: file,
            previewUrl: file ? makePreviewUrl(file) : null,
          },
        };
      });
    },
    [makePreviewUrl, revokePreview]
  );

  // ── upload ───────────────────────────────────────────────────────────────────

  const handleUpload = useCallback(
    async (slot: PhotoSlot) => {
      const file = slots[slot].selectedFile;
      if (!file || !record) return;

      updateSlot(slot, { uploading: true });
      try {
        const photos =
          slot === 'checkin'
            ? { verification_photo: file }
            : { checkout_photo: file };

        await apiService.attendance.updateAttendancePhotos(record.id, photos);

        toast.success(
          slot === 'checkin'
            ? 'Check-in photo updated'
            : 'Check-out photo updated'
        );

        // Resolve the new preview as the stored URL
        const newUrl = URL.createObjectURL(file);
        updateSlot(slot, {
          resolvedUrl: newUrl,
          selectedFile: null,
          previewUrl: null,
          uploading: false,
        });

        onPhotoUpdated?.();
      } catch (err: any) {
        toast.error(
          err?.response?.data?.detail ||
          err?.message ||
          'Failed to upload photo'
        );
        updateSlot(slot, { uploading: false });
      }
    },
    [slots, record, updateSlot, onPhotoUpdated]
  );

  // ── render one card ──────────────────────────────────────────────────────────

  const renderCard = (
    slot: PhotoSlot,
    title: string,
    status?: string,
    confidence?: number | null
  ) => {
    const s = slots[slot];
    const displayUrl = s.previewUrl ?? s.resolvedUrl;
    const hasOriginal = !!(slot === 'checkin'
      ? record?.verification_photo_url
      : record?.checkout_photo_url);

    const statusColor =
      status === 'verified'
        ? 'text-green-600'
        : status === 'failed'
        ? 'text-red-600'
        : 'text-yellow-600';

    const statusLabel =
      status === 'verified'
        ? `Verified${confidence != null ? ` (${confidence.toFixed(1)}%)` : ''}`
        : status === 'failed'
        ? `Failed${confidence != null ? ` (${confidence.toFixed(1)}%)` : ''}`
        : 'Manual / Not scanned';

    return (
      <div className="border rounded-lg p-4 bg-gray-50 flex flex-col space-y-3">
        {/* Card header */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
          {s.loading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        </div>

        {/* Face status pill */}
        <p className={`text-xs font-medium ${statusColor}`}>
          {statusLabel}
        </p>

        {/* Photo area — same 48-height box as PhotoCaptureModal */}
        <div className="rounded-md border border-dashed border-gray-300 bg-white flex items-center justify-center h-48 overflow-hidden">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={title}
              crossOrigin="anonymous"
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="text-center text-gray-400 text-sm flex flex-col items-center gap-1">
              {hasOriginal ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mb-1" />
                  <span>Loading…</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-8 h-8 mb-1 text-gray-300" />
                  <span>No photo captured</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={(node) => { fileInputRefs.current[slot] = node; }}
          onChange={(e) => {
            handleFileChange(slot, e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />

        {/* Actions — same row layout as PhotoCaptureModal */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRefs.current[slot]?.click()}
          >
            <Camera className="w-4 h-4 mr-2" />
            {hasOriginal ? 'Replace photo' : 'Capture photo'}
          </Button>

          {s.selectedFile && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleFileChange(slot, null)}
            >
              Clear
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={() => handleUpload(slot)}
            disabled={s.uploading || !s.selectedFile}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {s.uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 mr-2" />
                Save photo
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-400">
          Tap &quot;{hasOriginal ? 'Replace photo' : 'Capture photo'}&quot; to use your device camera or pick from gallery.
        </p>
      </div>
    );
  };

  // ── modal ────────────────────────────────────────────────────────────────────

  if (!record) return null;

  const displayName =
    workerName ||
    record.worker_name ||
    `Worker #${record.worker_id}`;

  const checkInTime = record.check_in_time
    ? new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;
  const checkOutTime = record.check_out_time
    ? new Date(record.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Attendance Photos — {displayName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {record.date}
            {checkInTime && ` · In: ${checkInTime}`}
            {checkOutTime && ` · Out: ${checkOutTime}`}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {renderCard(
            'checkin',
            'Check-in verification photo',
            record.face_verification_status,
            record.face_verification_confidence
          )}
          {renderCard(
            'checkout',
            'Check-out verification photo',
            record.checkout_face_verification_status,
            record.checkout_face_verification_confidence
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
