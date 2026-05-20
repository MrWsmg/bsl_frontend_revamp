"use client";

import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { toast } from '../../ui/sonner';
import { AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import type { MandayAnalysisRow, MandayOverrideRequest } from '../../../services/api/manday';

interface Props {
  /** Override farmId (e.g. admin viewing another farm). Falls back to user.farm_id if omitted. */
  farmId?: number;
}

function PctBar({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100);
  const color = pct >= 100 ? 'bg-red-500' : pct >= 95 ? 'bg-yellow-400' : 'bg-green-500';
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

function StatusBadge({ status }: { status: MandayOverrideRequest['status'] }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending_gm: { label: 'Pending GM', cls: 'bg-yellow-100 text-yellow-800' },
    approved_gm: { label: 'Approved GM', cls: 'bg-blue-100 text-blue-800' },
    pending_md: { label: 'Pending MD', cls: 'bg-purple-100 text-purple-800' },
    approved_md: { label: 'Approved', cls: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-800' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

export const MandayBudgetSection: React.FC<Props> = ({ farmId: farmIdProp }) => {
  const { user } = useAuth();
  const farmId = farmIdProp ?? (user as any)?.farm_id ?? 0;
  const role: string = (user as any)?.role ?? '';

  const [activeTab, setActiveTab] = useState<'analysis' | 'requests'>('analysis');
  const [justification, setJustification] = useState('');
  const [selectedRow, setSelectedRow] = useState<MandayAnalysisRow | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchAnalysis = useCallback(
    () => apiService.manday.getMandayAnalysis({ farm_id: farmId }),
    [farmId]
  );
  const fetchRequests = useCallback(
    () => apiService.manday.listOverrideRequests({ farm_id: farmId }),
    [farmId]
  );

  const { data: analysis, loading: analysisLoading, refetch: refetchAnalysis } = useApi(fetchAnalysis, {
    immediate: activeTab === 'analysis',
  });
  const { data: requests, loading: requestsLoading, refetch: refetchRequests } = useApi(fetchRequests, {
    immediate: activeTab === 'requests',
  });

  // ── Manager: submit override request ──────────────────────────────────────
  const handleSubmitOverride = async () => {
    if (!selectedRow || !justification.trim()) return;
    try {
      await apiService.manday.createOverrideRequest({
        farm_id: farmId,
        block_id: selectedRow.block_id,
        task_code: selectedRow.task_code,
        justification: justification.trim(),
      });
      toast.success('Override request submitted to General Manager.');
      setShowOverrideModal(false);
      setJustification('');
      setSelectedRow(null);
      refetchRequests();
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit override request');
    }
  };

  // ── GM: approve ───────────────────────────────────────────────────────────
  const handleGmApprove = async (id: number) => {
    setActioningId(id);
    try {
      await apiService.manday.gmApprove(id, actionNotes || undefined);
      toast.success('Approved — forwarded to Managing Director.');
      setActionNotes('');
      refetchRequests();
    } catch (e: any) {
      toast.error(e.message || 'Approval failed');
    } finally {
      setActioningId(null);
    }
  };

  // ── MD: approve ───────────────────────────────────────────────────────────
  const handleMdApprove = async (id: number) => {
    setActioningId(id);
    try {
      await apiService.manday.mdApprove(id, actionNotes || undefined);
      toast.success('Final approval granted — FC notified for review.');
      setActionNotes('');
      refetchRequests();
    } catch (e: any) {
      toast.error(e.message || 'Approval failed');
    } finally {
      setActioningId(null);
    }
  };

  // ── FC: review ────────────────────────────────────────────────────────────
  const handleFcReview = async (id: number) => {
    setActioningId(id);
    try {
      await apiService.manday.fcReview(id, actionNotes || undefined);
      toast.success('FC review recorded.');
      setActionNotes('');
      refetchRequests();
    } catch (e: any) {
      toast.error(e.message || 'Review failed');
    } finally {
      setActioningId(null);
    }
  };

  // ── Reject (GM or MD) ─────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    try {
      await apiService.manday.reject(rejectingId, rejectReason.trim());
      toast.success('Override request rejected.');
      setShowRejectModal(false);
      setRejectReason('');
      setRejectingId(null);
      refetchRequests();
    } catch (e: any) {
      toast.error(e.message || 'Rejection failed');
    }
  };

  const canApproveAsGm = role === 'general_manager' || role === 'admin';
  const canApproveAsMd = role === 'managing_director' || role === 'admin';
  const isFc = role === 'financial_controller';
  const isManager = role === 'manager' || role === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-600" />
          Manday Budget
        </h2>
        <div className="flex gap-2">
          {(['analysis', 'requests'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab === 'analysis' ? 'Usage' : 'Override Requests'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Analysis tab ── */}
      {activeTab === 'analysis' && (
        <>
          {analysisLoading ? (
            <LoadingSpinner />
          ) : !analysis?.length ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No tasks with manday benchmarks found for this farm.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                    <th className="text-left py-2 px-3">Block</th>
                    <th className="text-left py-2 px-3">Task</th>
                    <th className="text-right py-2 px-3">Budget</th>
                    <th className="text-right py-2 px-3">Actual</th>
                    <th className="text-left py-2 px-3 w-40">Usage</th>
                    <th className="text-center py-2 px-3">Status</th>
                    {isManager && <th className="py-2 px-3" />}
                  </tr>
                </thead>
                <tbody>
                  {analysis.map(row => (
                    <tr key={`${row.block_id}-${row.task_code}`} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{row.block_name ?? row.block_id}</td>
                      <td className="py-2 px-3 text-gray-600">{row.task_name} <span className="text-gray-400">({row.task_code})</span></td>
                      <td className="py-2 px-3 text-right">{row.budget_mandays}</td>
                      <td className="py-2 px-3 text-right">{row.actual_mandays}</td>
                      <td className="py-2 px-3">
                        <span className={`font-semibold ${row.over_budget ? 'text-red-600' : row.at_warning ? 'text-yellow-600' : 'text-green-600'}`}>
                          {row.pct_used}%
                        </span>
                        <PctBar pct={row.pct_used} />
                      </td>
                      <td className="py-2 px-3 text-center">
                        {row.over_budget ? (
                          <span className="flex items-center justify-center gap-1 text-red-600 text-xs">
                            <AlertTriangle size={12} /> Overrun
                          </span>
                        ) : row.at_warning ? (
                          <span className="flex items-center justify-center gap-1 text-yellow-600 text-xs">
                            <Clock size={12} /> Warning
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1 text-green-600 text-xs">
                            <CheckCircle size={12} /> OK
                          </span>
                        )}
                      </td>
                      {isManager && (
                        <td className="py-2 px-3">
                          {row.over_budget && (
                            <button
                              onClick={() => { setSelectedRow(row); setShowOverrideModal(true); }}
                              className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200"
                            >
                              Request Override
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Override requests tab ── */}
      {activeTab === 'requests' && (
        <>
          {requestsLoading ? (
            <LoadingSpinner />
          ) : !requests?.length ? (
            <p className="text-sm text-gray-500 text-center py-8">No override requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="border rounded-lg p-4 bg-white space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium text-sm">Request #{req.id}</span>
                      <span className="text-gray-400 text-xs ml-2">{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-xs text-gray-600">
                    Task <strong>{req.task_code}</strong> — Block {req.block_id} —{' '}
                    <strong className="text-red-600">{req.overage_pct.toFixed(1)}% used</strong>{' '}
                    ({req.actual_mandays.toFixed(1)} / {req.budget_mandays.toFixed(1)} mandays)
                  </p>
                  {req.justification && (
                    <p className="text-xs text-gray-500 italic">"{req.justification}"</p>
                  )}
                  {req.rejection_reason && (
                    <p className="text-xs text-red-500">Rejected: {req.rejection_reason}</p>
                  )}

                  {/* GM actions */}
                  {canApproveAsGm && req.status === 'pending_gm' && (
                    <div className="flex gap-2 mt-2">
                      <textarea
                        placeholder="Notes (optional)"
                        value={actioningId === req.id ? actionNotes : ''}
                        onChange={e => { setActioningId(req.id); setActionNotes(e.target.value); }}
                        className="flex-1 text-xs border rounded p-1 resize-none h-8"
                      />
                      <button
                        onClick={() => handleGmApprove(req.id)}
                        className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700"
                      >
                        <CheckCircle size={12} /> Approve
                      </button>
                      <button
                        onClick={() => { setRejectingId(req.id); setShowRejectModal(true); }}
                        className="flex items-center gap-1 bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-700"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  )}

                  {/* MD actions */}
                  {canApproveAsMd && req.status === 'approved_gm' && (
                    <div className="flex gap-2 mt-2">
                      <textarea
                        placeholder="Notes (optional)"
                        value={actioningId === req.id ? actionNotes : ''}
                        onChange={e => { setActioningId(req.id); setActionNotes(e.target.value); }}
                        className="flex-1 text-xs border rounded p-1 resize-none h-8"
                      />
                      <button
                        onClick={() => handleMdApprove(req.id)}
                        className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700"
                      >
                        <CheckCircle size={12} /> Final Approve
                      </button>
                      <button
                        onClick={() => { setRejectingId(req.id); setShowRejectModal(true); }}
                        className="flex items-center gap-1 bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-700"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  )}

                  {/* FC review */}
                  {isFc && req.status === 'approved_md' && !req.fc_reviewed_at && (
                    <div className="flex gap-2 mt-2">
                      <textarea
                        placeholder="FC review notes (optional)"
                        value={actioningId === req.id ? actionNotes : ''}
                        onChange={e => { setActioningId(req.id); setActionNotes(e.target.value); }}
                        className="flex-1 text-xs border rounded p-1 resize-none h-8"
                      />
                      <button
                        onClick={() => handleFcReview(req.id)}
                        className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Record Review
                      </button>
                    </div>
                  )}
                  {isFc && req.fc_reviewed_at && (
                    <p className="text-xs text-green-600">FC reviewed {new Date(req.fc_reviewed_at).toLocaleDateString()}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Override request modal (Manager) ── */}
      {showOverrideModal && selectedRow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-semibold">Request Over-Budget Override</h3>
            <p className="text-sm text-gray-600">
              Task <strong>{selectedRow.task_name}</strong> on <strong>{selectedRow.block_name}</strong> is at{' '}
              <span className="text-red-600 font-bold">{selectedRow.pct_used}%</span> of budget ({selectedRow.actual_mandays} / {selectedRow.budget_mandays} mandays).
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Justification *</label>
              <textarea
                value={justification}
                onChange={e => setJustification(e.target.value)}
                rows={3}
                placeholder="Explain why additional mandays are needed..."
                className="w-full border rounded p-2 text-sm resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowOverrideModal(false); setJustification(''); }}
                className="px-4 py-2 text-sm rounded border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOverride}
                disabled={!justification.trim()}
                className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Submit to GM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-semibold text-red-700">Reject Override Request</h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reason *</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="State reason for rejection..."
                className="w-full border rounded p-2 text-sm resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); setRejectingId(null); }}
                className="px-4 py-2 text-sm rounded border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
