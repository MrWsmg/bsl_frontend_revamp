"use client";

// Supervisor Payroll section — view pending (edit/delete) and rejected (resubmit) records
import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { PayrollRecord } from '../../../types';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { AlertCircle, RotateCcw, Pencil, Trash2, Clock, X, Check } from 'lucide-react';
import { toast } from '../../ui/sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupervisorRecord {
  id: number;
  worker_name?: string;
  worker_type?: string;
  task_code?: string;
  block?: string;
  quantity?: number;
  rate?: number;
  total_amount?: number;
  date_worked?: string;
  approval_status?: string;
  rejection_reason?: string;
  rejected_at?: string;
}

interface EditFormState {
  task_code: string;
  block: string;
  quantity: string;
  rate: string;
  date_worked: string;
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  record: SupervisorRecord;
  onClose: () => void;
  onSaved: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ record, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditFormState>({
    task_code: record.task_code ?? '',
    block: record.block ?? '',
    quantity: record.quantity != null ? String(record.quantity) : '',
    rate: record.rate != null ? String(record.rate) : '',
    date_worked: record.date_worked ? record.date_worked.slice(0, 10) : '',
  });

  const qty = parseFloat(form.quantity) || 0;
  const rate = parseFloat(form.rate) || 0;
  const calculatedTotal = qty * rate;

  const handleChange = (field: keyof EditFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.editSupervisorPayrollRecord(record.id, {
        task_code: form.task_code,
        block: form.block || undefined,
        quantity: parseFloat(form.quantity),
        rate: parseFloat(form.rate),
        date_worked: form.date_worked,
      } as Partial<SupervisorRecord>);
      toast.success('Payroll record updated successfully');
      onSaved();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payroll record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit Payroll Record</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {record.worker_name && (
          <p className="text-sm text-muted-foreground mb-4">
            Worker: <span className="font-medium text-gray-700">{record.worker_name}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.task_code}
                onChange={e => handleChange('task_code', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
              <input
                type="text"
                value={form.block}
                onChange={e => handleChange('block', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number" required min="0" step="any"
                value={form.quantity}
                onChange={e => handleChange('quantity', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rate <span className="text-red-500">*</span>
              </label>
              <input
                type="number" required min="0" step="any"
                value={form.rate}
                onChange={e => handleChange('rate', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Worked <span className="text-red-500">*</span>
              </label>
              <input
                type="date" required
                value={form.date_worked}
                onChange={e => handleChange('date_worked', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <input
                type="text" readOnly
                value={calculatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <LoadingSpinner size="sm" /> : <Check className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const SupervisorPayrollSection: React.FC = () => {
  const [resubmittingId, setResubmittingId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<SupervisorRecord | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Pending payroll
  const getPendingPayroll = useCallback(() => apiService.getSupervisorPendingPayroll(), []);
  const { data: pendingPayroll, loading: pendingLoading, refetch: refetchPending } = useApi(getPendingPayroll);

  // Rejected payroll
  const getRejectedPayroll = useCallback(() => apiService.getSupervisorRejectedPayroll(), []);
  const { data: rejectedPayroll, loading: rejectedLoading, refetch: refetchRejected } = useApi(getRejectedPayroll);

  const pendingList: SupervisorRecord[] = Array.isArray(pendingPayroll) ? (pendingPayroll as SupervisorRecord[]) : [];
  const rejectedList: SupervisorRecord[] = Array.isArray(rejectedPayroll) ? (rejectedPayroll as SupervisorRecord[]) : [];

  // ── Resubmit (rejected tab) ────────────────────────────────────────────────
  const handleResubmit = async (recordId: number) => {
    setResubmittingId(recordId);
    try {
      await apiService.resubmitSupervisorPayroll(recordId);
      toast.success('Payroll record resubmitted for approval');
      await refetchRejected();
    } catch (error: any) {
      toast.error(error.message || 'Failed to resubmit payroll record');
    } finally {
      setResubmittingId(null);
    }
  };

  // ── Delete (pending tab) ───────────────────────────────────────────────────
  const handleDelete = async (recordId: number) => {
    setDeletingId(recordId);
    try {
      await apiService.deleteSupervisorPayrollRecord(recordId);
      toast.success('Payroll record deleted');
      setConfirmDeleteId(null);
      await refetchPending();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete payroll record');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Edit saved ─────────────────────────────────────────────────────────────
  const handleEditSaved = async () => {
    setEditingRecord(null);
    await refetchPending();
  };

  return (
    <>
      {/* Edit Modal */}
      {editingRecord && (
        <EditModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaved={handleEditSaved}
        />
      )}

      <div className="space-y-4">
        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
              {pendingList.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold bg-yellow-400 text-yellow-900 rounded-full">
                  {pendingList.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Rejected
              {rejectedList.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                  {rejectedList.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Pending Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  Pending Payroll Records
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Records awaiting supervisor approval. You can edit or delete records that are still pending.
                </p>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : pendingList.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted-foreground">No pending payroll records</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 pr-4 font-medium">Date</th>
                          <th className="pb-3 pr-4 font-medium">Worker</th>
                          <th className="pb-3 pr-4 font-medium">Task</th>
                          <th className="pb-3 pr-4 font-medium">Block</th>
                          <th className="pb-3 pr-4 font-medium text-right">Qty</th>
                          <th className="pb-3 pr-4 font-medium text-right">Rate</th>
                          <th className="pb-3 pr-4 font-medium text-right">Amount</th>
                          <th className="pb-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {pendingList.map((record) => (
                          <React.Fragment key={record.id}>
                            <tr className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 pr-4 text-gray-600">
                                {record.date_worked ? new Date(record.date_worked).toLocaleDateString() : '—'}
                              </td>
                              <td className="py-3 pr-4">
                                <div className="font-medium text-gray-900">{record.worker_name ?? '—'}</div>
                                {record.worker_type && (
                                  <div className="text-xs text-muted-foreground">{record.worker_type}</div>
                                )}
                              </td>
                              <td className="py-3 pr-4 font-medium">{record.task_code ?? '—'}</td>
                              <td className="py-3 pr-4 text-gray-600">{record.block ?? '—'}</td>
                              <td className="py-3 pr-4 text-right">{record.quantity ?? '—'}</td>
                              <td className="py-3 pr-4 text-right">{record.rate != null ? record.rate.toLocaleString() : '—'}</td>
                              <td className="py-3 pr-4 text-right font-semibold">
                                {record.total_amount != null ? record.total_amount.toLocaleString() : '—'}
                              </td>
                              <td className="py-3 text-right">
                                {record.approval_status === 'supervisor_pending' && (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => setEditingRecord(record)}
                                      className="flex items-center gap-1 px-2 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                                    >
                                      <Pencil className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(record.id)}
                                      className="flex items-center gap-1 px-2 py-1.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                            {/* Inline delete confirm row */}
                            {confirmDeleteId === record.id && (
                              <tr>
                                <td colSpan={8} className="pb-3 pt-0">
                                  <div className="flex items-center gap-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm">
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <span className="text-red-700 flex-1">
                                      Are you sure you want to delete this record? This action cannot be undone.
                                    </span>
                                    <button
                                      onClick={() => handleDelete(record.id)}
                                      disabled={deletingId === record.id}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                                    >
                                      {deletingId === record.id ? <LoadingSpinner size="sm" /> : <Trash2 className="w-3 h-3" />}
                                      Confirm Delete
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(null)}
                                      disabled={deletingId === record.id}
                                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                    >
                                      <X className="w-3 h-3" /> Cancel
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Rejected Tab ────────────────────────────────────────────────── */}
          <TabsContent value="rejected">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Rejected Payroll Records
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Records rejected by a manager or financial controller. Review the rejection reason, then resubmit when corrected.
                </p>
              </CardHeader>
              <CardContent>
                {rejectedLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : rejectedList.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-muted-foreground">No rejected payroll records</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rejectedList.map((record) => (
                      <div key={record.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900">{record.worker_name}</span>
                              <Badge variant="secondary">{record.worker_type}</Badge>
                              <Badge variant="destructive">Rejected</Badge>
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
                                <span className="font-medium">{record.rate}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Total:</span>{' '}
                                <span className="font-semibold">{record.total_amount?.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Date:</span>{' '}
                                <span>{record.date_worked ? new Date(record.date_worked).toLocaleDateString() : '—'}</span>
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};
