"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2, Plus, RefreshCw, AlertCircle, Pencil, Eye, Phone, Mail, MapPin, FileText, CheckCircle2, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface SupplierForm {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  vrn: string;
  payment_terms: string;
}

const emptyForm = (): SupplierForm => ({
  name: '', contact_person: '', email: '', phone: '',
  address: '', tax_id: '', vrn: '', payment_terms: '',
});

export const ProcurementSuppliersSection: React.FC = () => {
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<any>(null);   // supplier being edited
  const [viewing, setViewing]       = useState<any>(null);   // supplier in detail sheet
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');
  const [form, setForm]             = useState<SupplierForm>(emptyForm());

  const fetchSuppliers = useCallback(() => apiService.getSuppliers(), []);
  const { data: suppliers, loading, error, refetch } = useApi(fetchSuppliers);
  const list = Array.isArray(suppliers) ? suppliers : [];

  const setField = (key: keyof SupplierForm, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (supplier: any) => {
    setEditing(supplier);
    setForm({
      name:           supplier.name ?? '',
      contact_person: supplier.contact_person ?? '',
      email:          supplier.email ?? '',
      phone:          supplier.phone ?? '',
      address:        supplier.address ?? '',
      tax_id:         supplier.tax_id ?? '',
      vrn:            supplier.vrn ?? '',
      payment_terms:  supplier.payment_terms ?? '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm());
    setFormError('');
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!form.name.trim()) { setFormError('Supplier name is required.'); return; }
    setSubmitting(true);
    try {
      const payload: Record<string, any> = { name: form.name.trim() };
      if (form.contact_person.trim()) payload.contact_person = form.contact_person.trim();
      if (form.email.trim())          payload.email          = form.email.trim();
      if (form.phone.trim())          payload.phone          = form.phone.trim();
      if (form.address.trim())        payload.address        = form.address.trim();
      if (form.tax_id.trim())         payload.tax_id         = form.tax_id.trim();
      if (form.vrn.trim())            payload.vrn            = form.vrn.trim();
      if (form.payment_terms.trim())  payload.payment_terms  = form.payment_terms.trim();

      if (editing) {
        await apiService.updateSupplier(editing.id, payload);
        toast.success('Supplier updated');
      } else {
        await apiService.createSupplier(payload);
        toast.success('Supplier added');
      }
      handleClose();
      refetch();
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || err?.message || 'Failed to save supplier');
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
              <Building2 className="w-4 h-4 text-amber-600" />
              Suppliers
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" onClick={openAdd} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="w-3.5 h-3.5" /> Add Supplier
              </Button>
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
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No suppliers yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">Contact Person</TableHead>
                  <TableHead className="text-xs font-semibold">Phone</TableHead>
                  <TableHead className="text-xs font-semibold">Email</TableHead>
                  <TableHead className="text-xs font-semibold">Payment Terms</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((s: any) => (
                  <TableRow key={s.id} className="hover:bg-amber-50/30">
                    <TableCell className="font-medium text-sm text-gray-900">{s.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{s.contact_person ?? '—'}</TableCell>
                    <TableCell className="text-sm text-gray-500">{s.phone ?? '—'}</TableCell>
                    <TableCell className="text-sm text-gray-500">{s.email ?? '—'}</TableCell>
                    <TableCell className="text-sm text-gray-500">{s.payment_terms ?? '—'}</TableCell>
                    <TableCell>
                      {s.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewing(s)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!viewing} onOpenChange={open => { if (!open) setViewing(null); }}>
        <SheetContent className="sm:max-w-[400px] overflow-y-auto">
          {viewing && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  {viewing.name}
                </SheetTitle>
                {viewing.is_active ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full w-fit">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full w-fit">
                    <XCircle className="w-3 h-3" /> Inactive
                  </span>
                )}
              </SheetHeader>
              <div className="space-y-4 text-sm">
                {[
                  { icon: Building2, label: 'Contact Person', value: viewing.contact_person },
                  { icon: Phone,     label: 'Phone',          value: viewing.phone },
                  { icon: Mail,      label: 'Email',          value: viewing.email },
                  { icon: MapPin,    label: 'Address',        value: viewing.address },
                  { icon: FileText,  label: 'Tax ID',         value: viewing.tax_id },
                  { icon: FileText,  label: 'VRN',            value: viewing.vrn },
                  { icon: FileText,  label: 'Payment Terms',  value: viewing.payment_terms },
                ].map(({ icon: Icon, label, value }) => value ? (
                  <div key={label} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-gray-800">{value}</p>
                    </div>
                  </div>
                ) : null)}
                <div className="pt-1">
                  <Button
                    className="w-full gap-2"
                    variant="outline"
                    onClick={() => { setViewing(null); openEdit(viewing); }}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit Supplier
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) handleClose(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              {editing ? 'Edit Supplier' : 'Add Supplier'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
              <Input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Company name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <Input value={form.contact_person} onChange={e => setField('contact_person', e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+255…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="supplier@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                <Input value={form.tax_id} onChange={e => setField('tax_id', e.target.value)} placeholder="TIN number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VRN <span className="text-gray-400 font-normal text-xs">(VAT Reg. No.)</span></label>
                <Input value={form.vrn} onChange={e => setField('vrn', e.target.value)} placeholder="VAT registration number" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <Input value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Physical address" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <Input value={form.payment_terms} onChange={e => setField('payment_terms', e.target.value)} placeholder="e.g. Net 30, COD, 50% advance" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white">
              {submitting ? 'Saving…' : editing ? 'Update Supplier' : 'Add Supplier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
