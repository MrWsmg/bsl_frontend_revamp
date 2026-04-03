"use client";

// Manager Inter-Farm Transfer Section
// Shows SIMRs with PENDING_INTER_FARM status where this manager's farm is the source.
// Manager must approve (auto-creates GIN/DN/GatePass/InternalTransfer) or reject.
import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Check, X, Truck, ArrowRight, MapPin } from 'lucide-react';
import { toast } from '../../ui/sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const ManagerInterFarmSection: React.FC = () => {
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const getSimrs = useCallback(() => apiService.getPendingInterFarmSimrs(), []);
  const { data: simrs, loading, refetch } = useApi(getSimrs);

  const handleApprove = async (simrId: number) => {
    setApprovingId(simrId);
    try {
      await apiService.approveInterFarmSimr(simrId);
      toast.success('Transfer approved — GIN, Delivery Note & Gate Pass created');
      await refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve transfer');
    } finally {
      setApprovingId(null);
    }
  };

  const openRejectModal = (simrId: number) => {
    setRejectingId(simrId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    try {
      await apiService.rejectInterFarmSimr(rejectingId, rejectReason.trim());
      toast.success('Transfer rejected — request will fall back to external purchase');
      setShowRejectModal(false);
      setRejectingId(null);
      await refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject transfer');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Pending Inter-Farm Transfer Approvals
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Another farm has requested items from your farm's stock. Approving will automatically generate
            a GIN, Delivery Note, Gate Pass and transfer record. Rejecting routes the request to external procurement.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !simrs || simrs.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-muted-foreground">No pending inter-farm transfer requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {simrs.map((simr: any) => (
                <div
                  key={simr.id}
                  className="border border-blue-200 rounded-lg p-4 bg-blue-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* SIMR header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {simr.simr_number && (
                          <span className="text-xs font-mono bg-white border px-2 py-0.5 rounded">
                            {simr.simr_number}
                          </span>
                        )}
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                          Inter-Farm Transfer
                        </Badge>
                      </div>

                      {/* Farm route */}
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{simr.source_farm_name || `Farm #${simr.source_farm_id}`}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span>{simr.requesting_farm_name || `Farm #${simr.farm_id}`}</span>
                      </div>

                      {/* Request details */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-gray-700">
                        {simr.purpose && (
                          <div className="col-span-2 sm:col-span-3">
                            <span className="text-muted-foreground">Purpose: </span>
                            <span className="font-medium">{simr.purpose}</span>
                          </div>
                        )}
                        {simr.requester_name && (
                          <div>
                            <span className="text-muted-foreground">Requested by: </span>
                            <span>{simr.requester_name}</span>
                          </div>
                        )}
                        {simr.created_at && (
                          <div>
                            <span className="text-muted-foreground">Date: </span>
                            <span>{new Date(simr.created_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Items list */}
                      {simr.items && simr.items.length > 0 && (
                        <div className="bg-white border border-blue-200 rounded p-3 space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Items Requested
                          </p>
                          {simr.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="font-medium">{item.item_name}</span>
                              <span className="text-muted-foreground">
                                {item.quantity_requested} {item.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 min-w-[100px]">
                      <button
                        onClick={() => handleApprove(simr.id)}
                        disabled={approvingId === simr.id}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {approvingId === simr.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(simr.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-red-300 text-red-600 text-sm rounded hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Reject Inter-Farm Transfer</h3>
            <p className="text-sm text-gray-500 mb-4">
              The SIMR will fall back to external purchase (PENDING_SMR). The requesting supervisor will be notified.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Insufficient stock to fulfil transfer..."
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
