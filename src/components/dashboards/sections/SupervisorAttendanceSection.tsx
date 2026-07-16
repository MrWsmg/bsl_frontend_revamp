"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Upload, RefreshCw, Filter, BarChart3, ClipboardList, PenLine, LogOut,
  Clock, AlertTriangle, Check, X, Eye, ClipboardCheck, ChevronDown,
} from 'lucide-react';
import { CheckinAndAssignModal } from '../../attendance/CheckinAndAssignModal';
import { WorkerPhotoUploadModal } from '../../attendance/WorkerPhotoUploadModal';
import { AttendanceRecordsTable } from '../../attendance/AttendanceRecordsTable';
import { FaceVerificationCapture } from '../../attendance/FaceVerificationCapture';
import { AttendancePhotoViewer } from '../../attendance/AttendancePhotoViewer';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Pagination, usePagination } from '../../common/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Worker } from '../../../types';
import type { AttendanceReportResponse } from '../../../types/farm-clerk';

// ── Accordion section header ────────────────────────────────────────────────

interface AccordionHeaderProps {
  id: string;
  icon: React.ElementType;
  title: string;
  badge?: number;
  open: boolean;
  onToggle: (id: string) => void;
  variant?: 'blue' | 'slate' | 'purple' | 'amber';
}

function AccordionHeader({
  id, icon: Icon, title, badge, open, onToggle, variant = 'slate',
}: AccordionHeaderProps) {
  const colors = {
    blue:   { on: 'bg-blue-600   text-white border-blue-600',   off: 'bg-white text-gray-900 border-gray-200 hover:bg-blue-50'   },
    slate:  { on: 'bg-slate-700  text-white border-slate-700',  off: 'bg-white text-gray-900 border-gray-200 hover:bg-slate-50'  },
    purple: { on: 'bg-purple-600 text-white border-purple-600', off: 'bg-white text-gray-900 border-gray-200 hover:bg-purple-50' },
    amber:  { on: 'bg-amber-600  text-white border-amber-600',  off: 'bg-white text-gray-900 border-gray-200 hover:bg-amber-50'  },
  };
  const cls = open ? colors[variant].on : colors[variant].off;
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      aria-expanded={open}
      className={`flex items-center justify-between w-full min-h-[52px] px-4 py-3
                  rounded-xl border font-semibold text-sm transition-colors duration-150
                  select-none ${cls}`}
    >
      <span className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 shrink-0" />
        {title}
        {badge != null && badge > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold leading-none rounded-full px-1.5 py-0.5">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <ChevronDown
        className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      />
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function SupervisorAttendanceSection() {
  const _d = new Date();
  const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;

  // Accordion open/close — Section A open by default (morning primary task)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['checkin']));
  const toggleSection = (id: string) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Farm selection — drives all sub-sections
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');

  // Photo upload modal
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoTargetWorker, setPhotoTargetWorker] = useState<Worker | null>(null);

  // Records filters
  const [filters, setFilters] = useState({ start_date: today, end_date: today, status: '' });

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

  // Face-verification checkout dialog
  const [checkoutRecord, setCheckoutRecord] = useState<any | null>(null);
  const [checkoutWorker, setCheckoutWorker] = useState<Worker | null>(null);
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  const [checkoutVerification, setCheckoutVerification] = useState<{
    status: 'verified' | 'failed' | null;
    confidence?: number;
    message?: string;
  }>({ status: null });

  // Check In & Assign modal
  const [checkinAssignWorker, setCheckinAssignWorker] = useState<Worker | null>(null);

  // Pending review
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  // Photo lightbox / viewer
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; label: string } | null>(null);
  const [photoViewerRecord, setPhotoViewerRecord] = useState<any | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const getWorkers   = useCallback(() => apiService.getSupervisorWorkers(), []);
  const getFarms     = useCallback(() => apiService.getFarms('supervisor'), []);
  const getTaskCodes = useCallback(() => apiService.getTaskCodes(), []);

  const getAttendance = useCallback(() => {
    const params: Record<string, any> = {};
    if (selectedFarmId) params.farm_id = Number(selectedFarmId);
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date)   params.end_date   = filters.end_date;
    if (filters.status)     params.status     = filters.status;
    return apiService.attendance.getSupervisorAttendance(params);
  }, [selectedFarmId, filters]);

  const getTodayRecords = useCallback(() => {
    const d = new Date();
    const ts = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const params: Record<string, any> = { start_date: ts, end_date: ts };
    if (selectedFarmId) params.farm_id = Number(selectedFarmId);
    return apiService.attendance.getSupervisorAttendance(params);
  }, [selectedFarmId]);

  const getPendingReview = useCallback(
    () => apiService.attendance.getPendingReview(selectedFarmId ? Number(selectedFarmId) : undefined),
    [selectedFarmId],
  );

  const { data: workers,           loading: loadingWorkers,    refetch: refetchWorkers, setData: setWorkers } = useApi(getWorkers);
  const { data: farms,             loading: loadingFarms                                                     } = useApi(getFarms);
  const { data: attendanceRecords, loading: loadingAttendance, refetch: refetchAttendance                    } = useApi(getAttendance);
  const { data: todayRecordsRaw,   loading: loadingToday,      refetch: refetchToday                        } = useApi(getTodayRecords);
  const { data: pendingReviewRaw,  loading: loadingPending,    refetch: refetchPending                       } = useApi(getPendingReview);
  const { data: taskCodesRaw                                                                                  } = useApi(getTaskCodes);
  const taskCodes = useMemo(() => (Array.isArray(taskCodesRaw) ? taskCodesRaw : []), [taskCodesRaw]);

  const {
    paginatedItems: pagedRows,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    totalPages, totalItems,
  } = usePagination<any>((attendanceRecords as any[]) || [], 25);

  const pendingReviews: any[] = Array.isArray(pendingReviewRaw) ? pendingReviewRaw : [];
  const todayRecords:   any[] = Array.isArray(todayRecordsRaw)  ? todayRecordsRaw  : [];
  const stillCheckedIn  = todayRecords.filter((r: any) => r.check_in_time && !r.check_out_time);
  const alreadyCheckedOut = todayRecords.filter((r: any) => r.check_in_time && r.check_out_time);

  // ── Checkout helpers ───────────────────────────────────────────────────────

  const openCheckoutDialog = (record: any) => {
    setCheckoutRecord(record);
    setCheckoutWorker((workers || []).find((w: Worker) => w.id === record.worker_id) ?? null);
    setCheckoutVerification({ status: null });
  };

  const closeCheckoutDialog = () => {
    setCheckoutRecord(null);
    setCheckoutWorker(null);
    setCheckoutVerification({ status: null });
  };

  const handleFaceCheckout = async (file: File) => {
    if (!checkoutRecord || !checkoutWorker) return;
    setCheckoutProcessing(true);
    setCheckoutVerification({ status: null });
    try {
      const result = await apiService.attendance.checkOutWithFaceVerification({
        worker_id: checkoutWorker.id,
        farm_id:   Number(selectedFarmId),
        file,
      });
      const verified = result.face_verification_status === 'verified';
      setCheckoutVerification({ status: verified ? 'verified' : 'failed', confidence: result.confidence, message: result.message });
      const workerName = checkoutWorker.full_name || checkoutWorker.name;
      if (verified) {
        toast.success(`${workerName} checked out${result.hours_worked != null ? ` — ${result.hours_worked.toFixed(1)}h worked` : ''}.`);
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
      await apiService.attendance.manualCheckOut({ worker_id: checkoutRecord.worker_id, attendance_id: checkoutRecord.id });
      toast.success(`${checkoutWorker?.full_name || checkoutWorker?.name || checkoutRecord.worker_name || `Worker #${checkoutRecord.worker_id}`} checked out.`);
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

  // ── Side effects ───────────────────────────────────────────────────────────

  // Auto-select the only farm
  useEffect(() => {
    if (farms && farms.length === 1 && !selectedFarmId) {
      const id = (farms[0] as any).id ?? (farms[0] as any).farm_id;
      if (id != null) setSelectedFarmId(String(id));
    }
  }, [farms, selectedFarmId]);

  // ── Derived data ───────────────────────────────────────────────────────────

  const farmWorkers = (workers || []).filter((w: Worker) => {
    if (!selectedFarmId) return false;
    if (!(w as any).farm_assignments) return true;
    try {
      const a = JSON.parse((w as any).farm_assignments as string);
      return Array.isArray(a) && a.includes(Number(selectedFarmId));
    } catch { return true; }
  });

  const checkedInWorkerIds = useMemo(
    () => new Set(todayRecords.map((r: any) => r.worker_id)),
    [todayRecords],
  );
  const notYetCheckedIn = farmWorkers.filter((w: Worker) => !checkedInWorkerIds.has(w.id));

  // ── Report ─────────────────────────────────────────────────────────────────

  const loadReport = useCallback(async () => {
    if (!selectedFarmId) return;
    setLoadingReport(true);
    try {
      setReport(await apiService.attendance.getAttendanceReport(Number(selectedFarmId), reportDate));
    } catch {
      toast.error('Failed to load attendance report.');
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  }, [selectedFarmId, reportDate]);

  // ── Manual submit ──────────────────────────────────────────────────────────

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId || !manualForm.worker_id) { toast.error('Select a farm and worker.'); return; }
    setSavingManual(true);
    try {
      await apiService.attendance.manualCheckIn({
        worker_id:      Number(manualForm.worker_id),
        farm_id:        Number(selectedFarmId),
        date:           manualForm.date,
        check_in_time:  manualForm.check_in_time  ? `${manualForm.date}T${manualForm.check_in_time}:00`  : undefined,
        check_out_time: manualForm.check_out_time ? `${manualForm.date}T${manualForm.check_out_time}:00` : undefined,
        status:         manualForm.status,
        notes:          manualForm.notes || undefined,
      });
      toast.success('Manual attendance recorded.');
      setManualForm({ worker_id: '', date: today, status: 'present', check_in_time: '', check_out_time: '', notes: '' });
      refetchAttendance();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to record attendance.');
    } finally {
      setSavingManual(false);
    }
  };

  // ── Photo helpers ──────────────────────────────────────────────────────────

  const handleUploadPhotoClick = (worker: Worker) => { setPhotoTargetWorker(worker); setShowPhotoModal(true); };

  const handlePhotoUploaded = (workerId: number) => {
    if (workers) {
      setWorkers((workers as Worker[]).map((w) =>
        w.id === workerId ? { ...w, face_id: (w as any).face_id || 'registered' } : w,
      ));
    }
    refetchWorkers();
    setPhotoTargetWorker(null);
  };

  // ── Loading guard ──────────────────────────────────────────────────────────

  if (loadingWorkers || loadingFarms) {
    return (
      <section className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </section>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <hgroup>
          <h2 className="text-xl font-bold text-gray-900">Attendance Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Check in workers · Assign tasks · Face verification
          </p>
        </hgroup>
        <Button
          onClick={() => { setPhotoTargetWorker(null); setShowPhotoModal(true); }}
          className="bg-purple-600 hover:bg-purple-700 min-h-[44px]"
        >
          <Upload className="w-4 h-4 mr-2" />
          Register Faces
        </Button>
      </header>

      {/* ── Farm selector — always visible ─────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <Label className="text-sm font-semibold text-blue-900 whitespace-nowrap shrink-0">Farm</Label>
        <Select value={selectedFarmId || undefined} onValueChange={setSelectedFarmId}>
          <SelectTrigger className="bg-white sm:max-w-xs">
            <SelectValue placeholder="Choose a farm…" />
          </SelectTrigger>
          <SelectContent>
            {(farms || []).filter((f: any) => (f.id ?? f.farm_id) != null).map((farm: any) => {
              const fid = farm.id ?? farm.farm_id;
              return (
                <SelectItem key={fid} value={String(fid)}>
                  {farm.name}{farm.location ? ` — ${farm.location}` : ''}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {selectedFarmId && (
          <span className="text-xs text-blue-700 shrink-0">
            {farmWorkers.length} worker{farmWorkers.length !== 1 ? 's' : ''}
            {notYetCheckedIn.length > 0
              ? <span className="ml-1 text-orange-600 font-semibold">· {notYetCheckedIn.length} not yet in</span>
              : <span className="ml-1 text-green-700"> · all checked in ✓</span>}
          </span>
        )}
      </div>

      {/* ── Accordion sections ─────────────────────────────────────────────── */}
      <div className="space-y-3">

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* A · CHECK IN & ASSIGN TASKS                                */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <AccordionHeader
            id="checkin"
            icon={ClipboardCheck}
            title={`Check In & Assign Tasks${notYetCheckedIn.length > 0 ? `  ·  ${notYetCheckedIn.length} waiting` : ''}`}
            open={openSections.has('checkin')}
            onToggle={toggleSection}
            variant="blue"
          />
          {openSections.has('checkin') && (
            <div className="bg-white border-t p-4 space-y-5">
              {!selectedFarmId ? (
                <p className="text-sm text-gray-500 text-center py-10">Select a farm above to begin.</p>
              ) : loadingToday ? (
                <div className="flex justify-center py-10"><LoadingSpinner /></div>
              ) : (
                <>
                  {/* ── Not Yet Checked In ── */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                        <h3 className="font-semibold text-sm text-gray-900">
                          Not Yet Checked In ({notYetCheckedIn.length})
                        </h3>
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => refetchToday()}
                        disabled={loadingToday}
                        className="h-7 px-2 text-xs gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingToday ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                    {notYetCheckedIn.length === 0 ? (
                      <p className="text-sm text-green-700 text-center py-5 border-2 border-dashed border-green-200 rounded-lg bg-green-50">
                        All workers are checked in ✓
                      </p>
                    ) : (
                      <ul className="space-y-2 list-none m-0 p-0">
                        {notYetCheckedIn.map((worker: Worker) => (
                          <li
                            key={worker.id}
                            className="flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {(worker as any).full_name || worker.name || `Worker #${worker.id}`}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                ID #{worker.id}
                                {(worker as any).face_id
                                  ? <span className="ml-2 text-green-600">· Face ✓</span>
                                  : <span className="ml-2 text-amber-600">· No face enrolled</span>}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => setCheckinAssignWorker(worker)}
                              className="bg-blue-600 hover:bg-blue-700 text-white min-h-[40px] shrink-0 text-xs"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />
                              Check In &amp; Assign
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* ── On-site (needs check-out) ── */}
                  {stillCheckedIn.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                        <h3 className="font-semibold text-sm text-gray-900">
                          On-site ({stillCheckedIn.length})
                        </h3>
                      </div>
                      <ul className="space-y-2 list-none m-0 p-0">
                        {stillCheckedIn.map((rec: any) => (
                          <li
                            key={rec.id}
                            className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{rec.worker_name || `Worker #${rec.worker_id}`}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                In: {new Date(rec.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <Button
                              size="sm" variant="outline"
                              className="border-orange-400 text-orange-700 hover:bg-orange-50 min-h-[40px] shrink-0 text-xs"
                              onClick={() => openCheckoutDialog(rec)}
                            >
                              <LogOut className="w-3.5 h-3.5 mr-1.5" />
                              Check Out
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ── Checked Out summary ── */}
                  {alreadyCheckedOut.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-400 shrink-0" />
                        <h3 className="font-semibold text-sm text-gray-900">
                          Checked Out Today ({alreadyCheckedOut.length})
                        </h3>
                      </div>
                      <ul className="space-y-1.5 list-none m-0 p-0">
                        {alreadyCheckedOut.map((rec: any) => (
                          <li
                            key={rec.id}
                            className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                          >
                            <p className="text-sm text-gray-600 truncate">
                              {rec.worker_name || `Worker #${rec.worker_id}`}
                            </p>
                            <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(rec.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {' → '}
                              {new Date(rec.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* B · ATTENDANCE RECORDS                                      */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <AccordionHeader
            id="records"
            icon={ClipboardList}
            title="Attendance Records"
            open={openSections.has('records')}
            onToggle={toggleSection}
            variant="slate"
          />
          {openSections.has('records') && (
            <div className="bg-white border-t p-4 space-y-4">
              {/* Filters */}
              <fieldset className="bg-muted/50 rounded-lg p-4">
                <legend className="flex items-center gap-2 mb-3 font-medium text-gray-900 text-sm">
                  <Filter className="w-3.5 h-3.5 text-gray-600" /> Filters
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs mb-1 block">Start Date</Label>
                    <Input type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} className="h-9" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">End Date</Label>
                    <Input type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} className="h-9" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Status</Label>
                    <Select
                      value={filters.status || undefined}
                      onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? '' : v })}
                    >
                      <SelectTrigger className="h-9"><SelectValue placeholder="All Statuses" /></SelectTrigger>
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

              <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => refetchAttendance()} disabled={loadingAttendance} className="gap-1.5">
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAttendance ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {loadingAttendance ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              ) : (
                <>
                  <AttendanceRecordsTable records={pagedRows} showVerificationDetails={true} />
                  {totalItems > 0 && (
                    <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems}
                      itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* C · DAILY REPORT                                            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <AccordionHeader
            id="report"
            icon={BarChart3}
            title="Daily Attendance Report"
            open={openSections.has('report')}
            onToggle={toggleSection}
            variant="purple"
          />
          {openSections.has('report') && (
            <div className="bg-white border-t p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 max-w-xs">
                  <Label className="text-xs mb-1 block">Report Date</Label>
                  <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="h-9" />
                </div>
                <Button onClick={loadReport} disabled={!selectedFarmId || loadingReport} className="min-h-[40px]">
                  {loadingReport ? <LoadingSpinner size="sm" /> : 'Generate Report'}
                </Button>
              </div>
              {!selectedFarmId && (
                <p className="text-sm text-gray-500 text-center py-4">Select a farm above first.</p>
              )}
              {report && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Total',   value: report.total_workers,  color: 'text-gray-700'  },
                      { label: 'Present', value: report.present_count,  color: 'text-green-600' },
                      { label: 'Absent',  value: report.absent_count,   color: 'text-red-600'   },
                      { label: 'Late',    value: report.late_count,     color: 'text-blue-600'  },
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
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* D · MANUAL ENTRY & PENDING REVIEW                          */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <AccordionHeader
            id="manual"
            icon={PenLine}
            title="Manual Entry & Review"
            badge={pendingReviews.length}
            open={openSections.has('manual')}
            onToggle={toggleSection}
            variant="amber"
          />
          {openSections.has('manual') && (
            <div className="bg-white border-t p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Manual check-in form */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                    <PenLine className="w-3.5 h-3.5 text-amber-600" />
                    Manual Check-in
                  </h4>
                  {!selectedFarmId ? (
                    <p className="text-sm text-gray-500">Select a farm above first.</p>
                  ) : (
                    <form onSubmit={handleManualSubmit} className="space-y-3">
                      <div>
                        <Label className="text-xs mb-1 block">Worker <span className="text-red-500">*</span></Label>
                        <Select value={manualForm.worker_id || undefined} onValueChange={(v) => setManualForm({ ...manualForm, worker_id: v })}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Select worker…" /></SelectTrigger>
                          <SelectContent>
                            {farmWorkers.map((w: Worker) => (
                              <SelectItem key={w.id} value={String(w.id)}>
                                {(w as any).full_name || w.name} (ID {w.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs mb-1 block">Date <span className="text-red-500">*</span></Label>
                          <Input type="date" value={manualForm.date} onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })} className="h-9" />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Status <span className="text-red-500">*</span></Label>
                          <Select value={manualForm.status} onValueChange={(v) => setManualForm({ ...manualForm, status: v as any })}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                              <SelectItem value="half_day">Half Day</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs mb-1 block">Check-in Time</Label>
                          <Input type="time" value={manualForm.check_in_time} onChange={(e) => setManualForm({ ...manualForm, check_in_time: e.target.value })} className="h-9" />
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Check-out Time</Label>
                          <Input type="time" value={manualForm.check_out_time} onChange={(e) => setManualForm({ ...manualForm, check_out_time: e.target.value })} className="h-9" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Notes (optional)</Label>
                        <Input type="text" placeholder="e.g. Manual entry" value={manualForm.notes} onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })} className="h-9" />
                      </div>
                      <Button type="submit" disabled={savingManual} className="w-full min-h-[44px]">
                        {savingManual ? 'Saving…' : 'Record Attendance'}
                      </Button>
                    </form>
                  )}
                </div>

                {/* Pending review */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                    Pending Review
                    {pendingReviews.length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                        {pendingReviews.length}
                      </span>
                    )}
                  </h4>
                  {loadingPending ? (
                    <div className="flex items-center justify-center py-6">
                      <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : pendingReviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-gray-200 rounded-lg">
                      No records pending review.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      {pendingReviews.map((record: any) => {
                        const workerName =
                          record.worker_name ||
                          (workers || []).find((w: Worker) => w.id === record.worker_id)?.name ||
                          `Worker #${record.worker_id}`;
                        return (
                          <div key={record.id} className="p-3 border rounded-lg bg-yellow-50 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                              <div className="space-y-0.5 text-sm">
                                <p className="font-semibold">{workerName}</p>
                                <p className="text-muted-foreground text-xs">
                                  {record.date} &bull;{' '}
                                  {record.check_in_time
                                    ? `In: ${new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                    : 'No check-in time'}
                                </p>
                                <p className="text-xs">
                                  <span className={record.face_verification_status === 'failed' ? 'text-red-600 font-medium' : 'text-yellow-700 font-medium'}>
                                    {record.face_verification_status === 'failed' ? 'Face mismatch' : 'Manual — no face scan'}
                                  </span>
                                  {record.face_verification_confidence != null && ` (${record.face_verification_confidence.toFixed(1)}%)`}
                                </p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => handleReview(record.id, true)}
                                  disabled={reviewingId === record.id}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors min-h-[36px]"
                                >
                                  <Check className="w-3 h-3" />Approve
                                </button>
                                <button
                                  onClick={() => handleReview(record.id, false)}
                                  disabled={reviewingId === record.id}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors min-h-[36px]"
                                >
                                  <X className="w-3 h-3" />Reject
                                </button>
                              </div>
                            </div>
                            <div className="pt-1 border-t border-yellow-200">
                              <button
                                onClick={() => setPhotoViewerRecord(record)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                {(record.verification_photo_url || record.checkout_photo_url)
                                  ? 'View / replace photos'
                                  : 'Add verification photo'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

      </div>{/* /accordion */}

      {/* ── Modals & dialogs ───────────────────────────────────────────────── */}

      {/* Check In & Assign */}
      {checkinAssignWorker && (
        <CheckinAndAssignModal
          isOpen={!!checkinAssignWorker}
          onClose={() => setCheckinAssignWorker(null)}
          worker={checkinAssignWorker}
          farms={farms || []}
          taskCodes={taskCodes}
          onSuccess={(result) => {
            const name = result.worker_name || (checkinAssignWorker as any)?.full_name || checkinAssignWorker?.name;
            const faceMsg =
              result.face_verification_status === 'verified'
                ? ` ✓ Face verified (${result.confidence.toFixed(0)}%)`
                : result.face_verification_status === 'failed'
                ? ' ⚠ Face mismatch — pending review'
                : '';
            toast.success(`${name} checked in & assigned ${result.task_code}.${faceMsg}`);
            setCheckinAssignWorker(null);
            refetchToday();
            refetchAttendance();
          }}
        />
      )}

      {/* Attendance Photo Viewer */}
      <AttendancePhotoViewer
        record={photoViewerRecord}
        isOpen={!!photoViewerRecord}
        onClose={() => setPhotoViewerRecord(null)}
        onPhotoUpdated={() => { refetchPending(); refetchAttendance(); }}
      />

      {/* Verification Photo Lightbox */}
      <Dialog open={!!lightboxPhoto} onOpenChange={(open) => !open && setLightboxPhoto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {lightboxPhoto?.label ?? 'Verification Photo'}
            </DialogTitle>
          </DialogHeader>
          {lightboxPhoto && (
            <figure className="m-0 text-center">
              <img src={lightboxPhoto.url} alt={lightboxPhoto.label} crossOrigin="anonymous"
                   className="max-w-full max-h-[70vh] rounded-lg mx-auto object-contain" />
              <figcaption className="text-xs text-muted-foreground mt-2">{lightboxPhoto.label}</figcaption>
            </figure>
          )}
        </DialogContent>
      </Dialog>

      {/* Worker Photo Upload Modal */}
      <WorkerPhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => { setShowPhotoModal(false); setPhotoTargetWorker(null); }}
        workers={photoTargetWorker
          ? [photoTargetWorker, ...(workers || []).filter((w: Worker) => w.id !== photoTargetWorker.id)]
          : (workers || [])}
        onPhotoUploaded={handlePhotoUploaded}
      />

      {/* Face-verification Check-Out Dialog */}
      <Dialog open={!!checkoutRecord} onOpenChange={(open) => !open && closeCheckoutDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Check Out — {(checkoutWorker as any)?.full_name || checkoutWorker?.name || checkoutRecord?.worker_name || `Worker #${checkoutRecord?.worker_id}`}
            </DialogTitle>
          </DialogHeader>
          {checkoutRecord && (
            <div className="space-y-3">
              {checkoutWorker ? (
                <FaceVerificationCapture
                  worker={checkoutWorker}
                  onCapture={handleFaceCheckout}
                  onCancel={closeCheckoutDialog}
                  isProcessing={checkoutProcessing}
                  verificationResult={checkoutVerification}
                />
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Worker details not loaded — use manual check-out below.</p>
              )}
              <div className="border-t pt-3">
                <Button
                  variant="ghost" size="sm"
                  onClick={handleManualCheckout}
                  disabled={checkoutProcessing || checkingOutId === checkoutRecord?.worker_id}
                  className="w-full text-gray-500 text-xs"
                >
                  {checkingOutId === checkoutRecord?.worker_id
                    ? <LoadingSpinner size="sm" />
                    : 'Skip camera — record as manual check-out'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </section>
  );
}
