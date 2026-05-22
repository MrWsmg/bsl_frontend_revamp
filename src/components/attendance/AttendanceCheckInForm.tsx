"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserCheck, Users, Camera, AlertCircle, MapPin } from 'lucide-react';
import { Worker, Farm } from '../../types';
import apiService from '../../services/api';
import { toast } from 'sonner';
import { FaceVerificationCapture } from './FaceVerificationCapture';
import { attendanceCheckInSchema, type AttendanceCheckInFormData } from '@/lib/schemas';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';

interface AttendanceCheckInFormProps {
  workers: Worker[];
  farms: Farm[];
  onCheckInSuccess?: () => void;
}

export function AttendanceCheckInForm({
  workers,
  farms,
  onCheckInSuccess
}: AttendanceCheckInFormProps) {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'verified' | 'failed' | null;
    confidence?: number;
    message?: string;
  }>({ status: null });

  const [checkInGps, setCheckInGps] = useState<{
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    status: 'idle' | 'acquiring' | 'ok' | 'error';
    errorMsg?: string;
  }>({ latitude: null, longitude: null, accuracy: null, status: 'idle' });
  const gpsWatchRef = useRef<number | null>(null);

  const startGps = useCallback(() => {
    if (!navigator.geolocation) {
      setCheckInGps({ latitude: null, longitude: null, accuracy: null, status: 'error', errorMsg: 'GPS not supported' });
      return;
    }
    setCheckInGps({ latitude: null, longitude: null, accuracy: null, status: 'acquiring' });
    const id = navigator.geolocation.watchPosition(
      (pos) => setCheckInGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy, status: 'ok' }),
      (err) => setCheckInGps({ latitude: null, longitude: null, accuracy: null, status: 'error', errorMsg: err.message }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
    gpsWatchRef.current = id;
  }, []);

  const stopGps = useCallback(() => {
    if (gpsWatchRef.current != null) {
      navigator.geolocation?.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }
    setCheckInGps({ latitude: null, longitude: null, accuracy: null, status: 'idle' });
  }, []);

  useEffect(() => () => { stopGps(); }, [stopGps]);

  const form = useForm<AttendanceCheckInFormData>({
    resolver: zodResolver(attendanceCheckInSchema),
    defaultValues: {
      farm_id: '',
      worker_id: '',
    },
  });

  const watchedFarmId = form.watch('farm_id');

  // Auto-select farm if only one
  useEffect(() => {
    if (farms.length === 1 && farms[0].id != null) {
      form.setValue('farm_id', String(farms[0].id));
    }
  }, [farms, form]);

  // Filter workers
  const filteredWorkers = workers.filter((worker) => {
    const query = searchQuery.toLowerCase();
    return (
      worker.name?.toLowerCase().includes(query) ||
      worker.full_name?.toLowerCase().includes(query) ||
      worker.id.toString().includes(searchQuery)
    );
  });

  // Handle worker selection
  const handleWorkerSelect = (worker: Worker) => {
    setSelectedWorker(worker);
    form.setValue('worker_id', worker.id.toString());
    setSearchQuery('');
    setShowCamera(false);
    setVerificationResult({ status: null });
    startGps();
  };

  // Handle photo capture
  const handlePhotoCapture = async (file: File) => {
    if (!selectedWorker || !watchedFarmId) {
      toast.error('Please select worker and farm');
      return;
    }

    setIsProcessing(true);
    setVerificationResult({ status: null });

    try {
      const result = await apiService.attendance.checkInWithFaceVerification({
        worker_id: selectedWorker.id,
        farm_id: parseInt(watchedFarmId),
        file,
        status: 'present',
        latitude: checkInGps.latitude ?? undefined,
        longitude: checkInGps.longitude ?? undefined,
        gps_accuracy: checkInGps.accuracy ?? undefined,
      });

      if (result.success) {
        if (result.face_verification_status === 'verified') {
          setVerificationResult({
            status: 'verified',
            confidence: result.confidence,
            message: result.message
          });
          toast.success(`Check-in successful! ${result.worker_name} verified.`);
        } else if (result.face_verification_status === 'failed') {
          setVerificationResult({
            status: 'failed',
            message: result.message
          });
          toast.warning('Face verification failed. Recorded as manual check-in.');
        } else {
          // Manual check-in
          toast.success(`Check-in successful! Recorded manually.`);
        }

        // Reset form after success
        setTimeout(() => {
          stopGps();
          setSelectedWorker(null);
          form.reset();
          setShowCamera(false);
          setVerificationResult({ status: null });
          onCheckInSuccess?.();
        }, 2000);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Check-in failed';

      toast.error(errorMessage);
      setVerificationResult({
        status: 'failed',
        message: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle manual check-in
  const handleManualCheckIn = async () => {
    if (!selectedWorker || !watchedFarmId) {
      toast.error('Please select worker and farm');
      return;
    }

    try {
      setIsProcessing(true);
      await apiService.attendance.manualCheckIn({
        worker_id: selectedWorker.id,
        farm_id: parseInt(watchedFarmId),
        status: 'present'
      });

      toast.success('Manual check-in successful!');
      stopGps();
      setSelectedWorker(null);
      form.reset();
      setShowCamera(false);
      onCheckInSuccess?.();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Manual check-in failed';

      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearWorker = () => {
    stopGps();
    setSelectedWorker(null);
    form.setValue('worker_id', '');
    setShowCamera(false);
    setVerificationResult({ status: null });
  };

  return (
    <article className="bg-white rounded-lg shadow-md p-6">
      <header className="flex items-center gap-3 mb-6">
        <figure className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center m-0">
          <UserCheck className="w-6 h-6 text-white" />
        </figure>
        <hgroup>
          <h2 className="text-xl font-semibold text-gray-900">Attendance Check-In</h2>
          <p className="text-sm text-gray-600">Record worker attendance with face verification</p>
        </hgroup>
      </header>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* Farm Selection */}
        <Controller
          name="farm_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Select Farm</FieldLabel>
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Choose a farm..." />
                </SelectTrigger>
                <SelectContent>
                  {farms.filter(farm => farm.id != null).map((farm) => (
                    <SelectItem key={farm.id} value={String(farm.id)}>
                      {farm.name} - {farm.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Worker Selection */}
        {!selectedWorker ? (
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">Select Worker</legend>
            <search className="relative">
              <Input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Users className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </search>

            {searchQuery && (
              <ul className="mt-2 border border-gray-300 rounded-lg max-h-64 overflow-y-auto list-none m-0 p-0">
                {filteredWorkers.length === 0 ? (
                  <li className="p-4 text-center text-gray-500 text-sm">
                    No workers found
                  </li>
                ) : (
                  filteredWorkers.map((worker) => (
                    <li key={worker.id}>
                      <button
                        type="button"
                        onClick={() => handleWorkerSelect(worker)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b last:border-b-0 text-left"
                      >
                        <figure
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold m-0 ${
                            worker.face_id ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        >
                          {worker.name?.charAt(0) || 'W'}
                        </figure>
                        <span className="flex-1">
                          <strong className="block font-medium text-gray-900">
                            {worker.full_name || worker.name}
                          </strong>
                          <small className="text-xs text-gray-500">
                            ID: {worker.id} • {worker.worker_type}
                            {worker.face_id ? ' • Face Registered' : ' • No Face Registered'}
                          </small>
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
            {form.formState.errors.worker_id && !searchQuery && (
              <output className="block text-sm text-red-500 mt-1">{form.formState.errors.worker_id.message}</output>
            )}
          </fieldset>
        ) : (
          <>
            {/* Selected Worker Card */}
            <article className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <header className="flex items-center justify-between mb-4">
                <figure className="flex items-center gap-3 m-0">
                  <span className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedWorker.name?.charAt(0) || 'W'}
                  </span>
                  <figcaption>
                    <h3 className="font-semibold text-gray-900">
                      {selectedWorker.full_name || selectedWorker.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      ID: {selectedWorker.id} • {selectedWorker.worker_type}
                    </p>
                  </figcaption>
                </figure>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearWorker}
                  disabled={isProcessing}
                >
                  Change
                </Button>
              </header>

              {!selectedWorker.face_id && (
                <aside className="bg-yellow-50 border border-yellow-200 rounded p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <section className="text-sm text-yellow-800">
                    <strong className="font-medium block">No face registered for this worker</strong>
                    <small className="text-xs mt-1 block">
                      Check-in will be recorded as manual. Upload a worker photo to enable face verification.
                    </small>
                  </section>
                </aside>
              )}
            </article>

            {/* GPS status strip */}
            {checkInGps.status !== 'idle' && (
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                checkInGps.status === 'ok'
                  ? checkInGps.accuracy! <= 50 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  : checkInGps.status === 'error' ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {checkInGps.status === 'acquiring' && 'Acquiring GPS location…'}
                {checkInGps.status === 'ok' && (
                  checkInGps.accuracy! <= 20 ? `GPS: ±${checkInGps.accuracy!.toFixed(0)}m (excellent)`
                  : checkInGps.accuracy! <= 50 ? `GPS: ±${checkInGps.accuracy!.toFixed(0)}m (good)`
                  : `GPS: ±${checkInGps.accuracy!.toFixed(0)}m (weak signal)`
                )}
                {checkInGps.status === 'error' && `GPS unavailable — ${checkInGps.errorMsg || 'check permissions'}`}
              </div>
            )}

            {/* Face Verification or Manual Check-in */}
            {!showCamera ? (
              <menu className="space-y-3 list-none m-0 p-0">
                {watchedFarmId && (
                  <>
                    <li>
                      <Button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        disabled={!watchedFarmId}
                        className="w-full gap-2"
                        size="lg"
                      >
                        <Camera className="w-6 h-6" />
                        Start Face Verification
                      </Button>
                    </li>
                    <li>
                      <Button
                        type="button"
                        onClick={handleManualCheckIn}
                        disabled={isProcessing}
                        variant="secondary"
                        className="w-full"
                      >
                        Manual Check-In (No Photo)
                      </Button>
                    </li>
                  </>
                )}
              </menu>
            ) : (
              <FaceVerificationCapture
                worker={selectedWorker}
                onCapture={handlePhotoCapture}
                onCancel={() => setShowCamera(false)}
                isProcessing={isProcessing}
                verificationResult={verificationResult}
              />
            )}
          </>
        )}
      </form>
    </article>
  );
}
