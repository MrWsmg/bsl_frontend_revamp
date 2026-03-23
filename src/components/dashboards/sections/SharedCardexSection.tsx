"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClipboardList, RefreshCw, AlertCircle, ChevronRight, ChevronLeft, History } from 'lucide-react';
import { toast } from 'sonner';

interface Props { userRole: string; farmId?: number; }

const MOVEMENT_COLORS: Record<string, string> = {
  in:       'bg-green-100 text-green-800 border-green-200',
  out:      'bg-red-100 text-red-800 border-red-200',
  transfer: 'bg-blue-100 text-blue-800 border-blue-200',
  adjust:   'bg-yellow-100 text-yellow-800 border-yellow-200',
};

function MovBadge({ type }: { type: string }) {
  const cls = MOVEMENT_COLORS[type?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {type?.toUpperCase()}
    </span>
  );
}

export const SharedCardexSection: React.FC<Props> = ({ userRole, farmId }) => {
  const [inputFarmId, setInputFarmId] = useState<string>(farmId ? String(farmId) : '');
  const [activeFarmId, setActiveFarmId] = useState<number | null>(farmId ?? null);
  const [selectedItem, setSelectedItem]   = useState<string | null>(null);

  /* ── CARDEX list ── */
  const fetchCardex = useCallback(() =>
    activeFarmId ? apiService.getCardex(activeFarmId) : Promise.resolve([]),
  [activeFarmId]);
  const { data: cardex, loading, error, refetch } = useApi(fetchCardex);
  const items = Array.isArray(cardex) ? cardex : [];

  /* ── Item history ── */
  const fetchHistory = useCallback(() =>
    activeFarmId && selectedItem
      ? apiService.getCardexItemHistory(activeFarmId, selectedItem)
      : Promise.resolve([]),
  [activeFarmId, selectedItem]);
  const { data: historyData, loading: historyLoading, error: historyError } = useApi(fetchHistory);
  const history = Array.isArray(historyData) ? historyData : [];

  const handleLoad = () => {
    const n = parseInt(inputFarmId, 10);
    if (!n || n <= 0) { toast.error('Enter a valid Farm ID'); return; }
    setActiveFarmId(n);
    setSelectedItem(null);
  };

  return (
    <div className="space-y-4">
      {/* Farm selector (only when no farmId prop provided) */}
      {!farmId && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-2 items-center">
              <p className="text-sm text-gray-600 whitespace-nowrap">Farm ID:</p>
              <Input
                type="number"
                value={inputFarmId}
                onChange={e => setInputFarmId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLoad()}
                placeholder="e.g. 3"
                className="w-28 h-8 text-sm"
              />
              <Button size="sm" onClick={handleLoad} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Load CARDEX
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Item history drill-down */}
      {selectedItem ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                {selectedItem} — Movement History
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setSelectedItem(null)}>
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {historyError && <Alert variant="destructive" className="mx-4 mb-3"><AlertCircle className="h-4 w-4" /><AlertDescription>{historyError}</AlertDescription></Alert>}
            {historyLoading ? (
              <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No movement history</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Reference</TableHead>
                    <TableHead className="text-xs text-right">Qty In</TableHead>
                    <TableHead className="text-xs text-right">Qty Out</TableHead>
                    <TableHead className="text-xs text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-gray-500">
                        {h.date ? new Date(h.date).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell><MovBadge type={h.movement_type} /></TableCell>
                      <TableCell className="text-xs font-mono text-gray-600">{h.reference ?? '—'}</TableCell>
                      <TableCell className="text-xs text-right text-green-700 font-medium">
                        {h.quantity_in != null ? h.quantity_in : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-right text-red-700 font-medium">
                        {h.quantity_out != null ? h.quantity_out : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold text-gray-800">
                        {h.balance ?? '—'} {h.unit ?? ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        /* CARDEX item list */
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-indigo-600" />
                CARDEX — {activeFarmId ? `Farm #${activeFarmId}` : 'Select a farm'}
              </CardTitle>
              {activeFarmId && (
                <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="w-3.5 h-3.5" /></Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!activeFarmId ? (
              <div className="text-center py-12 text-gray-400">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Enter a Farm ID above to load inventory</p>
              </div>
            ) : error ? (
              <Alert variant="destructive" className="mx-4 mb-3"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
            ) : loading ? (
              <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No inventory records found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">Item Name</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs text-right">Balance</TableHead>
                    <TableHead className="text-xs">Unit</TableHead>
                    <TableHead className="text-xs">Last Updated</TableHead>
                    <TableHead className="text-xs w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: any, i: number) => (
                    <TableRow key={i} className="hover:bg-indigo-50/40 cursor-pointer" onClick={() => setSelectedItem(item.item_name)}>
                      <TableCell className="text-sm font-medium text-gray-800">{item.item_name}</TableCell>
                      <TableCell className="text-xs text-gray-500">{item.category ?? '—'}</TableCell>
                      <TableCell className="text-sm text-right font-semibold text-gray-800">
                        <span className={item.balance <= (item.reorder_level ?? 0) ? 'text-red-600' : 'text-gray-800'}>
                          {item.balance}
                        </span>
                        {item.in_transit_balance > 0 && (
                          <div className="text-xs text-blue-600 font-normal">
                            +{item.in_transit_balance} in transit
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{item.unit ?? '—'}</TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {item.last_updated ? new Date(item.last_updated).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <History className="w-3.5 h-3.5 text-indigo-400" />
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
