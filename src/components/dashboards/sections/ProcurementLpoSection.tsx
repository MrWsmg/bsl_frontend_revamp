"use client";

import React, { useState, useCallback, useEffect } from 'react';
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ClipboardList, AlertCircle, RefreshCw, Download, Building2, Package, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  initialSmrId?: number;
  initialSmrNumber?: string;
  initialSmrItems?: any[];
  onSmrConsumed?: () => void;
}

interface LpoItem {
  item_name: string;
  quantity: string;
  unit: string;
  unit_price: string;
  description: string;
  accounting_code: string;
}

const emptyItem = (): LpoItem => ({
  item_name: '',
  quantity: '',
  unit: 'kg',
  unit_price: '',
  description: '',
  accounting_code: '',
});

const lpoStatusColor: Record<string, string> = {
  draft:                          'bg-gray-100 text-gray-700',
  pending_approval:               'bg-yellow-100 text-yellow-800',
  pending_account_approval:       'bg-orange-100 text-orange-800',
  pending_payroll_master_approval:'bg-amber-100 text-amber-800',
  approved:                       'bg-green-100 text-green-800',
  sent:                           'bg-blue-100 text-blue-800',
  confirmed:                      'bg-emerald-100 text-emerald-800',
  delivered:                      'bg-teal-100 text-teal-800',
  cancelled:                      'bg-red-100 text-red-800',
};

export const ProcurementLpoSection: React.FC<Props> = ({ initialSmrId, initialSmrNumber, initialSmrItems, onSmrConsumed }) => {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [smrId, setSmrId] = useState('');
  const [smrNumber, setSmrNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [farmId, setFarmId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [currency, setCurrency] = useState('TZS');
  const [items, setItems] = useState<LpoItem[]>([emptyItem()]);
  const [formError, setFormError] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingSupp, setLoadingSupp] = useState(false);

  const getLpos = useCallback(() => apiService.getLpos(), []);
  const { data: lpos, loading, error, refetch } = useApi(getLpos);

  // Open form automatically when initialSmrId changes
  useEffect(() => {
    if (initialSmrId != null) {
      resetForm();
      setSmrId(String(initialSmrId));
      setSmrNumber(initialSmrNumber ?? '');
      if (Array.isArray(initialSmrItems) && initialSmrItems.length > 0) {
        setItems(initialSmrItems.map((it: any) => ({
          item_name: it.item_name ?? '',
          quantity: String(it.quantity ?? it.quantity_requested ?? ''),
          unit: it.unit ?? 'kg',
          unit_price: '',
          description: it.specifications ?? '',
          accounting_code: '',
        })));
      }
      loadSuppliers();
      setShowForm(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSmrId]);

  const loadSuppliers = async () => {
    if (suppliers.length) return;
    setLoadingSupp(true);
    try { setSuppliers(await apiService.getSuppliers()); }
    catch { /* non-critical */ }
    finally { setLoadingSupp(false); }
  };

  const updateItem = (i: number, patch: Partial<LpoItem>) =>
    setItems(prev => prev.map((row, idx) => idx === i ? { ...row, ...patch } : row));

  const totalAmount = items.reduce((sum, r) => {
    return sum + (parseFloat(r.quantity) || 0) * (parseFloat(r.unit_price) || 0);
  }, 0);

  const resetForm = () => {
    setSmrId(''); setSmrNumber(''); setSupplierId(''); setFarmId('');
    setDeliveryAddress(''); setDeliveryDate(''); setPaymentTerms(''); setCurrency('TZS');
    setItems([emptyItem()]); setFormError('');
  };

  const handleClose = () => {
    setShowForm(false);
    resetForm();
    onSmrConsumed?.();
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!supplierId) { setFormError('Select a supplier.'); return; }
    const validItems = items.filter(r => r.item_name.trim() && r.quantity && r.unit_price);
    if (validItems.length === 0) { setFormError('Add at least one item with price.'); return; }

    setSubmitting(true);
    try {
      await apiService.createLpo({
        ...(smrId ? { smr_id: parseInt(smrId) } : {}),
        supplier_id: parseInt(supplierId),
        ...(farmId ? { farm_id: parseInt(farmId) } : {}),
        delivery_address: deliveryAddress.trim() || undefined,
        delivery_date: deliveryDate || undefined,
        payment_terms: paymentTerms.trim() || undefined,
        currency,
        total_amount: totalAmount,
        items: validItems.map(r => ({
          item_name: r.item_name.trim(),
          description: r.description.trim() || undefined,
          quantity_ordered: parseFloat(r.quantity),
          unit: r.unit,
          unit_price: parseFloat(r.unit_price),
          total_price: parseFloat(r.quantity) * parseFloat(r.unit_price),
          ...(r.accounting_code.trim() ? { accounting_code: r.accounting_code.trim() } : {}),
        })),
      });
      toast.success('LPO created successfully');
      handleClose();
      refetch();
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || err?.message || 'Failed to create LPO');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSupplier = suppliers.find(s => String(s.id) === supplierId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-600" />
              Local Purchase Orders (LPO)
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" onClick={() => { loadSuppliers(); setShowForm(true); }} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                New LPO
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
          ) : !Array.isArray(lpos) || lpos.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No purchase orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lpos.map((lpo: any) => (
                <div key={lpo.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {(lpo.lpo_number ?? lpo.po_number) && (
                          <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded">
                            {lpo.lpo_number ?? lpo.po_number}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${lpoStatusColor[lpo.status?.toLowerCase()] ?? 'bg-gray-100 text-gray-700'}`}>
                          {lpo.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">
                        {lpo.supplier?.name ?? lpo.supplier_name ?? 'Supplier N/A'}
                      </p>
                      {lpo.farm?.name && <p className="text-xs text-gray-400 mt-0.5">Farm: {lpo.farm.name}</p>}
                    </div>
                    <div className="text-right">
                      {lpo.total_amount != null && (
                        <p className="text-sm font-semibold text-gray-800">
                          {Number(lpo.total_amount).toLocaleString()} {lpo.currency ?? 'TZS'}
                        </p>
                      )}
                      {lpo.created_at && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(lpo.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {lpo.po_document_url && (
                    <div className="mt-2">
                      <button
                        onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL ?? ''}${lpo.po_document_url}`, '_blank')}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Download LPO PDF
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create LPO Dialog */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) handleClose(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-600" />
              Create Local Purchase Order
              {smrId && (
                <span className="font-mono text-sm text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  SMR #{smrId}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">
                {formError}
              </div>
            )}

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
              {loadingSupp ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                  <LoadingSpinner size="sm" /> Loading suppliers…
                </div>
              ) : (
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a supplier…" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}{s.contact_person ? ` — ${s.contact_person}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedSupplier && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5 bg-gray-50 border border-gray-100 rounded px-3 py-2">
                  <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {selectedSupplier.contact ?? selectedSupplier.email ?? '—'}
                </div>
              )}
            </div>

            {smrNumber && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
                <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Linked SMR</p>
                  <p className="text-sm font-mono font-semibold text-amber-900">{smrNumber}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {!smrId && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMR ID <span className="text-gray-400 font-normal">(optional)</span></label>
                  <Input type="number" value={smrId} onChange={e => setSmrId(e.target.value)} placeholder="Link to SMR #" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm ID</label>
                <Input type="number" value={farmId} onChange={e => setFarmId(e.target.value)} placeholder="Receiving farm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['TZS', 'USD', 'EUR', 'GBP', 'KES'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="h-10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="e.g. 30 days net" />
              </div>
              <div className="col-span-2 md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                <Input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Delivery location" />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-gray-400" />
                  Line Items *
                  {smrId && items.length > 0 && items[0].item_name && (
                    <span className="text-xs text-amber-600 font-normal">(pre-filled from SMR)</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => setItems(p => [...p, emptyItem()])}
                  className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add item
                </button>
              </div>

              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1 mb-1">
                <div className="col-span-4">Item</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Unit</div>
                <div className="col-span-3">Unit price ({currency})</div>
                <div className="col-span-1" />
              </div>

              <div className="space-y-2">
                {items.map((row, i) => (
                  <div key={i} className="space-y-1">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <Input value={row.item_name} onChange={e => updateItem(i, { item_name: e.target.value })} placeholder="Item name" className="text-sm" />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" min="0.01" step="0.01" value={row.quantity} onChange={e => updateItem(i, { quantity: e.target.value })} placeholder="Qty" className="text-sm" />
                      </div>
                      <div className="col-span-2">
                        <Input value={row.unit} onChange={e => updateItem(i, { unit: e.target.value })} placeholder="kg" className="text-sm" />
                      </div>
                      <div className="col-span-3">
                        <Input type="number" min="0" step="0.01" value={row.unit_price} onChange={e => updateItem(i, { unit_price: e.target.value })} placeholder="Price" className="text-sm" />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {items.length > 1 && (
                          <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={row.description} onChange={e => updateItem(i, { description: e.target.value })} placeholder="Description / specs (optional)" className="text-xs" />
                      <Input value={row.accounting_code} onChange={e => updateItem(i, { accounting_code: e.target.value })} placeholder="Accounting code (optional)" className="text-xs" />
                    </div>
                  </div>
                ))}
              </div>

              {totalAmount > 0 && (
                <div className="mt-3 flex justify-end">
                  <div className="bg-amber-50 border border-amber-200 rounded px-4 py-2 text-sm">
                    <span className="text-gray-600">Total: </span>
                    <span className="font-bold text-amber-800">{totalAmount.toLocaleString()} {currency}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white">
              {submitting ? 'Creating…' : 'Create LPO'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
