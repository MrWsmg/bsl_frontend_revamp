"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, LogIn, LogOut, UserCheck, MapPin, MapPinOff, Navigation } from 'lucide-react';
import { Worker, AttendanceRecord } from '../../types';
import apiService from '../../services/api';
import { toast } from 'sonner';
import { FaceVerificationCapture } from './FaceVerificationCapture';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WorkerAttendanceListProps {
  farmId: number;
  workers: Worker[];
  onActionComplete: () => void;
  onUploadPhotoClick: (worker: Worker) => void;
}

type WorkerStatus = 'not_in' | 'checked_in' | 'checked_out';
type CaptureMode = 'checkin' | 'checkout';

interface WorkerWithStatus extends Worker {
  todayStatus: WorkerStatus;
  attendanceId?: number;
  checkInTime?: string;
  checkOutTime?: string;
  hoursWorked?: number;
}

interface GpsState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  status: 'idle' | 'acquiring' | 'ok' | 'error';
  errorMsg?: string;
}

export function WorkerAttendanceList({
  farmId,
  workers,
  onActionComplete,
  onUploadPhotoClick,
}: WorkerAttendanceListProps) {
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [loadingToday, setLoadingToday] = useState(false);
  const [activeWorker, setActiveWorker] = useState<WorkerWithStatus | null>(null);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('checkin');
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'verified' | 'failed' | null;
    confidence?: number;
    message?: string;
  }>({ status: null });

  // GPS state
  const [gps, setGps] = useState<GpsState>({ latitude: null, longitude: null, accuracy: null, status: 'idle' });
  const gpsWatchRef = useRef<number | null>(null);

  // Block selector
  const [blocks, setBlocks] = useState<any[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');

  const loadTodayAttendance = useCallback(async () => {
    setLoadingToday(true);
    try {
      const records = await apiService.attendance.getTodayAttendance(farmId);
      setTodayRecords(records || []);
    } catch {
      setTodayRecords([]);
    } finally {
      setLoadingToday(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadTodayAttendance();
  }, [loadTodayAttendance]);

  // Fetch blocks for this farm
  useEffect(() => {
    apiService.getBlocksForFarm(farmId)
      .then((b: any[]) => setBlocks(b || []))
      .catch(() => setBlocks([]));
  }, [farmId]);

  // Start GPS watch when dialog opens, stop when it closes
  const startGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGps({ latitude: null, longitude: null, accuracy: null, status: 'error', errorMsg: 'GPS not supported on this device' });
      return;
    }
    setGps({ latitude: null, longitude: null, accuracy: null, status: 'acquiring' });
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGps({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          status: 'ok',
        });
      },
      (err) => {
        setGps({ latitude: null, longitude: null, accuracy: null, status: 'error', errorMsg: err.message });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
    gpsWatchRef.current = id;
  }, []);

  const stopGps = useCallback(() => {
    if (gpsWatchRef.current !== null) {
      navigator.geolocation?.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }
    setGps({ latitude: null, longitude: null, accuracy: null, status: 'idle' });
  }, []);

  const workersWithStatus: WorkerWithStatus[] = workers.map((worker) => {
    const record = todayRecords.find((r) => r.worker_id === worker.id);
    let todayStatus: WorkerStatus = 'not_in';
    if (record?.check_in_time && record?.check_out_time) {
      todayStatus = 'checked_out';
    } else if (record?.check_in_time) {
      todayStatus = 'checked_in';
    }
    return {
      ...worker,
      todayStatus,
      attendanceId: record?.id,
      checkInTime: record?.check_in_time,
      checkOutTime: record?.check_out_time,
      hoursWorked: record?.hours_worked,
    };
  });

  const openCapture = (worker: WorkerWithStatus, mode: CaptureMode) => {
    setActiveWorker(worker);
    setCaptureMode(mode);
    setVerificationResult({ status: null });
    setSelectedBlockId('');
    startGps();
  };

  const closeCapture = () => {
    setActiveWorker(null);
    setVerificationResult({ status: null });
    setSelectedBlockId('');
    stopGps();
  };

  const handleManualAction = async () => {
    if (!activeWorker) return;
    setIsProcessing(true);
    try {
      const workerName = activeWorker.full_name || activeWorker.name;
      if (captureMode === 'checkin') {
        await apiService.attendance.manualCheckIn({
          worker_id: activeWorker.id,
          farm_id: farmId,
          status: 'present',
        });
        toast.success(`${workerName} manually checked in.`);
      } else {
        if (!activeWorker.attendanceId) {
          toast.error('Cannot check out — no attendance record found for today.');
          return;
        }
        await apiService.attendance.manualCheckOut({
          worker_id: activeWorker.id,
          attendance_id: activeWorker.attendanceId,
        });
        toast.success(`${workerName} manually checked out.`);
      }
      await loadTodayAttendance();
      onActionComplete();
      closeCapture();
    } catch (err: any) {
      toast.error(err?.message || `Manual ${captureMode} failed.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePhotoCapture = async (file: File) => {
    if (!activeWorker) return;
    setIsProcessing(true);
    setVerificationResult({ status: null });
    try {
      const workerName = activeWorker.full_name || activeWorker.name;
      const gpsFields = gps.status === 'ok' && gps.latitude != null
        ? { latitude: gps.latitude, longitude: gps.longitude ?? undefined, gps_accuracy: gps.accuracy ?? undefined }
        : {};

      if (captureMode === 'checkin') {
        const result = await apiService.attendance.checkInWithFaceVerification({
          worker_id: activeWorker.id,
          farm_id: farmId,
          block_id: selectedBlockId ? Number(selectedBlockId) : undefined,
          file,
          status: 'present',
          ...gpsFields,
        });
        if (result.success) {
          const verified = result.face_verification_status === 'verified';
          setVerificationResult({
            status: verified ? 'verified' : 'failed',
            confidence: result.confidence,
            message: result.message,
          });
          if (verified) {
            toast.success(`${workerName} checked in — ${result.confidence?.toFixed(1)}% confidence.`);
          } else {
            toast.warning(`${workerName} checked in as manual (face not matched).`);
          }
        } else {
          setVerificationResult({ status: 'failed', message: result.message });
          toast.warning(result.message || `${workerName} checked in manually — face not matched.`);
        }
      } else {
        const result = await apiService.attendance.checkOutWithFaceVerification({
          worker_id: activeWorker.id,
          farm_id: farmId,
          file,
          ...gpsFields,
        });
        if (result.success) {
          const verified = result.face_verification_status === 'verified';
          setVerificationResult({
            status: verified ? 'verified' : 'failed',
            confidence: result.confidence,
            message: result.message,
          });
          toast.success(
            `${workerName} checked out${result.hours_worked != null ? ` — ${result.hours_worked.toFixed(1)}h worked` : ''}.`
          );
        } else {
          setVerificationResult({ status: 'failed', message: result.message });
          toast.warning(result.message || `${workerName} checked out manually — face not matched.`);
        }
      }

      await loadTodayAttendance();
      onActionComplete();
      setTimeout(closeCapture, 1800);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        `${captureMode} failed`;
      toast.error(msg);
      setVerificationResult({ status: 'failed', message: msg });

      // Backend returns 400 when worker has no face_id
      if (err?.response?.status === 400 && !activeWorker.face_id) {
        toast.info('Upload a worker photo first to enable face verification.');
      }
      // Refresh even on error — backend may have committed before the client got the error
      await loadTodayAttendance();
      onActionComplete();
    } finally {
      setIsProcessing(false);
    }
  };

  if (loadingToday) {
    return (
      <div className="flex items-center justify-center py-10 gap-2 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading today&apos;s attendance…</span>
      </div>
    );
  }

  // Summary counts
  const checkedIn = workersWithStatus.filter((w) => w.todayStatus === 'checked_in').length;
  const checkedOut = workersWithStatus.filter((w) => w.todayStatus === 'checked_out').length;
  const notIn = workersWithStatus.filter((w) => w.todayStatus === 'not_in').length;

  return (
    <>
      {/* Summary bar */}
      {workersWithStatus.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4 text-sm">
          <span className="flex items-center gap-1 text-green-700 font-medium">
            <UserCheck className="w-4 h-4" /> {checkedIn} checked in
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <CheckCircle2 className="w-4 h-4" /> {checkedOut} checked out
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <LogIn className="w-4 h-4" /> {notIn} not yet in
          </span>
        </div>
      )}

      <ul className="divide-y divide-gray-100 list-none m-0 p-0 border border-gray-200 rounded-lg overflow-hidden">
        {workersWithStatus.length === 0 ? (
          <li className="py-10 text-center text-sm text-gray-500">
            No workers found for this farm.
          </li>
        ) : (
          workersWithStatus.map((worker) => (
            <li key={worker.id} className="flex items-center justify-between py-3 px-4 gap-4 bg-white hover:bg-gray-50">
              {/* Worker identity */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                    worker.face_id ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                  title={worker.face_id ? 'Face registered' : 'No face registered'}
                >
                  {(worker.full_name || worker.name)?.charAt(0) || 'W'}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {worker.full_name || worker.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    ID {worker.id}
                    {worker.checkInTime && (
                      <> · In {new Date(worker.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                    )}
                    {worker.checkOutTime && (
                      <> · Out {new Date(worker.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                    )}
                    {worker.hoursWorked != null && <> · {worker.hoursWorked.toFixed(1)}h</>}
                  </p>
                </div>
              </div>

              {/* Status + actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {worker.todayStatus === 'checked_out' && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                  </Badge>
                )}

                {worker.todayStatus === 'checked_in' && (
                  <>
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                      <UserCheck className="w-3 h-3 mr-1" /> In
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openCapture(worker, 'checkout')}
                      className="text-xs h-7"
                    >
                      <LogOut className="w-3 h-3 mr-1" /> Check Out
                    </Button>
                  </>
                )}

                {worker.todayStatus === 'not_in' && (
                  <>
                    {!worker.face_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onUploadPhotoClick(worker)}
                        className="text-xs h-7 text-yellow-700 hover:text-yellow-900 hover:bg-yellow-50"
                      >
                        <Upload className="w-3 h-3 mr-1" /> Upload Photo
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => openCapture(worker, 'checkin')}
                      className="text-xs h-7"
                    >
                      <Camera className="w-3 h-3 mr-1" /> Check In
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))
        )}
      </ul>

      {/* Capture dialog */}
      <Dialog open={!!activeWorker} onOpenChange={(open) => !open && closeCapture()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {captureMode === 'checkin' ? 'Check In' : 'Check Out'} —{' '}
              {activeWorker?.full_name || activeWorker?.name}
            </DialogTitle>
          </DialogHeader>

          {activeWorker && (
            <div className="space-y-3">
              {/* GPS status strip */}
              <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${
                gps.status === 'ok'
                  ? gps.accuracy != null && gps.accuracy <= 20
                    ? 'bg-green-50 text-green-800'
                    : gps.accuracy != null && gps.accuracy <= 50
                      ? 'bg-yellow-50 text-yellow-800'
                      : 'bg-orange-50 text-orange-800'
                  : gps.status === 'acquiring'
                    ? 'bg-blue-50 text-blue-700'
                    : gps.status === 'error'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-gray-50 text-gray-500'
              }`}>
                {gps.status === 'acquiring' && <Navigation className="w-3.5 h-3.5 animate-pulse shrink-0" />}
                {gps.status === 'ok' && <MapPin className="w-3.5 h-3.5 shrink-0" />}
                {(gps.status === 'error' || gps.status === 'idle') && <MapPinOff className="w-3.5 h-3.5 shrink-0" />}
                <span>
                  {gps.status === 'acquiring' && 'Acquiring GPS location…'}
                  {gps.status === 'ok' && gps.accuracy != null && (
                    gps.accuracy <= 20 ? `GPS: ±${gps.accuracy.toFixed(0)}m (excellent)`
                    : gps.accuracy <= 50 ? `GPS: ±${gps.accuracy.toFixed(0)}m (good)`
                    : `GPS: ±${gps.accuracy.toFixed(0)}m (weak signal)`
                  )}
                  {gps.status === 'error' && `GPS unavailable — ${gps.errorMsg || 'check permissions'}`}
                  {gps.status === 'idle' && 'GPS not started'}
                </span>
              </div>

              {/* Block selector (check-in only) */}
              {captureMode === 'checkin' && blocks.length > 0 && (
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-1 block">
                    Block <span className="text-gray-400 font-normal">(optional)</span>
                  </Label>
                  <Select
                    value={selectedBlockId || undefined}
                    onValueChange={setSelectedBlockId}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select block…" />
                    </SelectTrigger>
                    <SelectContent>
                      {blocks.map((b: any) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}{b.code ? ` (${b.code})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <FaceVerificationCapture
                worker={activeWorker}
                onCapture={handlePhotoCapture}
                onCancel={closeCapture}
                isProcessing={isProcessing}
                verificationResult={verificationResult}
              />
              <div className="border-t pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualAction}
                  disabled={isProcessing}
                  className="w-full text-gray-500 text-xs"
                >
                  Skip camera — record as manual {captureMode === 'checkin' ? 'check-in' : 'check-out'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
