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
import { Progress } from '@/components/ui/progress';
import { ClipboardList, RefreshCw, Plus, AlertCircle, Download, Trash2, ChevronRight, Building2, CheckCircle2, XCircle, Send, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { DocLink } from '@/components/procurement/DocLink';
import { ChainStepper } from '@/components/procurement/ChainStepper';

interface Props { userRole: string; }

// Manager + Admin can create LPOs (not PO)
const CAN_CREATE  = ['manager', 'admin'];
// PO + Admin can do PO-level review
const CAN_PO_ACT  = ['procurement_officer', 'admin'];
// FC + Admin do final approval
const CAN_FC_ACT  = ['financial_controller', 'admin'];
// PO + Admin can send to supplier
const CAN_SEND    = ['procurement_officer', 'admin'];

// ── Status display mapping ────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  draft:            'Pending PO Review',
  po_reviewed:      'Pending FC Approval',
  approved:         'Approved',
  sent_to_supplier: 'Sent to Supplier',
  sent:             'Sent to Supplier',
  cancelled:        'Cancelled',
  rejected:         'Rejected',
  partially_fulfilled: 'Partially Fulfilled',
  completed:        'Completed',
};

const STATUS_COLOR: Record<string, string> = {
  draft:               'bg-yellow-100 text-yellow-800 border-yellow-200',
  po_reviewed:         'bg-orange-100 text-orange-700 border-orange-200',
  approved:            'bg-green-100 text-green-800 border-green-200',
  sent_to_supplier:    'bg-blue-100 text-blue-700 border-blue-200',
  sent:                'bg-blue-100 text-blue-700 border-blue-200',
  cancelled:           'bg-red-100 text-red-700 border-red-200',
  rejected:            'bg-red-100 text-red-700 border-red-200',
  partially_fulfilled: 'bg-amber-100 text-amber-800 border-amber-200',
  completed:           'bg-emerald-100 text-emerald-800 border-emerald-200',
};

function StatusBadge({ status }: { status: string }) {
  const key = status?.toLowerCase();
  const cls = STATUS_COLOR[key] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  const label = STATUS_LABEL[key] ?? status?.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

// ── Timeline stepper ──────────────────────────────────────────────────────────

const STEPS = ['draft', 'po_reviewed', 'sent_to_supplier'] as const;
const STEP_LABELS: Record<string, string> = {
  draft:            'Pending PO Review',
  po_reviewed:      'PO Reviewed',
  sent_to_supplier: 'FC Approved & Sent',
};

function LpoTimeline({ status }: { status: string }) {
  const currentIdx = STEPS.indexOf(status as any);
  return (
    <div className="flex items-center gap-0 mb-4">
      {STEPS.map((step, i) => {
        const done    = currentIdx > i;
        const current = currentIdx === i;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center min-w-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                done    ? 'bg-green-500 text-white' :
                current ? 'bg-blue-500 text-white ring-2 ring-blue-200' :
                          'bg-gray-200 text-gray-400'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <p className={`text-xs mt-1 text-center leading-tight max-w-[70px] ${
                current ? 'text-blue-700 font-semibold' : done ? 'text-green-700' : 'text-gray-400'
              }`}>
                {STEP_LABELS[step]}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Form types ────────────────────────────────────────────────────────────────

interface LpoItem { item_name: string; quantity: string; unit: string; unit_price: string; accounting_code: string; }
const emptyItem = (): LpoItem => ({ item_name: '', quantity: '', unit: 'kg', unit_price: '', accounting_code: '' });

// ── Main component ────────────────────────────────────────────────────────────

export const SharedLpoSection: React.FC<Props> = ({ userRole }) => {
  const canCreate = CAN_CREATE.includes(userRole);
  const canPoAct  = CAN_PO_ACT.includes(userRole);
  const canFcAct  = CAN_FC_ACT.includes(userRole);
  const canSend   = CAN_SEND.includes(userRole);

  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected]         = useState<any>(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState('');

  // Detail + chain
  const [detailData, setDetailData]       = useState<any>(null);
  const [chain, setChain]                 = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingChain, setLoadingChain]   = useState(false);
  const [noChainReason, setNoChainReason] = useState('');
  const [resolvedSmrNumber, setResolvedSmrNumber] = useState<string | null>(null);

  // Actions
  const [actioning, setActioning]             = useState<'approve' | 'reject' | 'po-approve' | 'po-reject' | 'send' | null>(null);
  const [showFcRejectDialog, setShowFcRejectDialog]   = useState(false);
  const [showPoRejectDialog, setShowPoRejectDialog]   = useState(false);
  const [fcRejectNotes, setFcRejectNotes]     = useState('');
  const [poRejectNotes, setPoRejectNotes]     = useState('');
  const [poApproveNotes, setPoApproveNotes]   = useState('');
  const [showPoApproveDialog, setShowPoApproveDialog] = useState(false);
  const [actionError, setActionError]         = useState('');

  // Lookup lists
  const [suppliers, setSuppliers]     = useState<any[]>([]);
  const [farms, setFarms]             = useState<any[]>([]);
  const [approvedSmrs, setApprovedSmrs] = useState<any[]>([]);

  // Form state
  const [smrId, setSmrId]                   = useState('');
  const [supplierId, setSupplierId]         = useState('');
  const [farmId, setFarmId]                 = useState('');
  const [farmName, setFarmName]             = useState('');
  const [currency, setCurrency]             = useState('TZS');
  const [deliveryDate, setDeliveryDate]     = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentTerms, setPaymentTerms]     = useState('');
  const [items, setItems]                   = useState<LpoItem[]>([emptyItem()]);

  useEffect(() => {
    apiService.getSuppliers()
      .then(d => setSuppliers(Array.isArray(d) ? d : (d as any)?.results ?? []))
      .catch(() => {});
    apiService.getManagerFarms()
      .then(d => setFarms(Array.isArray(d) ? d : (d as any)?.results ?? []))
      .catch(() => {});
    apiService.getProcurementSmrs({ status: 'approved' })
      .then(d => setApprovedSmrs(Array.isArray(d) ? d : (d as any)?.results ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = parseInt(smrId);
    if (!smrId || isNaN(id)) { setFarmId(''); setFarmName(''); setItems([emptyItem()]); return; }
    apiService.getProcurementSmrDetail(id).then((smr: any) => {
      if (smr?.farm_id) setFarmId(String(smr.farm_id));
      if (smr?.farm?.name) setFarmName(smr.farm.name);
      if (Array.isArray(smr?.items) && smr.items.length > 0) {
        setItems(smr.items.map((it: any) => ({
          item_name: it.item_name ?? '',
          quantity: String(it.quantity_requested ?? it.quantity ?? ''),
          unit: it.unit ?? 'kg',
          unit_price: '',
          accounting_code: '',
        })));
      }
    }).catch(() => { setFarmId(''); setFarmName(''); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smrId]);

  const fetchLpos = useCallback(
    () => apiService.getLpos(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : undefined),
    [statusFilter]
  );
  const { data: lpos, loading, error, refetch } = useApi(fetchLpos);
  const list = Array.isArray(lpos) ? lpos : [];

  const openDetail = async (lpo: any) => {
    setSelected(lpo);
    setDetailData(null); setChain(null); setNoChainReason(''); setResolvedSmrNumber(null);
    setActionError('');

    setLoadingDetail(true);
    let detail: any = null;
    try {
      detail = await apiService.getLpoDetail(lpo.id);
      setDetailData(detail);
    } catch { /* fallback to list-level data */ }
    finally { setLoadingDetail(false); }

    const smrNumber =
      detail?.smr_number ?? detail?.smr?.smr_number ??
      lpo.smr_number ?? lpo.smr?.smr_number ?? lpo.smr?.pr_number;

    if (!smrNumber) {
      setNoChainReason('No linked SMR — chain will appear once an SMR is linked.');
      return;
    }

    setLoadingChain(true);
    try {
      const chainData = await apiService.getExternalChain(smrNumber);
      setChain(chainData);
      const chainSmrNumber = chainData?.smr?.number;
      if (chainSmrNumber) setResolvedSmrNumber(chainSmrNumber);
    } catch {
      setNoChainReason('Could not load chain data.');
    } finally { setLoadingChain(false); }
  };

  const updateItem = (i: number, patch: Partial<LpoItem>) =>
    setItems(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const totalAmount = items.reduce((s, r) => s + (parseFloat(r.quantity) || 0) * (parseFloat(r.unit_price) || 0), 0);

  const resetForm = () => {
    setSmrId(''); setSupplierId(''); setFarmId(''); setFarmName('');
    setCurrency('TZS'); setDeliveryAddress(''); setDeliveryDate(''); setPaymentTerms('');
    setItems([emptyItem()]); setFormError('');
  };

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handlePoApprove = async () => {
    if (!selected) return;
    setActioning('po-approve'); setActionError('');
    try {
      await apiService.poApproveLpo(selected.id, poApproveNotes.trim() || undefined);
      toast.success('LPO reviewed — forwarded to FC');
      setShowPoApproveDialog(false); setPoApproveNotes('');
      setSelected((prev: any) => prev ? { ...prev, status: 'po_reviewed' } : prev);
      refetch();
    } catch (err: any) {
      setActionError(getApiError(err, 'Failed to approve LPO'));
    } finally { setActioning(null); }
  };

  const handlePoReject = async () => {
    if (!selected || !poRejectNotes.trim()) return;
    setActioning('po-reject'); setActionError('');
    try {
      await apiService.poRejectLpo(selected.id, poRejectNotes.trim());
      toast.success('LPO sent back to Manager');
      setShowPoRejectDialog(false); setPoRejectNotes('');
      setSelected(null); refetch();
    } catch (err: any) {
      setActionError(getApiError(err, 'Failed to reject LPO'));
    } finally { setActioning(null); }
  };

  const handleFcApprove = async () => {
    if (!selected) return;
    setActioning('approve'); setActionError('');
    try {
      await apiService.approveLpo(selected.id);
      toast.success('LPO approved — sent to supplier automatically');
      setSelected(null); refetch();
    } catch (err: any) {
      setActionError(getApiError(err, 'Failed to approve LPO'));
    } finally { setActioning(null); }
  };

  const handleFcReject = async () => {
    if (!selected || !fcRejectNotes.trim()) return;
    setActioning('reject'); setActionError('');
    try {
      await apiService.rejectLpo(selected.id, fcRejectNotes.trim());
      toast.success('LPO rejected');
      setShowFcRejectDialog(false); setFcRejectNotes(''); setSelected(null); refetch();
    } catch (err: any) {
      setActionError(getApiError(err, 'Failed to reject LPO'));
    } finally { setActioning(null); }
  };

  const handleSend = async () => {
    if (!selected) return;
    setActioning('send'); setActionError('');
    try {
      await apiService.sendLpoToSupplier(selected.id);
      toast.success('LPO sent to supplier');
      setSelected((prev: any) => prev ? { ...prev, status: 'sent_to_supplier' } : prev);
      refetch();
    } catch (err: any) {
      setActionError(getApiError(err, 'Failed to send LPO'));
    } finally { setActioning(null); }
  };

  const handleCreate = async () => {
    setFormError('');
    if (!smrId) { setFormError('SMR is required.'); return; }
    if (!supplierId) { setFormError('Supplier is required.'); return; }
    if (!farmId) { setFormError('Farm could not be resolved from the SMR.'); return; }
    const valid = items.filter(r => r.item_name.trim() && parseFloat(r.quantity) > 0);
    if (valid.length === 0) { setFormError('Add at least one item with a quantity.'); return; }
    setSubmitting(true);
    try {
      await apiService.createLpo({
        smr_id:      parseInt(smrId),
        supplier_id: parseInt(supplierId),
        farm_id:     parseInt(farmId),
        delivery_address: deliveryAddress.trim() || undefined,
        delivery_date:    deliveryDate || undefined,
        payment_terms:    paymentTerms.trim() || undefined,
        currency,
        items: valid.map(r => ({
          item_name:        r.item_name.trim(),
          quantity_ordered: parseFloat(r.quantity),
          unit:             r.unit,
          unit_price:       parseFloat(r.unit_price) || 0,
          ...(r.accounting_code.trim() ? { accounting_code: r.accounting_code.trim() } : {}),
        })),
      });
      toast.success('LPO created — awaiting PO review');
      setShowCreate(false); resetForm(); refetch();
    } catch (err: any) {
      setFormError(getApiError(err, 'Failed to create LPO'));
    } finally { setSubmitting(false); }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const currentStatus = selected?.status?.toLowerCase();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-600" />
              Local Purchase Orders (LPO)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Pending PO Review</SelectItem>
                  <SelectItem value="po_reviewed">Pending FC Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="sent_to_supplier">Sent to Supplier</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              {canCreate && (
                <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="w-3.5 h-3.5" /> New LPO
                </Button>
              )}
            </div>
          </div>

          {/* Role-specific queue labels */}
          {canPoAct && (
            <p className="text-xs text-orange-600 mt-1">
              Your queue: LPOs at <strong>Pending PO Review</strong> status await your approval before going to the FC.
            </p>
          )}
          {canFcAct && (
            <p className="text-xs text-blue-600 mt-1">
              Your queue: LPOs at <strong>Pending FC Approval</strong> status await your final approval.
            </p>
          )}
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
              <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No purchase orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">LPO No.</TableHead>
                  <TableHead className="text-xs">Supplier</TableHead>
                  <TableHead className="text-xs">Farm</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((lpo: any) => (
                  <TableRow key={lpo.id} className="cursor-pointer hover:bg-amber-50/40" onClick={() => openDetail(lpo)}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                          {lpo.lpo_number ?? lpo.po_number ?? `LPO #${lpo.id}`}
                        </span>
                        {(lpo.smr?.smr_number ?? lpo.smr?.pr_number ?? lpo.smr_number ?? lpo.smr_id) && (
                          <span className="font-mono text-xs bg-blue-50 border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded">
                            SMR: {lpo.smr?.smr_number ?? lpo.smr?.pr_number ?? lpo.smr_number ?? `#${lpo.smr_id}`}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {lpo.supplier?.name ?? lpo.supplier_name ?? suppliers.find(s => s.id === lpo.supplier_id)?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {lpo.farm?.name ?? farms.find(f => f.id === lpo.farm_id)?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-800">
                      {lpo.total_amount != null ? `${Number(lpo.total_amount).toLocaleString()} ${lpo.currency ?? 'TZS'}` : '—'}
                    </TableCell>
                    <TableCell><StatusBadge status={lpo.status} /></TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {lpo.created_at ? new Date(lpo.created_at).toLocaleDateString() : '—'}
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
      <Sheet open={!!selected} onOpenChange={open => {
        if (!open) { setSelected(null); setDetailData(null); setChain(null); setNoChainReason(''); setResolvedSmrNumber(null); setActionError(''); }
      }}>
        <SheetContent className="w-[540px] sm:max-w-[540px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-3">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="w-4 h-4 text-amber-600" />
                  {selected.lpo_number ?? selected.po_number ?? `LPO #${selected.id}`}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selected.status} />
                </SheetDescription>
              </SheetHeader>

              {/* Timeline */}
              {!['cancelled', 'rejected'].includes(currentStatus) && (
                <LpoTimeline status={currentStatus} />
              )}

              {actionError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {actionError}
                </div>
              )}

              {/* PO Officer — review draft LPOs */}
              {canPoAct && currentStatus === 'draft' && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Your Action Required</p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
                      disabled={actioning !== null}
                      onClick={() => { setActionError(''); setShowPoApproveDialog(true); }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Forward to FC
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                      disabled={actioning !== null}
                      onClick={() => { setActionError(''); setShowPoRejectDialog(true); }}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Send Back to Manager
                    </Button>
                  </div>
                </div>
              )}

              {/* Financial Controller — approve po_reviewed LPOs */}
              {canFcAct && currentStatus === 'po_reviewed' && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Your Action Required</p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                      disabled={actioning !== null}
                      onClick={handleFcApprove}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {actioning === 'approve' ? 'Approving…' : 'Approve & Send to Supplier'}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                      disabled={actioning !== null}
                      onClick={() => { setActionError(''); setShowFcRejectDialog(true); }}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4 text-sm">
                {loadingDetail && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                    <LoadingSpinner size="sm" /> Loading details…
                  </div>
                )}

                {/* Rejection banners */}
                {currentStatus === 'rejected' && (detailData ?? selected).fc_approval_notes && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
                    <p className="font-semibold mb-0.5">FC rejection reason</p>
                    <p>{(detailData ?? selected).fc_approval_notes}</p>
                  </div>
                )}

                {/* PO approval section */}
                {(detailData ?? selected).po_approved_by && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-3 text-xs space-y-1">
                    <p className="font-semibold text-orange-800">PO Review</p>
                    <div className="grid grid-cols-2 gap-2 text-gray-700">
                      <div>
                        <span className="text-gray-400">Reviewed by</span>
                        <p className="font-medium">{(detailData ?? selected).po_approver_name ?? `User #${(detailData ?? selected).po_approved_by}`}</p>
                      </div>
                      {(detailData ?? selected).po_approved_at && (
                        <div>
                          <span className="text-gray-400">Date</span>
                          <p className="font-medium">{new Date((detailData ?? selected).po_approved_at).toLocaleDateString()}</p>
                        </div>
                      )}
                      {(detailData ?? selected).po_approval_notes && (
                        <div className="col-span-2">
                          <span className="text-gray-400">Notes</span>
                          <p>{(detailData ?? selected).po_approval_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Supplier</p>
                    <p className="font-medium text-gray-800">
                      {(detailData ?? selected).supplier_name
                        ?? (detailData ?? selected).supplier?.name
                        ?? suppliers.find((s: any) => s.id === selected.supplier_id)?.name
                        ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Farm</p>
                    <p className="font-medium text-gray-800">
                      {(detailData ?? selected).farm?.name ?? farms.find((f: any) => f.id === selected.farm_id)?.name ?? '—'}
                    </p>
                  </div>
                  {((detailData ?? selected).smr_number || (detailData ?? selected).smr_id || resolvedSmrNumber) && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Linked SMR</p>
                      <p className="font-mono text-sm text-blue-700">
                        {resolvedSmrNumber
                          ?? (detailData ?? selected).smr_number
                          ?? (detailData ?? selected).smr?.smr_number
                          ?? `SMR #${(detailData ?? selected).smr_id}`}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Payment Terms</p>
                    <p className="text-gray-700">{(detailData ?? selected).payment_terms ?? '—'}</p>
                  </div>
                  {(detailData ?? selected).delivery_date && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Delivery Date</p>
                      <p className="text-gray-700">{new Date((detailData ?? selected).delivery_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {(detailData ?? selected).delivery_address && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-0.5">Delivery Address</p>
                      <p className="text-gray-700">{(detailData ?? selected).delivery_address}</p>
                    </div>
                  )}
                </div>

                {/* Amount breakdown */}
                {(() => {
                  const d = detailData ?? selected;
                  const cur = d.currency ?? 'TZS';
                  const fmt = (n: any) => n != null ? Number(n).toLocaleString() : null;
                  return (
                    <div className="bg-gray-50 rounded p-3 space-y-1 text-xs">
                      {fmt(d.subtotal) && (
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal</span><span>{fmt(d.subtotal)} {cur}</span>
                        </div>
                      )}
                      {fmt(d.tax_amount) && (
                        <div className="flex justify-between text-gray-500">
                          <span>Tax (18%)</span><span>{fmt(d.tax_amount)} {cur}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-gray-800 pt-1 border-t border-gray-200">
                        <span>Total</span>
                        <span>{fmt(d.total_amount) ?? '—'} {cur}</span>
                      </div>
                    </div>
                  );
                })()}

                <Separator />

                {/* Items */}
                {Array.isArray((detailData ?? selected).items) && (detailData ?? selected).items.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Items Ordered</p>
                    <div className="space-y-1.5">
                      {(detailData ?? selected).items.map((item: any, i: number) => {
                        const ordered   = parseFloat(item.quantity_ordered) || 0;
                        const received  = parseFloat(item.quantity_received) || 0;
                        const pct       = ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0;
                        return (
                          <div key={i} className="bg-gray-50 rounded px-3 py-2 space-y-1">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-gray-800 font-medium">{item.item_name}</span>
                                {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                              </div>
                              <span className="text-gray-500 text-xs ml-3 flex-shrink-0">
                                {item.quantity_ordered} {item.unit}
                              </span>
                            </div>
                            {item.quantity_received != null && (
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-xs text-gray-400">
                                  <span>Received: {received} / {ordered} {item.unit}</span>
                                  <span>{pct}%</span>
                                </div>
                                <Progress value={pct} className="h-1.5" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Document Chain */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <ArrowDown className="w-3.5 h-3.5" /> Document Chain
                  </p>
                  {loadingChain ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                      <LoadingSpinner size="sm" /> Loading chain…
                    </div>
                  ) : chain ? (
                    <ChainStepper chainType="external" chain={chain} />
                  ) : (
                    <p className="text-xs text-gray-400 py-2">{noChainReason || 'No chain data available.'}</p>
                  )}
                </div>

                {/* PDF download */}
                {(detailData ?? selected).po_document_url && (
                  <>
                    <Separator />
                    <Button variant="outline" size="sm" className="gap-1.5"
                      onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL ?? ''}${(detailData ?? selected).po_document_url}`, '_blank')}>
                      <Download className="w-3.5 h-3.5" /> Download LPO PDF
                    </Button>
                  </>
                )}

                {/* Send to Supplier (PO Officer, approved status only) */}
                {canSend && currentStatus === 'approved' && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      {(detailData ?? selected).supplier?.email ? (
                        <p className="text-xs text-gray-500">
                          Will email to: <span className="font-mono text-gray-700">{(detailData ?? selected).supplier.email}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600">
                          Supplier has no email on file — PDF will be generated but not emailed.
                        </p>
                      )}
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-1.5" disabled={actioning !== null} onClick={handleSend}>
                        <Send className="w-3.5 h-3.5" />
                        {actioning === 'send' ? 'Sending…' : 'Send LPO to Supplier'}
                      </Button>
                    </div>
                  </>
                )}
                {canSend && (currentStatus === 'sent_to_supplier' || currentStatus === 'sent') && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700 font-medium flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" /> Sent to supplier
                      </span>
                      {(detailData ?? selected).lpo_document_url && (
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL ?? ''}${(detailData ?? selected).lpo_document_url}`}
                          target="_blank" rel="noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Download PDF
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* PO Approve dialog */}
      <Dialog open={showPoApproveDialog} onOpenChange={open => { if (!open) { setShowPoApproveDialog(false); setPoApproveNotes(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700">
              <CheckCircle2 className="w-4 h-4" /> Approve & Forward to FC
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-gray-600">
              Approving this LPO will mark it as <strong>PO Reviewed</strong> and send it to the Financial Controller for final approval.
            </p>
            <Input
              value={poApproveNotes}
              onChange={e => setPoApproveNotes(e.target.value)}
              placeholder="Optional notes for FC…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPoApproveDialog(false); setPoApproveNotes(''); }}>Cancel</Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={actioning !== null}
              onClick={handlePoApprove}
            >
              {actioning === 'po-approve' ? 'Forwarding…' : 'Confirm & Forward'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PO Reject dialog */}
      <Dialog open={showPoRejectDialog} onOpenChange={open => { if (!open) { setShowPoRejectDialog(false); setPoRejectNotes(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-4 h-4" /> Send Back to Manager
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-gray-600">Please provide a reason. The Manager who created this LPO will be notified.</p>
            <Input
              value={poRejectNotes}
              onChange={e => setPoRejectNotes(e.target.value)}
              placeholder="Reason for sending back…"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPoRejectDialog(false); setPoRejectNotes(''); }}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!poRejectNotes.trim() || actioning !== null}
              onClick={handlePoReject}
            >
              {actioning === 'po-reject' ? 'Sending back…' : 'Send Back'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FC Reject dialog */}
      <Dialog open={showFcRejectDialog} onOpenChange={open => { if (!open) { setShowFcRejectDialog(false); setFcRejectNotes(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-4 h-4" /> Reject LPO
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-gray-600">Please provide a reason for rejection. This will be recorded against the LPO.</p>
            <Input
              value={fcRejectNotes}
              onChange={e => setFcRejectNotes(e.target.value)}
              placeholder="Reason for rejection…"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowFcRejectDialog(false); setFcRejectNotes(''); }}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!fcRejectNotes.trim() || actioning !== null}
              onClick={handleFcReject}
            >
              {actioning === 'reject' ? 'Rejecting…' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create LPO Dialog (Manager + Admin only) */}
      {canCreate && (
        <Dialog open={showCreate} onOpenChange={open => { if (!open) { setShowCreate(false); resetForm(); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-600" />
                Create Local Purchase Order
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMR *</label>
                  <Select value={smrId} onValueChange={setSmrId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select approved SMR…" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedSmrs.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.smr_number ?? `SMR #${s.id}`}{s.farm?.name ? ` — ${s.farm.name}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm (auto)</label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-500">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    {farmName || (farmId ? `Farm #${farmId}` : '—')}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier…" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TZS">TZS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="e.g. 30 days, COD" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                  <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                  <Input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Farm A, Block 3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Line Items *</label>
                  <button type="button" onClick={() => setItems(p => [...p, emptyItem()])} className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1 mb-1">
                  <div className="col-span-4">Item</div>
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-1">Unit</div>
                  <div className="col-span-2">Unit price</div>
                  <div className="col-span-2">Acct code</div>
                  <div className="col-span-1" />
                </div>
                {items.map((row, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center mb-2">
                    <div className="col-span-4"><Input value={row.item_name} onChange={e => updateItem(i, { item_name: e.target.value })} placeholder="Item" className="text-sm" /></div>
                    <div className="col-span-2"><Input type="number" min="0.01" step="0.01" value={row.quantity} onChange={e => updateItem(i, { quantity: e.target.value })} placeholder="Qty" className="text-sm" /></div>
                    <div className="col-span-1"><Input value={row.unit} onChange={e => updateItem(i, { unit: e.target.value })} placeholder="kg" className="text-sm" /></div>
                    <div className="col-span-2"><Input type="number" min="0" step="0.01" value={row.unit_price} onChange={e => updateItem(i, { unit_price: e.target.value })} placeholder="0.00" className="text-sm" /></div>
                    <div className="col-span-2"><Input value={row.accounting_code} onChange={e => updateItem(i, { accounting_code: e.target.value })} placeholder="GL code" className="text-sm" /></div>
                    <div className="col-span-1 flex justify-center">
                      {items.length > 1 && <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}><Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" /></button>}
                    </div>
                  </div>
                ))}
                {totalAmount > 0 && (
                  <div className="flex justify-end mt-2">
                    <span className="text-sm font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded">
                      Total: {totalAmount.toLocaleString()} {currency}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400 bg-gray-50 rounded p-2">
                After creation, this LPO will be sent to the Procurement Officer for review before going to the Financial Controller.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }} disabled={submitting}>Cancel</Button>
              <Button onClick={handleCreate} disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white">
                {submitting ? 'Creating…' : 'Create LPO'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
