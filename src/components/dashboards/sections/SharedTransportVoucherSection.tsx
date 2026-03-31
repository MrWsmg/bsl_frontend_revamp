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
import { Truck, RefreshCw, Plus, AlertCircle, ChevronRight, CheckCircle2, XCircle, Send, PenLine } from 'lucide-react';
import { toast } from 'sonner';

interface Props { userRole: string; }

const CAN_CREATE   = ['farm_clerk', 'admin'];
const CAN_APPROVE  = ['manager', 'admin'];
const CAN_DISPATCH = ['farm_clerk', 'admin'];
const CAN_SIGN     = ['supervisor', 'admin'];

const TV_STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved:   'bg-green-100 text-green-800 border-green-200',
  rejected:   'bg-red-100 text-red-800 border-red-200',
  dispatched: 'bg-blue-100 text-blue-700 border-blue-200',
  delivered:  'bg-teal-100 text-teal-800 border-teal-200',
  signed:     'bg-teal-100 text-teal-800 border-teal-200',
};

function StatusBadge({ status }: { status: string }) {
  const cls = TV_STATUS_COLORS[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>{status?.replace(/_/g, ' ')}</span>;
}

interface TvItem { item_name: string; quantity: string; unit: string; }
interface TvForm {
  gin_id: string;
  farm_id: string;
  vehicle_type: string;
  vehicle_number: string;
  driver_name: string;
  driver_contact: string;
  origin: string;
  destination: string;
  departure_date: string;
  transport_cost: string;
  notes: string;
}
const emptyForm = (): TvForm => ({
  gin_id: '', farm_id: '', vehicle_type: 'truck', vehicle_number: '',
  driver_name: '', driver_contact: '', origin: '', destination: '',
  departure_date: '', transport_cost: '', notes: '',
});

export const SharedTransportVoucherSection: React.FC<Props> = ({ userRole }) => {
  const canCreate   = CAN_CREATE.includes(userRole);
  const canApprove  = CAN_APPROVE.includes(userRole);
  const canDispatch = CAN_DISPATCH.includes(userRole);
  const canSign     = CAN_SIGN.includes(userRole);

  const [selected, setSelected]         = useState<any>(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [form, setForm]                 = useState<TvForm>(emptyForm());
  const [tvItems, setTvItems] = useState<TvItem[]>([{ item_name: '', quantity: '', unit: '' }]);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [actionBusy, setActionBusy]     = useState<number | null>(null);
  const [formError, setFormError]       = useState('');

  const fetchTVs = useCallback(() => apiService.getTransportVouchers(), []);
  const { data: tvs, loading, error, refetch } = useApi(fetchTVs);
  const list = Array.isArray(tvs) ? tvs : [];

  const action = async (fn: () => Promise<any>, successMsg: string, id: number) => {
    setActionBusy(id);
    try { await fn(); toast.success(successMsg); refetch(); }
    catch (e: any) { toast.error(getApiError(e, 'Action failed')); }
    finally { setActionBusy(null); }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    await action(() => apiService.rejectTransportVoucher(rejectTarget, rejectReason), 'Transport voucher rejected', rejectTarget);
    setRejectTarget(null); setRejectReason('');
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!form.farm_id) { setFormError('Farm ID is required.'); return; }
    if (!form.origin.trim() || !form.destination.trim()) { setFormError('Origin and destination are required.'); return; }
    setSubmitting(true);
    try {
      const validItems = tvItems.filter(r => r.item_name.trim());
      await apiService.createTransportVoucher({
        ...(form.gin_id ? { gin_id: parseInt(form.gin_id) } : {}),
        farm_id: parseInt(form.farm_id),
        vehicle_type: form.vehicle_type || undefined,
        vehicle_number: form.vehicle_number.trim() || undefined,
        driver_name: form.driver_name.trim() || undefined,
        driver_contact: form.driver_contact.trim() || undefined,
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        departure_date: form.departure_date || undefined,
        transport_cost: form.transport_cost ? parseFloat(form.transport_cost) : undefined,
        notes: form.notes.trim() || undefined,
        ...(validItems.length > 0 ? {
          items: validItems.map(r => ({
            item_name: r.item_name.trim(),
            quantity: parseFloat(r.quantity) || 0,
            unit: r.unit.trim(),
          })),
        } : {}),
      });
      toast.success('Transport voucher created');
      setShowCreate(false);
      setForm(emptyForm());
      setTvItems([{ item_name: '', quantity: '', unit: '' }]);
      refetch();
    } catch (e: any) { setFormError(getApiError(e, 'Failed to create')); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-600" />
              Transport Vouchers (TV)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="w-3.5 h-3.5" /></Button>
              {canCreate && (
                <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="w-3.5 h-3.5" /> New TV
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
              <Truck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No transport vouchers found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">TV No.</TableHead>
                  <TableHead className="text-xs">Route</TableHead>
                  <TableHead className="text-xs">Vehicle</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                  <TableHead className="text-xs w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((tv: any) => {
                  const s = tv.status?.toLowerCase();
                  return (
                    <TableRow key={tv.id} className="hover:bg-amber-50/40">
                      <TableCell className="cursor-pointer" onClick={() => setSelected(tv)}>
                        <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                          {tv.tv_number ?? `TV #${tv.id}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 cursor-pointer" onClick={() => setSelected(tv)}>
                        {tv.from_farm?.name ?? `Farm #${tv.from_farm_id}`} → {tv.to_farm?.name ?? `Farm #${tv.to_farm_id}`}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 cursor-pointer" onClick={() => setSelected(tv)}>{tv.vehicle_number ?? '—'}</TableCell>
                      <TableCell className="cursor-pointer" onClick={() => setSelected(tv)}><StatusBadge status={tv.status ?? 'pending'} /></TableCell>
                      <TableCell className="text-xs text-gray-400 cursor-pointer" onClick={() => setSelected(tv)}>{tv.created_at ? new Date(tv.created_at).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {canApprove && s === 'pending' && (
                            <>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-200 hover:bg-green-50" disabled={actionBusy === tv.id} onClick={() => action(() => apiService.approveTransportVoucher(tv.id), 'TV approved', tv.id)}>✓</Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50" disabled={actionBusy === tv.id} onClick={() => setRejectTarget(tv.id)}>✕</Button>
                            </>
                          )}
                          {canDispatch && s === 'approved' && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-blue-700 border-blue-200 hover:bg-blue-50 gap-1" disabled={actionBusy === tv.id} onClick={() => action(() => apiService.dispatchTransportVoucher(tv.id), 'TV dispatched', tv.id)}>
                              <Send className="w-3 h-3" /> Dispatch
                            </Button>
                          )}
                          {canSign && s === 'dispatched' && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-teal-700 border-teal-200 hover:bg-teal-50 gap-1" disabled={actionBusy === tv.id} onClick={() => action(() => apiService.signTransportVoucher(tv.id), 'TV signed as delivered', tv.id)}>
                              <PenLine className="w-3 h-3" /> Sign
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="cursor-pointer" onClick={() => setSelected(tv)}><ChevronRight className="w-3.5 h-3.5 text-gray-300" /></TableCell>
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
        <SheetContent className="w-[460px] sm:max-w-[460px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2 text-base"><Truck className="w-4 h-4 text-amber-600" />{selected.tv_number ?? `TV #${selected.id}`}</SheetTitle>
                <SheetDescription><StatusBadge status={selected.status ?? 'pending'} /></SheetDescription>
              </SheetHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-gray-400 mb-0.5">From</p><p className="font-medium">{selected.from_farm?.name ?? `Farm #${selected.from_farm_id}`}</p></div>
                  <div><p className="text-xs text-gray-400 mb-0.5">To</p><p className="font-medium">{selected.to_farm?.name ?? `Farm #${selected.to_farm_id}`}</p></div>
                  <div><p className="text-xs text-gray-400 mb-0.5">Vehicle</p><p className="text-gray-700">{selected.vehicle_number ?? '—'}</p></div>
                  <div><p className="text-xs text-gray-400 mb-0.5">Driver</p><p className="text-gray-700">{selected.driver_name ?? '—'}</p></div>
                  {selected.gin_id && <div><p className="text-xs text-gray-400 mb-0.5">Linked GIN</p><p className="font-mono text-amber-700">GIN #{selected.gin_id}</p></div>}
                  {selected.notes && <div className="col-span-2"><p className="text-xs text-gray-400 mb-0.5">Notes</p><p className="text-gray-600">{selected.notes}</p></div>}
                </div>
                <Separator />
                <div className="flex gap-2 flex-wrap">
                  {canApprove && selected.status?.toLowerCase() === 'pending' && (
                    <>
                      <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm" disabled={actionBusy === selected.id}
                        onClick={() => { action(() => apiService.approveTransportVoucher(selected.id), 'TV approved', selected.id); setSelected(null); }}>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
                      </Button>
                      <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50 text-sm"
                        onClick={() => { setRejectTarget(selected.id); setSelected(null); }}>
                        <XCircle className="w-4 h-4 mr-1.5" /> Reject
                      </Button>
                    </>
                  )}
                  {canDispatch && selected.status?.toLowerCase() === 'approved' && (
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm" disabled={actionBusy === selected.id}
                      onClick={() => { action(() => apiService.dispatchTransportVoucher(selected.id), 'TV dispatched', selected.id); setSelected(null); }}>
                      <Send className="w-4 h-4 mr-1.5" /> Dispatch
                    </Button>
                  )}
                  {canSign && selected.status?.toLowerCase() === 'dispatched' && (
                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm" disabled={actionBusy === selected.id}
                      onClick={() => { action(() => apiService.signTransportVoucher(selected.id), 'Delivery signed', selected.id); setSelected(null); }}>
                      <PenLine className="w-4 h-4 mr-1.5" /> Sign — Confirm Delivery
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject Dialog */}
      <Dialog open={rejectTarget !== null} onOpenChange={open => { if (!open) { setRejectTarget(null); setRejectReason(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-red-700">Reject Transport Voucher</DialogTitle></DialogHeader>
          <div className="py-2"><label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label><Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Explain the rejection…" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="destructive" disabled={!rejectReason.trim() || !!actionBusy} onClick={handleReject}>{actionBusy ? '…' : 'Confirm Reject'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create TV Dialog */}
      {canCreate && (
        <Dialog open={showCreate} onOpenChange={open => { if (!open) { setShowCreate(false); setForm(emptyForm()); setTvItems([{ item_name: '', quantity: '', unit: '' }]); setFormError(''); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Truck className="w-4 h-4 text-amber-600" /> Create Transport Voucher</DialogTitle></DialogHeader>
            <div className="space-y-4 py-1">
              {formError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{formError}</AlertDescription></Alert>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm ID *</label>
                  <Input type="number" value={form.farm_id} onChange={e => setForm(f => ({ ...f, farm_id: e.target.value }))} placeholder="Farm ID" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GIN ID <span className="text-gray-400 font-normal">(optional)</span></label>
                  <Input type="number" value={form.gin_id} onChange={e => setForm(f => ({ ...f, gin_id: e.target.value }))} placeholder="GIN #" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origin *</label>
                  <Input value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} placeholder="e.g. AGENTIC Main Store" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                  <Input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="e.g. Block 5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <select value={form.vehicle_type} onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value }))} className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white w-full">
                    <option value="truck">Truck</option>
                    <option value="pickup">Pickup</option>
                    <option value="van">Van</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No.</label>
                  <Input value={form.vehicle_number} onChange={e => setForm(f => ({ ...f, vehicle_number: e.target.value }))} placeholder="T 123 ABC" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                  <Input value={form.driver_name} onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))} placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver Contact</label>
                  <Input value={form.driver_contact} onChange={e => setForm(f => ({ ...f, driver_contact: e.target.value }))} placeholder="+255700000000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date</label>
                  <Input type="datetime-local" value={form.departure_date} onChange={e => setForm(f => ({ ...f, departure_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transport Cost <span className="text-gray-400 font-normal">(optional)</span></label>
                  <Input type="number" min="0" step="0.01" value={form.transport_cost} onChange={e => setForm(f => ({ ...f, transport_cost: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                  <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Items <span className="text-gray-400 font-normal">(optional)</span></label>
                  <button type="button" onClick={() => setTvItems(p => [...p, { item_name: '', quantity: '', unit: '' }])} className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add item
                  </button>
                </div>
                {tvItems.map((row, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center mb-2">
                    <div className="col-span-6"><Input value={row.item_name} onChange={e => setTvItems(p => p.map((r, idx) => idx === i ? { ...r, item_name: e.target.value } : r))} placeholder="Item name" className="text-sm" /></div>
                    <div className="col-span-3"><Input type="number" min="0" step="0.01" value={row.quantity} onChange={e => setTvItems(p => p.map((r, idx) => idx === i ? { ...r, quantity: e.target.value } : r))} placeholder="Qty" className="text-sm" /></div>
                    <div className="col-span-2"><Input value={row.unit} onChange={e => setTvItems(p => p.map((r, idx) => idx === i ? { ...r, unit: e.target.value } : r))} placeholder="unit" className="text-sm" /></div>
                    <div className="col-span-1 flex justify-center">
                      {tvItems.length > 1 && <button type="button" onClick={() => setTvItems(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); setForm(emptyForm()); setFormError(''); }} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white">{submitting ? 'Creating…' : 'Create TV'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
