"use client";

// Supervisor Dashboard component
import React, { useState, useCallback, useMemo } from 'react';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Pagination } from '../common/Pagination';
import { User } from '../../types';
import { BarChart3, Users, ClipboardList, TrendingUp, Calendar, CheckCircle, Clock, AlertCircle, Package, UserCheck, LayoutDashboard, FileText, DollarSign } from 'lucide-react';
import { useApi } from '../../hooks';
import apiService from '../../services/api';
import AddWorkerModal from '../shared/AddWorkerModal';
import { SupervisorTasksSection, SupervisorItemRequestsSection, SupervisorAttendanceSection } from './sections';
import { SupervisorPayrollSection } from './sections/SupervisorPayrollSection';
import { SupervisorPayrollEntrySection } from './sections/SupervisorPayrollEntrySection';
import { SupervisorPayrollPendingSection } from './sections/SupervisorPayrollPendingSection';
import {
  SupervisorSimrSection,
  SharedGinSection,
  SharedTransportVoucherSection,
  SharedDeliveryNoteSection,
  SharedCardexSection,
} from './sections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
      { id: 'tasks',          label: 'Tasks',          icon: ClipboardList },
      { id: 'item_requests',  label: 'Item Requests',  icon: Package       },
      { id: 'payroll_entry',  label: 'New Payroll',    icon: DollarSign    },
      { id: 'payroll_pending', label: 'Pending',       icon: Clock         },
      { id: 'payroll',        label: 'Rejected',       icon: AlertCircle   },
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement',
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
    id: 'reports',
    label: 'Reports',
    icon: FileText,
  },
];

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
  const { data: workHistory, loading: loadingWorkHistory } = useApi(getWorkHistory);
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

  // Pagination calculations for Workers
  const paginatedWorkers = useMemo(() => {
    if (!workers) return [];
    const startIndex = (workersPage - 1) * workersPerPage;
    const endIndex = startIndex + workersPerPage;
    return workers.slice(startIndex, endIndex);
  }, [workers, workersPage, workersPerPage]);

  const workersTotalPages = useMemo(() => {
    if (!workers) return 0;
    return Math.ceil(workers.length / workersPerPage);
  }, [workers, workersPerPage]);

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

  // Reset pagination when data changes
  React.useEffect(() => {
    setWorkersPage(1);
  }, [workers?.length]);

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
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Welcome Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Welcome, {user.full_name}!</CardTitle>
            <p className="text-sm text-muted-foreground">Supervisor Dashboard</p>
          </CardHeader>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{activeWorkers}</p>
                  <p className="text-xs text-muted-foreground">Active Workers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{todayActivities}</p>
                  <p className="text-xs text-muted-foreground">Today's Activities</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                  <Package className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">{itemRequestStats.total}</p>
                  <p className="text-xs text-muted-foreground">Item Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-600">{itemRequestStats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Today's Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyTotalsError ? (
              <div className="text-center text-destructive text-sm">
                <p>Failed to load summary</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mb-1" />
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-lg font-bold text-green-600">{dailyTotals?.completed_count || 0}</p>
                </div>
                <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600 mb-1" />
                  <p className="text-xs text-muted-foreground">In Progress</p>
                  <p className="text-lg font-bold text-yellow-600">{dailyTotals?.in_progress_count || 0}</p>
                </div>
                <div className="flex flex-col items-center p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mb-1" />
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-lg font-bold text-red-600">{dailyTotals?.pending_count || 0}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Tasks</CardTitle>
            <Button variant="link" size="sm" onClick={() => handleTabChange('tasks')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {loadingTasks ? (
              <div className="flex justify-center items-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : !taskAssignments || taskAssignments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No tasks assigned</p>
            ) : (
              <div className="space-y-3">
                {taskAssignments.slice(0, 5).map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{task.task_code}</h4>
                      <p className="text-sm text-muted-foreground">
                        {task.worker?.full_name || task.worker?.name || task.worker_name || 'Unknown'} - {new Date(task.date_worked).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      task.status === 'completed' || task.status === 'Completed'
                        ? 'default'
                        : task.status === 'in_progress' || task.status === 'In Progress' || task.status === 'assigned' || task.status === 'Assigned'
                        ? 'secondary'
                        : 'outline'
                    }>
                      {task.status === 'in_progress' || task.status === 'In Progress' ? 'In Progress' :
                       task.status === 'assigned' || task.status === 'Assigned' ? 'Assigned' :
                       task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Item Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Item Requests</CardTitle>
            <Button variant="link" size="sm" onClick={() => handleTabChange('item_requests')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {loadingItemRequests ? (
              <div className="flex justify-center items-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : !itemRequests || itemRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No item requests</p>
            ) : (
              <div className="space-y-3">
                {itemRequests.slice(0, 5).map((request: any) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{request.item_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {request.requested_by || 'Unknown'} - {request.quantity} {request.unit} - {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      request.status === 'approved' ? 'default' :
                      request.status === 'issued' || request.status === 'received' ? 'default' :
                      request.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Farms */}
        {farms && farms.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your Assigned Farms</CardTitle>
              <p className="text-sm text-muted-foreground">Farms you supervise</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {farms.map((farm: any) => (
                  <Card key={farm.id || farm.farm_id} className="border">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">{farm.name}</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>{farm.location}</p>
                        <p>{farm.crops ? (typeof farm.crops === 'string' ? JSON.parse(farm.crops).join(', ') : farm.crops) : 'N/A'}</p>
                        <p>{Math.round(farm.total_area * 10) / 10} ha</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
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
          {!workers || workers.length === 0 ? (
            <p className="text-muted-foreground">No workers found.</p>
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
                        <td className="px-4 py-4">
                          <Button variant="link" size="sm" onClick={() => handleEditWorker(worker)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={workersPage}
                totalPages={workersTotalPages}
                totalItems={workers.length}
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
                <Button className="w-full" onClick={() => window.location.reload()}>
                  Generate Report
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
        <div className={activeTab === 'item_requests' ? '' : 'hidden'}>
          {mountedTabs.has('item_requests') && <SupervisorItemRequestsSection />}
        </div>
        <div className={activeTab === 'payroll_entry' ? '' : 'hidden'}>
          {mountedTabs.has('payroll_entry') && <SupervisorPayrollEntrySection />}
        </div>
        <div className={activeTab === 'payroll_pending' ? '' : 'hidden'}>
          {mountedTabs.has('payroll_pending') && <SupervisorPayrollPendingSection />}
        </div>
        <div className={activeTab === 'payroll' ? '' : 'hidden'}>
          {mountedTabs.has('payroll') && <SupervisorPayrollSection />}
        </div>
        <div className={activeTab === 'calendar' ? '' : 'hidden'}>
          {mountedTabs.has('calendar') && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Calendar View</h2>
                <p className="text-muted-foreground">Coming soon</p>
              </CardContent>
            </Card>
          )}
        </div>
        <div className={activeTab === 'reports' ? '' : 'hidden'}>
          {mountedTabs.has('reports') && renderReports()}
        </div>
        {/* Procurement tabs */}
        <div className={activeTab === 'proc-simr'   ? '' : 'hidden'}>{mountedTabs.has('proc-simr')   && <SupervisorSimrSection />}</div>
        <div className={activeTab === 'proc-gin'    ? '' : 'hidden'}>{mountedTabs.has('proc-gin')    && <SharedGinSection userRole="supervisor" />}</div>
        <div className={activeTab === 'proc-tv'     ? '' : 'hidden'}>{mountedTabs.has('proc-tv')     && <SharedTransportVoucherSection userRole="supervisor" />}</div>
        <div className={activeTab === 'proc-dn'     ? '' : 'hidden'}>{mountedTabs.has('proc-dn')     && <SharedDeliveryNoteSection userRole="supervisor" />}</div>
        <div className={activeTab === 'proc-cardex' ? '' : 'hidden'}>{mountedTabs.has('proc-cardex') && <SharedCardexSection userRole="supervisor" />}</div>
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
