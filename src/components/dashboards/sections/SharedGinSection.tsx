"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { getApiError } from '../../../utils';
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  PackageOpen, RefreshCw, AlertCircle, SendHorizontal,
  ChevronRight, Link2, Plus, Trash2, ClipboardList, SquarePen,
} from 'lucide-react';
import { toast } from 'sonner';
import { DocLink } from '@/components/procurement/DocLink';

interface Props { userRole: string; }

const CAN_CREATE  = ['farm_clerk', 'admin', 'supervisor'];
const CAN_APPROVE = ['manager', 'admin'];
const CAN_ISSUE   = ['farm_clerk', 'admin'];
const CAN_ATTACH_TV = ['farm_clerk', 'admin'];

const GIN_STATUS_COLORS: Record<string, string> = {
  draft:                'bg-gray-100 text-gray-600 border-gray-200',
  pending_fm_approval:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved:             'bg-green-100 text-green-800 border-green-200',
  dispatched:           'bg-teal-100 text-teal-800 border-teal-200',
  rejected:             'bg-red-100 text-red-800 border-red-200',
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
  stock_balance?: number | null;
}

const emptyItem = (): GinItem => ({
  item_name: '', quantity_issued: '', unit: '', unit_cost: '', accounting_code: '', stock_balance: null,
});

// ─── Mode types ─────────────────────────────────────────────────────────────
type DialogMode = 'pick' | 'simr-select' | 'simr-form' | 'adhoc-form';

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

  // ── dialog mode state ─────────────────────────────────────────────────────
  const [dialogMode, setDialogMode]     = useState<DialogMode | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState('');

  // meta lists
  const [metaLoading, setMetaLoading]   = useState(false);
  const [farms, setFarms]               = useState<any[]>([]);
  const [supervisors, setSupervisors]   = useState<any[]>([]);
  const [tvList, setTvList]             = useState<any[]>([]);
  const [priceLists, setPriceLists]     = useState<any[]>([]);

  // SIMR-flow state
  const [readySIMRs, setReadySIMRs]     = useState<any[]>([]);
  const [simrsLoading, setSimrsLoading] = useState(false);
  const [selectedSIMR, setSelectedSIMR] = useState<any>(null);

  // form fields (shared between both flows)
  const [farmId, setFarmId]             = useState('');
  const [issuedTo, setIssuedTo]         = useState('');
  const [purpose, setPurpose]           = useState('');
  const [tvRequired, setTvRequired]     = useState<'true' | 'false'>('false');
  const [tvId, setTvId]                 = useState('');
  const [simrId, setSimrId]             = useState('');  // hidden in SIMR flow
  const [smrId, setSmrId]               = useState('');
  const [items, setItems]               = useState<GinItem[]>([emptyItem()]);

  // ── Load meta (farms, supervisors, TVs, price list) when form opens ───────
  useEffect(() => {
    if (dialogMode !== 'simr-form' && dialogMode !== 'adhoc-form') return;
    setMetaLoading(true);
    const normalize = (v: any) => Array.isArray(v) ? v : (v?.results ?? []);
    const farmIdNum = farmId ? parseInt(farmId) : undefined;
    Promise.allSettled([
      apiService.getFarms(userRole),
      apiService.getSupervisors(),
      apiService.getTransportVouchers(),
      apiService.getPriceLists(farmIdNum),
    ]).then(([farmsRes, usersRes, tvsRes, plRes]) => {
      setFarms(farmsRes.status === 'fulfilled' ? normalize(farmsRes.value) : []);
      const allUsers = usersRes.status === 'fulfilled' ? normalize(usersRes.value) : [];
      setSupervisors(allUsers.filter((u: any) => ['supervisor', 'sub_supervisor', 'farm_clerk', 'admin'].includes(u.role)));
      setTvList(tvsRes.status === 'fulfilled' ? normalize(tvsRes.value) : []);
      setPriceLists(plRes.status === 'fulfilled' ? normalize(plRes.value) : []);
    }).finally(() => setMetaLoading(false));
  }, [dialogMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reload price list when farm changes in ad-hoc mode ───────────────────
  useEffect(() => {
    if (dialogMode !== 'adhoc-form' || !farmId) return;
    apiService.getPriceLists(parseInt(farmId))
      .then(data => setPriceLists(Array.isArray(data) ? data : (data as any)?.results ?? []))
      .catch(() => {});
  }, [farmId, dialogMode]);

  // ── Load ready-for-GIN SIMRs when SIMR-select opens ──────────────────────
  useEffect(() => {
    if (dialogMode !== 'simr-select') return;
    setSimrsLoading(true);
    const READY_STATUSES = ['gin_created', 'approved'];
    apiService.getSimrsReadyForGin()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        if (list.length > 0) return list;
        // Fallback: fetch all SIMRs and filter locally for gin_created / approved
        return apiService.getManagerAllSimrs()
          .then((all: any) => (Array.isArray(all) ? all : [])
            .filter((s: any) => READY_STATUSES.includes(s.status?.toLowerCase()))
          );
      })
      .then(data => setReadySIMRs(Array.isArray(data) ? data : []))
      .catch(() => setReadySIMRs([]))
      .finally(() => setSimrsLoading(false));
  }, [dialogMode]);

  // ── Pre-fill form from selected SIMR ─────────────────────────────────────
  const openSimrForm = (simr: any) => {
    setSelectedSIMR(simr);
    setFarmId(String(simr.farm_id ?? ''));
    setIssuedTo(String(simr.requested_by ?? ''));
    setPurpose(simr.purpose ?? '');
    setSimrId(String(simr.id));
    setSmrId('');
    setTvRequired('false');
    setTvId('');
    const prefilled: GinItem[] = (simr.items ?? []).map((it: any) => ({
      item_name:       it.item_name ?? '',
      quantity_issued: String(it.quantity_requested ?? ''),
      unit:            it.unit ?? '',
      unit_cost:       '',   // will be filled once price lists load
      accounting_code: it.accounting_code ?? '',
      stock_balance:   null,
    }));
    setItems(prefilled.length > 0 ? prefilled : [emptyItem()]);
    setFormError('');
    setDialogMode('simr-form');
  };

  // ── Auto-fill unit_cost from price list once both SIMR items and price lists are ready
  useEffect(() => {
    if (dialogMode !== 'simr-form' || priceLists.length === 0) return;
    setItems(prev => prev.map(row => {
      if (row.unit_cost) return row; // already filled
      const match = priceLists.find((pl: any) =>
        (pl.name ?? '').toLowerCase() === row.item_name.toLowerCase()
      );
      return match ? { ...row, unit_cost: String(match.price ?? ''), accounting_code: row.accounting_code || (match.accounting_code ?? '') } : row;
    }));
  }, [priceLists, dialogMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stock balance check for a single item row (ad-hoc flow) ──────────────
  const checkStock = async (i: number) => {
    const row = items[i];
    if (!farmId || !row.item_name.trim()) {
      toast.warning('Select a farm and enter an item name first');
      return;
    }
    try {
      const res = await apiService.getCardexItem(parseInt(farmId), row.item_name.trim());
      const balance = res?.current_balance ?? res?.balance ?? null;
      updateItem(i, { stock_balance: balance });
      if (balance === null) toast.info('No CARDEX record found for this item');
    } catch {
      toast.error('Could not fetch stock balance');
    }
  };

  const updateItem = (i: number, patch: Partial<GinItem>) =>
    setItems(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const resetAll = () => {
    setDialogMode(null);
    setFarmId(''); setIssuedTo(''); setPurpose('');
    setTvRequired('false'); setTvId('');
    setSimrId(''); setSmrId('');
    setItems([emptyItem()]); setFormError('');
    setFarms([]); setSupervisors([]); setTvList([]); setPriceLists([]);
    setSelectedSIMR(null); setReadySIMRs([]);
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
          ...(r.unit_cost       ? { unit_cost:       parseFloat(r.unit_cost)      } : {}),
          ...(r.accounting_code ? { accounting_code: r.accounting_code.trim()     } : {}),
        })),
      };
      if (purpose.trim()) payload.purpose  = purpose.trim();
      if (tvId)           payload.tv_id    = parseInt(tvId);
      if (simrId)         payload.simr_id  = parseInt(simrId);
      if (smrId)          payload.smr_id   = parseInt(smrId);

      await apiService.createGin(payload);
      toast.success('GIN created — awaiting manager approval');
      resetAll();
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

  // ── helpers ───────────────────────────────────────────────────────────────
  const isFormOpen = dialogMode === 'simr-form' || dialogMode === 'adhoc-form';

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
                <>
                  <Button
                    size="sm"
                    onClick={() => setDialogMode('simr-select')}
                    className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <ClipboardList className="w-3.5 h-3.5" /> Issue from SIMR
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { resetAll(); setDialogMode('adhoc-form'); }}
                    className="gap-1.5"
                  >
                    <SquarePen className="w-3.5 h-3.5" /> Ad-hoc Issue
                  </Button>
                </>
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
                  const isPendingApproval = gin.status?.toLowerCase() === 'pending_fm_approval';
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
                        {gin.simr_number ?? (gin.simr_id ? `SIMR #${gin.simr_id}` : '—')}
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

      {/* ── Mode picker (pick dialog) ──────────────────────────────────────── */}
      {/* Not used — buttons directly open the right mode */}

      {/* ── SIMR Selection Dialog ─────────────────────────────────────────── */}
      {canCreate && (
        <Dialog open={dialogMode === 'simr-select'} onOpenChange={open => { if (!open) resetAll(); }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-600" />
                Select a SIMR to Issue Against
              </DialogTitle>
            </DialogHeader>

            {simrsLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-6">
                <LoadingSpinner size="sm" /> Loading approved material requests…
              </div>
            ) : readySIMRs.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No SIMRs ready for GIN issuance.</p>
                <p className="text-xs mt-1 text-gray-300">Shows SIMRs where stock is available or external purchase has been made. Check that the SIMR is FM-approved and not already completed.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">SIMR No.</TableHead>
                    <TableHead className="text-xs">Farm</TableHead>
                    <TableHead className="text-xs">Purpose</TableHead>
                    <TableHead className="text-xs">Priority</TableHead>
                    <TableHead className="text-xs">Items</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readySIMRs.map((simr: any) => (
                    <TableRow key={simr.id} className="hover:bg-amber-50/40 cursor-pointer" onClick={() => openSimrForm(simr)}>
                      <TableCell>
                        <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                          {simr.simr_number}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {simr.farm?.name ?? `Farm #${simr.farm_id}`}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[180px] truncate">
                        {simr.purpose ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={simr.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                          {simr.priority ?? 'normal'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {(simr.items ?? []).length} item{(simr.items ?? []).length !== 1 ? 's' : ''}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {simr.created_at ? new Date(simr.created_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1">
                          <Plus className="w-3 h-3" /> Issue
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={resetAll}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── GIN Form Dialog (SIMR-linked or Ad-hoc) ───────────────────────── */}
      {canCreate && (
        <Dialog open={isFormOpen} onOpenChange={open => { if (!open) resetAll(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackageOpen className="w-4 h-4 text-amber-600" />
                {dialogMode === 'simr-form'
                  ? `Issue GIN — ${selectedSIMR?.simr_number ?? 'from SIMR'}`
                  : 'Ad-hoc Goods Issue Note'}
              </DialogTitle>
              {dialogMode === 'simr-form' && selectedSIMR && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  Linked to SIMR {selectedSIMR.simr_number} — items pre-filled from request. Adjust quantities if needed.
                </p>
              )}
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
                      {dialogMode === 'simr-form' ? (
                        <p className="text-sm text-gray-800 pt-2 font-medium">
                          {selectedSIMR?.farm?.name ?? `Farm #${farmId}`}
                        </p>
                      ) : (
                        <Select value={farmId} onValueChange={v => { setFarmId(v); setItems(items.map(i => ({ ...i, stock_balance: null }))); }}>
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
                      )}
                    </div>

                    {/* Issued to */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issued To *</label>
                      {supervisors.length === 0 ? (
                        <p className="text-xs text-gray-400 pt-2">No recipients found.</p>
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

                    {/* Ad-hoc only: SMR ID */}
                    {dialogMode === 'adhoc-form' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SMR ID <span className="text-gray-400 font-normal">(optional)</span></label>
                        <Input type="number" min="1" value={smrId} onChange={e => setSmrId(e.target.value)} placeholder="Links to purchase request" />
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* ── Line items ── */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-700">
                        Items to Issue *
                        {dialogMode === 'simr-form' && (
                          <span className="ml-2 text-xs font-normal text-gray-400">(pre-filled from SIMR — adjust quantities if needed)</span>
                        )}
                        {dialogMode === 'adhoc-form' && (
                          <span className="ml-2 text-xs font-normal text-gray-400">(use "Check Stock" to verify available balance)</span>
                        )}
                      </p>
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
                          {/* Row 1: item name (from price list) + unit + remove */}
                          <div className="flex gap-2 items-center">
                            {priceLists.length > 0 && dialogMode !== 'simr-form' ? (
                              <Select
                                value={row.item_name}
                                onValueChange={val => {
                                  const pl = priceLists.find((p: any) => p.name === val);
                                  updateItem(i, {
                                    item_name:       val,
                                    unit:            pl?.unit ?? row.unit,
                                    unit_cost:       pl?.price != null ? String(pl.price) : row.unit_cost,
                                    accounting_code: pl?.accounting_code ?? row.accounting_code,
                                    stock_balance:   null,
                                  });
                                }}
                              >
                                <SelectTrigger className="flex-1 h-9 text-sm">
                                  <SelectValue placeholder="Select item from price list…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {priceLists.map((pl: any, pi: number) => (
                                    <SelectItem key={pi} value={pl.name}>
                                      {pl.name}
                                      {pl.unit ? ` (${pl.unit})` : ''}
                                      {pl.price != null ? ` — ${Number(pl.price).toLocaleString()}` : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={row.item_name}
                                onChange={e => updateItem(i, { item_name: e.target.value, stock_balance: null })}
                                onBlur={() => { if (row.item_name.trim() && farmId) checkStock(i); }}
                                placeholder="Item name *"
                                className="flex-1 text-sm"
                                readOnly={dialogMode === 'simr-form'}
                              />
                            )}
                            <Input
                              value={row.unit}
                              onChange={e => updateItem(i, { unit: e.target.value })}
                              placeholder="Unit *"
                              className="w-20 text-sm"
                            />
                            {dialogMode === 'adhoc-form' && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="text-xs h-8 shrink-0"
                                onClick={() => checkStock(i)}
                                title="Check CARDEX balance"
                              >
                                Check Stock
                              </Button>
                            )}
                            {items.length > 1 && (
                              <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 shrink-0">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {/* Stock balance hint */}
                          {row.stock_balance !== null && row.stock_balance !== undefined && (
                            <p className={`text-xs ${row.stock_balance <= 0 ? 'text-red-600' : 'text-green-700'}`}>
                              CARDEX balance: <strong>{row.stock_balance}</strong> {row.unit || 'units'}
                              {row.stock_balance <= 0 ? ' — out of stock' : ''}
                            </p>
                          )}
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
                              {row.stock_balance !== null && row.stock_balance !== undefined && row.quantity_issued &&
                                parseFloat(row.quantity_issued) > row.stock_balance && (
                                <p className="text-xs text-amber-600 mt-0.5">
                                  Exceeds available stock ({row.stock_balance} {row.unit || 'units'})
                                </p>
                              )}
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
              <Button variant="outline" onClick={resetAll} disabled={submitting}>
                {dialogMode === 'simr-form' ? 'Back to SIMR List' : 'Cancel'}
              </Button>
              <Button onClick={handleCreate} disabled={submitting || metaLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
                {submitting ? 'Creating…' : 'Create GIN'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Reject GIN Dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!rejectTarget} onOpenChange={open => { if (!open) { setRejectTarget(null); setRejectReason(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject GIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="block text-sm font-medium text-gray-700">Reason *</label>
            <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>Cancel</Button>
            <Button onClick={handleReject} disabled={!rejectReason.trim() || !!actionBusy} className="bg-red-600 hover:bg-red-700 text-white">
              {actionBusy ? 'Rejecting…' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Sheet ──────────────────────────────────────────────────── */}
      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
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
                    <p className="text-xs text-gray-400 mb-0.5">Stock Reduced</p>
                    <p className={`text-sm font-medium ${selected.stock_reduced ? 'text-green-700' : 'text-gray-500'}`}>
                      {selected.stock_reduced ? `Yes — ${selected.stock_reduced_at ? new Date(selected.stock_reduced_at).toLocaleDateString() : ''}` : 'No'}
                    </p>
                  </div>
                </div>

                {/* Attach TV button */}
                {canAttachTV && selected.tv_required && !selected.tv_id && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">Attach Transport Voucher</p>
                      {showAttachTV ? (
                        <div className="flex gap-2">
                          <Input
                            type="number" min="1"
                            value={attachTVId}
                            onChange={e => setAttachTVId(e.target.value)}
                            placeholder="TV ID…"
                            className="h-8 text-sm flex-1"
                          />
                          <Button size="sm" onClick={handleAttachTV} disabled={attachingTV || !attachTVId.trim()} className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white">
                            {attachingTV ? '…' : 'Attach'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setShowAttachTV(false); setAttachTVId(''); }} className="h-8 text-xs">
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setShowAttachTV(true)} className="h-8 text-xs gap-1">
                          <Link2 className="w-3 h-3" /> Attach TV
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {/* Items */}
                {selected.items?.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">Items ({selected.items.length})</p>
                      <div className="space-y-2">
                        {selected.items.map((item: any, i: number) => (
                          <div key={i} className="flex items-start justify-between py-1.5 border-b border-gray-50 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{item.item_name}</p>
                              <p className="text-xs text-gray-400">{item.unit}{item.accounting_code ? ` · ${item.accounting_code}` : ''}</p>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <p className="text-sm font-semibold text-gray-800">×{item.quantity_issued}</p>
                              {item.unit_cost && <p className="text-xs text-gray-400">{Number(item.unit_cost).toLocaleString()} / unit</p>}
                              {item.total_cost && <p className="text-xs text-gray-500">= {Number(item.total_cost).toLocaleString()}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
