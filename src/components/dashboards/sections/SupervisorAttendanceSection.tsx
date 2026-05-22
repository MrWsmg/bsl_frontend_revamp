"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, RefreshCw, Filter, BarChart3, Users, ClipboardList, PenLine, LogOut, Clock, AlertTriangle, Check, X, MapPin, MapPinOff, Navigation } from 'lucide-react';
import { WorkerAttendanceList } from '../../attendance/WorkerAttendanceList';
import { WorkerPhotoUploadModal } from '../../attendance/WorkerPhotoUploadModal';
import { AttendanceRecordsTable } from '../../attendance/AttendanceRecordsTable';
import { FaceVerificationCapture } from '../../attendance/FaceVerificationCapture';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Worker } from '../../../types';
import type { AttendanceReportResponse } from '../../../types/farm-clerk';

export function SupervisorAttendanceSection() {
  const _d = new Date();
  const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;
  // Farm selection — drives all sub-sections
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');

  // Photo upload modal
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoTargetWorker, setPhotoTargetWorker] = useState<Worker | null>(null);

  // Records filters
  const [filters, setFilters] = useState({
    start_date: today,
    end_date: today,
    status: '',
  });

  // Report state
  const [reportDate, setReportDate] = useState(today);
  const [report, setReport] = useState<AttendanceReportResponse | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Manual entry state
  const [manualForm, setManualForm] = useState({
    worker_id: '',
    date: today,
    status: 'present' as 'present' | 'absent' | 'late' | 'half_day',
    check_in_time: '',
    check_out_time: '',
    notes: '',
  });
  const [savingManual, setSavingManual] = useState(false);
  const [checkingOutId, setCheckingOutId] = useState<number | null>(null);

  // Face-verification checkout dialog state
  const [checkoutRecord, setCheckoutRecord] = useState<any | null>(null);
  const [checkoutWorker, setCheckoutWorker] = useState<Worker | null>(null);
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  const [checkoutVerification, setCheckoutVerification] = useState<{
    status: 'verified' | 'failed' | null;
    confidence?: number;
    message?: string;
  }>({ status: null });

  // Pending review state
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  // GPS for checkout dialog
  const [checkoutGps, setCheckoutGps] = useState<{ latitude: number | null; longitude: number | null; accuracy: number | null; status: 'idle' | 'acquiring' | 'ok' | 'error'; errorMsg?: string }>({ latitude: null, longitude: null, accuracy: null, status: 'idle' });
  const checkoutGpsWatchRef = useRef<number | null>(null);

  const startCheckoutGps = useCallback(() => {
    if (!navigator.geolocation) {
      setCheckoutGps({ latitude: null, longitude: null, accuracy: null, status: 'error', errorMsg: 'GPS not supported' });
      return;
    }
    setCheckoutGps({ latitude: null, longitude: null, accuracy: null, status: 'acquiring' });
    const id = navigator.geolocation.watchPosition(
      (pos) => setCheckoutGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy, status: 'ok' }),
      (err) => setCheckoutGps({ latitude: null, longitude: null, accuracy: null, status: 'error', errorMsg: err.message }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
    checkoutGpsWatchRef.current = id;
  }, []);

  const stopCheckoutGps = useCallback(() => {
    if (checkoutGpsWatchRef.current !== null) {
      navigator.geolocation?.clearWatch(checkoutGpsWatchRef.current);
      checkoutGpsWatchRef.current = null;
    }
    setCheckoutGps({ latitude: null, longitude: null, accuracy: null, status: 'idle' });
  }, []);

  // Data fetching
  const getWorkers = useCallback(() => apiService.getSupervisorWorkers(), []);
  const getFarms = useCallback(() => apiService.getFarms('supervisor'), []);
  const getAttendance = useCallback(() => {
    const params: Record<string, any> = {};
    if (selectedFarmId) params.farm_id = Number(selectedFarmId);
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (filters.status) params.status = filters.status;
    return apiService.attendance.getSupervisorAttendance(params);
  }, [selectedFarmId, filters]);

  const getTodayRecords = useCallback(() => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const params: Record<string, any> = { start_date: todayStr, end_date: todayStr };
    if (selectedFarmId) params.farm_id = Number(selectedFarmId);
    return apiService.attendance.getSupervisorAttendance(params);
  }, [selectedFarmId]);

  const getPendingReview = useCallback(
    () => apiService.attendance.getPendingReview(selectedFarmId ? Number(selectedFarmId) : undefined),
    [selectedFarmId]
  );

  const { data: workers, loading: loadingWorkers, refetch: refetchWorkers, setData: setWorkers } = useApi(getWorkers);
  const { data: farms, loading: loadingFarms } = useApi(getFarms);
  const { data: attendanceRecords, loading: loadingAttendance, refetch: refetchAttendance } = useApi(getAttendance);
  const { data: todayRecordsRaw, loading: loadingToday, refetch: refetchToday } = useApi(getTodayRecords);
  const { data: pendingReviewRaw, loading: loadingPending, refetch: refetchPending } = useApi(getPendingReview);
  const pendingReviews: any[] = Array.isArray(pendingReviewRaw) ? pendingReviewRaw : [];

  const todayRecords: any[] = Array.isArray(todayRecordsRaw) ? todayRecordsRaw : [];
  const stillCheckedIn = todayRecords.filter((r: any) => r.check_in_time && !r.check_out_time);
  const alreadyCheckedOut = todayRecords.filter((r: any) => r.check_in_time && r.check_out_time);

  const openCheckoutDialog = (record: any) => {
    const worker = (workers || []).find((w: Worker) => w.id === record.worker_id) ?? null;
    setCheckoutRecord(record);
    setCheckoutWorker(worker);
    setCheckoutVerification({ status: null });
    startCheckoutGps();
  };

  const closeCheckoutDialog = () => {
    setCheckoutRecord(null);
    setCheckoutWorker(null);
    setCheckoutVerification({ status: null });
    stopCheckoutGps();
  };

  const handleFaceCheckout = async (file: File) => {
    if (!checkoutRecord || !checkoutWorker) return;
    if (checkoutGps.status !== 'ok' || checkoutGps.latitude == null) {
      toast.error('GPS not ready — wait for a location fix before capturing.');
      return;
    }
    if (checkoutGps.accuracy != null && checkoutGps.accuracy > 100) {
      toast.warning(`GPS accuracy is ±${checkoutGps.accuracy.toFixed(0)}m — checkout will be flagged for review.`);
    }
    setCheckoutProcessing(true);
    setCheckoutVerification({ status: null });
    try {
      const gpsFields = { latitude: checkoutGps.latitude, longitude: checkoutGps.longitude ?? undefined, gps_accuracy: checkoutGps.accuracy ?? undefined };
      const result = await apiService.attendance.checkOutWithFaceVerification({
        worker_id: checkoutWorker.id,
        farm_id: Number(selectedFarmId),
        file,
        ...gpsFields,
      });
      const verified = result.face_verification_status === 'verified';
      setCheckoutVerification({
        status: verified ? 'verified' : 'failed',
        confidence: result.confidence,
        message: result.message,
      });
      const workerName = checkoutWorker.full_name || checkoutWorker.name;
      if (verified) {
        toast.success(
          `${workerName} checked out${result.hours_worked != null ? ` — ${result.hours_worked.toFixed(1)}h worked` : ''}.`
        );
      } else {
        toast.warning(result.message || `${workerName} checked out manually — supervisor review required.`);
      }
      refetchToday();
      refetchAttendance();
      setTimeout(closeCheckoutDialog, 1800);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Check-out failed';
      toast.error(msg);
      setCheckoutVerification({ status: 'failed', message: msg });
      // Refresh even on error — the backend may have committed before the client timed out
      refetchToday();
      refetchAttendance();
    } finally {
      setCheckoutProcessing(false);
    }
  };

  const handleManualCheckout = async () => {
    if (!checkoutRecord) return;
    setCheckingOutId(checkoutRecord.worker_id);
    try {
      await apiService.attendance.manualCheckOut({
        worker_id: checkoutRecord.worker_id,
        attendance_id: checkoutRecord.id,
      });
      const name = checkoutWorker?.full_name || checkoutWorker?.name || checkoutRecord.worker_name || `Worker #${checkoutRecord.worker_id}`;
      toast.success(`${name} checked out.`);
      refetchToday();
      refetchAttendance();
      closeCheckoutDialog();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to check out worker.');
    } finally {
      setCheckingOutId(null);
    }
  };

  const handleReview = async (attendanceId: number, approved: boolean) => {
    setReviewingId(attendanceId);
    try {
      await apiService.attendance.reviewAttendance(attendanceId, approved);
      toast.success(approved ? 'Attendance approved — eligible for payroll.' : 'Attendance rejected.');
      refetchPending();
      refetchAttendance();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to review attendance record.');
    } finally {
      setReviewingId(null);
    }
  };

  // Auto-select first farm when farms load
  useEffect(() => {
    if (farms && farms.length === 1 && !selectedFarmId) {
      const farmId = (farms[0] as any).id ?? (farms[0] as any).farm_id;
      if (farmId != null) setSelectedFarmId(String(farmId));
    }
  }, [farms, selectedFarmId]);

  // Workers filtered to selected farm
  const farmWorkers = (workers || []).filter((worker: Worker) => {
    if (!selectedFarmId) return false;
    if (!worker.farm_assignments) return true; // include if no assignment data
    try {
      const assignments = JSON.parse(worker.farm_assignments as string);
      return Array.isArray(assignments) && assignments.includes(Number(selectedFarmId));
    } catch {
      return true;
    }
  });

  // Load report
  const loadReport = useCallback(async () => {
    if (!selectedFarmId) return;
    setLoadingReport(true);
    try {
      const data = await apiService.attendance.getAttendanceReport(Number(selectedFarmId), reportDate);
      setReport(data);
    } catch {
      toast.error('Failed to load attendance report.');
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  }, [selectedFarmId, reportDate]);

  // Handle manual entry submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId || !manualForm.worker_id) {
      toast.error('Select a farm and worker.');
      return;
    }
    setSavingManual(true);
    try {
      await apiService.attendance.manualCheckIn({
        worker_id: Number(manualForm.worker_id),
        farm_id: Number(selectedFarmId),
        date: manualForm.date,
        check_in_time: manualForm.check_in_time
          ? `${manualForm.date}T${manualForm.check_in_time}:00`
          : undefined,
        check_out_time: manualForm.check_out_time
          ? `${manualForm.date}T${manualForm.check_out_time}:00`
          : undefined,
        status: manualForm.status,
        notes: manualForm.notes || undefined,
      });
      toast.success('Manual attendance recorded.');
      setManualForm({ worker_id: '', date: today, status: 'present' as const, check_in_time: '', check_out_time: '', notes: '' });
      refetchAttendance();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to record attendance.');
    } finally {
      setSavingManual(false);
    }
  };

  const handleUploadPhotoClick = (worker: Worker) => {
    setPhotoTargetWorker(worker);
    setShowPhotoModal(true);
  };

  const handlePhotoUploaded = (workerId: number) => {
    // Optimistically mark the worker as face-registered so the UI
    // updates immediately, regardless of whether /workers returns face_id
    if (workers) {
      setWorkers(
        (workers as Worker[]).map((w) =>
          w.id === workerId ? { ...w, face_id: w.face_id || 'registered' } : w
        )
      );
    }
    refetchWorkers();
    setPhotoTargetWorker(null);
  };

  if (loadingWorkers || loadingFarms) {
    return (
      <section className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <hgroup>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Face verification · Check-in & Check-out · Records & Reports
          </p>
        </hgroup>
        <Button
          onClick={() => { setPhotoTargetWorker(null); setShowPhotoModal(true); }}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Upload className="w-4 h-4 mr-2" />
          Register Worker Faces
        </Button>
      </header>

      {/* Farm selector — drives everything */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <Label className="text-sm font-semibold text-blue-900 whitespace-nowrap">Select Farm</Label>
        <Select
          value={selectedFarmId || undefined}
          onValueChange={setSelectedFarmId}
        >
          <SelectTrigger className="bg-white max-w-xs">
            <SelectValue placeholder="Choose a farm…" />
          </SelectTrigger>
          <SelectContent>
            {(farms || []).filter((f: any) => (f.id ?? f.farm_id) != null).map((farm: any) => {
              const farmId = farm.id ?? farm.farm_id;
              return (
                <SelectItem key={farmId} value={String(farmId)}>
                  {farm.name}{farm.location ? ` — ${farm.location}` : ''}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {selectedFarmId && (
          <span className="text-xs text-blue-700">
            {farmWorkers.length} worker{farmWorkers.length !== 1 ? 's' : ''} on this farm
          </span>
        )}
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="workers">
        <TabsList className="flex w-full overflow-x-auto gap-0.5 h-auto p-1">
          <TabsTrigger value="workers" className="flex flex-col sm:flex-row items-center gap-1 text-[10px] sm:text-sm flex-1 min-w-[56px] py-2">
            <Users className="w-4 h-4 shrink-0" />
            <span>Today</span>
          </TabsTrigger>
          <TabsTrigger value="checkedinout" className="flex flex-col sm:flex-row items-center gap-1 text-[10px] sm:text-sm flex-1 min-w-[56px] py-2">
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Check In/Out</span>
            <span className="sm:hidden">In/Out</span>
          </TabsTrigger>
          <TabsTrigger value="records" className="flex flex-col sm:flex-row items-center gap-1 text-[10px] sm:text-sm flex-1 min-w-[56px] py-2">
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span>Records</span>
          </TabsTrigger>
          <TabsTrigger value="report" className="flex flex-col sm:flex-row items-center gap-1 text-[10px] sm:text-sm flex-1 min-w-[56px] py-2">
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Report</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex flex-col sm:flex-row items-center gap-1 text-[10px] sm:text-sm flex-1 min-w-[56px] py-2">
            <PenLine className="w-4 h-4 shrink-0" />
            <span>Manual</span>
          </TabsTrigger>
          <TabsTrigger value="review" className="flex flex-col sm:flex-row items-center gap-1 text-[10px] sm:text-sm flex-1 min-w-[56px] py-2 relative">
            <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-500" />
            <span>Review</span>
            {pendingReviews.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {pendingReviews.length > 9 ? '9+' : pendingReviews.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── TODAY tab: per-worker check-in/out ── */}
        <TabsContent value="workers">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Today&apos;s Worker Status</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedFarmId ? (
                <p className="text-sm text-gray-500 text-center py-8">Select a farm above to view workers.</p>
              ) : (
                <WorkerAttendanceList
                  farmId={Number(selectedFarmId)}
                  workers={farmWorkers}
                  onActionComplete={() => { refetchAttendance(); refetchToday(); }}
                  onUploadPhotoClick={handleUploadPhotoClick}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CHECKED IN / OUT tab ── */}
        <TabsContent value="checkedinout">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3">
              <div>
                <CardTitle className="text-base">Today&apos;s Check-In / Check-Out</CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
              </div>
              <Button variant="secondary" size="sm" onClick={() => refetchToday()} disabled={loadingToday}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingToday ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {!selectedFarmId ? (
                <p className="text-sm text-gray-500 text-center py-8">Select a farm above to view today&apos;s status.</p>
              ) : loadingToday ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Still checked in — needs check-out */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                      <h3 className="font-semibold text-sm text-gray-900">
                        On-site ({stillCheckedIn.length})
                      </h3>
                    </div>
                    {stillCheckedIn.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6 border rounded-lg">No workers currently checked in.</p>
                    ) : (
                      <ul className="space-y-2 list-none m-0 p-0">
                        {stillCheckedIn.map((rec: any) => (
                          <li key={rec.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{rec.worker_name || `Worker #${rec.worker_id}`}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                In: {new Date(rec.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-orange-400 text-orange-700 hover:bg-orange-50"
                              onClick={() => openCheckoutDialog(rec)}
                            >
                              <LogOut className="w-3.5 h-3.5 mr-1.5" />
                              Check Out
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Already checked out */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />
                      <h3 className="font-semibold text-sm text-gray-900">
                        Checked Out ({alreadyCheckedOut.length})
                      </h3>
                    </div>
                    {alreadyCheckedOut.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6 border rounded-lg">No workers have checked out yet.</p>
                    ) : (
                      <ul className="space-y-2 list-none m-0 p-0">
                        {alreadyCheckedOut.map((rec: any) => (
                          <li key={rec.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{rec.worker_name || `Worker #${rec.worker_id}`}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {new Date(rec.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' → '}
                                {new Date(rec.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <Badge className="bg-gray-100 text-gray-600 border-gray-300">Done</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RECORDS tab ── */}
        <TabsContent value="records">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Attendance Records</CardTitle>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => refetchAttendance()}
                disabled={loadingAttendance}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingAttendance ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Filters */}
              <fieldset className="bg-muted/50 rounded-lg p-4">
                <legend className="flex items-center gap-2 mb-4 font-medium text-gray-900">
                  <Filter className="w-4 h-4 text-gray-600" /> Filters
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm mb-1 block">Start Date</Label>
                    <Input
                      type="date"
                      value={filters.start_date}
                      onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-1 block">End Date</Label>
                    <Input
                      type="date"
                      value={filters.end_date}
                      onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-1 block">Status</Label>
                    <Select
                      value={filters.status || undefined}
                      onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? '' : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="leave">Leave</SelectItem>
                        <SelectItem value="sick">Sick</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </fieldset>

              {loadingAttendance ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <AttendanceRecordsTable
                  records={attendanceRecords || []}
                  showVerificationDetails={true}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── REPORT tab ── */}
        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 max-w-xs">
                  <Label className="text-sm mb-1 block">Report Date</Label>
                  <Input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                  />
                </div>
                <Button
                  onClick={loadReport}
                  disabled={!selectedFarmId || loadingReport}
                >
                  {loadingReport ? <LoadingSpinner size="sm" /> : 'Generate Report'}
                </Button>
              </div>

              {!selectedFarmId && (
                <p className="text-sm text-gray-500 text-center py-6">Select a farm above first.</p>
              )}

              {report && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Total', value: report.total_workers, color: 'text-gray-700' },
                      { label: 'Present', value: report.present_count, color: 'text-green-600' },
                      { label: 'Absent', value: report.absent_count, color: 'text-red-600' },
                      { label: 'Late', value: report.late_count, color: 'text-blue-600' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-gray-500 mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Attendance Rate</span>
                      <span className="font-semibold">{report.attendance_rate?.toFixed(1)}%</span>
                    </div>
                    <Progress value={report.attendance_rate} className="h-2" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── MANUAL ENTRY tab ── */}
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Manual Attendance Entry</CardTitle>
              <CardDescription>
                Record attendance without camera — backdated entries or no-camera fallback.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedFarmId ? (
                <p className="text-sm text-gray-500 text-center py-6">Select a farm above first.</p>
              ) : (
                <form onSubmit={handleManualSubmit} className="space-y-4 max-w-md">
                  <div>
                    <Label className="text-sm mb-1 block">Worker <span className="text-red-500">*</span></Label>
                    <Select
                      value={manualForm.worker_id || undefined}
                      onValueChange={(v) => setManualForm({ ...manualForm, worker_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select worker…" />
                      </SelectTrigger>
                      <SelectContent>
                        {farmWorkers.map((w: Worker) => (
                          <SelectItem key={w.id} value={String(w.id)}>
                            {w.full_name || w.name} (ID {w.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm mb-1 block">Date <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        value={manualForm.date}
                        onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">Status <span className="text-red-500">*</span></Label>
                      <Select
                        value={manualForm.status}
                        onValueChange={(v) => setManualForm({ ...manualForm, status: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                          <SelectItem value="half_day">Half Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm mb-1 block">Check-in Time (optional)</Label>
                      <Input
                        type="time"
                        value={manualForm.check_in_time}
                        onChange={(e) => setManualForm({ ...manualForm, check_in_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-sm mb-1 block">Check-out Time (optional)</Label>
                      <Input
                        type="time"
                        value={manualForm.check_out_time}
                        onChange={(e) => setManualForm({ ...manualForm, check_out_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm mb-1 block">Notes (optional)</Label>
                    <Input
                      type="text"
                      placeholder="e.g. Manual entry"
                      value={manualForm.notes}
                      onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                    />
                  </div>

                  <Button type="submit" disabled={savingManual} className="w-full">
                    {savingManual ? 'Saving…' : 'Record Attendance'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── REVIEW tab: supervisor approves manual check-ins ── */}
        <TabsContent value="review">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Pending Review
              </CardTitle>
              <CardDescription>
                Face verification failed on these check-ins. Approve or reject each record before payroll processes them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : pendingReviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No records pending review.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReviews.map((record: any) => {
                    const workerName =
                      (workers || []).find((w: Worker) => w.id === record.worker_id)?.name ||
                      `Worker #${record.worker_id}`;
                    return (
                      <div
                        key={record.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20"
                      >
                        <div className="space-y-0.5 text-sm">
                          <p className="font-medium">{workerName}</p>
                          <p className="text-muted-foreground">
                            {record.date} &bull; {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : '—'}
                          </p>
                          {record.notes && (
                            <p className="text-xs text-muted-foreground">{record.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleReview(record.id, true)}
                            disabled={reviewingId === record.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(record.id, false)}
                            disabled={reviewingId === record.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Worker Photo Upload Modal */}
      <WorkerPhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => { setShowPhotoModal(false); setPhotoTargetWorker(null); }}
        workers={photoTargetWorker ? [photoTargetWorker, ...(workers || []).filter((w: Worker) => w.id !== photoTargetWorker.id)] : (workers || [])}
        onPhotoUploaded={handlePhotoUploaded}
      />

      {/* Face-verification Check-Out Dialog */}
      <Dialog open={!!checkoutRecord} onOpenChange={(open) => !open && closeCheckoutDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Check Out — {checkoutWorker?.full_name || checkoutWorker?.name || checkoutRecord?.worker_name || `Worker #${checkoutRecord?.worker_id}`}
            </DialogTitle>
          </DialogHeader>

          {checkoutRecord && (
            <div className="space-y-3">
              {/* GPS status strip */}
              <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${
                checkoutGps.status === 'ok'
                  ? checkoutGps.accuracy != null && checkoutGps.accuracy <= 20 ? 'bg-green-50 text-green-800'
                    : checkoutGps.accuracy != null && checkoutGps.accuracy <= 50 ? 'bg-yellow-50 text-yellow-800'
                    : 'bg-orange-50 text-orange-800'
                  : checkoutGps.status === 'acquiring' ? 'bg-blue-50 text-blue-700'
                  : checkoutGps.status === 'error' ? 'bg-red-50 text-red-700'
                  : 'bg-gray-50 text-gray-500'
              }`}>
                {checkoutGps.status === 'acquiring' && <Navigation className="w-3.5 h-3.5 animate-pulse shrink-0" />}
                {checkoutGps.status === 'ok' && <MapPin className="w-3.5 h-3.5 shrink-0" />}
                {(checkoutGps.status === 'error' || checkoutGps.status === 'idle') && <MapPinOff className="w-3.5 h-3.5 shrink-0" />}
                <span>
                  {checkoutGps.status === 'acquiring' && 'Acquiring GPS location…'}
                  {checkoutGps.status === 'ok' && checkoutGps.accuracy != null && (
                    checkoutGps.accuracy <= 20 ? `GPS: ±${checkoutGps.accuracy.toFixed(0)}m (excellent)`
                    : checkoutGps.accuracy <= 50 ? `GPS: ±${checkoutGps.accuracy.toFixed(0)}m (good)`
                    : `GPS: ±${checkoutGps.accuracy.toFixed(0)}m (weak signal)`
                  )}
                  {checkoutGps.status === 'error' && `GPS unavailable — ${checkoutGps.errorMsg || 'check permissions'}`}
                  {checkoutGps.status === 'idle' && 'GPS not started'}
                </span>
              </div>

              {checkoutWorker ? (
                <FaceVerificationCapture
                  worker={checkoutWorker}
                  onCapture={handleFaceCheckout}
                  onCancel={closeCheckoutDialog}
                  isProcessing={checkoutProcessing}
                  verificationResult={checkoutVerification}
                />
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Worker details not loaded — use manual check-out below.
                </p>
              )}
              <div className="border-t pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualCheckout}
                  disabled={checkoutProcessing || checkingOutId === checkoutRecord?.worker_id}
                  className="w-full text-gray-500 text-xs"
                >
                  {checkingOutId === checkoutRecord?.worker_id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Skip camera — record as manual check-out'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
