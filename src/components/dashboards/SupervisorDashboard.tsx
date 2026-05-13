"use client";

// Supervisor Dashboard component
import React, { useState, useCallback, useMemo } from 'react';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Pagination } from '../common/Pagination';
import { User } from '../../types';
import { BarChart3, Users, ClipboardList, TrendingUp, Calendar, CheckCircle, Clock, AlertCircle, Package, UserCheck, LayoutDashboard, FileText, Wallet, Scale, Search, Leaf, Building2 } from 'lucide-react';
import { useApi } from '../../hooks';
import apiService from '../../services/api';
import AddWorkerModal from '../shared/AddWorkerModal';
import { SupervisorTasksSection, SupervisorAttendanceSection } from './sections';
import PickingDashboard from './PickingDashboard';
import { SupervisorPayrollSection } from './sections/SupervisorPayrollSection';
import { SupervisorPayrollPendingSection } from './sections/SupervisorPayrollPendingSection';
import {
  SupervisorSimrSection,
  SharedGinSection,
  SharedTransportVoucherSection,
  SharedDeliveryNoteSection,
  SharedCardexSection,
  SharedCalendarSection,
  SharedBudgetManagerSection,
  SharedBudgetSummarySection,
  SharedBudgetTrackingSection,
  FieldApplicationSection,
} from './sections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Grouped navigation items with accordions
const SUPERVISOR_NAV_ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
  },
  {
    id: 'team',
    label: 'Team',
    icon: Users,
    children: [
      { id: 'attendance', label: 'Attendance', icon: UserCheck },
      { id: 'workers', label: 'Workers', icon: Users },
    ],
  },
  {
    id: 'work',
    label: 'Work',
    icon: ClipboardList,
    children: [
      { id: 'tasks',           label: 'Tasks',    icon: ClipboardList },
      { id: 'payroll_pending', label: 'Pending',  icon: Clock         },
      { id: 'payroll',         label: 'Rejected', icon: AlertCircle   },
    ],
  },
  {
    id: 'procurement',
    label: 'Item Requests',
    icon: Package,
    children: [
      { id: 'proc-simr',   label: 'SIMR',      icon: ClipboardList },
      { id: 'proc-gin',    label: 'GIN',        icon: Package },
      { id: 'proc-tv',     label: 'Transport',  icon: Calendar },
      { id: 'proc-dn',     label: 'Delivery',   icon: CheckCircle },
      { id: 'proc-cardex', label: 'CARDEX',     icon: TrendingUp },
    ],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
  },
  {
    id: 'budgets',
    label: 'Budgets',
    icon: Wallet,
    children: [
      { id: 'budget-manager',  label: 'Budget View',    icon: Wallet     },
      { id: 'budget-summary',  label: 'Summary Tree',   icon: BarChart3  },
      { id: 'budget-tracking', label: 'Live Tracking',  icon: TrendingUp },
    ],
  },
  {
    id: 'picking',
    label: 'Picking Operations',
    icon: Scale,
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
  },
  {
    id: 'field-applications',
    label: 'Field Applications',
    icon: Leaf,
  },
];

// ── Overview helper components ──────────────────────────────────────────────

interface OverviewStatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const OverviewStatCard: React.FC<OverviewStatCardProps> = ({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
  <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`${iconBg} p-2.5 rounded-lg shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const OverviewSectionHeader: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => (
  <div className="mb-3">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
  </div>
);

// ──────────────────────────────────────────────────────────────────────────────

interface SupervisorDashboardProps {
  user: User;
  onLogout: () => void;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(['overview']));
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [workerToEdit, setWorkerToEdit] = useState<any>(null);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMountedTabs(prev => new Set(prev).add(tabId));
  };

  // Pagination state for Workers table
  const [workersPage, setWorkersPage] = useState(1);
  const [workersPerPage, setWorkersPerPage] = useState(10);
  const [workerSearch, setWorkerSearch] = useState('');

  // Pagination state for Work History table
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(10);

  // Fetch data
  const todayDate = new Date().toISOString().split('T')[0];
  const getDailyTotals = useCallback(() => apiService.getSupervisorDailyTotals(todayDate), []);
  const getWorkHistory = useCallback(
    () => apiService.getSupervisorWorkHistory(dateRange.startDate, dateRange.endDate),
    [dateRange.startDate, dateRange.endDate]
  );
  const getItemRequests = useCallback(() => apiService.getSimrRequests(), []);
  const getWorkers = useCallback(() => apiService.getWorkers(), []);
  const getFarms = useCallback(() => apiService.getFarms('supervisor'), []);
  const getTaskAssignments = useCallback(() => apiService.getManagerTaskAssignments(), []);

  const { data: dailyTotals, loading: loadingDailyTotals, error: dailyTotalsError } = useApi(getDailyTotals);
  const { data: workHistory, loading: loadingWorkHistory, refetch: refetchWorkHistory } = useApi(getWorkHistory);
  const { data: itemRequests, loading: loadingItemRequests } = useApi(getItemRequests);
  const { data: workers, loading: loadingWorkers, refetch: refetchWorkers } = useApi(getWorkers);
  const { data: farms } = useApi(getFarms);
  const { data: taskAssignments, loading: loadingTasks } = useApi(getTaskAssignments);

  const handleWorkerAdded = () => {
    refetchWorkers();
    setShowAddWorkerModal(false);
    setWorkerToEdit(null);
  };

  const handleEditWorker = (worker: any) => {
    setWorkerToEdit(worker);
    setShowAddWorkerModal(true);
  };

  const handleCloseWorkerModal = () => {
    setShowAddWorkerModal(false);
    setWorkerToEdit(null);
  };

  const handleReactivateWorker = async (worker: any) => {
    try {
      await apiService.workers.reactivateWorker(worker.id);
      toast.success(`${worker.full_name || worker.name} reactivated`);
      refetchWorkers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reactivate worker');
    }
  };

  // Pagination calculations for Workers
  const filteredWorkers = useMemo(() => {
    if (!workers) return [];
    const q = workerSearch.trim().toLowerCase();
    if (!q) return workers;
    return workers.filter((w: any) =>
      (w.full_name || w.name || '').toLowerCase().includes(q) ||
      (w.phone || '').toLowerCase().includes(q)
    );
  }, [workers, workerSearch]);

  const paginatedWorkers = useMemo(() => {
    const startIndex = (workersPage - 1) * workersPerPage;
    return filteredWorkers.slice(startIndex, startIndex + workersPerPage);
  }, [filteredWorkers, workersPage, workersPerPage]);

  const workersTotalPages = useMemo(() => {
    return Math.ceil(filteredWorkers.length / workersPerPage);
  }, [filteredWorkers, workersPerPage]);

  // Pagination calculations for Work History
  const paginatedHistory = useMemo(() => {
    if (!workHistory) return [];
    const historyArray = Array.isArray(workHistory) ? workHistory : (workHistory.data || []);
    const startIndex = (historyPage - 1) * historyPerPage;
    const endIndex = startIndex + historyPerPage;
    return historyArray.slice(startIndex, endIndex);
  }, [workHistory, historyPage, historyPerPage]);

  const historyTotalPages = useMemo(() => {
    if (!workHistory) return 0;
    const historyArray = Array.isArray(workHistory) ? workHistory : (workHistory.data || []);
    return Math.ceil(historyArray.length / historyPerPage);
  }, [workHistory, historyPerPage]);

  // Reset pagination when data or search changes
  React.useEffect(() => {
    setWorkersPage(1);
  }, [workers?.length, workerSearch]);

  React.useEffect(() => {
    setHistoryPage(1);
  }, [workHistory?.length]);

  // Calculate values
  const activeWorkers = workers?.filter((w: any) => w.is_active).length || 0;
  const today = new Date().toDateString();
  const todayTasks = taskAssignments?.filter((task: any) =>
    new Date(task.date_worked).toDateString() === today ||
    new Date(task.assigned_at).toDateString() === today ||
    new Date(task.started_at).toDateString() === today ||
    new Date(task.completed_at).toDateString() === today
  ).length || 0;
  const todayItemRequests = itemRequests?.filter((request: any) =>
    new Date(request.created_at).toDateString() === today
  ).length || 0;
  const todayActivities = todayTasks + todayItemRequests;
  const itemRequestStats = itemRequests ? {
    total: itemRequests.length,
    pending: itemRequests.filter((r: any) => r.status === 'pending').length,
    approved: itemRequests.filter((r: any) => r.status === 'approved').length,
    issued: itemRequests.filter((r: any) => r.status === 'issued').length,
    received: itemRequests.filter((r: any) => r.status === 'received').length,
  } : { total: 0, pending: 0, approved: 0, issued: 0, received: 0 };

  // Render overview content
  const renderOverview = () => {
    if (loadingDailyTotals) {
      return (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    const completedCount = dailyTotals?.completed_count || 0;
    const inProgressCount = dailyTotals?.in_progress_count || 0;
    const pendingCount = dailyTotals?.pending_count || 0;
    const totalToday = completedCount + inProgressCount + pendingCount;

    return (
      <div className="space-y-6">

        {/* ── KPI Row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Active Workers', value: activeWorkers, sub: `${(workers ?? []).length} total registered`, icon: Users, iconBg: 'bg-blue-50 dark:bg-blue-950', iconColor: 'text-blue-600 dark:text-blue-400' },
            { label: "Today's Activities", value: todayActivities, sub: 'Tasks + item requests today', icon: ClipboardList, iconBg: 'bg-emerald-50 dark:bg-emerald-950', iconColor: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Item Requests', value: itemRequestStats.total, sub: `${itemRequestStats.pending} pending approval`, icon: Package, iconBg: 'bg-orange-50 dark:bg-orange-950', iconColor: 'text-orange-600 dark:text-orange-400' },
            { label: 'Pending Items', value: itemRequestStats.pending, sub: 'Awaiting action', icon: Clock, iconBg: 'bg-amber-50 dark:bg-amber-950', iconColor: 'text-amber-600 dark:text-amber-400' },
          ].map((stat, i) => (
            <OverviewStatCard key={i} {...stat} />
          ))}
        </div>

        {/* ── Today's Work Status ─────────────────────────────────────────── */}
        <div>
          <OverviewSectionHeader
            title="Today's Work Status"
            sub={totalToday > 0 ? `${totalToday} tasks tracked today` : new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          />
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Completed', value: completedCount, dot: 'bg-emerald-500', valueColor: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'In Progress', value: inProgressCount, dot: 'bg-amber-400', valueColor: 'text-amber-600 dark:text-amber-400' },
              { label: 'Pending', value: pendingCount, dot: 'bg-muted-foreground/40', valueColor: 'text-muted-foreground' },
            ].map(({ label, value, dot, valueColor }) => (
              <div key={label} className="flex flex-col gap-2 p-4 rounded-lg border border-border/60 bg-card hover:bg-accent/40 transition-colors duration-150">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                </div>
                <p className={`text-3xl font-bold tabular-nums ${valueColor}`}>{value}</p>
              </div>
            ))}
          </div>
          {dailyTotalsError && (
            <p className="text-xs text-destructive mt-2">Failed to load today's summary — check your connection.</p>
          )}
        </div>

        {/* ── Item Request Breakdown ───────────────────────────────────────── */}
        {itemRequestStats.total > 0 && (
          <div>
            <OverviewSectionHeader title="Item Request Breakdown" sub="SIMR status across all requests" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Pending',  value: itemRequestStats.pending,  dot: 'bg-amber-400'   },
                { label: 'Approved', value: itemRequestStats.approved, dot: 'bg-blue-500'    },
                { label: 'Issued',   value: itemRequestStats.issued,   dot: 'bg-emerald-500' },
                { label: 'Received', value: itemRequestStats.received, dot: 'bg-purple-500'  },
              ].map(({ label, value, dot }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/40 transition-colors duration-150">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent Tasks ─────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent Tasks</h3>
              {taskAssignments && <p className="text-xs text-muted-foreground">{taskAssignments.length} total assigned</p>}
            </div>
            <button onClick={() => handleTabChange('tasks')} className="text-xs font-medium text-primary hover:underline">View all</button>
          </div>
          {loadingTasks ? (
            <div className="flex justify-center py-6"><LoadingSpinner size="sm" /></div>
          ) : !taskAssignments || taskAssignments.length === 0 ? (
            <div className="flex items-center gap-3 p-5 rounded-lg border border-dashed border-border text-muted-foreground text-sm">
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>No tasks assigned yet.</span>
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Task</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Worker</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {taskAssignments.slice(0, 5).map((task: any) => {
                    const isComplete = ['completed', 'Completed'].includes(task.status);
                    const isProgress = ['in_progress', 'In Progress', 'assigned', 'Assigned'].includes(task.status);
                    return (
                      <tr key={task.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-foreground">{task.task_code}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{task.worker?.full_name || task.worker?.name || task.worker_name || '—'}</td>
                        <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{new Date(task.date_worked).toLocaleDateString()}</td>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isComplete ? 'bg-emerald-500' : isProgress ? 'bg-amber-400 animate-pulse' : 'bg-muted-foreground/40'}`} />
                            <span className="text-xs text-muted-foreground capitalize">{task.status?.replace(/_/g, ' ')}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Recent Item Requests ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent Item Requests</h3>
              <p className="text-xs text-muted-foreground">{itemRequestStats.total} total requests</p>
            </div>
            <button onClick={() => handleTabChange('proc-simr')} className="text-xs font-medium text-primary hover:underline">View all</button>
          </div>
          {loadingItemRequests ? (
            <div className="flex justify-center py-6"><LoadingSpinner size="sm" /></div>
          ) : !itemRequests || itemRequests.length === 0 ? (
            <div className="flex items-center gap-3 p-5 rounded-lg border border-dashed border-border text-muted-foreground text-sm">
              <Package className="w-4 h-4 shrink-0" />
              <span>No item requests yet.</span>
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Item</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Requester</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {itemRequests.slice(0, 5).map((request: any) => {
                    const firstItem = request.items?.[0];
                    const label = firstItem
                      ? `${firstItem.item_name}${request.items.length > 1 ? ` +${request.items.length - 1}` : ''}`
                      : request.simr_number || '—';
                    const isApproved = ['approved', 'issued', 'received'].includes(request.status);
                    const isRejected = request.status === 'rejected';
                    return (
                      <tr key={request.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-foreground">{label}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{request.requester_name || request.purpose || '—'}</td>
                        <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{new Date(request.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isRejected ? 'bg-red-500' : isApproved ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                            <span className="text-xs text-muted-foreground capitalize">{request.status?.replace(/_/g, ' ')}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Assigned Farms ───────────────────────────────────────────────── */}
        {farms && farms.length > 0 && (
          <div>
            <OverviewSectionHeader
              title="Assigned Farms"
              sub={`${farms.length} farm${farms.length !== 1 ? 's' : ''} under your supervision`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {farms.map((farm: any) => (
                <div key={farm.id || farm.farm_id} className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/40 transition-colors duration-150">
                  <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded-md shrink-0">
                    <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{farm.name}</p>
                    <p className="text-xs text-muted-foreground">{farm.location || 'No location set'}</p>
                    {farm.total_area && (
                      <p className="text-xs text-muted-foreground mt-0.5">{Math.round(farm.total_area * 10) / 10} ha</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  };

  // Render workers content
  const renderWorkers = () => {
    if (loadingWorkers) {
      return (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    return (
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle>Workers Management</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Monitor and manage your team workers</p>
          </div>
          <Button onClick={() => setShowAddWorkerModal(true)}>
            <Users className="w-4 h-4 mr-2" />
            Add Worker
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or phone…"
              value={workerSearch}
              onChange={(e) => setWorkerSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {filteredWorkers.length === 0 ? (
            <p className="text-muted-foreground">{workerSearch ? 'No workers match your search.' : 'No workers found.'}</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedWorkers.map((worker: any) => (
                      <tr key={worker.id} className="hover:bg-muted/50">
                        <td className="px-4 py-4 text-sm font-medium">
                          {worker.full_name || worker.name}
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {worker.phone || 'N/A'}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={worker.worker_type === 'permanent' ? 'default' : 'secondary'}>
                            {worker.worker_type === 'permanent' ? 'Permanent' : 'Contract'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={worker.is_active ? 'default' : 'destructive'}>
                            {worker.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 flex gap-2">
                          <Button variant="link" size="sm" onClick={() => handleEditWorker(worker)}>
                            Edit
                          </Button>
                          {!worker.is_active && (
                            <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => handleReactivateWorker(worker)}>
                              Reactivate
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={workersPage}
                totalPages={workersTotalPages}
                totalItems={filteredWorkers.length}
                itemsPerPage={workersPerPage}
                onPageChange={setWorkersPage}
                onItemsPerPageChange={setWorkersPerPage}
                showItemsPerPage={true}
              />
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render reports content
  const renderReports = () => {
    if (loadingWorkHistory) {
      return (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Date Range Filter */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Work History Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={() => refetchWorkHistory()} disabled={loadingWorkHistory}>
                  {loadingWorkHistory ? 'Loading…' : 'Generate Report'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work History Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Work History</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const historyArray = Array.isArray(workHistory) ? workHistory : (workHistory?.data || []);
              return !workHistory || historyArray.length === 0 ? (
                <p className="text-muted-foreground">No work history found for the selected period.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Worker</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Activity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Area (ha)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paginatedHistory.map((record: any, index: number) => (
                          <tr key={index} className="hover:bg-muted/50">
                            <td className="px-4 py-4 text-sm">
                              {new Date(record.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 text-sm text-muted-foreground">
                              {record.worker_name}
                            </td>
                            <td className="px-4 py-4 text-sm text-muted-foreground">
                              {record.activity_type}
                            </td>
                            <td className="px-4 py-4 text-sm text-muted-foreground">
                              {record.area_worked}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={historyPage}
                    totalPages={historyTotalPages}
                    totalItems={historyArray.length}
                    itemsPerPage={historyPerPage}
                    onPageChange={setHistoryPage}
                    onItemsPerPageChange={setHistoryPerPage}
                    showItemsPerPage={true}
                  />
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLogout={onLogout}
        sidebarItems={SUPERVISOR_NAV_ITEMS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        title="Supervisor Dashboard"
      >
        {/* Keep mounted tabs in DOM but hidden to preserve state/data */}
        <div className={activeTab === 'overview' ? '' : 'hidden'}>
          {mountedTabs.has('overview') && renderOverview()}
        </div>
        <div className={activeTab === 'attendance' ? '' : 'hidden'}>
          {mountedTabs.has('attendance') && <SupervisorAttendanceSection />}
        </div>
        <div className={activeTab === 'workers' ? '' : 'hidden'}>
          {mountedTabs.has('workers') && renderWorkers()}
        </div>
        <div className={activeTab === 'tasks' ? '' : 'hidden'}>
          {mountedTabs.has('tasks') && <SupervisorTasksSection />}
        </div>
<div className={activeTab === 'payroll_pending' ? '' : 'hidden'}>
          {mountedTabs.has('payroll_pending') && <SupervisorPayrollPendingSection />}
        </div>
        <div className={activeTab === 'payroll' ? '' : 'hidden'}>
          {mountedTabs.has('payroll') && <SupervisorPayrollSection />}
        </div>
        <div className={activeTab === 'calendar' ? '' : 'hidden'}>
          {mountedTabs.has('calendar') && <SharedCalendarSection userRole="supervisor" />}
        </div>
        <div className={activeTab === 'picking' ? '' : 'hidden'}>
          {mountedTabs.has('picking') && <PickingDashboard user={user} onLogout={onLogout} />}
        </div>
        <div className={activeTab === 'reports' ? '' : 'hidden'}>
          {mountedTabs.has('reports') && renderReports()}
        </div>
        {/* Budget tabs — read-only for supervisor */}
        <div className={activeTab === 'budget-manager'  ? '' : 'hidden'}>{mountedTabs.has('budget-manager')  && <SharedBudgetManagerSection  userRole="supervisor" />}</div>
        <div className={activeTab === 'budget-summary'  ? '' : 'hidden'}>{mountedTabs.has('budget-summary')  && <SharedBudgetSummarySection   userRole="supervisor" />}</div>
        <div className={activeTab === 'budget-tracking' ? '' : 'hidden'}>{mountedTabs.has('budget-tracking') && <SharedBudgetTrackingSection  userRole="supervisor" />}</div>
        {/* Procurement tabs */}
        <div className={activeTab === 'proc-simr'   ? '' : 'hidden'}>{mountedTabs.has('proc-simr')   && <SupervisorSimrSection />}</div>
        <div className={activeTab === 'proc-gin'    ? '' : 'hidden'}>{mountedTabs.has('proc-gin')    && <SharedGinSection userRole="supervisor" />}</div>
        <div className={activeTab === 'proc-tv'     ? '' : 'hidden'}>{mountedTabs.has('proc-tv')     && <SharedTransportVoucherSection userRole="supervisor" />}</div>
        <div className={activeTab === 'proc-dn'     ? '' : 'hidden'}>{mountedTabs.has('proc-dn')     && <SharedDeliveryNoteSection userRole="supervisor" />}</div>
        <div className={activeTab === 'proc-cardex'        ? '' : 'hidden'}>{mountedTabs.has('proc-cardex')        && <SharedCardexSection userRole="supervisor" />}</div>
        <div className={activeTab === 'field-applications' ? '' : 'hidden'}>{mountedTabs.has('field-applications') && <FieldApplicationSection userRole="supervisor" />}</div>
      </Layout>

      {/* Add Worker Modal */}
      <AddWorkerModal
        isOpen={showAddWorkerModal}
        onClose={handleCloseWorkerModal}
        onWorkerAdded={handleWorkerAdded}
        workerToEdit={workerToEdit}
      />
    </ErrorBoundary>
  );
};
