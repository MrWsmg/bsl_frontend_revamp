"use client";

import React, { useCallback } from 'react';
import { useApi, useMultipleApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Users, TrendingUp, AlertCircle, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
  n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` :
  String(Math.round(n));

export const GmOverviewSection: React.FC = () => {
  const fetchFarms = useCallback(() => apiService.getFarms('admin'), []);
  const fetchWorkers = useCallback(() => apiService.analytics.getWorkerDistribution(), []);
  const fetchBudgets = useCallback(() => apiService.analytics.getBudgets('yearly'), []);

  const { data: farms, loading: farmsLoading, error: farmsError, refetch: refetchFarms } = useApi(fetchFarms);
  const { data: workerDist, loading: workersLoading, refetch: refetchWorkers } = useApi(fetchWorkers);
  const { data: budgets, loading: budgetsLoading, refetch: refetchBudgets } = useApi(fetchBudgets);

  const farmList: any[] = Array.isArray(farms) ? farms : [];
  const workerData: any[] = Array.isArray(workerDist) ? workerDist : [];
  const budgetList: any[] = Array.isArray(budgets) ? budgets : [];

  const totalWorkers = workerData.reduce((s, w) => s + (w.value ?? 0), 0);
  const totalBudget  = budgetList.reduce((s, b) => s + (b.budgetAllocated ?? 0), 0);
  const totalSpent   = budgetList.reduce((s, b) => s + (b.budgetSpent ?? 0), 0);
  const loading = farmsLoading || workersLoading || budgetsLoading;

  const handleRefresh = () => {
    refetchFarms();
    refetchWorkers();
    refetchBudgets();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">General Manager Overview</h2>
          <p className="text-sm text-muted-foreground">Across all farms and operations</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {farmsError && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {farmsError}
        </div>
      )}

      {/* Key metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-lg bg-muted p-3 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Farms</p>
              {farmsLoading ? <LoadingSpinner size="sm" /> : (
                <p className="text-3xl font-bold">{farmList.length}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-lg bg-muted p-3 text-accent">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Workers</p>
              {workersLoading ? <LoadingSpinner size="sm" /> : (
                <p className="text-3xl font-bold">{totalWorkers || '—'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-lg bg-muted p-3 text-success">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">YTD Budget Used</p>
              {budgetsLoading ? <LoadingSpinner size="sm" /> : (
                <div>
                  <p className="text-3xl font-bold">{totalBudget ? fmt(totalSpent) : '—'}</p>
                  {totalBudget > 0 && (
                    <p className="text-xs text-muted-foreground">of {fmt(totalBudget)} allocated</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Worker distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Worker Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {workersLoading ? (
              <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
            ) : workerData.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No worker data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={workerData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {workerData.map((_entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Farm list */}
        <Card>
          <CardHeader>
            <CardTitle>Farms</CardTitle>
          </CardHeader>
          <CardContent>
            {farmsLoading ? (
              <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
            ) : farmList.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No farms found</div>
            ) : (
              <div className="divide-y divide-border">
                {farmList.map((farm: any) => (
                  <div key={farm.id ?? farm.farm_id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{farm.name}</p>
                      {farm.location && (
                        <p className="text-xs text-muted-foreground">{farm.location}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {farm.crops && (
                        <Badge variant="secondary" className="text-xs">{farm.crops}</Badge>
                      )}
                      {farm.total_area != null && (
                        <span className="text-xs text-muted-foreground">{farm.total_area} ha</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget by farm */}
      {budgetList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Status by Farm (YTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <th className="text-left px-3 py-2">Farm</th>
                    <th className="text-right px-3 py-2">Allocated</th>
                    <th className="text-right px-3 py-2">Spent</th>
                    <th className="text-right px-3 py-2">Utilisation</th>
                    <th className="text-right px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {budgetList.map((b: any, i: number) => {
                    const pct = b.budgetAllocated > 0
                      ? Math.round((b.budgetSpent / b.budgetAllocated) * 100) : null;
                    const isOver = pct != null && pct > 100;
                    const isNear = pct != null && pct >= 85 && pct <= 100;
                    return (
                      <tr key={b.farmName ?? i} className="hover:bg-muted/50">
                        <td className="px-3 py-2 font-medium">{b.farmName ?? '—'}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {b.budgetAllocated != null ? Number(b.budgetAllocated).toLocaleString() : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {b.budgetSpent != null ? Number(b.budgetSpent).toLocaleString() : '—'}
                        </td>
                        <td className="px-3 py-2 text-right">{pct != null ? `${pct}%` : '—'}</td>
                        <td className="px-3 py-2 text-right">
                          {pct != null ? (
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                isOver ? 'bg-destructive/20 text-destructive' :
                                isNear ? 'bg-warning/20 text-warning' :
                                'bg-success/20 text-success'
                              }`}
                            >
                              {isOver ? 'Over' : isNear ? 'Near limit' : 'On track'}
                            </Badge>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
