"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileText, AlertCircle, RefreshCw, Plus } from 'lucide-react';

const statusColor: Record<string, string> = {
  draft:               'bg-gray-100 text-gray-700',
  pending_approval:    'bg-yellow-100 text-yellow-800',
  pending_gm_approval: 'bg-orange-100 text-orange-800',
  pending_md_approval: 'bg-amber-100 text-amber-800',
  approved:            'bg-green-100 text-green-800',
  rejected:            'bg-red-100 text-red-800',
  ordered:             'bg-blue-100 text-blue-800',
  lpo_created:         'bg-blue-100 text-blue-800',
};

const priorityColor: Record<string, string> = {
  low:    'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-700',
  high:   'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

interface Props { onCreateLpo?: (smrId: number, smrNumber: string, smrItems: any[]) => void; }

export const ProcurementSmrSection: React.FC<Props> = ({ onCreateLpo }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const getSmrs = useCallback(
    () => apiService.getProcurementSmrs(statusFilter ? { status: statusFilter } : undefined),
    [statusFilter],
  );
  const { data: smrs, loading, error, refetch } = useApi(getSmrs);

  const filtered = Array.isArray(smrs)
    ? smrs.filter((s: any) =>
        !search ||
        s.pr_number?.toLowerCase().includes(search.toLowerCase()) ||
        s.department?.toLowerCase().includes(search.toLowerCase()) ||
        s.justification?.toLowerCase().includes(search.toLowerCase()),
      )
    : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            Material Requisitions (SMR)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by number, department…"
                className="pl-8 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value="">All statuses</option>
              <option value="approved">Approved</option>
              <option value="pending_approval">Pending approval</option>
              <option value="ordered">Ordered</option>
            </select>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No requisitions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((smr: any) => (
                <div key={smr.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {(smr.smr_number ?? smr.pr_number) && (
                          <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded">
                            {smr.smr_number ?? smr.pr_number}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[smr.status?.toLowerCase()] ?? 'bg-gray-100 text-gray-700'}`}>
                          {smr.status?.replace(/_/g, ' ')}
                        </span>
                        {smr.priority && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor[smr.priority?.toLowerCase()] ?? ''}`}>
                            {smr.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {smr.department || 'Department N/A'}
                      </p>
                      {smr.justification && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{smr.justification}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {smr.total_estimated_cost != null && (
                        <p className="text-sm font-semibold text-gray-800">
                          {Number(smr.total_estimated_cost).toLocaleString()} TZS
                        </p>
                      )}
                      {smr.created_at && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(smr.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {Array.isArray(smr.items) && smr.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {smr.items.slice(0, 4).map((item: any, i: number) => (
                        <div key={i} className="text-xs text-gray-600 flex justify-between bg-gray-50 rounded px-2 py-1">
                          <span>{item.item_name}</span>
                          <span className="text-gray-400">{item.quantity} {item.unit}</span>
                        </div>
                      ))}
                      {smr.items.length > 4 && (
                        <p className="text-xs text-gray-400 px-2">+{smr.items.length - 4} more items</p>
                      )}
                    </div>
                  )}
                  {onCreateLpo && (
                    <div className="mt-3 pt-3 border-t border-gray-50 flex justify-end">
                      {smr.status?.toLowerCase() === 'lpo_created' ? (
                        <span className="text-xs text-blue-600 font-medium">LPO Raised</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onCreateLpo(smr.id, smr.smr_number ?? smr.pr_number ?? `SMR #${smr.id}`, Array.isArray(smr.items) ? smr.items : [])}
                          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Create LPO
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
