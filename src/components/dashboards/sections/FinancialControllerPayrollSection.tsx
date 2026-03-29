"use client";

// Financial Controller Payroll section — final approval + budget deduction
import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ApprovalStatusBadge } from '../../common/ApprovalStatusBadge';
import { Check, X, DollarSign, CheckSquare, AlertTriangle } from 'lucide-react';
import { toast } from '../../ui/sonner';

export const FinancialControllerPayrollSection: React.FC = () => {
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
<<<<<<< HEAD
  const [bulkRejectModal, setBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');
=======
>>>>>>> 8c92f07 (feat(payroll): add document generation and enhance management)
  const [isBulkReject, setIsBulkReject] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [bulkRejecting, setBulkRejecting] = useState(false);

  const getPendingPayroll = useCallback(() => apiService.getFinancialControllerPendingPayroll(), []);

  const { data: pendingPayroll, loading, refetch } = useApi(getPendingPayroll);

  const totalAmount = pendingPayroll?.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0) || 0;

  const handleApprove = async (recordId: number) => {
    setApprovingId(recordId);
    try {
      await apiService.approveFinancialControllerPayroll(recordId);
      toast.success('Payroll record approved — budget deducted');
      await refetch();
      setSelectedIds(prev => prev.filter(id => id !== recordId));
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve payroll record');
    } finally {
      setApprovingId(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setBulkApproving(true);
    try {
      await apiService.bulkApproveFinancialControllerPayroll(selectedIds);
      toast.success(`${selectedIds.length} records approved — budgets deducted`);
      setSelectedIds([]);
      await refetch();
    } catch (error: any) {
      toast.error(error.message || 'Bulk approval failed');
    } finally {
      setBulkApproving(false);
    }
  };

  const openRejectModal = (recordId: number) => {
    setIsBulkReject(false);
    setRejectingId(recordId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const openBulkRejectModal = () => {
    if (selectedIds.length === 0) return;
    setIsBulkReject(true);
    setRejectingId(null);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    if (isBulkReject) {
      if (selectedIds.length === 0) return;
      setBulkRejecting(true);
      try {
<<<<<<< HEAD
        await apiService.bulkRejectFinancialControllerPayroll(selectedIds, rejectReason.trim());
=======
        await apiService.bulkRejectFinancialControllerPayroll({ record_ids: selectedIds, rejection_reason: rejectReason.trim() });
>>>>>>> 8c92f07 (feat(payroll): add document generation and enhance management)
        toast.success(`${selectedIds.length} records rejected`);
        setSelectedIds([]);
        setShowRejectModal(false);
        await refetch();
      } catch (error: any) {
        toast.error(error.message || 'Bulk rejection failed');
      } finally {
        setBulkRejecting(false);
      }
    } else {
      if (!rejectingId) return;
      try {
        await apiService.rejectFinancialControllerPayroll(rejectingId, rejectReason.trim());
        toast.success('Payroll record rejected and returned to supervisor');
        setShowRejectModal(false);
        setRejectingId(null);
        await refetch();
      } catch (error: any) {
        toast.error(error.message || 'Failed to reject payroll record');
      }
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const all = pendingPayroll || [];
    setSelectedIds(selectedIds.length === all.length ? [] : all.map((r: any) => r.id));
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Awaiting Final Approval</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{pendingPayroll?.length || 0}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Selected</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{selectedIds.length}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pending Amount</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${totalAmount.toLocaleString()}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Manager-Approved Payroll</h2>
          <p className="text-sm text-gray-500 mt-1">These records have been approved by a manager and are awaiting your final approval. Approving will deduct from the farm budget.</p>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="px-6 py-3 bg-orange-50 border-b flex items-center gap-3">
            <span className="text-sm text-orange-700 font-medium">{selectedIds.length} selected</span>
            <button
              onClick={handleBulkApprove}
              disabled={bulkApproving}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
            >
              {bulkApproving ? <LoadingSpinner size="sm" /> : <CheckSquare className="w-4 h-4" />}
              Approve Selected
            </button>
            <button
              onClick={openBulkRejectModal}
              disabled={bulkRejecting}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Reject Selected
            </button>
            <button
              onClick={openBulkRejectModal}
              disabled={bulkRejecting}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Reject All Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !pendingPayroll || pendingPayroll.length === 0 ? (
            <div className="text-center py-12">
              <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500">No records awaiting final approval</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === pendingPayroll.length}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingPayroll.map((record: any) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(record.id)}
                          onChange={() => toggleSelect(record.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.worker_name}</div>
                        <div className="text-sm text-gray-500">{record.worker_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.task_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.block_id || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.rate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${record.total_amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.date_worked).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ApprovalStatusBadge status={record.approval_status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(record.id)}
                            disabled={approvingId === record.id}
                            title="Final Approve"
                            className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                          >
                            {approvingId === record.id ? <LoadingSpinner size="sm" /> : <Check className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => openRejectModal(record.id)}
                            title="Reject"
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-5 h-5" />
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {isBulkReject ? `Reject ${selectedIds.length} Records` : 'Reject Payroll Record'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {isBulkReject
                ? `All ${selectedIds.length} selected records will be returned to their supervisors with your reason.`
                : 'The record will be returned to the supervisor with your reason. All approval history will be cleared.'}
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Enter rejection reason..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setRejectingId(null); }}
                className="px-4 py-2 text-sm text-gray-700 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || bulkRejecting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {bulkRejecting && <LoadingSpinner size="sm" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
