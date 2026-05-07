"use client";

import React from 'react';
import { useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useApi } from '@/hooks';
import apiService from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { C2PSummary } from '@/types/cherry-parchment';

interface Props {
  farmId: number | null;
  dateFrom: string;
  dateTo: string;
}

export const SummaryByBlock: React.FC<Props> = ({ farmId, dateFrom, dateTo }) => {
  const fetchSummary = useCallback(() => {
    return apiService.cherryParchment.getSummary({
      farm_id: farmId ?? undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  }, [farmId, dateFrom, dateTo]);

  const { data: summary, loading, error, refetch } = useApi<C2PSummary>(fetchSummary, {
    dependencies: [farmId, dateFrom, dateTo],
  });

  const blocks = summary?.by_block ?? [];
  const totals = summary?.totals;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Per-Block Summary</h3>
        <Button size="sm" variant="outline" onClick={refetch}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {loading && <div className="flex justify-center py-8"><LoadingSpinner /></div>}
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      {!loading && blocks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {farmId ? 'No data for selected filters.' : 'Select a farm to see block summary.'}
        </p>
      )}

      {!loading && blocks.length > 0 && (
        <>
          {/* Top-level stat cards */}
          {totals && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Total Cherry In</p>
                <p className="text-xl font-bold text-amber-700">{totals.cherry_kg_in.toFixed(1)} KG</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Total Parchment</p>
                <p className="text-xl font-bold text-green-700">{totals.total_parchment_kg.toFixed(1)} KG</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Avg Outturn</p>
                <p className="text-xl font-bold">{totals.avg_outturn_pct.toFixed(1)}%</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">DN Status</p>
                <div className="flex gap-1 mt-1">
                  <Badge variant="default" className="text-xs">{totals.dn_signed_count} signed</Badge>
                  <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">{totals.dn_unsigned_count} pending</Badge>
                </div>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Block Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Block</TableHead>
                    <TableHead>Variety</TableHead>
                    <TableHead className="text-right">Area (ha)</TableHead>
                    <TableHead className="text-right">Cherry In</TableHead>
                    <TableHead className="text-right">P1</TableHead>
                    <TableHead className="text-right">P2</TableHead>
                    <TableHead className="text-right">P3</TableHead>
                    <TableHead className="text-right">Total Parch.</TableHead>
                    <TableHead className="text-right">Outturn%</TableHead>
                    <TableHead>DN</TableHead>
                    <TableHead className="text-right">#Records</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blocks.map((b) => (
                    <TableRow key={b.block_code}>
                      <TableCell>
                        <Badge variant="outline">{b.block_code}</Badge>
                        {b.block_name && (
                          <span className="ml-1 text-xs text-muted-foreground">{b.block_name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{b.variety ?? '—'}</TableCell>
                      <TableCell className="text-right text-sm">{b.area_ha?.toFixed(2) ?? '—'}</TableCell>
                      <TableCell className="text-right text-amber-700 font-medium">{b.cherry_kg_in.toFixed(1)}</TableCell>
                      <TableCell className="text-right text-green-700">{b.p1_kg_out.toFixed(1)}</TableCell>
                      <TableCell className="text-right text-blue-700">{b.p2_kg_out.toFixed(1)}</TableCell>
                      <TableCell className="text-right text-purple-700">{b.p3_kg_out.toFixed(1)}</TableCell>
                      <TableCell className="text-right font-semibold">{b.total_parchment_kg.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={b.avg_outturn_pct >= 20 ? 'default' : 'secondary'}>
                          {b.avg_outturn_pct.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {b.dn_signed_count > 0 && (
                            <Badge variant="default" className="text-xs">{b.dn_signed_count}✓</Badge>
                          )}
                          {b.dn_unsigned_count > 0 && (
                            <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                              {b.dn_unsigned_count} pending
                            </Badge>
                          )}
                          {b.dn_signed_count === 0 && b.dn_unsigned_count === 0 && (
                            <span className="text-xs text-muted-foreground">No DN</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{b.records_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
