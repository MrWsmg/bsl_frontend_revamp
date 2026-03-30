"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShieldCheck, RefreshCw, AlertCircle, Search } from 'lucide-react';

const ACTION_TYPES = [
  'login', 'logout', 'create', 'update', 'delete',
  'approve', 'reject', 'upload', 'download',
];

export const AdminAuditLogsSection: React.FC = () => {
  const [actionType, setActionType] = useState('');
  const [farmId, setFarmId]         = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');

  const fetchFarms = useCallback(() => apiService.getFarms('admin'), []);
  const { data: farms } = useApi(fetchFarms);
  const farmList = Array.isArray(farms) ? farms : [];

  const buildParams = useCallback(() => {
    const p: Record<string, any> = {};
    if (actionType) p.action_type = actionType;
    if (farmId)     p.farm_id     = parseInt(farmId);
    if (dateFrom)   p.date_from   = dateFrom;
    if (dateTo)     p.date_to     = dateTo;
    return p;
  }, [actionType, farmId, dateFrom, dateTo]);

  const fetchLogs = useCallback(() => apiService.getAuditLogs(buildParams()), [buildParams]);
  const { data: logsRaw, loading, error, refetch } = useApi<any>(fetchLogs);

  const logs: any[] = Array.isArray(logsRaw)
    ? logsRaw
    : (logsRaw as any)?.logs ?? (logsRaw as any)?.results ?? [];

  const inputCls = 'border border-gray-200 rounded-md px-3 py-2 text-sm bg-white';

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gray-600" />
            Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Action Type</label>
              <select value={actionType} onChange={e => setActionType(e.target.value)} className={`w-full ${inputCls}`}>
                <option value="">All actions</option>
                {ACTION_TYPES.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Farm</label>
              <select value={farmId} onChange={e => setFarmId(e.target.value)} className={`w-full ${inputCls}`}>
                <option value="">All farms</option>
                {farmList.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => refetch()} className="gap-1.5 bg-gray-800 hover:bg-gray-900 text-white">
              <Search className="w-3.5 h-3.5" /> Search
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              setActionType(''); setFarmId(''); setDateFrom(''); setDateTo('');
            }}>
              Clear
            </Button>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-3 py-2">Timestamp</th>
                    <th className="text-left px-3 py-2">User</th>
                    <th className="text-left px-3 py-2">Action</th>
                    <th className="text-left px-3 py-2">Resource</th>
                    <th className="text-left px-3 py-2">Farm</th>
                    <th className="text-left px-3 py-2">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log: any, i: number) => (
                    <tr key={log.id ?? i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                        {log.timestamp || log.created_at
                          ? new Date(log.timestamp ?? log.created_at).toLocaleString()
                          : '—'}
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-800">
                        {log.username ?? log.user?.username ?? log.user_id ?? '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          log.action_type === 'delete'  ? 'bg-red-50 text-red-700 border-red-200' :
                          log.action_type === 'approve' ? 'bg-green-50 text-green-700 border-green-200' :
                          log.action_type === 'reject'  ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          log.action_type === 'create'  ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {log.action_type ?? log.action ?? '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {log.resource_type ?? log.entity_type ?? '—'}
                        {(log.resource_id ?? log.entity_id) != null && (
                          <span className="text-gray-400 ml-1">#{log.resource_id ?? log.entity_id}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {log.farm?.name ?? log.farm_name ?? (log.farm_id ? `#${log.farm_id}` : '—')}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400 max-w-xs truncate">
                        {log.details ?? log.description ?? log.notes ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
