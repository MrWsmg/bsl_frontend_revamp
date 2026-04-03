"use client";

// Supervisor Payroll section — view rejected records, edit, then resubmit
import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ApprovalStatusBadge } from '../../common/ApprovalStatusBadge';
import { AlertCircle, RotateCcw, Pencil } from 'lucide-react';
import { toast } from '../../ui/sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EditState {
  worker_name: string;
  task_code: string;
  quantity: number | '';
  rate: number | '';
  block: string;
}

export const SupervisorPayrollSection: React.FC = () => {
  const [resubmittingId, setResubmittingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<EditState>({ worker_name: '', task_code: '', quantity: '', rate: '', block: '' });
  const [saving, setSaving] = useState(false);

  const getRejectedPayroll = useCallback(() => apiService.getSupervisorRejectedPayroll(), []);
  const { data: rejectedPayroll, loading, refetch } = useApi(getRejectedPayroll);

  const openEdit = (record: any) => {
    setEditingRecord(record);
    setEditForm({
      worker_name: record.worker_name,
      task_code: record.task_code,
      quantity: record.quantity,
      rate: record.rate,
      block: record.block ?? '',
    });
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
      toast.success('Record updated — you can now resubmit it');
      setEditingRecord(null);
      await refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update record');
    } finally {
      setSaving(false);
    }
  };

  const handleResubmit = async (recordId: number) => {
    setResubmittingId(recordId);
    try {
      await apiService.resubmitSupervisorPayroll(recordId);
      toast.success('Payroll record resubmitted for approval');
      await refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to resubmit payroll record');
    } finally {
      setResubmittingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Rejected Payroll Records
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Records rejected by a manager or financial controller. Edit the record to fix the issue, then resubmit.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !rejectedPayroll || rejectedPayroll.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-muted-foreground">No rejected payroll records</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rejectedPayroll.map((record: any) => (
                <div key={record.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{record.worker_name}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{record.worker_type}</span>
                        <ApprovalStatusBadge status={record.approval_status} />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-700">
                        <div>
                          <span className="text-muted-foreground">Task:</span>{' '}
                          <span className="font-medium">{record.task_code}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Qty:</span>{' '}
                          <span className="font-medium">{record.quantity}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rate:</span>{' '}
                          <span className="font-medium">{Number(record.rate).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>{' '}
                          <span className="font-semibold">{Number(record.total_amount).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>{' '}
                          <span>{new Date(record.date_worked).toLocaleDateString()}</span>
                        </div>
                        {record.rejected_at && (
                          <div>
                            <span className="text-muted-foreground">Rejected:</span>{' '}
                            <span>{new Date(record.rejected_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {record.rejection_reason && (
                        <div className="mt-2 p-3 bg-white border border-red-200 rounded text-sm">
                          <span className="font-medium text-red-700">Rejection reason: </span>
                          <span className="text-gray-700">{record.rejection_reason}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => openEdit(record)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 whitespace-nowrap"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleResubmit(record.id)}
                        disabled={resubmittingId === record.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        {resubmittingId === record.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        Resubmit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Edit Rejected Record</h3>

            {/* Rejection reason callout */}
            {editingRecord.rejection_reason && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                <p className="font-medium text-red-700 mb-1">Rejection reason</p>
                <p className="text-gray-700">{editingRecord.rejection_reason}</p>
              </div>
            )}

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
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
