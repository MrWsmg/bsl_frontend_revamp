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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileCheck, RefreshCw, Plus, AlertCircle, ChevronRight, CheckCircle2, Send, PenLine, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props { userRole: string; }

const CAN_CREATE   = ['farm_clerk', 'admin'];
const CAN_APPROVE  = ['manager', 'admin'];
const CAN_REJECT   = ['manager', 'admin'];
const CAN_DISPATCH = ['farm_clerk', 'admin'];
const CAN_SIGN     = ['supervisor', 'admin'];

const DN_STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved:   'bg-green-100 text-green-800 border-green-200',
  rejected:   'bg-red-100 text-red-800 border-red-200',
  dispatched: 'bg-blue-100 text-blue-700 border-blue-200',
  received:   'bg-teal-100 text-teal-800 border-teal-200',
  signed:     'bg-teal-100 text-teal-800 border-teal-200',
};

function StatusBadge({ status }: { status: string }) {
  const cls = DN_STATUS_COLORS[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>{status?.replace(/_/g, ' ')}</span>;
}

interface DnItem { item_name: string; quantity: string; unit: string; }
const emptyItem = (): DnItem => ({ item_name: '', quantity: '', unit: 'kg' });

interface DnForm {
  gin_id: string; from_farm_id: string; to_farm_id: string;
  recipient_name: string; notes: string;
  items: DnItem[];
}
const emptyForm = (): DnForm => ({
  gin_id: '', from_farm_id: '', to_farm_id: '', recipient_name: '', notes: '',
  items: [emptyItem()],
});

export const SharedDeliveryNoteSection: React.FC<Props> = ({ userRole }) => {
  const canCreate   = CAN_CREATE.includes(userRole);
  const canApprove  = CAN_APPROVE.includes(userRole);
  const canReject   = CAN_REJECT.includes(userRole);
  const canDispatch = CAN_DISPATCH.includes(userRole);
  const canSign     = CAN_SIGN.includes(userRole);

  const [selected, setSelected]         = useState<any>(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [form, setForm]                 = useState<DnForm>(emptyForm());
  const [submitting, setSubmitting]     = useState(false);
  const [actionBusy, setActionBusy]     = useState<number | null>(null);
  const [formError, setFormError]       = useState('');
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [rejectReason, setRejectReason]     = useState('');
  const [rejecting, setRejecting]           = useState(false);

  const fetchDNs = useCallback(() => apiService.getDeliveryNotes(), []);
  const { data: dns, loading, error, refetch } = useApi(fetchDNs);
  const list = Array.isArray(dns) ? dns : [];

  const updateItem = (i: number, patch: Partial<DnItem>) =>
    setForm(f => ({ ...f, items: f.items.map((r, idx) => idx === i ? { ...r, ...patch } : r) }));

  const act = async (fn: () => Promise<any>, msg: string, id: number) => {
    setActionBusy(id);
    try { await fn(); toast.success(msg); refetch(); }
    catch (e: any) { toast.error(getApiError(e, 'Action failed')); }
    finally { setActionBusy(null); }
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!form.from_farm_id || !form.to_farm_id) { setFormError('Source and destination farm IDs are required.'); return; }
    const valid = form.items.filter(r => r.item_name.trim() && parseFloat(r.quantity) > 0);
    if (valid.length === 0) { setFormError('Add at least one item.'); return; }
    setSubmitting(true);
    try {
      await apiService.createDeliveryNote({
        ...(form.gin_id ? { gin_id: parseInt(form.gin_id) } : {}),
        from_farm_id: parseInt(form.from_farm_id),
        to_farm_id: parseInt(form.to_farm_id),
        recipient_name: form.recipient_name.trim() || undefined,
        notes: form.notes.trim() || undefined,
        items: valid.map(r => ({
          item_name: r.item_name.trim(),
          quantity: parseFloat(r.quantity),
          unit: r.unit,
        })),
      });
      toast.success('Delivery note created');
      setShowCreate(false); setForm(emptyForm()); refetch();
    } catch (e: any) { setFormError(getApiError(e, 'Failed to create')); }
    finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!rejectTargetId || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      await apiService.rejectDeliveryNote(rejectTargetId, rejectReason.trim());
      toast.success('Delivery note rejected');
      setRejectTargetId(null);
      setRejectReason('');
      setSelected(null);
      refetch();
    } catch (e: any) {
      toast.error(getApiError(e, 'Failed to reject delivery note'));
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-600" />
              Delivery Notes (DN)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="w-3.5 h-3.5" /></Button>
              {canCreate && (
                <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="w-3.5 h-3.5" /> New DN
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
              <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No delivery notes found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">DN No.</TableHead>
                  <TableHead className="text-xs">Route</TableHead>
                  <TableHead className="text-xs">Recipient</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                  <TableHead className="text-xs w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((dn: any) => {
                  const s = dn.status?.toLowerCase();
                  return (
                    <TableRow key={dn.id} className="hover:bg-amber-50/40">
                      <TableCell className="cursor-pointer" onClick={() => setSelected(dn)}>
                        <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                          {dn.dn_number ?? `DN #${dn.id}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 cursor-pointer" onClick={() => setSelected(dn)}>
                        {dn.from_farm?.name ?? `Farm #${dn.from_farm_id}`} → {dn.to_farm?.name ?? `Farm #${dn.to_farm_id}`}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 cursor-pointer" onClick={() => setSelected(dn)}>{dn.recipient_name ?? '—'}</TableCell>
                      <TableCell className="cursor-pointer" onClick={() => setSelected(dn)}><StatusBadge status={dn.status ?? 'pending'} /></TableCell>
                      <TableCell className="text-xs text-gray-400 cursor-pointer" onClick={() => setSelected(dn)}>{dn.created_at ? new Date(dn.created_at).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {canApprove && s === 'pending' && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-200 hover:bg-green-50" disabled={actionBusy === dn.id}
                              onClick={() => act(() => apiService.approveDeliveryNote(dn.id), 'DN approved', dn.id)}>
                              {actionBusy === dn.id ? '…' : '✓ Approve'}
                            </Button>
                          )}
                          {canReject && s === 'pending' && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-red-700 border-red-200 hover:bg-red-50 gap-1" disabled={actionBusy === dn.id}
                              onClick={() => { setRejectTargetId(dn.id); setRejectReason(''); }}>
                              <XCircle className="w-3 h-3" /> Reject
                            </Button>
                          )}
                          {canDispatch && s === 'approved' && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-blue-700 border-blue-200 hover:bg-blue-50 gap-1" disabled={actionBusy === dn.id}
                              onClick={() => act(() => apiService.dispatchDeliveryNote(dn.id), 'DN dispatched', dn.id)}>
                              <Send className="w-3 h-3" /> Dispatch
                            </Button>
                          )}
                          {canSign && s === 'dispatched' && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-teal-700 border-teal-200 hover:bg-teal-50 gap-1" disabled={actionBusy === dn.id}
                              onClick={() => act(() => apiService.signDeliveryNote(dn.id), 'Receipt confirmed', dn.id)}>
                              <PenLine className="w-3 h-3" /> Sign
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="cursor-pointer" onClick={() => setSelected(dn)}><ChevronRight className="w-3.5 h-3.5 text-gray-300" /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2 text-base"><FileCheck className="w-4 h-4 text-amber-600" />{selected.dn_number ?? `DN #${selected.id}`}</SheetTitle>
                <SheetDescription><StatusBadge status={selected.status ?? 'pending'} /></SheetDescription>
              </SheetHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-gray-400 mb-0.5">From</p><p className="font-medium">{selected.from_farm?.name ?? `Farm #${selected.from_farm_id}`}</p></div>
                  <div><p className="text-xs text-gray-400 mb-0.5">To</p><p className="font-medium">{selected.to_farm?.name ?? `Farm #${selected.to_farm_id}`}</p></div>
                  {selected.recipient_name && <div><p className="text-xs text-gray-400 mb-0.5">Recipient</p><p className="text-gray-700">{selected.recipient_name}</p></div>}
                  {selected.gin_id && <div><p className="text-xs text-gray-400 mb-0.5">Linked GIN</p><p className="font-mono text-amber-700">GIN #{selected.gin_id}</p></div>}
                  {selected.notes && <div className="col-span-2"><p className="text-xs text-gray-400 mb-0.5">Notes</p><p className="text-gray-600">{selected.notes}</p></div>}
                </div>
                {Array.isArray(selected.items) && selected.items.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Items</p>
                      <Table>
                        <TableHeader><TableRow className="bg-gray-50"><TableHead className="text-xs">Item</TableHead><TableHead className="text-xs">Quantity</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {selected.items.map((item: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs">{item.item_name}</TableCell>
                              <TableCell className="text-xs">{item.quantity} {item.unit}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex gap-2 flex-wrap">
                  {canApprove && selected.status?.toLowerCase() === 'pending' && (
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm" disabled={actionBusy === selected.id}
                      onClick={() => { act(() => apiService.approveDeliveryNote(selected.id), 'DN approved', selected.id); setSelected(null); }}>
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
                    </Button>
                  )}
                  {canReject && selected.status?.toLowerCase() === 'pending' && (
                    <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm" disabled={actionBusy === selected.id}
                      onClick={() => { setRejectTargetId(selected.id); setRejectReason(''); setSelected(null); }}>
                      <XCircle className="w-4 h-4 mr-1.5" /> Reject
                    </Button>
                  )}
                  {canDispatch && selected.status?.toLowerCase() === 'approved' && (
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm" disabled={actionBusy === selected.id}
                      onClick={() => { act(() => apiService.dispatchDeliveryNote(selected.id), 'DN dispatched', selected.id); setSelected(null); }}>
                      <Send className="w-4 h-4 mr-1.5" /> Dispatch
                    </Button>
                  )}
                  {canSign && selected.status?.toLowerCase() === 'dispatched' && (
                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm" disabled={actionBusy === selected.id}
                      onClick={() => { act(() => apiService.signDeliveryNote(selected.id), 'Receipt confirmed', selected.id); setSelected(null); }}>
                      <PenLine className="w-4 h-4 mr-1.5" /> Sign — Confirm Receipt
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject DN Dialog */}
      <Dialog open={rejectTargetId !== null} onOpenChange={open => { if (!open) { setRejectTargetId(null); setRejectReason(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-4 h-4" /> Reject Delivery Note
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for rejection <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Describe why this delivery note is being rejected…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTargetId(null); setRejectReason(''); }} disabled={rejecting}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={rejecting || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {rejecting ? 'Rejecting…' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create DN Dialog */}
      {canCreate && (
        <Dialog open={showCreate} onOpenChange={open => { if (!open) { setShowCreate(false); setForm(emptyForm()); setFormError(''); } }}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><FileCheck className="w-4 h-4 text-amber-600" /> Create Delivery Note</DialogTitle></DialogHeader>
            <div className="space-y-4 py-1">
              {formError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{formError}</AlertDescription></Alert>}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">GIN ID <span className="text-gray-400 font-normal">(optional)</span></label><Input type="number" value={form.gin_id} onChange={e => setForm(f => ({ ...f, gin_id: e.target.value }))} placeholder="GIN #" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label><Input value={form.recipient_name} onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))} placeholder="Recipient" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">From Farm ID *</label><Input type="number" value={form.from_farm_id} onChange={e => setForm(f => ({ ...f, from_farm_id: e.target.value }))} placeholder="Source farm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">To Farm ID *</label><Input type="number" value={form.to_farm_id} onChange={e => setForm(f => ({ ...f, to_farm_id: e.target.value }))} placeholder="Destination" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Items *</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }))} className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
                </div>
                {form.items.map((row, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center mb-2">
                    <div className="col-span-6"><Input value={row.item_name} onChange={e => updateItem(i, { item_name: e.target.value })} placeholder="Item name" className="text-sm" /></div>
                    <div className="col-span-3"><Input type="number" min="0.01" step="0.01" value={row.quantity} onChange={e => updateItem(i, { quantity: e.target.value })} placeholder="Qty" className="text-sm" /></div>
                    <div className="col-span-2"><Input value={row.unit} onChange={e => updateItem(i, { unit: e.target.value })} placeholder="kg" className="text-sm" /></div>
                    <div className="col-span-1 flex justify-center">{form.items.length > 1 && <button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))}><Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" /></button>}</div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); setForm(emptyForm()); setFormError(''); }} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white">{submitting ? 'Creating…' : 'Create DN'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
