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
  UsersSection,
  ActivitiesSection,
  AdminAuditLogsSection,
} from './sections';

// ============ METRIC CARD COMPONENT ============
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; isPositive: boolean };
  iconColor?: string;
}

const MetricCard = ({ title, value, icon: Icon, trend, iconColor = "text-primary" }: MetricCardProps) => (
  <Card className="overflow-hidden transition-all hover:shadow-lg">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p className={`text-xs font-medium ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={`rounded-lg bg-muted p-3 ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ============ PERIOD TOGGLE COMPONENT ============
interface PeriodToggleProps {
  period: "weekly" | "yearly";
  onPeriodChange: (period: "weekly" | "yearly") => void;
}

const PeriodToggle = ({ period, onPeriodChange }: PeriodToggleProps) => (
  <div className="inline-flex rounded-lg border border-border bg-muted/50 p-1">
    <Button
      variant={period === "weekly" ? "default" : "ghost"}
      size="sm"
      onClick={() => onPeriodChange("weekly")}
      className="gap-2"
    >
      <Calendar className="h-4 w-4" />
      Weekly
    </Button>
    <Button
      variant={period === "yearly" ? "default" : "ghost"}
      size="sm"
      onClick={() => onPeriodChange("yearly")}
      className="gap-2"
    >
      <CalendarDays className="h-4 w-4" />
      Yearly
    </Button>
  </div>
);

// ============ BUDGET CARD COMPONENT ============
interface BudgetCardProps {
  farmName: string;
  budgetAllocated: number;
  budgetSpent: number;
  period: "weekly" | "yearly";
}

const BudgetCard = ({ farmName, budgetAllocated, budgetSpent, period }: BudgetCardProps) => {
  const percentageUsed = Math.round((budgetSpent / budgetAllocated) * 100);
  const overrun = budgetSpent - budgetAllocated;
  const isOverBudget = overrun > 0;
  const isNearLimit = percentageUsed >= 85 && percentageUsed <= 100;

  const statusColor = isOverBudget ? "border-destructive" : isNearLimit ? "border-warning" : "border-success";
  const progressColor = isOverBudget ? "bg-destructive" : isNearLimit ? "bg-warning" : "bg-success";

  return (
    <Card className={`border-2 ${statusColor} transition-all hover:shadow-lg`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{farmName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Allocated</span>
            <span className="font-semibold">${budgetAllocated.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spent</span>
            <span className="font-semibold">${budgetSpent.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={Math.min(percentageUsed, 100)} className="h-2">
            <div className={`h-full ${progressColor} transition-all`} style={{ width: `${Math.min(percentageUsed, 100)}%` }} />
          </Progress>
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium">{percentageUsed}% used</span>
            {isOverBudget && (
              <Badge variant="destructive" className="text-xs">
                ${Math.abs(overrun).toLocaleString()} over
              </Badge>
            )}
            {!isOverBudget && isNearLimit && (
              <Badge variant="secondary" className="text-xs bg-warning/20 text-warning">
                Near limit
              </Badge>
            )}
            {!isOverBudget && !isNearLimit && (
              <Badge variant="secondary" className="text-xs bg-success/20 text-success">
                On budget
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============ FARM CARD COMPONENT ============
interface FarmCardProps {
  name: string;
  location: string;
  crops?: string;
  total_area?: number;
}

const FarmCard = ({ name, location, crops, total_area }: FarmCardProps) => (
  <Card className="transition-all hover:shadow-lg">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg">{name}</CardTitle>
      {location && <p className="text-sm text-muted-foreground mt-1">{location}</p>}
    </CardHeader>
    <CardContent className="space-y-2 text-sm">
      {crops && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Crops</span>
          <span className="font-medium">{crops}</span>
        </div>
      )}
      {total_area != null && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Area</span>
          <span className="font-medium">{total_area} ha</span>
        </div>
      )}
    </CardContent>
  </Card>
);

// ============ BUDGET OVERVIEW CHART ============
const BudgetOverviewChart = ({ period, weeklyBudgets, yearlyBudgets }: { period: "weekly" | "yearly", weeklyBudgets: any[], yearlyBudgets: any[] }) => {
  const data = period === "weekly"
    ? weeklyBudgets.map(budget => ({
        farm: budget.farmName,
        budget: budget.budgetAllocated,
        spent: budget.budgetSpent,
        overrun: Math.max(0, budget.budgetSpent - budget.budgetAllocated)
      }))
    : yearlyBudgets.map(budget => ({
        farm: budget.farmName,
        budget: budget.budgetAllocated,
        spent: budget.budgetSpent,
        overrun: Math.max(0, budget.budgetSpent - budget.budgetAllocated)
      }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget vs Actual Spending ({period})</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 250 : 350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="farm" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <Legend />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="budget" fill="hsl(var(--chart-2))" name="Budget Allocated" radius={[4, 4, 0, 0]} />
            <Bar dataKey="spent" fill="hsl(var(--chart-1))" name="Actual Spent" radius={[4, 4, 0, 0]} />
            <Bar dataKey="overrun" fill="hsl(var(--destructive))" name="Over Budget" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// ============ PAYROLL CHART ============
const PayrollChart = ({ payrollData }: { payrollData: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Payroll Trends</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 250 : 300}>
        <LineChart data={payrollData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="permanent" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Permanent Workers" />
          <Line type="monotone" dataKey="contract" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Contract Workers" />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

// ============ STOCK CHART ============
const StockChart = ({ stockData }: { stockData: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Stock Levels by Farm</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 250 : 300}>
        <BarChart data={stockData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="farm" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
          />
          <Legend />
          <Bar dataKey="coffee" fill="hsl(var(--chart-1))" name="Coffee (kg)" />
          <Bar dataKey="maize" fill="hsl(var(--chart-2))" name="Maize (kg)" />
          <Bar dataKey="beans" fill="hsl(var(--chart-3))" name="Beans (kg)" />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

// ============ WORKER DISTRIBUTION ============
const WorkerDistribution = ({ workerData }: { workerData: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Worker Distribution</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 250 : 300}>
        <PieChart>
          <Pie
            data={workerData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {workerData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

// ============ EXPENSES CHART ============
const ExpensesChart = ({ expensesData }: { expensesData: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Monthly Expenses</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 250 : 300}>
        <AreaChart data={expensesData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="hsl(var(--chart-3))"
            fill="hsl(var(--chart-3))"
            fillOpacity={0.6}
            name="Expenses"
          />
        </AreaChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

// ============ ACTIVITY TABLE ============
const ActivityTable = ({ activities }: { activities: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Recent Activities</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Farm</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell className="font-medium">{activity.user}</TableCell>
              <TableCell>{activity.action}</TableCell>
              <TableCell>{activity.farm}</TableCell>
              <TableCell className="text-muted-foreground">{activity.time}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    activity.status === "approved" || activity.status === "completed"
                      ? "default"
                      : activity.status === "pending"
                      ? "secondary"
                      : "outline"
                  }
                  className={
                    activity.status === "approved" || activity.status === "completed"
                      ? "bg-success/20 text-success border-success"
                      : activity.status === "pending"
                      ? "bg-warning/20 text-warning border-warning"
                      : ""
                  }
                >
                  {activity.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

// ============ MD OVERVIEW TAB ============
const MdOverviewTab = () => {
  const [period, setPeriod] = useState<"weekly" | "yearly">("weekly");
  const [farms, setFarms] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [stockData, setStockData] = useState<any[]>([]);
  const [workerData, setWorkerData] = useState<any[]>([]);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentBudgets = period === "weekly"
    ? budgets.filter(b => b.period === 'weekly')
    : budgets.filter(b => b.period === 'yearly');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      const results = await Promise.allSettled([
        apiService.getAdminManagerFarms(),
        apiService.getAdminManagerBudgets(period),
        apiService.getAdminManagerPayrollData(),
        apiService.getAdminManagerStockData(),
        apiService.getAdminManagerWorkerData(),
        apiService.getAdminManagerExpensesData(),
        apiService.getAdminManagerActivities(),
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
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length === results.length) {
        setError('Failed to load dashboard data');
      }
      setLoading(false);
    };
    loadData();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading overview data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <p className="text-destructive mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Financial Overview</h2>
          <p className="text-sm text-muted-foreground">Track budgets and spending across all farms</p>
        </div>
        <PeriodToggle period={period} onPeriodChange={setPeriod} />
      </div>

      {(() => {
        const totalAllocated = currentBudgets.reduce((s, b) => s + (b.budgetAllocated ?? 0), 0);
        const totalSpent = currentBudgets.reduce((s, b) => s + (b.budgetSpent ?? 0), 0);
        const diff = totalSpent - totalAllocated;
        const fmtNum = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(Math.round(n));
        const totalWorkers = workerData.reduce((s, w) => s + (w.value ?? 0), 0);
        return (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard title="Total Farms" value={farms.length} icon={Building2} iconColor="text-primary" />
            <MetricCard title="Active Workers" value={totalWorkers || '—'} icon={Users} iconColor="text-accent" />
            <MetricCard
              title={period === "weekly" ? "Weekly Budget" : "Yearly Budget"}
              value={totalAllocated ? fmtNum(totalAllocated) : '—'}
              icon={DollarSign}
              trend={totalAllocated ? { value: `${fmtNum(Math.abs(diff))} ${diff > 0 ? 'over' : 'under'}`, isPositive: diff <= 0 } : undefined}
              iconColor="text-success"
            />
          </div>
        );
      })()}

      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Budget Status by Farm</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {budgets.map((budget) => (
            <BudgetCard key={budget.farmName} {...budget} period={period} />
          ))}
        </div>
      </div>

      <BudgetOverviewChart period={period} weeklyBudgets={currentBudgets} yearlyBudgets={currentBudgets} />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <PayrollChart payrollData={payrollData} />
        <StockChart stockData={stockData} />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <WorkerDistribution workerData={workerData} />
        <ExpensesChart expensesData={expensesData} />
      </div>

      <ActivityTable activities={activities} />

      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Farm Overview</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {farms.map((farm) => (
            <FarmCard key={farm.name} {...farm} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============ MAIN INDEX COMPONENT ============
type MdTab =
  | 'overview' | 'strategic-financial' | 'performance' | 'reports-meetings'
  | 'smr' | 'lpo' | 'grn' | 'simr' | 'gin' | 'tv' | 'dn' | 'gate-pass' | 'transfers' | 'cardex'
  | 'weekly-sheet' | 'payment-summary' | 'payslip'
  | 'calendar' | 'users' | 'activities' | 'audit-logs';

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
          {mountedTabs.current.has('weekly-sheet') && <SharedWeeklySheetSection />}
        </div>
        <div className={activeTab !== 'payment-summary' ? 'hidden' : ''}>
          {mountedTabs.current.has('payment-summary') && <SharedPaymentSummarySection />}
        </div>
        <div className={activeTab !== 'payslip' ? 'hidden' : ''}>
          {mountedTabs.current.has('payslip') && <SharedPayslipSection />}
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

      </Layout>
    </ErrorBoundary>
  );
};

export default AdminManagerDashboard;