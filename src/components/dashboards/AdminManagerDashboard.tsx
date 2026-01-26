"use client";

import { useState, useEffect } from "react";
import apiService from "../../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, DollarSign, CheckCircle2, Calendar, CalendarDays, LucideIcon, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Plus, CalendarRange, Bell, Clock, X, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

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
  activeWorkers: number;
  productivity: string;
  status: "active" | "inactive";
  budgetUsed: number;
  budgetStatus: "on-budget" | "near-limit" | "over-budget";
}

const FarmCard = ({ name, location, activeWorkers, productivity, status, budgetUsed, budgetStatus }: FarmCardProps) => {
  const statusColor = status === "active" ? "bg-success" : "bg-muted";
  const budgetBorderColor =
    budgetStatus === "over-budget" ? "border-destructive" :
    budgetStatus === "near-limit" ? "border-warning" :
    "border-success";
  const budgetBarColor =
    budgetStatus === "over-budget" ? "bg-destructive" :
    budgetStatus === "near-limit" ? "bg-warning" :
    "bg-success";

  return (
    <Card className={`border-2 ${budgetBorderColor} transition-all hover:shadow-lg`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{location}</p>
          </div>
          <div className={`h-3 w-3 rounded-full ${statusColor}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Workers</p>
            <p className="font-semibold text-lg">{activeWorkers}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Productivity</p>
            <p className="font-semibold text-lg text-success">{productivity}</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Budget Used</span>
            <span className="font-medium">{budgetUsed}%</span>
          </div>
          <Progress value={budgetUsed} className="h-2">
            <div className={`h-full ${budgetBarColor} transition-all`} style={{ width: `${Math.min(budgetUsed, 100)}%` }} />
          </Progress>
        </div>
      </CardContent>
    </Card>
  );
};

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

// ============ WEEKLY ACTIVITIES CALENDAR ============
const WeeklyCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['all']);
  const [calendarView, setCalendarView] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState<any>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'payroll',
    farm: 'Farm A',
    date: '',
    startTime: '09:00',
    duration: '1',
    reminder: 'none',
    description: '',
  });
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const activityTypes = [
    { id: 'all', label: 'All Activities', color: 'hsl(var(--primary))' },
    { id: 'payroll', label: 'Payroll', color: 'hsl(142 76% 36%)' },
    { id: 'stock', label: 'Stock', color: 'hsl(221 83% 53%)' },
    { id: 'expenses', label: 'Expenses', color: 'hsl(0 84% 60%)' },
    { id: 'inventory', label: 'Inventory', color: 'hsl(45 93% 47%)' },
  ];

  const getWeekDays = (date: Date) => {
    const week = [];
    const current = new Date(date);
    current.setDate(current.getDate() - current.getDay());

    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return week;
  };

  const weekDays = getWeekDays(selectedDate);
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 7 PM

  const filteredActivities = selectedFilters.includes('all')
    ? activities
    : activities.filter(a => selectedFilters.includes(a.type));

  const getActivityColor = (type: string) => {
    return activityTypes.find(t => t.id === type)?.color || 'hsl(var(--primary))';
  };

  const toggleFilter = (filterId: string) => {
    if (filterId === 'all') {
      setSelectedFilters(['all']);
    } else {
      const newFilters = selectedFilters.includes(filterId)
        ? selectedFilters.filter(f => f !== filterId)
        : [...selectedFilters.filter(f => f !== 'all'), filterId];
      setSelectedFilters(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };

  const handleAddEvent = () => {
    const eventDate = new Date(newEvent.date);
    const dayOfWeek = eventDate.getDay();
    const [hours, minutes] = newEvent.startTime.split(':').map(Number);
    const startHour = hours + minutes / 60;

    const newActivity = {
      id: Date.now(),
      type: newEvent.type,
      title: newEvent.title,
      day: dayOfWeek,
      startHour: startHour,
      duration: parseFloat(newEvent.duration),
      farm: newEvent.farm,
      reminder: newEvent.reminder,
      description: newEvent.description,
    };

    setActivities(prev => [...prev, newActivity]);
    setIsAddEventOpen(false);
    // Reset form
    setNewEvent({
      title: '',
      type: 'payroll',
      farm: 'Farm A',
      date: '',
      startTime: '09:00',
      duration: '1',
      reminder: 'none',
      description: '',
    });
  };

  const handleEditEvent = () => {
    if (!editingEvent) return;

    const eventDate = new Date(newEvent.date);
    const dayOfWeek = eventDate.getDay();
    const [hours, minutes] = newEvent.startTime.split(':').map(Number);
    const startHour = hours + minutes / 60;

    const updatedActivity = {
      ...editingEvent,
      type: newEvent.type,
      title: newEvent.title,
      day: dayOfWeek,
      startHour: startHour,
      duration: parseFloat(newEvent.duration),
      farm: newEvent.farm,
      reminder: newEvent.reminder,
      description: newEvent.description,
    };

    setActivities(prev => prev.map(activity =>
      activity.id === editingEvent.id ? updatedActivity : activity
    ));
    setIsEditEventOpen(false);
    setEditingEvent(null);
    // Reset form
    setNewEvent({
      title: '',
      type: 'payroll',
      farm: 'Farm A',
      date: '',
      startTime: '09:00',
      duration: '1',
      reminder: 'none',
      description: '',
    });
  };

  const handleDeleteEvent = () => {
    if (!selectedEventDetails) return;
    setActivities(prev => prev.filter(activity => activity.id !== selectedEventDetails.id));
    setIsDeleteConfirmOpen(false);
    setIsEventDetailsOpen(false);
    setSelectedEventDetails(null);
  };

  const openEditDialog = (activity: any) => {
    setEditingEvent(activity);
    setNewEvent({
      title: activity.title,
      type: activity.type,
      farm: activity.farm,
      date: '', // Would need to calculate from day/startHour
      startTime: `${Math.floor(activity.startHour).toString().padStart(2, '0')}:${((activity.startHour % 1) * 60).toString().padStart(2, '0')}`,
      duration: activity.duration.toString(),
      reminder: activity.reminder,
      description: activity.description,
    });
    setIsEditEventOpen(true);
    setIsEventDetailsOpen(false);
  };

  const handleEventClick = (activity: any) => {
    setSelectedEventDetails(activity);
    setIsEventDetailsOpen(true);
  };

  const getReminderLabel = (reminder: string) => {
    const labels: Record<string, string> = {
      'none': 'No reminder',
      '1day': '1 day before',
      '3days': '3 days before',
      '30days': '30 days before',
      'daily30': 'Daily for 30 days before',
    };
    return labels[reminder] || 'No reminder';
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getYearMonths = (date: Date) => {
    const year = date.getFullYear();
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push(new Date(year, i, 1));
    }
    return months;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground">Farm Activities Calendar</h3>
          <p className="text-sm text-muted-foreground">View and track all farm activities</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Calendar View Toggle */}
          <div className="inline-flex rounded-lg border border-border bg-muted/50 p-1">
            <Button
              variant={calendarView === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCalendarView("weekly")}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Weekly
            </Button>
            <Button
              variant={calendarView === "monthly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCalendarView("monthly")}
              className="gap-2"
            >
              <CalendarDays className="h-4 w-4" />
              Monthly
            </Button>
            <Button
              variant={calendarView === "yearly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCalendarView("yearly")}
              className="gap-2"
            >
              <CalendarRange className="h-4 w-4" />
              Yearly
            </Button>
          </div>

          {/* Add Event Dialog */}
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 min-h-[44px] px-4 py-2">
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="e.g., Payroll Entry"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Event Type</Label>
                  <Select value={newEvent.type} onValueChange={(value: string) => setNewEvent({ ...newEvent, type: value })}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payroll">Payroll</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="expenses">Expenses</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="farm">Farm</Label>
                  <Select value={newEvent.farm} onValueChange={(value: string) => setNewEvent({ ...newEvent, farm: value })}>
                    <SelectTrigger id="farm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Farm A">Farm Alpha</SelectItem>
                      <SelectItem value="Farm B">Farm Beta</SelectItem>
                      <SelectItem value="Farm C">Farm Gamma</SelectItem>
                      <SelectItem value="Farm D">Farm Delta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (hours)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={newEvent.duration}
                      onChange={(e) => setNewEvent({ ...newEvent, duration: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Event description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminder" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Set Reminder
                  </Label>
                  <Select value={newEvent.reminder} onValueChange={(value: string) => setNewEvent({ ...newEvent, reminder: value })}>
                    <SelectTrigger id="reminder">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No reminder</SelectItem>
                      <SelectItem value="1day">Remind me 1 day before</SelectItem>
                      <SelectItem value="3days">Remind me 3 days before</SelectItem>
                      <SelectItem value="30days">Remind me 30 days before</SelectItem>
                      <SelectItem value="daily30">Everyday for 30 days before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddEvent} className="w-full">
                  Add Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => {
              const newDate = new Date(selectedDate);
              if (calendarView === 'weekly') newDate.setDate(newDate.getDate() - 7);
              else if (calendarView === 'monthly') newDate.setMonth(newDate.getMonth() - 1);
              else newDate.setFullYear(newDate.getFullYear() - 1);
              setSelectedDate(newDate);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-4">
            {calendarView === 'weekly' && `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            {calendarView === 'monthly' && selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {calendarView === 'yearly' && selectedDate.getFullYear()}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => {
              const newDate = new Date(selectedDate);
              if (calendarView === 'weekly') newDate.setDate(newDate.getDate() + 7);
              else if (calendarView === 'monthly') newDate.setMonth(newDate.getMonth() + 1);
              else newDate.setFullYear(newDate.getFullYear() + 1);
              setSelectedDate(newDate);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </Button>
        </div>
      </div>

      {/* Activity Type Filters */}
      <div className="flex flex-wrap gap-2">
        {activityTypes.map((type) => (
          <Button
            key={type.id}
            variant={selectedFilters.includes(type.id) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleFilter(type.id)}
            className="gap-2"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: type.color }}
            />
            {type.label}
          </Button>
        ))}
      </div>

      {/* Weekly View */}
      {calendarView === 'weekly' && (
        <>
          <Card className="border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-8 border-b border-border/50">
              <div className="p-4 bg-muted/30 border-r border-border/50">
                <span className="text-xs font-medium text-muted-foreground">Time</span>
              </div>
              {weekDays.map((day, idx) => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={idx}
                    className={`p-4 text-center border-r border-border/50 ${isToday ? 'bg-primary/5' : ''}`}
                  >
                    <div className="text-xs text-muted-foreground uppercase">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg font-semibold mt-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

                <div className="relative">
                  {timeSlots.map((hour) => (
                    <div key={hour} className="grid grid-cols-8 border-b border-border/20 min-h-[60px]">
                      <div className="p-2 text-xs text-muted-foreground border-r border-border/50 bg-muted/10">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                      {weekDays.map((_, dayIdx) => (
                        <div
                          key={dayIdx}
                          className="border-r border-border/20 relative"
                        />
                      ))}
                    </div>
                  ))}

                  {/* Activity Blocks */}
                  <div className="absolute inset-0 pointer-events-none">
                    {filteredActivities.map((activity) => {
                  const top = ((activity.startHour - 7) * 60) + 40;
                  const height = activity.duration * 60;
                  const left = `${(activity.day / 7) * 100}%`;

                  return (
                    <div
                      key={activity.id}
                      className="absolute pointer-events-auto"
                      style={{
                        top: `${top}px`,
                        left: `calc(${left} + 4px)`,
                        width: 'calc(14.28% - 8px)',
                        height: `${height}px`,
                      }}
                      onClick={() => handleEventClick(activity)}
                    >
                      <div
                        className={`h-full rounded-md p-2 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4`}
                        style={{
                          backgroundColor: `${getActivityColor(activity.type)}15`,
                          borderLeftColor: getActivityColor(activity.type),
                        }}
                      >
                        <div className="text-xs font-medium text-foreground truncate">
                          {activity.title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {activity.farm}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.startHour.toString().padStart(2, '0')}:00 - {(activity.startHour + activity.duration).toFixed(0).padStart(2, '0')}:00
                        </div>
                        {activity.reminder !== 'none' && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Bell className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Card>
      </>
    )}

      {/* Monthly View */}
      {calendarView === 'monthly' && (
        <Card className="border-border/50 overflow-hidden p-4">
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {getMonthDays(selectedDate).map((day, idx) => {
                  const isToday = day && day.toDateString() === new Date().toDateString();
                  const dayActivities = day ? activities.filter(a => a.day === day.getDay()) : [];

                  return (
                    <div
                      key={idx}
                      className={`min-h-[100px] border border-border/50 rounded-lg p-2 ${day ? 'bg-card hover:bg-muted/50 cursor-pointer' : 'bg-muted/20'} ${isToday ? 'border-primary border-2' : ''}`}
                      onClick={() => {
                        if (day && dayActivities.length > 0) {
                          handleEventClick(dayActivities[0]);
                        }
                      }}
                    >
                      {day && (
                        <>
                          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                            {day.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dayActivities.slice(0, 2).map((activity) => (
                              <div
                                key={activity.id}
                                className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                                style={{
                                  backgroundColor: `${getActivityColor(activity.type)}15`,
                                  borderLeft: `2px solid ${getActivityColor(activity.type)}`,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventClick(activity);
                                }}
                              >
                                {activity.title}
                              </div>
                            ))}
                            {dayActivities.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{dayActivities.length - 2} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Yearly View */}
      {calendarView === 'yearly' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {getYearMonths(selectedDate).map((month, monthIdx) => {
            const monthActivities = activities.filter(() => Math.random() > 0.7);

            return (
              <Card key={monthIdx} className="p-4 border-border/50">
                <div className="text-sm font-semibold mb-3 text-center">
                  {month.toLocaleDateString('en-US', { month: 'long' })}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <div key={idx} className="text-[10px] text-center text-muted-foreground">
                      {day}
                    </div>
                  ))}
                  {getMonthDays(month).map((day, dayIdx) => {
                    const hasActivities = day && monthActivities.length > 0;

                    return (
                      <div
                        key={dayIdx}
                        className={`text-[10px] text-center p-1 rounded ${day ? 'hover:bg-muted/50 cursor-pointer' : ''} ${hasActivities ? 'bg-primary/10 font-semibold' : ''}`}
                      >
                        {day ? day.getDate() : ''}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-center text-muted-foreground">
                  {monthActivities.length} events
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Event Details Dialog */}
      <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Event Details</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEventDetailsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedEventDetails && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor: getActivityColor(selectedEventDetails.type),
                    }}
                  />
                  <h3 className="text-lg font-semibold">{selectedEventDetails.title}</h3>
                </div>
                <Badge variant="outline">{selectedEventDetails.type}</Badge>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Farm</p>
                    <p className="text-sm text-muted-foreground">{selectedEventDetails.farm}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEventDetails.startHour.toString().padStart(2, '0')}:00 - {(selectedEventDetails.startHour + selectedEventDetails.duration).toFixed(0).padStart(2, '0')}:00
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Duration: {selectedEventDetails.duration} hour{selectedEventDetails.duration !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Reminder</p>
                    <p className="text-sm text-muted-foreground">
                      {getReminderLabel(selectedEventDetails.reminder)}
                    </p>
                  </div>
                </div>

                {selectedEventDetails.description && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Description</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEventDetails.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => openEditDialog(selectedEventDetails)}>
                  Edit Event
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => setIsDeleteConfirmOpen(true)}>
                  Delete Event
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Event Title</Label>
              <Input
                id="edit-title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="e.g., Payroll Entry"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Event Type</Label>
              <Select value={newEvent.type} onValueChange={(value: string) => setNewEvent({ ...newEvent, type: value })}>
                <SelectTrigger id="edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="expenses">Expenses</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-farm">Farm</Label>
              <Select value={newEvent.farm} onValueChange={(value: string) => setNewEvent({ ...newEvent, farm: value })}>
                <SelectTrigger id="edit-farm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Farm A">Farm Alpha</SelectItem>
                  <SelectItem value="Farm B">Farm Beta</SelectItem>
                  <SelectItem value="Farm C">Farm Gamma</SelectItem>
                  <SelectItem value="Farm D">Farm Delta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startTime">Start Time</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration (hours)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newEvent.duration}
                  onChange={(e) => setNewEvent({ ...newEvent, duration: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Event description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reminder" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Set Reminder
              </Label>
              <Select value={newEvent.reminder} onValueChange={(value: string) => setNewEvent({ ...newEvent, reminder: value })}>
                <SelectTrigger id="edit-reminder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No reminder</SelectItem>
                  <SelectItem value="1day">Remind me 1 day before</SelectItem>
                  <SelectItem value="3days">Remind me 3 days before</SelectItem>
                  <SelectItem value="30days">Remind me 30 days before</SelectItem>
                  <SelectItem value="daily30">Everyday for 30 days before</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleEditEvent} className="w-full">
              Update Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete "{selectedEventDetails?.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleDeleteEvent}>
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activityTypes.slice(1).map((type) => {
          const count = activities.filter(a => a.type === type.id).length;
          return (
            <Card key={type.id} className="p-4 border-border/50">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${type.color}15` }}
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{count}</div>
                  <div className="text-xs text-muted-foreground">{type.label}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ============ MAIN INDEX COMPONENT ============
const AdminManagerDashboard = () => {
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

  const currentBudgets = period === "weekly" ? budgets.filter(b => b.period === 'weekly') : budgets.filter(b => b.period === 'yearly');

  // Load data on component mount and when period changes
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          farmsData,
          budgetsData,
          payrollData,
          stockData,
          workerData,
          expensesData,
          activitiesData
        ] = await Promise.all([
          apiService.getAdminManagerFarms(),
          apiService.getAdminManagerBudgets(period),
          apiService.getAdminManagerPayrollData(),
          apiService.getAdminManagerStockData(),
          apiService.getAdminManagerWorkerData(),
          apiService.getAdminManagerExpensesData(),
          apiService.getAdminManagerActivities()
        ]);

        setFarms(farmsData);
        setBudgets(budgetsData);
        setPayrollData(payrollData);
        setStockData(stockData);
        setWorkerData(workerData);
        setExpensesData(expensesData);
        setActivities(activitiesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [period]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Farm Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">Real-time insights and data visualization</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
              </span>
              <span className="text-sm font-medium text-success">Live</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Period Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Financial Overview</h2>
            <p className="text-sm text-muted-foreground">Track budgets and spending across all farms</p>
          </div>
          <PeriodToggle period={period} onPeriodChange={setPeriod} />
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Farms"
            value="12"
            icon={Building2}
            trend={{ value: "2 new this month", isPositive: true }}
            iconColor="text-primary"
          />
          <MetricCard
            title="Active Workers"
            value="156"
            icon={Users}
            trend={{ value: "8% increase", isPositive: true }}
            iconColor="text-accent"
          />
          <MetricCard
            title={period === "weekly" ? "Weekly Budget" : "Yearly Budget"}
            value={period === "weekly" ? "$19.7K" : "$1.076M"}
            icon={DollarSign}
            trend={{ value: period === "weekly" ? "$1.2K over" : "$29K over", isPositive: false }}
            iconColor="text-success"
          />
          <MetricCard
            title="Pending Approvals"
            value="24"
            icon={CheckCircle2}
            trend={{ value: "6 urgent", isPositive: false }}
            iconColor="text-warning"
          />
        </div>

        {/* Budget Cards */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Budget Status by Farm</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {budgets.map((budget) => (
              <BudgetCard key={budget.farmName} {...budget} period={period} />
            ))}
          </div>
        </div>

        {/* Budget Overview Chart */}
        <BudgetOverviewChart period={period} weeklyBudgets={currentBudgets} yearlyBudgets={currentBudgets} />

        {/* Weekly Activities Calendar */}
        <WeeklyCalendar />

        {/* Charts Row 1 */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <PayrollChart payrollData={payrollData} />
          <StockChart stockData={stockData} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <WorkerDistribution workerData={workerData} />
          <ExpensesChart expensesData={expensesData} />
        </div>

        {/* Activity Table */}
        <ActivityTable activities={activities} />

        {/* Farm Cards */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Farm Overview</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {farms.map((farm) => (
              <FarmCard key={farm.name} {...farm} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminManagerDashboard;