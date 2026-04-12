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
import { PackageCheck, RefreshCw, Plus, AlertCircle, CheckCircle2, ChevronRight, FileText, Building2, Upload, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { DocLink } from '@/components/procurement/DocLink';

interface Props { userRole: string; farmId?: number; farmName?: string; }

const CAN_CREATE         = ['farm_clerk', 'manager', 'procurement_officer', 'admin'];
const CAN_APPROVE        = ['manager', 'admin'];
const CAN_DIRECT_RECEIPT = ['farm_clerk', 'admin', 'manager'];

const GRN_STATUS_COLORS: Record<string, string> = {
  pending:              'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_fm_approval:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  inspected:            'bg-blue-100 text-blue-700 border-blue-200',
  cardex_updated:       'bg-green-100 text-green-800 border-green-200',
  rejected:             'bg-red-100 text-red-800 border-red-200',
};

const GRN_STATUS_LABELS: Record<string, string> = {
  pending_fm_approval: 'Awaiting FM Approval',
};

function StatusBadge({ status }: { status: string }) {
  const cls = GRN_STATUS_COLORS[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  const label = GRN_STATUS_LABELS[status?.toLowerCase()] ?? status?.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

interface GrnItem {
  lpo_item_id: number | null;
  item_name: string;
  quantity_ordered: string;   // original LPO quantity
  remaining_qty: string;      // remaining to be received (hard limit)
  quantity_received: string;
  quantity_accepted: string;
  unit: string;
  condition: 'good' | 'partial' | 'rejected';
  rejection_reason: string;
}

const INSPECTION_STATUS_STYLES: Record<string, string> = {
  passed:  'bg-green-50 border-green-300 text-green-800',
  partial: 'bg-amber-50 border-amber-300 text-amber-800',
  failed:  'bg-red-50 border-red-300 text-red-800',
};

interface DirectItem {
  price_list_id: string;
  item_name: string;
  unit: string;
  quantity_received: string;
  unit_price: string;
  condition: 'good' | 'damaged' | 'partial';
  notes: string;
}

const emptyDirectItem = (): DirectItem => ({
  price_list_id: '', item_name: '', unit: '', quantity_received: '', unit_price: '', condition: 'good', notes: '',
});

export const SharedGrnSection: React.FC<Props> = ({ userRole, farmId, farmName }) => {
  const canCreate       = CAN_CREATE.includes(userRole);
  const canApprove      = CAN_APPROVE.includes(userRole);
  const canDirectReceipt = CAN_DIRECT_RECEIPT.includes(userRole);

  const [selected, setSelected]       = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving]   = useState<number | null>(null);
  const [formError, setFormError]   = useState('');
  const [grnFile, setGrnFile]       = useState<File | null>(null);

  // LPO picker
  const [availableLpos, setAvailableLpos] = useState<any[]>([]);
  const [loadingLpos, setLoadingLpos]     = useState(false);
  const [lpoId, setLpoId]                 = useState('');
  const [prefill, setPrefill]             = useState<any>(null);
  const [loadingPrefill, setLoadingPrefill] = useState(false);

  // form state
  const [deliveryNote, setDeliveryNote]         = useState('');
  const [carrierName, setCarrierName]           = useState('');
  const [vehicleNo, setVehicleNo]               = useState('');
  const [inspectionNotes, setInspectionNotes]   = useState('');
  const [qualityRating, setQualityRating]       = useState('');
  const [items, setItems]                       = useState<GrnItem[]>([]);

  const [createdGrn, setCreatedGrn]   = useState<any>(null); // holds last created GRN for inspection badge
  // Manager item adjustment
  const [adjustingItem, setAdjustingItem] = useState<{ itemId: number; qty: string; reason: string } | null>(null);
  const [savingAdjust, setSavingAdjust]   = useState(false);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{ grnId: number; reason: string } | null>(null);
  const [rejecting, setRejecting]     = useState(false);

  // Direct Receipt state
  const [showDirect, setShowDirect]           = useState(false);
  const [directItems, setDirectItems]         = useState<DirectItem[]>([emptyDirectItem()]);
  const [directNotes, setDirectNotes]         = useState('');
  const [directFarmName, setDirectFarmName]   = useState('');
  const [directSupplierName, setDirectSupplierName] = useState('');
  const [directSupplierDnRef, setDirectSupplierDnRef] = useState('');
  const [directQualityRating, setDirectQualityRating] = useState('');
  const [directFormError, setDirectFormError] = useState('');
  const [submittingDirect, setSubmittingDirect] = useState(false);
  const [priceLists, setPriceLists]           = useState<any[]>([]);
  const [loadingPriceLists, setLoadingPriceLists] = useState(false);
  const [directFarms, setDirectFarms]         = useState<any[]>([]);
  const [directSuppliers, setDirectSuppliers] = useState<any[]>([]);
  const [loadingDirectMeta, setLoadingDirectMeta] = useState(false);
  // Step 2: DN photo upload after direct receipt
  const [directStep, setDirectStep]           = useState<1 | 2>(1);
  const [directCreatedGrnId, setDirectCreatedGrnId] = useState<number | null>(null);
  const [directCreatedGrnNumber, setDirectCreatedGrnNumber] = useState('');
  const [directDnPhotoFile, setDirectDnPhotoFile] = useState<File | null>(null);
  const directFileInputRef                    = React.useRef<HTMLInputElement>(null);

  const fetchGrns = useCallback(() => apiService.getGrns(), []);
  const { data: grns, loading, error, refetch } = useApi(fetchGrns);
  const list = Array.isArray(grns) ? grns : (grns as any)?.results ?? [];

  // Load eligible LPOs fresh every time the dialog opens
  useEffect(() => {
    if (!showCreate) return;
    setAvailableLpos([]);
    setLoadingLpos(true);
    const ELIGIBLE_STATUSES = ['approved', 'sent', 'sent_to_supplier', 'confirmed', 'partially_fulfilled'];
    apiService.getLposForGrn(farmId)
      .then(data => {
        const list = Array.isArray(data) ? data : (data as any)?.results ?? [];
        // If primary endpoint returned nothing, fall back to filtered list
        if (list.length === 0) {
          return apiService.getLpos({ status: 'sent', ...(farmId ? { farm_id: farmId } : {}) });
        }
        return list;
      })
      .catch(() =>
        apiService.getLpos({ status: 'sent', ...(farmId ? { farm_id: farmId } : {}) })
      )
      .then(data => {
        const list = Array.isArray(data) ? data : (data as any)?.results ?? [];
        setAvailableLpos(list.filter((lpo: any) => ELIGIBLE_STATUSES.includes(lpo.status)));
      })
      .catch(err => toast.error(getApiError(err, 'Failed to load LPOs')))
      .finally(() => setLoadingLpos(false));
  }, [showCreate]);

  // Load farms, suppliers, and price list when Direct Receipt dialog opens
  useEffect(() => {
    if (!showDirect) return;
    setPriceLists([]);
    setLoadingPriceLists(true);
    apiService.getPriceLists(farmId)
      .then(data => setPriceLists(Array.isArray(data) ? data : (data as any)?.results ?? []))
      .catch(() => {})
      .finally(() => setLoadingPriceLists(false));

    setLoadingDirectMeta(true);
    const normalize = (v: any) => Array.isArray(v) ? v : (v?.results ?? []);
    Promise.allSettled([
      apiService.getFarms(userRole),
      apiService.getSuppliers(),
    ]).then(([farmsRes, suppliersRes]) => {
      const farms     = farmsRes.status     === 'fulfilled' ? normalize(farmsRes.value)     : [];
      const suppliers = suppliersRes.status === 'fulfilled' ? normalize(suppliersRes.value) : [];
      setDirectFarms(farms);
      setDirectSuppliers(suppliers);
      if (farmName) setDirectFarmName(farmName);
    }).finally(() => setLoadingDirectMeta(false));
  }, [showDirect]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateDirectItem = (i: number, patch: Partial<DirectItem>) =>
    setDirectItems(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const handlePriceListSelect = (i: number, plId: string) => {
    const pl = priceLists.find((p: any) => String(p.id) === plId);
    updateDirectItem(i, {
      price_list_id: plId,
      item_name: pl?.item_name ?? pl?.name ?? '',
      unit: pl?.unit ?? '',
      unit_price: String(pl?.unit_price ?? pl?.price ?? pl?.rate ?? ''),
    });
  };

  const resetDirect = () => {
    setDirectItems([emptyDirectItem()]);
    setDirectNotes(''); setDirectFarmName(''); setDirectSupplierName('');
    setDirectSupplierDnRef(''); setDirectQualityRating('');
    setDirectFormError('');
    setDirectStep(1); setDirectCreatedGrnId(null); setDirectCreatedGrnNumber('');
    setDirectDnPhotoFile(null);
    setDirectFarms([]); setDirectSuppliers([]);
  };

  const handleDirectSubmit = async () => {
    setDirectFormError('');
    if (!directFarmName.trim()) { setDirectFormError('Farm name is required.'); return; }
    if (!directSupplierName.trim()) { setDirectFormError('Supplier name is required.'); return; }
    const valid = directItems.filter(r => r.price_list_id && parseFloat(r.quantity_received) > 0);
    if (valid.length === 0) { setDirectFormError('Select at least one item and enter a quantity.'); return; }
    setSubmittingDirect(true);
    try {
      const payload: any = {
        farm_name: directFarmName.trim(),
        supplier_name: directSupplierName.trim(),
        supplier_dn_reference: directSupplierDnRef.trim() || undefined,
        notes: directNotes.trim() || undefined,
        items: valid.map(r => ({
          price_list_id: parseInt(r.price_list_id),
          quantity_received: parseFloat(r.quantity_received),
          unit_price: parseFloat(r.unit_price) || 0,
          condition: r.condition,
        })),
      };
      if (directQualityRating) payload.quality_rating = parseInt(directQualityRating);
      const result = await apiService.createDirectReceipt(payload);
      setDirectCreatedGrnId(result.id);
      setDirectCreatedGrnNumber(result.grn_number ?? `#${result.id}`);
      setDirectStep(2);
    } catch (err: any) {
      setDirectFormError(getApiError(err, 'Failed to create direct receipt'));
    } finally { setSubmittingDirect(false); }
  };

  const handleDirectUploadDnPhoto = async () => {
    if (!directDnPhotoFile || directCreatedGrnId === null) return;
    setSubmittingDirect(true);
    try {
      await apiService.uploadDnPhoto(directCreatedGrnId, directDnPhotoFile);
      toast.success('DN photo uploaded');
      setShowDirect(false); resetDirect(); refetch();
    } catch (err: any) {
      setDirectFormError(getApiError(err, 'Upload failed'));
    } finally { setSubmittingDirect(false); }
  };

  const handleDirectSkipUpload = () => {
    toast.success(`Direct receipt ${directCreatedGrnNumber} recorded — stock updated`);
    setShowDirect(false); resetDirect(); refetch();
  };

  const normalizePrefill = (data: any) => ({
    farm_id:       data.farm_id,
    farm_name:     data.farm_name ?? data.farm?.name ?? null,
    lpo_id:        data.lpo_id ?? data.id,
    lpo_number:    data.lpo_number ?? data.po_number,
    smr_id:        data.smr_id,
    smr_number:    data.smr_number ?? data.smr?.smr_number ?? data.smr?.number,
    supplier_name: data.supplier_name ?? data.supplier?.name,
    payment_terms: data.payment_terms,
    delivery_address: data.delivery_address,
    // backend may use items / lpo_items / line_items
    items: data.items ?? data.lpo_items ?? data.line_items ?? [],
  });

  const handleLpoSelect = async (val: string) => {
    setLpoId(val);
    setPrefill(null);
    setItems([]);
    setLoadingPrefill(true);
    try {
      let raw: any;
      try {
        raw = await apiService.getLpoPrefill(parseInt(val));
      } catch {
        raw = await apiService.getLpoDetail(parseInt(val));
      }
      // if prefill returned empty items, get them from the detail endpoint
      const rawItems = raw.items ?? raw.lpo_items ?? raw.line_items ?? [];
      if (rawItems.length === 0) {
        try {
          const detail = await apiService.getLpoDetail(parseInt(val));
          raw = { ...raw, items: detail.items ?? detail.lpo_items ?? detail.line_items ?? [] };
        } catch { /* keep empty */ }
      }
      const normalized = normalizePrefill(raw);
      setPrefill(normalized);
      const sourceItems = Array.isArray(normalized.items) && normalized.items.length > 0
        ? normalized.items.map((it: any) => ({
            lpo_item_id:       it.lpo_item_id ?? it.id ?? null,
            item_name:         it.item_name ?? '',
            quantity_ordered:  String(it.quantity_ordered ?? it.quantity ?? ''),
            remaining_qty:     String(it.quantity_remaining ?? it.remaining_qty ?? it.quantity_ordered ?? it.quantity ?? ''),
            quantity_received: '',
            quantity_accepted: '',
            unit:              it.unit ?? 'kg',
            condition:         'good' as const,
            rejection_reason:  '',
          }))
        : [{ lpo_item_id: null, item_name: '', quantity_ordered: '', remaining_qty: '', quantity_received: '', quantity_accepted: '', unit: 'kg', condition: 'good' as const, rejection_reason: '' }];
      setItems(sourceItems);
    } catch (err: any) {
      toast.error(getApiError(err, 'Failed to load LPO details'));
    } finally {
      setLoadingPrefill(false);
    }
  };

  const updateItem = (i: number, patch: Partial<GrnItem>) =>
    setItems(prev => prev.map((r, idx) => {
      if (idx !== i) return r;
      const updated = { ...r, ...patch };
      // auto-fill accepted = received when received changes
      if ('quantity_received' in patch && !('quantity_accepted' in patch)) {
        updated.quantity_accepted = patch.quantity_received ?? '';
      }
      return updated;
    }));

  // calculated rejection for display
  const calcRejected = (row: GrnItem): number => {
    const recv = parseFloat(row.quantity_received) || 0;
    const acc  = parseFloat(row.quantity_accepted) || 0;
    return Math.max(0, recv - acc);
  };

  const resetForm = () => {
    setLpoId(''); setPrefill(null); setItems([]);
    setDeliveryNote(''); setCarrierName(''); setVehicleNo('');
    setInspectionNotes(''); setQualityRating('');
    setGrnFile(null); setFormError(''); setCreatedGrn(null);
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectModal.reason.trim()) { toast.error('Please provide a rejection reason'); return; }
    setRejecting(true);
    try {
      await apiService.rejectGrn(rejectModal.grnId, rejectModal.reason.trim());
      toast.success('GRN rejected');
      setRejectModal(null); setSelected(null); refetch();
    } catch (err: any) {
      toast.error(getApiError(err, 'Failed to reject GRN'));
    } finally { setRejecting(false); }
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!lpoId || !prefill) { setFormError('Select an LPO first.'); return; }
    const valid = items.filter(r => r.item_name.trim());
    if (valid.length === 0) { setFormError('No items to submit.'); return; }
    const overLimit = valid.find(r => r.remaining_qty && parseFloat(r.quantity_received) > parseFloat(r.remaining_qty));
    if (overLimit) { setFormError(`"${overLimit.item_name}": received (${overLimit.quantity_received}) exceeds remaining qty (${overLimit.remaining_qty}).`); return; }
    const overReceived = valid.find(r => parseFloat(r.quantity_accepted) > parseFloat(r.quantity_received));
    if (overReceived) { setFormError(`"${overReceived.item_name}": accepted cannot exceed received.`); return; }
    setSubmitting(true);
    try {
      const payload: any = {
        farm_id: prefill.farm_id,
        lpo_id: prefill.lpo_id,
        smr_id: prefill.smr_id,
        delivery_note_number: deliveryNote.trim() || undefined,
        carrier_name: carrierName.trim() || undefined,
        vehicle_number: vehicleNo.trim() || undefined,
        items: valid.map(r => ({
          ...(r.lpo_item_id != null ? { lpo_item_id: r.lpo_item_id } : {}),
          item_name: r.item_name,
          quantity_ordered: parseFloat(r.quantity_ordered) || 0,
          quantity_received: parseFloat(r.quantity_received) || 0,
          quantity_accepted: parseFloat(r.quantity_accepted) || parseFloat(r.quantity_received) || 0,
          quantity_rejected: calcRejected(r),
          unit: r.unit,
          condition: r.condition,
          rejection_reason: r.condition !== 'good' ? r.rejection_reason : undefined,
        })),
      };
      if (inspectionNotes.trim()) payload.inspection_notes = inspectionNotes.trim();
      if (qualityRating) payload.quality_rating = parseInt(qualityRating);

      const created = await apiService.createGrn(payload);
      setCreatedGrn(created);
      if (grnFile && created?.id) {
        try {
          await apiService.uploadGrnDocument(created.id, grnFile);
        } catch {
          toast.warning('GRN created but document upload failed');
        }
      }
      toast.success('GRN submitted — awaiting FM approval');
      refetch();
    } catch (err: any) {
      setFormError(getApiError(err, 'Failed to create GRN'));
    } finally { setSubmitting(false); }
  };

  const handleSelect = async (grn: any) => {
    setSelected(grn); // show sheet immediately with list data
    setLoadingDetail(true);
    try {
      const detail = await apiService.getGrnDetail(grn.id);
      setSelected(detail);
    } catch {
      // keep list-level data shown, detail just won't have items
    } finally {
      setLoadingDetail(false);
    }
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
              {canDirectReceipt && (
                <Button size="sm" variant="outline" onClick={() => setShowDirect(true)} className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50">
                  <Plus className="w-3.5 h-3.5" /> Receive Without LPO
                </Button>
              )}
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
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">LPO / SMR</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((grn: any) => {
                  const isDirect = grn.receipt_type === 'direct' || (!grn.lpo_id && !grn.lpo_number);
                  const supplier = grn.supplier_name ?? grn.supplier?.name ?? '';
                  return (
                  <TableRow key={grn.id} className="hover:bg-amber-50/40 cursor-pointer" onClick={() => handleSelect(grn)}>
                    <TableCell>
                      <div>
                        <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                          {grn.grn_number ?? `GRN #${grn.id}`}
                        </span>
                        {supplier && <p className="text-xs text-gray-400 mt-0.5">{supplier}</p>}
                        {(grn.issued_by_name ?? grn.created_by_name) && (
                          <p className="text-xs text-gray-400">by {grn.issued_by_name ?? grn.created_by_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${isDirect ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {isDirect ? 'Direct' : 'LPO Linked'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {!isDirect && (
                        <div className="space-y-0.5">
                          <p className="font-mono text-gray-600">{grn.lpo_number ?? (grn.lpo_id ? `LPO #${grn.lpo_id}` : '—')}</p>
                          {(grn.smr_number || grn.smr_id) && (
                            <p className="font-mono text-blue-600">{grn.smr_number ?? `SMR #${grn.smr_id}`}</p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={grn.status} />
                        {grn.cardex_updated && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {grn.created_at ? new Date(grn.created_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
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
      <Sheet open={!!selected} onOpenChange={open => { if (!open) { setSelected(null); setLoadingDetail(false); } }}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <PackageCheck className="w-4 h-4 text-amber-600" />
                  {selected.grn_number ?? `GRN #${selected.id}`}
                </SheetTitle>
                <SheetDescription asChild>
                  <span className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={selected.status} />
                    {selected.inspection_status && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${INSPECTION_STATUS_STYLES[selected.inspection_status] ?? 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                        Inspection: {selected.inspection_status}
                      </span>
                    )}
                    {selected.cardex_updated && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Stock recorded
                      </span>
                    )}
                    {selected.receipt_type === 'direct' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 border border-blue-200 text-blue-700">
                        Direct Receipt
                      </span>
                    )}
                  </span>
                </SheetDescription>
              </SheetHeader>
              {loadingDetail && (
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <LoadingSpinner size="sm" /> Loading details…
                </div>
              )}
              <div className="space-y-4 text-sm">
                {/* Reference chips — display only, no click */}
                <div className="space-y-1.5">
                  {(selected.lpo_number || selected.lpo_id) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-24 shrink-0">Against LPO</span>
                      <span className="font-mono text-xs bg-gray-100 border border-gray-200 text-gray-700 px-2 py-0.5 rounded">
                        {selected.lpo_number ?? `LPO #${selected.lpo_id}`}
                      </span>
                    </div>
                  )}
                  {(selected.smr_number || selected.smr_id) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-24 shrink-0">Ref SMR</span>
                      <span className="font-mono text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded">
                        {selected.smr_number ?? `SMR #${selected.smr_id}`}
                      </span>
                    </div>
                  )}
                  {(selected.simr_number || selected.simr_id) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-24 shrink-0">Ref SIMR</span>
                      <span className="font-mono text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded">
                        {selected.simr_number ?? `SIMR #${selected.simr_id}`}
                      </span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Farm</p>
                    <p className="font-medium text-gray-800">
                      {selected.farm?.name ?? selected.farm_name ?? (selected.farm_id ? `Farm #${selected.farm_id}` : '—')}
                    </p>
                  </div>
                  {selected.fm_approved_by && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Approved by</p>
                      <p className="font-medium text-gray-800">
                        {typeof selected.fm_approved_by === 'object'
                          ? (selected.fm_approved_by?.full_name ?? selected.fm_approved_by?.username ?? `User #${selected.fm_approved_by?.id}`)
                          : (selected.fm_approved_by_name ?? selected.approved_by_name ?? `User #${selected.fm_approved_by}`)}
                      </p>
                      {selected.fm_approved_at && (
                        <p className="text-xs text-gray-400">{new Date(selected.fm_approved_at).toLocaleString()}</p>
                      )}
                    </div>
                  )}
                  {(selected.issued_by_name ?? selected.created_by_name) && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Issued by</p>
                      <p className="font-medium text-gray-800">{selected.issued_by_name ?? selected.created_by_name}</p>
                    </div>
                  )}
                  {(selected.delivery_note_number || selected.supplier_dn_reference) && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Delivery Note</p>
                      <p className="text-gray-700">{selected.supplier_dn_reference ?? selected.delivery_note_number}</p>
                    </div>
                  )}
                  {selected.grn_document_url && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-1">DN Document</p>
                      {/\.(jpg|jpeg|png|webp|gif)$/i.test(selected.grn_document_url) ? (
                        <a href={selected.grn_document_url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={selected.grn_document_url}
                            alt="DN document"
                            className="h-20 rounded border border-gray-200 object-cover hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ) : (
                        <a
                          href={selected.grn_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View DN document
                        </a>
                      )}
                    </div>
                  )}
                  {selected.carrier_name && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Carrier</p>
                      <p className="text-gray-700">{selected.carrier_name}</p>
                    </div>
                  )}
                  {selected.vehicle_number && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Vehicle</p>
                      <p className="text-gray-700">{selected.vehicle_number}</p>
                    </div>
                  )}
                </div>
                {selected.rejection_reason && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    <span className="font-semibold">Rejection reason: </span>{selected.rejection_reason}
                  </div>
                )}
                {(() => {
                  const grnItems = selected.items ?? selected.grn_items ?? selected.line_items ?? [];
                  return Array.isArray(grnItems) && grnItems.length > 0 ? (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Received Items</p>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-xs">Item</TableHead>
                            <TableHead className="text-xs">Expected</TableHead>
                            <TableHead className="text-xs">Received</TableHead>
                            <TableHead className="text-xs">Accepted</TableHead>
                            <TableHead className="text-xs">Shortage</TableHead>
                            {canApprove && <TableHead className="text-xs w-6" />}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {grnItems.map((item: any, i: number) => {
                            const shortage = item.quantity_shortage ?? ((item.quantity_ordered ?? 0) - (item.quantity_received ?? 0));
                            const isAdjusting = adjustingItem?.itemId === item.id;
                            return (
                              <TableRow key={i}>
                                <TableCell className="text-xs">
                                  <p className="font-medium">{item.item_name}</p>
                                  {item.condition && item.condition !== 'good' && (
                                    <span className="text-red-600 text-xs block">{item.condition.replace(/_/g, ' ')}</span>
                                  )}
                                  {item.rejection_reason && (
                                    <span className="text-gray-400 text-xs block italic">{item.rejection_reason}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-gray-500">{item.quantity_ordered ?? '—'}</TableCell>
                                <TableCell className="text-xs">{item.quantity_received ?? '—'}</TableCell>
                                <TableCell className="text-xs">
                                  {isAdjusting && adjustingItem ? (
                                    <div className="space-y-1">
                                      <Input
                                        type="number" min="0" step="0.01"
                                        value={adjustingItem.qty}
                                        onChange={e => setAdjustingItem(a => a ? { ...a, qty: e.target.value } : a)}
                                        className="h-7 text-xs w-20"
                                      />
                                      <Input
                                        value={adjustingItem.reason}
                                        onChange={e => setAdjustingItem(a => a ? { ...a, reason: e.target.value } : a)}
                                        placeholder="Reason…"
                                        className="h-7 text-xs"
                                      />
                                      <div className="flex gap-1">
                                        <Button size="sm" className="h-6 text-xs px-2 bg-green-600 hover:bg-green-700 text-white" disabled={savingAdjust}
                                          onClick={async () => {
                                            if (!adjustingItem) return;
                                            setSavingAdjust(true);
                                            try {
                                              const updated = await apiService.patchGrnItem(selected.id, item.id, {
                                                quantity_accepted: parseFloat(adjustingItem.qty),
                                                rejection_reason: adjustingItem.reason || undefined,
                                              });
                                              setSelected((prev: any) => ({ ...prev, ...updated }));
                                              setAdjustingItem(null);
                                            } catch (err: any) {
                                              toast.error(getApiError(err, 'Failed to adjust item'));
                                            } finally { setSavingAdjust(false); }
                                          }}>Save</Button>
                                        <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => setAdjustingItem(null)}>✕</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="font-semibold text-green-700">{item.quantity_accepted ?? item.quantity_received ?? '—'}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {shortage > 0 && (
                                    <span className="text-red-600 font-medium text-xs">Short: {shortage}</span>
                                  )}
                                </TableCell>
                                {canApprove && !isAdjusting && selected.status === 'pending_fm_approval' && (
                                  <TableCell>
                                    <button type="button" onClick={() => setAdjustingItem({ itemId: item.id, qty: String(item.quantity_accepted ?? item.quantity_received ?? ''), reason: item.rejection_reason ?? '' })}>
                                      <Pencil className="w-3 h-3 text-gray-400 hover:text-amber-600" />
                                    </button>
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                  ) : null;
                })()}
                {canApprove && (selected.status === 'pending' || selected.status === 'inspected' || selected.status === 'pending_fm_approval') && (
                  <>
                    <Separator />
                    {selected.inspection_status === 'failed' && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        All items were rejected — cannot approve a fully failed GRN.
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                        disabled={approving === selected.id || selected.inspection_status === 'failed'}
                        onClick={() => { handleApprove(selected.id); setSelected(null); }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {approving === selected.id ? 'Approving…' : 'Approve → CARDEX'}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => setRejectModal({ grnId: selected.id, reason: '' })}
                      >
                        Reject
                      </Button>
                    </div>
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

              {/* Step 1: Select LPO */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Select LPO *</label>
                {loadingLpos ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                    <LoadingSpinner size="sm" /> Loading LPOs…
                  </div>
                ) : availableLpos.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No eligible LPOs found. An LPO must be sent to the supplier before goods can be received.</p>
                ) : (
                  <Select value={lpoId} onValueChange={handleLpoSelect}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Choose an LPO…" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLpos.map((lpo: any) => {
                        const num = lpo.lpo_number ?? `LPO #${lpo.id}`;
                        const supplier = lpo.supplier?.name ?? lpo.supplier_name ?? '';
                        const farm = lpo.farm?.name ?? lpo.farm_name ?? '';
                        return (
                          <SelectItem key={lpo.id} value={String(lpo.id)}>
                            {num}{supplier ? ` — ${supplier}` : ''}{farm ? ` (${farm})` : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Step 2: Context header from prefill */}
              {loadingPrefill && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <LoadingSpinner size="sm" /> Loading details…
                </div>
              )}
              {prefill && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Order Details</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-gray-700">
                    <div>
                      <span className="text-gray-400">SMR</span>
                      <p className="font-mono font-semibold text-blue-700">{prefill.smr_number ?? `SMR #${prefill.smr_id}`}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">LPO</span>
                      <p className="font-mono font-semibold">{prefill.lpo_number ?? `LPO #${prefill.lpo_id}`}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Farm</span>
                      <p className="font-medium flex items-center gap-1"><Building2 className="w-3 h-3 text-gray-400" />{prefill.farm_name ?? (prefill.farm_id ? `Farm #${prefill.farm_id}` : '—')}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Supplier</span>
                      <p className="font-medium">{prefill.supplier_name ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Payment Terms</span>
                      <p className="font-medium">{prefill.payment_terms ?? '—'}</p>
                    </div>
                    {prefill.delivery_address && (
                      <div className="col-span-2">
                        <span className="text-gray-400">Delivery To</span>
                        <p className="font-medium">{prefill.delivery_address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Items table — shown once an LPO is selected */}
              {prefill && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Received Items *</p>
                    <button
                      type="button"
                      onClick={() => setItems(p => [...p, { lpo_item_id: null, item_name: '', quantity_ordered: '', remaining_qty: '', quantity_received: '', quantity_accepted: '', unit: 'kg', condition: 'good', rejection_reason: '' }])}
                      className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {items.map((row, i) => {
                      const prefilled = !!row.item_name; // came from backend
                      return (
                        <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50/50">
                          {/* Item name + unit + expected qty */}
                          <div className="flex items-center gap-2">
                            {prefilled ? (
                              <>
                                <div className="flex items-center gap-1.5 flex-1">
                                  <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm font-medium text-gray-800">{row.item_name}</span>
                                </div>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-mono">{row.unit}</span>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500 whitespace-nowrap">
                                    Ordered: <strong>{row.quantity_ordered || '—'}</strong>
                                  </p>
                                  {row.remaining_qty && row.remaining_qty !== row.quantity_ordered && (
                                    <p className="text-xs text-amber-700 font-semibold whitespace-nowrap">
                                      Remaining: {row.remaining_qty}
                                    </p>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
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
                                  className="text-sm w-16"
                                />
                                {items.length > 1 && (
                                  <button type="button" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}>
                                    <span className="text-red-400 text-xs hover:text-red-600">✕</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                          {/* Inline warnings */}
                          {row.remaining_qty && parseFloat(row.quantity_received) > parseFloat(row.remaining_qty) && (
                            <p className="text-xs text-red-600 font-medium">✕ Exceeds remaining qty ({row.remaining_qty}) — reduce received amount</p>
                          )}
                          {!row.remaining_qty && row.quantity_ordered && parseFloat(row.quantity_received) > parseFloat(row.quantity_ordered) && (
                            <p className="text-xs text-amber-600 font-medium">⚠ Over-receipt: received exceeds ordered ({row.quantity_ordered})</p>
                          )}
                          {/* Editable qty fields */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-xs text-gray-500 mb-0.5 block">Received *</label>
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
                                placeholder={row.quantity_received || '0'}
                                className={`text-sm ${parseFloat(row.quantity_accepted) > parseFloat(row.quantity_received) ? 'border-red-400 focus:ring-red-400' : ''}`}
                              />
                              {parseFloat(row.quantity_accepted) > parseFloat(row.quantity_received) && (
                                <p className="text-xs text-red-600 mt-0.5">Cannot exceed received</p>
                              )}
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-0.5 block">Rejected (auto)</label>
                              <div className="h-9 px-3 flex items-center rounded border border-gray-100 bg-gray-100 text-sm text-gray-600 font-mono">
                                {calcRejected(row)}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <select
                              value={row.condition}
                              onChange={e => updateItem(i, { condition: e.target.value as GrnItem['condition'] })}
                              className="border border-gray-200 rounded px-2 py-1.5 text-xs bg-white"
                            >
                              <option value="good">Good condition</option>
                              <option value="partial">Partial delivery</option>
                              <option value="rejected">Rejected</option>
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Optional transport / inspection fields — only show after LPO is selected */}
              {prefill && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quality Rating <span className="text-gray-400 font-normal">(1–5)</span></label>
                      <Input type="number" min="1" max="5" value={qualityRating} onChange={e => setQualityRating(e.target.value)} placeholder="1–5" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                      <Input value={inspectionNotes} onChange={e => setInspectionNotes(e.target.value)} placeholder="Notes from inspection…" />
                    </div>
                  </div>

                  {/* GRN Document Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GRN Document <span className="text-gray-400 font-normal">(optional — PDF / image)</span>
                    </label>
                    {grnFile ? (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm text-green-800">
                        <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="flex-1 truncate">{grnFile.name}</span>
                        <button type="button" onClick={() => setGrnFile(null)} className="text-green-600 hover:text-green-900">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg px-4 py-3 cursor-pointer hover:border-amber-300 hover:bg-amber-50/40 transition-colors">
                        <Upload className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Click to attach document…</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={e => setGrnFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    )}
                  </div>
                </>
              )}
            </div>
            {createdGrn && (
              <div className={`mx-1 mb-2 rounded-lg border px-4 py-3 text-sm font-medium flex items-center gap-2 ${INSPECTION_STATUS_STYLES[createdGrn.inspection_status] ?? 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  GRN submitted — inspection: <strong>{createdGrn.inspection_status ?? 'pending'}</strong>. Awaiting FM approval.
                </span>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }} disabled={submitting}>
                {createdGrn ? 'Close' : 'Cancel'}
              </Button>
              {!createdGrn && (
                <Button onClick={handleSubmit} disabled={submitting || !prefill} className="bg-amber-600 hover:bg-amber-700 text-white">
                  {submitting ? 'Submitting…' : 'Submit GRN'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Direct Receipt Dialog */}
      {canDirectReceipt && (
        <Dialog open={showDirect} onOpenChange={open => { if (!open) { setShowDirect(false); resetDirect(); } }}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                {directStep === 1 ? 'Direct Receipt' : 'Upload Delivery Note Photo'}
              </DialogTitle>
            </DialogHeader>

            {/* ── Step 2: DN photo upload ── */}
            {directStep === 2 ? (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  GRN <span className="font-mono font-semibold mx-1">{directCreatedGrnNumber}</span> created — stock updated immediately.
                </div>
                <p className="text-sm text-gray-600">Attach a photo or scan of the supplier&apos;s Delivery Note for record keeping.</p>
                {directFormError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{directFormError}</AlertDescription>
                  </Alert>
                )}
                <div
                  className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-green-400 transition-colors"
                  onClick={() => directFileInputRef.current?.click()}
                >
                  <input
                    ref={directFileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={e => setDirectDnPhotoFile(e.target.files?.[0] ?? null)}
                  />
                  {directDnPhotoFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                      <FileText className="w-4 h-4 text-green-600" />
                      {directDnPhotoFile.name}
                      <span className="text-gray-400">({(directDnPhotoFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <Upload className="w-8 h-8 mx-auto mb-2 opacity-60" />
                      <p className="text-sm">Click to select image or PDF</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleDirectSkipUpload} disabled={submittingDirect}>
                    Skip for now
                  </Button>
                  <Button
                    onClick={handleDirectUploadDnPhoto}
                    disabled={!directDnPhotoFile || submittingDirect}
                    className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {submittingDirect ? 'Uploading…' : 'Upload & Finish'}
                  </Button>
                </DialogFooter>
              </div>
            ) : (
            /* ── Step 1: form ── */
            <>
            <div className="space-y-4 py-1">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-xs text-green-800">
                Stock is recorded immediately — no FM approval required. You&apos;ll be able to attach the supplier&apos;s DN photo in the next step.
              </div>
              {directFormError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{directFormError}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name *</label>
                  {loadingDirectMeta ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 h-10"><LoadingSpinner size="sm" /> Loading…</div>
                  ) : (
                    <Select value={directFarmName} onValueChange={setDirectFarmName}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select farm…" />
                      </SelectTrigger>
                      <SelectContent>
                        {directFarms.map((f: any, idx: number) => (
                          <SelectItem key={f.id ?? f.farm_id ?? idx} value={f.name}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                  {loadingDirectMeta ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 h-10"><LoadingSpinner size="sm" /> Loading…</div>
                  ) : (
                    <Select value={directSupplierName} onValueChange={setDirectSupplierName}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select supplier…" />
                      </SelectTrigger>
                      <SelectContent>
                        {directSuppliers.map((s: any, idx: number) => (
                          <SelectItem key={s.id ?? idx} value={s.name ?? s.supplier_name}>{s.name ?? s.supplier_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier DN Reference</label>
                  <Input value={directSupplierDnRef} onChange={e => setDirectSupplierDnRef(e.target.value)} placeholder="DN-2024-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quality Rating <span className="text-gray-400 font-normal">(1–5)</span></label>
                  <Input type="number" min="1" max="5" value={directQualityRating} onChange={e => setDirectQualityRating(e.target.value)} placeholder="1–5" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                  <Input value={directNotes} onChange={e => setDirectNotes(e.target.value)} placeholder="Delivery condition, remarks…" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Items *</p>
                  <button
                    type="button"
                    onClick={() => setDirectItems(p => [...p, emptyDirectItem()])}
                    className="text-xs text-green-700 hover:text-green-900 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add item
                  </button>
                </div>
                {loadingPriceLists ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                    <LoadingSpinner size="sm" /> Loading price list…
                  </div>
                ) : priceLists.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No price list items found for this farm.</p>
                ) : (
                  <div className="space-y-3">
                    {directItems.map((row, i) => (
                      <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2 bg-gray-50/50">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 space-y-1">
                            <label className="text-xs text-gray-500">Item from price list *</label>
                            <Select value={row.price_list_id} onValueChange={v => handlePriceListSelect(i, v)}>
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Select item…" />
                              </SelectTrigger>
                              <SelectContent>
                                {priceLists.map((pl: any) => {
                                  const price = pl.unit_price ?? pl.price ?? pl.rate;
                                  return (
                                    <SelectItem key={pl.id} value={String(pl.id)}>
                                      {pl.item_name ?? pl.name} — {pl.unit}
                                      {price != null ? ` · ${Number(price).toLocaleString()} TZS` : ''}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          {directItems.length > 1 && (
                            <button type="button" className="mt-5" onClick={() => setDirectItems(p => p.filter((_, idx) => idx !== i))}>
                              <X className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                            </button>
                          )}
                        </div>
                        {row.item_name && (
                          <div className="flex items-center gap-3 text-xs text-gray-500 bg-white border border-gray-100 rounded px-2 py-1.5">
                            <FileText className="w-3 h-3 text-gray-400" />
                            <span className="font-medium text-gray-700">{row.item_name}</span>
                            <span className="text-gray-400">({row.unit})</span>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">Qty Received *</label>
                            <Input
                              type="number" min="0" step="0.01"
                              value={row.quantity_received}
                              onChange={e => updateDirectItem(i, { quantity_received: e.target.value })}
                              placeholder="0"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">Unit Price</label>
                            <Input
                              type="number" min="0" step="0.01"
                              value={row.unit_price}
                              onChange={e => updateDirectItem(i, { unit_price: e.target.value })}
                              placeholder="0.00"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">Condition</label>
                            <select
                              value={row.condition}
                              onChange={e => updateDirectItem(i, { condition: e.target.value as DirectItem['condition'] })}
                              className="border border-gray-200 rounded px-2 py-2 text-sm bg-white w-full"
                            >
                              <option value="good">Good</option>
                              <option value="damaged">Damaged</option>
                              <option value="partial">Partial</option>
                            </select>
                          </div>
                        </div>
                        {row.condition !== 'good' && (
                          <Input
                            value={row.notes}
                            onChange={e => updateDirectItem(i, { notes: e.target.value })}
                            placeholder="Describe the issue…"
                            className="text-xs"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowDirect(false); resetDirect(); }} disabled={submittingDirect}>Cancel</Button>
              <Button onClick={handleDirectSubmit} disabled={submittingDirect} className="bg-green-600 hover:bg-green-700 text-white">
                {submittingDirect ? 'Recording…' : 'Record Stock & Continue'}
              </Button>
            </DialogFooter>
            </>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Reject GRN Modal */}
      <Dialog open={!!rejectModal} onOpenChange={open => { if (!open) setRejectModal(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700">Reject GRN</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-gray-600">This will reject the GRN and notify the farm clerk. Please provide a reason.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
              <Input
                value={rejectModal?.reason ?? ''}
                onChange={e => setRejectModal(r => r ? { ...r, reason: e.target.value } : r)}
                placeholder="Describe why the GRN is being rejected…"
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal(null)} disabled={rejecting}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={rejecting || !rejectModal?.reason.trim()}
              onClick={handleReject}
            >
              {rejecting ? 'Rejecting…' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
