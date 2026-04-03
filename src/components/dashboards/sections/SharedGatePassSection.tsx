"use client";

import React, { useState, useCallback } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ShieldCheck, RefreshCw, AlertCircle, Plus, LogOut, CheckCircle2, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props { userRole: string; }

const CAN_CREATE = ['farm_clerk', 'admin'];
const CAN_ISSUE  = ['farm_clerk', 'admin'];
const CAN_VERIFY = ['manager', 'admin'];

const GP_STATUS_COLORS: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-600 border-gray-200',
  issued:   'bg-blue-100 text-blue-800 border-blue-200',
  exited:   'bg-teal-100 text-teal-800 border-teal-200',
  verified: 'bg-green-100 text-green-800 border-green-200',
  cancelled:'bg-red-100 text-red-800 border-red-200',
};

function StatusBadge({ status }: { status: string }) {
  const cls = GP_STATUS_COLORS[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

const BLANK_FORM = {
  bearer_name: '',
  vehicle_number: '',
  destination: '',
  purpose: '',
  items: [{ item_name: '', quantity: '', unit: '' }],
};

export const SharedGatePassSection: React.FC<Props> = ({ userRole }) => {
  const canCreate = CAN_CREATE.includes(userRole);
  const canIssue  = CAN_ISSUE.includes(userRole);
  const canVerify = CAN_VERIFY.includes(userRole);

  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]   = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [actionBusy, setActionBusy] = useState<number | null>(null);

  const fetchGatePasses = useCallback(() => apiService.getGatePasses(), []);
  const { data: gatePasses, loading, error, refetch } = useApi(fetchGatePasses);
  const list = Array.isArray(gatePasses) ? gatePasses : [];

  const act = async (id: number, action: () => Promise<any>, msg: string) => {
    setActionBusy(id);
    try { await action(); toast.success(msg); refetch(); setSelected(null); }
    catch (e: any) { toast.error(getApiError(e, 'Action failed')); }
    finally { setActionBusy(null); }
  };

  const handleCreate = async () => {
    if (!form.bearer_name.trim() || !form.destination.trim()) {
      toast.error('Bearer name and destination are required');
      return;
    }
    setSubmitting(true);
    try {
      await apiService.createGatePass({
        ...form,
        items: form.items.filter(i => i.item_name.trim()),
      });
      toast.success('Gate pass created');
      setShowCreate(false);
      setForm(BLANK_FORM);
      refetch();
    } catch (e: any) {
      toast.error(getApiError(e, 'Failed to create gate pass'));
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { item_name: '', quantity: '', unit: '' }] }));
  const removeItem = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx: number, field: string, val: string) =>
    setForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, [field]: val } : it) }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-600" />
              Gate Passes
            </CardTitle>
            <div className="flex gap-2">
              {canCreate && (
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-1"
                  onClick={() => setShowCreate(true)}>
                  <Plus className="w-3.5 h-3.5" /> New Gate Pass
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && <Alert variant="destructive" className="mx-4 mb-3"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No gate passes found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">GP No.</TableHead>
                  <TableHead className="text-xs">Bearer</TableHead>
                  <TableHead className="text-xs">Destination</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                  <TableHead className="text-xs w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((gp: any) => {
                  const status = gp.status?.toLowerCase();
                  const isDraft  = status === 'draft';
                  const isIssued = status === 'issued';
                  const isExited = status === 'exited';
                  return (
                    <TableRow key={gp.id} className="hover:bg-violet-50/40">
                      <TableCell className="cursor-pointer" onClick={() => setSelected(gp)}>
                        <span className="font-mono text-xs bg-violet-50 border border-violet-200 text-violet-800 px-1.5 py-0.5 rounded">
                          {gp.gate_pass_number ?? `GP #${gp.id}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 cursor-pointer" onClick={() => setSelected(gp)}>
                        {gp.bearer_name}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 cursor-pointer" onClick={() => setSelected(gp)}>
                        {gp.destination}
                      </TableCell>
                      <TableCell className="cursor-pointer" onClick={() => setSelected(gp)}>
                        <StatusBadge status={gp.status} />
                      </TableCell>
                      <TableCell className="text-xs text-gray-400 cursor-pointer" onClick={() => setSelected(gp)}>
                        {gp.created_at ? new Date(gp.created_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {canIssue && isDraft && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-blue-700 border-blue-200 hover:bg-blue-50"
                              disabled={actionBusy === gp.id}
                              onClick={() => act(gp.id, () => apiService.issueGatePass(gp.id), 'Gate pass issued')}>
                              {actionBusy === gp.id ? '…' : 'Issue'}
                            </Button>
                          )}
                          {canIssue && isIssued && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-teal-700 border-teal-200 hover:bg-teal-50 gap-1"
                              disabled={actionBusy === gp.id}
                              onClick={() => act(gp.id, () => apiService.recordGatePassExit(gp.id), 'Exit recorded')}>
                              <LogOut className="w-3 h-3" />{actionBusy === gp.id ? '…' : 'Exit'}
                            </Button>
                          )}
                          {canVerify && isExited && (
                            <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-200 hover:bg-green-50 gap-1"
                              disabled={actionBusy === gp.id}
                              onClick={() => act(gp.id, () => apiService.verifyGatePass(gp.id), 'Gate pass verified')}>
                              <CheckCircle2 className="w-3 h-3" />{actionBusy === gp.id ? '…' : 'Verify'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="cursor-pointer" onClick={() => setSelected(gp)}>
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

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          {selected && (() => {
            const status = selected.status?.toLowerCase();
            const isDraft  = status === 'draft';
            const isIssued = status === 'issued';
            const isExited = status === 'exited';
            return (
              <>
                <SheetHeader className="mb-4">
                  <SheetTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="w-4 h-4 text-violet-600" />
                    {selected.gate_pass_number ?? `GP #${selected.id}`}
                  </SheetTitle>
                  <SheetDescription><StatusBadge status={selected.status} /></SheetDescription>
                </SheetHeader>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-xs text-gray-400 mb-0.5">Bearer</p><p className="font-medium">{selected.bearer_name}</p></div>
                    <div><p className="text-xs text-gray-400 mb-0.5">Vehicle</p><p className="font-medium">{selected.vehicle_number ?? '—'}</p></div>
                    <div><p className="text-xs text-gray-400 mb-0.5">Destination</p><p className="text-gray-700">{selected.destination}</p></div>
                    <div><p className="text-xs text-gray-400 mb-0.5">Purpose</p><p className="text-gray-700">{selected.purpose ?? '—'}</p></div>
                    <div><p className="text-xs text-gray-400 mb-0.5">Issued At</p><p className="text-gray-700">{selected.issued_at ? new Date(selected.issued_at).toLocaleDateString() : '—'}</p></div>
                    <div><p className="text-xs text-gray-400 mb-0.5">Exit Time</p><p className="text-gray-700">{selected.exit_time ? new Date(selected.exit_time).toLocaleString() : '—'}</p></div>
                  </div>
                  {Array.isArray(selected.items) && selected.items.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Items</p>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="text-xs">Item</TableHead>
                              <TableHead className="text-xs">Qty</TableHead>
                              <TableHead className="text-xs">Unit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selected.items.map((item: any, i: number) => (
                              <TableRow key={i}>
                                <TableCell className="text-xs">{item.item_name}</TableCell>
                                <TableCell className="text-xs">{item.quantity}</TableCell>
                                <TableCell className="text-xs">{item.unit}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex gap-2 flex-wrap">
                    {canIssue && isDraft && (
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={actionBusy === selected.id}
                        onClick={() => act(selected.id, () => apiService.issueGatePass(selected.id), 'Gate pass issued')}>
                        {actionBusy === selected.id ? 'Issuing…' : 'Issue Gate Pass'}
                      </Button>
                    )}
                    {canIssue && isIssued && (
                      <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white gap-1" disabled={actionBusy === selected.id}
                        onClick={() => act(selected.id, () => apiService.recordGatePassExit(selected.id), 'Exit recorded')}>
                        <LogOut className="w-4 h-4" />
                        {actionBusy === selected.id ? 'Recording…' : 'Record Exit'}
                      </Button>
                    )}
                    {canVerify && isExited && (
                      <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1" disabled={actionBusy === selected.id}
                        onClick={() => act(selected.id, () => apiService.verifyGatePass(selected.id), 'Gate pass verified')}>
                        <CheckCircle2 className="w-4 h-4" />
                        {actionBusy === selected.id ? 'Verifying…' : 'Verify & Complete'}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={open => { if (!open) { setShowCreate(false); setForm(BLANK_FORM); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Gate Pass</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bearer Name *</label>
                <Input value={form.bearer_name} onChange={e => setForm(f => ({ ...f, bearer_name: e.target.value }))} placeholder="Full name" className="h-8 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle No.</label>
                <Input value={form.vehicle_number} onChange={e => setForm(f => ({ ...f, vehicle_number: e.target.value }))} placeholder="e.g. KCB 123X" className="h-8 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Destination *</label>
                <Input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="Where is bearer going?" className="h-8 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Purpose</label>
                <Input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="Reason for gate pass" className="h-8 text-sm" />
              </div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">Items Carried</p>
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addItem}>
                  <Plus className="w-3 h-3" /> Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1 items-center">
                    <Input className="col-span-5 h-7 text-xs" placeholder="Item name"
                      value={item.item_name} onChange={e => updateItem(idx, 'item_name', e.target.value)} />
                    <Input className="col-span-3 h-7 text-xs" placeholder="Qty" type="number"
                      value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                    <Input className="col-span-3 h-7 text-xs" placeholder="Unit"
                      value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} />
                    <button type="button" className="col-span-1 text-red-400 hover:text-red-600 text-xs font-bold"
                      onClick={() => removeItem(idx)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setForm(BLANK_FORM); }}>Cancel</Button>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" disabled={submitting} onClick={handleCreate}>
              {submitting ? 'Creating…' : 'Create Gate Pass'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
