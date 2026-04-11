"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShieldCheck, RefreshCw, AlertCircle, Search } from 'lucide-react';

const ACTIONS = [
  'LOGIN', 'LOGIN_FAILED', 'LOGOUT',
  'CREATE_SMR', 'APPROVE_SMR',
  'PO_APPROVE_LPO', 'PO_REJECT_LPO',
  'FC_APPROVE_LPO', 'FC_REJECT_LPO',
  'APPROVE_GRN', 'REJECT_GRN',
  'APPROVE_GIN', 'REJECT_GIN', 'ISSUE_GIN',
  'MANAGER_APPROVE_PAYROLL', 'FC_APPROVE_PAYROLL',
  'CREATE_WORKER',
] as const;

type AuditAction = typeof ACTIONS[number];

const ACTION_BADGE: Record<string, string> = {
  LOGIN:                    'bg-gray-100 text-gray-700 border-gray-300',
  LOGIN_FAILED:             'bg-red-50 text-red-700 border-red-200',
  LOGOUT:                   'bg-gray-100 text-gray-500 border-gray-300',
  CREATE_SMR:               'bg-blue-50 text-blue-700 border-blue-200',
  APPROVE_SMR:              'bg-green-50 text-green-700 border-green-200',
  PO_APPROVE_LPO:           'bg-green-50 text-green-700 border-green-200',
  PO_REJECT_LPO:            'bg-orange-50 text-orange-700 border-orange-200',
  FC_APPROVE_LPO:           'bg-green-50 text-green-700 border-green-200',
  FC_REJECT_LPO:            'bg-orange-50 text-orange-700 border-orange-200',
  APPROVE_GRN:              'bg-green-50 text-green-700 border-green-200',
  REJECT_GRN:               'bg-orange-50 text-orange-700 border-orange-200',
  APPROVE_GIN:              'bg-green-50 text-green-700 border-green-200',
  REJECT_GIN:               'bg-orange-50 text-orange-700 border-orange-200',
  ISSUE_GIN:                'bg-purple-50 text-purple-700 border-purple-200',
  MANAGER_APPROVE_PAYROLL:  'bg-green-50 text-green-700 border-green-200',
  FC_APPROVE_PAYROLL:       'bg-green-50 text-green-700 border-green-200',
  CREATE_WORKER:            'bg-blue-50 text-blue-700 border-blue-200',
};

export const AdminAuditLogsSection: React.FC = () => {
  const [action, setAction]       = useState('');
  const [userId, setUserId]       = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');

  const fetchUsers = useCallback(() => apiService.getUsers(), []);
  const { data: usersRaw } = useApi<any>(fetchUsers);
  const userList: any[] = Array.isArray(usersRaw) ? usersRaw : (usersRaw as any)?.users ?? [];

  const userMap = React.useMemo(() => {
    const m: Record<number, string> = {};
    userList.forEach((u: any) => { if (u.id != null) m[u.id] = u.full_name || u.username; });
    return m;
  }, [userList]);

  const buildParams = useCallback(() => {
    const p: Record<string, any> = {};
    if (action)    p.action     = action;
    if (userId)    p.user_id    = userId;
    if (startDate) p.start_date = startDate;
    if (endDate)   p.end_date   = endDate;
    return p;
  }, [action, userId, startDate, endDate]);

  const fetchLogs = useCallback(() => apiService.getAuditLogs(buildParams()), [buildParams]);
  const { data: logsRaw, loading, error, refetch } = useApi<any>(fetchLogs);

  const logs: any[] = Array.isArray(logsRaw)
    ? logsRaw
    : (logsRaw as any)?.logs ?? (logsRaw as any)?.results ?? [];

  const inputCls = 'border border-gray-200 rounded-md px-3 py-2 text-sm bg-white';

  const handleClear = () => {
    setAction(''); setUserId(''); setStartDate(''); setEndDate('');
  };

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
              <label className="block text-xs font-medium text-gray-600 mb-1">Action</label>
              <select value={action} onChange={e => setAction(e.target.value)} className={`w-full ${inputCls}`}>
                <option value="">All actions</option>
                {ACTIONS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">User</label>
              <select value={userId} onChange={e => setUserId(e.target.value)} className={`w-full ${inputCls}`}>
                <option value="">All users</option>
                {userList.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => refetch()} className="gap-1.5 bg-gray-800 hover:bg-gray-900 text-white">
              <Search className="w-3.5 h-3.5" /> Search
            </Button>
            <Button size="sm" variant="outline" onClick={handleClear}>
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
                    <th className="text-left px-3 py-2">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log: any, i: number) => {
                    const actionKey = (log.action ?? '') as string;
                    const badgeCls = ACTION_BADGE[actionKey] ?? 'bg-gray-100 text-gray-600 border-gray-200';
                    return (
                      <tr key={log.id ?? i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                          {log.timestamp ?? log.created_at
                            ? new Date(log.timestamp ?? log.created_at).toLocaleString()
                            : '—'}
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-800">
                          {log.username ?? log.user?.full_name ?? log.user?.username ?? (log.user_id != null ? (userMap[log.user_id] ?? `#${log.user_id}`) : '—')}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badgeCls}`}>
                            {actionKey || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {log.resource ?? log.resource_type ?? log.entity_type ?? '—'}
                          {(log.resource_id ?? log.entity_id) != null && (
                            <span className="text-gray-400 ml-1">#{log.resource_id ?? log.entity_id}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-400 max-w-xs truncate">
                          {log.details ?? log.description ?? log.notes ?? ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
