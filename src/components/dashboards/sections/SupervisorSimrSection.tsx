"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useApi } from '../../../hooks';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/api';
import { getApiError } from '../../../utils';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Boxes, RefreshCw, Plus, AlertCircle, CheckCircle2, XCircle,
  ChevronRight, Package, FileText, Truck, Clock, ArrowRightLeft, Trash2, PackageCheck,
} from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────
//  Status config
// ─────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  draft:                 { label: 'Draft',               cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  pending_fm_approval:   { label: 'Pending Approval',    cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  approved:              { label: 'Approved',            cls: 'bg-green-100 text-green-800 border-green-200' },
  ready_for_issue:       { label: 'Ready for Issue',     cls: 'bg-teal-100 text-teal-800 border-teal-200' },
  partial_stock:         { label: 'Partial Stock',       cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  pending_smr:           { label: 'Pending SMR',         cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  gin_prepared:          { label: 'GIN Prepared',        cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  collected:             { label: 'Collected',           cls: 'bg-purple-100 text-purple-700 border-purple-200' },
  completed:             { label: 'Completed',           cls: 'bg-green-100 text-green-800 border-green-200' },
  rejected:              { label: 'Rejected',            cls: 'bg-red-100 text-red-800 border-red-200' },
  pending_inter_farm:    { label: 'Inter-Farm Pending',  cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  inter_farm_approved:   { label: 'Inter-Farm Approved', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  inter_farm_in_transit: { label: 'In Transit',          cls: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] ?? {
    label: status?.replace(/_/g, ' '),
    cls: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

const PRIORITY_COLORS: Record<string, string> = {
  low:      'bg-gray-100 text-gray-600 border-gray-200',
  normal:   'bg-gray-100 text-gray-600 border-gray-200',
  medium:   'bg-blue-100 text-blue-700 border-blue-200',
  urgent:   'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

function PriorityBadge({ priority }: { priority: string }) {
  const cls = PRIORITY_COLORS[priority?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {priority}
    </span>
  );
}

// ─────────────────────────────────────────────
//  Status context banner for supervisor
// ─────────────────────────────────────────────
function StatusMessage({ simr }: { simr: any }) {
  const status = simr.status?.toLowerCase();

  if (status === 'pending_fm_approval') return (
    <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
      <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
      <span className="text-yellow-800">Waiting for Farm Manager approval.</span>
    </div>
  );

  if (status === 'rejected') return (
    <div className="bg-red-50 border border-red-200 rounded p-3 text-sm space-y-1">
      <p className="flex items-center gap-1.5 text-red-700 font-medium">
        <XCircle className="w-4 h-4" /> Rejected by Farm Manager
      </p>
      {simr.fm_rejected_reason && <p className="text-red-600 text-xs">{simr.fm_rejected_reason}</p>}
    </div>
  );

  if (status === 'approved') return (
    <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded p-3 text-sm">
      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-green-800 font-medium">Approved — stock check in progress</p>
        {simr.fm_approval_notes && <p className="text-green-700 text-xs mt-0.5">{simr.fm_approval_notes}</p>}
      </div>
    </div>
  );

  if (status === 'ready_for_issue') return (
    <div className="flex items-start gap-2 bg-teal-50 border border-teal-200 rounded p-3 text-sm">
      <Package className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-teal-800 font-medium">All items in stock — GIN created</p>
        {simr.gin_id && (
          <p className="text-teal-700 text-xs mt-0.5">
            GIN reference: <span className="font-mono font-semibold">GIN #{simr.gin_id}</span>
          </p>
        )}
      </div>
    </div>
  );

  if (status === 'partial_stock') return (
    <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded p-3 text-sm">
      <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
      <p className="text-orange-800">Some items are in stock. Remaining items escalated for external procurement (SMR).</p>
    </div>
  );

  if (status === 'pending_smr') return (
    <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded p-3 text-sm">
      <FileText className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
      <p className="text-orange-800">Items not in stock — an SMR has been automatically raised for external purchase.</p>
    </div>
  );

  if (status === 'pending_inter_farm') return (
    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded p-3 text-sm">
      <ArrowRightLeft className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
      <p className="text-blue-800">Items sourced from another farm — waiting for source farm manager to approve the transfer.</p>
    </div>
  );

  if (status === 'inter_farm_approved') return (
    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded p-3 text-sm">
      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
      <p className="text-blue-800">Inter-farm transfer approved. Awaiting dispatch from source farm.</p>
    </div>
  );

  if (status === 'inter_farm_in_transit') return (
    <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 rounded p-3 text-sm">
      <Truck className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
      <p className="text-indigo-800">Items are in transit from the source farm.</p>
    </div>
  );

  if (status === 'gin_prepared') return (
    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded p-3 text-sm">
      <Package className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
      <p className="text-blue-800">GIN prepared by Farm Clerk — items are ready for collection.</p>
    </div>
  );

  if (status === 'collected') return (
    <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded p-3 text-sm">
      <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
      <p className="text-purple-800">Items collected. Awaiting final confirmation.</p>
    </div>
  );

  if (status === 'completed') return (
    <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded p-3 text-sm">
      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
      <p className="text-green-800 font-medium">Request fully completed.</p>
    </div>
  );

  return null;
}

// ─────────────────────────────────────────────
//  Form row type
// ─────────────────────────────────────────────
interface FormItem {
  price_list_id: number | null;
  item_name: string;
  unit: string;
  quantity: string;
  accounting_code: string;
  specifications: string;
}

const EMPTY_ITEM: FormItem = {
  price_list_id: null,
  item_name: '',
  unit: '',
  quantity: '',
  accounting_code: '',
  specifications: '',
};

// ─────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────
export const SupervisorSimrSection: React.FC = () => {
  const { user } = useAuth();

  // ── list ──
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected]           = useState<any>(null);
  const [detailData, setDetailData]       = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirmingId, setConfirmingId]   = useState<number | null>(null);

  // ── farms ──
  const getFarms = useCallback(() => apiService.getFarms('supervisor'), []);
  const { data: farmsData, loading: farmsLoading } = useApi(getFarms);
  const farms: any[] = Array.isArray(farmsData)
    ? farmsData
    : Array.isArray((farmsData as any)?.results)
    ? (farmsData as any).results
    : [];

  // Helper: resolve farm name from loaded farms list
  const farmName = (farmId: number | string | null | undefined): string => {
    if (!farmId) return '—';
    const id = Number(farmId);
    const match = farms.find((f: any) => (f.farm_id ?? f.id) === id);
    return match?.name ?? `Farm #${farmId}`;
  };

  // ── price list ──
  const getPriceList = useCallback(() => apiService.getPriceList(), []);
  const { data: priceListData } = useApi(getPriceList);
  const priceList: any[] = Array.isArray(priceListData) ? priceListData : [];

  // ── blocks ──
  const [blocks, setBlocks] = useState<any[]>([]);

  // ── create form ──
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState({ farm_id: '', block_id: '', purpose: '', priority: 'normal' });
  const [formItems, setFormItems]   = useState<FormItem[]>([{ ...EMPTY_ITEM }]);
  const [formError, setFormError]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-select first farm once farms load
  useEffect(() => {
    if (farms.length > 0 && !form.farm_id) {
      const firstId = String(farms[0].farm_id ?? farms[0].id);
      setForm(f => ({ ...f, farm_id: firstId }));
    }
  }, [farms]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load blocks when farm changes
  useEffect(() => {
    if (!form.farm_id) { setBlocks([]); return; }
    apiService.getBlocksForFarm(parseInt(form.farm_id)).then(setBlocks).catch(() => setBlocks([]));
  }, [form.farm_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── fetch SIMR list ──
  const fetchSimrs = useCallback(
    () => apiService.getManagerAllSimrs(statusFilter !== 'all' ? { status: statusFilter } : undefined),
    [statusFilter]
  );
  const { data: simrs, loading, error, refetch } = useApi(fetchSimrs);
  const list = Array.isArray(simrs) ? simrs : [];

  // ── open detail ──
  const openDetail = async (simr: any) => {
    setSelected(simr);
    setDetailData(null);
    setLoadingDetail(true);
    try {
      const data = await apiService.getSimrDetail(simr.id);
      setDetailData(data);
    } catch {
      setDetailData(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── confirm receipt ──
  const handleConfirmReceipt = async (simrId: number) => {
    setConfirmingId(simrId);
    try {
      await apiService.confirmReceipt(simrId, 'received');
      toast.success('Receipt confirmed');
      setSelected(null);
      setDetailData(null);
      refetch();
    } catch (err: any) {
      toast.error(getApiError(err, 'Failed to confirm receipt'));
    } finally {
      setConfirmingId(null);
    }
  };

  // Parse stock_check_result from detail
  const stockCheck = (() => {
    const raw = detailData?.stock_check_result;
    if (!raw) return null;
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch { return null; }
  })();

  // ── item row helpers ──
  const selectPriceListItem = (rowIndex: number, priceListId: string) => {
    const item = priceList.find((p: any) => String(p.id) === priceListId);
    if (!item) return;
    setFormItems(rows => rows.map((r, i) => i === rowIndex ? {
      ...r,
      price_list_id:   item.id,
      item_name:       item.name,
      unit:            item.unit,
      accounting_code: item.accounting_code ?? '',
    } : r));
  };

  const updateRow = (index: number, field: keyof FormItem, value: string) => {
    setFormItems(rows => rows.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  // ── reset form ──
  const resetForm = () => {
    const defaultFarmId = farms.length > 0 ? String(farms[0].farm_id ?? farms[0].id) : '';
    setForm({ farm_id: defaultFarmId, block_id: '', purpose: '', priority: 'normal' });
    setFormItems([{ ...EMPTY_ITEM }]);
    setFormError('');
  };

  // ── submit ──
  const handleSubmit = async () => {
    setFormError('');
    if (!form.farm_id) { setFormError('Please select a farm.'); return; }
    if (!form.purpose.trim()) { setFormError('Purpose is required.'); return; }
    const valid = formItems.filter(r => r.item_name.trim() && parseFloat(r.quantity) > 0);
    if (valid.length === 0) { setFormError('Add at least one item with a quantity.'); return; }
    setSubmitting(true);
    try {
      await apiService.createProcurementSimr({
        farm_id:  parseInt(form.farm_id),
        ...(form.block_id ? { block_id: parseInt(form.block_id) } : {}),
        purpose:  form.purpose.trim(),
        priority: form.priority,
        items: valid.map(r => ({
          item_name:           r.item_name.trim(),
          quantity_requested:  parseFloat(r.quantity),
          unit:                r.unit,
          ...(r.price_list_id   ? { price_list_id: r.price_list_id }     : {}),
          ...(r.accounting_code ? { accounting_code: r.accounting_code } : {}),
          ...(r.specifications.trim() ? { specifications: r.specifications.trim() } : {}),
        })),
      });
      toast.success('SIMR submitted for approval');
      setShowCreate(false);
      resetForm();
      refetch();
    } catch (e: any) {
      setFormError(getApiError(e, 'Failed to submit SIMR'));
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-amber-600" />
              My Material Requests (SIMR)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_fm_approval">Pending Approval</SelectItem>
                  <SelectItem value="ready_for_issue">Ready for Issue</SelectItem>
                  <SelectItem value="partial_stock">Partial Stock</SelectItem>
                  <SelectItem value="pending_smr">Pending SMR</SelectItem>
                  <SelectItem value="gin_prepared">GIN Prepared</SelectItem>
                  <SelectItem value="collected">Collected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending_inter_farm">Inter-Farm Pending</SelectItem>
                  <SelectItem value="inter_farm_in_transit">In Transit</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                onClick={() => { resetForm(); setShowCreate(true); }}
                className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Plus className="w-3.5 h-3.5" /> New Request
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <Alert variant="destructive" className="mx-4 mb-3">
              <AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No material requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">SIMR No.</TableHead>
                  <TableHead className="text-xs">Farm</TableHead>
                  <TableHead className="text-xs">Purpose</TableHead>
                  <TableHead className="text-xs">Priority</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((s: any) => (
                  <TableRow
                    key={s.id}
                    className="hover:bg-amber-50/40 cursor-pointer"
                    onClick={() => openDetail(s)}
                  >
                    <TableCell>
                      <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                        {s.simr_number ?? `SIMR #${s.id}`}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {s.farm?.name ?? farmName(s.farm_id)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[160px] truncate">
                      {s.purpose}
                    </TableCell>
                    <TableCell><PriorityBadge priority={s.priority ?? 'normal'} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={s.status} />
                        {s.is_inter_farm && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <ArrowRightLeft className="w-2.5 h-2.5" /> Inter-farm
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell><ChevronRight className="w-3.5 h-3.5 text-gray-300" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Detail Sheet ── */}
      <Sheet
        open={!!selected}
        onOpenChange={open => { if (!open) { setSelected(null); setDetailData(null); } }}
      >
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <Boxes className="w-4 h-4 text-amber-600" />
                  {selected.simr_number ?? `SIMR #${selected.id}`}
                </SheetTitle>
                <SheetDescription asChild>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={detailData?.status ?? selected.status} />
                    <PriorityBadge priority={selected.priority ?? 'normal'} />
                    {(detailData?.is_inter_farm ?? selected.is_inter_farm) && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <ArrowRightLeft className="w-3 h-3" /> Inter-farm transfer
                      </span>
                    )}
                  </div>
                </SheetDescription>
              </SheetHeader>

              {loadingDetail ? (
                <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
              ) : (
                <div className="space-y-4 text-sm">
                  <StatusMessage simr={detailData ?? selected} />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Farm</p>
                      <p className="font-medium">{selected.farm?.name ?? farmName(selected.farm_id)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Date submitted</p>
                      <p className="font-medium">
                        {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-0.5">Purpose</p>
                      <p className="text-gray-700">{selected.purpose}</p>
                    </div>
                  </div>

                  {Array.isArray(selected.items) && selected.items.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                          Requested Items
                        </p>
                        <div className="space-y-1.5">
                          {selected.items.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center bg-gray-50 rounded px-3 py-2">
                              <div>
                                <span className="font-medium text-gray-800">{item.item_name}</span>
                                {item.accounting_code && (
                                  <span className="ml-2 text-xs text-gray-400">{item.accounting_code}</span>
                                )}
                              </div>
                              <span className="text-gray-500 text-xs">{item.quantity_requested} {item.unit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {stockCheck && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" /> Stock Check Result
                        </p>

                        {Array.isArray(stockCheck.available_items) && stockCheck.available_items.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-green-700 font-medium mb-1.5 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> In Stock
                            </p>
                            <div className="space-y-1">
                              {stockCheck.available_items.map((sc: any, i: number) => (
                                <div key={i} className="flex justify-between bg-green-50 rounded px-3 py-2 text-xs">
                                  <span className="text-gray-700">{sc.item_name}</span>
                                  <span className="text-green-700 font-semibold">
                                    {sc.quantity_available ?? sc.available ?? 0} / {sc.quantity_requested} {sc.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {Array.isArray(stockCheck.unavailable_items) && stockCheck.unavailable_items.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-red-600 font-medium mb-1.5 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Not in Stock
                            </p>
                            <div className="space-y-1">
                              {stockCheck.unavailable_items.map((sc: any, i: number) => (
                                <div key={i} className="flex justify-between bg-red-50 rounded px-3 py-2 text-xs">
                                  <span className="text-gray-700">{sc.item_name}</span>
                                  <span className="text-red-600 font-semibold">
                                    {sc.quantity_requested} {sc.unit} — unavailable
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {Array.isArray(stockCheck.cross_farm_availability) && stockCheck.cross_farm_availability.length > 0 && (
                          <div>
                            <p className="text-xs text-blue-700 font-medium mb-1.5 flex items-center gap-1">
                              <ArrowRightLeft className="w-3.5 h-3.5" /> Cross-Farm Availability
                            </p>
                            <div className="space-y-1">
                              {stockCheck.cross_farm_availability.map((sc: any, i: number) => (
                                <div key={i} className="flex justify-between bg-blue-50 rounded px-3 py-2 text-xs">
                                  <span className="text-gray-700">
                                    {sc.item_name} <span className="text-gray-400">— {sc.farm_name}</span>
                                  </span>
                                  <span className="text-blue-700 font-semibold">{sc.available_qty} available</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Confirm receipt — shown when items are ready for collection */}
              {(() => {
                const s = (detailData ?? selected)?.status?.toLowerCase();
                return (s === 'gin_prepared' || s === 'collected') ? (
                  <>
                    <Separator />
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      disabled={confirmingId === selected.id}
                      onClick={() => handleConfirmReceipt(selected.id)}
                    >
                      {confirmingId === selected.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <PackageCheck className="w-4 h-4 mr-2" />
                      )}
                      Confirm Receipt of Items
                    </Button>
                  </>
                ) : null;
              })()}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Create SIMR Dialog ── */}
      <Dialog
        open={showCreate}
        onOpenChange={open => { if (!open) { setShowCreate(false); setFormError(''); } }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-amber-600" /> New Internal Material Request
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" /><AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Farm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                {farmsLoading ? (
                  <div className="flex items-center h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-400">
                    Loading farms…
                  </div>
                ) : farms.length === 1 ? (
                  <div className="flex items-center h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-700">
                    {farmName(form.farm_id)}
                  </div>
                ) : (
                  <Select
                    value={form.farm_id}
                    onValueChange={v => setForm(f => ({ ...f, farm_id: v, block_id: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={farms.length === 0 ? 'No farms assigned' : 'Select farm…'} />
                    </SelectTrigger>
                    <SelectContent>
                      {farms.map((farm: any) => {
                        const id = String(farm.farm_id ?? farm.id);
                        return <SelectItem key={id} value={id}>{farm.name}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Block */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Block <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Select
                  value={form.block_id}
                  onValueChange={v => setForm(f => ({ ...f, block_id: v }))}
                  disabled={!form.farm_id || blocks.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !form.farm_id ? 'Select a farm first'
                        : blocks.length === 0 ? 'No blocks'
                        : 'Select block…'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {blocks.map((b: any) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Purpose */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
                <Textarea
                  value={form.purpose}
                  onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  rows={2}
                  placeholder="What are these materials needed for?"
                />
              </div>
            </div>

            {/* Items — from price list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Items *</label>
                <button
                  type="button"
                  onClick={() => setFormItems(p => [...p, { ...EMPTY_ITEM }])}
                  className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add item
                </button>
              </div>

              {priceList.length === 0 && (
                <p className="text-xs text-gray-400 mb-2">
                  No items in price list. Ask your Farm Clerk to add items first.
                </p>
              )}

              <div className="space-y-3">
                {formItems.map((row, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Item {i + 1}</span>
                      {formItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFormItems(p => p.filter((_, idx) => idx !== i))}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Item selector */}
                    <Select
                      value={row.price_list_id ? String(row.price_list_id) : ''}
                      onValueChange={v => selectPriceListItem(i, v)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select item from price list…" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceList.map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            <span className="font-medium">{p.name}</span>
                            <span className="ml-2 text-xs text-gray-400">{p.category} · {p.unit}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Qty + unit (unit auto-filled, read-only) */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={row.quantity}
                          onChange={e => updateRow(i, 'quantity', e.target.value)}
                          placeholder="Quantity"
                          className="bg-white text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          value={row.unit}
                          readOnly
                          placeholder="Unit"
                          className="bg-gray-100 text-sm text-gray-500"
                        />
                      </div>
                    </div>

                    {/* Specifications */}
                    <Input
                      value={row.specifications}
                      onChange={e => updateRow(i, 'specifications', e.target.value)}
                      placeholder="Specifications (optional)"
                      className="bg-white text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || priceList.length === 0}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {submitting ? 'Submitting…' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
