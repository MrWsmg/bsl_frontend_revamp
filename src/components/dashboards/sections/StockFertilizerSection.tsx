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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '../../ui/sonner';
import { Plus, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

function fmt(n: number | undefined | null, decimals = 2) {
  if (n == null) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}
function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString() : '—';
}

type SubStore = 'coffee' | 'otc';

interface EntryFormProps {
  subStore: SubStore;
  farmId: string;
  farms: any[];
  products: any[];
  onClose: () => void;
  onSaved: () => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ subStore, farmId, farms, products, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({
    farm_id: farmId !== 'all' ? farmId : '',
    product_id: '',
    entry_date: new Date().toISOString().slice(0, 10),
    transaction_type: 'in',
    bags: '',
    pkts: '',
    kgs: '',
    from_location: '',
    delivery_note_ref: '',
    comments: '',
  });

  const setField = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.farm_id || !form.product_id) {
      toast.error('Farm and product are required');
      return;
    }
    if (!form.bags && !form.pkts && !form.kgs) {
      toast.error('Provide at least one quantity (bags, pkts, or kgs)');
      return;
    }
    setSaving(true);
    try {
      await apiService.createFertilizerEntry({
        ...form,
        farm_id: Number(form.farm_id),
        product_id: Number(form.product_id),
        entry_date: new Date(form.entry_date).toISOString(),
        bags: form.bags ? Number(form.bags) : null,
        pkts: form.pkts ? Number(form.pkts) : null,
        kgs: form.kgs ? Number(form.kgs) : null,
      });
      toast.success('Entry saved');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
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
          <SelectContent>{products.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name}{p.formula ? ` — ${p.formula}` : ''}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Transaction Type *</Label>
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
      <div className="grid grid-cols-3 gap-2">
        <div><Label>Bags</Label><Input type="number" value={form.bags} onChange={e => setField('bags', e.target.value)} placeholder="0" /></div>
        <div><Label>Pkts</Label><Input type="number" value={form.pkts} onChange={e => setField('pkts', e.target.value)} placeholder="0" /></div>
        <div><Label>KGs</Label><Input type="number" value={form.kgs} onChange={e => setField('kgs', e.target.value)} placeholder="0" /></div>
      </div>
      <div><Label>From Location</Label><Input value={form.from_location} onChange={e => setField('from_location', e.target.value)} /></div>
      <div><Label>Delivery Note Ref</Label><Input value={form.delivery_note_ref} onChange={e => setField('delivery_note_ref', e.target.value)} /></div>
      <div><Label>Comments</Label><Input value={form.comments} onChange={e => setField('comments', e.target.value)} /></div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Entry'}</Button>
      </div>
    </div>
  );
};

interface SubStoreTabProps {
  subStore: SubStore;
  farmId: string;
  farms: any[];
}

const SubStoreTab: React.FC<SubStoreTabProps> = ({ subStore, farmId, farms }) => {
  const [showModal, setShowModal] = useState(false);
  const [entryType, setEntryType] = useState<'in' | 'out' | null>(null);

  const getProducts = useCallback(
    () => apiService.getFertilizerProducts({ sub_store: subStore }),
    [subStore, farmId]
  );
  const getEntries = useCallback(
    () => apiService.getFertilizerEntries({ farm_id: farmId !== 'all' ? Number(farmId) : undefined, sub_store: subStore }),
    [farmId, subStore]
  );

  const { data: products } = useApi(getProducts);
  const { data: entries, loading: entriesLoading, refetch: refetchEntries } = useApi(getEntries);

  const handleSaved = () => refetchEntries();

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Entry
        </Button>
      </div>

      {/* Recent entries */}
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
                    <TableHead className="text-right">Bags</TableHead>
                    <TableHead className="text-right">KGs</TableHead>
                    <TableHead>Location / Ref</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!entries || entries.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No entries</TableCell></TableRow>
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
                      <TableCell className="text-right">{fmt(e.bags)}</TableCell>
                      <TableCell className="text-right">{fmt(e.kgs)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.from_location || e.delivery_note_ref || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Fertilizer Entry — {subStore === 'coffee' ? 'Coffee' : 'Other Crops'}</DialogTitle></DialogHeader>
          <EntryForm
            subStore={subStore}
            farmId={farmId}
            farms={farms}
            products={products || []}
            onClose={() => setShowModal(false)}
            onSaved={handleSaved}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const StockFertilizerSection: React.FC = () => {
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
