"use client";

import React, { useState, useCallback } from 'react';
import { Plus, RefreshCw, Pencil, Trash2, CheckCircle, Clock } from 'lucide-react';
import { useApi } from '@/hooks';
import apiService from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ParchmentRecordForm } from './ParchmentRecordForm';
import type { Farm } from '@/types';
import type { C2PRecord } from '@/types/cherry-parchment';

interface Props {
  farms: Farm[];
  farmId: number | null;
  dateFrom: string;
  dateTo: string;
}

export const ParchmentRecordList: React.FC<Props> = ({ farms, farmId, dateFrom, dateTo }) => {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<C2PRecord | null>(null);
  const [unsignedOnly, setUnsignedOnly] = useState(false);
  const [signingId, setSigningId] = useState<number | null>(null);

  const fetchRecords = useCallback(() => {
    return apiService.cherryParchment.listRecords({
      farm_id: farmId ?? undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      dn_signed: unsignedOnly ? false : undefined,
    });
  }, [farmId, dateFrom, dateTo, unsignedOnly]);

  const { data: records, loading, error, refetch } = useApi<C2PRecord[]>(fetchRecords, {
    dependencies: [farmId, dateFrom, dateTo, unsignedOnly],
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this parchment record?')) return;
    await apiService.cherryParchment.deleteRecord(id);
    refetch();
  };

  const handleSignDN = async (id: number) => {
    setSigningId(id);
    try {
      await apiService.cherryParchment.signDN(id);
      refetch();
    } finally {
      setSigningId(null);
    }
  };

  const list = records ?? [];

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={unsignedOnly ? 'default' : 'outline'}
              onClick={() => setUnsignedOnly(v => !v)}
            >
              {unsignedOnly ? 'Unsigned Only' : 'All Records'}
            </Button>
            <span className="text-sm text-muted-foreground">{list.length} records</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={refetch}><RefreshCw className="h-4 w-4" /></Button>
            <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Record
            </Button>
          </div>
        </div>

        {loading && <div className="flex justify-center py-8"><LoadingSpinner /></div>}
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        {!loading && list.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No parchment records found.</p>
        )}

        {!loading && list.length > 0 && (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Block</TableHead>
                    <TableHead className="text-right">Cherry In</TableHead>
                    <TableHead className="text-right">P1</TableHead>
                    <TableHead className="text-right">P2</TableHead>
                    <TableHead className="text-right">P3</TableHead>
                    <TableHead className="text-right">Total Parch.</TableHead>
                    <TableHead className="text-right">Outturn%</TableHead>
                    <TableHead>DN #</TableHead>
                    <TableHead>DN Signed</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{new Date(r.batch_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {r.block_code ? (
                          <Badge variant="outline">{r.block_code}</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right">{r.cherry_kg_in.toFixed(1)}</TableCell>
                      <TableCell className="text-right text-green-700">{r.p1_kg_out.toFixed(1)}</TableCell>
                      <TableCell className="text-right text-blue-700">{r.p2_kg_out.toFixed(1)}</TableCell>
                      <TableCell className="text-right text-purple-700">{r.p3_kg_out.toFixed(1)}</TableCell>
                      <TableCell className="text-right font-semibold">{r.total_parchment_kg.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={r.outturn_pct >= 20 ? 'default' : 'secondary'}>
                          {r.outturn_pct.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{r.dn_number ?? '—'}</TableCell>
                      <TableCell>
                        {r.dn_signed ? (
                          <span className="flex items-center gap-1 text-green-700 text-sm">
                            <CheckCircle className="h-3.5 w-3.5" /> Signed
                          </span>
                        ) : r.dn_number ? (
                          <Button
                            size="sm" variant="outline"
                            className="h-7 text-xs text-amber-700 border-amber-300"
                            disabled={signingId === r.id}
                            onClick={() => handleSignDN(r.id)}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {signingId === r.id ? '…' : 'Sign DN'}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">No DN</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => { setEditing(r); setShowForm(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500"
                            onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <ParchmentRecordForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSaved={refetch}
        farms={farms}
        existing={editing}
      />
    </>
  );
};
