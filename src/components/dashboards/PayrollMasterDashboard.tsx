"use client";

// Payroll Master Dashboard component
import React, { useState, useCallback } from 'react';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { User } from '../../types';
import { BarChart3, ClipboardList, Users, TrendingUp, DollarSign, FileText, CheckCircle } from 'lucide-react';
import { useApi } from '../../hooks';
import apiService from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { StatusBadge } from '../common/StatusBadge';
import {
  PayrollOverviewSection,
  PayrollRecordsSection,
  PayrollSummarySection,
  PayrollPickingSection
} from './sections';
import { Check, X } from 'lucide-react';
import { toast } from '../ui/sonner';

interface PayrollMasterDashboardProps {
  user: User;
  onLogout: () => void;
}

// BSL Pending Section Component
const BSLPendingSection: React.FC = () => {
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  const getPendingRecords = useCallback(() => {
    return apiService.payroll.getBslPendingPayrollRecords();
  }, []);

  const { data: pendingRecords, loading, refetch } = useApi(getPendingRecords);

  const handleApprove = async (recordId: number) => {
    setProcessingId(recordId);
    try {
      await apiService.approvePayrollRecord(recordId);
      toast.success('Payroll record approved');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve record');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (recordId: number) => {
    setProcessingId(recordId);
    try {
      await apiService.rejectPayrollRecord(recordId);
      toast.success('Payroll record rejected');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject record');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {pendingRecords && pendingRecords.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have <strong>{pendingRecords.length}</strong> payroll records pending BSL approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Records Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">BSL Pending Records</h3>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : !pendingRecords || pendingRecords.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No pending records</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRecords.map((record: any) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.worker_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.farm_name}
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
                      ${(record.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.date_worked).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={record.approval_status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(record.id)}
                          disabled={processingId === record.id}
                          className="text-green-600 hover:text-green-900 disabled:text-gray-400"
                          title="Approve"
                        >
                          {processingId === record.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Check className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(record.id)}
                          disabled={processingId === record.id}
                          className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                          title="Reject"
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
  );
};

const TAB_COMPONENTS: Record<string, React.FC> = {
  overview: PayrollOverviewSection,
  records: PayrollRecordsSection,
  pending: BSLPendingSection,
  summary: PayrollSummarySection,
  picking: PayrollPickingSection,
};

export const PayrollMasterDashboard: React.FC<PayrollMasterDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(['overview']));

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'records', label: 'Payroll Records', icon: ClipboardList },
    { id: 'pending', label: 'BSL Pending', icon: CheckCircle },
    { id: 'workers', label: 'Workers', icon: Users },
    { id: 'summary', label: 'Summary', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'picking', label: 'Picking Records', icon: TrendingUp },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMountedTabs(prev => new Set(prev).add(tabId));
  };

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLogout={onLogout}
        sidebarItems={sidebarItems}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        title="BSL Farm Tracking - Payroll Master"
      >
        {Object.entries(TAB_COMPONENTS).map(([tabId, Component]) => (
          <div
            key={tabId}
            className={activeTab === tabId ? '' : 'hidden'}
          >
            {mountedTabs.has(tabId) && <Component />}
          </div>
        ))}
        {/* Placeholder tabs */}
        {activeTab === 'workers' && <div className="p-6">Workers Management Section - Coming Soon</div>}
        {activeTab === 'reports' && <div className="p-6">Payroll Reports Section - Coming Soon</div>}
      </Layout>
    </ErrorBoundary>
  );
};
