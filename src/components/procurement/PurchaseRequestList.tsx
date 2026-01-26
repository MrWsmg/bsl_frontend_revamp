"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Eye, FileText, AlertTriangle } from 'lucide-react';
import apiService from '../../services/api';
import { PurchaseRequest, Farm } from '../../types';
import { PR_STATUS, APPROVAL_LEVELS } from '../../constants';
import { toast } from 'sonner';

interface PurchaseRequestListProps {
  userRole: string;
  onSelectPR?: (pr: PurchaseRequest) => void;
}

export const PurchaseRequestList: React.FC<PurchaseRequestListProps> = ({
  userRole,
  onSelectPR,
}) => {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    loadData();
  }, [selectedFarm, selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prData, farmData] = await Promise.all([
        apiService.procurement.getPurchaseRequests({
          farm_id: selectedFarm ? parseInt(selectedFarm) : undefined,
          status: selectedStatus || undefined,
        }),
        apiService.farms.getFarms(),
      ]);
      setRequests(prData);
      setFarms(farmData);
    } catch (error) {
      console.error('Error loading purchase requests:', error);
      toast.error('Failed to load purchase requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      [PR_STATUS.DRAFT]: { color: 'gray', icon: Clock, text: 'Draft' },
      [PR_STATUS.PENDING_APPROVAL]: { color: 'yellow', icon: Clock, text: 'Pending Manager' },
      [PR_STATUS.PENDING_GM_APPROVAL]: { color: 'orange', icon: Clock, text: 'Pending GM' },
      [PR_STATUS.PENDING_MD_APPROVAL]: { color: 'orange', icon: Clock, text: 'Pending MD' },
      [PR_STATUS.APPROVED]: { color: 'green', icon: CheckCircle, text: 'Approved' },
      [PR_STATUS.REJECTED]: { color: 'red', icon: XCircle, text: 'Rejected' },
      [PR_STATUS.ORDERED]: { color: 'blue', icon: FileText, text: 'Ordered' },
    };

    const badge = badges[status as keyof typeof badges] || badges[PR_STATUS.DRAFT];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-${badge.color}-100 text-${badge.color}-800`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[priority as keyof typeof colors] || colors.normal}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const getApprovalProgress = (pr: PurchaseRequest) => {
    const level = pr.approval_level;
    const maxLevel = pr.estimated_cost >= 20000000 ? 4 : pr.estimated_cost >= 5000000 ? 3 : 2;
    const percentage = (level / maxLevel) * 100;

    return { level, maxLevel, percentage };
  };

  const canApprove = (pr: PurchaseRequest) => {
    if (pr.status === PR_STATUS.APPROVED || pr.status === PR_STATUS.REJECTED) {
      return false;
    }

    if (userRole === 'manager' && pr.status === PR_STATUS.PENDING_APPROVAL) {
      return true;
    }
    if (userRole === 'general_manager' && pr.status === PR_STATUS.PENDING_GM_APPROVAL) {
      return true;
    }
    if (userRole === 'managing_director' && pr.status === PR_STATUS.PENDING_MD_APPROVAL) {
      return true;
    }

    return false;
  };

  const handleApprove = (pr: PurchaseRequest) => {
    setSelectedPR(pr);
    setApprovalAction('approve');
    setApprovalNotes('');
    setShowApprovalModal(true);
  };

  const handleReject = (pr: PurchaseRequest) => {
    setSelectedPR(pr);
    setApprovalAction('reject');
    setApprovalNotes('');
    setShowApprovalModal(true);
  };

  const submitApproval = async () => {
    if (!selectedPR) return;

    try {
      if (approvalAction === 'approve') {
        if (userRole === 'manager') {
          await apiService.procurement.approvePurchaseRequestManager(selectedPR.id, approvalNotes);
        } else if (userRole === 'general_manager') {
          await apiService.procurement.approvePurchaseRequestGM(selectedPR.id, approvalNotes);
        } else if (userRole === 'managing_director') {
          await apiService.procurement.approvePurchaseRequestMD(selectedPR.id, approvalNotes);
        }
        toast.success('Purchase Request approved successfully!');
      } else {
        await apiService.procurement.rejectPurchaseRequest(selectedPR.id, approvalNotes);
        toast.success('Purchase Request rejected');
      }

      setShowApprovalModal(false);
      setSelectedPR(null);
      loadData();
    } catch (error: any) {
      console.error('Error processing approval:', error);
      toast.error(error.response?.data?.detail || 'Failed to process approval');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Purchase Requests</h2>
          <p className="text-sm text-gray-600 mt-1">Review and approve purchase requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Farm</label>
            <select
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Farms</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value={PR_STATUS.PENDING_APPROVAL}>Pending Manager</option>
              <option value={PR_STATUS.PENDING_GM_APPROVAL}>Pending GM</option>
              <option value={PR_STATUS.PENDING_MD_APPROVAL}>Pending MD</option>
              <option value={PR_STATUS.APPROVED}>Approved</option>
              <option value={PR_STATUS.REJECTED}>Rejected</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Purchase Requests List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Loading purchase requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">No Purchase Requests Found</h3>
          <p className="text-gray-600">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((pr) => {
            const progress = getApprovalProgress(pr);

            return (
              <div key={pr.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{pr.pr_number}</h3>
                      {getStatusBadge(pr.status)}
                      {getPriorityBadge(pr.priority)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Department: {pr.department} | Farm: {pr.farm?.name || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {pr.estimated_cost.toLocaleString()} {pr.currency}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(pr.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Justification:</p>
                  <p className="text-sm text-gray-600">{pr.justification}</p>
                </div>

                {/* Approval Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Approval Progress</span>
                    <span>
                      Level {progress.level} of {progress.maxLevel}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Approval History */}
                {pr.approval_level > 0 && (
                  <div className="bg-gray-50 rounded p-3 mb-4 text-xs space-y-1">
                    {pr.manager_approved_at && (
                      <div className="flex items-center text-green-700">
                        <CheckCircle className="w-3 h-3 mr-2" />
                        <span>Manager approved on {new Date(pr.manager_approved_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {pr.gm_approved_at && (
                      <div className="flex items-center text-green-700">
                        <CheckCircle className="w-3 h-3 mr-2" />
                        <span>GM approved on {new Date(pr.gm_approved_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {pr.md_approved_at && (
                      <div className="flex items-center text-green-700">
                        <CheckCircle className="w-3 h-3 mr-2" />
                        <span>MD approved on {new Date(pr.md_approved_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => onSelectPR?.(pr)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </button>

                  {canApprove(pr) && (
                    <>
                      <button
                        onClick={() => handleApprove(pr)}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(pr)}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedPR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {approvalAction === 'approve' ? 'Approve' : 'Reject'} Purchase Request
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              PR Number: <span className="font-medium">{selectedPR.pr_number}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {approvalAction === 'approve' ? 'Approval' : 'Rejection'} Notes
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Enter your notes..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitApproval}
                className={`px-4 py-2 text-white rounded-md ${
                  approvalAction === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                Confirm {approvalAction === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

