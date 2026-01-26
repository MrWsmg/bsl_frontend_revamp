"use client";

// Manager Payroll section component
import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { StatusBadge } from '../../common/StatusBadge';
import { Check, X, DollarSign, Clock } from 'lucide-react';
import { toast } from '../../ui/sonner';

export const ManagerPayrollSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [approvingId, setApprovingId] = useState<number | null>(null);

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

  const handleApprove = async (recordId: number) => {
    setApprovingId(recordId);
    try {
      await apiService.approveManagerPayroll(recordId);
      toast.success('Payroll record approved successfully');
      if (activeTab === 'pending') {
        await refetchPending();
      } else {
        await refetchAll();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve payroll record');
    } finally {
      setApprovingId(null);
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
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${totals.total.toLocaleString()}
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
              onClick={() => setActiveTab('pending')}
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
              onClick={() => setActiveTab('all')}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Worker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task Code
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
                  {payrollData.map((record: any) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.worker_name}</div>
                        <div className="text-sm text-gray-500">{record.worker_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.task_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${record.rate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${record.total_amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.date_worked).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={record.approval_status} />
                      </td>
                      {activeTab === 'pending' && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleApprove(record.id)}
                            disabled={approvingId === record.id}
                            className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                          >
                            {approvingId === record.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Check className="w-5 h-5" />
                            )}
                          </button>
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
    </div>
  );
};

