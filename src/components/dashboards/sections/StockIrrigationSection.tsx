"use client";

import React, { useState, useCallback, useEffect } from 'react';
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
import { Plus, ArrowDownToLine, ArrowUpFromLine, Pencil, Trash2 } from 'lucide-react';

function fmt(n: number | undefined | null) {
  if (n == null) return '—';
  return n.toLocaleString();
}
function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString() : '—';
}

export const StockIrrigationSection: React.FC = () => {
  const [farmId, setFarmId] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, any>>({
    farm_id: '',
    part_id: '',
    entry_date: new Date().toISOString().slice(0, 10),
    transaction_type: 'out',
    quantity: '',
    from_farm_id: '',
    from_block_id: '',
    notes: '',
  });

  // Blocks for the entry form farm selector (farm_id field = destination/source farm)
  const [destBlocks, setDestBlocks] = useState<any[]>([]);
  const [fromBlocks, setFromBlocks] = useState<any[]>([]);

  useEffect(() => {
    if (!form.farm_id) { setDestBlocks([]); return; }
    apiService.getBlocksForFarm(Number(form.farm_id))
      .then((b: any[]) => setDestBlocks(Array.isArray(b) ? b : []))
      .catch(() => setDestBlocks([]));
  }, [form.farm_id]);

  useEffect(() => {
    if (!form.from_farm_id) { setFromBlocks([]); return; }
    apiService.getBlocksForFarm(Number(form.from_farm_id))
      .then((b: any[]) => setFromBlocks(Array.isArray(b) ? b : []))
      .catch(() => setFromBlocks([]));
  }, [form.from_farm_id]);

  const getFarms = useCallback(() => apiService.getStockFarms(), []);
  const { data: farms, loading: farmsLoading } = useApi(getFarms);

  const getParts = useCallback(
    () => apiService.getIrrigationParts({ farm_id: farmId !== 'all' ? Number(farmId) : undefined, active_only: true }),
    [farmId]
  );
  const getEntries = useCallback(
    () => apiService.getIrrigationEntries({ farm_id: farmId !== 'all' ? Number(farmId) : undefined }),
    [farmId]
  );

  const { data: parts } = useApi(getParts);
  const { data: entries, loading: entriesLoading, refetch: refetchEntries } = useApi(getEntries);

  const setField = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const openEdit = (entry: any) => {
    setEditingEntry(entry);
    setForm({
      farm_id: String(entry.farm_id ?? ''),
      part_id: String(entry.part_id ?? ''),
      entry_date: entry.entry_date ? entry.entry_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      transaction_type: entry.transaction_type ?? 'out',
      quantity: String(entry.quantity ?? ''),
      from_farm_id: String(entry.from_farm_id ?? ''),
      from_block_id: String(entry.from_block_id ?? ''),
      notes: entry.notes ?? '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this entry?')) return;
    setDeleting(id);
    try {
      await apiService.deleteIrrigationEntry(id);
      toast.success('Entry deleted');
      refetchEntries();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleSave = async () => {
    if (!form.farm_id || !form.part_id || !form.quantity) {
      toast.error('Farm, part, and quantity are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        farm_id: Number(form.farm_id),
        part_id: Number(form.part_id),
        entry_date: new Date(form.entry_date).toISOString(),
        quantity: Number(form.quantity),
        from_farm_id: form.from_farm_id ? Number(form.from_farm_id) : null,
        from_block_id: form.from_block_id ? Number(form.from_block_id) : null,
      };
      if (editingEntry) {
        await apiService.updateIrrigationEntry(editingEntry.id, payload);
        toast.success('Entry updated');
      } else {
        await apiService.createIrrigationEntry(payload);
        toast.success('Entry saved');
      }
      setShowModal(false);
      setEditingEntry(null);
      refetchEntries();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (farmsLoading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      {/* Farm selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
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
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Entry
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="parts">Parts Catalog</TabsTrigger>
          <TabsTrigger value="entries">Entries</TabsTrigger>
        </TabsList>

        {/* Parts catalog */}
        <TabsContent value="parts">
          <Card>
            <CardHeader><CardTitle className="text-base">Parts Catalog</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!parts || parts.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No parts found</TableCell></TableRow>
                    ) : parts.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-sm">{p.part_number}</TableCell>
                        <TableCell>{p.description}</TableCell>
                        <TableCell>{p.supplier}</TableCell>
                        <TableCell>{p.unit}</TableCell>
                        <TableCell><Badge variant={p.active ? 'default' : 'secondary'}>{p.active ? 'Active' : 'Inactive'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entries */}
        <TabsContent value="entries">
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
                        <TableHead>Part</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!entries || entries.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No entries</TableCell></TableRow>
                      ) : entries.slice(0, 50).map((e: any, i: number) => {
                        const part = parts?.find((p: any) => p.id === e.part_id);
                        return (
                          <TableRow key={e.id ?? i}>
                            <TableCell>{fmtDate(e.entry_date)}</TableCell>
                            <TableCell className="text-sm">{part ? `${part.part_number} — ${part.description}` : `#${e.part_id}`}</TableCell>
                            <TableCell>
                              <Badge variant={e.transaction_type === 'in' ? 'default' : 'secondary'}>
                                {e.transaction_type === 'in' ? <ArrowDownToLine className="w-3 h-3 mr-1 inline" /> : <ArrowUpFromLine className="w-3 h-3 mr-1 inline" />}
                                {e.transaction_type.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">{fmt(e.quantity)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{e.from_location || '—'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{e.notes || '—'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(e)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700" disabled={deleting === e.id} onClick={() => handleDelete(e.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Entry Modal */}
      <Dialog open={showModal} onOpenChange={v => { setShowModal(v); if (!v) setEditingEntry(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingEntry ? 'Edit Irrigation Entry' : 'Add Irrigation Part Entry'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Farm *</Label>
              <Select value={form.farm_id} onValueChange={v => setField('farm_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                <SelectContent>{(farms || []).map((f: any) => <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Part *</Label>
              <Select value={form.part_id} onValueChange={v => setField('part_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select part" /></SelectTrigger>
                <SelectContent>
                  {(parts || []).map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.part_number} — {p.description}</SelectItem>
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
            {/* Farm of entry — block loads after selection */}
            <div>
              <Label>{form.transaction_type === 'out' ? 'Issue To — Farm' : 'Receive From — Farm'}</Label>
              <Select value={form.from_farm_id} onValueChange={v => { setField('from_farm_id', v); setField('from_block_id', ''); }}>
                <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                <SelectContent>{(farms || []).map((f: any) => <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{form.transaction_type === 'out' ? 'Issue To — Block' : 'Receive From — Block'}</Label>
              <Select
                value={form.from_block_id}
                onValueChange={v => setField('from_block_id', v)}
                disabled={!form.from_farm_id || fromBlocks.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!form.from_farm_id ? 'Select farm first' : fromBlocks.length === 0 ? 'No blocks found' : 'Select block'} />
                </SelectTrigger>
                <SelectContent>{fromBlocks.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={e => setField('notes', e.target.value)} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowModal(false); setEditingEntry(null); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
