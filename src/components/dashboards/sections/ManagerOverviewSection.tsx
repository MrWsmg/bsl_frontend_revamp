"use client";

// Manager Overview section component - shadcn patterns
import React, { useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Users, Briefcase, ClipboardList, Package, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const ManagerOverviewSection: React.FC = () => {
  const getFarms = useCallback(() => apiService.getManagerFarms(), []);
  const getUsers = useCallback(() => apiService.getManagerUsers(), []);
  const getWorkers = useCallback(() => apiService.getManagerWorkers(), []);
  const getPendingPayroll = useCallback(() => apiService.getManagerPendingPayroll(), []);
  const getTaskAssignments = useCallback(() => apiService.getManagerTaskAssignments(), []);
  const getItemRequests = useCallback(() => apiService.getManagerItemRequests(), []);

  const { data: farms, loading: farmsLoading } = useApi(getFarms);
  const { data: users, loading: usersLoading } = useApi(getUsers);
  const { data: workers, loading: workersLoading } = useApi(getWorkers);
  const { data: pendingPayroll, loading: payrollLoading } = useApi(getPendingPayroll);
  const { data: taskAssignments, loading: tasksLoading } = useApi(getTaskAssignments);
  const { data: itemRequests, loading: requestsLoading } = useApi(getItemRequests);

  const loading = farmsLoading || usersLoading || workersLoading ||
                  payrollLoading || tasksLoading || requestsLoading;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = [
    {
      title: 'Farms Managed',
      value: farms?.length || 0,
      icon: Briefcase,
      color: 'text-blue-600',
      bg: 'bg-blue-500'
    },
    {
      title: 'Team Members',
      value: users?.length || 0,
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-500'
    },
    {
      title: 'Workers',
      value: workers?.length || 0,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-500'
    },
    {
      title: 'Pending Payroll',
      value: pendingPayroll?.length || 0,
      icon: DollarSign,
      color: 'text-yellow-600',
      bg: 'bg-yellow-500'
    },
    {
      title: 'Active Tasks',
      value: taskAssignments?.filter((t: any) => t.status === 'in_progress').length || 0,
      icon: ClipboardList,
      color: 'text-indigo-600',
      bg: 'bg-indigo-500'
    },
    {
      title: 'Pending Requests',
      value: itemRequests?.filter((r: any) => r.status === 'pending').length || 0,
      icon: Package,
      color: 'text-orange-600',
      bg: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
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

      {/* Farm Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Farm Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {farms && farms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {farms.map((farm: any, idx: number) => (
                <Card key={farm.id ?? farm.farm_id ?? idx} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-foreground text-lg">{farm.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{farm.location}</p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="text-muted-foreground">Crops:</span>
                        <Badge variant="secondary" className="ml-2">{farm.crops}</Badge>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-muted-foreground">Total Area:</span>
                        <span className="ml-2 font-medium text-blue-600">
                          {Math.round(farm.total_area * 10) / 10} acres
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No farms assigned</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
              <p className="text-sm text-muted-foreground font-medium">Completed Tasks</p>
              <p className="text-2xl font-bold text-green-600">
                {taskAssignments?.filter((t: any) => t.status === 'completed').length || 0}
              </p>
            </div>
            <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
              <p className="text-sm text-muted-foreground font-medium">Pending Tasks</p>
              <p className="text-2xl font-bold text-yellow-600">
                {taskAssignments?.filter((t: any) => t.status === 'pending').length || 0}
              </p>
            </div>
            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
              <p className="text-sm text-muted-foreground font-medium">Total Workers</p>
              <p className="text-2xl font-bold text-blue-600">{workers?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
