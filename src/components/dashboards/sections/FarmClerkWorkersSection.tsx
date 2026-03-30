"use client";

import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Users, Search, X, ChevronDown, ChevronUp } from 'lucide-react';

export const FarmClerkWorkersSection: React.FC = () => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<Record<number, any>>({});

  const fetchWorkers = useCallback(() => apiService.getFarmClerkWorkers(), []);
  const { data: raw, loading } = useApi<any>(fetchWorkers);
  const workers: any[] = Array.isArray(raw) ? raw : (raw as any)?.workers ?? (raw as any)?.items ?? [];

  const filtered = search.trim()
    ? workers.filter(w =>
        (w.full_name || w.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (w.worker_id || '').toLowerCase().includes(search.toLowerCase())
      )
    : workers;

  const toggleExpand = async (workerId: number) => {
    if (expandedId === workerId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(workerId);
    if (!detail[workerId]) {
      setDetailLoading(true);
      try {
        const d = await apiService.getFarmClerkWorker(workerId);
        setDetail(prev => ({ ...prev, [workerId]: d }));
      } catch {
        // detail unavailable, show basic info only
      } finally {
        setDetailLoading(false);
      }
    }
  };

  const statusBadge = (isActive: boolean) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or worker ID..."
          className="w-full pl-9 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Worker list */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" /> Farm Workers
          </h3>
          {!loading && <span className="text-sm text-gray-500">{filtered.length} workers</span>}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{search ? 'No workers match your search' : 'No workers found'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((w: any) => {
              const isExpanded = expandedId === w.id;
              const workerDetail = detail[w.id];
              return (
                <div key={w.id}>
                  <button
                    className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 text-left"
                    onClick={() => toggleExpand(w.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-700">
                          {(w.full_name || w.name || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{w.full_name || w.name}</p>
                        <p className="text-xs text-gray-500">{w.worker_id || w.employee_id || `#${w.id}`} · {w.job_title || w.role || 'Worker'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      {statusBadge(w.is_active !== false)}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-4 bg-gray-50 border-t border-gray-100">
                      {detailLoading && !workerDetail ? (
                        <div className="py-4 flex justify-center"><LoadingSpinner size="sm" /></div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                          {[
                            { label: 'Phone', value: workerDetail?.phone_number || w.phone_number || '—' },
                            { label: 'National ID', value: workerDetail?.national_id || w.national_id || '—' },
                            { label: 'Department', value: workerDetail?.department || w.department || '—' },
                            { label: 'Employment Type', value: workerDetail?.employment_type || w.employment_type || '—' },
                            { label: 'Start Date', value: (workerDetail?.start_date || w.start_date) ? new Date(workerDetail?.start_date || w.start_date).toLocaleDateString() : '—' },
                            { label: 'Block', value: workerDetail?.block?.name || w.block_name || '—' },
                            { label: 'Rate (TZS)', value: (workerDetail?.rate || w.rate) ? `TZS ${Number(workerDetail?.rate || w.rate).toLocaleString()}` : '—' },
                            { label: 'Rate Type', value: workerDetail?.rate_type || w.rate_type || '—' },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
                              <p className="text-sm text-gray-900 mt-0.5">{value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
