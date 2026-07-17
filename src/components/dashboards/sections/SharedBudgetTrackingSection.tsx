"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, AlertCircle, Users, Package, ShoppingCart, Receipt, RefreshCw } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => `TZS ${(n ?? 0).toLocaleString()}`;
const pct = (spent: number, alloc: number) =>
  alloc > 0 ? Math.min(100, Math.round((spent / alloc) * 100)) : 0;
const barColor = (p: number) =>
  p >= 90 ? 'bg-red-500' : p >= 70 ? 'bg-yellow-500' : 'bg-green-500';
const textColor = (p: number) =>
  p >= 90 ? 'text-red-600' : p >= 70 ? 'text-yellow-600' : 'text-green-600';

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'payroll',     label: 'Payroll',     icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
  { key: 'stock',       label: 'Stock',       icon: Package,     color: 'text-green-600',  bg: 'bg-green-50'  },
  { key: 'procurement', label: 'Procurement', icon: ShoppingCart,color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'expenses',    label: 'Expenses',    icon: Receipt,     color: 'text-orange-600', bg: 'bg-orange-50' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  userRole: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SharedBudgetTrackingSection: React.FC<Props> = ({ userRole }) => {
  const allFarms = ['admin','general_manager','managing_director'].includes(userRole);

  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [farmId, setFarmId] = useState('');

  // ── Farms ──
  const getFarms = useCallback(() =>
    allFarms ? apiService.getFarms() : apiService.getManagerFarms(),
    [allFarms]
  );
  const { data: farmsRaw } = useApi(getFarms);
  const farms: any[] = (Array.isArray(farmsRaw) ? farmsRaw : [])
    .map((f: any) => ({ id: f.id ?? f.farm_id, name: f.name }))
    .filter((f: any) => f.id != null);

  // ── Tracking ──
  const fetchTracking = useCallback(() =>
    apiService.getBudgetTracking({
      period,
      farm_id: farmId ? Number(farmId) : undefined,
    }),
    [period, farmId]
  );
  const { data: tracking, loading, error, refetch } = useApi(fetchTracking, {
    dependencies: [period, farmId],
  });

  const farms_data: any[] = Array.isArray(tracking)
    ? tracking
    : tracking?.farms ?? (tracking ? [tracking] : []);

  return (
    <div className="space-y-5">

      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Period */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {(['monthly','weekly','yearly'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 font-medium capitalize transition-colors ${
                period === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >{p}</button>
          ))}
        </div>

        {/* Farm filter */}
        <Select value={farmId ? String(farmId) : '__all__'} onValueChange={(val) => setFarmId(val === '__all__' ? '' : val)}>
          <SelectTrigger className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"><SelectValue placeholder="All farms" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All farms</SelectItem>
            {farms.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <button onClick={() => refetch()} disabled={loading}
          className="p-2 border border-gray-200 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      ) : farms_data.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-200">
          <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No tracking data for selected period</p>
        </div>
      ) : (
        <div className="space-y-6">
          {farms_data.map((fd: any, fi: number) => {
            const totalAlloc = fd.budget_allocated || 0;
            const totalSpent = fd.budget_spent || 0;
            const totalP = pct(totalSpent, totalAlloc);
            const blocks: any[] = Array.isArray(fd.blocks) ? fd.blocks : [];
            const transactions: any[] = Array.isArray(fd.recent_transactions) ? fd.recent_transactions : [];

            return (
              <div key={fd.farm_id ?? fi} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Farm header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base">{fd.farm_name || `Farm #${fd.farm_id}`}</h3>
                      <p className="text-xs text-gray-400 capitalize mt-0.5">{period} budget</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{fmt(totalSpent)}</p>
                      <p className="text-xs text-gray-400">of {fmt(totalAlloc)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1">
                    <div className={`h-2.5 rounded-full transition-all ${barColor(totalP)}`} style={{ width: `${totalP}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{totalP}% spent</span>
                    <span>Remaining: {fmt(totalAlloc - totalSpent)}</span>
                  </div>
                </div>

                {/* Category breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100">
                  {CATEGORIES.map(cat => {
                    const alloc = fd[`${cat.key}_budget`] || 0;
                    const spent = fd[`${cat.key}_spent`] || 0;
                    const p = pct(spent, alloc);
                    const Icon = cat.icon;
                    if (alloc === 0 && spent === 0) return null;
                    return (
                      <div key={cat.key} className={`${cat.bg} p-4`}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Icon className={`w-4 h-4 ${cat.color}`} />
                          <span className="text-xs font-medium text-gray-700">{cat.label}</span>
                        </div>
                        <div className="w-full bg-white/60 rounded-full h-1.5 mb-2">
                          <div className={`h-1.5 rounded-full ${barColor(p)}`} style={{ width: `${p}%` }} />
                        </div>
                        <p className="text-xs font-semibold text-gray-800">{fmt(spent)}</p>
                        <p className="text-xs text-gray-400">of {fmt(alloc)}</p>
                        <p className={`text-xs font-medium mt-0.5 ${textColor(p)}`}>{p}%</p>
                      </div>
                    );
                  })}
                </div>

                {/* Block table */}
                {blocks.length > 0 && (
                  <div className="p-5 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Block Breakdown</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            <th className="text-left pb-2">Block</th>
                            <th className="text-right pb-2">Allocated</th>
                            <th className="text-right pb-2">Payroll Spent</th>
                            <th className="pb-2 w-32">Progress</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {blocks.map((bl: any, bi: number) => {
                            const bp = pct(bl.payroll_spent || 0, bl.payroll_budget || bl.budget_allocated || 0);
                            return (
                              <tr key={bl.block_id ?? bi} className="hover:bg-gray-50">
                                <td className="py-2 font-medium text-gray-800">{bl.block_name || `Block #${bl.block_id}`}</td>
                                <td className="py-2 text-right text-gray-600">{fmt(bl.budget_allocated)}</td>
                                <td className="py-2 text-right text-red-600">{fmt(bl.payroll_spent || 0)}</td>
                                <td className="py-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                      <div className={`h-1.5 rounded-full ${barColor(bp)}`} style={{ width: `${bp}%` }} />
                                    </div>
                                    <span className="text-xs text-gray-400 w-7 text-right">{bp}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Recent transactions */}
                {transactions.length > 0 && (
                  <div className="p-5 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Recent Transactions</h4>
                    <div className="space-y-2">
                      {transactions.map((tx: any, ti: number) => (
                        <div key={tx.id ?? ti} className="flex items-center justify-between py-1.5">
                          <div>
                            <p className="text-sm text-gray-800">{tx.description || tx.type || 'Transaction'}</p>
                            <p className="text-xs text-gray-400">{tx.date || tx.created_at || ''}</p>
                          </div>
                          <p className={`text-sm font-semibold ${
                            (tx.type === 'credit' || tx.amount < 0) ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(tx.type === 'credit' || tx.amount < 0) ? '+' : '-'}{fmt(Math.abs(tx.amount || 0))}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
