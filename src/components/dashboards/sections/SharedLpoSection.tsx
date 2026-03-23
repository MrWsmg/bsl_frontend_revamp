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
import { ClipboardList, RefreshCw, Plus, AlertCircle, Download, Trash2, ChevronRight, Building2, CheckCircle2, XCircle, Send, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { DocLink } from '@/components/procurement/DocLink';
import { ChainStepper } from '@/components/procurement/ChainStepper';
import { Progress } from '@/components/ui/progress';

interface Props { userRole: string; }

const CAN_CREATE = ['procurement_officer', 'manager', 'admin'];
const CAN_FC_ACT = ['financial_controller', 'admin'];
const CAN_SEND   = ['procurement_officer', 'admin'];

const LPO_STATUS_COLORS: Record<string, string> = {
  draft:                'bg-yellow-100 text-yellow-800 border-yellow-200',
  rejected:             'bg-red-100 text-red-800 border-red-200',
  approved:             'bg-green-100 text-green-800 border-green-200',
  sent_to_supplier:     'bg-blue-100 text-blue-700 border-blue-200',
  partially_fulfilled:  'bg-amber-100 text-amber-800 border-amber-200',
  completed:            'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled:            'bg-gray-100 text-gray-500 border-gray-200',
};

function StatusBadge({ status }: { status: string }) {
  const cls = LPO_STATUS_COLORS[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

interface LpoItem { item_name: string; quantity: string; unit: string; unit_price: string; accounting_code: string; }
const emptyItem = (): LpoItem => ({ item_name: '', quantity: '', unit: 'kg', unit_price: '', accounting_code: '' });

export const SharedLpoSection: React.FC<Props> = ({ userRole }) => {
  const canCreate = CAN_CREATE.includes(userRole);
  const canFcAct  = CAN_FC_ACT.includes(userRole);
  const canSend   = CAN_SEND.includes(userRole);

  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected]         = useState<any>(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState('');

  // Detail + chain — loaded independently so a chain failure doesn't hide meta fields
  const [detailData, setDetailData]       = useState<any>(null);
  const [chain, setChain]                 = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingChain, setLoadingChain]   = useState(false);
  const [noChainReason, setNoChainReason] = useState('');
  const [resolvedSmrNumber, setResolvedSmrNumber] = useState<string | null>(null);

  const openDetail = async (lpo: any) => {
    setSelected(lpo);
    setDetailData(null); setChain(null); setNoChainReason(''); setResolvedSmrNumber(null);

    // 1. Load detail (non-blocking — sheet opens immediately with list-level data)
    setLoadingDetail(true);
    let detail: any = null;
    try {
      detail = await apiService.getLpoDetail(lpo.id);
      setDetailData(detail);
    } catch { /* detail failed, show list-level data */ }
    finally { setLoadingDetail(false); }

    // 2. Resolve SMR number — top-level enriched field first, then nested, then list-level
    const smrNumber =
      detail?.smr_number ??
      detail?.smr?.smr_number ??
      lpo.smr_number ??
      lpo.smr?.smr_number ??
      lpo.smr?.pr_number;

    if (!smrNumber) {
      setNoChainReason('No linked SMR — chain will appear once an SMR is linked.');
      return;
    }

    // 3. Load chain
    setLoadingChain(true);
    try {
      const chainData = await apiService.getExternalChain(smrNumber);
      setChain(chainData);
      // Resolve the formatted SMR number (e.g. SMR-202603-0005) from chain if not in detail
      const chainSmrNumber = chainData?.smr?.number;
      if (chainSmrNumber) setResolvedSmrNumber(chainSmrNumber);
    } catch {
      setNoChainReason('Could not load chain data.');
    } finally { setLoadingChain(false); }
  };

  // FC approve / reject
  const [actioning, setActioning]       = useState<'approve' | 'reject' | 'send' | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes]   = useState('');
  const [actionError, setActionError]   = useState('');

  // lookup lists
  const [suppliers, setSuppliers]   = useState<any[]>([]);
  const [farms, setFarms]           = useState<any[]>([]);
  const [approvedSmrs, setApprovedSmrs] = useState<any[]>([]);

  // form state
  const [smrId, setSmrId]                   = useState('');
  const [supplierId, setSupplierId]         = useState('');
  const [farmId, setFarmId]                 = useState('');
  const [farmName, setFarmName]             = useState('');
  const [currency, setCurrency]             = useState('TZS');
  const [deliveryDate, setDeliveryDate]     = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentTerms, setPaymentTerms]     = useState('');
  const [items, setItems]                   = useState<LpoItem[]>([emptyItem()]);

  // Load lookup data on mount
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

  // When SMR is selected, auto-fill farm and pre-fill items
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

  const updateItem = (i: number, patch: Partial<LpoItem>) =>
    setItems(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const totalAmount = items.reduce((s, r) => s + (parseFloat(r.quantity) || 0) * (parseFloat(r.unit_price) || 0), 0);

  const resetForm = () => {
    setSmrId(''); setSupplierId(''); setFarmId(''); setFarmName('');
    setCurrency('TZS'); setDeliveryAddress(''); setDeliveryDate(''); setPaymentTerms('');
    setItems([emptyItem()]); setFormError('');
  };

  const handleSubmit = async () => {
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
      toast.success('LPO created successfully');
      setShowCreate(false); resetForm(); refetch();
    } catch (err: any) {
      setFormError(getApiError(err, 'Failed to create LPO'));
    } finally { setSubmitting(false); }
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActioning('approve'); setActionError('');
    try {
      await apiService.approveLpo(selected.id);
      toast.success('LPO approved');
      setSelected(null); refetch();
    } catch (err: any) {
      setActionError(getApiError(err, 'Failed to approve LPO'));
    } finally { setActioning(null); }
  };

  const handleReject = async () => {
    if (!selected || !rejectNotes.trim()) return;
    setActioning('reject'); setActionError('');
    try {
      await apiService.rejectLpo(selected.id, rejectNotes.trim());
      toast.success('LPO rejected');
      setShowRejectDialog(false); setRejectNotes(''); setSelected(null); refetch();
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
      setSelected(null); refetch();
    } catch (err: any) {
      setActionError(getApiError(err, 'Failed to send LPO'));
    } finally { setActioning(null); }
  };

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
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="sent_to_supplier">Sent to Supplier</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="partially_fulfilled">Partially Fulfilled</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
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
                    <TableCell className="text-sm text-gray-700">{lpo.supplier?.name ?? lpo.supplier_name ?? suppliers.find(s => s.id === lpo.supplier_id)?.name ?? '—'}</TableCell>
                    <TableCell className="text-sm text-gray-500">{lpo.farm?.name ?? farms.find(f => f.id === lpo.farm_id)?.name ?? '—'}</TableCell>
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

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={open => { if (!open) { setSelected(null); setDetailData(null); setChain(null); setNoChainReason(''); setResolvedSmrNumber(null); } }}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="w-4 h-4 text-amber-600" />
                  {selected.lpo_number ?? selected.po_number ?? `LPO #${selected.id}`}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selected.status} />
                </SheetDescription>
              </SheetHeader>

              {/* Financial Controller — Approve / Reject — pinned near top so it's always visible */}
              {canFcAct && selected.status?.toLowerCase() === 'draft' && (
                <div className="mb-4">
                  {actionError && <p className="text-xs text-red-600 mb-2">{actionError}</p>}
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1.5" disabled={actioning !== null} onClick={handleApprove}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {actioning === 'approve' ? 'Approving…' : 'Approve LPO'}
                    </Button>
                    <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50 gap-1.5" disabled={actioning !== null}
                      onClick={() => { setActionError(''); setShowRejectDialog(true); }}>
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4 text-sm">

                {/* Meta grid */}
                {loadingDetail ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                    <LoadingSpinner size="sm" /> Loading details…
                  </div>
                ) : null}
                {/* Rejection banner */}
                {selected.status === 'rejected' && (detailData ?? selected).fc_approval_notes && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
                    <p className="font-semibold mb-0.5">Rejection reason</p>
                    <p>{(detailData ?? selected).fc_approval_notes}</p>
                  </div>
                )}

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
                        const ordered = parseFloat(item.quantity_ordered) || 0;
                        const received = parseFloat(item.quantity_received) || 0;
                        const pct = ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0;
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

                {/* Send to Supplier */}
                {canSend && selected.status?.toLowerCase() === 'approved' && (
                  <>
                    <Separator />
                    {actionError && <p className="text-xs text-red-600">{actionError}</p>}
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-1.5" disabled={actioning !== null} onClick={handleSend}>
                      <Send className="w-3.5 h-3.5" />
                      {actioning === 'send' ? 'Sending…' : 'Send to Supplier'}
                    </Button>
                  </>
                )}

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject notes dialog */}
      <Dialog open={showRejectDialog} onOpenChange={open => { if (!open) { setShowRejectDialog(false); setRejectNotes(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-4 h-4" /> Reject LPO
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-gray-600">Please provide a reason for rejection. This will be recorded against the LPO.</p>
            <Input
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              placeholder="Reason for rejection…"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectNotes(''); }}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!rejectNotes.trim() || actioning !== null}
              onClick={handleReject}
            >
              {actioning === 'reject' ? 'Rejecting…' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create LPO Dialog */}
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
                {/* SMR — required, drives farm + items */}
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

                {/* Farm — auto-filled readonly */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm (auto)</label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-500">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    {farmName || (farmId ? `Farm #${farmId}` : '—')}
                  </div>
                </div>

                {/* Supplier — required */}
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
                  <div key={i} className="space-y-1 mb-2">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4"><Input value={row.item_name} onChange={e => updateItem(i, { item_name: e.target.value })} placeholder="Item" className="text-sm" /></div>
                      <div className="col-span-2"><Input type="number" min="0.01" step="0.01" value={row.quantity} onChange={e => updateItem(i, { quantity: e.target.value })} placeholder="Qty" className="text-sm" /></div>
                      <div className="col-span-1"><Input value={row.unit} onChange={e => updateItem(i, { unit: e.target.value })} placeholder="kg" className="text-sm" /></div>
                      <div className="col-span-2"><Input type="number" min="0" step="0.01" value={row.unit_price} onChange={e => updateItem(i, { unit_price: e.target.value })} placeholder="0.00" className="text-sm" /></div>
                      <div className="col-span-2"><Input value={row.accounting_code} onChange={e => updateItem(i, { accounting_code: e.target.value })} placeholder="GL code" className="text-sm" /></div>
                      <div className="col-span-1 flex justify-center">
                        {items.length > 1 && <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}><Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" /></button>}
                      </div>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white">
                {submitting ? 'Creating…' : 'Create LPO'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
