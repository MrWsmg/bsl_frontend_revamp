"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Trash2, PackageCheck, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface GrnItem {
  item_name: string;
  quantity_ordered: string;
  quantity_received: string;
  quantity_accepted: string;
  quantity_rejected: string;
  unit: string;
  condition: 'good' | 'damaged' | 'wrong_item' | 'expired';
  rejection_reason: string;
  lpo_item_id: string;
}

const emptyItem = (): GrnItem => ({
  item_name: '',
  quantity_ordered: '',
  quantity_received: '',
  quantity_accepted: '',
  quantity_rejected: '',
  unit: 'kg',
  condition: 'good',
  rejection_reason: '',
  lpo_item_id: '',
});

const grnStatusColor: Record<string, string> = {
  pending:         'bg-yellow-100 text-yellow-800',
  inspected:       'bg-blue-100 text-blue-800',
  cardex_updated:  'bg-green-100 text-green-800',
  rejected:        'bg-red-100 text-red-800',
};

export const ProcurementGrnSection: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'linked' | 'direct'>('linked');
  const [lpoId, setLpoId] = useState('');
  const [farmId, setFarmId] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [items, setItems] = useState<GrnItem[]>([emptyItem()]);
  const [formError, setFormError] = useState('');
  const [inspectionStatus, setInspectionStatus] = useState<'pending' | 'passed' | 'failed'>('pending');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [qualityRating, setQualityRating] = useState('');
  const [inspectionPhotos, setInspectionPhotos] = useState('');
  const [deliveryPhotos, setDeliveryPhotos] = useState('');

  const getGrns = useCallback(() => apiService.getGrns(), []);
  const { data: grns, loading, error, refetch } = useApi(getGrns);

  const updateItem = (i: number, patch: Partial<GrnItem>) =>
    setItems(prev => prev.map((row, idx) => idx === i ? { ...row, ...patch } : row));

  const resetForm = () => {
    setMode('linked'); setLpoId(''); setFarmId('');
    setDeliveryNote(''); setCarrierName(''); setVehicleNo('');
    setInspectionStatus('pending'); setInspectionNotes(''); setQualityRating('');
    setInspectionPhotos(''); setDeliveryPhotos('');
    setItems([emptyItem()]); setFormError('');
  };

  const handleSubmit = async () => {
    setFormError('');
    const validItems = items.filter(r => r.item_name.trim());
    if (validItems.length === 0) { setFormError('Add at least one item.'); return; }
    if (mode === 'linked' && !lpoId) { setFormError('LPO/PO ID is required for linked mode.'); return; }
    if (mode === 'direct' && !farmId) { setFormError('Farm ID is required for direct entry.'); return; }

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
      if (inspectionPhotos.trim()) payload.inspection_photos = inspectionPhotos.trim();
      if (deliveryPhotos.trim()) payload.delivery_photos = deliveryPhotos.trim();

      if (mode === 'linked') {
        payload.lpo_id = parseInt(lpoId);
        payload.items = validItems.map(r => ({
          item_name: r.item_name.trim(),
          quantity_ordered: parseFloat(r.quantity_ordered) || 0,
          quantity_received: parseFloat(r.quantity_received) || 0,
          quantity_accepted: parseFloat(r.quantity_accepted) || parseFloat(r.quantity_received) || 0,
          quantity_rejected: parseFloat(r.quantity_rejected) || 0,
          unit: r.unit,
          condition: r.condition,
          rejection_reason: r.condition !== 'good' ? r.rejection_reason : undefined,
          ...(r.lpo_item_id ? { lpo_item_id: parseInt(r.lpo_item_id) } : {}),
        }));
      } else {
        payload.farm_id = parseInt(farmId);
        payload.items = validItems.map(r => ({
          item_name: r.item_name.trim(),
          quantity_accepted: parseFloat(r.quantity_accepted) || parseFloat(r.quantity_received) || 0,
          quantity_received: parseFloat(r.quantity_received) || 0,
          quantity_ordered: parseFloat(r.quantity_ordered) || parseFloat(r.quantity_received) || 0,
          quantity_rejected: parseFloat(r.quantity_rejected) || 0,
          unit: r.unit,
        }));
      }

      await apiService.createGrn(payload);
      toast.success('GRN created — CARDEX updated');
      setShowForm(false);
      resetForm();
      refetch();
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || err?.message || 'Failed to create GRN');
    } finally {
      setSubmitting(false);
    }
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
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Receive Goods
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
          ) : !Array.isArray(grns) || grns.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <PackageCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No goods receipts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {grns.map((grn: any) => (
                <div key={grn.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {grn.grn_number && (
                          <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded">
                            {grn.grn_number}
                          </span>
                        )}
                        {grn.status && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${grnStatusColor[grn.status] ?? 'bg-gray-100 text-gray-700'}`}>
                            {grn.status?.replace(/_/g, ' ')}
                          </span>
                        )}
                        {grn.status === 'cardex_updated' && (
                          <span className="flex items-center gap-1 text-xs text-green-700">
                            <CheckCircle2 className="w-3 h-3" /> CARDEX updated
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">
                        {grn.farm?.name ?? grn.farm_id ? `Farm #${grn.farm_id}` : 'Farm N/A'}
                        {grn.purchase_order?.po_number && ` · LPO ${grn.purchase_order.po_number}`}
                      </p>
                      {grn.delivery_note_number && (
                        <p className="text-xs text-gray-400 mt-0.5">DN: {grn.delivery_note_number}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      {grn.created_at && new Date(grn.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {Array.isArray(grn.items) && grn.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
                      {grn.items.map((item: any, i: number) => (
                        <div key={i} className="text-xs flex justify-between bg-gray-50 rounded px-2 py-1">
                          <span className="text-gray-700 font-medium">{item.item_name}</span>
                          <span className="text-gray-500">
                            accepted {item.quantity_accepted ?? item.quantity_received} {item.unit}
                            {item.condition && item.condition !== 'good' && (
                              <span className="ml-1 text-red-600">· {item.condition}</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create GRN Dialog */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-amber-600" />
              Receive Goods
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">
                {formError}
              </div>
            )}

            {/* Mode selector */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button
                type="button"
                onClick={() => setMode('linked')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'linked' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Linked to LPO
              </button>
              <button
                type="button"
                onClick={() => setMode('direct')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'direct' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Direct Entry
              </button>
            </div>

            {mode === 'direct' && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
                Direct entry adds stock directly to CARDEX without a linked purchase order — useful for stock seeding or adjustments.
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {mode === 'linked' ? (
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">LPO ID *</label>
                  <Input type="number" value={lpoId} onChange={e => setLpoId(e.target.value)} placeholder="Local Purchase Order ID" />
                </div>
              ) : (
                <div className="col-span-3">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No.</label>
                <Input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="T 123 ABC" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Status</label>
                <select
                  value={inspectionStatus}
                  onChange={e => setInspectionStatus(e.target.value as any)}
                  className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white w-full"
                >
                  <option value="pending">Pending</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quality Rating <span className="text-gray-400 font-normal">(1–5)</span></label>
                <Input type="number" min="1" max="5" value={qualityRating} onChange={e => setQualityRating(e.target.value)} placeholder="1–5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Photo URL <span className="text-gray-400 font-normal">(optional)</span></label>
                <Input type="url" value={inspectionPhotos} onChange={e => setInspectionPhotos(e.target.value)} placeholder="https://…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Photo URL <span className="text-gray-400 font-normal">(optional)</span></label>
                <Input type="url" value={deliveryPhotos} onChange={e => setDeliveryPhotos(e.target.value)} placeholder="https://…" />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                <Input value={inspectionNotes} onChange={e => setInspectionNotes(e.target.value)} placeholder="Notes from inspection…" />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Received Items *</label>
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
                  <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={row.item_name}
                        onChange={e => updateItem(i, { item_name: e.target.value })}
                        placeholder="Item name"
                        className="text-sm flex-1"
                      />
                      <Input
                        value={row.unit}
                        onChange={e => updateItem(i, { unit: e.target.value })}
                        placeholder="kg"
                        className="text-sm w-20"
                      />
                      {items.length > 1 && (
                        <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-0.5 block">Ordered</label>
                        <Input
                          type="number" min="0" step="0.01"
                          value={row.quantity_ordered}
                          onChange={e => updateItem(i, { quantity_ordered: e.target.value })}
                          placeholder="0"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-0.5 block">Received</label>
                        <Input
                          type="number" min="0" step="0.01"
                          value={row.quantity_received}
                          onChange={e => updateItem(i, { quantity_received: e.target.value })}
                          placeholder="0"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-0.5 block">Accepted ✓</label>
                        <Input
                          type="number" min="0" step="0.01"
                          value={row.quantity_accepted}
                          onChange={e => updateItem(i, { quantity_accepted: e.target.value })}
                          placeholder="= received"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-0.5 block">Rejected ✕</label>
                        <Input
                          type="number" min="0" step="0.01"
                          value={row.quantity_rejected}
                          onChange={e => updateItem(i, { quantity_rejected: e.target.value })}
                          placeholder="0"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    {mode === 'linked' && (
                      <div>
                        <label className="text-xs text-gray-500 mb-0.5 block">LPO Item ID <span className="text-gray-400">(optional)</span></label>
                        <Input
                          type="number"
                          value={row.lpo_item_id}
                          onChange={e => updateItem(i, { lpo_item_id: e.target.value })}
                          placeholder="Links to LPO line item"
                          className="text-sm"
                        />
                      </div>
                    )}

                    {mode === 'linked' && (
                      <div className="flex gap-2 items-center">
                        <select
                          value={row.condition}
                          onChange={e => updateItem(i, { condition: e.target.value as GrnItem['condition'] })}
                          className="border border-gray-200 rounded px-2 py-1.5 text-xs bg-white"
                        >
                          <option value="good">Good condition</option>
                          <option value="damaged">Damaged</option>
                          <option value="wrong_item">Wrong item</option>
                          <option value="expired">Expired</option>
                        </select>
                        {row.condition !== 'good' && (
                          <Input
                            value={row.rejection_reason}
                            onChange={e => updateItem(i, { rejection_reason: e.target.value })}
                            placeholder="Describe the issue…"
                            className="text-xs flex-1"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white">
              {submitting ? 'Creating…' : 'Create GRN'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
