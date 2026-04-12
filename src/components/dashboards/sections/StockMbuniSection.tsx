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
import { Plus } from 'lucide-react';

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
  const [form, setForm] = useState<Record<string, any>>({
    farm_id: '',
    block_name: '',
    block_code: '',
    harvest_date: new Date().toISOString().slice(0, 10),
    num_pickers: '',
    mbuni_kg: '',
    mbuni_to_green_ratio: '',
    paid_per_kg: '',
    total_payment: '',
    comments: '',
  });

  const getFarms = useCallback(() => apiService.getStockFarms(), []);
  const { data: farms } = useApi(getFarms);

  const getRecords = useCallback(
    () => apiService.getMbuniRecords({ farm_id: selectedFarmId !== 'all' ? Number(selectedFarmId) : undefined }),
    [selectedFarmId]
  );
  const { data: records, loading, refetch } = useApi(getRecords);

  const setField = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const totalKg = records?.reduce((s: number, r: any) => s + (r.mbuni_kg || 0), 0) || 0;
  const totalPayment = records?.reduce((s: number, r: any) => s + (r.total_payment || 0), 0) || 0;

  const handleSave = async () => {
    if (!form.farm_id || !form.block_name || !form.harvest_date || !form.num_pickers || !form.mbuni_kg) {
      toast.error('Farm, block name, date, pickers, and Mbuni KGs are required');
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
        paid_per_kg: form.paid_per_kg ? Number(form.paid_per_kg) : null,
        total_payment: form.total_payment ? Number(form.total_payment) : null,
      });
      toast.success('Mbuni record saved');
      setShowModal(false);
      setForm(p => ({ ...p, block_name: '', block_code: '', num_pickers: '', mbuni_kg: '', paid_per_kg: '', total_payment: '', comments: '' }));
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
            <div><Label>Block Name *</Label><Input value={form.block_name} onChange={e => setField('block_name', e.target.value)} placeholder="e.g. BORRISON A" /></div>
            <div><Label>Block Code</Label><Input value={form.block_code} onChange={e => setField('block_code', e.target.value)} placeholder="e.g. 8T" /></div>
            <div><Label>Harvest Date *</Label><Input type="date" value={form.harvest_date} onChange={e => setField('harvest_date', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>No. of Pickers *</Label><Input type="number" value={form.num_pickers} onChange={e => setField('num_pickers', e.target.value)} /></div>
              <div><Label>Mbuni KGs *</Label><Input type="number" value={form.mbuni_kg} onChange={e => setField('mbuni_kg', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Mbuni:Green Ratio</Label><Input type="number" step="0.01" value={form.mbuni_to_green_ratio} onChange={e => setField('mbuni_to_green_ratio', e.target.value)} placeholder="e.g. 0.14" /></div>
              <div><Label>Paid per KG</Label><Input type="number" value={form.paid_per_kg} onChange={e => setField('paid_per_kg', e.target.value)} /></div>
            </div>
            <div><Label>Total Payment</Label><Input type="number" value={form.total_payment} onChange={e => setField('total_payment', e.target.value)} /></div>
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
