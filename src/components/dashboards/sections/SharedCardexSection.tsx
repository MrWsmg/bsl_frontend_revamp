"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ClipboardList, RefreshCw, AlertCircle, ChevronRight, ChevronLeft,
  History, Search, TrendingDown, TrendingUp, Package, AlertTriangle,
  ArrowDownToLine, ArrowUpFromLine, Layers, Clock,
} from 'lucide-react';

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

function StockStatus({ balance, reorderLevel }: { balance: number; reorderLevel?: number }) {
  const level = reorderLevel ?? 0;
  if (balance <= level)       return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"><AlertTriangle className="w-3 h-3" /> Low</span>;
  if (balance <= level * 2)   return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600"><AlertTriangle className="w-3 h-3" /> Low</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> OK</span>;
}

function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${color}`}>
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium leading-none mb-1">{label}</p>
        <p className="text-xl font-bold text-gray-900 tabular-nums leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

export const SharedCardexSection: React.FC<Props> = ({ userRole, farmId: farmIdProp }) => {
  const [farms, setFarms]                   = useState<any[]>([]);
  const [loadingFarms, setLoadingFarms]     = useState(false);
  const [activeFarmId, setActiveFarmId]     = useState<number | null>(farmIdProp ?? null);
  const [activeFarmName, setActiveFarmName] = useState<string>('');
  const [selectedItem, setSelectedItem]     = useState<string | null>(null);
  const [search, setSearch]                 = useState('');

  /* ── load farms on mount ── */
  useEffect(() => {
    if (farmIdProp) return; // farm fixed by prop — no need to list
    setLoadingFarms(true);
    apiService.getFarms(userRole)
      .then(data => {
        const list = Array.isArray(data) ? data : (data as any)?.results ?? [];
        setFarms(list);
      })
      .catch(() => {})
      .finally(() => setLoadingFarms(false));
  }, [userRole, farmIdProp]);

  const handleFarmSelect = (val: string) => {
    const id = parseInt(val);
    setActiveFarmId(id);
    setSelectedItem(null);
    setSearch('');
    const farm = farms.find((f: any) => String(f.id ?? f.farm_id) === val);
    setActiveFarmName(farm?.name ?? '');
  };

  /* ── CARDEX list ── */
  const fetchCardex = useCallback(
    () => activeFarmId ? apiService.getCardex(activeFarmId) : Promise.resolve([]),
    [activeFarmId],
  );
  const { data: cardex, loading, error, refetch } = useApi(fetchCardex);
  const items = Array.isArray(cardex) ? cardex : [];

  /* ── filtered items ── */
  const filtered = useMemo(() =>
    search.trim()
      ? items.filter((it: any) => it.item_name?.toLowerCase().includes(search.toLowerCase()))
      : items,
  [items, search]);

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const lowStock    = items.filter((it: any) => it.balance != null && it.balance <= (it.reorder_level ?? 0)).length;
    const inTransit   = items.filter((it: any) => it.in_transit_balance > 0).length;
    const lastUpdated = items
      .map((it: any) => it.last_updated ? new Date(it.last_updated).getTime() : 0)
      .reduce((a, b) => Math.max(a, b), 0);
    return { total: items.length, lowStock, inTransit, lastUpdated };
  }, [items]);

  /* ── Item history (manual fetch — avoids useApi hook size constraint) ── */
  const [historyData, setHistoryData]       = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError]     = useState<string | null>(null);

  useEffect(() => {
    if (!activeFarmId || !selectedItem) { setHistoryData(null); return; }
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError(null);
    apiService.getCardexItemHistory(activeFarmId, selectedItem)
      .then(res => { if (!cancelled) setHistoryData(res); })
      .catch(err => { if (!cancelled) setHistoryError(err instanceof Error ? err.message : 'Error loading history'); })
      .finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [activeFarmId, selectedItem]);

  // API returns { summary: {...}, entries: [...] } — not a bare array
  const historySummary = (historyData as any)?.summary ?? null;
  const history: any[] = (historyData as any)?.entries ?? [];

  const farmLabel = activeFarmName || (activeFarmId ? `Farm #${activeFarmId}` : 'Select a farm');

  /* ════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4">

      {/* ── Farm selector + KPI strip ── */}
      <div className="space-y-3">
        {/* Selector row */}
        <div className="flex items-center gap-2">
          {farmIdProp ? (
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-indigo-500" />
              CARDEX — {farmLabel}
            </p>
          ) : (
            <>
              <div className="flex-1 max-w-xs">
                {loadingFarms ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 h-10">
                    <LoadingSpinner size="sm" /> Loading farms…
                  </div>
                ) : (
                  <Select value={activeFarmId ? String(activeFarmId) : ''} onValueChange={handleFarmSelect}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select farm to view CARDEX…" />
                    </SelectTrigger>
                    <SelectContent>
                      {farms.map((f: any, i: number) => (
                        <SelectItem key={f.id ?? f.farm_id ?? i} value={String(f.id ?? f.farm_id)}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {activeFarmId && (
                <Button size="sm" variant="outline" onClick={() => { refetch(); }}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* KPI cards — only when data loaded */}
        {activeFarmId && !loading && items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              icon={<Package className="w-5 h-5 text-indigo-500" />}
              label="Total Items"
              value={kpis.total}
              color="bg-indigo-50 border-indigo-100"
            />
            <KpiCard
              icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
              label="Low Stock"
              value={kpis.lowStock}
              sub={kpis.lowStock > 0 ? 'Need restocking' : 'All levels OK'}
              color={kpis.lowStock > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}
            />
            <KpiCard
              icon={<Layers className="w-5 h-5 text-blue-500" />}
              label="In Transit"
              value={kpis.inTransit}
              sub={kpis.inTransit > 0 ? 'Pending receipt' : 'None pending'}
              color="bg-blue-50 border-blue-100"
            />
            <KpiCard
              icon={<Clock className="w-5 h-5 text-gray-400" />}
              label="Last Updated"
              value={kpis.lastUpdated ? new Date(kpis.lastUpdated).toLocaleDateString() : '—'}
              color="bg-gray-50 border-gray-100"
            />
          </div>
        )}
      </div>

      {/* ── Item history drill-down ── */}
      {selectedItem ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span className="font-mono text-indigo-700">{selectedItem}</span>
                <span className="text-gray-400 font-normal text-sm">— Movement History</span>
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setSelectedItem(null)}>
                <ChevronLeft className="w-3.5 h-3.5" /> Back to CARDEX
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {historyError && (
              <Alert variant="destructive" className="mx-4 mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{historyError}</AlertDescription>
              </Alert>
            )}
            {/* Summary strip from API */}
            {historySummary && !historyLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 pb-3 pt-1">
                <KpiCard
                  icon={<Package className="w-4 h-4 text-gray-400" />}
                  label="Opening Balance"
                  value={`${historySummary.opening_balance ?? 0} ${historySummary.unit ?? ''}`}
                  color="bg-gray-50 border-gray-100"
                />
                <KpiCard
                  icon={<ArrowDownToLine className="w-4 h-4 text-green-500" />}
                  label="Total IN"
                  value={`${historySummary.total_in ?? 0} ${historySummary.unit ?? ''}`}
                  color="bg-green-50 border-green-100"
                />
                <KpiCard
                  icon={<ArrowUpFromLine className="w-4 h-4 text-red-500" />}
                  label="Total OUT"
                  value={`${historySummary.total_out ?? 0} ${historySummary.unit ?? ''}`}
                  color="bg-red-50 border-red-100"
                />
                <KpiCard
                  icon={<Layers className="w-4 h-4 text-indigo-500" />}
                  label="Closing Balance"
                  value={`${historySummary.closing_balance ?? historySummary.current_balance ?? 0} ${historySummary.unit ?? ''}`}
                  color="bg-indigo-50 border-indigo-100"
                />
              </div>
            )}
            {historyLoading ? (
              <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No movement history for this item</p>
                <p className="text-xs mt-1 text-gray-300">Entries are recorded after GRN approval or GIN issuance</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Reference</TableHead>
                    <TableHead className="text-xs text-right">
                      <span className="flex items-center justify-end gap-1 text-green-700">
                        <ArrowDownToLine className="w-3 h-3" /> IN
                      </span>
                    </TableHead>
                    <TableHead className="text-xs text-right">
                      <span className="flex items-center justify-end gap-1 text-red-700">
                        <ArrowUpFromLine className="w-3 h-3" /> OUT
                      </span>
                    </TableHead>
                    <TableHead className="text-xs text-right">Balance</TableHead>
                    <TableHead className="text-xs text-right">Unit Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h: any, i: number) => (
                    <TableRow key={i} className="hover:bg-indigo-50/30">
                      <TableCell className="text-xs text-gray-500">
                        {h.date ? new Date(h.date).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell><MovBadge type={h.movement_type} /></TableCell>
                      <TableCell className="text-xs font-mono text-gray-600">{h.reference ?? '—'}</TableCell>
                      <TableCell className="text-xs text-right font-semibold text-green-700 tabular-nums">
                        {h.quantity_in != null ? h.quantity_in : <span className="text-gray-300">—</span>}
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold text-red-600 tabular-nums">
                        {h.quantity_out != null ? h.quantity_out : <span className="text-gray-300">—</span>}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-gray-800 tabular-nums">
                        {h.balance ?? '—'} <span className="font-normal text-gray-400">{h.unit ?? ''}</span>
                      </TableCell>
                      <TableCell className="text-xs text-right text-gray-500 tabular-nums">
                        {h.unit_cost != null ? Number(h.unit_cost).toLocaleString() : <span className="text-gray-300">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        /* ── Main CARDEX table ── */
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-indigo-600" />
                {activeFarmId ? (
                  <>
                    CARDEX —{' '}
                    <span className="text-indigo-700">{activeFarmName || `Farm #${activeFarmId}`}</span>
                  </>
                ) : 'CARDEX'}
              </CardTitle>
              {activeFarmId && items.length > 0 && (
                <div className="relative w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search items…"
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!activeFarmId ? (
              <div className="text-center py-14 text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Select a farm above to load its CARDEX</p>
              </div>
            ) : error ? (
              <Alert variant="destructive" className="mx-4 mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : loading ? (
              <div className="flex justify-center py-14"><LoadingSpinner size="lg" /></div>
            ) : items.length === 0 ? (
              <div className="text-center py-14 text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No inventory records for this farm</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No items match &ldquo;{search}&rdquo;</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-100">
                    <TableHead className="text-xs font-semibold">Item Name</TableHead>
                    <TableHead className="text-xs font-semibold">Category</TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      <span className="flex items-center justify-end gap-1 text-green-700">
                        <ArrowDownToLine className="w-3 h-3" /> Total IN
                      </span>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      <span className="flex items-center justify-end gap-1 text-red-600">
                        <ArrowUpFromLine className="w-3 h-3" /> Total OUT
                      </span>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">Current Stock</TableHead>
                    <TableHead className="text-xs font-semibold">Unit</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Reorder Level</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Last Updated</TableHead>
                    <TableHead className="text-xs w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item: any, i: number) => {
                    const isLow = item.balance != null && item.balance <= (item.reorder_level ?? 0);
                    return (
                      <TableRow
                        key={i}
                        className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${isLow ? 'bg-red-50/30' : ''}`}
                        onClick={() => setSelectedItem(item.item_name)}
                      >
                        {/* Item name */}
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-gray-900">{item.item_name}</span>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          {item.category ? (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {item.category}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </TableCell>

                        {/* Total IN */}
                        <TableCell className="text-right">
                          {item.total_in != null ? (
                            <span className="text-sm font-semibold text-green-700 tabular-nums flex items-center justify-end gap-1">
                              <TrendingDown className="w-3 h-3" />
                              {item.total_in}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </TableCell>

                        {/* Total OUT */}
                        <TableCell className="text-right">
                          {item.total_out != null ? (
                            <span className="text-sm font-semibold text-red-600 tabular-nums flex items-center justify-end gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {item.total_out}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </TableCell>

                        {/* Current stock / balance */}
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className={`text-sm font-bold tabular-nums ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                              {item.balance ?? '—'}
                            </span>
                            {item.in_transit_balance > 0 && (
                              <span className="text-xs text-blue-600 font-medium tabular-nums">
                                +{item.in_transit_balance} in transit
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Unit */}
                        <TableCell>
                          <span className="text-xs font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                            {item.unit ?? '—'}
                          </span>
                        </TableCell>

                        {/* Reorder level */}
                        <TableCell className="text-right">
                          <span className="text-xs text-gray-400 tabular-nums">
                            {item.reorder_level ?? '—'}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StockStatus balance={item.balance ?? 0} reorderLevel={item.reorder_level} />
                        </TableCell>

                        {/* Last updated */}
                        <TableCell>
                          <span className="text-xs text-gray-400">
                            {item.last_updated ? new Date(item.last_updated).toLocaleDateString() : '—'}
                          </span>
                        </TableCell>

                        {/* History caret */}
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            <History className="w-3.5 h-3.5 text-indigo-300" />
                            <ChevronRight className="w-3.5 h-3.5 text-gray-200" />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
