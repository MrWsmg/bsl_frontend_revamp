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
import {
  Receipt, RefreshCw, Plus, AlertCircle, FileText, Building2, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props { userRole: string; }

const CAN_CREATE = ['procurement_officer', 'manager', 'admin'];

const PFI_STATUS_COLORS: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  selected: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const SMR_STATUS_COLORS: Record<string, string> = {
  draft:       'bg-gray-100 text-gray-700 border-gray-200',
  pending_pfi: 'bg-amber-100 text-amber-800 border-amber-200',
  approved:    'bg-green-100 text-green-800 border-green-200',
};

function PfiStatusBadge({ status }: { status: string }) {
  const cls = PFI_STATUS_COLORS[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function SmrStatusBadge({ status }: { status: string }) {
  const cls = SMR_STATUS_COLORS[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

interface PfiFormItem {
  smr_item_id: number;
  item_name: string;
  quantity: string;
  unit: string;
  unit_price: string;
}

export const SharedPfiSection: React.FC<Props> = ({ userRole }) => {
  const canCreate = CAN_CREATE.includes(userRole);

  // ── view state ──────────────────────────────────────────
  const [activeTab, setActiveTab]     = useState<'smrs' | 'pfis'>('smrs');
  const [selectedPfi, setSelectedPfi] = useState<any>(null);

  // ── create-PFI dialog state ──────────────────────────────
  const [showCreate, setShowCreate]     = useState(false);
  const [sourceSmr, setSourceSmr]       = useState<any>(null);
  const [supplierId, setSupplierId]     = useState('');
  const [validityDays, setValidityDays] = useState('30');
  const [formItems, setFormItems]       = useState<PfiFormItem[]>([]);
  const [formError, setFormError]       = useState('');
  const [submitting, setSubmitting]     = useState(false);

  // ── suppliers ────────────────────────────────────────────
  const [suppliers, setSuppliers]   = useState<any[]>([]);
  const [loadingSupp, setLoadingSupp] = useState(false);

  const loadSuppliers = async () => {
    if (suppliers.length) return;
    setLoadingSupp(true);
    try { setSuppliers(await apiService.getSuppliers()); }
    catch { /* non-critical */ }
    finally { setLoadingSupp(false); }
  };

  // ── data fetches ─────────────────────────────────────────
  const fetchSmrs = useCallback(
    () => apiService.getProcurementSmrs({ status: 'pending_pfi' }),
    []
  );
  const { data: smrs, loading: loadingSmrs, error: smrError, refetch: refetchSmrs } = useApi(fetchSmrs);
  const smrList = Array.isArray(smrs) ? smrs : [];

  const fetchPfis = useCallback(() => apiService.getPfis(), []);
  const { data: pfis, loading: loadingPfis, error: pfiError, refetch: refetchPfis } = useApi(fetchPfis);
  const pfiList = Array.isArray(pfis) ? pfis : [];

  // ── open create dialog ────────────────────────────────────
  const openCreate = (smr: any) => {
    setSourceSmr(smr);
    setSupplierId('');
    setValidityDays('30');
    setFormItems(
      Array.isArray(smr.items) && smr.items.length > 0
        ? smr.items.map((it: any) => ({
            smr_item_id: it.id,
            item_name:   it.item_name ?? '',
            quantity:    String(it.quantity ?? it.quantity_requested ?? ''),
            unit:        it.unit ?? 'kg',
            unit_price:  '',
          }))
        : []
    );
    setFormError('');
    setShowCreate(true);
    loadSuppliers();
  };

  const totalValue = formItems.reduce(
    (s, r) => s + (parseFloat(r.quantity) || 0) * (parseFloat(r.unit_price) || 0),
    0
  );

  const handleSubmit = async () => {
    setFormError('');
    if (!supplierId) { setFormError('Select a supplier.'); return; }
    const valid = formItems.filter(r => r.item_name && r.quantity && r.unit_price);
    if (valid.length === 0) { setFormError('Fill in unit prices for at least one item.'); return; }
    setSubmitting(true);
    try {
      await apiService.createPfi({
        smr_id:       sourceSmr.id,
        supplier_id:  parseInt(supplierId),
        farm_id:      sourceSmr.farm_id,
        validity_days: parseInt(validityDays) || 30,
        items: valid.map(r => ({
          smr_item_id: r.smr_item_id,
          item_name:   r.item_name,
          quantity:    parseFloat(r.quantity),
          unit:        r.unit,
          unit_price:  parseFloat(r.unit_price),
        })),
      });
      toast.success('PFI submitted successfully');
      setShowCreate(false);
      refetchSmrs();
      refetchPfis();
    } catch (err: any) {
      setFormError(getApiError(err, 'Failed to submit PFI'));
    } finally { setSubmitting(false); }
  };

  const selectedSupplier = suppliers.find(s => String(s.id) === supplierId);

  return (
    <div className="space-y-4">
      {/* ── Tab toggle ─────────────────────────────────────── */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={activeTab === 'smrs' ? 'default' : 'outline'}
          onClick={() => setActiveTab('smrs')}
          className="gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" /> Pending SMRs
          {smrList.length > 0 && (
            <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {smrList.length}
            </span>
          )}
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'pfis' ? 'default' : 'outline'}
          onClick={() => setActiveTab('pfis')}
          className="gap-1.5"
        >
          <Receipt className="w-3.5 h-3.5" /> Submitted PFIs
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={() => { refetchSmrs(); refetchPfis(); }}>
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* ── Pending SMRs view ────────────────────────────────── */}
      {activeTab === 'smrs' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              SMRs Awaiting Performa Invoice
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {smrError && (
              <Alert variant="destructive" className="mx-4 mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{smrError}</AlertDescription>
              </Alert>
            )}
            {loadingSmrs ? (
              <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
            ) : smrList.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No SMRs awaiting PFI</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {smrList.map((smr: any) => (
                  <div key={smr.id} className="px-4 py-3 hover:bg-amber-50/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                            {smr.smr_number ?? `SMR #${smr.id}`}
                          </span>
                          <SmrStatusBadge status={smr.status} />
                          <span className="text-xs text-gray-400">
                            {smr.created_at ? new Date(smr.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {smr.farm?.name ?? `Farm #${smr.farm_id}`}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{smr.justification}</p>
                        {Array.isArray(smr.items) && smr.items.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {smr.items.slice(0, 4).map((it: any, i: number) => (
                              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {it.item_name} ({it.quantity ?? it.quantity_requested} {it.unit})
                              </span>
                            ))}
                            {smr.items.length > 4 && (
                              <span className="text-xs text-gray-400">+{smr.items.length - 4} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      {canCreate && (
                        <Button
                          size="sm"
                          onClick={() => openCreate(smr)}
                          className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Submit Quote
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Submitted PFIs view ──────────────────────────────── */}
      {activeTab === 'pfis' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              Performa Invoices (PFI)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pfiError && (
              <Alert variant="destructive" className="mx-4 mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{pfiError}</AlertDescription>
              </Alert>
            )}
            {loadingPfis ? (
              <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
            ) : pfiList.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No PFIs submitted yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">PFI No.</TableHead>
                    <TableHead className="text-xs">SMR</TableHead>
                    <TableHead className="text-xs">Supplier</TableHead>
                    <TableHead className="text-xs">Total</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pfiList.map((pfi: any) => (
                    <TableRow
                      key={pfi.id}
                      className="cursor-pointer hover:bg-amber-50/40"
                      onClick={() => setSelectedPfi(pfi)}
                    >
                      <TableCell>
                        <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                          {pfi.pfi_number ?? `PFI #${pfi.id}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-gray-500">
                        {pfi.smr_id ? `SMR #${pfi.smr_id}` : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {pfi.supplier?.name ?? pfi.supplier_name ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-gray-800">
                        {pfi.total_value != null ? Number(pfi.total_value).toLocaleString() : '—'}
                      </TableCell>
                      <TableCell><PfiStatusBadge status={pfi.status ?? 'pending'} /></TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {pfi.created_at ? new Date(pfi.created_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell><ChevronRight className="w-3.5 h-3.5 text-gray-300" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── PFI Detail Sheet ─────────────────────────────────── */}
      <Sheet open={!!selectedPfi} onOpenChange={open => { if (!open) setSelectedPfi(null); }}>
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          {selectedPfi && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  {selectedPfi.pfi_number ?? `PFI #${selectedPfi.id}`}
                </SheetTitle>
                <SheetDescription><PfiStatusBadge status={selectedPfi.status ?? 'pending'} /></SheetDescription>
              </SheetHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Supplier</p>
                    <p className="font-medium">{selectedPfi.supplier?.name ?? selectedPfi.supplier_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Contact</p>
                    <p className="text-gray-700">{selectedPfi.supplier?.contact ?? selectedPfi.supplier_contact ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Validity</p>
                    <p className="text-gray-700">{selectedPfi.validity_days ? `${selectedPfi.validity_days} days` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Linked SMR</p>
                    <p className="font-mono text-amber-700">{selectedPfi.smr_id ? `SMR #${selectedPfi.smr_id}` : '—'}</p>
                  </div>
                </div>
                {Array.isArray(selectedPfi.items) && selectedPfi.items.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Items</p>
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
                          {selectedPfi.items.map((item: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs">{item.item_name}</TableCell>
                              <TableCell className="text-xs">{item.quantity} {item.unit}</TableCell>
                              <TableCell className="text-xs">{Number(item.unit_price).toLocaleString()}</TableCell>
                              <TableCell className="text-xs font-semibold">
                                {Number(item.total_price ?? item.quantity * item.unit_price).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {selectedPfi.total_value != null && (
                        <div className="flex justify-end mt-2">
                          <span className="text-sm font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded">
                            Total: {Number(selectedPfi.total_value).toLocaleString()} TZS
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Create PFI Dialog ───────────────────────────────── */}
      {canCreate && (
        <Dialog open={showCreate} onOpenChange={open => { if (!open) { setShowCreate(false); setFormError(''); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-600" />
                Submit Performa Invoice
              </DialogTitle>
              {sourceSmr && (
                <p className="text-xs text-gray-500 pt-1">
                  For{' '}
                  <span className="font-mono text-amber-700 font-medium">
                    {sourceSmr.smr_number ?? `SMR #${sourceSmr.id}`}
                  </span>
                  {' '}· {sourceSmr.farm?.name ?? `Farm #${sourceSmr.farm_id}`}
                </p>
              )}
            </DialogHeader>

            <div className="space-y-4 py-1">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Select a supplier…" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedSupplier && (
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1.5">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{selectedSupplier.contact ?? '—'}</span>
                    {selectedSupplier.payment_terms && (
                      <span className="border-l pl-2">{selectedSupplier.payment_terms}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Validity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Validity (days)</label>
                <Input
                  type="number"
                  min="1"
                  value={validityDays}
                  onChange={e => setValidityDays(e.target.value)}
                  className="w-32"
                />
              </div>

              {/* Items — pre-filled from SMR, officer enters unit_price */}
              {formItems.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Items (unit prices required) *</label>
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1 mb-1">
                    <div className="col-span-5">Item</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Unit</div>
                    <div className="col-span-3">Unit price</div>
                  </div>
                  {formItems.map((row, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center mb-2">
                      <div className="col-span-5">
                        <Input value={row.item_name} readOnly className="bg-gray-50 text-sm text-gray-600" />
                      </div>
                      <div className="col-span-2">
                        <Input value={row.quantity} readOnly className="bg-gray-50 text-sm text-gray-600" />
                      </div>
                      <div className="col-span-2">
                        <Input value={row.unit} readOnly className="bg-gray-50 text-sm text-gray-600" />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={row.unit_price}
                          onChange={e => setFormItems(p => p.map((r, idx) => idx === i ? { ...r, unit_price: e.target.value } : r))}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                  {totalValue > 0 && (
                    <div className="flex justify-end mt-2">
                      <span className="text-sm font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded">
                        Total: {totalValue.toLocaleString()} TZS
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setShowCreate(false); setFormError(''); }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {submitting ? 'Submitting…' : 'Submit PFI'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
