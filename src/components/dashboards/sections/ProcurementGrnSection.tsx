"use client";

import React, { useState, useCallback, useRef } from 'react';
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
import { Plus, Trash2, PackageCheck, AlertCircle, RefreshCw, CheckCircle2, Upload, FileText, ExternalLink } from 'lucide-react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

// ─── Linked-mode item ────────────────────────────────────────────────────────

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

const emptyLinkedItem = (): GrnItem => ({
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

// ─── Direct-mode item ─────────────────────────────────────────────────────────

interface DirectItem {
  price_list_id: string;
  quantity_received: string;
  unit_price: string;
  condition: 'good' | 'damaged' | 'wrong_item' | 'expired';
}

const emptyDirectItem = (): DirectItem => ({
  price_list_id: '',
  quantity_received: '',
  unit_price: '',
  condition: 'good',
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const grnStatusColor: Record<string, string> = {
  pending:         'bg-yellow-100 text-yellow-800',
  inspected:       'bg-blue-100 text-blue-800',
  cardex_updated:  'bg-green-100 text-green-800',
  rejected:        'bg-red-100 text-red-800',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const ProcurementGrnSection: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Step tracking (1 = create, 2 = upload document)
  const [step, setStep] = useState<1 | 2>(1);
  const [createdGrnId, setCreatedGrnId] = useState<number | null>(null);
  const [createdGrnNumber, setCreatedGrnNumber] = useState('');
  const [dnPhotoFile, setDnPhotoFile] = useState<File | null>(null);
  const [dnPhotoUrl, setDnPhotoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail sheet
  const [selectedGrn, setSelectedGrn] = useState<any>(null);
  const [grnDetail, setGrnDetail] = useState<any>(null);
  const [grnChain, setGrnChain] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Shared
  const [mode, setMode] = useState<'linked' | 'direct'>('linked');

  // Linked mode
  const [lpoId, setLpoId] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [inspectionStatus, setInspectionStatus] = useState<'pending' | 'passed' | 'failed'>('pending');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [qualityRating, setQualityRating] = useState('');
  const [inspectionPhotos, setInspectionPhotos] = useState('');
  const [deliveryPhotos, setDeliveryPhotos] = useState('');
  const [items, setItems] = useState<GrnItem[]>([emptyLinkedItem()]);

  // Direct mode
  const [farmName, setFarmName] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierDnRef, setSupplierDnRef] = useState('');
  const [directQuality, setDirectQuality] = useState('');
  const [directNotes, setDirectNotes] = useState('');
  const [directItems, setDirectItems] = useState<DirectItem[]>([emptyDirectItem()]);

  const getGrns = useCallback(() => apiService.getGrns(), []);
  const { data: grns, loading, error, refetch } = useApi(getGrns);

  const updateItem = (i: number, patch: Partial<GrnItem>) =>
    setItems(prev => prev.map((row, idx) => idx === i ? { ...row, ...patch } : row));

  const updateDirectItem = (i: number, patch: Partial<DirectItem>) =>
    setDirectItems(prev => prev.map((row, idx) => idx === i ? { ...row, ...patch } : row));

  const resetForm = () => {
    setStep(1);
    setCreatedGrnId(null);
    setCreatedGrnNumber('');
    setDnPhotoFile(null);
    setDnPhotoUrl('');
    setMode('linked');
    setLpoId(''); setDeliveryNote(''); setCarrierName(''); setVehicleNo('');
    setInspectionStatus('pending'); setInspectionNotes(''); setQualityRating('');
    setInspectionPhotos(''); setDeliveryPhotos('');
    setItems([emptyLinkedItem()]);
    setFarmName(''); setSupplierName(''); setSupplierDnRef('');
    setDirectQuality(''); setDirectNotes('');
    setDirectItems([emptyDirectItem()]);
    setFormError('');
  };

  // ── Step 1 submit ──────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setFormError('');

    if (mode === 'linked') {
      const validItems = items.filter(r => r.item_name.trim());
      if (validItems.length === 0) { setFormError('Add at least one item.'); return; }
      if (!lpoId) { setFormError('LPO ID is required.'); return; }

      setSubmitting(true);
      try {
        const payload: any = {
          lpo_id: parseInt(lpoId),
          delivery_note_number: deliveryNote.trim() || undefined,
          carrier_name: carrierName.trim() || undefined,
          vehicle_number: vehicleNo.trim() || undefined,
          inspection_status: inspectionStatus,
        };
        if (inspectionNotes.trim()) payload.inspection_notes = inspectionNotes.trim();
        if (qualityRating) payload.quality_rating = parseInt(qualityRating);
        if (inspectionPhotos.trim()) payload.inspection_photos = inspectionPhotos.trim();
        if (deliveryPhotos.trim()) payload.delivery_photos = deliveryPhotos.trim();
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

        const result = await apiService.createGrn(payload);
        setCreatedGrnId(result.id ?? result.grn_id ?? null);
        setCreatedGrnNumber(result.grn_number ?? `#${result.id ?? ''}`);
        setStep(2);
      } catch (err: any) {
        setFormError(err?.response?.data?.detail || err?.message || 'Failed to create GRN');
      } finally {
        setSubmitting(false);
      }
    } else {
      // Direct mode
      if (!farmName.trim()) { setFormError('Farm name is required.'); return; }
      if (!supplierName.trim()) { setFormError('Supplier name is required.'); return; }
      const validDirectItems = directItems.filter(r => r.price_list_id.trim() && r.quantity_received.trim());
      if (validDirectItems.length === 0) { setFormError('Add at least one item with Price List ID and quantity.'); return; }

      setSubmitting(true);
      try {
        const payload: any = {
          farm_name: farmName.trim(),
          supplier_name: supplierName.trim(),
          supplier_dn_reference: supplierDnRef.trim() || undefined,
          notes: directNotes.trim() || undefined,
          items: validDirectItems.map(r => ({
            price_list_id: parseInt(r.price_list_id),
            quantity_received: parseFloat(r.quantity_received),
            unit_price: parseFloat(r.unit_price) || 0,
            condition: r.condition,
          })),
        };
        if (directQuality) payload.quality_rating = parseInt(directQuality);

        const result = await apiService.createDirectReceipt(payload);
        setCreatedGrnId(result.id);
        setCreatedGrnNumber(result.grn_number ?? `#${result.id}`);
        setStep(2);
      } catch (err: any) {
        setFormError(err?.response?.data?.detail || err?.message || 'Failed to create GRN');
      } finally {
        setSubmitting(false);
      }
    }
  };

  // ── Step 2: upload DN photo ────────────────────────────────────────────────

  const handleUploadDnPhoto = async () => {
    if (!dnPhotoFile || createdGrnId === null) return;
    setSubmitting(true);
    try {
      if (mode === 'linked') {
        await apiService.uploadGrnDocument(createdGrnId, dnPhotoFile);
      } else {
        const result = await apiService.uploadDnPhoto(createdGrnId, dnPhotoFile);
        setDnPhotoUrl(result.grn_document_url);
      }
      toast.success('Document uploaded');
      setShowForm(false);
      resetForm();
      refetch();
    } catch (err: any) {
      setFormError(err?.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipUpload = () => {
    toast.success(`GRN ${createdGrnNumber} created`);
    setShowForm(false);
    resetForm();
    refetch();
  };

  const openGrnDetail = async (grn: any) => {
    setSelectedGrn(grn);
    setGrnDetail(null);
    setGrnChain(null);
    setLoadingDetail(true);
    try {
      const [detail, chain] = await Promise.allSettled([
        apiService.getGrnDetail(grn.id),
        grn.grn_number ? apiService.getGrnChain(grn.grn_number) : Promise.resolve(null),
      ]);
      if (detail.status === 'fulfilled') setGrnDetail(detail.value);
      if (chain.status === 'fulfilled') setGrnChain(chain.value);
    } catch { /* non-critical */ }
    finally { setLoadingDetail(false); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

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
                <div key={grn.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer" onClick={() => openGrnDetail(grn)}>
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
                        {grn.farm_name ?? (grn.farm?.name ?? (grn.farm_id ? `Farm #${grn.farm_id}` : 'Farm N/A'))}
                        {grn.supplier_name && ` · ${grn.supplier_name}`}
                        {grn.purchase_order?.po_number && ` · LPO ${grn.purchase_order.po_number}`}
                      </p>
                      {(grn.delivery_note_number || grn.supplier_dn_reference) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          DN: {grn.supplier_dn_reference ?? grn.delivery_note_number}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-400 shrink-0">
                      {grn.created_at && new Date(grn.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* DN document link / thumbnail */}
                  {grn.grn_document_url && (
                    <div className="mt-2 pt-2 border-t border-gray-50">
                      {/\.(jpg|jpeg|png|webp|gif)$/i.test(grn.grn_document_url) ? (
                        <a href={grn.grn_document_url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={grn.grn_document_url}
                            alt="DN document"
                            className="h-16 rounded border border-gray-200 object-cover hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ) : (
                        <a
                          href={grn.grn_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View DN document
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {Array.isArray(grn.items) && grn.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
                      {grn.items.map((item: any, i: number) => (
                        <div key={i} className="text-xs flex justify-between bg-gray-50 rounded px-2 py-1">
                          <span className="text-gray-700 font-medium">{item.item_name ?? `Item #${item.price_list_id}`}</span>
                          <span className="text-gray-500">
                            received {item.quantity_received} {item.unit ?? ''}
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

      {/* GRN Detail Sheet */}
      <Sheet open={!!selectedGrn} onOpenChange={open => { if (!open) { setSelectedGrn(null); setGrnDetail(null); setGrnChain(null); } }}>
        <SheetContent className="sm:max-w-[480px] overflow-y-auto">
          {selectedGrn && (
            <div className="mt-2 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <PackageCheck className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Goods Received Note</p>
                    <h2 className="text-lg font-bold font-mono text-gray-900">{selectedGrn.grn_number ?? `#${selectedGrn.id}`}</h2>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${grnStatusColor[selectedGrn.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {selectedGrn.status?.replace(/_/g, ' ')}
                </span>
              </div>

              {loadingDetail ? (
                <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
              ) : (
                <>
                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Farm', value: (grnDetail ?? selectedGrn).farm_name ?? (grnDetail ?? selectedGrn).farm?.name },
                      { label: 'Supplier', value: (grnDetail ?? selectedGrn).supplier_name },
                      { label: 'DN Reference', value: (grnDetail ?? selectedGrn).supplier_dn_reference ?? (grnDetail ?? selectedGrn).delivery_note_number },
                      { label: 'Carrier', value: (grnDetail ?? selectedGrn).carrier_name },
                      { label: 'Vehicle', value: (grnDetail ?? selectedGrn).vehicle_number },
                      { label: 'Quality Rating', value: (grnDetail ?? selectedGrn).quality_rating },
                      { label: 'Inspection', value: (grnDetail ?? selectedGrn).inspection_status },
                      { label: 'Date', value: selectedGrn.created_at ? new Date(selectedGrn.created_at).toLocaleDateString() : null },
                    ].filter(f => f.value != null).map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className="text-sm font-medium text-gray-800 capitalize">{String(value)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items Received</h3>
                    {((grnDetail ?? selectedGrn).items ?? []).length === 0 ? (
                      <p className="text-sm text-gray-400">No items</p>
                    ) : (
                      <div className="space-y-1">
                        {((grnDetail ?? selectedGrn).items ?? []).map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-xs">
                            <span className="font-medium text-gray-800">{item.item_name ?? `Item #${item.price_list_id}`}</span>
                            <div className="text-right text-gray-500">
                              <span>rcvd {item.quantity_received} {item.unit ?? ''}</span>
                              {item.condition && item.condition !== 'good' && (
                                <span className="ml-1 text-red-600">· {item.condition}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {(grnDetail ?? selectedGrn).inspection_notes && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Inspection Notes</h3>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded p-3">{(grnDetail ?? selectedGrn).inspection_notes}</p>
                    </div>
                  )}

                  {/* Document Chain */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Document Chain</h3>
                    {grnChain ? (
                      <div className="space-y-1">
                        {(['smr', 'lpo', 'grn'] as const).map(key => {
                          const doc = (grnChain as any)[key];
                          if (!doc) return null;
                          return (
                            <div key={key} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-xs">
                              <span className="uppercase font-semibold text-gray-500 w-10">{key}</span>
                              <span className="font-mono text-amber-700">
                                {doc.smr_number ?? doc.lpo_number ?? doc.grn_number ?? doc.number ?? `#${doc.id}`}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full ${grnStatusColor[doc.status?.toLowerCase()] ?? 'bg-gray-100 text-gray-700'}`}>
                                {doc.status?.replace(/_/g, ' ')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Chain data unavailable</p>
                    )}
                  </div>

                  {/* Document link */}
                  {(grnDetail ?? selectedGrn).grn_document_url && (
                    <a
                      href={(grnDetail ?? selectedGrn).grn_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900"
                    >
                      <FileText className="w-4 h-4" /> View GRN Document <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create GRN Dialog */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-amber-600" />
              {step === 1 ? 'Receive Goods' : 'Upload Delivery Note Photo'}
            </DialogTitle>
          </DialogHeader>

          {/* ── Step 2: DN photo upload ── */}
          {step === 2 ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                GRN <span className="font-mono font-semibold mx-1">{createdGrnNumber}</span> created successfully.
              </div>

              <p className="text-sm text-gray-600">
                Upload a photo or scan of the supplier&apos;s Delivery Note to attach it to this GRN.
              </p>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">
                  {formError}
                </div>
              )}

              <div
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-amber-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={e => setDnPhotoFile(e.target.files?.[0] ?? null)}
                />
                {dnPhotoFile ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                    <FileText className="w-4 h-4 text-amber-600" />
                    {dnPhotoFile.name}
                    <span className="text-gray-400">({(dnPhotoFile.size / 1024).toFixed(0)} KB)</span>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-60" />
                    <p className="text-sm">Click to select image or PDF</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleSkipUpload} disabled={submitting}>
                  Skip for now
                </Button>
                <Button
                  onClick={handleUploadDnPhoto}
                  disabled={!dnPhotoFile || submitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {submitting ? 'Uploading…' : 'Upload & Finish'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
          /* ── Step 1: create GRN form ── */
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

            {/* ── Direct mode fields ── */}
            {mode === 'direct' && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
                  Direct entry records delivery against a supplier without a linked LPO. You&apos;ll be able to attach the supplier&apos;s DN photo in the next step.
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name *</label>
                    <Input value={farmName} onChange={e => setFarmName(e.target.value)} placeholder="e.g. Meru Farm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                    <Input value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="e.g. ABC Supplies Ltd" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier DN Reference</label>
                    <Input value={supplierDnRef} onChange={e => setSupplierDnRef(e.target.value)} placeholder="DN-2024-001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quality Rating <span className="text-gray-400 font-normal">(1–5)</span></label>
                    <Input type="number" min="1" max="5" value={directQuality} onChange={e => setDirectQuality(e.target.value)} placeholder="1–5" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                    <Input value={directNotes} onChange={e => setDirectNotes(e.target.value)} placeholder="Delivery condition, remarks…" />
                  </div>
                </div>

                {/* Direct items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Received Items *</label>
                    <button
                      type="button"
                      onClick={() => setDirectItems(p => [...p, emptyDirectItem()])}
                      className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add item
                    </button>
                  </div>
                  <div className="space-y-2">
                    {directItems.map((row, i) => (
                      <div key={i} className="border border-gray-100 rounded-lg p-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">Price List ID *</label>
                            <Input
                              type="number"
                              value={row.price_list_id}
                              onChange={e => updateDirectItem(i, { price_list_id: e.target.value })}
                              placeholder="ID"
                              className="text-sm"
                            />
                          </div>
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
                          <div className="flex gap-2 items-center">
                            <div className="flex-1">
                              <label className="text-xs text-gray-500 mb-0.5 block">Condition</label>
                              <select
                                value={row.condition}
                                onChange={e => updateDirectItem(i, { condition: e.target.value as DirectItem['condition'] })}
                                className="border border-gray-200 rounded px-2 py-1.5 text-xs bg-white w-full"
                              >
                                <option value="good">Good</option>
                                <option value="damaged">Damaged</option>
                                <option value="wrong_item">Wrong item</option>
                                <option value="expired">Expired</option>
                              </select>
                            </div>
                            {directItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setDirectItems(p => p.filter((_, idx) => idx !== i))}
                                className="text-red-400 hover:text-red-600 mt-4"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Linked mode fields ── */}
            {mode === 'linked' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="col-span-1 sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">LPO ID *</label>
                    <Input type="number" value={lpoId} onChange={e => setLpoId(e.target.value)} placeholder="Local Purchase Order ID" />
                  </div>
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

                {/* Linked items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Received Items *</label>
                    <button
                      type="button"
                      onClick={() => setItems(p => [...p, emptyLinkedItem()])}
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

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">Ordered</label>
                            <Input type="number" min="0" step="0.01" value={row.quantity_ordered} onChange={e => updateItem(i, { quantity_ordered: e.target.value })} placeholder="0" className="text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">Received</label>
                            <Input type="number" min="0" step="0.01" value={row.quantity_received} onChange={e => updateItem(i, { quantity_received: e.target.value })} placeholder="0" className="text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">Accepted ✓</label>
                            <Input type="number" min="0" step="0.01" value={row.quantity_accepted} onChange={e => updateItem(i, { quantity_accepted: e.target.value })} placeholder="= received" className="text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-0.5 block">Rejected ✕</label>
                            <Input type="number" min="0" step="0.01" value={row.quantity_rejected} onChange={e => updateItem(i, { quantity_rejected: e.target.value })} placeholder="0" className="text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-0.5 block">LPO Item ID <span className="text-gray-400">(optional)</span></label>
                          <Input type="number" value={row.lpo_item_id} onChange={e => updateItem(i, { lpo_item_id: e.target.value })} placeholder="Links to LPO line item" className="text-sm" />
                        </div>
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
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white">
                {submitting ? 'Creating…' : mode === 'direct' ? 'Create GRN & Continue' : 'Create GRN'}
              </Button>
            </DialogFooter>
          </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
