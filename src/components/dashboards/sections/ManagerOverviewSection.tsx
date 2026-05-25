"use client";

import React, { useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import {
  Users, Briefcase, ClipboardList, Package, DollarSign, Building2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// ── Helper components ──────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
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

const SectionHeader: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => (
  <div className="mb-3">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────

export const ManagerOverviewSection: React.FC = () => {
  const getFarms          = useCallback(() => apiService.getManagerFarms(), []);
  const getUsers          = useCallback(() => apiService.getManagerUsers(), []);
  const getWorkers        = useCallback(() => apiService.getManagerWorkers(), []);
  const getPendingPayroll = useCallback(() => apiService.getManagerPendingPayroll(), []);
  const getTaskAssignments = useCallback(() => apiService.getManagerTaskAssignments(), []);
  const getItemRequests   = useCallback(() => apiService.getPendingGins(), []);

  const { data: farms,          loading: l1 } = useApi(getFarms);
  const { data: users,          loading: l2 } = useApi(getUsers);
  const { data: workers,        loading: l3 } = useApi(getWorkers);
  const { data: pendingPayroll, loading: l4 } = useApi(getPendingPayroll);
  const { data: taskAssignments, loading: l5 } = useApi(getTaskAssignments);
  const { data: itemRequests,   loading: l6 } = useApi(getItemRequests);

  if (l1 || l2 || l3 || l4 || l5 || l6) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Derived values
  const activeWorkers    = (workers ?? []).filter((w: any) => w.is_active !== false).length;
  const completedTasks   = (taskAssignments ?? []).filter((t: any) => ['completed', 'Completed'].includes(t.status)).length;
  const inProgressTasks  = (taskAssignments ?? []).filter((t: any) => ['in_progress', 'In Progress', 'assigned', 'Assigned'].includes(t.status)).length;
  const pendingTasks     = (taskAssignments ?? []).filter((t: any) => t.status === 'pending').length;
  const totalTasks       = completedTasks + inProgressTasks + pendingTasks;
  const pendingRequests  = (itemRequests ?? []).filter((r: any) => r.status === 'pending_fm_approval').length;
  const approvedRequests = (itemRequests ?? []).filter((r: any) => r.status === 'approved').length;
  const issuedRequests   = (itemRequests ?? []).filter((r: any) => r.status === 'dispatched').length;
  const totalRequests    = (itemRequests ?? []).length;

  return (
    <div className="space-y-6">

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Farms Managed"
          value={(farms ?? []).length}
          sub={`${(farms ?? []).length === 1 ? '1 farm' : `${(farms ?? []).length} farms`} assigned`}
          icon={Briefcase}
          iconBg="bg-blue-50 dark:bg-blue-950"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Active Workers"
          value={activeWorkers}
          sub={`${(workers ?? []).length} total registered`}
          icon={Users}
          iconBg="bg-emerald-50 dark:bg-emerald-950"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Pending Payroll"
          value={(pendingPayroll ?? []).length}
          sub="Awaiting approval"
          icon={DollarSign}
          iconBg="bg-amber-50 dark:bg-amber-950"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          label="Pending GINs"
          value={pendingRequests}
          sub={`${totalRequests} total issue notes`}
          icon={Package}
          iconBg="bg-orange-50 dark:bg-orange-950"
          iconColor="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* ── Task Status ─────────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          title="Task Status"
          sub={totalTasks > 0 ? `${totalTasks} total tasks across all assignments` : 'No tasks recorded yet'}
        />
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Completed',   value: completedTasks,  dot: 'bg-emerald-500',       valueColor: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'In Progress', value: inProgressTasks, dot: 'bg-amber-400',          valueColor: 'text-amber-600 dark:text-amber-400'     },
            { label: 'Pending',     value: pendingTasks,    dot: 'bg-muted-foreground/40', valueColor: 'text-muted-foreground'                  },
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
      </div>

      {/* ── Item Request Breakdown ───────────────────────────────────────── */}
      {totalRequests > 0 && (
        <div>
          <SectionHeader title="GIN Breakdown" sub="Goods Issue Note status across all requests" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Pending Approval', value: pendingRequests,  dot: 'bg-amber-400'   },
              { label: 'Approved',         value: approvedRequests, dot: 'bg-blue-500'    },
              { label: 'Issued',           value: issuedRequests,   dot: 'bg-emerald-500' },
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
        <SectionHeader
          title="Recent Tasks"
          sub={`${(taskAssignments ?? []).length} total assignments`}
        />
        {!taskAssignments || taskAssignments.length === 0 ? (
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
                {(taskAssignments as any[]).slice(0, 6).map((task: any) => {
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
      {totalRequests > 0 && (
        <div>
          <SectionHeader title="Recent GINs" sub={`${totalRequests} total issue notes`} />
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
                {(itemRequests as any[]).slice(0, 6).map((request: any) => {
                  const firstItem = request.items?.[0];
                  const label = firstItem
                    ? `${firstItem.item_name}${request.items.length > 1 ? ` +${request.items.length - 1}` : ''}`
                    : request.gin_number || '—';
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
        </div>
      )}

      {/* ── Farms ────────────────────────────────────────────────────────── */}
      {farms && farms.length > 0 && (
        <div>
          <SectionHeader
            title="Managed Farms"
            sub={`${farms.length} farm${farms.length !== 1 ? 's' : ''} assigned to you`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {(farms as any[]).map((farm: any) => (
              <div key={farm.id ?? farm.farm_id} className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card hover:bg-accent/40 transition-colors duration-150">
                <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded-md shrink-0">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{farm.name}</p>
                  <p className="text-xs text-muted-foreground">{farm.location || 'No location set'}</p>
                  {farm.total_area && (
                    <p className="text-xs text-muted-foreground mt-0.5">{Math.round(farm.total_area * 10) / 10} acres</p>
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
