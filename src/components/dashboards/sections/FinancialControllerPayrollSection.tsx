"use client";

import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ApprovalStatusBadge } from '../../common/ApprovalStatusBadge';
import { Check, X, Banknote, CheckSquare, AlertTriangle, Clock, History } from 'lucide-react';
import { toast } from '../../ui/sonner';

type PayrollTab = 'pending' | 'approved';

export const FinancialControllerPayrollSection: React.FC = () => {
  const [payrollTab, setPayrollTab] = useState<PayrollTab>('pending');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isBulkReject, setIsBulkReject] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [bulkRejecting, setBulkRejecting] = useState(false);

  const getPendingPayroll = useCallback(() => apiService.getFinancialControllerPendingPayroll(), []);
  const getApprovedPayroll = useCallback(() => apiService.getFinancialControllerApprovedPayroll(), []);

  const { data: pendingRaw, loading: pendingLoading, refetch: refetchPending } = useApi(getPendingPayroll);
  const { data: approvedRaw, loading: approvedLoading } = useApi(getApprovedPayroll, { immediate: false });

  const pendingPayroll = pendingRaw as any[] | null;
  const approvedPayroll = approvedRaw as any[] | null;

  const loading = payrollTab === 'pending' ? pendingLoading : approvedLoading;
  const records = payrollTab === 'pending' ? pendingPayroll : approvedPayroll;

  const totalAmount = pendingPayroll?.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0) || 0;
  const approvedTotal = approvedPayroll?.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0) || 0;

  const handleApprove = async (recordId: number) => {
    setApprovingId(recordId);
    try {
      await apiService.approveFinancialControllerPayroll(recordId);
      toast.success('Payroll record approved — budget deducted');
      await refetchPending();
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
      await refetchPending();
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
        await apiService.bulkRejectFinancialControllerPayroll({ record_ids: selectedIds, rejection_reason: rejectReason.trim() });
        toast.success(`${selectedIds.length} records rejected`);
        setSelectedIds([]);
        setShowRejectModal(false);
        await refetchPending();
      } catch (error: any) {
        toast.error(error.message || 'Bulk rejection failed');
      } finally {
        setBulkRejecting(false);
      }
    } else {
      if (!rejectingId) return;
      try {
        await apiService.rejectFinancialControllerPayroll(rejectingId, rejectReason.trim());
        toast.success('Record rejected and returned to supervisor');
        setShowRejectModal(false);
        setRejectingId(null);
        await refetchPending();
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Awaiting Approval</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{pendingPayroll?.length || 0}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Amount</p>
              <p className="text-xl font-bold text-gray-900 mt-1">TZS {totalAmount.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Banknote className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">My Approved Total</p>
              <p className="text-xl font-bold text-green-700 mt-1">TZS {approvedTotal.toLocaleString()}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckSquare className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-0">
            <button
              onClick={() => setPayrollTab('pending')}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                payrollTab === 'pending'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              Awaiting Approval
              {(pendingPayroll?.length || 0) > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                  {pendingPayroll!.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setPayrollTab('approved')}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                payrollTab === 'approved'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <History className="w-4 h-4" />
              My Approvals
              {(approvedPayroll?.length || 0) > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  {approvedPayroll!.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Bulk action bar (pending tab only) */}
        {payrollTab === 'pending' && selectedIds.length > 0 && (
          <div className="px-6 py-3 bg-orange-50 border-b flex items-center gap-3">
            <span className="text-sm text-orange-700 font-medium">{selectedIds.length} selected</span>
            <button
              onClick={handleBulkApprove}
              disabled={bulkApproving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 cursor-pointer"
            >
              {bulkApproving ? <LoadingSpinner size="sm" /> : <CheckSquare className="w-3.5 h-3.5" />}
              Approve Selected
            </button>
            <button
              onClick={openBulkRejectModal}
              disabled={bulkRejecting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reject Selected
            </button>
            <button onClick={() => setSelectedIds([])} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
              Clear
            </button>
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !records || records.length === 0 ? (
            <div className="text-center py-12">
              {payrollTab === 'pending' ? (
                <>
                  <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No records awaiting approval</p>
                  <p className="text-sm text-gray-400 mt-1">All manager-approved payroll has been processed.</p>
                </>
              ) : (
                <>
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No approved records yet</p>
                  <p className="text-sm text-gray-400 mt-1">Records you approve will appear here.</p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {payrollTab === 'pending' && (
                      <th className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === (pendingPayroll?.length || 0) && (pendingPayroll?.length || 0) > 0}
                          onChange={toggleSelectAll}
                          className="rounded cursor-pointer"
                        />
                      </th>
                    )}
                    {['Worker', 'Farm', 'Task Code', 'Block', 'Qty', 'Rate', 'Total', 'Date',
                      ...(payrollTab === 'approved' ? ['Approved At'] : []),
                      'Status',
                      ...(payrollTab === 'pending' ? ['Actions'] : [])
                    ].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record: any) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      {payrollTab === 'pending' && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(record.id)}
                            onChange={() => toggleSelect(record.id)}
                            className="rounded cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{record.worker_name}</div>
                        <div className="text-xs text-gray-400">{record.worker_type}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{record.farm_name || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{record.task_code}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{record.block_code || record.block || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{record.quantity}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">TZS {Number(record.rate).toLocaleString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-900">
                        TZS {Number(record.total_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {new Date((record.date_worked?.split('T')[0] ?? '') + 'T00:00:00').toLocaleDateString()}
                      </td>
                      {payrollTab === 'approved' && (
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                          {record.financial_approved_at
                            ? new Date((record.financial_approved_at?.split('T')[0] ?? '') + 'T00:00:00').toLocaleDateString()
                            : '—'}
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ApprovalStatusBadge status={record.approval_status} />
                      </td>
                      {payrollTab === 'pending' && (
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(record.id)}
                              disabled={approvingId === record.id}
                              title="Final Approve"
                              className="text-green-600 hover:text-green-900 disabled:text-gray-400 cursor-pointer"
                            >
                              {approvingId === record.id ? <LoadingSpinner size="sm" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => openRejectModal(record.id)}
                              title="Reject"
                              className="text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
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
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {isBulkReject ? `Reject ${selectedIds.length} Records` : 'Reject Payroll Record'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {isBulkReject
                ? `All ${selectedIds.length} selected records will be returned to their supervisors.`
                : 'The record will be returned to the supervisor. All approval history will be cleared.'}
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
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
                className="px-4 py-2 text-sm text-gray-700 border rounded hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || bulkRejecting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 cursor-pointer"
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
