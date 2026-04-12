"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '../../ui/sonner';
import { Plus, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { FuelChemCategory } from '../../../types';

const CATEGORIES: { value: FuelChemCategory; label: string }[] = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'herbicide', label: 'Herbicide' },
  { value: 'fungicide', label: 'Fungicide' },
  { value: 'pesticide', label: 'Pesticide' },
  { value: 'chemical', label: 'Chemical' },
];

function fmt(n: number | undefined | null) {
  if (n == null) return '—';
  return n.toLocaleString();
}
function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString() : '—';
}

type SubStore = 'coffee' | 'otc';

interface SubStoreTabProps {
  subStore: SubStore;
  farmId: string;
  farms: any[];
}

const SubStoreTab: React.FC<SubStoreTabProps> = ({ subStore, farmId, farms }) => {
  const [showModal, setShowModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({
    farm_id: farmId !== 'all' ? farmId : '',
    product_id: '',
    entry_date: new Date().toISOString().slice(0, 10),
    transaction_type: 'out',
    quantity: '',
    from_to_location: '',
    delivery_note_ref: '',
    serial_number: '',
    comments: '',
  });

  const getProducts = useCallback(
    () => apiService.getFuelChemProducts({ sub_store: subStore }),
    [subStore, farmId]
  );
  const getEntries = useCallback(
    () => apiService.getFuelChemEntries({
      farm_id: farmId !== 'all' ? Number(farmId) : undefined,
      sub_store: subStore,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
    }),
    [farmId, subStore, categoryFilter]
  );

  const { data: products } = useApi(getProducts);
  const { data: entries, loading: entriesLoading, refetch: refetchEntries } = useApi(getEntries);

  const setField = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.farm_id || !form.product_id || !form.quantity) {
      toast.error('Farm, product, and quantity are required');
      return;
    }
    setSaving(true);
    try {
      await apiService.createFuelChemEntry({
        ...form,
        farm_id: Number(form.farm_id),
        product_id: Number(form.product_id),
        entry_date: new Date(form.entry_date).toISOString(),
        quantity: Number(form.quantity),
      });
      toast.success('Entry saved');
      setShowModal(false);
      refetchEntries();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category filter + add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label>Category:</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Entry
        </Button>
      </div>

      {/* Recent Entries */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Entries</CardTitle></CardHeader>
        <CardContent>
          {entriesLoading ? (
            <div className="flex justify-center py-6"><LoadingSpinner size="sm" /></div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Location / Ref</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!entries || entries.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No entries</TableCell></TableRow>
                  ) : entries.slice(0, 50).map((e: any, i: number) => (
                    <TableRow key={e.id ?? i}>
                      <TableCell>{fmtDate(e.entry_date)}</TableCell>
                      <TableCell>{products?.find((p: any) => p.id === e.product_id)?.name || `#${e.product_id}`}</TableCell>
                      <TableCell>
                        <Badge variant={e.transaction_type === 'in' ? 'default' : 'secondary'}>
                          {e.transaction_type === 'in' ? <ArrowDownToLine className="w-3 h-3 mr-1 inline" /> : <ArrowUpFromLine className="w-3 h-3 mr-1 inline" />}
                          {e.transaction_type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmt(e.quantity)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.from_to_location || e.delivery_note_ref || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Fuel/Chemical Entry — {subStore === 'coffee' ? 'Coffee' : 'OTC'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Farm *</Label>
              <Select value={form.farm_id} onValueChange={v => setField('farm_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                <SelectContent>{farms.map((f: any) => <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product *</Label>
              <Select value={form.product_id} onValueChange={v => setField('product_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {(products || []).map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.category}) — {p.unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type *</Label>
                <Select value={form.transaction_type} onValueChange={v => setField('transaction_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">IN (Receipt)</SelectItem>
                    <SelectItem value="out">OUT (Issue)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date *</Label><Input type="date" value={form.entry_date} onChange={e => setField('entry_date', e.target.value)} /></div>
            </div>
            <div><Label>Quantity *</Label><Input type="number" value={form.quantity} onChange={e => setField('quantity', e.target.value)} /></div>
            <div><Label>From/To Location</Label><Input value={form.from_to_location} onChange={e => setField('from_to_location', e.target.value)} placeholder="e.g. TB MAIN STORE" /></div>
            <div><Label>Delivery Note Ref</Label><Input value={form.delivery_note_ref} onChange={e => setField('delivery_note_ref', e.target.value)} /></div>
            <div><Label>Serial Number</Label><Input value={form.serial_number} onChange={e => setField('serial_number', e.target.value)} /></div>
            <div><Label>Comments</Label><Input value={form.comments} onChange={e => setField('comments', e.target.value)} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Entry'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const StockFuelChemicalsSection: React.FC = () => {
  const [farmId, setFarmId] = useState('all');

  const getFarms = useCallback(() => apiService.getStockFarms(), []);
  const { data: farms, loading: farmsLoading } = useApi(getFarms);

  if (farmsLoading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label className="min-w-fit">Farm:</Label>
            <Select value={farmId} onValueChange={setFarmId}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All farms</SelectItem>
                {(farms || []).map((f: any) => <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="coffee">
        <TabsList>
          <TabsTrigger value="coffee">Coffee Store</TabsTrigger>
          <TabsTrigger value="otc">Other Crops Store</TabsTrigger>
        </TabsList>
        <TabsContent value="coffee">
          <SubStoreTab subStore="coffee" farmId={farmId} farms={farms || []} />
        </TabsContent>
        <TabsContent value="otc">
          <SubStoreTab subStore="otc" farmId={farmId} farms={farms || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
