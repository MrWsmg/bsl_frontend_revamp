"use client";

import React, { useState, useCallback } from 'react';
import { Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { useApi } from '@/hooks';
import apiService from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { HopperEntryForm } from './HopperEntryForm';
import type { Farm } from '@/types';
import type { HopperEntry } from '@/types/cherry-parchment';

interface Props {
  farms: Farm[];
  farmId: number | null;
  dateFrom: string;
  dateTo: string;
}

export const HopperStockList: React.FC<Props> = ({ farms, farmId, dateFrom, dateTo }) => {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HopperEntry | null>(null);

  const fetchEntries = useCallback(() => {
    if (!farmId) return Promise.resolve([]);
    return apiService.cherryParchment.listHopperEntries({
      farm_id: farmId,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  }, [farmId, dateFrom, dateTo]);

  const { data: entries, loading, error, refetch } = useApi<HopperEntry[]>(fetchEntries, {
    dependencies: [farmId, dateFrom, dateTo],
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this entry?')) return;
    await apiService.cherryParchment.deleteHopperEntry(id);
    refetch();
  };

  const list = entries ?? [];
  const currentBalance = list.length > 0 ? list[list.length - 1].balance_kg : 0;
  const totalIn = list.reduce((s, e) => s + e.cherry_in_kg, 0);
  const totalOut = list.reduce((s, e) => s + e.cherry_out_kg, 0);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">Total In: <strong className="text-green-700">{totalIn.toFixed(2)} KG</strong></span>
            <span className="text-muted-foreground">Total Out: <strong className="text-orange-700">{totalOut.toFixed(2)} KG</strong></span>
            <span className="text-muted-foreground">Balance: <strong className="text-blue-700">{currentBalance.toFixed(2)} KG</strong></span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={refetch}><RefreshCw className="h-4 w-4" /></Button>
            <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Cherry
            </Button>
          </div>
        </div>

        {!farmId && (
          <p className="text-sm text-muted-foreground text-center py-8">Select a farm to view hopper stock.</p>
        )}

        {farmId && loading && <div className="flex justify-center py-8"><LoadingSpinner /></div>}
        {farmId && error && <p className="text-sm text-red-600 text-center">{error}</p>}

        {farmId && !loading && list.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No hopper entries found.</p>
        )}

        {farmId && !loading && list.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Cherry In (KG)</TableHead>
                    <TableHead className="text-right">Cherry Out (KG)</TableHead>
                    <TableHead className="text-right">Balance (KG)</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right font-medium text-green-700">{entry.cherry_in_kg.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-orange-700">{entry.cherry_out_kg.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold text-blue-700">{entry.balance_kg.toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{entry.notes ?? '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => { setEditing(entry); setShowForm(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500"
                            onClick={() => handleDelete(entry.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Balance summary row */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Current Balance</TableCell>
                    <TableCell className="text-right text-green-700">{totalIn.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-orange-700">{totalOut.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-blue-700">{currentBalance.toFixed(2)}</TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <HopperEntryForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSaved={refetch}
        farms={farms}
        existing={editing}
      />
    </>
  );
};
