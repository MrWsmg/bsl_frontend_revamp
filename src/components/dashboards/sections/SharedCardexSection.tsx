"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Pagination, usePagination } from '../../common/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ClipboardList, RefreshCw, AlertCircle, ChevronRight, ChevronLeft,
  History, Search, TrendingDown, TrendingUp, Package, AlertTriangle,
  ArrowDownToLine, ArrowUpFromLine, Settings2,
} from 'lucide-react';
import { toast } from '../../ui/sonner';
import { StoreSummaryItem, StoreHistoryEntry, StoreReportCard } from '../../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

interface Props { userRole: string; farmId?: number; }

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all',           label: 'All' },
  { id: 'procurement',   label: 'Procurement' },
  { id: 'fertilizer',    label: 'Fertilizer' },
  { id: 'fuel_chemical', label: 'Fuel & Chemicals' },
  { id: 'irrigation',    label: 'Irrigation' },
  { id: 'other_crops',   label: 'Other Crops' },
  { id: 'mbuni',         label: 'Mbuni' },
];

const CATEGORY_LABELS: Record<string, string> = {
  procurement:   'Procurement',
  fertilizer:    'Fertilizer',
  fuel_chemical: 'Fuel & Chemicals',
  irrigation:    'Irrigation',
  other_crops:   'Other Crops',
  mbuni:         'Mbuni',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    green:   'bg-green-100 text-green-700 border-green-200',
    amber:   'bg-amber-100 text-amber-700 border-amber-200',
    red:     'bg-red-100 text-red-700 border-red-200',
    unknown: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  const dot: Record<string, string> = {
    green: '🟢', amber: '🟡', red: '🔴', unknown: '⚪',
  };
  const cls = map[status] ?? map.unknown;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {dot[status] ?? '⚪'} {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
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

// ─── Main component ───────────────────────────────────────────────────────────

export const SharedCardexSection: React.FC<Props> = ({ userRole, farmId: farmIdProp }) => {
  const [farms, setFarms]                   = useState<any[]>([]);
  const [loadingFarms, setLoadingFarms]     = useState(false);
  const [activeFarmId, setActiveFarmId]     = useState<number | null>(farmIdProp ?? null);
  const [activeFarmName, setActiveFarmName] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch]                 = useState('');

  // Bin-card drill-down
  const [selectedItem, setSelectedItem] = useState<{ name: string; category: string } | null>(null);

  // Reorder levels modal
  const [reorderItem, setReorderItem]   = useState<StoreSummaryItem | null>(null);
  const [reorderForm, setReorderForm]   = useState({ reorder_level: '', min_level: '', max_level: '' });
  const [savingLevels, setSavingLevels] = useState(false);

  /* ── Load farms ── */
  useEffect(() => {
    if (farmIdProp) return;
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
    setActiveCategory('all');
    const farm = farms.find((f: any) => String(f.id ?? f.farm_id) === val);
    setActiveFarmName(farm?.name ?? '');
  };

  /* ── All items — single call feeds everything ── */
  const fetchAll = useCallback(
    () => activeFarmId ? apiService.storeCardex.getStoreAll(activeFarmId) : Promise.resolve([]),
    [activeFarmId],
  );
  const { data: allRaw, loading, error, refetch } = useApi(fetchAll);
  const allItems: StoreSummaryItem[] = Array.isArray(allRaw) ? allRaw : [];

  /* ── Report cards ── */
  const fetchReport = useCallback(
    () => activeFarmId ? apiService.storeCardex.getStoreReport(activeFarmId) : Promise.resolve([]),
    [activeFarmId],
  );
  const { data: reportRaw } = useApi(fetchReport);
  const reportCards: StoreReportCard[] = Array.isArray(reportRaw) ? reportRaw : [];

  /* ── KPI totals ── */
  const kpis = useMemo(() => ({
    total:    allItems.length,
    lowStock: allItems.filter(i => i.stock_status === 'amber' || i.stock_status === 'red').length,
    critical: allItems.filter(i => i.stock_status === 'red').length,
  }), [allItems]);

  /* ── Client-side filtering ── */
  const filtered = useMemo(() => {
    let items = activeCategory === 'all' ? allItems : allItems.filter(i => i.store_category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i => i.item_name.toLowerCase().includes(q));
    }
    return items;
  }, [allItems, activeCategory, search]);

  /* ── Pagination over the filtered CARDEX rows ── */
  const {
    paginatedItems: pagedItems,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    totalPages, totalItems,
  } = usePagination<StoreSummaryItem>(filtered, 25);

  /* ── Bin-card history ── */
  const [historyData, setHistoryData]       = useState<StoreHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError]     = useState<string | null>(null);

  useEffect(() => {
    if (!activeFarmId || !selectedItem) { setHistoryData([]); return; }
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError(null);
    apiService.storeCardex.getStoreHistory(activeFarmId, selectedItem.name, selectedItem.category)
      .then(res => {
        if (cancelled) return;
        const entries = Array.isArray(res) ? res : (res as any)?.entries ?? [];
        setHistoryData(entries);
      })
      .catch(err => { if (!cancelled) setHistoryError(err instanceof Error ? err.message : 'Error loading history'); })
      .finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [activeFarmId, selectedItem]);

  /* ── Reorder levels ── */
  const openReorderModal = (item: StoreSummaryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setReorderItem(item);
    setReorderForm({
      reorder_level: item.reorder_level != null ? String(item.reorder_level) : '',
      min_level:     item.min_level != null     ? String(item.min_level)     : '',
      max_level:     item.max_level != null     ? String(item.max_level)     : '',
    });
  };

  const saveReorderLevels = async () => {
    if (!activeFarmId || !reorderItem) return;
    setSavingLevels(true);
    try {
      await apiService.storeCardex.setReorderLevels(
        activeFarmId,
        reorderItem.store_category,
        reorderItem.item_name,
        {
          reorder_level: reorderForm.reorder_level !== '' ? Number(reorderForm.reorder_level) : undefined,
          min_level:     reorderForm.min_level     !== '' ? Number(reorderForm.min_level)     : undefined,
          max_level:     reorderForm.max_level     !== '' ? Number(reorderForm.max_level)     : undefined,
        },
      );
      toast.success('Stock levels updated');
      setReorderItem(null);
      refetch();
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save levels');
    } finally {
      setSavingLevels(false);
    }
  };

  const farmLabel = activeFarmName || (activeFarmId ? `Farm #${activeFarmId}` : 'Select a farm');
  const selectedItemData = selectedItem
    ? allItems.find(i => i.item_name === selectedItem.name && i.store_category === selectedItem.category) ?? null
    : null;

  /* ════════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4">

      {/* ── Farm selector ── */}
      <div className="flex items-center gap-2">
        {farmIdProp ? (
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-indigo-500" />
            Farm CARDEX — {farmLabel}
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
                    <SelectValue placeholder="Select farm to view Farm CARDEX…" />
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
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            )}
          </>
        )}
      </div>

      {/* ── Per-store summary cards (from report endpoint) ── */}
      {activeFarmId && !loading && reportCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {reportCards.map(card => (
            <div
              key={card.store_category}
              className={`rounded-xl border p-3 cursor-pointer transition-all hover:ring-2 hover:ring-indigo-300
                ${activeCategory === card.store_category
                  ? 'ring-2 ring-indigo-400 bg-indigo-50'
                  : 'bg-white hover:bg-gray-50'
                }`}
              onClick={() => setActiveCategory(
                activeCategory === card.store_category ? 'all' : card.store_category,
              )}
            >
              <p className="text-xs font-semibold text-gray-500 mb-1 truncate">
                {CATEGORY_LABELS[card.store_category] ?? card.store_category}
              </p>
              <p className="text-lg font-bold text-gray-900">
                {card.item_count} <span className="text-xs font-normal text-gray-400">items</span>
              </p>
              {(card.critical_stock_count ?? 0) > 0 ? (
                <p className="text-xs text-red-600 font-medium mt-1">🔴 {card.critical_stock_count} critical</p>
              ) : (card.low_stock_count ?? 0) > 0 ? (
                <p className="text-xs text-amber-600 font-medium mt-1">🟡 {card.low_stock_count} low</p>
              ) : (
                <p className="text-xs text-green-600 font-medium mt-1">🟢 all OK</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── KPI strip ── */}
      {activeFarmId && !loading && allItems.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <KpiCard
            icon={<Package className="w-5 h-5 text-indigo-500" />}
            label="Total Items Tracked"
            value={kpis.total}
            color="bg-indigo-50 border-indigo-100"
          />
          <KpiCard
            icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
            label="Low Stock"
            value={kpis.lowStock}
            sub={kpis.lowStock > 0 ? 'Need attention' : 'All levels OK'}
            color={kpis.lowStock > 0 ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}
          />
          <KpiCard
            icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
            label="Critical"
            value={kpis.critical}
            sub={kpis.critical > 0 ? 'Below minimum' : 'None critical'}
            color={kpis.critical > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}
          />
        </div>
      )}

      {/* ── Bin-card drill-down ── */}
      {selectedItem ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  <span className="font-mono text-indigo-700">{selectedItem.name}</span>
                  <span className="text-gray-400 font-normal text-sm">
                    — {CATEGORY_LABELS[selectedItem.category] ?? selectedItem.category}
                  </span>
                </CardTitle>
                {selectedItemData && (
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                    <span>
                      Balance:{' '}
                      <strong className="text-gray-900">
                        {selectedItemData.current_balance} {selectedItemData.unit}
                      </strong>
                    </span>
                    <span>Status: <StatusBadge status={selectedItemData.stock_status} /></span>
                    {selectedItemData.last_receipt_date && (
                      <span>Last Receipt: {new Date(selectedItemData.last_receipt_date).toLocaleDateString()}</span>
                    )}
                    {selectedItemData.last_issue_date && (
                      <span>Last Issue: {new Date(selectedItemData.last_issue_date).toLocaleDateString()}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedItemData && selectedItemData.store_category !== 'procurement' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={e => openReorderModal(selectedItemData, e)}
                  >
                    <Settings2 className="w-3.5 h-3.5" /> Set Levels
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setSelectedItem(null)}>
                  <ChevronLeft className="w-3.5 h-3.5" /> Back to CARDEX
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {historyError && (
              <Alert variant="destructive" className="mx-4 mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{historyError}</AlertDescription>
              </Alert>
            )}
            {historyLoading ? (
              <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
            ) : historyData.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No transaction history for this item</p>
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
                    <TableHead className="text-xs">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.map((h, i) => (
                    <TableRow key={i} className="hover:bg-indigo-50/30">
                      <TableCell className="text-xs text-gray-500">
                        {h.transaction_date ? new Date(h.transaction_date).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">
                          {h.transaction_type ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-gray-600">{h.reference ?? '—'}</TableCell>
                      <TableCell className="text-xs text-right font-semibold text-green-700 tabular-nums">
                        {h.quantity_in != null ? h.quantity_in : <span className="text-gray-300">—</span>}
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold text-red-600 tabular-nums">
                        {h.quantity_out != null ? h.quantity_out : <span className="text-gray-300">—</span>}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-gray-800 tabular-nums">
                        {h.running_balance ?? '—'}{' '}
                        <span className="font-normal text-gray-400">{h.unit ?? ''}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{h.notes ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        /* ── Main unified CARDEX table ── */
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-indigo-600" />
                {activeFarmId ? (
                  <>Farm CARDEX — <span className="text-indigo-700">{activeFarmName || `Farm #${activeFarmId}`}</span></>
                ) : (
                  'Farm CARDEX'
                )}
              </CardTitle>
              {activeFarmId && (
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

            {/* Category tabs */}
            {activeFarmId && allItems.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {CATEGORIES.map(cat => {
                  const count = cat.id === 'all'
                    ? allItems.length
                    : allItems.filter(i => i.store_category === cat.id).length;
                  if (cat.id !== 'all' && count === 0) return null;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                        ${activeCategory === cat.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                        }`}
                    >
                      {cat.label}
                      {cat.id !== 'all' && (
                        <span className="ml-1 opacity-70">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {!activeFarmId ? (
              <div className="text-center py-14 text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Select a farm above to load its Farm CARDEX</p>
              </div>
            ) : error ? (
              <Alert variant="destructive" className="mx-4 mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : loading ? (
              <div className="flex justify-center py-14"><LoadingSpinner size="lg" /></div>
            ) : allItems.length === 0 ? (
              <div className="text-center py-14 text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No inventory records for this farm</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No items match your filter</p>
              </div>
            ) : (
              <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-100">
                    <TableHead className="text-xs font-semibold">Item Name</TableHead>
                    <TableHead className="text-xs font-semibold">Store</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Balance</TableHead>
                    <TableHead className="text-xs font-semibold">Unit</TableHead>
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
                    <TableHead className="text-xs font-semibold">Last Receipt</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedItems.map((item, i) => (
                    <TableRow
                      key={i}
                      className={`hover:bg-indigo-50/40 cursor-pointer transition-colors
                        ${item.stock_status === 'red'   ? 'bg-red-50/30'   : ''}
                        ${item.stock_status === 'amber' ? 'bg-amber-50/20' : ''}`}
                      onClick={() => setSelectedItem({ name: item.item_name, category: item.store_category })}
                    >
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">{item.item_name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {CATEGORY_LABELS[item.store_category] ?? item.store_category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-bold tabular-nums ${item.stock_status === 'red' ? 'text-red-600' : 'text-gray-900'}`}>
                          {item.current_balance ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                          {item.unit ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold text-green-700 tabular-nums flex items-center justify-end gap-1">
                          <TrendingDown className="w-3 h-3" />{item.total_in ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold text-red-600 tabular-nums flex items-center justify-end gap-1">
                          <TrendingUp className="w-3 h-3" />{item.total_out ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-400">
                          {item.last_receipt_date ? new Date(item.last_receipt_date).toLocaleDateString() : '—'}
                        </span>
                      </TableCell>
                      <TableCell><StatusBadge status={item.stock_status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <History className="w-3.5 h-3.5 text-indigo-300" />
                          <ChevronRight className="w-3.5 h-3.5 text-gray-200" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalItems > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Reorder Levels Modal ── */}
      <Dialog open={reorderItem !== null} onOpenChange={open => { if (!open) setReorderItem(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Stock Levels — {reorderItem?.item_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Reorder Level</Label>
              <Input
                type="number"
                value={reorderForm.reorder_level}
                onChange={e => setReorderForm(p => ({ ...p, reorder_level: e.target.value }))}
                placeholder="e.g. 50"
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">Triggers 🟡 amber when balance falls to this level</p>
            </div>
            <div>
              <Label>Minimum Level</Label>
              <Input
                type="number"
                value={reorderForm.min_level}
                onChange={e => setReorderForm(p => ({ ...p, min_level: e.target.value }))}
                placeholder="e.g. 20"
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">Triggers 🔴 red when balance falls below this</p>
            </div>
            <div>
              <Label>Maximum Level</Label>
              <Input
                type="number"
                value={reorderForm.max_level}
                onChange={e => setReorderForm(p => ({ ...p, max_level: e.target.value }))}
                placeholder="e.g. 200"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReorderItem(null)}>Cancel</Button>
            <Button onClick={saveReorderLevels} disabled={savingLevels}>
              {savingLevels ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
