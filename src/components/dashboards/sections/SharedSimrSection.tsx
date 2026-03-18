"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
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
  ChevronRight, Package, FileText, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props { userRole: string; }

const CAN_CREATE  = ['supervisor', 'admin'];
const CAN_APPROVE = ['manager', 'admin'];
const CAN_RAISE_SMR = ['manager', 'admin'];

const SIMR_STATUS_COLORS: Record<string, string> = {
  pending_fm_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_inter_farm:  'bg-blue-100 text-blue-700 border-blue-200',
  pending_smr:         'bg-orange-100 text-orange-700 border-orange-200',
  gin_created:         'bg-teal-100 text-teal-800 border-teal-200',
  approved:            'bg-green-100 text-green-800 border-green-200',
  rejected:            'bg-red-100 text-red-800 border-red-200',
};

function StatusBadge({ status }: { status: string }) {
  const cls = SIMR_STATUS_COLORS[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

const PRIORITY_COLORS: Record<string, string> = {
  low:      'bg-gray-100 text-gray-600 border-gray-200',
  medium:   'bg-blue-100 text-blue-700 border-blue-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

function PriorityBadge({ priority }: { priority: string }) {
  const cls = PRIORITY_COLORS[priority?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>{priority}</span>;
}

interface RejectState { id: number; type: 'fm' | 'inter_farm'; }

interface SmrFormItem { item_name: string; quantity: string; unit: string; estimated_unit_price: string; required_date: string; specifications: string; }

export const SharedSimrSection: React.FC<Props> = ({ userRole }) => {
  const canCreate    = CAN_CREATE.includes(userRole);
  const canApprove   = CAN_APPROVE.includes(userRole);
  const canRaiseSmr  = CAN_RAISE_SMR.includes(userRole);

  const [statusFilter, setStatusFilter]   = useState('all');
  const [selected, setSelected]           = useState<any>(null);
  const [stockCheck, setStockCheck]       = useState<any>(null);
  const [loadingStock, setLoadingStock]   = useState(false);
  const [showCreate, setShowCreate]       = useState(false);
  const [rejectTarget, setRejectTarget]   = useState<RejectState | null>(null);
  const [rejectReason, setRejectReason]   = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [actionBusy, setActionBusy]       = useState<number | null>(null);
  const [formError, setFormError]         = useState('');

  // SIMR create form
  const [form, setForm] = useState({ farm_id: '', block_id: '', purpose: '', priority: 'normal' });
  const [formItems, setFormItems] = useState([{ item_name: '', quantity: '', unit: 'kg', specifications: '' }]);

  // SMR-from-SIMR state
  const [showCreateSmr, setShowCreateSmr]     = useState(false);
  const [smrSimrSource, setSmrSimrSource]     = useState<any>(null);
  const [smrJustification, setSmrJustification] = useState('');
  const [smrPriority, setSmrPriority]         = useState('normal');
  const [smrCurrency, setSmrCurrency]         = useState('TZS');
  const [smrBudgetCode, setSmrBudgetCode]     = useState('');
  const [smrFormItems, setSmrFormItems]       = useState<SmrFormItem[]>([]);
  const [smrFormError, setSmrFormError]       = useState('');
  const [submittingSmr, setSubmittingSmr]     = useState(false);
  const [createdSmr, setCreatedSmr]           = useState<any>(null);

  const fetchSimrs = useCallback(
    () => apiService.getManagerAllSimrs(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : undefined),
    [statusFilter]
  );
  const { data: simrs, loading, error, refetch } = useApi(fetchSimrs);
  const list = Array.isArray(simrs) ? simrs : [];

  const loadStockCheck = async (simrId: number) => {
    setStockCheck(null); setLoadingStock(true);
    try {
      const data = await apiService.getSimrDetail(simrId);
      setStockCheck(data?.stock_check ?? null);
    } catch { setStockCheck(null); }
    finally { setLoadingStock(false); }
  };

  const openDetail = (simr: any) => {
    setSelected(simr);
    setCreatedSmr(null);
    loadStockCheck(simr.id);
  };

  const handleApproveFm = async (id: number) => {
    setActionBusy(id);
    try { await apiService.approveFmSimr(id); toast.success('SIMR approved'); refetch(); }
    catch (e: any) { toast.error(getApiError(e, 'Failed to approve')); }
    finally { setActionBusy(null); }
  };

  const handleApproveInterFarm = async (id: number) => {
    setActionBusy(id);
    try { await apiService.approveInterFarmSimr(id); toast.success('Inter-farm transfer approved'); refetch(); }
    catch (e: any) { toast.error(getApiError(e, 'Failed to approve')); }
    finally { setActionBusy(null); }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setActionBusy(rejectTarget.id);
    try {
      if (rejectTarget.type === 'fm') await apiService.rejectFmSimr(rejectTarget.id, rejectReason);
      else await apiService.rejectInterFarmSimr(rejectTarget.id, rejectReason);
      toast.success('SIMR rejected');
      setRejectTarget(null); setRejectReason(''); refetch();
    } catch (e: any) { toast.error(getApiError(e, 'Failed to reject')); }
    finally { setActionBusy(null); }
  };

  const handleCreateSimrSubmit = async () => {
    setFormError('');
    if (!form.farm_id) { setFormError('Farm ID required.'); return; }
    if (!form.purpose.trim()) { setFormError('Purpose required.'); return; }
    const valid = formItems.filter(r => r.item_name.trim() && parseFloat(r.quantity) > 0);
    if (valid.length === 0) { setFormError('Add at least one item.'); return; }
    setSubmitting(true);
    try {
      await apiService.createProcurementSimr({
        farm_id: parseInt(form.farm_id),
        ...(form.block_id ? { block_id: parseInt(form.block_id) } : {}),
        purpose: form.purpose.trim(),
        priority: form.priority,
        items: valid.map(r => ({
          item_name: r.item_name.trim(),
          quantity_requested: parseFloat(r.quantity),
          unit: r.unit,
          ...(r.specifications.trim() ? { specifications: r.specifications.trim() } : {}),
        })),
      });
      toast.success('SIMR submitted');
      setShowCreate(false);
      setForm({ farm_id: '', block_id: '', purpose: '', priority: 'normal' });
      setFormItems([{ item_name: '', quantity: '', unit: 'kg', specifications: '' }]);
      refetch();
    } catch (e: any) { setFormError(getApiError(e, 'Failed to submit')); }
    finally { setSubmitting(false); }
  };

  // Open the "Create SMR" dialog pre-filled from a SIMR
  const openCreateSmrFromSimr = (simr: any) => {
    setSmrSimrSource(simr);
    setSmrJustification(simr.purpose ?? '');
    setSmrPriority('normal');
    setSmrCurrency('TZS');
    setSmrBudgetCode('');
    setSmrFormItems(
      Array.isArray(simr.items) && simr.items.length > 0
        ? simr.items.map((it: any) => ({
            item_name:            it.item_name ?? '',
            quantity:             String(it.quantity_requested ?? it.quantity ?? ''),
            unit:                 it.unit ?? 'kg',
            estimated_unit_price: String(it.estimated_unit_price ?? ''),
            required_date:        '',
            specifications:       it.specifications ?? '',
          }))
        : [{ item_name: '', quantity: '', unit: 'kg', estimated_unit_price: '', required_date: '', specifications: '' }]
    );
    setSmrFormError('');
    setCreatedSmr(null);
    setShowCreateSmr(true);
  };

  const handleCreateSmrSubmit = async () => {
    if (!smrSimrSource) return;
    setSmrFormError('');
    if (!smrJustification.trim()) { setSmrFormError('Justification is required.'); return; }
    const valid = smrFormItems.filter(r => r.item_name.trim() && parseFloat(r.quantity) > 0);
    if (valid.length === 0) { setSmrFormError('At least one item is required.'); return; }
    setSubmittingSmr(true);
    try {
      const result = await apiService.createSmr({
        simr_id:       smrSimrSource.id,
        farm_id:       smrSimrSource.farm_id,
        justification: smrJustification.trim(),
        priority:      smrPriority,
        currency:      smrCurrency,
        ...(smrBudgetCode.trim() ? { budget_code: smrBudgetCode.trim() } : {}),
        items: valid.map(r => ({
          item_name:            r.item_name.trim(),
          quantity:             parseFloat(r.quantity),
          unit:                 r.unit,
          estimated_unit_price: parseFloat(r.estimated_unit_price) || 0,
          ...(r.required_date ? { required_date: r.required_date } : {}),
          ...(r.specifications.trim() ? { specifications: r.specifications.trim() } : {}),
        })),
      });
      toast.success('SMR raised successfully');
      setCreatedSmr(result);
      setShowCreateSmr(false);
      // Refresh list and update detail panel
      refetch();
      // Re-open detail with fresh SIMR data if still open
      if (selected?.id === smrSimrSource.id) {
        setSelected((prev: any) => ({ ...prev, status: 'pending_smr' }));
      }
    } catch (e: any) {
      setSmrFormError(getApiError(e, 'Failed to create SMR'));
    } finally {
      setSubmittingSmr(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-amber-600" />
              Internal Material Requests (SIMR)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending_fm_approval">Pending FM approval</SelectItem>
                  <SelectItem value="pending_inter_farm">Pending inter-farm</SelectItem>
                  <SelectItem value="pending_smr">Pending SMR</SelectItem>
                  <SelectItem value="gin_created">GIN created</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="w-3.5 h-3.5" /></Button>
              {canCreate && (
                <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="w-3.5 h-3.5" /> New Request
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && <Alert variant="destructive" className="mx-4 mb-3"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
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
                  <TableHead className="text-xs">Actions</TableHead>
                  <TableHead className="text-xs w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((s: any) => {
                  const isPendingFm    = s.status === 'pending_fm_approval';
                  const isInterFarm    = s.status === 'pending_inter_farm';
                  const isPendingSmr   = s.status === 'pending_smr';
                  return (
                    <TableRow key={s.id} className="hover:bg-amber-50/40">
                      <TableCell className="cursor-pointer" onClick={() => openDetail(s)}>
                        <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                          {s.simr_number ?? `SIMR #${s.id}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 cursor-pointer" onClick={() => openDetail(s)}>{s.farm?.name ?? `Farm #${s.farm_id}`}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[160px] truncate cursor-pointer" onClick={() => openDetail(s)}>{s.purpose}</TableCell>
                      <TableCell className="cursor-pointer" onClick={() => openDetail(s)}><PriorityBadge priority={s.priority ?? 'medium'} /></TableCell>
                      <TableCell className="cursor-pointer" onClick={() => openDetail(s)}><StatusBadge status={s.status} /></TableCell>
                      <TableCell className="text-xs text-gray-400 cursor-pointer" onClick={() => openDetail(s)}>{s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {canApprove && (isPendingFm || isInterFarm) && (
                            <>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-200 hover:bg-green-50" disabled={actionBusy === s.id}
                                onClick={() => isPendingFm ? handleApproveFm(s.id) : handleApproveInterFarm(s.id)}>
                                {actionBusy === s.id ? '…' : '✓'}
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50" disabled={actionBusy === s.id}
                                onClick={() => setRejectTarget({ id: s.id, type: isPendingFm ? 'fm' : 'inter_farm' })}>
                                ✕
                              </Button>
                            </>
                          )}
                          {canRaiseSmr && isPendingSmr && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-orange-700 border-orange-200 hover:bg-orange-50 gap-1"
                              onClick={() => openCreateSmrFromSimr(s)}>
                              <FileText className="w-3 h-3" /> Raise SMR
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="cursor-pointer" onClick={() => openDetail(s)}><ChevronRight className="w-3.5 h-3.5 text-gray-300" /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Detail Sheet ── */}
      <Sheet open={!!selected} onOpenChange={open => { if (!open) { setSelected(null); setStockCheck(null); setCreatedSmr(null); } }}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <Boxes className="w-4 h-4 text-amber-600" />
                  {selected.simr_number ?? `SIMR #${selected.id}`}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <PriorityBadge priority={selected.priority ?? 'medium'} />
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-gray-400 mb-0.5">Farm</p><p className="font-medium">{selected.farm?.name ?? `Farm #${selected.farm_id}`}</p></div>
                  <div><p className="text-xs text-gray-400 mb-0.5">Requested by</p><p className="font-medium">{selected.supervisor?.full_name ?? '—'}</p></div>
                  <div className="col-span-2"><p className="text-xs text-gray-400 mb-0.5">Purpose</p><p className="text-gray-700">{selected.purpose}</p></div>
                  {selected.rejection_reason && (
                    <div className="col-span-2 bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-xs text-red-400 mb-0.5">Rejection Reason</p>
                      <p className="text-red-700">{selected.rejection_reason}</p>
                    </div>
                  )}
                </div>

                {/* Linked SMR badge (if already raised) */}
                {selected.smr_id && (
                  <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded px-3 py-2 text-sm">
                    <FileText className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                    <span className="text-orange-800 font-medium">SMR raised:</span>
                    <span className="font-mono text-orange-700">{selected.smr_number ?? `SMR #${selected.smr_id}`}</span>
                  </div>
                )}

                {/* Created SMR confirmation (just raised in this session) */}
                {createdSmr && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    <span className="text-green-800">SMR created:</span>
                    <span className="font-mono text-green-700 font-semibold">
                      {createdSmr.smr_number ?? `SMR #${createdSmr.id}`}
                    </span>
                  </div>
                )}

                {/* Items */}
                {Array.isArray(selected.items) && selected.items.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Requested Items</p>
                      <div className="space-y-1.5">
                        {selected.items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-gray-50 rounded px-3 py-2">
                            <span className="font-medium text-gray-800">{item.item_name}</span>
                            <span className="text-gray-500 text-xs">{item.quantity_requested} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Stock Check */}
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" /> Stock Check
                  </p>
                  {loadingStock ? (
                    <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
                  ) : stockCheck ? (
                    <div className="space-y-1.5">
                      {Array.isArray(stockCheck.items) && stockCheck.items.map((sc: any, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-xs">
                          <span className="text-gray-700">{sc.item_name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${sc.available >= sc.quantity_requested ? 'text-green-700' : 'text-red-600'}`}>
                              {sc.available ?? 0} / {sc.quantity_requested} {sc.unit}
                            </span>
                            {sc.available >= sc.quantity_requested
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                              : <XCircle className="w-3.5 h-3.5 text-red-500" />
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-gray-400">No stock check data</p>}
                </div>

                {/* Approve / Reject actions */}
                {canApprove && (selected.status === 'pending_fm_approval' || selected.status === 'pending_inter_farm') && (
                  <>
                    <Separator />
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm" disabled={actionBusy === selected.id}
                        onClick={() => { selected.status === 'pending_fm_approval' ? handleApproveFm(selected.id) : handleApproveInterFarm(selected.id); setSelected(null); }}>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
                      </Button>
                      <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50 text-sm"
                        onClick={() => { setRejectTarget({ id: selected.id, type: selected.status === 'pending_fm_approval' ? 'fm' : 'inter_farm' }); setSelected(null); }}>
                        <XCircle className="w-4 h-4 mr-1.5" /> Reject
                      </Button>
                    </div>
                  </>
                )}

                {/* ── Raise SMR button when stock unavailable ── */}
                {canRaiseSmr && selected.status === 'pending_smr' && !createdSmr && !selected.smr_id && (
                  <>
                    <Separator />
                    <div className="bg-orange-50 border border-orange-200 rounded p-3 space-y-2">
                      <p className="text-xs text-orange-700 font-medium flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Stock unavailable — external procurement required
                      </p>
                      <p className="text-xs text-orange-600">
                        Raise a SMART Material Request (SMR) to source these items externally.
                        The form will be pre-filled with the items from this SIMR.
                      </p>
                      <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-1.5"
                        onClick={() => { openCreateSmrFromSimr(selected); setSelected(null); }}>
                        <FileText className="w-4 h-4" /> Create SMR from this SIMR
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Reject Dialog ── */}
      <Dialog open={!!rejectTarget} onOpenChange={open => { if (!open) { setRejectTarget(null); setRejectReason(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-red-700">Reject SIMR</DialogTitle></DialogHeader>
          <div className="py-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Explain why this request is being rejected…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="destructive" disabled={!rejectReason.trim() || !!actionBusy} onClick={handleReject}>
              {actionBusy ? 'Rejecting…' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create SIMR Dialog ── */}
      {canCreate && (
        <Dialog open={showCreate} onOpenChange={open => { if (!open) { setShowCreate(false); setFormError(''); } }}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-600" /> New Internal Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-1">
              {formError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{formError}</AlertDescription></Alert>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm ID *</label>
                  <Input type="number" value={form.farm_id} onChange={e => setForm(f => ({ ...f, farm_id: e.target.value }))} placeholder="Farm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Block ID <span className="text-gray-400 font-normal">(optional)</span></label>
                  <Input type="number" value={form.block_id} onChange={e => setForm(f => ({ ...f, block_id: e.target.value }))} placeholder="Block #" />
                </div>
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
                  <Textarea value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} rows={2} placeholder="What are these materials needed for?" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Items *</label>
                  <button type="button" onClick={() => setFormItems(p => [...p, { item_name: '', quantity: '', unit: 'kg', specifications: '' }])} className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                {formItems.map((row, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center mb-2">
                    <div className="col-span-6"><Input value={row.item_name} onChange={e => setFormItems(p => p.map((r, idx) => idx === i ? { ...r, item_name: e.target.value } : r))} placeholder="Item name" className="text-sm" /></div>
                    <div className="col-span-3"><Input type="number" min="0.01" step="0.01" value={row.quantity} onChange={e => setFormItems(p => p.map((r, idx) => idx === i ? { ...r, quantity: e.target.value } : r))} placeholder="Qty" className="text-sm" /></div>
                    <div className="col-span-2"><Input value={row.unit} onChange={e => setFormItems(p => p.map((r, idx) => idx === i ? { ...r, unit: e.target.value } : r))} placeholder="kg" className="text-sm" /></div>
                    <div className="col-span-1 flex justify-center">
                      {formItems.length > 1 && <button type="button" onClick={() => setFormItems(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>}
                    </div>
                    <div className="col-span-11">
                      <Input value={row.specifications} onChange={e => setFormItems(p => p.map((r, idx) => idx === i ? { ...r, specifications: e.target.value } : r))} placeholder="Specifications (optional)" className="text-xs" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleCreateSimrSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white">
                {submitting ? 'Submitting…' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Create SMR from SIMR Dialog ── */}
      <Dialog open={showCreateSmr} onOpenChange={open => { if (!open) { setShowCreateSmr(false); setSmrFormError(''); } }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              Create SMART Material Request (SMR)
            </DialogTitle>
            {smrSimrSource && (
              <p className="text-xs text-gray-500 pt-1">
                Escalating from{' '}
                <span className="font-mono text-orange-700 font-medium">
                  {smrSimrSource.simr_number ?? `SIMR #${smrSimrSource.id}`}
                </span>
                {' '}· Farm: <span className="font-medium">{smrSimrSource.farm?.name ?? `Farm #${smrSimrSource.farm_id}`}</span>
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4 py-1">
            {smrFormError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{smrFormError}</AlertDescription>
              </Alert>
            )}

            {/* Read-only context fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Farm ID (auto)</label>
                <Input value={smrSimrSource?.farm_id ?? ''} readOnly className="bg-gray-50 text-gray-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Linked SIMR (auto)</label>
                <Input value={smrSimrSource ? (smrSimrSource.simr_number ?? `SIMR #${smrSimrSource.id}`) : ''} readOnly className="bg-gray-50 text-gray-500 text-sm font-mono" />
              </div>
            </div>

            {/* Justification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Justification *</label>
              <Textarea
                value={smrJustification}
                onChange={e => setSmrJustification(e.target.value)}
                rows={2}
                placeholder="Why are these items needed externally?"
              />
            </div>

            {/* Budget Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget Code <span className="text-gray-400 font-normal">(optional)</span></label>
              <Input value={smrBudgetCode} onChange={e => setSmrBudgetCode(e.target.value)} placeholder="e.g. AGR-2026" />
            </div>

            {/* Priority + Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <Select value={smrPriority} onValueChange={setSmrPriority}>
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
                <Select value={smrCurrency} onValueChange={setSmrCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TZS">TZS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Editable items — pre-filled from SIMR */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Items *</label>
                <button type="button"
                  onClick={() => setSmrFormItems(p => [...p, { item_name: '', quantity: '', unit: 'kg', estimated_unit_price: '', required_date: '', specifications: '' }])}
                  className="text-xs text-orange-700 hover:text-orange-900 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add item
                </button>
              </div>
              <div className="grid grid-cols-12 gap-2 mb-1 px-0.5">
                <div className="col-span-5 text-xs text-gray-400">Item</div>
                <div className="col-span-2 text-xs text-gray-400">Qty</div>
                <div className="col-span-2 text-xs text-gray-400">Unit</div>
                <div className="col-span-2 text-xs text-gray-400">Unit price</div>
              </div>
              {smrFormItems.map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center mb-2">
                  <div className="col-span-5">
                    <Input value={row.item_name}
                      onChange={e => setSmrFormItems(p => p.map((r, idx) => idx === i ? { ...r, item_name: e.target.value } : r))}
                      placeholder="Item name" className="text-sm" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" min="0.01" step="0.01" value={row.quantity}
                      onChange={e => setSmrFormItems(p => p.map((r, idx) => idx === i ? { ...r, quantity: e.target.value } : r))}
                      placeholder="Qty" className="text-sm" />
                  </div>
                  <div className="col-span-2">
                    <Input value={row.unit}
                      onChange={e => setSmrFormItems(p => p.map((r, idx) => idx === i ? { ...r, unit: e.target.value } : r))}
                      placeholder="kg" className="text-sm" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" min="0" step="0.01" value={row.estimated_unit_price}
                      onChange={e => setSmrFormItems(p => p.map((r, idx) => idx === i ? { ...r, estimated_unit_price: e.target.value } : r))}
                      placeholder="0.00" className="text-sm" />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {smrFormItems.length > 1 && (
                      <button type="button" onClick={() => setSmrFormItems(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    )}
                  </div>
                  <div className="col-span-6">
                    <Input type="date" value={row.required_date}
                      onChange={e => setSmrFormItems(p => p.map((r, idx) => idx === i ? { ...r, required_date: e.target.value } : r))}
                      className="text-sm" />
                  </div>
                  <div className="col-span-6">
                    <Input value={row.specifications}
                      onChange={e => setSmrFormItems(p => p.map((r, idx) => idx === i ? { ...r, specifications: e.target.value } : r))}
                      placeholder="Specifications (optional)" className="text-sm" />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400">
              Items are pre-filled from the SIMR. Adjust quantities and add estimated unit prices before submitting.
              The SMR will be linked to this SIMR via <code className="bg-gray-100 px-1 rounded">simr_id</code>.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateSmr(false); setSmrFormError(''); }} disabled={submittingSmr}>
              Cancel
            </Button>
            <Button onClick={handleCreateSmrSubmit} disabled={submittingSmr} className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5">
              <FileText className="w-4 h-4" />
              {submittingSmr ? 'Creating SMR…' : 'Submit SMR'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
