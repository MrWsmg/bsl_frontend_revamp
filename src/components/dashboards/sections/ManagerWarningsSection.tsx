"use client";

import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ShieldAlert, CheckCircle, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '../../ui/sonner';

const WARNING_TYPES = ['Verbal', 'Written', 'Final', 'Termination'];
const STATUSES = ['pending', 'acknowledged', 'signed', 'escalated'];

function typeBadge(type: string) {
  const map: Record<string, string> = {
    verbal: 'bg-yellow-100 text-yellow-800',
    written: 'bg-orange-100 text-orange-800',
    final: 'bg-red-100 text-red-800',
    termination: 'bg-gray-900 text-white',
  };
  const cls = map[type?.toLowerCase()] ?? 'bg-gray-100 text-gray-700';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{type}</span>;
}

function statusBadge(status: string) {
  if (status === 'signed' || status === 'acknowledged') return <Badge className="bg-green-100 text-green-800">{status}</Badge>;
  if (status === 'escalated') return <Badge className="bg-red-100 text-red-800">Escalated</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
}

export const ManagerWarningsSection: React.FC = () => {
  const [filters, setFilters] = useState({ status: '', warning_type: '', worker_name: '', start_date: '', end_date: '' });
  const [signingId, setSigningId] = useState<number | null>(null);
  const [selectedWarning, setSelectedWarning] = useState<any | null>(null);

  const fetchWarnings = useCallback(() => {
    const params: Record<string, any> = {};
    if (filters.status)       params.status       = filters.status;
    if (filters.warning_type) params.warning_type = filters.warning_type;
    if (filters.worker_name)  params.worker_name  = filters.worker_name;
    if (filters.start_date)   params.start_date   = filters.start_date;
    if (filters.end_date)     params.end_date     = filters.end_date;
    return apiService.getWarnings(params);
  }, [filters]);

  const { data: raw, loading, refetch } = useApi(fetchWarnings);
  const warnings: any[] = Array.isArray(raw) ? raw : raw?.items ?? raw?.results ?? [];

  const handleSign = async (warningId: number) => {
    setSigningId(warningId);
    try {
      await apiService.signWarning(warningId);
      toast.success('Warning signed');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign warning');
    } finally {
      setSigningId(null);
    }
  };

  const clearFilters = () => setFilters({ status: '', warning_type: '', worker_name: '', start_date: '', end_date: '' });
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Worker search */}
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Worker name</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.worker_name}
                onChange={e => setFilters(f => ({ ...f, worker_name: e.target.value }))}
                placeholder="Search worker..."
                className="w-full pl-8 border border-gray-300 rounded-md px-3 py-1.5 text-sm"
              />
            </div>
          </div>
          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Warning type</label>
            <select value={filters.warning_type} onChange={e => setFilters(f => ({ ...f, warning_type: e.target.value }))} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm">
              <option value="">All types</option>
              {WARNING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {/* Date range */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={filters.start_date} onChange={e => setFilters(f => ({ ...f, start_date: e.target.value }))} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={filters.end_date} onChange={e => setFilters(f => ({ ...f, end_date: e.target.value }))} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm" />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 pb-0.5">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16"><LoadingSpinner size="lg" /></div>
        ) : warnings.length === 0 ? (
          <div className="text-center py-16">
            <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No warnings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Warning #', 'Worker', 'Type', 'Strike', 'Category', 'Incident Date', 'Status', 'Manager Signed', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {warnings.map((w: any) => (
                  <tr
                    key={w.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedWarning(w)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                      {w.warning_number}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{w.worker_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{typeBadge(w.warning_type)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{w.strike_display ?? w.strike ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">{w.category || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {w.incident_date ? new Date(w.incident_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{statusBadge(w.status)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {w.manager_signed_at ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          {new Date(w.manager_signed_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Not signed</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                      {!w.manager_signed_by && (
                        <button
                          onClick={() => handleSign(w.id)}
                          disabled={signingId === w.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {signingId === w.id ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Sign
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Warning {selectedWarning.warning_number}</h3>
                <p className="text-sm text-gray-500">{selectedWarning.worker_name}</p>
              </div>
              {typeBadge(selectedWarning.warning_type)}
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Issue Description</p>
                <p className="text-gray-800 bg-gray-50 rounded p-3">{selectedWarning.issue_description || '—'}</p>
              </div>
              {selectedWarning.improvement_required && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Improvement Required</p>
                  <p className="text-gray-800 bg-gray-50 rounded p-3">{selectedWarning.improvement_required}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selectedWarning.improvement_timeframe && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Timeframe</p>
                    <p className="text-gray-800">{selectedWarning.improvement_timeframe}</p>
                  </div>
                )}
                {selectedWarning.review_date && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Review Date</p>
                    <p className="text-gray-800">{new Date(selectedWarning.review_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-gray-500">Employee acknowledged:</span>
                {selectedWarning.employee_acknowledged
                  ? <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Yes</span>
                  : <span className="text-gray-400">No</span>}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setSelectedWarning(null)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Close</button>
              {!selectedWarning.manager_signed_by && (
                <button
                  onClick={() => { handleSign(selectedWarning.id); setSelectedWarning(null); }}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Sign Warning
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
