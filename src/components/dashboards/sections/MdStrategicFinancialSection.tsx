"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, RefreshCw, AlertCircle, BarChart3, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

type SubTab = 'expenditure' | 'combined' | 'quickbooks';

export const MdStrategicFinancialSection: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('expenditure');

  const tabs: { id: SubTab; label: string }[] = [
    { id: 'expenditure', label: 'Expenditure' },
    { id: 'combined',    label: 'Combined View' },
    { id: 'quickbooks',  label: 'QuickBooks' },
  ];

  return (
    <div className="space-y-4 p-6">
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              subTab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'expenditure' && <ExpenditureView />}
      {subTab === 'combined'    && <CombinedView />}
      {subTab === 'quickbooks'  && <QuickBooksView />}
    </div>
  );
};

// ── Expenditure ───────────────────────────────────────────────────────────────

const ExpenditureView: React.FC = () => {
  const [farmId, setFarmId]     = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const fetchFarms = useCallback(() => apiService.getFarms('admin'), []);
  const { data: farms } = useApi(fetchFarms);
  const farmList = Array.isArray(farms) ? farms : [];

  const buildParams = useCallback(() => {
    const p: Record<string, any> = {};
    if (farmId)   p.farm_id   = parseInt(farmId);
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo)   p.date_to   = dateTo;
    return p;
  }, [farmId, dateFrom, dateTo]);

  const fetch = useCallback(() => apiService.getMdStrategicExpenditure(buildParams()), [buildParams]);
  const { data: raw, loading, error, refetch } = useApi<any>(fetch);

  const rows: any[] = Array.isArray(raw) ? raw : (raw as any)?.farms ?? (raw as any)?.data ?? [];

  const inputCls = 'border border-gray-200 rounded-md px-3 py-2 text-sm bg-white';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" /> Expenditure — Daily & YTD
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Farm</label>
            <select value={farmId} onChange={e => setFarmId(e.target.value)} className={inputCls}>
              <option value="">All farms</option>
              {farmList.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm" />
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
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
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No expenditure data found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-3 py-2">Farm</th>
                  <th className="text-right px-3 py-2">Daily Spend</th>
                  <th className="text-right px-3 py-2">YTD Spend</th>
                  <th className="text-right px-3 py-2">Budget</th>
                  <th className="text-right px-3 py-2">Utilisation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r: any, i: number) => {
                  const utilPct = r.budget_allocated > 0
                    ? Math.round((r.ytd_spend / r.budget_allocated) * 100)
                    : null;
                  return (
                    <tr key={r.farm_id ?? i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-800">{r.farm_name ?? r.farm ?? '—'}</td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {r.daily_spend != null ? Number(r.daily_spend).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800">
                        {r.ytd_spend != null ? Number(r.ytd_spend).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-500">
                        {r.budget_allocated != null ? Number(r.budget_allocated).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {utilPct != null ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            utilPct > 100 ? 'bg-red-100 text-red-700' :
                            utilPct > 80  ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {utilPct}%
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── Combined ──────────────────────────────────────────────────────────────────

const CombinedView: React.FC = () => {
  const fetch = useCallback(() => apiService.getMdStrategicCombined(), []);
  const { data: raw, loading, error, refetch } = useApi<any>(fetch);
  const rows: any[] = Array.isArray(raw) ? raw : (raw as any)?.farms ?? (raw as any)?.data ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-600" /> All Farms — Expenditure vs Budget
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mb-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No combined data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-3 py-2">Farm</th>
                  <th className="text-right px-3 py-2">Budget</th>
                  <th className="text-right px-3 py-2">Spent</th>
                  <th className="text-right px-3 py-2">Remaining</th>
                  <th className="text-right px-3 py-2">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r: any, i: number) => {
                  const spent     = Number(r.actual_spend ?? r.spent ?? 0);
                  const budget    = Number(r.budget_allocated ?? r.budget ?? 0);
                  const remaining = budget - spent;
                  const pct       = budget > 0 ? Math.round((spent / budget) * 100) : null;
                  return (
                    <tr key={r.farm_id ?? i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-800">{r.farm_name ?? r.farm ?? '—'}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{budget > 0 ? budget.toLocaleString() : '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800">{spent > 0 ? spent.toLocaleString() : '—'}</td>
                      <td className={`px-3 py-2 text-right font-medium ${remaining < 0 ? 'text-red-600' : 'text-green-700'}`}>
                        {budget > 0 ? remaining.toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {pct != null ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            pct > 100 ? 'bg-red-100 text-red-700' :
                            pct > 85  ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>{pct}%</span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── QuickBooks ────────────────────────────────────────────────────────────────

const QuickBooksView: React.FC = () => {
  const fetch = useCallback(() => apiService.getMdStrategicQuickbooks(), []);
  const { data: raw, loading, error, refetch } = useApi<any>(fetch);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-green-600" /> QuickBooks Financial Overview
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mb-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
        ) : !raw ? (
          <div className="text-center py-10 text-gray-400">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No QuickBooks data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(raw as Record<string, any>).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}</p>
                <p className="text-sm font-semibold text-gray-900">
                  {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
