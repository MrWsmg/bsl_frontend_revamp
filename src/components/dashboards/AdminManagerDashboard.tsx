"use client";

import { useState, useEffect, useRef } from "react";
import apiService from "../../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Users, DollarSign, Calendar, CalendarDays, LucideIcon, TrendingUp, ChevronLeft, ChevronRight, Bell, FileText, TrendingUp as TrendUp, BarChart3, ClipboardList, ShoppingCart, Package, Truck, ArrowLeftRight, BookOpen, CreditCard, Receipt, UserCog, LayoutDashboard, ShieldCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { User } from '../../types';
import {
  MdStrategicFinancialSection,
  MdPerformanceReviewSection,
  MdReportsMeetingsSection,
  SharedSmrSection,
  SharedLpoSection,
  SharedGrnSection,
  SharedSimrSection,
  SharedGinSection,
  SharedTransportVoucherSection,
  SharedDeliveryNoteSection,
  SharedTransferSection,
  SharedCardexSection,
  SharedGatePassSection,
  SharedWeeklySheetSection,
  SharedPaymentSummarySection,
  SharedPayslipSection,
  SharedCalendarSection,
  SharedBudgetManagerSection,
  SharedBudgetSummarySection,
  SharedBudgetTrackingSection,
  UsersSection,
  ActivitiesSection,
  AdminAuditLogsSection,
} from './sections';

// ── Formatting helpers ────────────────────────────────────────────────────
const fmtTZS = (n: number): string => {
  if (n >= 1_000_000) return `TZS ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `TZS ${(n / 1_000).toFixed(0)}K`;
  return `TZS ${Math.round(n).toLocaleString()}`;
};
const fmtShort = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return Math.round(n).toLocaleString();
};
const budgetPct = (spent: number, alloc: number) =>
  alloc > 0 ? Math.min(Math.round((spent / alloc) * 100), 999) : 0;

const WORKER_TYPE_LABELS: Record<string, string> = {
  permanent: 'Permanent',
  contract: 'Contract',
  cont_d: 'Contract',
  contractor: 'Contract',
  casual: 'Casual',
  unknown: 'Unknown',
};
const workerTypeLabel = (raw: string): string => {
  const key = (raw ?? '').toLowerCase().replace(/[\s-]/g, '_');
  return WORKER_TYPE_LABELS[key] ?? raw;
};

// ── KPI Card ─────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  subPositive?: boolean;
  accent: string;  // Tailwind bg class
  iconAccent: string;
}
const KpiCard = ({ title, value, icon: Icon, sub, subPositive, accent, iconAccent }: KpiCardProps) => (
  <Card className="transition-all hover:shadow-md">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-gray-900 truncate">{value}</p>
          {sub && (
            <p className={`text-xs mt-1 font-medium ${subPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {subPositive ? '▲' : '▼'} {sub}
            </p>
          )}
        </div>
        <div className={`${accent} rounded-xl p-2.5 flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${iconAccent}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ── Period toggle ─────────────────────────────────────────────────────────
const PeriodToggle = ({ period, onPeriodChange }: { period: "weekly" | "yearly"; onPeriodChange: (p: "weekly" | "yearly") => void }) => (
  <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 gap-0.5">
    {(["weekly", "yearly"] as const).map(p => (
      <button key={p} onClick={() => onPeriodChange(p)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
          period === p ? 'bg-white shadow-sm text-gray-900' : 'text-muted-foreground hover:text-gray-700'
        }`}>
        {p === 'weekly' ? <Calendar className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />}
        {p}
      </button>
    ))}
  </div>
);

// ── Budget farm row ────────────────────────────────────────────────────────
const BudgetFarmRow = ({ farmName, budgetAllocated, budgetSpent }: { farmName: string; budgetAllocated: number; budgetSpent: number }) => {
  const p = budgetPct(budgetSpent, budgetAllocated);
  const over = p >= 100;
  const warn = p >= 85 && !over;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="w-28 min-w-[7rem] truncate text-sm font-medium text-gray-800">{farmName}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{fmtTZS(budgetSpent)} spent</span>
          <span>{fmtTZS(budgetAllocated)} alloc</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : warn ? 'bg-amber-400' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(p, 100)}%` }}
          />
        </div>
      </div>
      <div className="w-20 text-right flex-shrink-0">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          over ? 'bg-red-100 text-red-700' : warn ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
          {p}% {over ? '▲' : ''}
        </span>
      </div>
    </div>
  );
};

// ── Tooltip style ─────────────────────────────────────────────────────────
const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

// ── MD OVERVIEW TAB ───────────────────────────────────────────────────────
const MdOverviewTab = () => {
  const [period, setPeriod] = useState<"weekly" | "yearly">("weekly");
  const [farms, setFarms]           = useState<any[]>([]);
  const [budgets, setBudgets]       = useState<any[]>([]);
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [stockData, setStockData]   = useState<any[]>([]);
  const [workerData, setWorkerData] = useState<any[]>([]);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [workerCount, setWorkerCount] = useState<number | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const currentBudgets = budgets.filter(b => b.period === period);
  const totalAllocated = currentBudgets.reduce((s, b) => s + (b.budgetAllocated ?? 0), 0);
  const totalSpent     = currentBudgets.reduce((s, b) => s + (b.budgetSpent ?? 0), 0);
  const overBudgetFarms = currentBudgets.filter(b => (b.budgetSpent ?? 0) > (b.budgetAllocated ?? 0)).length;
  const healthPct = currentBudgets.length > 0
    ? Math.round(((currentBudgets.length - overBudgetFarms) / currentBudgets.length) * 100)
    : null;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      const results = await Promise.allSettled([
        apiService.getAdminManagerFarms(),
        apiService.getAdminManagerBudgets(period),
        apiService.analytics.getPayrollTrends('monthly'),
        apiService.getAdminManagerStockData(),
        apiService.getAdminManagerWorkerData(),
        apiService.getAdminManagerExpensesData(),
        apiService.getAdminManagerActivities(),
        apiService.getWorkers(),
      ]);
      const ok = <T,>(r: PromiseSettledResult<T>, fallback: T): T =>
        r.status === 'fulfilled' ? r.value : fallback;
      setFarms(ok(results[0], []));
      setBudgets(ok(results[1], []));
      setPayrollData(ok(results[2], []));
      setStockData(ok(results[3], []));
      setWorkerData(ok(results[4], []));
      setExpensesData(ok(results[5], []));
      setActivities(ok(results[6], []));
      const workers = ok(results[7], []) as any[];
      setWorkerCount(Array.isArray(workers) ? workers.filter((w: any) => w.is_active !== false).length : null);
      if (results.every(r => r.status === 'rejected')) setError('Failed to load dashboard data');
      setLoading(false);
    };
    loadData();
  }, [period]);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto" />
        <p className="text-sm text-muted-foreground">Loading financial overview…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-32">
      <div className="text-center space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        <button onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
          Retry
        </button>
      </div>
    </div>
  );

  const diff = totalSpent - totalAllocated;

  return (
    <div className="p-5 space-y-6 max-w-[1400px]">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Financial Overview</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Track budgets and spending across all farms</p>
        </div>
        <PeriodToggle period={period} onPeriodChange={setPeriod} />
      </div>

      {/* ── KPI Row ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Farms"
          value={farms.length || '—'}
          icon={Building2}
          accent="bg-blue-50"
          iconAccent="text-blue-600"
        />
        <KpiCard
          title="Active Workers"
          value={workerCount ?? '—'}
          icon={Users}
          sub={workerData.length > 0 ? `${workerData[0]?.name}: ${workerData[0]?.value}%` : undefined}
          subPositive={true}
          accent="bg-violet-50"
          iconAccent="text-violet-600"
        />
        <KpiCard
          title={period === "weekly" ? "Weekly Budget" : "Yearly Budget"}
          value={totalAllocated ? fmtTZS(totalAllocated) : '—'}
          icon={DollarSign}
          sub={totalAllocated && diff !== 0 ? `${fmtTZS(Math.abs(diff))} ${diff > 0 ? 'over' : 'under'}` : undefined}
          subPositive={diff <= 0}
          accent="bg-emerald-50"
          iconAccent="text-emerald-600"
        />
        <KpiCard
          title="Budget Health"
          value={healthPct !== null ? `${healthPct}%` : '—'}
          icon={TrendingUp}
          sub={overBudgetFarms > 0 ? `${overBudgetFarms} farm${overBudgetFarms > 1 ? 's' : ''} over budget` : 'All farms on track'}
          subPositive={overBudgetFarms === 0}
          accent={healthPct !== null && healthPct < 70 ? 'bg-red-50' : 'bg-emerald-50'}
          iconAccent={healthPct !== null && healthPct < 70 ? 'text-red-500' : 'text-emerald-600'}
        />
      </div>

      {/* ── Budget by Farm + Budget Chart ── */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
        {/* Farm budget rows */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Budget Status by Farm</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {currentBudgets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No budget data for this period</p>
            ) : (
              currentBudgets.map((b, i) => (
                <BudgetFarmRow key={i} farmName={b.farmName || b.farm_name || `Farm ${i + 1}`}
                  budgetAllocated={b.budgetAllocated ?? 0} budgetSpent={b.budgetSpent ?? 0} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Budget vs Actual chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Budget vs Actual ({period})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {currentBudgets.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={currentBudgets.map(b => ({
                  farm: b.farmName || b.farm_name || '—',
                  Allocated: b.budgetAllocated ?? 0,
                  Spent: b.budgetSpent ?? 0,
                }))} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="farm" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtShort} width={52} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => fmtTZS(v)} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Allocated" fill="#93c5fd" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Spent" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Payroll Trends + Worker Distribution ── */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Payroll Trends</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {payrollData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No payroll data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={payrollData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtShort} width={52} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => fmtTZS(v)} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="permanent" stroke="#10b981" strokeWidth={2} dot={false} name="Permanent" />
                  <Line type="monotone" dataKey="contract" stroke="#f59e0b" strokeWidth={2} dot={false} name="Contract" />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 2" dot={false} name="Total" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Worker Distribution
              {workerCount !== null && <span className="ml-1.5 text-xs font-normal text-muted-foreground">({workerCount} total)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {workerData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No worker data</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={workerData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                      {workerData.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.color || `hsl(${i * 60 + 180}, 60%, 55%)`} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, _: string, p: any) => [`${v}%`, workerTypeLabel(p.name)]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-1">
                  {workerData.map((w: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: w.color || `hsl(${i * 60 + 180}, 60%, 55%)` }} />
                        <span className="text-gray-600">{workerTypeLabel(w.name)}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{w.value}%
                        {workerCount ? <span className="text-muted-foreground font-normal"> · {Math.round(workerCount * w.value / 100)}</span> : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Stock + Expenses ── */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Stock Levels by Farm</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {stockData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No stock data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stockData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="farm" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtShort} width={44} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `${fmtShort(v)} kg`} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="coffee" fill="#92400e" radius={[3, 3, 0, 0]} name="Coffee (kg)" />
                  <Bar dataKey="maize"  fill="#d97706" radius={[3, 3, 0, 0]} name="Maize (kg)" />
                  <Bar dataKey="beans"  fill="#65a30d" radius={[3, 3, 0, 0]} name="Beans (kg)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {expensesData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No expense data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={expensesData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtShort} width={52} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => fmtTZS(v)} />
                  <Area type="monotone" dataKey="expenses" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Activity ── */}
      {activities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs">Farm</TableHead>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.slice(0, 8).map((a: any) => {
                  const actLabel =
                    a.type === 'payroll'  ? `Payroll${a.task_code ? ` · ${a.task_code}` : ''}${a.worker_name ? ` — ${a.worker_name}` : ''}` :
                    a.type === 'stock'    ? `Stock${a.item_description ? ` · ${a.item_description}` : ''}` :
                    a.type === 'expense'  ? `Expense${a.description ? ` · ${a.description}` : ''}` :
                    a.type ?? '—';
                  const timeStr = a.created_at
                    ? new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
                    : '—';
                  const status = a.approval_status ?? a.type ?? '—';
                  return (
                    <TableRow key={a.id} className="text-sm">
                      <TableCell className="font-medium py-2">{a.entered_by ?? '—'}</TableCell>
                      <TableCell className="py-2 max-w-[200px] truncate">{actLabel}</TableCell>
                      <TableCell className="py-2 text-muted-foreground">{a.farm ?? '—'}</TableCell>
                      <TableCell className="py-2 text-muted-foreground text-xs whitespace-nowrap">{timeStr}</TableCell>
                      <TableCell className="py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          status === 'approved' || status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : status === 'pending' || status === 'supervisor_pending' || status === 'manager_approved'
                            ? 'bg-amber-100 text-amber-700'
                            : status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>{status}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ============ MAIN INDEX COMPONENT ============
type MdTab =
  | 'overview' | 'strategic-financial' | 'performance' | 'reports-meetings'
  | 'smr' | 'lpo' | 'grn' | 'simr' | 'gin' | 'tv' | 'dn' | 'gate-pass' | 'transfers' | 'cardex'
  | 'weekly-sheet' | 'payment-summary' | 'payslip'
  | 'calendar' | 'users' | 'activities' | 'audit-logs'
  | 'budget-manager' | 'budget-summary' | 'budget-tracking';

interface AdminManagerDashboardProps {
  user: User;
  onLogout: () => void;
}

const MD_SIDEBAR = [
  {
    id: 'strategic',
    label: 'Strategic',
    icon: LayoutDashboard,
    children: [
      { id: 'overview',            label: 'Overview',            icon: LayoutDashboard },
      { id: 'strategic-financial', label: 'Strategic Financial', icon: BarChart3 },
      { id: 'performance',         label: 'Performance Review',  icon: TrendUp },
      { id: 'reports-meetings',    label: 'Reports & Meetings',  icon: FileText },
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement',
    icon: ShoppingCart,
    children: [
      { id: 'smr',       label: 'SMR',             icon: ClipboardList },
      { id: 'lpo',       label: 'LPO',             icon: ShoppingCart },
      { id: 'grn',       label: 'GRN',             icon: Package },
      { id: 'simr',      label: 'SIMR',            icon: ClipboardList },
      { id: 'gin',       label: 'GIN',             icon: Package },
      { id: 'tv',        label: 'Transport',       icon: Truck },
      { id: 'dn',        label: 'Delivery Note',   icon: Truck },
      { id: 'gate-pass', label: 'Gate Pass',       icon: ArrowLeftRight },
      { id: 'transfers', label: 'Transfers',       icon: ArrowLeftRight },
      { id: 'cardex',    label: 'CARDEX',          icon: BookOpen },
    ],
  },
  {
    id: 'payroll_group',
    label: 'Payroll',
    icon: CreditCard,
    children: [
      { id: 'weekly-sheet',    label: 'Weekly Sheet',    icon: Receipt },
      { id: 'payment-summary', label: 'Payment Summary', icon: CreditCard },
      { id: 'payslip',         label: 'Payslip',         icon: FileText },
    ],
  },
  { id: 'calendar',   label: 'Calendar',   icon: CalendarDays },
  {
    id: 'budgets-group', label: 'Budgets', icon: BookOpen,
    children: [
      { id: 'budget-manager',  label: 'Budget Manager', icon: BookOpen    },
      { id: 'budget-summary',  label: 'Summary Tree',   icon: BarChart3   },
      { id: 'budget-tracking', label: 'Live Tracking',  icon: TrendingUp  },
    ],
  },
  { id: 'activities', label: 'Activities', icon: Bell },
  { id: 'users',      label: 'Users',      icon: UserCog },
  { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck },
];

const AdminManagerDashboard = ({ user, onLogout }: AdminManagerDashboardProps) => {
  const [activeTab, setActiveTab] = useState<MdTab>('overview');
  const mountedTabs = useRef<Set<MdTab>>(new Set(['overview']));

  const handleTabChange = (tab: string) => {
    mountedTabs.current.add(tab as MdTab);
    setActiveTab(tab as MdTab);
  };

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLogout={onLogout}
        sidebarItems={MD_SIDEBAR}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        title="AGENTIC Farm Tracking - Managing Director"
      >
        <div className={activeTab !== 'overview' ? 'hidden' : ''}>
          {mountedTabs.current.has('overview') && <MdOverviewTab />}
        </div>
        <div className={activeTab !== 'strategic-financial' ? 'hidden' : ''}>
          {mountedTabs.current.has('strategic-financial') && <MdStrategicFinancialSection />}
        </div>
        <div className={activeTab !== 'performance' ? 'hidden' : ''}>
          {mountedTabs.current.has('performance') && <MdPerformanceReviewSection />}
        </div>
        <div className={activeTab !== 'reports-meetings' ? 'hidden' : ''}>
          {mountedTabs.current.has('reports-meetings') && <MdReportsMeetingsSection />}
        </div>
        <div className={activeTab !== 'smr' ? 'hidden' : ''}>
          {mountedTabs.current.has('smr') && <SharedSmrSection userRole="managing_director" />}
        </div>
        <div className={activeTab !== 'lpo' ? 'hidden' : ''}>
          {mountedTabs.current.has('lpo') && <SharedLpoSection userRole="managing_director" />}
        </div>
        <div className={activeTab !== 'grn' ? 'hidden' : ''}>
          {mountedTabs.current.has('grn') && <SharedGrnSection userRole="managing_director" />}
        </div>
        <div className={activeTab !== 'simr' ? 'hidden' : ''}>
          {mountedTabs.current.has('simr') && <SharedSimrSection userRole="managing_director" />}
        </div>
        <div className={activeTab !== 'gin' ? 'hidden' : ''}>
          {mountedTabs.current.has('gin') && <SharedGinSection userRole="managing_director" />}
        </div>
        <div className={activeTab !== 'tv' ? 'hidden' : ''}>
          {mountedTabs.current.has('tv') && <SharedTransportVoucherSection userRole="managing_director" />}
        </div>
        <div className={activeTab !== 'dn' ? 'hidden' : ''}>
          {mountedTabs.current.has('dn') && <SharedDeliveryNoteSection userRole="managing_director" />}
        </div>
        <div className={activeTab !== 'gate-pass' ? 'hidden' : ''}>
          {mountedTabs.current.has('gate-pass') && <SharedGatePassSection userRole="managing_director" />}
        </div>
        <div className={activeTab !== 'transfers' ? 'hidden' : ''}>
          {mountedTabs.current.has('transfers') && <SharedTransferSection userRole="managing_director" />}
        </div>
        <div className={activeTab !== 'cardex' ? 'hidden' : ''}>
          {mountedTabs.current.has('cardex') && <SharedCardexSection userRole="managing_director" />}
        </div>
        <div className={activeTab !== 'weekly-sheet' ? 'hidden' : ''}>
          {mountedTabs.current.has('weekly-sheet') && <SharedWeeklySheetSection userRole="managing_director" />}
        </div>
        <div className={activeTab !== 'payment-summary' ? 'hidden' : ''}>
          {mountedTabs.current.has('payment-summary') && <SharedPaymentSummarySection userRole="managing_director" />}
        </div>
        <div className={activeTab !== 'payslip' ? 'hidden' : ''}>
          {mountedTabs.current.has('payslip') && <SharedPayslipSection userRole="managing_director" />}
        </div>
        <div className={activeTab !== 'calendar' ? 'hidden' : ''}>
          {mountedTabs.current.has('calendar') && <SharedCalendarSection userRole="managing_director" />}
        </div>
        <div className={activeTab !== 'activities' ? 'hidden' : ''}>
          {mountedTabs.current.has('activities') && <ActivitiesSection />}
        </div>
        <div className={activeTab !== 'users' ? 'hidden' : ''}>
          {mountedTabs.current.has('users') && <UsersSection />}
        </div>
        <div className={activeTab !== 'audit-logs' ? 'hidden' : ''}>
          {mountedTabs.current.has('audit-logs') && <AdminAuditLogsSection />}
        </div>
        <div className={activeTab !== 'budget-manager' ? 'hidden' : ''}>
          {mountedTabs.current.has('budget-manager') && <SharedBudgetManagerSection userRole="managing_director" />}
        </div>
        <div className={activeTab !== 'budget-summary' ? 'hidden' : ''}>
          {mountedTabs.current.has('budget-summary') && <SharedBudgetSummarySection userRole="managing_director" />}
        </div>
        <div className={activeTab !== 'budget-tracking' ? 'hidden' : ''}>
          {mountedTabs.current.has('budget-tracking') && <SharedBudgetTrackingSection userRole="managing_director" />}
        </div>
      </Layout>
    </ErrorBoundary>
  );
};

export default AdminManagerDashboard;