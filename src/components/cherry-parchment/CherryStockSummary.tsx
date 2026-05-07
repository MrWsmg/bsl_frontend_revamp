"use client";

import React, { useCallback, useState } from 'react';
import { RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { useApi } from '@/hooks';
import apiService from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { CherryStockSummary as CherryStockSummaryType } from '@/types/cherry-parchment';

interface Props {
  farmId: number | null;
  dateFrom: string;
  dateTo: string;
}

function fmtCurrency(n: number) {
  return n.toLocaleString('en-TZ', { maximumFractionDigits: 0 });
}

export const CherryStockSummary: React.FC<Props> = ({ farmId, dateFrom, dateTo }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchSummary = useCallback(() => {
    if (!farmId) return Promise.resolve(null);
    return apiService.cherryParchment.getCherryStockSummary({
      farm_id: farmId,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  }, [farmId, dateFrom, dateTo]);

  const { data: summary, loading, error, refetch } = useApi<CherryStockSummaryType | null>(fetchSummary, {
    dependencies: [farmId, dateFrom, dateTo],
  });

  const toggleBlock = (code: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const blocks = summary?.by_block ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Cherry Stock — Daily Picking
        </h3>
        <Button size="sm" variant="outline" onClick={refetch}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {!farmId && (
        <p className="text-sm text-muted-foreground text-center py-8">Select a farm to view cherry stock.</p>
      )}

      {farmId && loading && <div className="flex justify-center py-8"><LoadingSpinner /></div>}
      {farmId && error && <p className="text-sm text-red-600 text-center">{error}</p>}

      {farmId && !loading && summary && (
        <>
          {/* Grand totals */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Total Cherry</p>
              <p className="text-2xl font-bold text-amber-700">{summary.grand_total_cherry_kg.toFixed(1)} KG</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Blocks Active</p>
              <p className="text-2xl font-bold">{summary.blocks_count}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Picking Sessions</p>
              <p className="text-2xl font-bold">{summary.sessions_count}</p>
            </Card>
          </div>

          {blocks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No picking records found for selected period.</p>
          )}

          {blocks.map((block) => {
            const isOpen = expanded.has(block.block_code);
            return (
              <Card key={block.block_code}>
                <CardHeader
                  className="pb-2 pt-3 px-4 cursor-pointer select-none"
                  onClick={() => toggleBlock(block.block_code)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isOpen
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      }
                      <Badge variant="outline" className="font-mono">{block.block_code}</Badge>
                      {block.block_name && (
                        <span className="text-sm font-medium">{block.block_name}</span>
                      )}
                      {block.variety && (
                        <span className="text-xs text-muted-foreground">({block.variety})</span>
                      )}
                      {block.area_ha && (
                        <span className="text-xs text-muted-foreground">{block.area_ha.toFixed(2)} ha</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Total: <strong className="text-amber-700">{block.total_cherry_kg.toFixed(1)} KG</strong>
                      </span>
                      <span className="text-muted-foreground">
                        Running: <strong>{block.running_total_kg.toFixed(1)} KG</strong>
                      </span>
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="p-0 border-t">
                    {block.daily_records.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No daily records.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Pickers</TableHead>
                            <TableHead className="text-right">Cherry KG</TableHead>
                            <TableHead className="text-right">KG/Picker</TableHead>
                            <TableHead className="text-right">Price/KG</TableHead>
                            <TableHead className="text-right">Payment (TZS)</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {block.daily_records.map((r) => (
                            <TableRow key={r.session_id}>
                              <TableCell className="whitespace-nowrap">
                                {new Date(r.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">{r.pickers}</TableCell>
                              <TableCell className="text-right font-medium text-amber-700">
                                {r.cherry_kg.toFixed(1)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {r.ratio_kg_per_picker.toFixed(1)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {fmtCurrency(r.price_per_kg)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {fmtCurrency(r.total_payment)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={r.status === 'approved' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {r.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell>Block Total</TableCell>
                            <TableCell className="text-right">{block.total_pickers}</TableCell>
                            <TableCell className="text-right text-amber-700">{block.total_cherry_kg.toFixed(1)}</TableCell>
                            <TableCell colSpan={4} />
                          </TableRow>
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
};
