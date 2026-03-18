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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClipboardList, RefreshCw, Plus, AlertCircle, Download, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Props { userRole: string; }

const CAN_CREATE = ['procurement_officer', 'admin'];

const LPO_STATUS_COLORS: Record<string, string> = {
  draft:                           'bg-gray-100 text-gray-600 border-gray-200',
  pending_approval:                'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_account_approval:        'bg-orange-100 text-orange-700 border-orange-200',
  pending_payroll_master_approval: 'bg-amber-100 text-amber-800 border-amber-200',
  approved:                        'bg-green-100 text-green-800 border-green-200',
  sent:                            'bg-blue-100 text-blue-700 border-blue-200',
  confirmed:                       'bg-emerald-100 text-emerald-800 border-emerald-200',
  delivered:                       'bg-teal-100 text-teal-800 border-teal-200',
  cancelled:                       'bg-red-100 text-red-700 border-red-200',
};

function StatusBadge({ status }: { status: string }) {
  const cls = LPO_STATUS_COLORS[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

interface LpoItem { item_name: string; quantity: string; unit: string; unit_price: string; description: string; accounting_code: string; }
const emptyItem = (): LpoItem => ({ item_name: '', quantity: '', unit: 'kg', unit_price: '', description: '', accounting_code: '' });

export const SharedLpoSection: React.FC<Props> = ({ userRole }) => {
  const canCreate = CAN_CREATE.includes(userRole);

  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected]         = useState<any>(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState('');

  // form state
  const [smrId, setSmrId]                   = useState('');
  const [deliveryDate, setDeliveryDate]     = useState('');
  const [supplierId, setSupplierId]         = useState('');
  const [supplierName, setSupplierName]     = useState('');
  const [farmId, setFarmId]                 = useState('');
  const [currency, setCurrency]             = useState('TZS');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentTerms, setPaymentTerms]     = useState('');
  const [items, setItems]                   = useState<LpoItem[]>([emptyItem()]);

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
    setSmrId(''); setSupplierId(''); setSupplierName(''); setFarmId('');
    setCurrency('TZS'); setDeliveryAddress(''); setDeliveryDate(''); setPaymentTerms('');
    setItems([emptyItem()]); setFormError('');
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!supplierName.trim() && !supplierId) { setFormError('Supplier name or ID required.'); return; }
    const valid = items.filter(r => r.item_name.trim() && r.quantity && r.unit_price);
    if (valid.length === 0) { setFormError('Add at least one item.'); return; }
    setSubmitting(true);
    try {
      await apiService.createLpo({
        ...(smrId ? { smr_id: parseInt(smrId) } : {}),
        ...(supplierId ? { supplier_id: parseInt(supplierId) } : { supplier_name: supplierName.trim() }),
        ...(farmId ? { farm_id: parseInt(farmId) } : {}),
        delivery_address: deliveryAddress.trim() || undefined,
        delivery_date: deliveryDate || undefined,
        payment_terms: paymentTerms.trim() || undefined,
        currency,
        total_amount: totalAmount,
        items: valid.map(r => ({
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
      setShowCreate(false); resetForm(); refetch();
    } catch (err: any) {
      setFormError(getApiError(err, 'Failed to create LPO'));
    } finally { setSubmitting(false); }
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
                  <SelectItem value="delivered">Delivered</SelectItem>
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
                  <TableRow key={lpo.id} className="cursor-pointer hover:bg-amber-50/40" onClick={() => setSelected(lpo)}>
                    <TableCell>
                      <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                        {lpo.lpo_number ?? lpo.po_number ?? `LPO #${lpo.id}`}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{lpo.supplier?.name ?? lpo.supplier_name ?? '—'}</TableCell>
                    <TableCell className="text-sm text-gray-500">{lpo.farm?.name ?? '—'}</TableCell>
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
      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="w-4 h-4 text-amber-600" />
                  {selected.lpo_number ?? selected.po_number ?? `LPO #${selected.id}`}
                </SheetTitle>
                <SheetDescription><StatusBadge status={selected.status} /></SheetDescription>
              </SheetHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Supplier</p>
                    <p className="font-medium text-gray-800">{selected.supplier?.name ?? selected.supplier_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Farm</p>
                    <p className="text-gray-700">{selected.farm?.name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Total Amount</p>
                    <p className="font-bold text-gray-800">{selected.total_amount != null ? `${Number(selected.total_amount).toLocaleString()} ${selected.currency ?? 'TZS'}` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Payment Terms</p>
                    <p className="text-gray-700">{selected.payment_terms ?? '—'}</p>
                  </div>
                  {selected.delivery_address && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-0.5">Delivery Address</p>
                      <p className="text-gray-700">{selected.delivery_address}</p>
                    </div>
                  )}
                </div>
                {(selected.manager_approved_at || selected.account_manager_approved_at) && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Approval Trail</p>
                      <div className="space-y-1 text-xs">
                        {selected.manager_approved_at && <p className="text-green-700">✓ Manager — {new Date(selected.manager_approved_at).toLocaleDateString()}</p>}
                        {selected.account_manager_approved_at && <p className="text-green-700">✓ Account Manager — {new Date(selected.account_manager_approved_at).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  </>
                )}
                {Array.isArray(selected.items) && selected.items.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Line Items</p>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-xs">Item</TableHead>
                            <TableHead className="text-xs">Qty</TableHead>
                            <TableHead className="text-xs">Unit price</TableHead>
                            <TableHead className="text-xs">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selected.items.map((item: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs">
                                <p>{item.item_name}</p>
                                {item.description && <p className="text-gray-400">{item.description}</p>}
                              </TableCell>
                              <TableCell className="text-xs">{item.quantity_ordered} {item.unit}</TableCell>
                              <TableCell className="text-xs">{Number(item.unit_price).toLocaleString()}</TableCell>
                              <TableCell className="text-xs font-semibold">{Number(item.total_price).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
                {selected.po_document_url && (
                  <>
                    <Separator />
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL ?? ''}${selected.po_document_url}`, '_blank')}>
                      <Download className="w-3.5 h-3.5" /> Download LPO PDF
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMR ID <span className="text-gray-400 font-normal">(optional)</span></label>
                  <Input type="number" value={smrId} onChange={e => setSmrId(e.target.value)} placeholder="Link to SMR #" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier ID <span className="text-gray-400 font-normal">(or name below)</span></label>
                  <Input type="number" value={supplierId} onChange={e => setSupplierId(e.target.value)} placeholder="Supplier ID" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                  <Input value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="Used if no Supplier ID" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm ID</label>
                  <Input type="number" value={farmId} onChange={e => setFarmId(e.target.value)} placeholder="Receiving farm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <Input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="TZS" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                  <Input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Delivery location" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                  <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="e.g. 30 days net" />
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
                  <div className="col-span-4">Item</div><div className="col-span-2">Qty</div>
                  <div className="col-span-2">Unit</div><div className="col-span-3">Unit price</div><div className="col-span-1" />
                </div>
                {items.map((row, i) => (
                  <div key={i} className="space-y-1 mb-2">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4"><Input value={row.item_name} onChange={e => updateItem(i, { item_name: e.target.value })} placeholder="Item" className="text-sm" /></div>
                      <div className="col-span-2"><Input type="number" min="0.01" step="0.01" value={row.quantity} onChange={e => updateItem(i, { quantity: e.target.value })} placeholder="Qty" className="text-sm" /></div>
                      <div className="col-span-2"><Input value={row.unit} onChange={e => updateItem(i, { unit: e.target.value })} placeholder="kg" className="text-sm" /></div>
                      <div className="col-span-3"><Input type="number" min="0" step="0.01" value={row.unit_price} onChange={e => updateItem(i, { unit_price: e.target.value })} placeholder="Price" className="text-sm" /></div>
                      <div className="col-span-1 flex justify-center">
                        {items.length > 1 && <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}><Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" /></button>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={row.description} onChange={e => updateItem(i, { description: e.target.value })} placeholder="Description / specs (optional)" className="text-xs" />
                      <Input value={row.accounting_code} onChange={e => updateItem(i, { accounting_code: e.target.value })} placeholder="Accounting code (optional)" className="text-xs" />
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
