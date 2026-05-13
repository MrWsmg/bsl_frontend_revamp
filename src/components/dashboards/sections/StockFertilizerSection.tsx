"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '../../ui/sonner';
import { ArrowDownToLine, ArrowUpFromLine, Pencil, Trash2 } from 'lucide-react';

const CAN_RECORD = new Set(['admin', 'stock', 'farm_clerk']);
type SubStore = 'coffee' | 'otc';

function fmt(n: number | undefined | null, decimals = 0) {
  if (n == null) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}
function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString() : '—';
}

// ─── Entry Form ────────────────────────────────────────────────────────────

interface EntryFormProps {
  initialType: 'in' | 'out';
  initialSubStore: SubStore;
  initialFarmId: string;
  initialCategory: string;
  farms: any[];
  products: any[];
  editingEntry?: any;
  onClose: () => void;
  onSaved: () => void;
}

const EntryForm: React.FC<EntryFormProps> = ({
  initialType, initialSubStore, initialFarmId, initialCategory,
  farms, products, editingEntry, onClose, onSaved,
}) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>(editingEntry ? {
    farm_id: String(editingEntry.farm_id),
    sub_store: editingEntry.sub_store || initialSubStore,
    category: editingEntry.category || initialCategory,
    price_list_id: String(editingEntry.price_list_id ?? ''),
    entry_date: editingEntry.entry_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    transaction_type: editingEntry.transaction_type,
    bags: String(editingEntry.bags ?? ''),
    pkts: String(editingEntry.pkts ?? ''),
    kgs: String(editingEntry.kgs ?? ''),
    from_location: editingEntry.from_location || '',
    delivery_note_ref: editingEntry.delivery_note_ref || '',
    comments: editingEntry.comments || '',
  } : {
    farm_id: initialFarmId !== 'all' ? initialFarmId : '',
    sub_store: initialSubStore,
    category: initialCategory,
    price_list_id: '',
    entry_date: new Date().toISOString().slice(0, 10),
    transaction_type: initialType,
    bags: '',
    pkts: '',
    kgs: '',
    from_location: '',
    delivery_note_ref: '',
    comments: '',
  });

  const setField = (k: string, v: any) => setForm(p => ({
    ...p,
    [k]: v,
    // Reset product when category changes
    ...(k === 'category' ? { price_list_id: '' } : {}),
  }));

  // Products filtered by the selected category
  const filteredProducts = useMemo(() => {
    if (!form.category) return products || [];
    return (products || []).filter((p: any) => p.category === form.category);
  }, [products, form.category]);

  const selectedProduct = filteredProducts.find((p: any) => String(p.id) === String(form.price_list_id));

  const handleSave = async () => {
    if (!form.farm_id || !form.price_list_id) {
      toast.error('Farm and product are required');
      return;
    }
    if (!form.bags && !form.pkts && !form.kgs) {
      toast.error('Provide at least one quantity (bags, pkts, or kgs)');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        price_list_id: Number(form.price_list_id),
        farm_id: Number(form.farm_id),
        sub_store: form.sub_store,
        entry_date: new Date(form.entry_date).toISOString(),
        transaction_type: form.transaction_type,
        bags: form.bags ? Number(form.bags) : null,
        pkts: form.pkts ? Number(form.pkts) : null,
        kgs: form.kgs ? Number(form.kgs) : null,
        from_location: form.from_location || null,
        delivery_note_ref: form.delivery_note_ref || null,
        comments: form.comments || null,
      };
      if (editingEntry) {
        await apiService.updateFertilizerEntry(editingEntry.id, payload);
        toast.success('Entry updated');
      } else {
        await apiService.createFertilizerEntry(payload);
        toast.success('Entry saved');
      }
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
      {/* IN / OUT toggle */}
      <div>
        <Label>Transaction Type *</Label>
        <div className="flex gap-2 mt-1">
          {(['in', 'out'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setField('transaction_type', t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md border text-sm font-medium transition-colors ${
                form.transaction_type === t
                  ? t === 'in' ? 'bg-green-600 text-white border-green-600' : 'bg-orange-500 text-white border-orange-500'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {t === 'in' ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
              {t === 'in' ? 'IN (Receipt)' : 'OUT (Issue)'}
            </button>
          ))}
        </div>
      </div>

      {/* Farm */}
      <div>
        <Label>Farm *</Label>
        <Select value={form.farm_id} onValueChange={v => setField('farm_id', v)}>
          <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
          <SelectContent>
            {farms.map((f: any) => (
              <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sub-store */}
      <div>
        <Label>Sub-store *</Label>
        <div className="flex gap-2 mt-1">
          {(['coffee', 'otc'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setField('sub_store', s)}
              className={`flex-1 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                form.sub_store === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {s === 'coffee' ? 'Coffee' : 'Other Crops'}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <Label>Category *</Label>
        <Input
          value={form.category}
          onChange={e => setField('category', e.target.value)}
          placeholder="e.g. FERTILIZERS"
        />
      </div>

      {/* Product */}
      <div>
        <Label>Product *</Label>
        <Select
          value={String(form.price_list_id)}
          onValueChange={v => setField('price_list_id', v)}
          disabled={!form.category || filteredProducts.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              !form.category ? 'Select a category first' :
              filteredProducts.length === 0 ? 'No products in this category' :
              'Select product'
            } />
          </SelectTrigger>
          <SelectContent>
            {filteredProducts.map((p: any) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name} ({p.unit})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedProduct && (
          <p className="text-xs text-muted-foreground mt-1">
            Unit: <span className="font-medium">{selectedProduct.unit}</span>
            {selectedProduct.price ? <> · Price: <span className="font-medium">{fmt(selectedProduct.price)}/unit</span></> : null}
          </p>
        )}
      </div>

      {/* Date */}
      <div>
        <Label>Date *</Label>
        <Input type="date" value={form.entry_date} onChange={e => setField('entry_date', e.target.value)} />
      </div>

      {/* Quantities */}
      <div className="grid grid-cols-3 gap-2">
        <div><Label>Bags</Label><Input type="number" min="0" value={form.bags} onChange={e => setField('bags', e.target.value)} placeholder="0" /></div>
        <div><Label>Pkts</Label><Input type="number" min="0" value={form.pkts} onChange={e => setField('pkts', e.target.value)} placeholder="0" /></div>
        <div>
          <Label>{selectedProduct?.unit?.toLowerCase() === 'litres' ? 'Litres' : 'KGs'}</Label>
          <Input type="number" min="0" step="0.01" value={form.kgs} onChange={e => setField('kgs', e.target.value)} placeholder="0" />
        </div>
      </div>

      {/* IN-only fields */}
      {form.transaction_type === 'in' && (
        <>
          <div>
            <Label>From Location</Label>
            <Input value={form.from_location} onChange={e => setField('from_location', e.target.value)} placeholder="e.g. TB MAIN STORE" />
          </div>
          <div>
            <Label>DN Reference</Label>
            <Input value={form.delivery_note_ref} onChange={e => setField('delivery_note_ref', e.target.value)} placeholder="e.g. DN-2026-001" />
          </div>
        </>
      )}

      <div>
        <Label>Comments</Label>
        <Input value={form.comments} onChange={e => setField('comments', e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Entry'}</Button>
      </div>
    </div>
  );
};

// ─── Main Section ──────────────────────────────────────────────────────────

export const StockFertilizerSection: React.FC = () => {
  const { user } = useAuth();
  const canRecord = CAN_RECORD.has((user as any)?.role || '');

  const [farmId, setFarmId] = useState('all');
  const [subStore, setSubStore] = useState<SubStore>('coffee');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [showEntry, setShowEntry] = useState(false);
  const [entryType, setEntryType] = useState<'in' | 'out'>('in');
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const getFarms = useCallback(() => apiService.getFarms(), []);
  const { data: farms, loading: farmsLoading } = useApi(getFarms);

  // Products fetched once at page level — shared by filter bar and entry form
  const getProducts = useCallback(() => apiService.getFertilizerProducts({}), []);
  const { data: products } = useApi(getProducts);

  // Unique categories derived from products
  const categories = useMemo(() => {
    const seen = new Set<string>();
    (products || []).forEach((p: any) => { if (p.category) seen.add(p.category); });
    return Array.from(seen).sort();
  }, [products]);

  const getBalances = useCallback(
    () => apiService.getFertilizerBalances({
      farm_id: farmId !== 'all' ? Number(farmId) : undefined,
      sub_store: subStore,
    }),
    [farmId, subStore]
  );
  const { data: balances, loading: balancesLoading, refetch: refetchBalances } = useApi(
    getBalances, { dependencies: [farmId, subStore] }
  );

  const getEntries = useCallback(
    () => apiService.getFertilizerEntries({
      farm_id: farmId !== 'all' ? Number(farmId) : undefined,
      sub_store: subStore,
      transaction_type: filterType !== 'all' ? filterType as 'in' | 'out' : undefined,
      start_date: filterStart || undefined,
      end_date: filterEnd || undefined,
    }),
    [farmId, subStore, filterType, filterStart, filterEnd]
  );
  const { data: entries, loading: entriesLoading, refetch: refetchEntries } = useApi(
    getEntries, { dependencies: [farmId, subStore, filterType, filterStart, filterEnd] }
  );

  // Client-side category filter on entries and balances
  const filteredEntries = useMemo(() => {
    if (filterCategory === 'all') return entries || [];
    return (entries as any[] || []).filter(e => e.category === filterCategory);
  }, [entries, filterCategory]);

  const filteredBalances = useMemo(() => {
    if (filterCategory === 'all') return balances || [];
    return (balances as any[] || []).filter(b => b.category === filterCategory);
  }, [balances, filterCategory]);

  const handleEntrySaved = () => { refetchEntries(); refetchBalances(); };
  const openEntry = (type: 'in' | 'out') => { setEntryType(type); setEditingEntry(null); setShowEntry(true); };
  const openEdit = (entry: any) => { setEditingEntry(entry); setEntryType(entry.transaction_type); setShowEntry(true); };
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this entry? The balance will be reversed.')) return;
    setDeleting(id);
    try {
      await apiService.deleteFertilizerEntry(id);
      toast.success('Entry deleted');
      refetchEntries(); refetchBalances();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const hasActiveFilters = filterCategory !== 'all' || filterType !== 'all' || !!filterStart || !!filterEnd;

  if (farmsLoading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label className="text-xs">Farm</Label>
              <Select value={farmId} onValueChange={setFarmId}>
                <SelectTrigger className="w-44 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All farms</SelectItem>
                  {(farms || []).map((f: any) => (
                    <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Sub-store</Label>
              <div className="flex gap-1 mt-1">
                {(['coffee', 'otc'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubStore(s)}
                    className={`px-3 py-1 rounded-md border text-xs font-medium transition-colors ${
                      subStore === s
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {s === 'coffee' ? 'Coffee' : 'OTC'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Category</Label>
              <Input
                className="w-44 h-8 text-sm"
                value={filterCategory === 'all' ? '' : filterCategory}
                onChange={e => setFilterCategory(e.target.value || 'all')}
                placeholder="Filter by category"
              />
            </div>

            <div>
              <Label className="text-xs">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="in">IN only</SelectItem>
                  <SelectItem value="out">OUT only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" className="h-8 text-sm w-36" value={filterStart} onChange={e => setFilterStart(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" className="h-8 text-sm w-36" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
            </div>

            {hasActiveFilters && (
              <Button size="sm" variant="ghost" className="h-8" onClick={() => {
                setFilterCategory('all'); setFilterType('all'); setFilterStart(''); setFilterEnd('');
              }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Balance cards */}
      {balancesLoading ? (
        <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
      ) : filteredBalances.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {(filteredBalances as any[]).map((b: any) => {
            const bagsNeg = b.current_bags < 0;
            const kgsNeg = b.current_kgs < 0;
            return (
              <Card key={b.id ?? `${b.price_list_id ?? b.product_id}-${b.farm_id}`}>
                <CardContent className="p-3 space-y-1">
                  <p className="text-xs font-semibold leading-tight truncate" title={b.product_name}>{b.product_name}</p>
                  {b.category && <p className="text-xs text-muted-foreground">{b.category}</p>}
                  <div className="flex justify-between gap-2 pt-1">
                    <div>
                      <p className="text-xs text-muted-foreground">Bags</p>
                      <p className={`text-lg font-bold ${bagsNeg ? 'text-red-500' : 'text-green-600'}`}>{fmt(b.current_bags)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{b.product_unit?.toLowerCase() === 'litres' ? 'Litres' : 'KGs'}</p>
                      <p className={`text-lg font-bold ${kgsNeg ? 'text-red-500' : 'text-blue-600'}`}>{fmt(b.current_kgs, 1)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      {/* Action buttons */}
      {canRecord && (
        <div className="flex gap-2 justify-end">
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => openEntry('in')}>
            <ArrowDownToLine className="w-4 h-4 mr-1" /> Stock IN
          </Button>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => openEntry('out')}>
            <ArrowUpFromLine className="w-4 h-4 mr-1" /> Stock OUT
          </Button>
        </div>
      )}

      {/* Ledger table */}
      {entriesLoading ? (
        <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Bags</TableHead>
                <TableHead className="text-right">Pkts</TableHead>
                <TableHead className="text-right">KGs / Litres</TableHead>
                <TableHead>From Location</TableHead>
                <TableHead>DN Ref</TableHead>
                <TableHead>Recorded By</TableHead>
                {canRecord && <TableHead className="w-20"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canRecord ? 11 : 10} className="text-center text-muted-foreground py-8">No entries found</TableCell>
                </TableRow>
              ) : (filteredEntries as any[]).slice(0, 200).map((e: any, i: number) => (
                <TableRow key={e.id ?? i}>
                  <TableCell className="whitespace-nowrap">{fmtDate(e.entry_date)}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{e.product_name || `#${e.price_list_id ?? e.product_id}`}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{e.category || '—'}</TableCell>
                  <TableCell>
                    <Badge className={e.transaction_type === 'in' ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'}>
                      {e.transaction_type === 'in'
                        ? <><ArrowDownToLine className="w-3 h-3 mr-1 inline" />IN</>
                        : <><ArrowUpFromLine className="w-3 h-3 mr-1 inline" />OUT</>}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{fmt(e.bags)}</TableCell>
                  <TableCell className="text-right">{fmt(e.pkts)}</TableCell>
                  <TableCell className="text-right">{e.kgs != null ? fmt(e.kgs, 1) : '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.from_location || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.delivery_note_ref || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.recorded_by || '—'}</TableCell>
                  {canRecord && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(e)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500"
                          disabled={deleting === e.id} onClick={() => handleDelete(e.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Entry modal */}
      <Dialog open={showEntry} onOpenChange={setShowEntry}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Edit Entry' : `Record Stock ${entryType === 'in' ? 'IN' : 'OUT'}`}</DialogTitle>
          </DialogHeader>
          <EntryForm
            initialType={entryType}
            initialSubStore={subStore}
            initialFarmId={farmId}
            initialCategory={filterCategory !== 'all' ? filterCategory : (categories[0] || '')}
            farms={farms || []}
            products={products || []}
            editingEntry={editingEntry}
            onClose={() => { setShowEntry(false); setEditingEntry(null); }}
            onSaved={handleEntrySaved}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
