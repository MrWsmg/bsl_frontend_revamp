"use client";

// QuickBooks Sync — select approved unsynced records and mark as synced with a transaction prefix
import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { PayrollRecord } from '../../../types';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { RefreshCw, CheckSquare } from 'lucide-react';
import { toast } from '../../ui/sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const QuickBooksSyncSection: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [transactionPrefix, setTransactionPrefix] = useState<string>('QB');
  const [syncing, setSyncing] = useState(false);

  const getPending = useCallback(() => apiService.getQuickBooksPending(), []);
  const { data: pendingRecords, loading, refetch } = useApi(getPending);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const all = pendingRecords || [];
    if (selectedIds.length === all.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(all.map((r: PayrollRecord) => r.id));
    }
  };

  const handleSync = async () => {
    if (selectedIds.length === 0) return;
    if (!transactionPrefix.trim()) { toast.error('Transaction ID prefix is required'); return; }
    setSyncing(true);
    try {
      await apiService.markQuickBooksSynced({
        record_ids: selectedIds,
        transaction_id_prefix: transactionPrefix.trim(),
      });
      toast.success(`${selectedIds.length} record${selectedIds.length !== 1 ? 's' : ''} marked as synced`);
      setSelectedIds([]);
      await refetch();
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const allSelected = !!pendingRecords?.length && selectedIds.length === pendingRecords.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>QuickBooks Sync</CardTitle>
          <CardDescription>Mark approved payroll records as synced to QuickBooks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2 w-48">
              <Label>Transaction ID Prefix</Label>
              <Input
                value={transactionPrefix}
                onChange={(e) => setTransactionPrefix(e.target.value)}
                placeholder="QB"
                maxLength={10}
              />
            </div>
            <Button
              onClick={handleSync}
              disabled={selectedIds.length === 0 || syncing}
              className="mb-0.5"
            >
              {syncing ? <LoadingSpinner size="sm" /> : <CheckSquare className="w-4 h-4 mr-2" />}
              Mark {selectedIds.length > 0 ? `${selectedIds.length} ` : ''}Synced
            </Button>
            <Button variant="outline" onClick={() => refetch()} className="mb-0.5">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !pendingRecords || pendingRecords.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-muted-foreground">No records pending QuickBooks sync</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Farm</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead className="text-right">Amount (TZS)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRecords.map((record: PayrollRecord) => (
                    <TableRow key={record.id} className="cursor-pointer" onClick={() => toggleSelect(record.id)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(record.id)}
                          onChange={() => toggleSelect(record.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>{new Date(record.date_worked + 'T00:00:00').toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{record.worker_name}</TableCell>
                      <TableCell>{(record as any).farm_name || record.farm?.name || '—'}</TableCell>
                      <TableCell>{record.task_code}</TableCell>
                      <TableCell className="text-right font-semibold">{(record.total_amount || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
