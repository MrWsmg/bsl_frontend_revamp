"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TrendingUp, TrendingDown, Minus, Users, RefreshCw, AlertCircle,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const GmPerformanceSection: React.FC = () => {
  const [farmId,       setFarmId]       = useState('');
  const [personFilter, setPersonFilter] = useState('');
  const [roleFilter,   setRoleFilter]   = useState('');

  const fetchFarms = useCallback(() => apiService.getFarms('admin'), []);
  const { data: farms } = useApi(fetchFarms);
  const farmList = Array.isArray(farms) ? farms : [];

  const buildParams = useCallback(() => {
    const p: Record<string, any> = {};
    if (farmId)       p.farm_id = parseInt(farmId);
    if (personFilter) p.person  = personFilter;
    if (roleFilter)   p.role    = roleFilter;
    return p;
  }, [farmId, personFilter, roleFilter]);

  const fetch = useCallback(() => apiService.getGmPerformanceIndicators(buildParams()), [buildParams]);
  const { data: raw, loading, error, refetch } = useApi<any>(fetch);

  const rows: any[] = Array.isArray(raw)
    ? raw
    : (raw as any)?.indicators ?? (raw as any)?.data ?? (raw as any)?.results ?? [];

  const inputCls = 'border border-input rounded-md px-3 py-2 text-sm bg-background';

  const trendIcon = (trend?: string) => {
    if (trend === 'up')   return <TrendingUp   className="w-4 h-4 text-success inline" />;
    if (trend === 'down') return <TrendingDown  className="w-4 h-4 text-destructive inline" />;
    return                       <Minus         className="w-4 h-4 text-muted-foreground inline" />;
  };

  const scoreBadge = (score?: number | null) => {
    if (score == null) return <span className="text-muted-foreground">—</span>;
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        score >= 80 ? 'bg-success/20 text-success' :
        score >= 60 ? 'bg-warning/20 text-warning' :
        'bg-destructive/20 text-destructive'
      }`}>
        {score}%
      </span>
    );
  };

  return (
    <div className="space-y-4 p-6">
      <div>
        <h2 className="text-xl font-bold">Performance Indicators</h2>
        <p className="text-sm text-muted-foreground">KPIs per farm, supervisor, and manager</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Farm</label>
              <Select value={farmId ? String(farmId) : '__all__'} onValueChange={(val) => setFarmId(val === '__all__' ? '' : val)}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="All farms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All farms</SelectItem>
                  {farmList.map((f: any) => {
                    const fid = f.id ?? f.farm_id;
                    return <SelectItem key={fid} value={String(fid)}>{f.name}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Role</label>
              <Select value={roleFilter ? String(roleFilter) : '__all__'} onValueChange={(val) => setRoleFilter(val === '__all__' ? '' : val)}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="All roles" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All roles</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="farm_clerk">Farm Clerk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
              <Input
                placeholder="Filter by name"
                value={personFilter}
                onChange={e => setPersonFilter(e.target.value)}
                className="text-sm w-44"
              />
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
          ) : rows.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No performance data found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <th className="text-left px-3 py-2">Person</th>
                    <th className="text-left px-3 py-2">Role</th>
                    <th className="text-left px-3 py-2">Farm</th>
                    <th className="text-right px-3 py-2">Score</th>
                    <th className="text-right px-3 py-2">Trend</th>
                    <th className="text-left px-3 py-2">Period</th>
                    <th className="text-left px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r: any, i: number) => (
                    <tr key={r.id ?? i} className="hover:bg-muted/50">
                      <td className="px-3 py-2 font-medium">
                        {r.person_name ?? r.full_name ?? r.name ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground capitalize">
                        {r.role ?? r.person_role ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {r.farm_name ?? r.farm ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right">{scoreBadge(r.score ?? r.kpi_score)}</td>
                      <td className="px-3 py-2 text-right">{trendIcon(r.trend)}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">
                        {r.period ?? r.review_period ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs max-w-xs truncate">
                        {r.notes ?? r.remarks ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
