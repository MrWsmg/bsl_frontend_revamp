"use client";

import { useState, useCallback, useEffect } from 'react';
import { Upload, RefreshCw, Filter, BarChart3, Users, ClipboardList, PenLine } from 'lucide-react';
import { WorkerAttendanceList } from '../../attendance/WorkerAttendanceList';
import { WorkerPhotoUploadModal } from '../../attendance/WorkerPhotoUploadModal';
import { AttendanceRecordsTable } from '../../attendance/AttendanceRecordsTable';
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
import { toast } from 'sonner';
import type { Worker } from '../../../types';
import type { AttendanceReportResponse } from '../../../types/farm-clerk';

const today = new Date().toISOString().split('T')[0];

export function SupervisorAttendanceSection() {
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
    status: 'present' as 'present' | 'absent' | 'late',
    check_in_time: '',
    notes: '',
  });
  const [savingManual, setSavingManual] = useState(false);

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

  const { data: workers, loading: loadingWorkers, refetch: refetchWorkers } = useApi(getWorkers);
  const { data: farms, loading: loadingFarms } = useApi(getFarms);
  const { data: attendanceRecords, loading: loadingAttendance, refetch: refetchAttendance } = useApi(getAttendance);

  // Auto-select first farm when farms load
  useEffect(() => {
    if (farms && farms.length === 1 && farms[0].id != null && !selectedFarmId) {
      setSelectedFarmId(String(farms[0].id));
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
      await apiService.attendance.createManualAttendance({
        worker_id: Number(manualForm.worker_id),
        farm_id: Number(selectedFarmId),
        date: manualForm.date,
        status: manualForm.status,
        check_in_time: manualForm.check_in_time
          ? `${manualForm.date}T${manualForm.check_in_time}:00`
          : undefined,
        notes: manualForm.notes || undefined,
      });
      toast.success('Manual attendance recorded.');
      setManualForm({ worker_id: '', date: today, status: 'present', check_in_time: '', notes: '' });
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

  const handlePhotoUploaded = () => {
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
            {(farms || []).filter((f: any) => f.id != null).map((farm: any) => (
              <SelectItem key={farm.id} value={String(farm.id)}>
                {farm.name}{farm.location ? ` — ${farm.location}` : ''}
              </SelectItem>
            ))}
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
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="workers" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Users className="w-4 h-4" /> Today
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <ClipboardList className="w-4 h-4" /> Records
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="w-4 h-4" /> Report
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <PenLine className="w-4 h-4" /> Manual
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
                  onActionComplete={refetchAttendance}
                  onUploadPhotoClick={handleUploadPhotoClick}
                />
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
                      { label: 'Present', value: report.present, color: 'text-green-600' },
                      { label: 'Absent', value: report.absent, color: 'text-red-600' },
                      { label: 'On Leave', value: report.on_leave, color: 'text-blue-600' },
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

                  {report.details && report.details.length > 0 && (
                    <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden list-none m-0 p-0">
                      {report.details.map((rec: any) => (
                        <li key={rec.id} className="flex items-center justify-between px-4 py-2.5 bg-white">
                          <span className="text-sm font-medium text-gray-900">{rec.worker_name}</span>
                          <Badge
                            className={
                              rec.status === 'present'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : rec.status === 'absent'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }
                          >
                            {rec.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
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
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm mb-1 block">Check-in Time (optional)</Label>
                    <Input
                      type="time"
                      value={manualForm.check_in_time}
                      onChange={(e) => setManualForm({ ...manualForm, check_in_time: e.target.value })}
                    />
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
      </Tabs>

      {/* Worker Photo Upload Modal */}
      <WorkerPhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => { setShowPhotoModal(false); setPhotoTargetWorker(null); }}
        workers={photoTargetWorker ? [photoTargetWorker, ...(workers || []).filter((w: Worker) => w.id !== photoTargetWorker.id)] : (workers || [])}
        onPhotoUploaded={handlePhotoUploaded}
      />
    </section>
  );
}
