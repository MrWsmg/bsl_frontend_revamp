"use client";

// Payroll Overview Section
import React, { useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { DollarSign, Users, FileText, TrendingUp, Wheat, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const PayrollOverviewSection: React.FC = () => {
  const getFarms = useCallback(() => apiService.getPayrollFarms(), []);
  const getWorkers = useCallback(() => apiService.getWorkers(), []);
  const getWeeklySummary = useCallback(() => apiService.getWeeklySummary(), []);

  const { data: farms, loading: farmsLoading } = useApi(getFarms);
  const { data: workers, loading: workersLoading } = useApi(getWorkers);
  const { data: weeklySummary, loading: summaryLoading } = useApi(getWeeklySummary);

  const loading = farmsLoading || workersLoading || summaryLoading;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activeWorkers = workers?.filter((w: any) => w.is_active)?.length || 0;
  const totalWorkers = workers?.length || 0;
  const totalFarms = farms?.length || 0;
  const weeklyTotal = weeklySummary?.total_amount || 0;
  const weeklyRecords = weeklySummary?.total_records || 0;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Farms</p>
                <p className="text-3xl font-bold mt-2">{totalFarms}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Workers</p>
                <p className="text-3xl font-bold mt-2">{activeWorkers}</p>
                <p className="text-xs text-muted-foreground mt-1">of {totalWorkers} total</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weekly Records</p>
                <p className="text-3xl font-bold mt-2">{weeklyRecords}</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weekly Total</p>
                <p className="text-2xl font-bold mt-2">
                  ${weeklyTotal.toLocaleString()}
                </p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Farms List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Farms</CardTitle>
          <CardDescription>Farms assigned to your payroll management</CardDescription>
        </CardHeader>
        <CardContent>
          {!farms || farms.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No farms assigned</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {farms.map((farm: any, index: number) => (
                <div
                  key={farm.id || `farm-${index}`}
                  className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Wheat className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold text-green-800 dark:text-green-200">{farm.name}</h4>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <MapPin className="w-3 h-3" />
                    <span>{farm.location || 'No location'}</span>
                  </div>
                  {farm.area && (
                    <p className="text-xs text-green-600 mt-2">Area: {farm.area} acres</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {weeklySummary && (
        <Card>
          <CardHeader>
            <CardTitle>This Week Summary</CardTitle>
            <CardDescription>Overview of payroll activity for the current week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600">Total Records</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200 mt-1">
                  {weeklySummary.total_records || 0}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600">Total Workers</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200 mt-1">
                  {weeklySummary.total_workers || 0}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-600">Average per Worker</p>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200 mt-1">
                  ${weeklySummary.average_per_worker?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
