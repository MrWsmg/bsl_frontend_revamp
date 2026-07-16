"use client";

// Manager Payroll section component
import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ApprovalStatusBadge } from '../../common/ApprovalStatusBadge';
import { Check, X, DollarSign, Clock, CheckSquare, XSquare } from 'lucide-react';
import { toast } from '../../ui/sonner';
import { Pagination, usePagination } from '../../common/Pagination';

export const ManagerPayrollSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [bulkRejecting, setBulkRejecting] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');

  const getPendingPayroll = useCallback(() => apiService.getManagerPendingPayroll(), []);
  const getAllPayroll = useCallback(() => apiService.getManagerAllPayroll(), []);

  const { data: pendingPayroll, loading: pendingLoading, refetch: refetchPending } = useApi(getPendingPayroll, {
    immediate: activeTab === 'pending'
  });
  const { data: allPayroll, loading: allLoading, refetch: refetchAll } = useApi(getAllPayroll, {
    immediate: activeTab === 'all'
  });

  const loading = activeTab === 'pending' ? pendingLoading : allLoading;
  const payrollData = activeTab === 'pending' ? pendingPayroll : allPayroll;

  const refetchCurrent = activeTab === 'pending' ? refetchPending : refetchAll;

  const handleApprove = async (recordId: number) => {
    setApprovingId(recordId);
    try {
      await apiService.approveManagerPayroll(recordId);
      toast.success('Payroll record approved');
      await refetchCurrent();
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
      await apiService.bulkApproveManagerPayroll(selectedIds);
      toast.success(`${selectedIds.length} records approved`);
      setSelectedIds([]);
      await refetchCurrent();
    } catch (error: any) {
      toast.error(error.message || 'Bulk approval failed');
    } finally {
      setBulkApproving(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0 || !bulkRejectReason.trim()) return;
    setBulkRejecting(true);
    try {
      await apiService.bulkRejectManagerPayroll(selectedIds, bulkRejectReason.trim());
      toast.success(`${selectedIds.length} records rejected`);
      setSelectedIds([]);
      setShowBulkRejectModal(false);
      setBulkRejectReason('');
      await refetchCurrent();
    } catch (error: any) {
      toast.error(error.message || 'Bulk rejection failed');
    } finally {
      setBulkRejecting(false);
    }
  };

  const openRejectModal = (recordId: number) => {
    setRejectingId(recordId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    try {
      await apiService.rejectManagerPayroll(rejectingId, rejectReason.trim());
      toast.success('Payroll record rejected');
      setShowRejectModal(false);
      setRejectingId(null);
      await refetchCurrent();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject payroll record');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const pending = pendingPayroll || [];
    if (selectedIds.length === pending.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pending.map((r: any) => r.id));
    }
  };

  const calculateTotals = () => {
    if (!payrollData) return { count: 0, total: 0 };
    return {
      count: payrollData.length,
      total: payrollData.reduce((sum: number, record: any) => sum + (record.total_amount || 0), 0)
    };
  };

  const totals = calculateTotals();

  const {
    paginatedItems: pagedRows,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    totalPages, totalItems,
  } = usePagination<any>((payrollData as any[]) || [], 25);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Records</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {pendingPayroll?.length || 0}
              </p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totals.count}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                TZS {totals.total.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Check className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => { setActiveTab('pending'); setSelectedIds([]); }}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Pending Approval
              {pendingPayroll && pendingPayroll.length > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  {pendingPayroll.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('all'); setSelectedIds([]); }}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'all'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All Records
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {activeTab === 'pending' && selectedIds.length > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-b flex items-center gap-3">
            <span className="text-sm text-blue-700 font-medium">{selectedIds.length} selected</span>
            <button
              onClick={handleBulkApprove}
              disabled={bulkApproving}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
            >
              {bulkApproving ? <LoadingSpinner size="sm" /> : <CheckSquare className="w-4 h-4" />}
              Approve All Selected
            </button>
            <button
              onClick={() => { setBulkRejectReason(''); setShowBulkRejectModal(true); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              <XSquare className="w-4 h-4" />
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

        {/* Payroll List */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !payrollData || payrollData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No payroll records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {activeTab === 'pending' && (
                      <th className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === (pendingPayroll?.length || 0) && (pendingPayroll?.length || 0) > 0}
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Worker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Farm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Block
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entered By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {activeTab === 'pending' && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagedRows.map((record: any) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      {activeTab === 'pending' && (
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(record.id)}
                            onChange={() => toggleSelect(record.id)}
                            className="rounded"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.worker_name}</div>
                        <div className="text-sm text-gray-500">{record.worker_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.farm_name || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.task_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.block_code || record.block || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        TZS {record.rate?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        TZS {record.total_amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date((record.date_worked?.split('T')[0] ?? '') + 'T00:00:00').toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.entered_by_name || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ApprovalStatusBadge status={record.approval_status} />
                      </td>
                      {activeTab === 'pending' && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(record.id)}
                              disabled={approvingId === record.id}
                              title="Approve"
                              className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                            >
                              {approvingId === record.id ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <Check className="w-5 h-5" />
                              )}
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
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalItems > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Reject Modal */}
      {showBulkRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Reject {selectedIds.length} Records</h3>
            <p className="text-sm text-gray-500 mb-4">All selected records will be returned to supervisors.</p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              rows={3}
              placeholder="Enter rejection reason..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowBulkRejectModal(false)}
                className="px-4 py-2 text-sm text-gray-700 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkReject}
                disabled={!bulkRejectReason.trim() || bulkRejecting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {bulkRejecting ? 'Rejecting...' : 'Reject All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Payroll Record</h3>
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
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

