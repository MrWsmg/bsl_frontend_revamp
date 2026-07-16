"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { getApiError } from '../../../utils';
import { type CrossFarmItemHit } from '../../../services/api/procurement';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Pagination, usePagination } from '../../common/Pagination';
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
import { FileText, RefreshCw, Plus, AlertCircle, Link2, ChevronRight, ArrowLeftRight, X, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { ChainStepper } from '@/components/procurement/ChainStepper';

interface Props { userRole: string; }

const CAN_CREATE = ['manager', 'admin'];

const SMR_STATUS_COLORS: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600 border-gray-200',
  pending:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved:  'bg-green-100 text-green-800 border-green-200',
  rejected:  'bg-red-100 text-red-800 border-red-200',
  fulfilled: 'bg-teal-100 text-teal-800 border-teal-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  low:      'bg-gray-100 text-gray-600 border-gray-200',
  medium:   'bg-blue-100 text-blue-700 border-blue-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

function StatusBadge({ status }: { status: string }) {
  const cls = SMR_STATUS_COLORS[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls = PRIORITY_COLORS[priority?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {priority}
    </span>
  );
}

interface SmrFormData {
  farm_id: string;
  justification: string;
  priority: string;
  budget_code: string;
  currency: string;
  items: { item_name: string; quantity: string; unit: string }[];
}

const emptyForm = (): SmrFormData => ({
  farm_id: '', justification: '', priority: 'normal', budget_code: '', currency: 'TZS',
  items: [{ item_name: '', quantity: '', unit: 'kg' }],
});

export const SharedSmrSection: React.FC<Props> = ({ userRole }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected]         = useState<any>(null);
  const [chain, setChain]               = useState<any>(null);
  const [loadingChain, setLoadingChain] = useState(false);
  const [showCreate, setShowCreate]     = useState(false);
  const [form, setForm]                 = useState<SmrFormData>(emptyForm());
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState('');

  // ── Cross-farm advisory ──────────────────────────────────────────────────
  const [advisory, setAdvisory] = useState<{
    smr_number: string;
    items: CrossFarmItemHit[];
  } | null>(null);
  const [liveAdvisory, setLiveAdvisory]     = useState<CrossFarmItemHit[] | null>(null);
  const [loadingAdvisory, setLoadingAdvisory] = useState(false);

  const canCreate = CAN_CREATE.includes(userRole);

  const [farms, setFarms] = useState<any[]>([]);
  useEffect(() => {
    apiService.getManagerFarms().then(setFarms).catch(() => {});
  }, []);

  const fetchSmrs = useCallback(
    () => apiService.getProcurementSmrs(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : undefined),
    [statusFilter]
  );
  const { data: smrs, loading, error, refetch } = useApi(fetchSmrs);
  const list = Array.isArray(smrs) ? smrs : [];

  const {
    paginatedItems: pagedDocs,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    totalPages, totalItems,
  } = usePagination<any>(list, 25);

  const loadChain = async (smrNumber: string) => {
    setChain(null);
    if (!smrNumber) return;
    setLoadingChain(true);
    try {
      const data = await apiService.getExternalChain(smrNumber);
      setChain(data);
    } catch {
      setChain(null);
    } finally {
      setLoadingChain(false);
    }
  };

  const openDetail = async (smr: any) => {
    setSelected(smr);
    setChain(null);
    if (smr.smr_number) loadChain(smr.smr_number);
  };

  const updateItem = (i: number, patch: Partial<SmrFormData['items'][0]>) =>
    setForm(f => ({ ...f, items: f.items.map((r, idx) => idx === i ? { ...r, ...patch } : r) }));

  const handleSubmit = async () => {
    setFormError('');
    if (!form.farm_id) { setFormError('Farm is required.'); return; }
    if (!form.justification.trim()) { setFormError('Justification is required.'); return; }
    const validItems = form.items.filter(r => r.item_name.trim() && parseFloat(r.quantity) > 0);
    if (validItems.length === 0) { setFormError('Add at least one item.'); return; }
    setSubmitting(true);
    try {
      const response = await apiService.createSmr({
        farm_id:       parseInt(form.farm_id),
        justification: form.justification.trim(),
        priority:      form.priority,
        budget_code:   form.budget_code.trim() || null,
        currency:      form.currency || 'TZS',
        items: validItems.map(r => ({
          item_name: r.item_name.trim(),
          quantity:  parseFloat(r.quantity),
          unit:      r.unit,
        })),
      });
      toast.success('SMR created successfully');
      setShowCreate(false);
      setForm(emptyForm());
      refetch();

      // Show cross-farm advisory if backend found matching stock elsewhere
      const hits: CrossFarmItemHit[] = response?.cross_farm_availability ?? [];
      if (hits.length > 0) {
        setAdvisory({ smr_number: response.smr_number ?? 'New SMR', items: hits });
      }
    } catch (err: any) {
      setFormError(getApiError(err, 'Failed to create SMR'));
    } finally {
      setSubmitting(false);
    }
  };

  const loadLiveAdvisory = async (smrId: number) => {
    setLiveAdvisory(null);
    setLoadingAdvisory(true);
    try {
      const hits = await apiService.getSmrCrossFarmStock(smrId);
      setLiveAdvisory(hits);
    } catch {
      setLiveAdvisory([]);
    } finally {
      setLoadingAdvisory(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Cross-Farm Advisory Banner (shown after SMR creation) ── */}
      {advisory && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 relative">
          <button
            onClick={() => setAdvisory(null)}
            className="absolute top-3 right-3 text-amber-500 hover:text-amber-700"
            aria-label="Dismiss advisory"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <ArrowLeftRight className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 mb-0.5">
                Cross-Farm Stock Available — {advisory.smr_number}
              </p>
              <p className="text-xs text-amber-700 mb-3">
                {advisory.items.length} item(s) may be sourced via internal transfer instead of
                external procurement. Consider requesting a transfer to save cost and time.
              </p>
              <div className="space-y-2">
                {advisory.items.map((hit, i) => (
                  <div key={i} className="bg-white border border-amber-200 rounded px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">{hit.item_name}</span>
                      <span className="text-xs text-gray-500">need: {hit.quantity_requested} {hit.unit}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hit.available_at.map((farm, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center gap-1 text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full"
                        >
                          <MapPin className="w-2.5 h-2.5" />
                          {farm.farm_name} · {farm.quantity_on_hand} {farm.unit}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-amber-600 mt-2 italic">
                This is advisory only. Your SMR has been submitted and procurement can proceed normally.
                The Financial Controller and Procurement Officer have been notified.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              SMART Material Requests (SMR)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              {canCreate && (
                <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="w-3.5 h-3.5" /> New SMR
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <Alert variant="destructive" className="mx-4 mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No material requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">SMR No.</TableHead>
                  <TableHead className="text-xs">Farm</TableHead>
                  <TableHead className="text-xs">Purpose</TableHead>
                  <TableHead className="text-xs">Priority</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedDocs.map((smr: any) => (
                  <TableRow
                    key={smr.id}
                    className="cursor-pointer hover:bg-amber-50/40 transition-colors"
                    onClick={() => openDetail(smr)}
                  >
                    <TableCell>
                      <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                        {smr.smr_number ?? `SMR #${smr.id}`}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{smr.farm?.name ?? smr.farm_id ?? '—'}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[180px] truncate">{smr.purpose}</TableCell>
                    <TableCell><PriorityBadge priority={smr.priority ?? 'medium'} /></TableCell>
                    <TableCell><StatusBadge status={smr.status} /></TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {smr.created_at ? new Date(smr.created_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell><ChevronRight className="w-3.5 h-3.5 text-gray-300" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {totalItems > 0 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems}
              itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={open => { if (!open) { setSelected(null); setChain(null); setLiveAdvisory(null); } }}>
        <SheetContent className="sm:max-w-[520px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-4 h-4 text-amber-600" />
                  {selected.smr_number ?? `SMR #${selected.id}`}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selected.status} />
                  <PriorityBadge priority={selected.priority ?? 'medium'} />
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Farm</p>
                    <p className="font-medium text-gray-800">{selected.farm?.name ?? `Farm #${selected.farm_id}`}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Requested by</p>
                    <p className="font-medium text-gray-800">{selected.requested_by?.full_name ?? selected.requested_by ?? '—'}</p>
                  </div>
                  {selected.approved_by && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Approved by</p>
                      <p className="font-medium text-gray-800">{selected.approved_by?.full_name ?? selected.approved_by}</p>
                    </div>
                  )}
                  {selected.approved_at && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Approved at</p>
                      <p className="text-gray-700">{new Date(selected.approved_at).toLocaleString()}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Purpose</p>
                    <p className="text-gray-700">{selected.purpose}</p>
                  </div>
                  {selected.notes && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-0.5">Notes</p>
                      <p className="text-gray-600 text-xs">{selected.notes}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Items */}
                {Array.isArray(selected.items) && selected.items.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Items Requested</p>
                    <div className="space-y-1.5">
                      {selected.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-gray-50 rounded px-3 py-2">
                          <span className="text-gray-800 font-medium">{item.item_name}</span>
                          <span className="text-gray-500 text-xs">{item.quantity_requested} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Procurement Chain */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" /> Document Chain
                  </p>
                  <ChainStepper
                    chainType="external"
                    chain={chain}
                    loading={loadingChain}
                  />
                </div>

                {/* Cross-Farm Stock Check */}
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <ArrowLeftRight className="w-3.5 h-3.5" /> Cross-Farm Stock
                    </p>
                    {liveAdvisory === null && !loadingAdvisory && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                        onClick={() => loadLiveAdvisory(selected.id)}
                      >
                        <ArrowLeftRight className="w-3 h-3" /> Check
                      </Button>
                    )}
                    {(liveAdvisory !== null || loadingAdvisory) && (
                      <button
                        className="text-xs text-gray-400 hover:text-gray-600"
                        onClick={() => setLiveAdvisory(null)}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {loadingAdvisory && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                      <LoadingSpinner size="sm" /> Checking other farms…
                    </div>
                  )}

                  {liveAdvisory !== null && !loadingAdvisory && liveAdvisory.length === 0 && (
                    <p className="text-xs text-gray-400 py-1">
                      No other farm has sufficient stock for any requested item.
                    </p>
                  )}

                  {liveAdvisory !== null && !loadingAdvisory && liveAdvisory.length > 0 && (
                    <div className="space-y-2">
                      {liveAdvisory.map((hit, i) => (
                        <div key={i} className="bg-amber-50 border border-amber-200 rounded px-3 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-800">{hit.item_name}</span>
                            <span className="text-xs text-gray-500">need {hit.quantity_requested} {hit.unit}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {hit.available_at.map((farm, j) => (
                              <span
                                key={j}
                                className="inline-flex items-center gap-1 text-xs bg-white border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full"
                              >
                                <MapPin className="w-2 h-2" />
                                {farm.farm_name} · {farm.quantity_on_hand} {farm.unit}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-amber-600 italic">
                        Advisory only — request an internal transfer if preferred.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create SMR Dialog */}
      {canCreate && (
        <Dialog open={showCreate} onOpenChange={open => { if (!open) { setShowCreate(false); setForm(emptyForm()); setFormError(''); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Create SMART Material Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-1">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                  <Select value={form.farm_id} onValueChange={v => setForm(f => ({ ...f, farm_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select farm…" />
                    </SelectTrigger>
                    <SelectContent>
                      {farms.map((farm: any) => (
                        <SelectItem key={farm.id} value={String(farm.id)}>
                          {farm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TZS">TZS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget Code</label>
                  <Input value={form.budget_code} onChange={e => setForm(f => ({ ...f, budget_code: e.target.value }))} placeholder="Optional" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Justification *</label>
                  <Textarea value={form.justification} onChange={e => setForm(f => ({ ...f, justification: e.target.value }))} rows={2} placeholder="Describe what these materials are needed for and why…" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Items *</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, { item_name: '', quantity: '', unit: 'kg' }] }))} className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add item
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 px-0.5">
                    <div className="col-span-6">Item name</div>
                    <div className="col-span-3">Qty</div>
                    <div className="col-span-2">Unit</div>
                    <div className="col-span-1" />
                  </div>
                  {form.items.map((row, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <Input value={row.item_name} onChange={e => updateItem(i, { item_name: e.target.value })} placeholder="Item name" className="text-sm" />
                      </div>
                      <div className="col-span-3">
                        <Input type="number" min="0.01" step="0.01" value={row.quantity} onChange={e => updateItem(i, { quantity: e.target.value })} placeholder="Qty" className="text-sm" />
                      </div>
                      <div className="col-span-2">
                        <Input value={row.unit} onChange={e => updateItem(i, { unit: e.target.value })} placeholder="kg" className="text-sm" />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); setForm(emptyForm()); setFormError(''); }} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white">
                {submitting ? 'Creating…' : 'Create SMR'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
