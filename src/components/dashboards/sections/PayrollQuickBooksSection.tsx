"use client";

import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ApprovalStatusBadge } from '../../common/ApprovalStatusBadge';
import { toast } from '../../ui/sonner';
import { Link2, CheckSquare } from 'lucide-react';
import { PayrollRecord } from '../../../types';

export const PayrollQuickBooksSection: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [txPrefix, setTxPrefix] = useState('QB');
  const [syncing, setSyncing] = useState(false);

  const fetchPending = useCallback(() => apiService.getQuickBooksPending(), []);
  const { data: records, loading, refetch } = useApi(fetchPending);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    const all = (records ?? []).map((r: PayrollRecord) => r.id);
    setSelectedIds(selectedIds.length === all.length ? [] : all);
  };

  const handleSync = async () => {
    if (selectedIds.length === 0) return;
    setSyncing(true);
    try {
      const result: any = await apiService.markQuickBooksSynced(selectedIds, txPrefix || 'QB');
      const synced = result?.synced_count ?? selectedIds.length;
      toast.success(`${synced} record(s) marked as synced to QuickBooks`);
      setSelectedIds([]);
      await refetch();
    } catch (err: any) {
      toast.error(err.message || 'QuickBooks sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link2 className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-semibold text-gray-900">QuickBooks Sync</h2>
        {records && records.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
            {records.length} unsynced
          </span>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {/* Action bar */}
        {selectedIds.length > 0 && (
          <div className="px-6 py-3 bg-green-50 border-b flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-green-800">{selectedIds.length} selected</span>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Transaction prefix:</label>
              <input
                type="text"
                value={txPrefix}
                onChange={(e) => setTxPrefix(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
            >
              {syncing ? <LoadingSpinner size="sm" /> : <CheckSquare className="w-4 h-4" />}
              Mark Synced
            </button>
            <button onClick={() => setSelectedIds([])} className="text-sm text-gray-500 hover:text-gray-700">
              Clear
            </button>
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : !records || records.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Link2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No records awaiting QuickBooks sync.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === records.length && records.length > 0}
                        onChange={toggleAll}
                        className="rounded"
                      />
                    </th>
                    {['Date', 'Worker', 'Farm', 'Task', 'Total (TZS)', 'Status', 'QB Transaction ID'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((r: PayrollRecord) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          className="rounded"
                          disabled={r.quickbooks_synced}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{r.date_worked}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.worker_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.farm_name ?? r.farm?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.task_code}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{Number(r.total_amount).toLocaleString()}</td>
                      <td className="px-4 py-3"><ApprovalStatusBadge status={r.approval_status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {r.quickbooks_transaction_id ?? <span className="text-gray-300 italic">not synced</span>}
                      </td>
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
