"use client";

import React, { useCallback } from 'react';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { useApi } from '@/hooks';
import apiService from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { MillingComparison } from '@/types/cherry-parchment';

interface Props {
  farmId: number | null;
  dateFrom: string;
  dateTo: string;
}

const GRADES: Array<{ key: 'p1_comparative' | 'p2_comparative' | 'p3_comparative'; label: string }> = [
  { key: 'p1_comparative', label: 'P1' },
  { key: 'p2_comparative', label: 'P2' },
  { key: 'p3_comparative', label: 'P3' },
];

export const MillingComparisonReport: React.FC<Props> = ({ farmId, dateFrom, dateTo }) => {
  const fetchComparison = useCallback(() => {
    if (!farmId) return Promise.resolve(null);
    return apiService.cherryParchment.getMillingComparison({
      farm_id: farmId,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  }, [farmId, dateFrom, dateTo]);

  const { data: cmp, loading, error, refetch } = useApi<MillingComparison | null>(fetchComparison, {
    dependencies: [farmId, dateFrom, dateTo],
  });

  // Indicative end-to-end recovery: cherry → parchment → green
  const netCherryToGreenPct = cmp
    ? Math.round(((cmp.parchment_produced.avg_outturn_pct / 100) * (cmp.parchment_milled.milling_outturn_pct / 100)) * 100 * 100) / 100
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Cherry → Parchment → Green Comparison
        </h3>
        <Button size="sm" variant="outline" onClick={refetch}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {!farmId && (
        <p className="text-sm text-muted-foreground text-center py-8">Select a farm to view the cherry-to-green comparison.</p>
      )}

      {farmId && loading && <div className="flex justify-center py-8"><LoadingSpinner /></div>}
      {farmId && error && <p className="text-sm text-red-600 text-center">{error}</p>}

      {farmId && !loading && cmp && (
        <>
          {/* ── Conversion chain summary ── */}
          <div className="rounded-md border bg-muted/30 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-amber-700">{cmp.parchment_produced.cherry_kg_in.toFixed(1)} kg cherry</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-orange-700">{cmp.parchment_produced.total_kg.toFixed(1)} kg parchment</span>
              <Badge variant="outline" className="text-amber-700">{cmp.parchment_produced.avg_outturn_pct.toFixed(1)}% outturn</Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-green-700">{cmp.parchment_milled.green_bean_out_kg.toFixed(1)} kg green</span>
              <Badge variant="outline" className="text-green-700">{cmp.parchment_milled.milling_outturn_pct.toFixed(1)}% outturn</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Indicative end-to-end recovery (cherry → green): <strong>{netCherryToGreenPct.toFixed(2)}%</strong>
              {' · '}{cmp.batches_count} milling batch{cmp.batches_count === 1 ? '' : 'es'} in range
            </p>
          </div>

          {/* ── Stage metric cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Cherry In</p>
              <p className="text-2xl font-bold text-amber-700">{cmp.parchment_produced.cherry_kg_in.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">KG fresh cherry</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Parchment Produced</p>
              <p className="text-2xl font-bold text-orange-700">{cmp.parchment_produced.total_kg.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">KG — {cmp.parchment_produced.avg_outturn_pct.toFixed(1)}% outturn</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Parchment Milled</p>
              <p className="text-2xl font-bold text-blue-700">{cmp.parchment_milled.parchment_in_kg.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">KG into mill</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Green Bean Out</p>
              <p className="text-2xl font-bold text-green-700">{cmp.parchment_milled.green_bean_out_kg.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">KG green coffee</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Milling Outturn</p>
              <p className="text-2xl font-bold text-green-700">{cmp.parchment_milled.milling_outturn_pct.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">green ÷ parchment</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Parchment Not Yet Milled</p>
              <p className={`text-2xl font-bold ${cmp.total_parchment_difference_kg > 0.5 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                {cmp.total_parchment_difference_kg >= 0 ? '+' : ''}{cmp.total_parchment_difference_kg.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">KG produced − milled</p>
            </Card>
          </div>

          {/* ── Per-grade reconciliation: produced vs milled ── */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Per-Grade Reconciliation (Produced vs Milled)</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Parchment Produced (KG)</TableHead>
                    <TableHead className="text-right">Milled (KG)</TableHead>
                    <TableHead className="text-right">Difference (KG)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {GRADES.map(({ key, label }) => {
                    const row = cmp[key];
                    return (
                      <TableRow key={key}>
                        <TableCell><Badge variant="outline">{label}</Badge></TableCell>
                        <TableCell className="text-right font-medium text-orange-700">{row.produced_kg.toFixed(1)}</TableCell>
                        <TableCell className="text-right font-medium text-blue-700">{row.milled_kg.toFixed(1)}</TableCell>
                        <TableCell className={`text-right font-medium ${Math.abs(row.difference_kg) > 0.5 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                          {row.difference_kg >= 0 ? '+' : ''}{row.difference_kg.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right text-orange-700">{cmp.parchment_produced.total_kg.toFixed(1)}</TableCell>
                    <TableCell className="text-right text-blue-700">{cmp.parchment_milled.parchment_in_kg.toFixed(1)}</TableCell>
                    <TableCell className="text-right">
                      {cmp.total_parchment_difference_kg >= 0 ? '+' : ''}{cmp.total_parchment_difference_kg.toFixed(1)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* ── Green bean by grade ── */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Green Bean Output by Grade</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Green Bean (KG)</TableHead>
                    <TableHead className="text-right">% of Total Green</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {([
                    ['P1', cmp.parchment_milled.p1_green_kg],
                    ['P2', cmp.parchment_milled.p2_green_kg],
                    ['P3', cmp.parchment_milled.p3_green_kg],
                  ] as Array<[string, number]>).map(([label, kg]) => (
                    <TableRow key={label}>
                      <TableCell><Badge variant="outline">{label}</Badge></TableCell>
                      <TableCell className="text-right font-medium text-green-700">{kg.toFixed(1)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {cmp.parchment_milled.green_bean_out_kg > 0
                          ? ((kg / cmp.parchment_milled.green_bean_out_kg) * 100).toFixed(1)
                          : '0.0'}%
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right text-green-700">{cmp.parchment_milled.green_bean_out_kg.toFixed(1)}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
