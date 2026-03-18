"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { CheckCircle, XCircle, Package, AlertCircle, FileText, ArrowLeftRight, ShoppingCart } from 'lucide-react';
import { toast } from '../../ui/sonner';

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending_fm_approval: 'Pending Approval',
  pending_inter_farm:  'Pending Inter-Farm',
  pending_smr:         'Needs SMR (Purchase)',
  approved:            'Approved',
  rejected:            'Rejected',
  gin_created:         'GIN Created',
  issued:              'Issued',
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending_fm_approval': return 'bg-yellow-100 text-yellow-800';
    case 'pending_inter_farm':  return 'bg-blue-100 text-blue-800';
    case 'pending_smr':         return 'bg-orange-100 text-orange-800';
    case 'approved':
    case 'gin_created':         return 'bg-green-100 text-green-800';
    case 'rejected':            return 'bg-red-100 text-red-800';
    case 'issued':              return 'bg-purple-100 text-purple-800';
    default:                    return 'bg-gray-100 text-gray-800';
  }
};

const statusLabel = (s: string) =>
  STATUS_LABELS[s?.toLowerCase()] ?? s?.replace(/_/g, ' ');

// ─── component ───────────────────────────────────────────────────────────────

export const ManagerItemRequestsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'simrs' | 'gins'>('simrs');
  const [rejectTarget, setRejectTarget] = useState<{ id: number; flow: 'fm' | 'inter_farm' } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actioning, setActioning] = useState<number | null>(null);

  // ── fetch ────────────────────────────────────────────────────────────────
  const getPendingSimrs      = useCallback(() => apiService.getManagerPendingSimrs(), []);
  const getInterFarmSimrs    = useCallback(() => apiService.getPendingInterFarmSimrs(), []);
  const getPendingGins       = useCallback(() => apiService.getPendingGins(), []);

  const {
    data: fmSimrs,
    loading: loadingFmSimrs,
    error: simrError,
    refetch: refetchFmSimrs,
  } = useApi(getPendingSimrs);

  const {
    data: interFarmSimrs,
    loading: loadingInterFarmSimrs,
    refetch: refetchInterFarmSimrs,
  } = useApi(getInterFarmSimrs);

  const {
    data: gins,
    loading: loadingGins,
    error: ginError,
    refetch: refetchGins,
  } = useApi(getPendingGins);

  // Combine both pending-fm-approval and pending-inter-farm SIMRs
  const simrs = useMemo(() => {
    const fm = Array.isArray(fmSimrs) ? fmSimrs : [];
    const inter = Array.isArray(interFarmSimrs) ? interFarmSimrs : [];
    const seen = new Set<number>();
    return [...fm, ...inter].filter(s => { if (seen.has(s.id)) return false; seen.add(s.id); return true; });
  }, [fmSimrs, interFarmSimrs]);

  const loadingSimrs = loadingFmSimrs || loadingInterFarmSimrs;

  const refetchSimrs = useCallback(() => {
    refetchFmSimrs();
    refetchInterFarmSimrs();
  }, [refetchFmSimrs, refetchInterFarmSimrs]);

  // ── actions ───────────────────────────────────────────────────────────────

  const handleApproveFmSimr = async (simrId: number) => {
    setActioning(simrId);
    try {
      await apiService.approveFmSimr(simrId);
      toast.success('Request approved — stock allocation in progress');
      refetchSimrs();
      refetchGins();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to approve request');
    } finally {
      setActioning(null);
    }
  };

  const handleApproveGin = async (ginId: number) => {
    setActioning(ginId);
    try {
      await apiService.approveGin(ginId);
      toast.success('GIN approved — items released to farm clerk');
      refetchGins();
      refetchSimrs();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to approve GIN');
    } finally {
      setActioning(null);
    }
  };

  const handleApproveInterFarm = async (simrId: number) => {
    setActioning(simrId);
    try {
      await apiService.approveInterFarmSimr(simrId);
      toast.success('Inter-farm transfer approved');
      refetchSimrs();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to approve transfer');
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setActioning(rejectTarget.id);
    try {
      if (rejectTarget.flow === 'fm') {
        await apiService.rejectFmSimr(rejectTarget.id, rejectReason.trim());
        toast.success('Request rejected');
      } else {
        await apiService.rejectInterFarmSimr(rejectTarget.id, rejectReason.trim());
        toast.success('Transfer rejected');
      }
      setRejectTarget(null);
      setRejectReason('');
      refetchSimrs();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to reject');
    } finally {
      setActioning(null);
    }
  };

  // ── stats ─────────────────────────────────────────────────────────────────
  const stats = {
    pendingSimrs: Array.isArray(simrs) ? simrs.length : 0,
    pendingGins:  Array.isArray(gins)  ? gins.length  : 0,
  };

  // ── render helpers ────────────────────────────────────────────────────────

  const renderSimrCard = (simr: any) => {
    const s = simr.status?.toLowerCase();
    const isPendingFm  = s === 'pending_fm_approval';
    const isInterFarm  = s === 'pending_inter_farm';
    const isGinCreated = s === 'gin_created';
    const isPendingSmr = s === 'pending_smr';
    const isRejected   = s === 'rejected';

    // ── stock check snapshot (pending_fm_approval) ───────────────────────────
    // The backend may return per-item stock info on the items array
    const hasStockInfo = Array.isArray(simr.items) && simr.items.some(
      (i: any) => i.available_quantity != null || i.source_farm_name || i.is_available != null,
    );

    return (
      <div
        key={simr.id}
        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="min-w-0">
                {simr.simr_number && (
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded mr-2">
                    {simr.simr_number}
                  </span>
                )}
                <h4 className="font-semibold text-gray-900 text-base inline">
                  {simr.purpose || 'Item Request'}
                </h4>
              </div>
              <span className={`px-3 py-1 text-xs rounded-full flex-shrink-0 ${getStatusColor(simr.status)}`}>
                {statusLabel(simr.status)}
              </span>
            </div>

            {/* ── Items list ───────────────────────────────────────────────── */}
            {Array.isArray(simr.items) && simr.items.length > 0 && (
              <div className="space-y-1 mb-3">
                {simr.items.map((item: any, idx: number) => {
                  const qty = item.quantity_requested ?? item.quantity;
                  const avail = item.available_quantity;
                  const short = avail != null ? Math.max(0, qty - avail) : null;
                  const fromFarm = item.source_farm_name ?? item.from_farm_name;

                  return (
                    <div key={idx} className="text-sm bg-gray-50 rounded px-3 py-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">{item.item_name}</span>
                        <span className="text-gray-500">{qty} {item.unit}</span>
                      </div>

                      {/* Stock snapshot — only for pending_fm_approval */}
                      {isPendingFm && hasStockInfo && (
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                          {avail != null && (
                            <span className={avail >= qty ? 'text-green-600' : 'text-orange-600'}>
                              {avail >= qty ? `✓ ${avail} available` : `${avail} available`}
                            </span>
                          )}
                          {short != null && short > 0 && (
                            <span className="text-red-600">⚠ {short} short</span>
                          )}
                          {fromFarm && (
                            <span className="text-blue-600">from {fromFarm}</span>
                          )}
                        </div>
                      )}

                      {/* Shortage list — pending_smr */}
                      {isPendingSmr && avail != null && (
                        <div className="mt-1 text-xs text-orange-700">
                          {avail > 0 ? `Only ${avail} in stock — ${qty - avail} short` : 'No stock at any farm'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Single-item fallback */}
            {!Array.isArray(simr.items) && simr.item_name && (
              <p className="text-sm text-gray-600 mb-3">
                {simr.item_name} — {simr.quantity} {simr.unit}
              </p>
            )}

            {/* ── Meta row ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              {simr.farm_name         && <span>🌾 {simr.farm_name}</span>}
              {simr.requested_by_name && <span>👤 {simr.requested_by_name}</span>}
              {simr.created_at        && <span>📅 {new Date(simr.created_at).toLocaleDateString()}</span>}
              {simr.priority && (
                <span className={`px-2 py-0.5 rounded-full ${
                  simr.priority === 'high' ? 'bg-red-100 text-red-700' :
                  simr.priority === 'low'  ? 'bg-green-100 text-green-700' :
                                             'bg-yellow-100 text-yellow-700'
                }`}>
                  {simr.priority}
                </span>
              )}
            </div>

            {/* ── Status-specific callouts ──────────────────────────────────── */}

            {/* GIN badge */}
            {isGinCreated && (simr.gin_number || simr.gin_id) && (
              <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm text-green-800">
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span>
                  GIN created
                  {simr.gin_number && <span className="font-mono ml-1">{simr.gin_number}</span>}
                  {' '}— approve it in the <strong>Pending GIN Approvals</strong> tab.
                </span>
              </div>
            )}

            {/* Inter-farm source farm info */}
            {isInterFarm && (simr.source_farm_name ?? simr.transfer_farm_name) && (
              <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm text-blue-800">
                <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
                <span>
                  Items to be transferred from <strong>{simr.source_farm_name ?? simr.transfer_farm_name}</strong>
                </span>
              </div>
            )}

            {/* SMR — no stock anywhere */}
            {isPendingSmr && (
              <div className="mt-3 flex items-start gap-2 bg-orange-50 border border-orange-200 rounded p-3 text-sm text-orange-800">
                <ShoppingCart className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Insufficient stock at all farms. An SMR (external purchase) must be raised
                  through the Procurement module.
                </span>
              </div>
            )}

            {/* Rejected reason */}
            {isRejected && simr.rejection_reason && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-700">
                <span className="font-medium">Rejection reason: </span>{simr.rejection_reason}
              </div>
            )}
          </div>

          {/* ── Action buttons ───────────────────────────────────────────────── */}
          {(isPendingFm || isInterFarm) && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  if (isPendingFm)  handleApproveFmSimr(simr.id);
                  if (isInterFarm)  handleApproveInterFarm(simr.id);
                }}
                disabled={actioning === simr.id}
                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-md text-sm disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {actioning === simr.id ? 'Approving…' : 'Approve'}
              </button>
              <button
                onClick={() => {
                  setRejectTarget({ id: simr.id, flow: isPendingFm ? 'fm' : 'inter_farm' });
                  setRejectReason('');
                }}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGinCard = (gin: any) => (
    <div
      key={gin.id}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              {gin.gin_number && (
                <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded mr-2">
                  {gin.gin_number}
                </span>
              )}
              {gin.simr_number && (
                <span className="text-xs text-gray-500">SIMR: {gin.simr_number}</span>
              )}
            </div>
            <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(gin.status)}`}>
              {statusLabel(gin.status)}
            </span>
          </div>

          {Array.isArray(gin.items) && gin.items.length > 0 && (
            <div className="space-y-1 mb-3">
              {gin.items.map((item: any, idx: number) => (
                <div key={idx} className="text-sm text-gray-700 bg-gray-50 rounded px-3 py-1 flex justify-between">
                  <span className="font-medium">{item.item_name}</span>
                  <span className="text-gray-500">{item.quantity_approved ?? item.quantity} {item.unit}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            {gin.farm_name  && <span>🌾 {gin.farm_name}</span>}
            {gin.created_at && <span>📅 {new Date(gin.created_at).toLocaleDateString()}</span>}
          </div>
        </div>

        <button
          onClick={() => handleApproveGin(gin.id)}
          disabled={actioning === gin.id}
          className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-md text-sm disabled:opacity-50 flex-shrink-0"
        >
          <CheckCircle className="w-4 h-4" />
          {actioning === gin.id ? 'Approving…' : 'Approve GIN'}
        </button>
      </div>
    </div>
  );

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900">Item Requests</h2>
        <p className="text-sm text-gray-600 mt-1">Approve supervisor requests and GIN issuances</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Pending Requests</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingSimrs}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Pending GIN Approvals</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.pendingGins}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('simrs')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'simrs'
                  ? 'border-b-2 border-yellow-500 text-yellow-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Requests ({stats.pendingSimrs})
            </button>
            <button
              onClick={() => setActiveTab('gins')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'gins'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending GIN Approvals ({stats.pendingGins})
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* SIMR tab */}
          {activeTab === 'simrs' && (
            <>
              {simrError && (
                <div className="bg-red-50 border border-red-200 rounded p-3 flex gap-2 text-sm text-red-700 mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {simrError}
                </div>
              )}
              {loadingSimrs ? (
                <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
              ) : !Array.isArray(simrs) || simrs.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No pending requests</p>
                </div>
              ) : (
                <div className="space-y-4">{simrs.map(renderSimrCard)}</div>
              )}
            </>
          )}

          {/* GIN tab */}
          {activeTab === 'gins' && (
            <>
              {ginError && (
                <div className="bg-red-50 border border-red-200 rounded p-3 flex gap-2 text-sm text-red-700 mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {ginError}
                </div>
              )}
              {loadingGins ? (
                <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
              ) : !Array.isArray(gins) || gins.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No GINs pending approval</p>
                </div>
              ) : (
                <div className="space-y-4">{gins.map(renderGinCard)}</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-3">
              {rejectTarget.flow === 'fm' ? 'Reject Request' : 'Reject Transfer'}
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection…"
              className="w-full border border-gray-300 rounded-md p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actioning === rejectTarget.id}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
              >
                {actioning === rejectTarget.id ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
