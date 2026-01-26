"use client";

// Manager Item Requests Section - Approve and manage item requests
import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { CheckCircle, XCircle, Clock, Package, AlertCircle } from 'lucide-react';
import { toast } from '../../ui/sonner';

export const ManagerItemRequestsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Fetch data
  const getManagerRequests = useCallback(() => apiService.getManagerItemRequests(), []);

  const { data: requests, loading, refetch } = useApi(getManagerRequests);

  const handleApproveRequest = async (requestId: number) => {
    try {
      await apiService.approveItemRequest(requestId);
      toast.success('Item request approved successfully');
      refetch();
    } catch (error: any) {
      console.error('Failed to approve request:', error);
      toast.error(error.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await apiService.rejectItemRequest(requestId);
      toast.success('Item request rejected');
      refetch();
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      toast.error(error.message || 'Failed to reject request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = requests?.filter((request: any) => {
    if (activeTab === 'all') return true;
    return request.status?.toLowerCase() === activeTab;
  });

  // Calculate statistics
  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter((r: any) => r.status === 'pending').length || 0,
    approved: requests?.filter((r: any) => r.status === 'approved').length || 0,
    rejected: requests?.filter((r: any) => r.status === 'rejected').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Item Requests Management</h2>
            <p className="text-sm text-gray-600 mt-1">Review and approve item requests from supervisors</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Rejected</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-b-2 border-yellow-500 text-yellow-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'approved'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Approved ({stats.approved})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'rejected'
                  ? 'border-b-2 border-red-500 text-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Rejected ({stats.rejected})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-b-2 border-gray-500 text-gray-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All ({stats.total})
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !filteredRequests || filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No {activeTab} item requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request: any) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">{request.item_name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Quantity: <span className="font-medium">{request.quantity} {request.unit || 'units'}</span>
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                          {request.priority && (
                            <span className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(request.priority)}`}>
                              {request.priority} priority
                            </span>
                          )}
                        </div>
                      </div>

                      {request.reason && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Reason:</span> {request.reason}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                        {request.requested_by && (
                          <span>👤 {request.requested_by}</span>
                        )}
                        {request.farm_name && (
                          <span>🌾 {request.farm_name}</span>
                        )}
                        {request.created_at && (
                          <span>📅 {new Date(request.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions - only for pending requests */}
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-md text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};