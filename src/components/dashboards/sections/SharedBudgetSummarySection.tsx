"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight, TreePine, AlertCircle } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => `TZS ${(n ?? 0).toLocaleString()}`;
const pct = (spent: number, alloc: number) =>
  alloc > 0 ? Math.min(100, Math.round((spent / alloc) * 100)) : 0;

function ProgressBar({ spent, alloc }: { spent: number; alloc: number }) {
  const p = pct(spent, alloc);
  const color = p >= 90 ? 'bg-red-500' : p >= 70 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${p}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{p}%</span>
    </div>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  userRole: string;
}

// ── Tree node components ───────────────────────────────────────────────────────

function WeekNode({ week }: { week: any }) {
  return (
    <div className="flex items-center justify-between py-1.5 pl-16 pr-4 hover:bg-gray-50 rounded text-sm">
      <span className="text-gray-600">
        Week {week.week_number || ''} · {week.week_start || ''}
      </span>
      <div className="flex items-center gap-6">
        <span className="text-xs text-gray-500 w-28 text-right">{fmt(week.budget_allocated)}</span>
        <ProgressBar spent={week.budget_spent || 0} alloc={week.budget_allocated || 0} />
      </div>
    </div>
  );
}

function MonthNode({ month }: { month: any }) {
  const [open, setOpen] = useState(false);
  const weeks: any[] = Array.isArray(month.weeks) ? month.weeks : [];

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-2 pl-8 pr-4 hover:bg-gray-50 rounded"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          {MONTHS[(month.month ?? 1) - 1]} {month.fiscal_year ? `(FY${month.fiscal_year})` : ''}
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm text-gray-800 w-28 text-right">{fmt(month.budget_allocated)}</span>
          <ProgressBar spent={month.budget_spent || 0} alloc={month.budget_allocated || 0} />
        </div>
      </button>
      {open && weeks.length > 0 && (
        <div>
          {weeks.map((w: any, i: number) => <WeekNode key={w.id ?? i} week={w} />)}
        </div>
      )}
    </div>
  );
}

function YearNode({ year }: { year: any }) {
  const [open, setOpen] = useState(true);
  const months: any[] = Array.isArray(year.months) ? year.months : [];

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 font-semibold text-gray-900">
          {open ? <ChevronDown className="w-4 h-4 text-blue-500" /> : <ChevronRight className="w-4 h-4 text-blue-500" />}
          <TreePine className="w-4 h-4 text-green-600" />
          FY{year.fiscal_year} Yearly Budget — {year.farm_name || `Farm #${year.farm_id}`}
        </div>
        <div className="flex items-center gap-6">
          <span className="font-bold text-gray-900 w-32 text-right">{fmt(year.budget_allocated)}</span>
          <ProgressBar spent={year.budget_spent || 0} alloc={year.budget_allocated || 0} />
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
            year.status === 'active' ? 'bg-green-100 text-green-700' :
            year.status === 'closed' ? 'bg-gray-100 text-gray-500' :
                                       'bg-yellow-100 text-yellow-700'
          }`}>{year.status || 'draft'}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-50 py-1">
          {months.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No monthly budgets</p>
          ) : months.map((m: any, i: number) => (
            <MonthNode key={m.id ?? i} month={m} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export const SharedBudgetSummarySection: React.FC<Props> = ({ userRole }) => {
  const allFarms = ['admin','general_manager','managing_director'].includes(userRole);

  const [farmId, setFarmId] = useState('');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());

  // ── Farms ──
  const getFarms = useCallback(() => {
    if (allFarms) return apiService.getFarms();
    if (userRole === 'supervisor') return apiService.getFarms('supervisor');
    return apiService.getManagerFarms();
  }, [allFarms, userRole]);
  const { data: farmsRaw } = useApi(getFarms);
  const farms: any[] = (Array.isArray(farmsRaw) ? farmsRaw : [])
    .map((f: any) => ({ id: f.id ?? f.farm_id, name: f.name }))
    .filter((f: any) => f.id != null);

  // ── Summary ──
  const fetchSummary = useCallback(() => {
    if (!farmId) return Promise.resolve(null);
    return apiService.getBudgetSummary(Number(farmId), fiscalYear);
  }, [farmId, fiscalYear]);
  const { data: summary, loading, error } = useApi(fetchSummary, {
    dependencies: [farmId, fiscalYear],
  });

  const years: any[] = Array.isArray(summary) ? summary : (summary ? [summary] : []);

  return (
    <div className="space-y-5">
      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Farm</label>
          <Select value={String(farmId ?? '')} onValueChange={(val) => setFarmId(val)}>
            <SelectTrigger className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white min-w-[180px]"><SelectValue placeholder="Select farm…" /></SelectTrigger>
            <SelectContent>
              {farms.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Fiscal Year</label>
          <input type="number" value={fiscalYear} min={2020} max={2040}
            onChange={e => setFiscalYear(Number(e.target.value))}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm w-24 bg-white" />
        </div>
      </div>

      {/* ── Tree ── */}
      {!farmId ? (
        <div className="text-center py-16 text-gray-400">
          <TreePine className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a farm to view its budget summary</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      ) : years.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-200">
          <TreePine className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No budget data for FY{fiscalYear}</p>
        </div>
      ) : (
        <div>
          {years.map((y: any, i: number) => <YearNode key={y.id ?? i} year={y} />)}
        </div>
      )}
    </div>
  );
};
