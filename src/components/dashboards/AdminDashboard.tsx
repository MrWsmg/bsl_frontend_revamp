"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { User } from '../../types';
import {
  BarChart3, TrendingUp, PieChart, CalendarDays, Users, Warehouse,
  ClipboardList, Eye, LayoutDashboard, UserCog, ShieldCheck,
  ListChecks, RefreshCw, AlertCircle, Plus,
} from 'lucide-react';
import {
  OverviewSection,
  SummarySection,
  AnalyticsSection,
  UsersSection,
  ActivitiesSection,
  ReportsSection,
  SharedCalendarSection,
  SharedCardexSection,
  AdminAuditLogsSection,
} from './sections';
import apiService from '../../services/api';
import { useApi } from '../../hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab =
  | 'overview' | 'summary' | 'analytics' | 'analytical'
  | 'calendar'
  | 'users' | 'managers' | 'task-codes'
  | 'store'
  | 'reports'
  | 'activities'
  | 'audit-logs';

interface Props {
  user: User;
  onLogout: () => void;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

const ADMIN_NAV_ITEMS = [
  {
    id: 'dashboards',
    label: 'Dashboards',
    icon: LayoutDashboard,
    children: [
      { id: 'overview',   label: 'Overview',   icon: BarChart3  },
      { id: 'summary',    label: 'Summary',    icon: BarChart3  },
      { id: 'analytics',  label: 'Analytics',  icon: TrendingUp },
      { id: 'analytical', label: 'Analytical', icon: PieChart   },
    ],
  },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  {
    id: 'people',
    label: 'People',
    icon: UserCog,
    children: [
      { id: 'users',      label: 'Users',      icon: Users      },
      { id: 'managers',   label: 'Managers',   icon: Users      },
      { id: 'task-codes', label: 'Task Codes', icon: ListChecks },
    ],
  },
  { id: 'store',      label: 'Store',      icon: Warehouse     },
  { id: 'reports',    label: 'Reports',    icon: ClipboardList },
  { id: 'activities', label: 'Activities', icon: Eye           },
  { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck   },
];

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const AdminDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const mountedTabs = useRef<Set<Tab>>(new Set(['overview']));

  const handleTabChange = (id: string) => {
    const tab = id as Tab;
    mountedTabs.current.add(tab);
    setActiveTab(tab);
  };

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLogout={onLogout}
        sidebarItems={ADMIN_NAV_ITEMS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        title="Admin"
      >
        <div hidden={activeTab !== 'overview'}>
          {mountedTabs.current.has('overview')   && <OverviewSection />}
        </div>
        <div hidden={activeTab !== 'summary'}>
          {mountedTabs.current.has('summary')    && <SummarySection />}
        </div>
        <div hidden={activeTab !== 'analytics'}>
          {mountedTabs.current.has('analytics')  && <AnalyticsSection />}
        </div>
        <div hidden={activeTab !== 'analytical'}>
          {mountedTabs.current.has('analytical') && <AnalyticsSection />}
        </div>
        <div hidden={activeTab !== 'calendar'}>
          {mountedTabs.current.has('calendar')   && <SharedCalendarSection userRole="admin" />}
        </div>
        <div hidden={activeTab !== 'users'}>
          {mountedTabs.current.has('users')      && <UsersSection />}
        </div>
        <div hidden={activeTab !== 'managers'}>
          {mountedTabs.current.has('managers')   && <ManagerActivitiesSection />}
        </div>
        <div hidden={activeTab !== 'task-codes'}>
          {mountedTabs.current.has('task-codes') && <TaskCodesSection />}
        </div>
        <div hidden={activeTab !== 'store'}>
          {mountedTabs.current.has('store')      && <SharedCardexSection userRole="admin" />}
        </div>
        <div hidden={activeTab !== 'reports'}>
          {mountedTabs.current.has('reports')    && <ReportsSection />}
        </div>
        <div hidden={activeTab !== 'activities'}>
          {mountedTabs.current.has('activities') && <ActivitiesSection />}
        </div>
        <div hidden={activeTab !== 'audit-logs'}>
          {mountedTabs.current.has('audit-logs') && <AdminAuditLogsSection />}
        </div>
      </Layout>
    </ErrorBoundary>
  );
};

// ── Manager Activities ────────────────────────────────────────────────────────

const ManagerActivitiesSection: React.FC = () => {
  const [farmId, setFarmId]     = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const fetchFarms = useCallback(() => apiService.getFarms('admin'), []);
  const { data: farms } = useApi(fetchFarms);
  const farmList = Array.isArray(farms) ? farms : [];

  const buildParams = useCallback(() => {
    const p: Record<string, any> = {};
    if (farmId)   p.farm_id   = parseInt(farmId);
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo)   p.date_to   = dateTo;
    return p;
  }, [farmId, dateFrom, dateTo]);

  const fetchActivities = useCallback(
    () => apiService.getManagerActivities(buildParams()),
    [buildParams],
  );
  const { data: raw, loading, error, refetch } = useApi<any>(fetchActivities);
  const list: any[] = Array.isArray(raw) ? raw : (raw as any)?.activities ?? [];

  const inputCls = 'border border-gray-200 rounded-md px-3 py-2 text-sm bg-white';

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-600" /> Manager Activities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Farm</label>
              <select value={farmId} onChange={e => setFarmId(e.target.value)} className={inputCls}>
                <option value="">All farms</option>
                {farmList.map((f: any) => { const fid = f.id ?? f.farm_id; return <option key={fid} value={fid}>{f.name}</option>; })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputCls} />
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No manager activities found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((act: any, i: number) => (
                <div key={act.id ?? i} className="border border-gray-100 rounded-lg px-4 py-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        {act.type && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {act.type}
                          </span>
                        )}
                        {act.farm_name && <span className="text-xs text-gray-500">{act.farm_name}</span>}
                      </div>
                      <p className="text-sm text-gray-800 truncate">
                        {act.description ?? act.action ?? act.details ?? '—'}
                      </p>
                      {act.manager_name && (
                        <p className="text-xs text-gray-400 mt-0.5">by {act.manager_name}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {act.created_at ? new Date(act.created_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ── Task Codes ────────────────────────────────────────────────────────────────

const TaskCodesSection: React.FC = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');
  const [form, setForm] = useState({ code: '', description: '', category: '', unit: '' });

  const fetchCodes = useCallback(() => apiService.getTaskCodes(), []);
  const { data: raw, loading, error, refetch } = useApi<any>(fetchCodes);
  const codes: any[] = Array.isArray(raw) ? raw : (raw as any)?.task_codes ?? [];

  const handleClose = () => { setShowCreate(false); setFormError(''); setForm({ code: '', description: '', category: '', unit: '' }); };

  const handleSubmit = async () => {
    setFormError('');
    if (!form.code.trim()) { setFormError('Code is required.'); return; }
    setSubmitting(true);
    try {
      const payload: Record<string, any> = { code: form.code.trim() };
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.category.trim())    payload.category    = form.category.trim();
      if (form.unit.trim())        payload.unit        = form.unit.trim();
      await apiService.createTaskCode(payload);
      toast.success('Task code created');
      handleClose();
      refetch();
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || err?.message || 'Failed to create task code');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-gray-600" /> Task Codes
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)}
                className="gap-1.5 bg-gray-800 hover:bg-gray-900 text-white">
                <Plus className="w-3.5 h-3.5" /> New Code
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mb-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : codes.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No task codes yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-3 py-2">Code</th>
                    <th className="text-left px-3 py-2">Description</th>
                    <th className="text-left px-3 py-2">Category</th>
                    <th className="text-left px-3 py-2">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {codes.map((c: any, i: number) => (
                    <tr key={c.id ?? i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono font-semibold text-gray-800">{c.code}</td>
                      <td className="px-3 py-2 text-gray-600">{c.description ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{c.category ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{c.unit ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={open => { if (!open) handleClose(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-gray-600" /> New Task Code
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. PRUNE-01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Pruning activity" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <Input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="e.g. trees" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-gray-800 hover:bg-gray-900 text-white">
              {submitting ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
