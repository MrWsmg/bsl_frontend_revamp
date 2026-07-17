"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, BarChart3, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';

type SubTab = 'expenditure' | 'combined' | 'quickbooks';

export const GmFinancialMonitoringSection: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('expenditure');

  const tabs: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'expenditure', label: 'Expenditure',    icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'combined',    label: 'Combined Farm',  icon: <BarChart3  className="w-3.5 h-3.5" /> },
    { id: 'quickbooks',  label: 'QuickBooks',     icon: <BookOpen   className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-4 p-6">
      <div>
        <h2 className="text-xl font-bold">Financial Monitoring</h2>
        <p className="text-sm text-muted-foreground">Block-level and farm-level expenditure vs approved budgets</p>
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              subTab === t.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'expenditure' && <ExpenditureView />}
      {subTab === 'combined'    && <CombinedFarmView />}
      {subTab === 'quickbooks'  && <QuickBooksView />}
    </div>
  );
};

// ── Expenditure ────────────────────────────────────────────────────────────────

const ExpenditureView: React.FC = () => {
  const [farmId,   setFarmId]   = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

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

  const fetch = useCallback(() => apiService.getGmExpenditure(buildParams()), [buildParams]);
  const { data: raw, loading, error, refetch } = useApi<any>(fetch);

  const rows: any[] = Array.isArray(raw)
    ? raw
    : (raw as any)?.farms ?? (raw as any)?.blocks ?? (raw as any)?.data ?? [];

  const inputCls = 'border border-input rounded-md px-3 py-2 text-sm bg-background';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" /> Expenditure — Block / Daily / YTD
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <label className="block text-xs font-medium text-muted-foreground mb-1">From</label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">To</label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm" />
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {error && <ErrorBanner message={error} />}

        {loading ? (
          <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<TrendingUp className="w-8 h-8" />} message="No expenditure data found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="text-left px-3 py-2">Farm / Block</th>
                  <th className="text-right px-3 py-2">Daily Spend</th>
                  <th className="text-right px-3 py-2">YTD Spend</th>
                  <th className="text-right px-3 py-2">Budget</th>
                  <th className="text-right px-3 py-2">Utilisation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r: any, i: number) => {
                  const utilPct = r.budget_allocated > 0
                    ? Math.round((r.ytd_spend / r.budget_allocated) * 100)
                    : null;
                  return (
                    <tr key={r.farm_id ?? r.block_id ?? i} className="hover:bg-muted/50">
                      <td className="px-3 py-2 font-medium">
                        {r.farm_name ?? r.block_name ?? r.farm ?? '—'}
                        {r.block_name && r.farm_name && (
                          <span className="ml-1 text-xs text-muted-foreground">({r.farm_name})</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {r.daily_spend != null ? Number(r.daily_spend).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {r.ytd_spend != null ? Number(r.ytd_spend).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {r.budget_allocated != null ? Number(r.budget_allocated).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {utilPct != null ? (
                          <UtilBadge pct={utilPct} />
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

// ── Combined Farm ─────────────────────────────────────────────────────────────

const CombinedFarmView: React.FC = () => {
  const fetch = useCallback(() => apiService.getGmCombinedFarm(), []);
  const { data: raw, loading, error, refetch } = useApi<any>(fetch);
  const rows: any[] = Array.isArray(raw)
    ? raw
    : (raw as any)?.farms ?? (raw as any)?.data ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-600" /> All Farms — Expenditure vs Approved Budgets
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <ErrorBanner message={error} />}
        {loading ? (
          <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<BarChart3 className="w-8 h-8" />} message="No combined data available" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="text-left px-3 py-2">Farm</th>
                  <th className="text-right px-3 py-2">Approved Budget</th>
                  <th className="text-right px-3 py-2">Spent</th>
                  <th className="text-right px-3 py-2">Remaining</th>
                  <th className="text-right px-3 py-2">Utilisation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r: any, i: number) => {
                  const budget    = r.budget_approved ?? r.approved_budget ?? r.budget_allocated ?? 0;
                  const spent     = r.expenditure ?? r.spent ?? 0;
                  const remaining = budget - spent;
                  const utilPct   = budget > 0 ? Math.round((spent / budget) * 100) : null;
                  return (
                    <tr key={r.farm_id ?? i} className="hover:bg-muted/50">
                      <td className="px-3 py-2 font-medium">{r.farm_name ?? r.farm ?? '—'}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {budget ? Number(budget).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {spent ? Number(spent).toLocaleString() : '—'}
                      </td>
                      <td className={`px-3 py-2 text-right ${remaining < 0 ? 'text-destructive' : 'text-success'}`}>
                        {budget ? Number(remaining).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {utilPct != null ? <UtilBadge pct={utilPct} /> : '—'}
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

type QbSheet = 'p_and_l' | 'balance_sheet' | 'cash_flow' | 'budget_vs_actual';

const QB_SHEETS: { id: QbSheet; label: string }[] = [
  { id: 'p_and_l',          label: 'P&L' },
  { id: 'balance_sheet',    label: 'Balance Sheet' },
  { id: 'cash_flow',        label: 'Cash Flow' },
  { id: 'budget_vs_actual', label: 'Budget vs Actual' },
];

const QuickBooksView: React.FC = () => {
  const [sheet, setSheet] = useState<QbSheet>('p_and_l');

  const fetch = useCallback(() => apiService.getGmQuickbooks(), []);
  const { data: raw, loading, error, refetch } = useApi<any>(fetch);

  const sheetData: any = (raw as any)?.[sheet] ?? (raw as any)?.data ?? raw;
  const rows: any[] = Array.isArray(sheetData)
    ? sheetData
    : sheetData?.rows ?? sheetData?.entries ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-green-600" /> Financial Sheets
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit flex-wrap">
          {QB_SHEETS.map(s => (
            <button
              key={s.id}
              onClick={() => setSheet(s.id)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                sheet === s.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {error && <ErrorBanner message={error} />}
        {loading ? (
          <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<BookOpen className="w-8 h-8" />} message="No data for this sheet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="text-left px-3 py-2">Account / Category</th>
                  <th className="text-right px-3 py-2">Amount (TZS)</th>
                  {rows[0]?.variance != null && <th className="text-right px-3 py-2">Variance</th>}
                  {rows[0]?.notes     != null && <th className="text-left px-3 py-2">Notes</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-medium">{r.account ?? r.category ?? r.label ?? '—'}</td>
                    <td className="px-3 py-2 text-right">
                      {r.amount != null ? Number(r.amount).toLocaleString() : '—'}
                    </td>
                    {r.variance != null && (
                      <td className={`px-3 py-2 text-right ${r.variance < 0 ? 'text-destructive' : 'text-success'}`}>
                        {Number(r.variance).toLocaleString()}
                      </td>
                    )}
                    {r.notes != null && (
                      <td className="px-3 py-2 text-muted-foreground text-xs">{r.notes}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── Shared helpers ────────────────────────────────────────────────────────────

const UtilBadge = ({ pct }: { pct: number }) => (
  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
    pct > 100 ? 'bg-destructive/20 text-destructive' :
    pct > 80  ? 'bg-warning/20 text-warning' :
    'bg-success/20 text-success'
  }`}>
    {pct}%
  </span>
);

const ErrorBanner = ({ message }: { message: string }) => (
  <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {message}
  </div>
);

const EmptyState = ({ icon, message }: { icon: React.ReactNode; message: string }) => (
  <div className="text-center py-10 text-muted-foreground">
    <div className="mx-auto mb-2 opacity-40 w-fit">{icon}</div>
    <p className="text-sm">{message}</p>
  </div>
);
