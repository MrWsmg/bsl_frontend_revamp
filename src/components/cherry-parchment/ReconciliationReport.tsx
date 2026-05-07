"use client";

import React, { useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useApi } from '@/hooks';
import apiService from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { ReconciliationResult } from '@/types/cherry-parchment';

interface Props {
  farmId: number | null;
  dateFrom: string;
  dateTo: string;
}

export const ReconciliationReport: React.FC<Props> = ({ farmId, dateFrom, dateTo }) => {
  const fetchRecon = useCallback(() => {
    if (!farmId) return Promise.resolve(null);
    return apiService.cherryParchment.getReconciliation({
      farm_id: farmId,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  }, [farmId, dateFrom, dateTo]);

  const { data: recon, loading, error, refetch } = useApi<ReconciliationResult | null>(fetchRecon, {
    dependencies: [farmId, dateFrom, dateTo],
  });

  const diffOk = recon ? Math.abs(recon.difference_pct) <= 2 : true;
  const diffIcon = recon
    ? recon.difference_kg > 0.5
      ? <TrendingUp className="h-4 w-4 text-green-600" />
      : recon.difference_kg < -0.5
        ? <TrendingDown className="h-4 w-4 text-red-500" />
        : <Minus className="h-4 w-4 text-muted-foreground" />
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Farm vs Hopper Reconciliation
        </h3>
        <Button size="sm" variant="outline" onClick={refetch}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {!farmId && (
        <p className="text-sm text-muted-foreground text-center py-8">Select a farm to run reconciliation.</p>
      )}

      {farmId && loading && <div className="flex justify-center py-8"><LoadingSpinner /></div>}
      {farmId && error && <p className="text-sm text-red-600 text-center">{error}</p>}

      {farmId && !loading && recon && (
        <>
          {/* Status banner */}
          <div className={`rounded-md px-4 py-3 flex items-center gap-3 ${diffOk ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {diffIcon}
            <div>
              <p className={`font-semibold ${diffOk ? 'text-green-800' : 'text-red-800'}`}>
                {diffOk ? 'Reconciliation within tolerance (±2%)' : 'Variance exceeds 2% threshold'}
              </p>
              <p className="text-sm text-muted-foreground">
                Difference: {recon.difference_kg >= 0 ? '+' : ''}{recon.difference_kg.toFixed(2)} KG
                ({recon.difference_pct >= 0 ? '+' : ''}{recon.difference_pct.toFixed(2)}%)
              </p>
            </div>
          </div>

          {/* Main comparison */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Farm Cherry Picked</p>
              <p className="text-2xl font-bold text-amber-700">{recon.farm_cherry_kg.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">KG — {recon.picking_sessions_count} sessions</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Hopper Total Received</p>
              <p className="text-2xl font-bold text-blue-700">{recon.hopper_received_kg.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">KG — {recon.hopper_entries_count} entries</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Hopper Current Balance</p>
              <p className="text-2xl font-bold text-green-700">{recon.hopper_current_balance_kg.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">KG remaining</p>
            </Card>
          </div>

          {/* Per-block cherry breakdown */}
          {Object.keys(recon.per_block_cherry_kg).length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">Cherry by Block (Picking Records)</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Block</TableHead>
                      <TableHead className="text-right">Cherry KG</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(recon.per_block_cherry_kg)
                      .sort(([, a], [, b]) => b - a)
                      .map(([block, kg]) => (
                        <TableRow key={block}>
                          <TableCell>
                            <Badge variant="outline">{block}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-amber-700">{kg.toFixed(1)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {recon.farm_cherry_kg > 0 ? ((kg / recon.farm_cherry_kg) * 100).toFixed(1) : '0.0'}%
                          </TableCell>
                        </TableRow>
                      ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right text-amber-700">{recon.farm_cherry_kg.toFixed(1)}</TableCell>
                      <TableCell className="text-right">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
