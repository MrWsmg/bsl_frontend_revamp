"use client";

import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, TrendingUp, DollarSign, MapPin, Users, LucideIcon, Calendar, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { AreaChart, Area } from "recharts";
import { LineChart, Line } from "recharts";
import { PieChart, Pie, Cell } from "recharts";

const activities: any[] = [];

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning hover:bg-warning/20",
  approved: "bg-success/10 text-success hover:bg-success/20",
  completed: "bg-accent/10 text-accent hover:bg-accent/20",
};

export const ActivityTable = () => {
  const data = (window as any).activities || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent User Activities</CardTitle>
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
            {activities.map((activity, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{activity.user}</TableCell>
                <TableCell>{activity.action}</TableCell>
                <TableCell>{activity.farm}</TableCell>
                <TableCell className="text-muted-foreground">{activity.time}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[activity.status]}>
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
};

interface BudgetCardProps {
  farmName: string;
  budgetAllocated: number;
  budgetSpent: number;
  period: "weekly" | "yearly";
}

export const BudgetCard = ({ farmName, budgetAllocated, budgetSpent, period }: BudgetCardProps) => {
  const percentageUsed = (budgetSpent / budgetAllocated) * 100;
  const remaining = budgetAllocated - budgetSpent;
  const isOverBudget = percentageUsed > 100;
  const isNearLimit = percentageUsed > 85 && percentageUsed <= 100;

  const getStatusColor = () => {
    if (isOverBudget) return "text-destructive";
    if (isNearLimit) return "text-warning";
    return "text-success";
  };

  const getStatusBadge = () => {
    if (isOverBudget) return { label: "Over Budget", variant: "destructive" as const };
    if (isNearLimit) return { label: "Near Limit", variant: "outline" as const, className: "bg-warning/10 text-warning border-warning/20" };
    return { label: "On Budget", variant: "outline" as const, className: "bg-success/10 text-success border-success/20" };
  };

  const status = getStatusBadge();

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">{farmName}</CardTitle>
          <Badge variant={status.variant} className={status.className}>
            {status.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground capitalize">{period} Budget</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Budget Used</span>
            <span className={`font-bold ${getStatusColor()}`}>
              {percentageUsed.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={Math.min(percentageUsed, 100)}
            className="h-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Allocated</p>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-lg font-bold">{budgetAllocated.toLocaleString()}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Spent</p>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-lg font-bold">{budgetSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-2 pt-2 border-t ${getStatusColor()}`}>
          {isOverBudget ? (
            <>
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-semibold">
                ${Math.abs(remaining).toLocaleString()} over budget
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-semibold">
                ${remaining.toLocaleString()} remaining
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface BudgetOverviewChartProps {
  period: "weekly" | "yearly";
}

const weeklyData: any[] = [];
const yearlyData: any[] = [];

export const BudgetOverviewChart = ({ period }: BudgetOverviewChartProps) => {
  const data = period === "weekly" ? (window as any).weeklyData || [] : (window as any).yearlyData || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget vs Actual Spending ({period})</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
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
            <Bar
              dataKey="budget"
              fill="hsl(var(--chart-2))"
              name="Budget Allocated"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="spent"
              fill="hsl(var(--chart-1))"
              name="Actual Spent"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="overrun"
              fill="hsl(var(--destructive))"
              name="Over Budget"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const expensesData: any[] = [];

export const ExpensesChart = () => {
  const data = (window as any).expensesData || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
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
};

interface FarmCardProps {
  name: string;
  location: string;
  activeWorkers: number;
  productivity: string;
  status: "active" | "maintenance";
  budgetUsed?: number;
  budgetStatus?: "on-budget" | "near-limit" | "over-budget";
}

export const FarmCard = ({ name, location, activeWorkers, productivity, status, budgetUsed = 0, budgetStatus = "on-budget" }: FarmCardProps) => {
  const getBudgetColor = () => {
    if (budgetStatus === "over-budget") return "text-destructive";
    if (budgetStatus === "near-limit") return "text-warning";
    return "text-success";
  };

  const getBorderColor = () => {
    if (budgetStatus === "over-budget") return "border-l-destructive";
    if (budgetStatus === "near-limit") return "border-l-warning";
    return "border-l-primary";
  };

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-lg border-l-4 ${getBorderColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant={status === "active" ? "default" : "secondary"} className="bg-success">
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{activeWorkers} Workers</span>
          </div>
          <div className="flex items-center gap-1 text-success">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-semibold">{productivity}</span>
          </div>
        </div>

        {budgetUsed > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                <span className="text-xs">Budget Used</span>
              </div>
              <span className={`font-bold text-sm ${getBudgetColor()}`}>
                {budgetUsed}%
              </span>
            </div>
            <Progress value={Math.min(budgetUsed, 100)} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconColor?: string;
}

export const MetricCard = ({ title, value, icon: Icon, trend, iconColor = "text-primary" }: MetricCardProps) => {
  return (
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
};

const payrollData: any[] = [];

export const PayrollChart = () => {
  const data = (window as any).payrollData || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
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
            <Line
              type="monotone"
              dataKey="payroll"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              name="Total Payroll"
              dot={{ fill: "hsl(var(--chart-1))" }}
            />
            <Line
              type="monotone"
              dataKey="approved"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              name="Approved"
              dot={{ fill: "hsl(var(--chart-2))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface PeriodToggleProps {
  period: "weekly" | "yearly";
  onPeriodChange: (period: "weekly" | "yearly") => void;
}

export const PeriodToggle = ({ period, onPeriodChange }: PeriodToggleProps) => {
  return (
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
};

const stockData: any[] = [];

export const StockChart = () => {
  const data = (window as any).stockData || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Levels by Farm</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
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
            <Bar dataKey="coffee" fill="hsl(var(--chart-1))" name="Coffee (kg)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="maize" fill="hsl(var(--chart-3))" name="Maize (kg)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="beans" fill="hsl(var(--chart-2))" name="Beans (kg)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const workerData: any[] = [];

export const WorkerDistribution = () => {
  const data = (window as any).workerData || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Worker Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={workerData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
};

const AnalyticalDashboard: React.FC = () => {
  const [period, setPeriod] = useState<"weekly" | "yearly">("weekly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Load data on component mount and when period changes
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const results = await Promise.allSettled([
          apiService.getAnalyticalDashboardData(),
          apiService.getAnalyticalBudgets(period),
          apiService.getAnalyticalPayrollData(),
          apiService.getAnalyticalStockData(),
          apiService.getAnalyticalWorkerData(),
          apiService.getAnalyticalExpensesData(),
          apiService.getAnalyticalActivities(),
          apiService.getAnalyticalFarms()
        ]);

        const ok = <T,>(r: PromiseSettledResult<T>, fallback: T): T =>
          r.status === 'fulfilled' ? r.value : fallback;

        const dashboardData = ok(results[0], null);
        const budgetsData   = ok(results[1], [] as any[]);
        const payrollData   = ok(results[2], [] as any[]);
        const stockData     = ok(results[3], [] as any[]);
        const workerData    = ok(results[4], [] as any[]);
        const expensesData  = ok(results[5], [] as any[]);
        const activitiesData = ok(results[6], [] as any[]);
        const farmsData     = ok(results[7], [] as any[]);

        setDashboardData(dashboardData);
        (window as any).weeklyData = budgetsData.filter((b: any) => b.period === 'weekly');
        (window as any).yearlyData = budgetsData.filter((b: any) => b.period === 'yearly');
        (window as any).payrollData = payrollData;
        (window as any).stockData = stockData;
        (window as any).workerData = workerData;
        (window as any).expensesData = expensesData;
        (window as any).activities = activitiesData;
        (window as any).farmsData = farmsData;

        if (results.every(r => r.status === 'rejected')) {
          setError('Failed to load dashboard data');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytical data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 flex items-center justify-center min-h-[400px]">
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
    <div className="space-y-6">
      {/* Header with Period Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Analytical Dashboard</h2>
        <PeriodToggle period={period} onPeriodChange={setPeriod} />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value="$2.4M"
          icon={DollarSign}
          trend={{ value: "12%", isPositive: true }}
          iconColor="text-green-600"
        />
        <MetricCard
          title="Active Farms"
          value={12}
          icon={MapPin}
          trend={{ value: "2", isPositive: true }}
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Total Workers"
          value={245}
          icon={Users}
          trend={{ value: "5%", isPositive: false }}
          iconColor="text-purple-600"
        />
        <MetricCard
          title="Productivity"
          value="94%"
          icon={TrendingUp}
          trend={{ value: "3%", isPositive: true }}
          iconColor="text-orange-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetOverviewChart period={period} />
        <ExpensesChart />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PayrollChart />
        <StockChart />
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkerDistribution />
        <ActivityTable />
      </div>

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {((window as any).weeklyData || []).filter((b: any) => period === 'weekly' ? b.period === 'weekly' : b.period === 'yearly').map((budget: any, index: number) => (
          <BudgetCard key={index} farmName={budget.farmName} budgetAllocated={budget.budgetAllocated} budgetSpent={budget.budgetSpent} period={period} />
        ))}
      </div>

      {/* Farm Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {((window as any).farmsData || []).map((farm: any, index: number) => (
          <FarmCard
            key={index}
            name={farm.name}
            location={farm.location}
            activeWorkers={farm.activeWorkers}
            productivity={farm.productivity}
            status={farm.status}
            budgetUsed={farm.budgetUsed}
            budgetStatus={farm.budgetStatus}
          />
        ))}
      </div>
    </div>
  );
};

export default AnalyticalDashboard;