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
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Receipt, RefreshCw, Plus, AlertCircle, FileText, Building2,
  ChevronLeft, Eye, ChevronRight, Calendar, Package,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Status colour maps ─────────────────────────────────────────────────────────

const PFI_STATUS_COLORS: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  selected: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const SMR_STATUS_COLORS: Record<string, string> = {
  draft:               'bg-gray-100 text-gray-700 border-gray-200',
  pending_approval:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_gm_approval: 'bg-orange-100 text-orange-800 border-orange-200',
  pending_md_approval: 'bg-amber-100 text-amber-800 border-amber-200',
  approved:            'bg-green-100 text-green-800 border-green-200',
  rejected:            'bg-red-100 text-red-800 border-red-200',
  ordered:             'bg-blue-100 text-blue-800 border-blue-200',
};

function PfiStatusBadge({ status }: { status: string }) {
  const cls = PFI_STATUS_COLORS[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function SmrStatusBadge({ status }: { status: string }) {
  const cls = SMR_STATUS_COLORS[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

type View = 'list' | 'create' | 'smr-pfis';

interface PfiFormItem {
  smr_item_id: number;
  item_name: string;
  quantity: string;
  unit: string;
  unit_price: string;
}

// ── Main component ─────────────────────────────────────────────────────────────

export const ProcurementPfiSection: React.FC = () => {
  const [view, setView]               = useState<View>('list');
  const [listTab, setListTab]         = useState<'smrs' | 'all-pfis'>('smrs');
  const [selectedSmr, setSelectedSmr] = useState<any>(null);
  const [selectedPfi, setSelectedPfi] = useState<any>(null);
  const [smrStatusFilter, setSmrStatusFilter] = useState('');

  // ── SMR list ───────────────────────────────────────────────────────────────
  const fetchSmrs = useCallback(
    () => apiService.getProcurementSmrs(smrStatusFilter ? { status: smrStatusFilter } : undefined),
    [smrStatusFilter],
  );
  const { data: smrs, loading: loadingSmrs, error: smrError, refetch: refetchSmrs } = useApi(fetchSmrs);
  const smrList = Array.isArray(smrs) ? smrs : [];

  // ── All PFIs list ──────────────────────────────────────────────────────────
  const fetchAllPfis = useCallback(() => apiService.getPfis(), []);
  const { data: allPfis, loading: loadingAllPfis, error: allPfiError, refetch: refetchAllPfis } = useApi(fetchAllPfis);
  const allPfiList = Array.isArray(allPfis) ? allPfis : [];

  // ── PFIs for a single SMR ──────────────────────────────────────────────────
  const fetchSmrPfis = useCallback(
    () => selectedSmr ? apiService.getPfisBySmr(selectedSmr.id) : Promise.resolve([]),
    [selectedSmr],
  );
  const { data: smrPfis, loading: loadingSmrPfis, error: smrPfiError, refetch: refetchSmrPfis } = useApi(fetchSmrPfis);
  const smrPfiList = Array.isArray(smrPfis) ? smrPfis : [];

  // ── Suppliers ──────────────────────────────────────────────────────────────
  const [suppliers, setSuppliers]     = useState<any[]>([]);
  const [loadingSupp, setLoadingSupp] = useState(false);
  const loadSuppliers = async () => {
    if (suppliers.length) return;
    setLoadingSupp(true);
    try { setSuppliers(await apiService.getSuppliers()); }
    catch { /* non-critical */ }
    finally { setLoadingSupp(false); }
  };

  // ── Create PFI form state ──────────────────────────────────────────────────
  const [supplierId, setSupplierId]       = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validityDays, setValidityDays]   = useState('30');
  const [paymentTerms, setPaymentTerms]   = useState('');
  const [currency, setCurrency]           = useState('TZS');
  const [hardCopyUrl, setHardCopyUrl]     = useState('');
  const [hardCopyReceived, setHardCopyReceived] = useState(false);
  const [formItems, setFormItems]         = useState<PfiFormItem[]>([]);
  const [formError, setFormError]         = useState('');
  const [submitting, setSubmitting]       = useState(false);

  const openCreate = (smr: any) => {
    setSelectedSmr(smr);
    setSupplierId('');
    setQuotationDate(new Date().toISOString().split('T')[0]);
    setValidityDays('30');
    setPaymentTerms('');
    setCurrency('TZS');
    setHardCopyUrl('');
    setHardCopyReceived(false);
    setFormItems(
      Array.isArray(smr.items) && smr.items.length > 0
        ? smr.items.map((it: any) => ({
            smr_item_id: it.id,
            item_name:   it.item_name ?? '',
            quantity:    String(it.quantity ?? it.quantity_requested ?? ''),
            unit:        it.unit ?? '',
            unit_price:  '',
          }))
        : [],
    );
    setFormError('');
    loadSuppliers();
    setView('create');
  };

  const openSmrPfis = (smr: any) => {
    setSelectedSmr(smr);
    setView('smr-pfis');
  };

  const totalValue = formItems.reduce(
    (s, r) => s + (parseFloat(r.quantity) || 0) * (parseFloat(r.unit_price) || 0),
    0,
  );

  const handleSubmit = async () => {
    setFormError('');
    if (!supplierId) { setFormError('Select a supplier.'); return; }
    if (!quotationDate) { setFormError('Enter a quotation date.'); return; }
    const valid = formItems.filter(r => r.item_name && r.quantity && r.unit_price);
    if (valid.length === 0) { setFormError('Fill in unit prices for at least one item.'); return; }
    setSubmitting(true);
    try {
      await apiService.createPfi({
        smr_id:             selectedSmr.id,
        supplier_id:        parseInt(supplierId),
        farm_id:            selectedSmr.farm_id,
        quotation_date:     quotationDate,
        validity_period:    parseInt(validityDays) || 30,
        payment_terms:      paymentTerms || undefined,
        currency,
        hard_copy_scan_url: hardCopyUrl || undefined,
        hard_copy_received: hardCopyReceived,
        items: valid.map(r => ({
          smr_item_id: r.smr_item_id,
          item_name:   r.item_name,
          quantity:    parseFloat(r.quantity),
          unit:        r.unit,
          unit_price:  parseFloat(r.unit_price),
        })),
      });
      toast.success('PFI submitted successfully');
      refetchSmrs();
      refetchAllPfis();
      setView('list');
    } catch (err: any) {
      setFormError(getApiError(err, 'Failed to submit PFI'));
    } finally { setSubmitting(false); }
  };

  const selectedSupplier = suppliers.find(s => String(s.id) === supplierId);

  // ── Page 3 — PFIs for a specific SMR ──────────────────────────────────────

  if (view === 'smr-pfis' && selectedSmr) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button size="sm" variant="outline" onClick={() => setView('list')} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-900">
              PFIs for{' '}
              <span className="font-mono text-amber-700">{selectedSmr.smr_number ?? `SMR #${selectedSmr.id}`}</span>
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{selectedSmr.farm?.name ?? `Farm #${selectedSmr.farm_id}`}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetchSmrPfis()} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* SMR summary card */}
        <Card className="border-amber-100 bg-amber-50/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">SMR Summary</p>
                <SmrStatusBadge status={selectedSmr.status} />
              </div>
              {selectedSmr.created_at && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">Submitted</p>
                  <p className="text-sm text-gray-600">{new Date(selectedSmr.created_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            {selectedSmr.justification && (
              <p className="text-sm text-gray-600 mb-4">{selectedSmr.justification}</p>
            )}
            {Array.isArray(selectedSmr.items) && selectedSmr.items.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  <Package className="w-3.5 h-3.5 inline mr-1" />
                  {selectedSmr.items.length} item{selectedSmr.items.length > 1 ? 's' : ''} requested
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedSmr.items.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-white border border-amber-100 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-700 font-medium">{it.item_name}</span>
                      <span className="text-sm text-amber-700 font-semibold ml-2 shrink-0">
                        {it.quantity ?? it.quantity_requested} {it.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {smrPfiError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{smrPfiError}</AlertDescription>
          </Alert>
        )}

        {loadingSmrPfis ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : smrPfiList.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-400">
              <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium mb-1">No quotes submitted yet</p>
              <p className="text-sm text-gray-400 mb-5">Be the first to submit a Performa Invoice for this SMR</p>
              {selectedSmr.status === 'approved' && (
                <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2" onClick={() => openCreate(selectedSmr)}>
                  <Plus className="w-4 h-4" /> Submit PFI Quote
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                {smrPfiList.length} quote{smrPfiList.length > 1 ? 's' : ''} submitted — manager selects the winning bid
              </p>
              {selectedSmr.status === 'approved' && (
                <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2" size="sm" onClick={() => openCreate(selectedSmr)}>
                  <Plus className="w-4 h-4" /> Add Another Quote
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {smrPfiList.map((pfi: any) => (
                <Card
                  key={pfi.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border hover:border-amber-200"
                  onClick={() => setSelectedPfi(pfi)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="font-mono text-sm bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-md">
                          {pfi.pfi_number ?? `PFI #${pfi.id}`}
                        </span>
                      </div>
                      <PfiStatusBadge status={pfi.status ?? 'pending'} />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Supplier</p>
                        <p className="text-sm font-semibold text-gray-800">{pfi.supplier?.name ?? pfi.supplier_name ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Total Value</p>
                        <p className="text-sm font-bold text-amber-800">
                          {pfi.total_value != null ? Number(pfi.total_value).toLocaleString() : '—'} {pfi.currency ?? 'TZS'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Validity</p>
                        <p className="text-sm text-gray-700">{pfi.validity_days ? `${pfi.validity_days} days` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Quotation Date</p>
                        <p className="text-sm text-gray-700">{pfi.quotation_date ?? (pfi.created_at ? new Date(pfi.created_at).toLocaleDateString() : '—')}</p>
                      </div>
                    </div>
                    {pfi.payment_terms && (
                      <p className="text-xs text-gray-400 mt-3">Payment: {pfi.payment_terms}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <PfiDetailSheet pfi={selectedPfi} onClose={() => setSelectedPfi(null)} />
      </div>
    );
  }

  // ── Page 2 — Create PFI form ───────────────────────────────────────────────

  if (view === 'create' && selectedSmr) {
    return (
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button size="sm" variant="outline" onClick={() => setView('list')} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-600" />
              Submit Performa Invoice
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              For{' '}
              <span className="font-mono text-amber-700 font-medium">{selectedSmr.smr_number ?? `SMR #${selectedSmr.id}`}</span>
              {' · '}
              {selectedSmr.farm?.name ?? `Farm #${selectedSmr.farm_id}`}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {/* Supplier */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Supplier *</label>
              {loadingSupp ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
                  <LoadingSpinner size="sm" /> Loading suppliers…
                </div>
              ) : (
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a supplier…" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedSupplier && (
                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
                  <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{selectedSupplier.contact ?? '—'}</span>
                  {selectedSupplier.payment_terms && (
                    <span className="border-l pl-3 text-gray-400">{selectedSupplier.payment_terms}</span>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Dates & terms */}
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <Calendar className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
                  Quotation Date *
                </label>
                <Input
                  type="date"
                  value={quotationDate}
                  onChange={e => setQuotationDate(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Validity (days)</label>
                <Input
                  type="number"
                  min="1"
                  value={validityDays}
                  onChange={e => setValidityDays(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Currency</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['TZS', 'USD', 'EUR', 'GBP', 'KES'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Payment Terms</label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select terms…" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Net 30', 'Net 60', 'Net 90', 'On Delivery', 'Immediate', '50% Advance'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Hard copy */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hard_copy_received"
                  checked={hardCopyReceived}
                  onChange={e => setHardCopyReceived(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="hard_copy_received" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Hard copy received
                </label>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Hard Copy Scan URL{' '}
                  <span className="text-gray-400 font-normal text-xs">(optional)</span>
                </label>
                <Input
                  type="url"
                  placeholder="https://…"
                  value={hardCopyUrl}
                  onChange={e => setHardCopyUrl(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <Separator />

            {/* Items */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                <Package className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
                Items — enter unit prices *
              </label>
              {formItems.length === 0 ? (
                <p className="text-sm text-gray-400 py-4">No items found on this SMR.</p>
              ) : (
                <>
                  <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 pb-1 border-b">
                    <div className="col-span-5">Item</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-2">Unit</div>
                    <div className="col-span-3">Price ({currency})</div>
                  </div>
                  <div className="space-y-3">
                    {formItems.map((row, i) => (
                      <div key={i} className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-5">
                          <Input value={row.item_name} readOnly className="bg-gray-50 h-10 text-sm" />
                        </div>
                        <div className="col-span-2">
                          <Input value={row.quantity} readOnly className="bg-gray-50 h-10 text-sm" />
                        </div>
                        <div className="col-span-2">
                          <Input value={row.unit} readOnly className="bg-gray-50 h-10 text-sm" />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={row.unit_price}
                            className="h-10"
                            onChange={e =>
                              setFormItems(p => p.map((r, idx) => idx === i ? { ...r, unit_price: e.target.value } : r))
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalValue > 0 && (
                    <div className="flex justify-end pt-2">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
                        <p className="text-xs text-amber-600 mb-0.5">Total Quote Value</p>
                        <p className="text-lg font-bold text-amber-900">{totalValue.toLocaleString()} {currency}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" size="lg" onClick={() => setView('list')} disabled={submitting}>
                Cancel
              </Button>
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-amber-600 hover:bg-amber-700 text-white px-8"
              >
                {submitting ? 'Submitting…' : 'Submit PFI'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Page 1 — SMR list + All PFIs ──────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Tab toggle */}
      <div className="flex gap-2">
        <Button
          variant={listTab === 'smrs' ? 'default' : 'outline'}
          onClick={() => setListTab('smrs')}
          className="gap-2"
        >
          <FileText className="w-4 h-4" /> SMRs
          {smrList.length > 0 && (
            <span className="ml-1 bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full leading-none">
              {smrList.length}
            </span>
          )}
        </Button>
        <Button
          variant={listTab === 'all-pfis' ? 'default' : 'outline'}
          onClick={() => setListTab('all-pfis')}
          className="gap-2"
        >
          <Receipt className="w-4 h-4" /> All PFIs
        </Button>
        <div className="flex-1" />
        <Button variant="outline" onClick={() => { refetchSmrs(); refetchAllPfis(); }} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* ── SMR list ── */}
      {listTab === 'smrs' && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Material Requisitions (SMR)
            </h2>
            <select
              value={smrStatusFilter}
              onChange={e => setSmrStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">All statuses</option>
              <option value="approved">Approved</option>
              <option value="pending_approval">Pending approval</option>
              <option value="pending_gm_approval">Pending GM approval</option>
              <option value="pending_md_approval">Pending MD approval</option>
              <option value="ordered">Ordered</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {smrError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{smrError}</AlertDescription>
            </Alert>
          )}

          {loadingSmrs ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : smrList.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium">No SMRs found</p>
                <p className="text-sm mt-1">Try changing the status filter above</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {smrList.map((smr: any) => (
                <Card key={smr.id} className="hover:shadow-md transition-shadow border hover:border-amber-100">
                  <CardContent className="p-6">
                    {/* Top row: number, status, date */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-sm bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-md font-semibold">
                          {smr.smr_number ?? `SMR #${smr.id}`}
                        </span>
                        <SmrStatusBadge status={smr.status} />
                      </div>
                      {smr.created_at && (
                        <span className="text-sm text-gray-400 shrink-0">
                          {new Date(smr.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Farm & justification */}
                    <p className="text-base font-semibold text-gray-800 mb-1">
                      {smr.farm?.name ?? `Farm #${smr.farm_id}`}
                    </p>
                    {smr.justification && (
                      <p className="text-sm text-gray-500 mb-4">{smr.justification}</p>
                    )}

                    {/* Items */}
                    {Array.isArray(smr.items) && smr.items.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                        {smr.items.slice(0, 6).map((it: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-700">{it.item_name}</span>
                            <span className="text-sm font-semibold text-gray-500 ml-2 shrink-0">
                              {it.quantity ?? it.quantity_requested} {it.unit}
                            </span>
                          </div>
                        ))}
                        {smr.items.length > 6 && (
                          <div className="flex items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2">
                            <span className="text-xs text-gray-400">+{smr.items.length - 6} more items</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                      <Button
                        variant="outline"
                        onClick={() => openSmrPfis(smr)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" /> View PFIs
                      </Button>
                      {smr.status === 'approved' && (
                        <Button
                          onClick={() => openCreate(smr)}
                          className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                        >
                          <Plus className="w-4 h-4" /> Submit Quote
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── All PFIs ── */}
      {listTab === 'all-pfis' && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              All Performa Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {allPfiError && (
              <Alert variant="destructive" className="mx-6 mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{allPfiError}</AlertDescription>
              </Alert>
            )}
            {loadingAllPfis ? (
              <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
            ) : allPfiList.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium">No PFIs submitted yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="py-4 text-xs font-semibold">PFI No.</TableHead>
                    <TableHead className="py-4 text-xs font-semibold">SMR</TableHead>
                    <TableHead className="py-4 text-xs font-semibold">Supplier</TableHead>
                    <TableHead className="py-4 text-xs font-semibold">Currency</TableHead>
                    <TableHead className="py-4 text-xs font-semibold">Total</TableHead>
                    <TableHead className="py-4 text-xs font-semibold">Status</TableHead>
                    <TableHead className="py-4 text-xs font-semibold">Date</TableHead>
                    <TableHead className="py-4 w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPfiList.map((pfi: any) => (
                    <TableRow
                      key={pfi.id}
                      className="cursor-pointer hover:bg-amber-50/40"
                      onClick={() => setSelectedPfi(pfi)}
                    >
                      <TableCell className="py-4">
                        <span className="font-mono text-sm bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-md">
                          {pfi.pfi_number ?? `PFI #${pfi.id}`}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-sm font-mono text-gray-500">
                        {pfi.smr_id ? `SMR #${pfi.smr_id}` : '—'}
                      </TableCell>
                      <TableCell className="py-4 text-sm font-medium text-gray-700">
                        {pfi.supplier?.name ?? pfi.supplier_name ?? '—'}
                      </TableCell>
                      <TableCell className="py-4 text-sm text-gray-500">{pfi.currency ?? 'TZS'}</TableCell>
                      <TableCell className="py-4 text-sm font-bold text-gray-800">
                        {pfi.total_value != null ? Number(pfi.total_value).toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="py-4"><PfiStatusBadge status={pfi.status ?? 'pending'} /></TableCell>
                      <TableCell className="py-4 text-sm text-gray-400">
                        {pfi.quotation_date ?? (pfi.created_at ? new Date(pfi.created_at).toLocaleDateString() : '—')}
                      </TableCell>
                      <TableCell className="py-4"><ChevronRight className="w-4 h-4 text-gray-300" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <PfiDetailSheet pfi={selectedPfi} onClose={() => setSelectedPfi(null)} />
    </div>
  );
};

// ── PFI Detail Sheet ───────────────────────────────────────────────────────────

const PfiDetailSheet: React.FC<{ pfi: any; onClose: () => void }> = ({ pfi, onClose }) => (
  <Sheet open={!!pfi} onOpenChange={open => { if (!open) onClose(); }}>
    <SheetContent className="sm:max-w-[520px] overflow-y-auto">
      {pfi && (
        <>
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Receipt className="w-5 h-5 text-amber-600" />
              {pfi.pfi_number ?? `PFI #${pfi.id}`}
            </SheetTitle>
            <PfiStatusBadge status={pfi.status ?? 'pending'} />
          </SheetHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Supplier',       value: pfi.supplier?.name ?? pfi.supplier_name ?? '—' },
                { label: 'Contact',        value: pfi.supplier?.contact ?? pfi.supplier_contact ?? '—' },
                { label: 'Currency',       value: pfi.currency ?? 'TZS' },
                { label: 'Quotation Date', value: pfi.quotation_date ?? '—' },
                { label: 'Validity',       value: pfi.validity_days ? `${pfi.validity_days} days` : '—' },
                { label: 'Payment Terms',  value: pfi.payment_terms ?? '—' },
                { label: 'Linked SMR',     value: pfi.smr_id ? `SMR #${pfi.smr_id}` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              ))}
              {pfi.hard_copy_scan_url && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Hard Copy</p>
                  <a href={pfi.hard_copy_scan_url} target="_blank" rel="noreferrer" className="text-amber-600 underline text-sm">
                    View scan
                  </a>
                </div>
              )}
            </div>

            {Array.isArray(pfi.items) && pfi.items.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Items</p>
                  <div className="space-y-2">
                    {pfi.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.item_name}</p>
                          <p className="text-xs text-gray-400">{item.quantity} {item.unit} × {Number(item.unit_price).toLocaleString()}</p>
                        </div>
                        <p className="text-sm font-bold text-amber-800">
                          {Number(item.total_price ?? item.quantity * item.unit_price).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  {pfi.total_value != null && (
                    <div className="flex justify-end mt-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
                        <p className="text-xs text-amber-600 mb-0.5">Total Value</p>
                        <p className="text-lg font-bold text-amber-900">
                          {Number(pfi.total_value).toLocaleString()} {pfi.currency ?? 'TZS'}
                        </p>
                      </div>
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
);
