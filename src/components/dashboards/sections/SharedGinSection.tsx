"use client";

import React, { useState, useCallback, useEffect } from 'react';
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
  PackageOpen, RefreshCw, AlertCircle, CheckCircle2, XCircle,
  SendHorizontal, ChevronRight, AlertTriangle, Link2, Plus, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { DocLink } from '@/components/procurement/DocLink';

interface Props { userRole: string; }

const CAN_CREATE  = ['farm_clerk', 'admin'];
const CAN_APPROVE = ['manager', 'admin'];
const CAN_ISSUE   = ['farm_clerk', 'admin'];
const CAN_ATTACH_TV = ['farm_clerk', 'admin'];

const GIN_STATUS_COLORS: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved:         'bg-green-100 text-green-800 border-green-200',
  issued:           'bg-teal-100 text-teal-800 border-teal-200',
  rejected:         'bg-red-100 text-red-800 border-red-200',
};

function StatusBadge({ status }: { status: string }) {
  const cls = GIN_STATUS_COLORS[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

interface GinItem {
  item_name: string;
  quantity_issued: string;
  unit: string;
  unit_cost: string;
  accounting_code: string;
}

const emptyItem = (): GinItem => ({
  item_name: '', quantity_issued: '', unit: '', unit_cost: '', accounting_code: '',
});

export const SharedGinSection: React.FC<Props> = ({ userRole }) => {
  const canCreate    = CAN_CREATE.includes(userRole);
  const canApprove   = CAN_APPROVE.includes(userRole);
  const canIssue     = CAN_ISSUE.includes(userRole);
  const canAttachTV  = CAN_ATTACH_TV.includes(userRole);

  // ── list / actions ────────────────────────────────────────────────────────
  const [selected, setSelected]         = useState<any>(null);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionBusy, setActionBusy]     = useState<number | null>(null);
  const [showAttachTV, setShowAttachTV] = useState(false);
  const [attachTVId, setAttachTVId]     = useState('');
  const [attachingTV, setAttachingTV]   = useState(false);

  const fetchGins = useCallback(() => apiService.getGins(), []);
  const { data: gins, loading, error, refetch } = useApi(fetchGins);
  const list = Array.isArray(gins) ? gins : [];

  // ── create GIN dialog ─────────────────────────────────────────────────────
  const [showCreate, setShowCreate]     = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState('');

  // meta lists loaded when dialog opens
  const [metaLoading, setMetaLoading]   = useState(false);
  const [farms, setFarms]               = useState<any[]>([]);
  const [supervisors, setSupervisors]   = useState<any[]>([]);
  const [tvList, setTvList]             = useState<any[]>([]);

  // header fields
  const [farmId, setFarmId]             = useState('');
  const [issuedTo, setIssuedTo]         = useState('');
  const [purpose, setPurpose]           = useState('');
  const [tvRequired, setTvRequired]     = useState<'true' | 'false'>('false');
  const [tvId, setTvId]                 = useState('');
  const [simrId, setSimrId]             = useState('');
  const [smrId, setSmrId]               = useState('');

  // line items
  const [items, setItems]               = useState<GinItem[]>([emptyItem()]);

  // load farms, supervisors, TVs when dialog opens
  useEffect(() => {
    if (!showCreate) return;
    setMetaLoading(true);
    const normalize = (v: any) => Array.isArray(v) ? v : (v?.results ?? []);
    Promise.allSettled([
      apiService.getFarms(userRole),
      apiService.getManagerUsers(),
      apiService.getTransportVouchers(),
    ]).then(([farmsRes, usersRes, tvsRes]) => {
      setFarms(farmsRes.status === 'fulfilled' ? normalize(farmsRes.value) : []);
      const allUsers = usersRes.status === 'fulfilled' ? normalize(usersRes.value) : [];
      setSupervisors(allUsers.filter((u: any) => u.role === 'supervisor'));
      setTvList(tvsRes.status === 'fulfilled' ? normalize(tvsRes.value) : []);
    }).finally(() => setMetaLoading(false));
  }, [showCreate]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateItem = (i: number, patch: Partial<GinItem>) =>
    setItems(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const resetForm = () => {
    setFarmId(''); setIssuedTo(''); setPurpose('');
    setTvRequired('false'); setTvId('');
    setSimrId(''); setSmrId('');
    setItems([emptyItem()]); setFormError('');
    setFarms([]); setSupervisors([]); setTvList([]);
  };

  const handleCreate = async () => {
    setFormError('');
    if (!farmId)    { setFormError('Select a farm.');              return; }
    if (!issuedTo)  { setFormError('Select the recipient.');       return; }
    const validItems = items.filter(r => r.item_name.trim() && r.quantity_issued && r.unit.trim());
    if (validItems.length === 0) { setFormError('Add at least one item with name, quantity and unit.'); return; }

    setSubmitting(true);
    try {
      const payload: any = {
        farm_id:     parseInt(farmId),
        issued_to:   parseInt(issuedTo),
        tv_required: tvRequired === 'true',
        items: validItems.map(r => ({
          item_name:       r.item_name.trim(),
          quantity_issued: parseFloat(r.quantity_issued),
          unit:            r.unit.trim(),
          ...(r.unit_cost        ? { unit_cost:        parseFloat(r.unit_cost)       } : {}),
          ...(r.accounting_code  ? { accounting_code:  r.accounting_code.trim()      } : {}),
        })),
      };
      if (purpose.trim()) payload.purpose = purpose.trim();
      if (tvId)           payload.tv_id   = parseInt(tvId);
      if (simrId)         payload.simr_id = parseInt(simrId);
      if (smrId)          payload.smr_id  = parseInt(smrId);

      await apiService.createGin(payload);
      toast.success('GIN created — awaiting manager approval');
      setShowCreate(false);
      resetForm();
      refetch();
    } catch (err: any) {
      setFormError(getApiError(err, 'Failed to create GIN'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── action handlers ───────────────────────────────────────────────────────
  const handleApprove = async (id: number) => {
    setActionBusy(id);
    try { await apiService.approveGin(id); toast.success('GIN approved'); refetch(); }
    catch (e: any) { toast.error(getApiError(e, 'Failed to approve')); }
    finally { setActionBusy(null); }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setActionBusy(rejectTarget);
    try {
      await apiService.rejectGin(rejectTarget, rejectReason);
      toast.success('GIN rejected');
      setRejectTarget(null); setRejectReason(''); refetch();
    }
    catch (e: any) { toast.error(getApiError(e, 'Failed to reject')); }
    finally { setActionBusy(null); }
  };

  const handleIssue = async (id: number) => {
    setActionBusy(id);
    try { await apiService.issueGin(id); toast.success('GIN issued — CARDEX reduced'); refetch(); }
    catch (e: any) { toast.error(getApiError(e, 'Failed to issue')); }
    finally { setActionBusy(null); }
  };

  const handleAttachTV = async () => {
    if (!selected || !attachTVId.trim()) return;
    setAttachingTV(true);
    try {
      await apiService.attachTVtoGIN(selected.id, parseInt(attachTVId));
      toast.success('TV attached to GIN');
      setShowAttachTV(false); setAttachTVId('');
      refetch();
      setSelected((prev: any) => prev ? { ...prev, tv_id: parseInt(attachTVId) } : prev);
    } catch (e: any) {
      toast.error(getApiError(e, 'Failed to attach TV'));
    } finally { setAttachingTV(false); }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <PackageOpen className="w-4 h-4 text-amber-600" />
              Goods Issue Notes (GIN)
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              {canCreate && (
                <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="w-3.5 h-3.5" /> Create GIN
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
              <PackageOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No issue notes found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">GIN No.</TableHead>
                  <TableHead className="text-xs">Farm</TableHead>
                  <TableHead className="text-xs">Issued To</TableHead>
                  <TableHead className="text-xs">SIMR</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                  <TableHead className="text-xs w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((gin: any) => {
                  const isPendingApproval = ['pending', 'pending_approval'].includes(gin.status?.toLowerCase());
                  const isApproved = gin.status?.toLowerCase() === 'approved';
                  return (
                    <TableRow key={gin.id} className="hover:bg-amber-50/40">
                      <TableCell className="cursor-pointer" onClick={() => setSelected(gin)}>
                        <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                          {gin.gin_number ?? `GIN #${gin.id}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 cursor-pointer" onClick={() => setSelected(gin)}>
                        {gin.farm?.name ?? `Farm #${gin.farm_id}`}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 cursor-pointer" onClick={() => setSelected(gin)}>
                        {gin.issued_to?.full_name ?? gin.issued_to_name ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-gray-500 cursor-pointer" onClick={() => setSelected(gin)}>
                        {gin.simr_id ? `SIMR #${gin.simr_id}` : '—'}
                      </TableCell>
                      <TableCell className="cursor-pointer" onClick={() => setSelected(gin)}>
                        <StatusBadge status={gin.status} />
                      </TableCell>
                      <TableCell className="text-xs text-gray-400 cursor-pointer" onClick={() => setSelected(gin)}>
                        {gin.created_at ? new Date(gin.created_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {canApprove && isPendingApproval && (
                            <>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-200 hover:bg-green-50" disabled={actionBusy === gin.id} onClick={() => handleApprove(gin.id)}>
                                {actionBusy === gin.id ? '…' : '✓ Approve'}
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50" disabled={actionBusy === gin.id} onClick={() => setRejectTarget(gin.id)}>
                                ✕
                              </Button>
                            </>
                          )}
                          {canIssue && isApproved && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-teal-700 border-teal-200 hover:bg-teal-50 gap-1" disabled={actionBusy === gin.id} onClick={() => handleIssue(gin.id)}>
                              <SendHorizontal className="w-3 h-3" />{actionBusy === gin.id ? '…' : 'Issue'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="cursor-pointer" onClick={() => setSelected(gin)}>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Create GIN Dialog ─────────────────────────────────────────────── */}
      {canCreate && (
        <Dialog open={showCreate} onOpenChange={open => { if (!open) { setShowCreate(false); resetForm(); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackageOpen className="w-4 h-4 text-amber-600" />
                Create Goods Issue Note
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-1">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              {metaLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                  <LoadingSpinner size="sm" /> Loading farms, recipients and transport vouchers…
                </div>
              ) : (
                <>
                  {/* ── Header fields ── */}
                  <div className="grid grid-cols-2 gap-4">

                    {/* Farm */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                      <Select value={farmId} onValueChange={setFarmId}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select farm…" />
                        </SelectTrigger>
                        <SelectContent>
                          {farms.map((f: any, i: number) => (
                            <SelectItem key={f.id ?? f.farm_id ?? i} value={String(f.id ?? f.farm_id)}>
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Issued to */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issued To (Supervisor) *</label>
                      {supervisors.length === 0 ? (
                        <p className="text-xs text-gray-400 pt-2">No supervisors found.</p>
                      ) : (
                        <Select value={issuedTo} onValueChange={setIssuedTo}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select recipient…" />
                          </SelectTrigger>
                          <SelectContent>
                            {supervisors.map((u: any, i: number) => (
                              <SelectItem key={u.id ?? i} value={String(u.id)}>
                                {u.full_name ?? u.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Purpose */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Purpose <span className="text-gray-400 font-normal">(optional)</span></label>
                      <Input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. Spraying Block A, Planting Season 1" />
                    </div>

                    {/* TV Required toggle */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transport Voucher Required *</label>
                      <Select value={tvRequired} onValueChange={v => { setTvRequired(v as 'true' | 'false'); if (v === 'false') setTvId(''); }}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes — TV required</SelectItem>
                          <SelectItem value="false">No — TV waived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* TV picker — only when tv_required */}
                    {tvRequired === 'true' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link Transport Voucher <span className="text-gray-400 font-normal">(optional)</span></label>
                        {tvList.length === 0 ? (
                          <p className="text-xs text-gray-400 pt-2">No transport vouchers available.</p>
                        ) : (
                          <Select value={tvId} onValueChange={setTvId}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select TV…" />
                            </SelectTrigger>
                            <SelectContent>
                              {tvList.map((tv: any, i: number) => (
                                <SelectItem key={tv.id ?? i} value={String(tv.id)}>
                                  {tv.tv_number ?? tv.voucher_number ?? `TV #${tv.id}`}
                                  {tv.status ? ` — ${tv.status.replace(/_/g, ' ')}` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    {/* SIMR ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SIMR ID <span className="text-gray-400 font-normal">(optional)</span></label>
                      <Input type="number" min="1" value={simrId} onChange={e => setSimrId(e.target.value)} placeholder="Links to material request" />
                    </div>

                    {/* SMR ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMR ID <span className="text-gray-400 font-normal">(optional)</span></label>
                      <Input type="number" min="1" value={smrId} onChange={e => setSmrId(e.target.value)} placeholder="Links to purchase request" />
                    </div>
                  </div>

                  <Separator />

                  {/* ── Line items ── */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-700">Items to Issue *</p>
                      <button
                        type="button"
                        onClick={() => setItems(p => [...p, emptyItem()])}
                        className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add item
                      </button>
                    </div>

                    <div className="space-y-3">
                      {items.map((row, i) => (
                        <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50/40 space-y-2">
                          {/* Row 1: item name + unit + remove */}
                          <div className="flex gap-2 items-center">
                            <Input
                              value={row.item_name}
                              onChange={e => updateItem(i, { item_name: e.target.value })}
                              placeholder="Item name *"
                              className="flex-1 text-sm"
                            />
                            <Input
                              value={row.unit}
                              onChange={e => updateItem(i, { unit: e.target.value })}
                              placeholder="Unit *"
                              className="w-20 text-sm"
                            />
                            {items.length > 1 && (
                              <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {/* Row 2: qty + unit cost + accounting code */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-xs text-gray-500 mb-0.5 block">Qty Issued *</label>
                              <Input
                                type="number" min="0" step="0.01"
                                value={row.quantity_issued}
                                onChange={e => updateItem(i, { quantity_issued: e.target.value })}
                                placeholder="0"
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-0.5 block">Unit Cost <span className="text-gray-400">(optional)</span></label>
                              <Input
                                type="number" min="0" step="0.01"
                                value={row.unit_cost}
                                onChange={e => updateItem(i, { unit_cost: e.target.value })}
                                placeholder="from CARDEX"
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-0.5 block">Accounting Code <span className="text-gray-400">(optional)</span></label>
                              <Input
                                value={row.accounting_code}
                                onChange={e => updateItem(i, { accounting_code: e.target.value })}
                                placeholder="e.g. AG-001"
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={submitting || metaLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
                {submitting ? 'Creating…' : 'Create GIN'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Detail Sheet ──────────────────────────────────────────────────── */}
      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <PackageOpen className="w-4 h-4 text-amber-600" />
                  {selected.gin_number ?? `GIN #${selected.id}`}
                </SheetTitle>
                <SheetDescription><StatusBadge status={selected.status} /></SheetDescription>
              </SheetHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Farm</p>
                    <p className="font-medium">{selected.farm?.name ?? `Farm #${selected.farm_id}`}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Issued To</p>
                    <p className="font-medium">{selected.issued_to?.full_name ?? selected.issued_to_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Purpose</p>
                    <p className="text-gray-700">{selected.purpose ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Issued at</p>
                    <p className="text-gray-700">{selected.issued_at ? new Date(selected.issued_at).toLocaleString() : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Linked SIMR</p>
                    {selected.simr_id ? (
                      <DocLink label={selected.simr_number ?? `SIMR #${selected.simr_id}`} />
                    ) : <span className="text-gray-400 text-sm">—</span>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Linked SMR</p>
                    {selected.smr_id ? (
                      <DocLink label={selected.smr_number ?? `SMR #${selected.smr_id}`} />
                    ) : <span className="text-gray-400 text-sm">—</span>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Transport Voucher</p>
                    {selected.tv_id ? (
                      <DocLink label={selected.tv_number ?? `TV #${selected.tv_id}`} />
                    ) : (
                      <span className={`text-sm ${selected.tv_required ? 'text-amber-700 font-medium' : 'text-gray-400'}`}>
                        {selected.tv_required ? 'Required — not attached' : 'Waived'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Prepared By</p>
                    <p className="text-gray-700">{selected.prepared_by?.full_name ?? selected.prepared_by_name ?? '—'}</p>
                  </div>
                </div>

                {selected.tv_required && !selected.tv_id && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded p-3 text-amber-800 text-xs">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                    A Transport Voucher is required but has not been attached yet.
                  </div>
                )}

                {canAttachTV && !selected.tv_id && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowAttachTV(true)}>
                    <Link2 className="w-3.5 h-3.5" /> Attach TV
                  </Button>
                )}

                {selected.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-xs text-red-500 mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-700">{selected.rejection_reason}</p>
                  </div>
                )}

                {Array.isArray(selected.items) && selected.items.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Items</p>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-xs">Item</TableHead>
                            <TableHead className="text-xs">Qty Issued</TableHead>
                            <TableHead className="text-xs">Unit Cost</TableHead>
                            <TableHead className="text-xs">Code</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selected.items.map((item: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs font-medium">{item.item_name}</TableCell>
                              <TableCell className="text-xs font-semibold text-teal-700">
                                {item.quantity_issued ?? item.quantity_requested} {item.unit}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {item.unit_cost != null ? Number(item.unit_cost).toLocaleString() : '—'}
                              </TableCell>
                              <TableCell className="text-xs text-gray-400 font-mono">
                                {item.accounting_code ?? '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}

                {canApprove && ['pending', 'pending_approval'].includes(selected.status?.toLowerCase()) && (
                  <>
                    <Separator />
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={actionBusy === selected.id}
                        onClick={() => { handleApprove(selected.id); setSelected(null); }}>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve GIN
                      </Button>
                      <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => { setRejectTarget(selected.id); setSelected(null); }}>
                        <XCircle className="w-4 h-4 mr-1.5" /> Reject
                      </Button>
                    </div>
                  </>
                )}
                {canIssue && selected.status?.toLowerCase() === 'approved' && (
                  <>
                    <Separator />
                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" disabled={actionBusy === selected.id}
                      onClick={() => { handleIssue(selected.id); setSelected(null); }}>
                      <SendHorizontal className="w-4 h-4 mr-1.5" />
                      {actionBusy === selected.id ? 'Issuing…' : 'Issue GIN → Reduce CARDEX'}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Reject Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={rejectTarget !== null} onOpenChange={open => { if (!open) { setRejectTarget(null); setRejectReason(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-red-700">Reject GIN</DialogTitle></DialogHeader>
          <div className="py-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Explain why this GIN is being rejected…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="destructive" disabled={!rejectReason.trim() || !!actionBusy} onClick={handleReject}>
              {actionBusy ? 'Rejecting…' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Attach TV Dialog ──────────────────────────────────────────────── */}
      <Dialog open={showAttachTV} onOpenChange={open => { if (!open) { setShowAttachTV(false); setAttachTVId(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-4 h-4" /> Attach Transport Voucher
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-gray-600">Enter the ID of the Transport Voucher to link to this GIN.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TV ID *</label>
              <Input type="number" min="1" value={attachTVId} onChange={e => setAttachTVId(e.target.value)} placeholder="Transport Voucher ID" autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAttachTV(false); setAttachTVId(''); }} disabled={attachingTV}>Cancel</Button>
            <Button onClick={handleAttachTV} disabled={!attachTVId.trim() || attachingTV} className="bg-amber-600 hover:bg-amber-700 text-white">
              {attachingTV ? 'Attaching…' : 'Attach TV'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
