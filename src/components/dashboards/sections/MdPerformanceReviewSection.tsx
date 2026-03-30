"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const MdPerformanceReviewSection: React.FC = () => {
  const [personFilter, setPersonFilter] = useState('');
  const [roleFilter, setRoleFilter]     = useState('');
  const [farmId, setFarmId]             = useState('');

  const fetchFarms = useCallback(() => apiService.getFarms('admin'), []);
  const { data: farms } = useApi(fetchFarms);
  const farmList = Array.isArray(farms) ? farms : [];

  const buildParams = useCallback(() => {
    const p: Record<string, any> = {};
    if (personFilter) p.person   = personFilter;
    if (roleFilter)   p.role     = roleFilter;
    if (farmId)       p.farm_id  = parseInt(farmId);
    return p;
  }, [personFilter, roleFilter, farmId]);

  const fetch = useCallback(() => apiService.getMdPerformanceReview(buildParams()), [buildParams]);
  const { data: raw, loading, error, refetch } = useApi<any>(fetch);

  const rows: any[] = Array.isArray(raw)
    ? raw
    : (raw as any)?.reviews ?? (raw as any)?.data ?? [];

  const inputCls = 'border border-gray-200 rounded-md px-3 py-2 text-sm bg-white';

  const trendIcon = (trend: string | undefined) => {
    if (trend === 'up')   return <TrendingUp className="w-4 h-4 text-green-600 inline" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600 inline" />;
    return <Minus className="w-4 h-4 text-gray-400 inline" />;
  };

  const scoreBadge = (score: number | null | undefined) => {
    if (score == null) return <span className="text-gray-400">—</span>;
    const cls =
      score >= 80 ? 'bg-green-100 text-green-700' :
      score >= 60 ? 'bg-amber-100 text-amber-700' :
                   'bg-red-100 text-red-700';
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
        {score}%
      </span>
    );
  };

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" /> Performance Review — Supervisors & Managers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name / ID</label>
              <Input
                placeholder="Search person…"
                value={personFilter}
                onChange={e => setPersonFilter(e.target.value)}
                className="text-sm w-44"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className={inputCls}
              >
                <option value="">All roles</option>
                <option value="manager">Manager</option>
                <option value="supervisor">Supervisor</option>
                <option value="sub_supervisor">Sub-Supervisor</option>
                <option value="farm_clerk">Farm Clerk</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Farm</label>
              <select
                value={farmId}
                onChange={e => setFarmId(e.target.value)}
                className={inputCls}
              >
                <option value="">All farms</option>
                {farmList.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <Button size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
          ) : rows.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No performance data found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Role</th>
                    <th className="text-left px-3 py-2">Farm</th>
                    <th className="text-right px-3 py-2">Attendance</th>
                    <th className="text-right px-3 py-2">Tasks Done</th>
                    <th className="text-right px-3 py-2">Score</th>
                    <th className="text-center px-3 py-2">Trend</th>
                    <th className="text-left px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r: any, i: number) => (
                    <tr key={r.person_id ?? r.id ?? i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-800">
                        {r.name ?? r.full_name ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-600 capitalize">
                        {(r.role ?? '—').replace(/_/g, ' ')}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {r.farm_name ?? r.farm ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {r.attendance_pct != null ? `${r.attendance_pct}%` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {r.tasks_completed ?? r.tasks_done ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {scoreBadge(r.performance_score ?? r.score)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {trendIcon(r.trend)}
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs max-w-xs truncate">
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
