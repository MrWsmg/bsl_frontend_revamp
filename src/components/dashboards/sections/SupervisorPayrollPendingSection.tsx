"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ApprovalStatusBadge } from '../../common/ApprovalStatusBadge';
import { toast } from '../../ui/sonner';
import { Pencil, Trash2, Clock } from 'lucide-react';
import { PayrollRecord } from '../../../types';

interface EditState {
  worker_name: string;
  task_code: string;
  quantity: number | '';
  rate: number | '';
  block: string;
}

export const SupervisorPayrollPendingSection: React.FC = () => {
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [editForm, setEditForm] = useState<EditState>({ worker_name: '', task_code: '', quantity: '', rate: '', block: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchPending = useCallback(() => apiService.getSupervisorPendingPayroll(), []);
  const { data: records, loading, refetch } = useApi(fetchPending);

  const openEdit = (r: PayrollRecord) => {
    setEditingRecord(r);
    setEditForm({ worker_name: r.worker_name, task_code: r.task_code, quantity: r.quantity, rate: r.rate, block: r.block ?? '' });
  };

  const handleSave = async () => {
    if (!editingRecord) return;
    const qty = Number(editForm.quantity);
    const rate = Number(editForm.rate);
    if (qty <= 0 || rate <= 0) return toast.error('Quantity and rate must be greater than 0');
    setSaving(true);
    try {
      await apiService.updateSupervisorPayrollRecord(editingRecord.id, {
        ...editForm,
        quantity: qty,
        rate,
        total_amount: qty * rate,
      });
      toast.success('Record updated');
      setEditingRecord(null);
      await refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this payroll record?')) return;
    setDeletingId(id);
    try {
      await apiService.deleteSupervisorPayrollRecord(id);
      toast.success('Record deleted');
      await refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete record');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-yellow-600" />
        <h2 className="text-lg font-semibold text-gray-900">Pending Records</h2>
        {records && records.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
            {records.length}
          </span>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : !records || records.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No pending records — all records have been processed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Date', 'Worker', 'Task', 'Block', 'Qty', 'Rate', 'Total', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{r.date_worked}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.worker_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.task_code}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{r.block ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{Number(r.rate).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{Number(r.total_amount).toLocaleString()}</td>
                      <td className="px-4 py-3"><ApprovalStatusBadge status={r.approval_status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(r)} title="Edit" className="text-blue-600 hover:text-blue-800">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            disabled={deletingId === r.id}
                            title="Delete"
                            className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                          >
                            {deletingId === r.id ? <LoadingSpinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Record</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name</label>
                <input
                  type="text"
                  value={editForm.worker_name}
                  onChange={(e) => setEditForm((p) => ({ ...p, worker_name: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Code</label>
                <input
                  type="text"
                  value={editForm.task_code}
                  onChange={(e) => setEditForm((p) => ({ ...p, task_code: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm((p) => ({ ...p, quantity: e.target.value === '' ? '' : parseFloat(e.target.value) }))}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate (TZS)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={editForm.rate}
                    onChange={(e) => setEditForm((p) => ({ ...p, rate: e.target.value === '' ? '' : parseFloat(e.target.value) }))}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
                <input
                  type="text"
                  value={editForm.block}
                  onChange={(e) => setEditForm((p) => ({ ...p, block: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="pt-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">New Total</label>
                <p className="text-lg font-bold text-gray-900">
                  TZS {(Number(editForm.quantity) * Number(editForm.rate)).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setEditingRecord(null)} className="px-4 py-2 text-sm text-gray-700 border rounded hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving && <LoadingSpinner size="sm" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
