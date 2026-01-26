"use client";

// Manager Tasks section component - shadcn patterns
import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const ManagerTasksSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'assignments' | 'completed'>('assignments');

  const getTaskAssignments = useCallback(() => apiService.getManagerTaskAssignments(), []);
  const getCompletedTasks = useCallback(() => apiService.getManagerCompletedTasks(), []);

  const { data: taskAssignments, loading: assignmentsLoading } = useApi(getTaskAssignments);
  const { data: completedTasks, loading: completedLoading } = useApi(getCompletedTasks);

  const loading = activeTab === 'assignments' ? assignmentsLoading : completedLoading;
  const tasks = activeTab === 'assignments' ? taskAssignments : completedTasks;

  const stats = taskAssignments && completedTasks ? {
    totalAssignments: taskAssignments.length,
    inProgress: taskAssignments.filter((t: any) => t.status === 'in_progress').length,
    pending: taskAssignments.filter((t: any) => t.status === 'pending').length,
    totalCompleted: completedTasks.length
  } : { totalAssignments: 0, inProgress: 0, pending: 0, totalCompleted: 0 };

  const completionRate = stats.totalAssignments + stats.totalCompleted > 0
    ? (stats.totalCompleted / (stats.totalAssignments + stats.totalCompleted)) * 100
    : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const statCards = [
    { title: 'Total Assignments', value: stats.totalAssignments, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-500' },
    { title: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-500' },
    { title: 'Pending', value: stats.pending, icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-500' },
    { title: 'Completed', value: stats.totalCompleted, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-3 rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task List with Tabs */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex space-x-2">
            <Button
              variant={activeTab === 'assignments' ? 'default' : 'outline'}
              onClick={() => setActiveTab('assignments')}
            >
              Task Assignments
              {taskAssignments && taskAssignments.length > 0 && (
                <Badge variant="secondary" className="ml-2">{taskAssignments.length}</Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'completed' ? 'default' : 'outline'}
              onClick={() => setActiveTab('completed')}
            >
              Completed Tasks
              {completedTasks && completedTasks.length > 0 && (
                <Badge variant="secondary" className="ml-2">{completedTasks.length}</Badge>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : !tasks || tasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No {activeTab === 'assignments' ? 'task assignments' : 'completed tasks'} found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead>
                      <TableHead>Task Code</TableHead>
                      <TableHead>Farm ID</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Date Worked</TableHead>
                      <TableHead>Status</TableHead>
                      {activeTab === 'completed' && <TableHead>Completed At</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task: any) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          {task.worker?.name || task.worker?.full_name || task.worker_name || 'N/A'}
                        </TableCell>
                        <TableCell>{task.task_code}</TableCell>
                        <TableCell>{task.farm_id}</TableCell>
                        <TableCell>{task.quantity}</TableCell>
                        <TableCell>{task.total_amount}</TableCell>
                        <TableCell>{new Date(task.date_worked).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        {activeTab === 'completed' && (
                          <TableCell>
                            {task.completed_at ? new Date(task.completed_at).toLocaleString() : 'N/A'}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Progress Summary */}
      {taskAssignments && taskAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Task Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-semibold">{completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
                <p className="text-sm text-muted-foreground font-medium">Pending Tasks</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                <p className="text-sm text-muted-foreground font-medium">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                <p className="text-sm text-muted-foreground font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
