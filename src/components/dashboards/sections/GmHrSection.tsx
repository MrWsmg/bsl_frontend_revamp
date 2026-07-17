"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldAlert, RefreshCw, AlertCircle } from 'lucide-react';

const HR_ACTIONS: Record<string, { label: string; cls: string }> = {
  warning:    { label: 'Warning',    cls: 'bg-warning/20 text-warning' },
  suspension: { label: 'Suspension', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' },
  dismissal:  { label: 'Dismissal',  cls: 'bg-destructive/20 text-destructive' },
  counseling: { label: 'Counseling', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
  reinstated: { label: 'Reinstated', cls: 'bg-success/20 text-success' },
};

export const GmHrSection: React.FC = () => {
  const [farmId, setFarmId]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchFarms = useCallback(() => apiService.getFarms('admin'), []);
  const { data: farms } = useApi(fetchFarms);
  const farmList = Array.isArray(farms) ? farms : [];

  const buildParams = useCallback(() => {
    const p: Record<string, any> = {};
    if (farmId)       p.farm_id = parseInt(farmId);
    if (statusFilter) p.status  = statusFilter;
    return p;
  }, [farmId, statusFilter]);

  const fetchRecords = useCallback(async (): Promise<any[]> => {
    try {
      return await (apiService.analytics as any).get('/warnings', buildParams());
    } catch {
      return [];
    }
  }, [buildParams]);

  const { data: raw, loading, error, refetch } = useApi<any>(fetchRecords);
  const records: any[] = Array.isArray(raw)
    ? raw
    : (raw as any)?.records ?? (raw as any)?.disciplinary ?? (raw as any)?.data ?? [];

  const handleProcess = async (id: number, action: 'approve' | 'escalate') => {
    setProcessingId(id);
    try {
      await (apiService.analytics as any).post(`/warnings/${id}/${action}`, {});
      refetch();
    } catch {
      // silent — table will show stale state, user can refresh
    } finally {
      setProcessingId(null);
    }
  };

  const inputCls = 'border border-input rounded-md px-3 py-2 text-sm bg-background';

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">HR &amp; Disciplinary</h2>
          <p className="text-sm text-muted-foreground">Disciplinary records and HR workflows</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-warning" /> Disciplinary Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Farm</label>
              <Select value={farmId ? String(farmId) : '__all__'} onValueChange={(val) => setFarmId(val === '__all__' ? '' : val)}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="All farms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All farms</SelectItem>
                  {farmList.map((f: any) => {
                    const fid = f.id ?? f.farm_id;
                    return <SelectItem key={fid} value={String(fid)}>{f.name}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <Select value={statusFilter ? String(statusFilter) : '__all__'} onValueChange={(val) => setStatus(val === '__all__' ? '' : val)}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
          ) : records.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No disciplinary records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <th className="text-left px-3 py-2">Worker</th>
                    <th className="text-left px-3 py-2">Farm</th>
                    <th className="text-left px-3 py-2">Offence</th>
                    <th className="text-left px-3 py-2">Action</th>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-right px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {records.map((r: any) => {
                    const action = HR_ACTIONS[r.action_type?.toLowerCase() ?? ''];
                    return (
                      <tr key={r.id} className="hover:bg-muted/50">
                        <td className="px-3 py-2 font-medium">
                          {r.worker_name ?? r.employee_name ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{r.farm_name ?? '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground max-w-xs truncate">
                          {r.offence ?? r.reason ?? '—'}
                        </td>
                        <td className="px-3 py-2">
                          {action ? (
                            <Badge variant="secondary" className={`text-xs ${action.cls}`}>
                              {action.label}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{r.action_type ?? '—'}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {r.incident_date ?? r.date ?? '—'}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant="secondary"
                            className={`text-xs capitalize ${
                              r.status === 'approved'  ? 'bg-success/20 text-success' :
                              r.status === 'pending'   ? 'bg-warning/20 text-warning' :
                              r.status === 'escalated' ? 'bg-orange-100 text-orange-700' :
                              'bg-muted text-muted-foreground'
                            }`}
                          >
                            {r.status ?? '—'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {r.status === 'pending' && (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm" variant="outline"
                                className="h-7 text-xs text-success border-success/30"
                                onClick={() => handleProcess(r.id, 'approve')}
                                disabled={processingId === r.id}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm" variant="outline"
                                className="h-7 text-xs"
                                onClick={() => handleProcess(r.id, 'escalate')}
                                disabled={processingId === r.id}
                              >
                                Escalate
                              </Button>
                            </div>
                          )}
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
