"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '../../ui/sonner';
import { Plus, Trash2 } from 'lucide-react';

function fmt(n: number | undefined | null) {
  if (n == null) return '—';
  return n.toLocaleString();
}
function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString() : '—';
}

export const StockMbuniSection: React.FC = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, any>>({
    farm_id: '',
    block_name: '',
    block_code: '',
    harvest_date: new Date().toISOString().slice(0, 10),
    num_pickers: '',
    mbuni_kg: '',
    mbuni_to_green_ratio: '',
    payment_mode: 'per_kg',
    paid_per_kg: '',
    price_per_picker: '',
    total_payment: '',
    comments: '',
  });

  const getFarms = useCallback(() => apiService.getStockFarms(), []);
  const { data: farms } = useApi(getFarms);

  const getModalBlocks = useCallback(
    () => form.farm_id ? apiService.getBlocksForFarm(Number(form.farm_id)) : Promise.resolve([]),
    [form.farm_id]
  );
  const { data: modalBlocks, loading: blocksLoading } = useApi(getModalBlocks, { dependencies: [form.farm_id] });

  const getRecords = useCallback(
    () => apiService.getMbuniRecords({ farm_id: selectedFarmId !== 'all' ? Number(selectedFarmId) : undefined }),
    [selectedFarmId]
  );
  const { data: records, loading, refetch } = useApi(getRecords);

  const setField = (k: string, v: any) => setForm(p => ({
    ...p,
    [k]: v,
    ...(k === 'farm_id' ? { block_name: '', block_code: '' } : {}),
  }));

  const handleBlockSelect = (blockName: string) => {
    const block = (modalBlocks || []).find((b: any) => b.name === blockName);
    setForm(p => ({ ...p, block_name: blockName, block_code: block?.code || '' }));
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this mbuni record?')) return;
    setDeleting(id);
    try {
      await apiService.deleteMbuniRecord(id);
      toast.success('Record deleted');
      refetch();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const totalKg = records?.reduce((s: number, r: any) => s + (r.mbuni_kg || 0), 0) || 0;
  const totalPayment = records?.reduce((s: number, r: any) => s + (r.total_payment || 0), 0) || 0;

  const handleSave = async () => {
    const missingRate = form.payment_mode === 'per_day' ? !form.price_per_picker : false;
    if (!form.farm_id || !form.block_name || !form.harvest_date || !form.num_pickers || !form.mbuni_kg || missingRate) {
      toast.error(form.payment_mode === 'per_day'
        ? 'Farm, block, date, pickers, KGs and price per picker are required'
        : 'Farm, block name, date, pickers, and Mbuni KGs are required');
      return;
    }
    setSaving(true);
    try {
      await apiService.createMbuniRecord({
        ...form,
        farm_id: Number(form.farm_id),
        harvest_date: new Date(form.harvest_date).toISOString(),
        num_pickers: Number(form.num_pickers),
        mbuni_kg: Number(form.mbuni_kg),
        mbuni_to_green_ratio: form.mbuni_to_green_ratio ? Number(form.mbuni_to_green_ratio) : null,
        payment_mode: form.payment_mode || 'per_kg',
        paid_per_kg: form.paid_per_kg ? Number(form.paid_per_kg) : null,
        price_per_picker: form.price_per_picker ? Number(form.price_per_picker) : null,
        total_payment: form.total_payment ? Number(form.total_payment) : null,
      });
      toast.success('Mbuni record saved');
      setShowModal(false);
      setForm(p => ({ ...p, block_name: '', block_code: '', num_pickers: '', mbuni_kg: '', payment_mode: 'per_kg', paid_per_kg: '', price_per_picker: '', total_payment: '', comments: '' }));
      refetch();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Records</p><p className="text-2xl font-bold text-blue-600">{records?.length || 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Mbuni (KGs)</p><p className="text-2xl font-bold text-green-600">{fmt(totalKg)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Payment</p><p className="text-2xl font-bold text-purple-600">TZS {fmt(totalPayment)}</p></CardContent></Card>
      </div>

      {/* Filter + Add */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Label>Farm:</Label>
          <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All farms</SelectItem>
              {(farms || []).map((f: any) => <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Mbuni Record
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Mbuni (Dried Cherry) Records</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Block</TableHead>
                    <TableHead className="text-right">Pickers</TableHead>
                    <TableHead className="text-right">Mbuni (KG)</TableHead>
                    <TableHead className="text-right">Ratio</TableHead>
                    <TableHead className="text-right">Payment (TZS)</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!records || records.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No mbuni records found</TableCell></TableRow>
                  ) : records.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{fmtDate(r.harvest_date)}</TableCell>
                      <TableCell>{r.block_name}{r.block_code ? ` (${r.block_code})` : ''}</TableCell>
                      <TableCell className="text-right">{fmt(r.num_pickers)}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(r.mbuni_kg)}</TableCell>
                      <TableCell className="text-right">{r.mbuni_to_green_ratio ?? '—'}</TableCell>
                      <TableCell className="text-right">{r.total_payment ? fmt(r.total_payment) : '—'}</TableCell>
                      <TableCell>
                        <Button
                          size="icon" variant="ghost"
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                          disabled={deleting === r.id}
                          onClick={() => handleDelete(r.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Mbuni Record</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Farm *</Label>
              <Select value={form.farm_id} onValueChange={v => setField('farm_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                <SelectContent>{(farms || []).map((f: any) => <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Block Name *</Label>
              <Select
                value={form.block_name}
                onValueChange={handleBlockSelect}
                disabled={!form.farm_id || blocksLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!form.farm_id ? 'Select a farm first' : blocksLoading ? 'Loading blocks...' : 'Select block'} />
                </SelectTrigger>
                <SelectContent>
                  {(modalBlocks || []).length === 0 && !blocksLoading ? (
                    <SelectItem value="__none__" disabled>No blocks available</SelectItem>
                  ) : (
                    (modalBlocks || []).map((b: any) => (
                      <SelectItem key={b.id} value={b.name}>{b.name}{b.code ? ` — ${b.code}` : ''}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {form.block_name && form.block_code && (
                <p className="text-xs text-muted-foreground mt-1">Code: <span className="font-medium">{form.block_code}</span></p>
              )}
            </div>
            <div><Label>Harvest Date *</Label><Input type="date" value={form.harvest_date} onChange={e => setField('harvest_date', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>No. of Pickers *</Label><Input type="number" value={form.num_pickers} onChange={e => setField('num_pickers', e.target.value)} /></div>
              <div><Label>Mbuni KGs *</Label><Input type="number" value={form.mbuni_kg} onChange={e => setField('mbuni_kg', e.target.value)} /></div>
            </div>
            <div><Label>Mbuni:Green Ratio</Label><Input type="number" step="0.01" value={form.mbuni_to_green_ratio} onChange={e => setField('mbuni_to_green_ratio', e.target.value)} placeholder="e.g. 0.14" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Payment Mode</Label>
                <Select value={form.payment_mode} onValueChange={v => setField('payment_mode', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_kg">Per KG</SelectItem>
                    <SelectItem value="per_day">Per Day (per picker)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.payment_mode === 'per_day' ? (
                <div><Label>Price per Picker (TZS) *</Label><Input type="number" value={form.price_per_picker} onChange={e => setField('price_per_picker', e.target.value)} /></div>
              ) : (
                <div><Label>Paid per KG</Label><Input type="number" value={form.paid_per_kg} onChange={e => setField('paid_per_kg', e.target.value)} /></div>
              )}
            </div>
            {/* Auto-calc preview */}
            {(() => {
              const pickers = Number(form.num_pickers) || 0;
              const kg = Number(form.mbuni_kg) || 0;
              const calc = form.payment_mode === 'per_day'
                ? pickers * (Number(form.price_per_picker) || 0)
                : kg * (Number(form.paid_per_kg) || 0);
              return calc > 0 ? (
                <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
                  Calculated payment: <strong>TZS {calc.toLocaleString()}</strong>
                  {' '}— override below if needed
                </div>
              ) : null;
            })()}
            <div><Label>Total Payment (override)</Label><Input type="number" value={form.total_payment} onChange={e => setField('total_payment', e.target.value)} placeholder="Leave blank to auto-calculate" /></div>
            <div><Label>Comments</Label><Input value={form.comments} onChange={e => setField('comments', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
