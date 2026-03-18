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
import { PackageCheck, RefreshCw, Plus, AlertCircle, CheckCircle2, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Props { userRole: string; }

const CAN_CREATE  = ['farm_clerk', 'manager', 'procurement_officer', 'admin'];
const CAN_APPROVE = ['manager', 'admin'];

const GRN_STATUS_COLORS: Record<string, string> = {
  pending:        'bg-yellow-100 text-yellow-800 border-yellow-200',
  inspected:      'bg-blue-100 text-blue-700 border-blue-200',
  cardex_updated: 'bg-green-100 text-green-800 border-green-200',
  rejected:       'bg-red-100 text-red-800 border-red-200',
};

function StatusBadge({ status }: { status: string }) {
  const cls = GRN_STATUS_COLORS[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

interface GrnItem {
  item_name: string; quantity_ordered: string; quantity_received: string;
  quantity_accepted: string; quantity_rejected: string; unit: string; condition: 'good' | 'damaged' | 'wrong_item' | 'expired'; rejection_reason: string;
}
const emptyItem = (): GrnItem => ({
  item_name: '', quantity_ordered: '', quantity_received: '', quantity_accepted: '', quantity_rejected: '',
  unit: 'kg', condition: 'good', rejection_reason: '',
});

export const SharedGrnSection: React.FC<Props> = ({ userRole }) => {
  const canCreate  = CAN_CREATE.includes(userRole);
  const canApprove = CAN_APPROVE.includes(userRole);

  const [selected, setSelected]     = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving]   = useState<number | null>(null);
  const [formError, setFormError]   = useState('');

  // form
  const [mode, setMode]             = useState<'linked' | 'direct'>('linked');
  const [lpoId, setLpoId]           = useState('');
  const [farmId, setFarmId]         = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [carrierName, setCarrierName]   = useState('');
  const [vehicleNo, setVehicleNo]       = useState('');
  const [inspectionStatus, setInspectionStatus] = useState<'pending' | 'passed' | 'failed'>('pending');
  const [inspectionNotes, setInspectionNotes]   = useState('');
  const [qualityRating, setQualityRating]       = useState('');
  const [items, setItems]               = useState<GrnItem[]>([emptyItem()]);

  const fetchGrns = useCallback(() => apiService.getGrns(), []);
  const { data: grns, loading, error, refetch } = useApi(fetchGrns);
  const list = Array.isArray(grns) ? grns : [];

  const updateItem = (i: number, patch: Partial<GrnItem>) =>
    setItems(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const resetForm = () => {
    setMode('linked'); setLpoId(''); setFarmId(''); setDeliveryNote('');
    setCarrierName(''); setVehicleNo(''); setItems([emptyItem()]); setFormError('');
    setInspectionStatus('pending'); setInspectionNotes(''); setQualityRating('');
  };

  const handleSubmit = async () => {
    setFormError('');
    const valid = items.filter(r => r.item_name.trim());
    if (valid.length === 0) { setFormError('Add at least one item.'); return; }
    if (mode === 'linked' && !lpoId) { setFormError('LPO ID is required.'); return; }
    if (mode === 'direct' && !farmId) { setFormError('Farm ID is required.'); return; }
    setSubmitting(true);
    try {
      const payload: any = {
        delivery_note_number: deliveryNote.trim() || undefined,
        carrier_name: carrierName.trim() || undefined,
        vehicle_number: vehicleNo.trim() || undefined,
      };
      payload.inspection_status = inspectionStatus;
      if (inspectionNotes.trim()) payload.inspection_notes = inspectionNotes.trim();
      if (qualityRating) payload.quality_rating = parseInt(qualityRating);
      if (mode === 'linked') {
        payload.lpo_id = parseInt(lpoId);
        payload.items = valid.map(r => ({
          item_name: r.item_name.trim(),
          quantity_ordered: parseFloat(r.quantity_ordered) || 0,
          quantity_received: parseFloat(r.quantity_received) || 0,
          quantity_accepted: parseFloat(r.quantity_accepted) || parseFloat(r.quantity_received) || 0,
          quantity_rejected: parseFloat(r.quantity_rejected) || 0,
          unit: r.unit, condition: r.condition,
          rejection_reason: r.condition !== 'good' ? r.rejection_reason : undefined,
        }));
      } else {
        payload.farm_id = parseInt(farmId);
        payload.items = valid.map(r => ({
          item_name: r.item_name.trim(),
          quantity_received: parseFloat(r.quantity_received) || 0,
          quantity_accepted: parseFloat(r.quantity_accepted) || parseFloat(r.quantity_received) || 0,
          quantity_ordered: parseFloat(r.quantity_ordered) || parseFloat(r.quantity_received) || 0,
          quantity_rejected: parseFloat(r.quantity_rejected) || 0,
          unit: r.unit,
        }));
      }
      await apiService.createGrn(payload);
      toast.success('GRN created — CARDEX updated');
      setShowCreate(false); resetForm(); refetch();
    } catch (err: any) {
      setFormError(getApiError(err, 'Failed to create GRN'));
    } finally { setSubmitting(false); }
  };

  const handleApprove = async (grnId: number) => {
    setApproving(grnId);
    try {
      await apiService.approveGrn(grnId);
      toast.success('GRN approved — CARDEX updated');
      refetch();
    } catch (err: any) {
      toast.error(getApiError(err, 'Failed to approve GRN'));
    } finally { setApproving(null); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-amber-600" />
              Goods Received Notes (GRN)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              {canCreate && (
                <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="w-3.5 h-3.5" /> Receive Goods
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
              <PackageCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No goods receipts yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">GRN No.</TableHead>
                  <TableHead className="text-xs">Farm</TableHead>
                  <TableHead className="text-xs">Delivery Note</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  {canApprove && <TableHead className="text-xs">Actions</TableHead>}
                  <TableHead className="text-xs w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((grn: any) => (
                  <TableRow key={grn.id} className="hover:bg-amber-50/40">
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => setSelected(grn)}
                    >
                      <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                        {grn.grn_number ?? `GRN #${grn.id}`}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 cursor-pointer" onClick={() => setSelected(grn)}>
                      {grn.farm?.name ?? (grn.farm_id ? `Farm #${grn.farm_id}` : '—')}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 cursor-pointer" onClick={() => setSelected(grn)}>
                      {grn.delivery_note_number ?? '—'}
                    </TableCell>
                    <TableCell className="cursor-pointer" onClick={() => setSelected(grn)}>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={grn.status} />
                        {grn.status === 'cardex_updated' && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400 cursor-pointer" onClick={() => setSelected(grn)}>
                      {grn.created_at ? new Date(grn.created_at).toLocaleDateString() : '—'}
                    </TableCell>
                    {canApprove && (
                      <TableCell>
                        {grn.status === 'pending' || grn.status === 'inspected' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 text-green-700 border-green-200 hover:bg-green-50"
                            disabled={approving === grn.id}
                            onClick={() => handleApprove(grn.id)}
                          >
                            {approving === grn.id ? '…' : 'Approve'}
                          </Button>
                        ) : null}
                      </TableCell>
                    )}
                    <TableCell className="cursor-pointer" onClick={() => setSelected(grn)}>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <PackageCheck className="w-4 h-4 text-amber-600" />
                  {selected.grn_number ?? `GRN #${selected.id}`}
                </SheetTitle>
                <SheetDescription>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selected.status} />
                    {selected.status === 'cardex_updated' && <span className="text-xs text-green-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> CARDEX updated</span>}
                  </div>
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Farm</p>
                    <p className="font-medium text-gray-800">{selected.farm?.name ?? (selected.farm_id ? `Farm #${selected.farm_id}` : '—')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Linked LPO</p>
                    <p className="font-mono text-amber-700">{selected.purchase_order?.po_number ?? (selected.purchase_order_id ? `LPO #${selected.purchase_order_id}` : '—')}</p>
                  </div>
                  {selected.delivery_note_number && <div><p className="text-xs text-gray-400 mb-0.5">Delivery Note</p><p className="text-gray-700">{selected.delivery_note_number}</p></div>}
                  {selected.carrier_name && <div><p className="text-xs text-gray-400 mb-0.5">Carrier</p><p className="text-gray-700">{selected.carrier_name}</p></div>}
                  {selected.vehicle_number && <div><p className="text-xs text-gray-400 mb-0.5">Vehicle</p><p className="text-gray-700">{selected.vehicle_number}</p></div>}
                </div>
                {Array.isArray(selected.items) && selected.items.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Received Items</p>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-xs">Item</TableHead>
                            <TableHead className="text-xs">Ordered</TableHead>
                            <TableHead className="text-xs">Received</TableHead>
                            <TableHead className="text-xs">Accepted</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selected.items.map((item: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs">
                                <p>{item.item_name}</p>
                                {item.condition && item.condition !== 'good' && (
                                  <span className="text-red-600 text-xs">{item.condition.replace(/_/g, ' ')}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs">{item.quantity_ordered} {item.unit}</TableCell>
                              <TableCell className="text-xs">{item.quantity_received} {item.unit}</TableCell>
                              <TableCell className="text-xs font-semibold text-green-700">{item.quantity_accepted ?? item.quantity_received} {item.unit}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
                {canApprove && (selected.status === 'pending' || selected.status === 'inspected') && (
                  <>
                    <Separator />
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      disabled={approving === selected.id}
                      onClick={() => { handleApprove(selected.id); setSelected(null); }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {approving === selected.id ? 'Approving…' : 'Approve GRN → Update CARDEX'}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create GRN Dialog */}
      {canCreate && (
        <Dialog open={showCreate} onOpenChange={open => { if (!open) { setShowCreate(false); resetForm(); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-amber-600" />
                Receive Goods
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-1">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              {/* Mode selector */}
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                <button type="button" onClick={() => setMode('linked')} className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'linked' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Linked to LPO</button>
                <button type="button" onClick={() => setMode('direct')} className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'direct' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Direct Entry</button>
              </div>
              {mode === 'direct' && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
                  Direct entry adds stock to CARDEX without a linked purchase order — useful for stock seeding or adjustments.
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {mode === 'linked' ? (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">LPO / PO ID *</label>
                    <Input type="number" value={lpoId} onChange={e => setLpoId(e.target.value)} placeholder="Purchase Order ID" />
                  </div>
                ) : (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Farm ID *</label>
                    <Input type="number" value={farmId} onChange={e => setFarmId(e.target.value)} placeholder="Receiving farm ID" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Note #</label>
                  <Input value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)} placeholder="DN-2025-XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                  <Input value={carrierName} onChange={e => setCarrierName(e.target.value)} placeholder="Transport company" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No.</label>
                  <Input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="T 123 ABC" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Status</label>
                  <select value={inspectionStatus} onChange={e => setInspectionStatus(e.target.value as any)} className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white w-full">
                    <option value="pending">Pending</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quality Rating <span className="text-gray-400 font-normal">(1–5)</span></label>
                  <Input type="number" min="1" max="5" value={qualityRating} onChange={e => setQualityRating(e.target.value)} placeholder="1–5" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                  <Input value={inspectionNotes} onChange={e => setInspectionNotes(e.target.value)} placeholder="Notes from inspection…" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Received Items *</label>
                  <button type="button" onClick={() => setItems(p => [...p, emptyItem()])} className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add item
                  </button>
                </div>
                <div className="space-y-3">
                  {items.map((row, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input value={row.item_name} onChange={e => updateItem(i, { item_name: e.target.value })} placeholder="Item name" className="text-sm flex-1" />
                        <Input value={row.unit} onChange={e => updateItem(i, { unit: e.target.value })} placeholder="kg" className="text-sm w-20" />
                        {items.length > 1 && <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}><Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" /></button>}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div><label className="text-xs text-gray-500 mb-0.5 block">Ordered</label><Input type="number" min="0" step="0.01" value={row.quantity_ordered} onChange={e => updateItem(i, { quantity_ordered: e.target.value })} placeholder="0" className="text-sm" /></div>
                        <div><label className="text-xs text-gray-500 mb-0.5 block">Received</label><Input type="number" min="0" step="0.01" value={row.quantity_received} onChange={e => updateItem(i, { quantity_received: e.target.value })} placeholder="0" className="text-sm" /></div>
                        <div><label className="text-xs text-gray-500 mb-0.5 block">Accepted ✓</label><Input type="number" min="0" step="0.01" value={row.quantity_accepted} onChange={e => updateItem(i, { quantity_accepted: e.target.value })} placeholder="= received" className="text-sm" /></div>
                        <div><label className="text-xs text-gray-500 mb-0.5 block">Rejected ✕</label><Input type="number" min="0" step="0.01" value={row.quantity_rejected} onChange={e => updateItem(i, { quantity_rejected: e.target.value })} placeholder="0" className="text-sm" /></div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <select value={row.condition} onChange={e => updateItem(i, { condition: e.target.value as GrnItem['condition'] })} className="border border-gray-200 rounded px-2 py-1.5 text-xs bg-white">
                          <option value="good">Good condition</option>
                          <option value="damaged">Damaged</option>
                          <option value="wrong_item">Wrong item</option>
                          <option value="expired">Expired</option>
                        </select>
                        {row.condition !== 'good' && <Input value={row.rejection_reason} onChange={e => updateItem(i, { rejection_reason: e.target.value })} placeholder="Describe the issue…" className="text-xs flex-1" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white">
                {submitting ? 'Creating…' : 'Create GRN'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
