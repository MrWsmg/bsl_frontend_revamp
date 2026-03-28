"use client";

import React, { useState, useEffect, useCallback } from 'react';
import apiService from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { toast } from '../../ui/sonner';
import { PlusCircle } from 'lucide-react';

interface TaskCode {
  id: number;
  code: string;
  name: string;
  payment_method: 'per_task' | 'per_day';
  default_rate: number;
}

interface FormState {
  farm_id: number | '';
  date_worked: string;
  worker_name: string;
  task_code: string;
  worker_type: 'permanent' | 'contracted';
  block: string;
  payment_method: 'per_task' | 'per_day';
  quantity: number | '';
  rate: number | '';
  crop_type: string;
}

const BLANK: FormState = {
  farm_id: '',
  date_worked: new Date().toISOString().split('T')[0],
  worker_name: '',
  task_code: '',
  worker_type: 'permanent',
  block: '',
  payment_method: 'per_task',
  quantity: '',
  rate: '',
  crop_type: '',
};

export const SupervisorPayrollEntrySection: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>({ ...BLANK, farm_id: user?.farm_id ?? '' });
  const [farms, setFarms] = useState<{ id: number; name: string }[]>([]);
  const [taskCodes, setTaskCodes] = useState<TaskCode[]>([]);
  const [workers, setWorkers] = useState<{ id: number; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      apiService.getPayrollFarms().catch(() => []),
      apiService.getTaskCodes().catch(() => []),
      apiService.getSupervisorWorkers().catch(() => []),
    ]).then(([f, t, w]) => {
      setFarms(f as any[]);
      setTaskCodes(t as TaskCode[]);
      setWorkers(w as any[]);
    });
  }, []);

  // Auto-fill rate + payment_method when task code changes
  useEffect(() => {
    if (!form.task_code) return;
    const tc = taskCodes.find((t) => t.code === form.task_code);
    if (tc) {
      setForm((prev) => ({ ...prev, payment_method: tc.payment_method, rate: tc.default_rate }));
    }
  }, [form.task_code, taskCodes]);

  const set = useCallback((field: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const totalAmount =
    form.quantity !== '' && form.rate !== ''
      ? Number(form.quantity) * Number(form.rate)
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.farm_id)        return toast.error('Please select a farm');
    if (!form.worker_name)    return toast.error('Please enter a worker name');
    if (!form.task_code)      return toast.error('Please select a task code');
    if (!form.quantity || Number(form.quantity) <= 0) return toast.error('Quantity must be greater than 0');
    if (!form.rate || Number(form.rate) <= 0)         return toast.error('Rate must be greater than 0');

    setSubmitting(true);
    try {
      await apiService.createSupervisorPayrollRecord({
        farm_id: Number(form.farm_id),
        date_worked: form.date_worked,
        worker_name: form.worker_name,
        task_code: form.task_code,
        worker_type: form.worker_type,
        block: form.block || undefined,
        payment_method: form.payment_method,
        quantity: Number(form.quantity),
        rate: Number(form.rate),
        total_amount: totalAmount,
      });
      toast.success('Payroll record created successfully');
      setForm({ ...BLANK, farm_id: user?.farm_id ?? '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to create payroll record');
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">New Payroll Record</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Farm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
              {isAdmin ? (
                <select
                  value={form.farm_id}
                  onChange={(e) => set('farm_id', e.target.value ? Number(e.target.value) : '')}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select farm…</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={farms.find((f) => f.id === form.farm_id)?.name ?? `Farm ${form.farm_id}`}
                  disabled
                  className="block w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50"
                />
              )}
            </div>

            {/* Date worked */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Worked</label>
              <input
                type="date"
                value={form.date_worked}
                onChange={(e) => set('date_worked', e.target.value)}
                required
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Worker name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name</label>
              <input
                list="worker-list"
                value={form.worker_name}
                onChange={(e) => set('worker_name', e.target.value)}
                placeholder="Type or select worker…"
                required
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="worker-list">
                {workers.map((w) => (
                  <option key={w.id} value={w.name} />
                ))}
              </datalist>
            </div>

            {/* Task code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Code</label>
              <select
                value={form.task_code}
                onChange={(e) => set('task_code', e.target.value)}
                required
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select task…</option>
                {taskCodes.map((t) => (
                  <option key={t.id} value={t.code}>{t.code} — {t.name}</option>
                ))}
              </select>
            </div>

            {/* Worker type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Worker Type</label>
              <select
                value={form.worker_type}
                onChange={(e) => set('worker_type', e.target.value as any)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="permanent">Permanent</option>
                <option value="contracted">Contracted</option>
              </select>
            </div>

            {/* Block */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Block <span className="text-gray-400">(optional)</span></label>
              <input
                type="text"
                value={form.block}
                onChange={(e) => set('block', e.target.value)}
                placeholder="e.g. B-12"
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Payment method — auto-filled, editable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={form.payment_method}
                onChange={(e) => set('payment_method', e.target.value as any)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="per_task">Per Task</option>
                <option value="per_day">Per Day</option>
              </select>
            </div>

            {/* Crop type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type <span className="text-gray-400">(optional)</span></label>
              <input
                type="text"
                value={form.crop_type}
                onChange={(e) => set('crop_type', e.target.value)}
                placeholder="e.g. Tea"
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.quantity}
                onChange={(e) => set('quantity', e.target.value === '' ? '' : parseFloat(e.target.value))}
                required
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate (TZS)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.rate}
                onChange={(e) => set('rate', e.target.value === '' ? '' : parseFloat(e.target.value))}
                required
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Total — read-only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (TZS)</label>
              <input
                type="text"
                value={totalAmount > 0 ? totalAmount.toLocaleString() : '—'}
                disabled
                className="block w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 font-semibold text-gray-900"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? <LoadingSpinner size="sm" /> : <PlusCircle className="w-4 h-4" />}
              {submitting ? 'Saving…' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
