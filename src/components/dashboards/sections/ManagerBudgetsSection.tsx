"use client";

import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Wallet, Plus, Pencil, Check, X } from 'lucide-react';
import { toast } from '../../ui/sonner';

export const ManagerBudgetsSection: React.FC = () => {
  const [period, setPeriod] = useState<'weekly' | 'yearly'>('weekly');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [form, setForm] = useState({ farm_id: '', period: 'weekly', budget_allocated: '' });

  const getFarms = useCallback(() => apiService.getManagerFarms(), []);
  const { data: farmsData } = useApi(getFarms);
  const farms: any[] = Array.isArray(farmsData) ? farmsData : [];

  const fetchBudgets = useCallback(() => apiService.getBudgets(period), [period]);
  const { data: budgetsRaw, loading, refetch } = useApi(fetchBudgets);
  const budgets: any[] = Array.isArray(budgetsRaw) ? budgetsRaw : [];

  const totalAllocated = budgets.reduce((s, b) => s + (b.budget_allocated || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.budget_spent || 0), 0);
  const totalRemaining = totalAllocated - totalSpent;

  const handleCreate = async () => {
    if (!form.farm_id || !form.budget_allocated) {
      toast.error('Farm and allocated amount are required');
      return;
    }
    setSaving(true);
    try {
      await apiService.createBudget({
        farm_id: Number(form.farm_id),
        period: form.period,
        budget_allocated: Number(form.budget_allocated),
      });
      toast.success('Budget created');
      setShowModal(false);
      setForm({ farm_id: '', period: 'weekly', budget_allocated: '' });
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create budget');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (budget: any) => {
    setEditingId(budget.id);
    setEditValue(String(budget.budget_allocated));
  };

  const handleUpdate = async (budgetId: number) => {
    if (!editValue || isNaN(Number(editValue))) return;
    setUpdatingId(budgetId);
    try {
      await apiService.updateBudget(budgetId, { budget_allocated: Number(editValue) });
      toast.success('Budget updated');
      setEditingId(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update budget');
    } finally {
      setUpdatingId(null);
    }
  };

  const pct = (spent: number, allocated: number) =>
    allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;

  const barColor = (p: number) =>
    p >= 90 ? 'bg-red-500' : p >= 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(['weekly', 'yearly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2 text-sm font-medium capitalize transition-colors ${
                period === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setForm({ farm_id: '', period, budget_allocated: '' }); setShowModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Budget
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Allocated', value: totalAllocated, color: 'text-blue-600', bg: 'bg-blue-500' },
          { label: 'Total Spent', value: totalSpent, color: 'text-red-600', bg: 'bg-red-500' },
          { label: 'Remaining', value: totalRemaining, color: totalRemaining >= 0 ? 'text-green-600' : 'text-red-600', bg: totalRemaining >= 0 ? 'bg-green-500' : 'bg-red-500' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <p className={`text-lg font-bold mt-1 ${card.color}`}>TZS {card.value.toLocaleString()}</p>
            </div>
            <div className={`${card.bg} p-3 rounded-xl`}>
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Budget cards */}
      {loading ? (
        <div className="flex justify-center items-center py-12"><LoadingSpinner size="lg" /></div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No {period} budgets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b: any) => {
            const spent = b.budget_spent || 0;
            const allocated = b.budget_allocated || 0;
            const remaining = allocated - spent;
            const p = pct(spent, allocated);
            const isEditing = editingId === b.id;
            return (
              <div key={b.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{b.farm?.name || b.farm_name || `Farm #${b.farm_id}`}</h3>
                    <span className="text-xs text-gray-500 capitalize">{b.period} budget</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    p >= 90 ? 'bg-red-100 text-red-700' : p >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>{p}% used</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                  <div className={`h-2 rounded-full transition-all ${barColor(p)}`} style={{ width: `${p}%` }} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                  <div>
                    <p className="text-gray-500 text-xs">Allocated</p>
                    {isEditing ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-full border border-blue-400 rounded px-2 py-0.5 text-xs"
                          autoFocus
                        />
                        <button onClick={() => handleUpdate(b.id)} disabled={updatingId === b.id} className="text-green-600 hover:text-green-800">
                          {updatingId === b.id ? <LoadingSpinner size="sm" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="font-semibold">TZS {allocated.toLocaleString()}</p>
                        <button onClick={() => startEdit(b)} className="text-gray-400 hover:text-blue-600">
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Spent</p>
                    <p className="font-semibold text-red-600 mt-0.5">TZS {spent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Remaining</p>
                    <p className={`font-semibold mt-0.5 ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      TZS {remaining.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Budget</h3>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm <span className="text-red-500">*</span></label>
              <select value={form.farm_id} onChange={e => setForm(f => ({ ...f, farm_id: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="">Select farm...</option>
                {farms.map((farm: any) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Period <span className="text-red-500">*</span></label>
              <select value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Allocated Amount (TZS) <span className="text-red-500">*</span></label>
              <input type="number" min="0" value={form.budget_allocated} onChange={e => setForm(f => ({ ...f, budget_allocated: e.target.value }))} placeholder="0" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 border rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
