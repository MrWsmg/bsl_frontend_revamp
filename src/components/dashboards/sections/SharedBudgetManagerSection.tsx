"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { SaturdayWeekPicker } from '../../common/SaturdayWeekPicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '../../ui/sonner';
import {
  Wallet, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Check, X, Package, Users, ShoppingCart, Receipt, Save,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

const PERIODS = ['yearly', 'monthly', 'weekly'] as const;
type Period = typeof PERIODS[number];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const BUDGET_ROLES_FULL = ['admin','manager','general_manager','managing_director','financial_controller'];

const fmt = (n: number) => `TZS ${(n ?? 0).toLocaleString()}`;
const pct = (spent: number, alloc: number) =>
  alloc > 0 ? Math.min(100, Math.round((spent / alloc) * 100)) : 0;
const barColor = (p: number) =>
  p >= 90 ? 'bg-red-500' : p >= 70 ? 'bg-yellow-500' : 'bg-green-500';

// ── Types ────────────────────────────────────────────────────────────────────

interface BudgetForm {
  farm_id: string;
  fiscal_year: string;
  month: string;          // 1–12, only for monthly
  week_start: string;     // Saturday ISO date, only for weekly
  budget_allocated: string;
  payroll_budget: string;
  stock_budget: string;
  procurement_budget: string;
  expenses_budget: string;
  notes: string;
  status: string;
  parent_budget_id: string;
}

function emptyForm(period: Period): BudgetForm {
  return {
    farm_id: '', fiscal_year: String(new Date().getFullYear()),
    month: '', week_start: '', budget_allocated: '',
    payroll_budget: '', stock_budget: '', procurement_budget: '', expenses_budget: '',
    notes: '', status: 'draft', parent_budget_id: '',
  };
}

const CATEGORY_KEYS = ['payroll_budget','stock_budget','procurement_budget','expenses_budget'] as const;
const CATEGORY_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  payroll_budget:     { label: 'Payroll',      icon: Users,       color: 'text-blue-600' },
  stock_budget:       { label: 'Stock',        icon: Package,     color: 'text-green-600' },
  procurement_budget: { label: 'Procurement',  icon: ShoppingCart,color: 'text-purple-600' },
  expenses_budget:    { label: 'Expenses',     icon: Receipt,     color: 'text-orange-600' },
};

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  userRole: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SharedBudgetManagerSection: React.FC<Props> = ({ userRole }) => {
  const canEdit = BUDGET_ROLES_FULL.includes(userRole);
  const allFarms = ['admin','general_manager','managing_director'].includes(userRole);

  const [period, setPeriod] = useState<Period>('yearly');
  const [farmFilter, setFarmFilter] = useState('');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BudgetForm>(emptyForm('yearly'));
  const [editingBudget, setEditingBudget] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);

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

  // ── Budgets ──
  const fetchBudgets = useCallback(() =>
    apiService.getBudgetsByPeriod({
      period,
      farm_id: farmFilter ? Number(farmFilter) : undefined,
      fiscal_year: fiscalYear,
    }),
    [period, farmFilter, fiscalYear]
  );
  const { data: budgetsRaw, loading, refetch } = useApi(fetchBudgets, {
    dependencies: [period, farmFilter, fiscalYear],
  });
  const budgets: any[] = Array.isArray(budgetsRaw) ? budgetsRaw : [];

  // ── Block budgets for expanded row ──
  const fetchBlocks = useCallback(() =>
    expandedBlock != null ? apiService.getBudgetBlocks(expandedBlock) : Promise.resolve([]),
    [expandedBlock]
  );
  const { data: blocksRaw, loading: blocksLoading, refetch: refetchBlocks } = useApi(fetchBlocks, {
    dependencies: [expandedBlock],
  });
  const blocks: any[] = Array.isArray(blocksRaw) ? blocksRaw : [];

  // ── Category sum validation ──
  const categorySum = (f: BudgetForm) =>
    ['payroll_budget','stock_budget','procurement_budget','expenses_budget']
      .reduce((s, k) => s + (Number((f as any)[k]) || 0), 0);

  const totalAllocated = budgets.reduce((s, b) => s + (b.budget_allocated || 0), 0);
  const totalSpent     = budgets.reduce((s, b) => s + (b.budget_spent     || 0), 0);

  // ── Form helpers ──
  const openCreate = () => {
    setEditingBudget(null);
    setForm({ ...emptyForm(period), farm_id: farmFilter });
    setShowForm(true);
  };

  const openEdit = (b: any) => {
    setEditingBudget(b);
    setForm({
      farm_id: String(b.farm_id ?? ''),
      fiscal_year: String(b.fiscal_year ?? new Date().getFullYear()),
      month: String(b.month ?? ''),
      week_start: b.week_start ?? '',
      budget_allocated: String(b.budget_allocated ?? ''),
      payroll_budget: String(b.payroll_budget ?? ''),
      stock_budget: String(b.stock_budget ?? ''),
      procurement_budget: String(b.procurement_budget ?? ''),
      expenses_budget: String(b.expenses_budget ?? ''),
      notes: b.notes ?? '',
      status: b.status ?? 'draft',
      parent_budget_id: String(b.parent_budget_id ?? ''),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.farm_id) return toast.error('Farm is required');
    if (!form.budget_allocated) return toast.error('Total allocated amount is required');
    const total = Number(form.budget_allocated);
    const catSum = categorySum(form);
    if (catSum > total) {
      return toast.error(`Category totals (${fmt(catSum)}) exceed total budget (${fmt(total)})`);
    }
    if (period === 'monthly' && !form.month) return toast.error('Month is required');
    if (period === 'weekly' && !form.week_start) return toast.error('Week (Saturday) is required');

    setSaving(true);
    try {
      const payload: any = {
        farm_id: Number(form.farm_id),
        period,
        fiscal_year: Number(form.fiscal_year),
        budget_allocated: total,
        payroll_budget: Number(form.payroll_budget) || undefined,
        stock_budget: Number(form.stock_budget) || undefined,
        procurement_budget: Number(form.procurement_budget) || undefined,
        expenses_budget: Number(form.expenses_budget) || undefined,
        notes: form.notes || undefined,
        status: form.status,
        parent_budget_id: form.parent_budget_id ? Number(form.parent_budget_id) : undefined,
      };
      if (period === 'monthly') payload.month = Number(form.month);
      if (period === 'weekly')  payload.week_start = form.week_start;

      if (editingBudget) {
        await apiService.updateBudget(editingBudget.id, payload);
        toast.success('Budget updated');
      } else {
        await apiService.createBudget(payload);
        toast.success('Budget created');
      }
      setShowForm(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (b: any) => {
    try {
      await apiService.updateBudget(b.id, { status: 'active' });
      toast.success('Budget published');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish');
    }
  };

  const inputCls = 'block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-5">

      {/* ── Controls bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Period tabs */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 font-medium capitalize transition-colors ${
                period === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >{p}</button>
          ))}
        </div>

        {/* Farm filter */}
        <Select value={farmFilter || '__all__'} onValueChange={(val) => setFarmFilter(val === '__all__' ? '' : val)}>
          <SelectTrigger className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"><SelectValue placeholder="All farms" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All farms</SelectItem>
            {farms.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Fiscal year */}
        <input type="number" value={fiscalYear} onChange={e => setFiscalYear(Number(e.target.value))}
          min={2020} max={2040}
          className="border border-gray-200 rounded-md px-3 py-2 text-sm w-24 bg-white" />

        {canEdit && (
          <button onClick={openCreate}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> New Budget
          </button>
        )}
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Allocated', value: totalAllocated, cls: 'text-blue-600', bg: 'bg-blue-500' },
          { label: 'Total Spent',     value: totalSpent,     cls: 'text-red-600',  bg: 'bg-red-500'  },
          { label: 'Remaining',       value: totalAllocated - totalSpent,
            cls: totalAllocated - totalSpent >= 0 ? 'text-green-600' : 'text-red-600',
            bg:  totalAllocated - totalSpent >= 0 ? 'bg-green-500'   : 'bg-red-500'   },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">{c.label}</p>
              <p className={`text-lg font-bold mt-0.5 ${c.cls}`}>{fmt(c.value)}</p>
            </div>
            <div className={`${c.bg} p-3 rounded-xl`}><Wallet className="w-5 h-5 text-white" /></div>
          </div>
        ))}
      </div>

      {/* ── Budget list ── */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-200">
          <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No {period} budgets found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((b: any) => {
            const spent = b.budget_spent || 0;
            const alloc = b.budget_allocated || 0;
            const p = pct(spent, alloc);
            const isExpanded = expandedBlock === b.id;

            return (
              <div key={b.id} className="bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {b.farm?.name || b.farm_name || `Farm #${b.farm_id}`}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 capitalize">{b.period}</span>
                        {b.month && <span className="text-xs text-gray-400">· {MONTHS[(b.month ?? 1) - 1]}</span>}
                        {b.week_start && <span className="text-xs text-gray-400">· w/s {b.week_start}</span>}
                        {b.fiscal_year && <span className="text-xs text-gray-400">· FY{b.fiscal_year}</span>}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                          b.status === 'active'  ? 'bg-green-100 text-green-700' :
                          b.status === 'closed'  ? 'bg-gray-100 text-gray-500' :
                                                   'bg-yellow-100 text-yellow-700'
                        }`}>{b.status || 'draft'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        p >= 90 ? 'bg-red-100 text-red-700' : p >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>{p}% used</span>
                      {canEdit && (
                        <>
                          {b.status === 'draft' && (
                            <button onClick={() => handlePublish(b)}
                              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                              Publish
                            </button>
                          )}
                          <button onClick={() => openEdit(b)} className="p-1 text-gray-400 hover:text-blue-600">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                    <div className={`h-1.5 rounded-full transition-all ${barColor(p)}`} style={{ width: `${p}%` }} />
                  </div>

                  {/* Totals row */}
                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-xs text-gray-400">Allocated</p>
                      <p className="font-semibold text-gray-900">{fmt(alloc)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Spent</p>
                      <p className="font-semibold text-red-600">{fmt(spent)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Remaining</p>
                      <p className={`font-semibold ${alloc - spent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(alloc - spent)}
                      </p>
                    </div>
                  </div>

                  {/* Category breakdown */}
                  {CATEGORY_KEYS.some(k => b[k] != null) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {CATEGORY_KEYS.map(k => {
                        if (b[k] == null) return null;
                        const cfg = CATEGORY_LABELS[k];
                        const Icon = cfg.icon;
                        const catSpent = b[`${k.replace('_budget','_spent')}`] || 0;
                        const catAlloc = b[k] || 0;
                        const cp = pct(catSpent, catAlloc);
                        return (
                          <div key={k} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                              <span className="text-xs font-medium text-gray-600">{cfg.label}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1 mb-1.5">
                              <div className={`h-1 rounded-full ${barColor(cp)}`} style={{ width: `${cp}%` }} />
                            </div>
                            <p className="text-xs text-gray-500">{fmt(catSpent)} / {fmt(catAlloc)}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Block budgets toggle */}
                  <button
                    onClick={() => {
                      setExpandedBlock(isExpanded ? null : b.id);
                    }}
                    className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    {isExpanded ? 'Hide' : 'Show'} block budgets
                  </button>
                </div>

                {/* ── Block budget panel ── */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50 rounded-b-lg">
                    {blocksLoading ? (
                      <div className="flex justify-center py-6"><LoadingSpinner size="sm" /></div>
                    ) : blocks.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No block budgets allocated</p>
                    ) : (
                      <div className="space-y-2">
                        {blocks.map((bl: any) => {
                          const bp = pct(bl.payroll_spent || 0, bl.payroll_budget || 0);
                          return (
                            <div key={bl.block_id ?? bl.id} className="bg-white rounded-md p-3 border border-gray-100">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-medium text-gray-800">{bl.block_name || `Block #${bl.block_id}`}</span>
                                <span className="text-xs text-gray-400">{fmt(bl.budget_allocated)}</span>
                              </div>
                              {bl.payroll_budget != null && (
                                <div>
                                  <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                                    <span>Payroll</span><span>{bp}%</span>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-1">
                                    <div className={`h-1 rounded-full ${barColor(bp)}`} style={{ width: `${bp}%` }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {canEdit && (
                      <BlockBudgetForm budgetId={b.id} onSaved={refetchBlocks} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit form modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {editingBudget ? 'Edit Budget' : `New ${period.charAt(0).toUpperCase() + period.slice(1)} Budget`}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">

              {/* Farm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm <span className="text-red-500">*</span></label>
                <Select value={form.farm_id} onValueChange={(val) => setForm(f => ({ ...f, farm_id: val }))}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Select farm…" /></SelectTrigger>
                  <SelectContent>
                    {farms.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Fiscal year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year</label>
                <input type="number" value={form.fiscal_year} min={2020} max={2040}
                  onChange={e => setForm(f => ({ ...f, fiscal_year: e.target.value }))} className={inputCls} />
              </div>

              {/* Month picker — only monthly */}
              {period === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month <span className="text-red-500">*</span></label>
                  <Select value={form.month} onValueChange={(val) => setForm(f => ({ ...f, month: val }))}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Select month…" /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Saturday picker — only weekly */}
              {period === 'weekly' && (
                <SaturdayWeekPicker
                  value={form.week_start}
                  onChange={v => setForm(f => ({ ...f, week_start: v }))}
                  label="Week Start (Saturday) *"
                />
              )}

              {/* Total budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Allocated (TZS) <span className="text-red-500">*</span></label>
                <input type="number" min="0" value={form.budget_allocated}
                  onChange={e => setForm(f => ({ ...f, budget_allocated: e.target.value }))}
                  placeholder="0" className={inputCls} />
              </div>

              {/* Category breakdown */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Category Breakdown (must sum ≤ total)</p>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORY_KEYS.map(k => {
                    const cfg = CATEGORY_LABELS[k];
                    const Icon = cfg.icon;
                    return (
                      <div key={k}>
                        <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
                          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} /> {cfg.label}
                        </label>
                        <input type="number" min="0" value={(form as any)[k]}
                          onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                          placeholder="0" className={inputCls} />
                      </div>
                    );
                  })}
                </div>
                {form.budget_allocated && categorySum(form) > Number(form.budget_allocated) && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    Categories sum ({fmt(categorySum(form))}) exceeds total ({fmt(Number(form.budget_allocated))})
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select value={form.status} onValueChange={(val) => setForm(f => ({ ...f, status: val }))}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Select status…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className={`${inputCls} resize-none`} placeholder="Optional notes…" />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? <LoadingSpinner size="sm" /> : <Save className="w-3.5 h-3.5" />}
                {editingBudget ? 'Save Changes' : 'Create Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Block Budget inline form ──────────────────────────────────────────────────

interface BlockBudgetFormProps {
  budgetId: number;
  onSaved: () => void;
}

const BlockBudgetForm: React.FC<BlockBudgetFormProps> = ({ budgetId, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ block_id: '', budget_allocated: '', payroll_budget: '', stock_budget: '', expenses_budget: '' });

  const inputCls = 'block w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500';

  const handleSave = async () => {
    if (!form.block_id || !form.budget_allocated) return toast.error('Block ID and allocation required');
    setSaving(true);
    try {
      await apiService.createBudgetBlock(budgetId, {
        block_id: Number(form.block_id),
        budget_allocated: Number(form.budget_allocated),
        payroll_budget: Number(form.payroll_budget) || undefined,
        stock_budget: Number(form.stock_budget) || undefined,
        expenses_budget: Number(form.expenses_budget) || undefined,
      });
      toast.success('Block budget added');
      setOpen(false);
      setForm({ block_id: '', budget_allocated: '', payroll_budget: '', stock_budget: '', expenses_budget: '' });
      onSaved();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save block budget');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
        <Plus className="w-3.5 h-3.5" /> Allocate block budget
      </button>
    );
  }

  return (
    <div className="mt-3 bg-white border border-blue-200 rounded-lg p-3 space-y-2">
      <p className="text-xs font-medium text-gray-700">New Block Allocation</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">Block ID *</label>
          <input type="number" value={form.block_id} onChange={e => setForm(f => ({ ...f, block_id: e.target.value }))} className={inputCls} placeholder="Block #" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">Total (TZS) *</label>
          <input type="number" value={form.budget_allocated} onChange={e => setForm(f => ({ ...f, budget_allocated: e.target.value }))} className={inputCls} placeholder="0" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">Payroll</label>
          <input type="number" value={form.payroll_budget} onChange={e => setForm(f => ({ ...f, payroll_budget: e.target.value }))} className={inputCls} placeholder="0" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">Expenses</label>
          <input type="number" value={form.expenses_budget} onChange={e => setForm(f => ({ ...f, expenses_budget: e.target.value }))} className={inputCls} placeholder="0" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={() => setOpen(false)} className="text-xs px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">Cancel</button>
        <button onClick={handleSave} disabled={saving}
          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
          {saving ? <LoadingSpinner size="sm" /> : <Check className="w-3 h-3" />} Save
        </button>
      </div>
    </div>
  );
};
