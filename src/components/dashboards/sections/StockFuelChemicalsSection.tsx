"use client";

import React, { useState, useCallback } from 'react';
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
import { FuelChemBlockConsumptionSection } from './FuelChemBlockConsumptionSection';

// ─── Role helpers ──────────────────────────────────────────────────────────

const CAN_RECORD = new Set(['admin', 'stock', 'farm_clerk']);

// ─── Category constants (exact API strings) ───────────────────────────────

const CATEGORIES = [
  { value: 'FUEL AND LUBRICANTS', label: 'Fuel & Lubricants' },
  { value: 'AGROCHEMICALS',       label: 'Agrochemicals' },
  { value: 'HERBICIDES',          label: 'Herbicides' },
] as const;

type Category = typeof CATEGORIES[number]['value'];
type SubStore = 'coffee' | 'otc';

function fmt(n: number | undefined | null, decimals = 1) {
  if (n == null) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}
function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString() : '—';
}

// ─── Entry Form ────────────────────────────────────────────────────────────

interface EntryFormProps {
  initialType: 'in' | 'out';
  initialFarmId: string;
  initialCategory: string;
  farms: any[];
  editingEntry?: any;
  onClose: () => void;
  onSaved: () => void;
}

// Default From/To location config for a fresh entry, based on direction.
//   OUT: from CARDEX(own farm) → to a BLOCK (consumption) or another farm
//   IN:  from EXTERNAL (supplier) or another farm → to CARDEX(own farm)
function locationDefaults(type: 'in' | 'out', farmId: string) {
  if (type === 'out') {
    return {
      origin_type: 'CARDEX', origin_farm_id: farmId, origin_block_id: '', origin_label: '',
      dest_type: 'BLOCK', dest_farm_id: farmId, dest_block_id: '', dest_label: '',
    };
  }
  return {
    origin_type: 'EXTERNAL', origin_farm_id: '', origin_block_id: '', origin_label: '',
    dest_type: 'CARDEX', dest_farm_id: farmId, dest_block_id: '', dest_label: '',
  };
}

const LOCATION_TYPES = [
  { value: 'CARDEX', label: 'Farm CARDEX' },
  { value: 'BLOCK', label: 'Block' },
  { value: 'EXTERNAL', label: 'External / Supplier' },
] as const;

const EntryForm: React.FC<EntryFormProps> = ({
  initialType, initialFarmId, initialCategory, farms, editingEntry, onClose, onSaved,
}) => {
  const [saving, setSaving] = useState(false);
  const isFuel = initialCategory === 'FUEL AND LUBRICANTS';
  const startFarm = initialFarmId !== 'all' ? initialFarmId : '';
  const [form, setForm] = useState<Record<string, any>>(editingEntry ? {
    farm_id: String(editingEntry.farm_id),
    category: editingEntry.category || initialCategory || CATEGORIES[0].value,
    price_list_id: String(editingEntry.price_list_id ?? ''),
    entry_date: editingEntry.entry_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    transaction_type: editingEntry.transaction_type,
    quantity: String(editingEntry.quantity ?? ''),
    sub_store: editingEntry.sub_store || '',
    delivery_note_ref: editingEntry.delivery_note_ref || '',
    serial_number: editingEntry.serial_number || '',
    comments: editingEntry.comments || '',
    origin_type: editingEntry.origin_type || '',
    origin_farm_id: editingEntry.origin_farm_id ? String(editingEntry.origin_farm_id) : '',
    origin_block_id: editingEntry.origin_block_id ? String(editingEntry.origin_block_id) : '',
    origin_label: editingEntry.origin_label || '',
    dest_type: editingEntry.dest_type || '',
    dest_farm_id: editingEntry.dest_farm_id ? String(editingEntry.dest_farm_id) : '',
    dest_block_id: editingEntry.dest_block_id ? String(editingEntry.dest_block_id) : '',
    dest_label: editingEntry.dest_label || '',
  } : {
    farm_id: startFarm,
    category: initialCategory || CATEGORIES[0].value,
    price_list_id: '',
    entry_date: new Date().toISOString().slice(0, 10),
    transaction_type: initialType,
    quantity: '',
    sub_store: isFuel ? '' : 'coffee',
    delivery_note_ref: '',
    serial_number: '',
    comments: '',
    ...locationDefaults(initialType, startFarm),
  });

  const setField = (k: string, v: any) => setForm(p => {
    const next: Record<string, any> = { ...p, [k]: v };
    // Reset product when category changes
    if (k === 'category') {
      next.price_list_id = '';
      next.sub_store = v === 'FUEL AND LUBRICANTS' ? '' : (p.sub_store || 'coffee');
    }
    // Re-apply From/To defaults when direction changes (only for new entries)
    if (k === 'transaction_type' && !editingEntry) {
      Object.assign(next, locationDefaults(v, p.farm_id || ''));
    }
    // Keep the "own farm" CARDEX side + block selection in sync with the Farm field
    if (k === 'farm_id') {
      if (p.origin_type === 'CARDEX' && p.origin_farm_id === p.farm_id) next.origin_farm_id = v;
      if (p.dest_type === 'CARDEX' && p.dest_farm_id === p.farm_id) next.dest_farm_id = v;
    }
    // Any farm change (entry farm or a CARDEX-side farm) invalidates block picks,
    // since blocks are within-farm.
    if (k === 'farm_id' || k === 'origin_farm_id' || k === 'dest_farm_id') {
      next.origin_block_id = '';
      next.dest_block_id = '';
    }
    return next;
  });

  const getProducts = useCallback(
    () => apiService.getFuelChemProducts({ category: form.category }),
    [form.category]
  );
  const { data: products, loading: productsLoading } = useApi(
    getProducts, { dependencies: [form.category] }
  );

  // Blocks are within-farm. The relevant farm for a BLOCK picker is the CARDEX
  // ("own farm") side of the movement — i.e. the From/To Farm the user just chose —
  // falling back to the top-level entry farm.
  const cardexFarmId =
    form.origin_type === 'CARDEX' ? form.origin_farm_id
    : form.dest_type === 'CARDEX' ? form.dest_farm_id
    : '';
  const ownFarmId = cardexFarmId || form.farm_id;

  const getModalBlocks = useCallback(
    () => ownFarmId ? apiService.getBlocksForFarm(Number(ownFarmId)) : Promise.resolve([]),
    [ownFarmId]
  );
  const { data: modalBlocks } = useApi(getModalBlocks, { dependencies: [ownFarmId] });

  const selectedProduct = (products || []).find((p: any) => String(p.id) === String(form.price_list_id));
  const showSubStore = form.category !== 'FUEL AND LUBRICANTS';

  const buildEndpoint = (prefix: 'origin' | 'dest') => {
    const type = form[`${prefix}_type`];
    if (!type) return {};
    const out: Record<string, any> = { [`${prefix}_type`]: type };
    if (type === 'CARDEX') {
      out[`${prefix}_farm_id`] = Number(form[`${prefix}_farm_id`] || form.farm_id);
    } else if (type === 'BLOCK') {
      out[`${prefix}_block_id`] = form[`${prefix}_block_id`] ? Number(form[`${prefix}_block_id`]) : null;
    } else if (type === 'EXTERNAL') {
      out[`${prefix}_label`] = form[`${prefix}_label`] || 'External';
    }
    return out;
  };

  const handleSave = async () => {
    if (!ownFarmId || !form.price_list_id || !form.quantity) {
      toast.error('Farm, product, and quantity are required');
      return;
    }
    if (form.origin_type === 'BLOCK' && !form.origin_block_id) {
      toast.error('Select a block for the From location'); return;
    }
    if (form.dest_type === 'BLOCK' && !form.dest_block_id) {
      toast.error('Select a block for the To location'); return;
    }
    if (form.origin_type === 'EXTERNAL' && form.dest_type === 'EXTERNAL') {
      toast.error('From and To cannot both be External'); return;
    }
    setSaving(true);
    try {
      const payload = {
        price_list_id: Number(form.price_list_id),
        farm_id: Number(ownFarmId),
        entry_date: new Date(form.entry_date).toISOString(),
        transaction_type: form.transaction_type,
        quantity: Number(form.quantity),
        ...(form.sub_store ? { sub_store: form.sub_store } : {}),
        ...buildEndpoint('origin'),
        ...buildEndpoint('dest'),
        delivery_note_ref: form.delivery_note_ref || null,
        serial_number: form.serial_number || null,
        comments: form.comments || null,
      };
      if (editingEntry) {
        await apiService.updateFuelChemEntry(editingEntry.id, payload);
        toast.success('Entry updated');
      } else {
        await apiService.createFuelChemEntry(payload);
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

      {/* Category */}
      <div>
        <Label>Category *</Label>
        <Select value={form.category} onValueChange={v => setField('category', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Sub-store (hidden for fuel) */}
      {showSubStore && (
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
      )}

      {/* Product */}
      <div>
        <Label>Product *</Label>
        <Select
          value={String(form.price_list_id)}
          onValueChange={v => setField('price_list_id', v)}
          disabled={productsLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={productsLoading ? 'Loading...' : (products || []).length === 0 ? 'No products for this category' : 'Select product'} />
          </SelectTrigger>
          <SelectContent>
            {(products || []).map((p: any) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name} ({p.unit})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedProduct && (
          <p className="text-xs text-muted-foreground mt-1">
            Unit: <span className="font-medium">{selectedProduct.unit}</span>
            {selectedProduct.price ? <> · Price: <span className="font-medium">{fmt(selectedProduct.price, 0)}/unit</span></> : null}
          </p>
        )}
      </div>

      {/* Date */}
      <div>
        <Label>Date *</Label>
        <Input type="date" value={form.entry_date} onChange={e => setField('entry_date', e.target.value)} />
      </div>

      {/* Quantity */}
      <div>
        <Label>Quantity * {selectedProduct ? `(${selectedProduct.unit})` : ''}</Label>
        <Input type="number" min="0" step="0.01" value={form.quantity} onChange={e => setField('quantity', e.target.value)} placeholder="0" />
      </div>

      {/* Structured From / To location pickers */}
      {(['origin', 'dest'] as const).map(prefix => {
        const title = prefix === 'origin' ? 'From' : 'To';
        const type = form[`${prefix}_type`];
        return (
          <div key={prefix} className="rounded-md border p-2 space-y-2">
            <Label className="text-xs font-semibold">{title} *</Label>
            <Select value={type} onValueChange={v => setField(`${prefix}_type`, v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {LOCATION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>

            {type === 'CARDEX' && (
              <Select value={String(form[`${prefix}_farm_id`] || '')} onValueChange={v => setField(`${prefix}_farm_id`, v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select farm" /></SelectTrigger>
                <SelectContent>
                  {farms.map((f: any) => (
                    <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {type === 'BLOCK' && (
              <Select value={String(form[`${prefix}_block_id`] || '')} onValueChange={v => setField(`${prefix}_block_id`, v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={ownFarmId ? 'Select block' : 'Pick a farm first'} />
                </SelectTrigger>
                <SelectContent>
                  {(modalBlocks || []).map((b: any) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.code} — {b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {type === 'EXTERNAL' && (
              <Input className="h-8 text-sm" value={form[`${prefix}_label`] || ''}
                onChange={e => setField(`${prefix}_label`, e.target.value)}
                placeholder="e.g. supplier name" />
            )}
          </div>
        );
      })}

      <div>
        <Label>DN Reference</Label>
        <Input value={form.delivery_note_ref} onChange={e => setField('delivery_note_ref', e.target.value)} placeholder="e.g. DN-2026-001" />
      </div>
      <div>
        <Label>Serial Number</Label>
        <Input value={form.serial_number} onChange={e => setField('serial_number', e.target.value)} />
      </div>
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

export const StockFuelChemicalsSection: React.FC = () => {
  const { user } = useAuth();
  const canRecord = CAN_RECORD.has((user as any)?.role || '');

  const [view, setView] = useState<'ledger' | 'report'>('ledger');
  const [farmId, setFarmId] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [showEntry, setShowEntry] = useState(false);
  const [entryType, setEntryType] = useState<'in' | 'out'>('in');
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const getFarms = useCallback(() => apiService.getFarms(), []);
  const { data: farms, loading: farmsLoading } = useApi(getFarms);

  const getBalances = useCallback(
    () => apiService.getFuelChemBalances({
      farm_id: farmId !== 'all' ? Number(farmId) : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
    }),
    [farmId, categoryFilter]
  );
  const { data: balances, loading: balancesLoading, refetch: refetchBalances } = useApi(
    getBalances, { dependencies: [farmId, categoryFilter] }
  );

  const getEntries = useCallback(
    () => apiService.getFuelChemEntries({
      farm_id: farmId !== 'all' ? Number(farmId) : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      transaction_type: filterType !== 'all' ? filterType as 'in' | 'out' : undefined,
      start_date: filterStart || undefined,
      end_date: filterEnd || undefined,
    }),
    [farmId, categoryFilter, filterType, filterStart, filterEnd]
  );
  const { data: entries, loading: entriesLoading, refetch: refetchEntries } = useApi(
    getEntries, { dependencies: [farmId, categoryFilter, filterType, filterStart, filterEnd] }
  );

  const handleEntrySaved = () => { refetchEntries(); refetchBalances(); };
  const openEntry = (type: 'in' | 'out') => { setEntryType(type); setEditingEntry(null); setShowEntry(true); };
  const openEdit = (entry: any) => { setEditingEntry(entry); setEntryType(entry.transaction_type); setShowEntry(true); };
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this entry? The balance will be reversed.')) return;
    setDeleting(id);
    try {
      await apiService.deleteFuelChemEntry(id);
      toast.success('Entry deleted');
      refetchEntries(); refetchBalances();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  if (farmsLoading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex gap-2">
        {(['ledger', 'report'] as const).map(v => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
              view === v
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {v === 'ledger' ? 'Ledger' : 'Per-Block Consumption'}
          </button>
        ))}
      </div>

      {view === 'report' ? <FuelChemBlockConsumptionSection /> : (
      <>
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
              <Label className="text-xs">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
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

            {(categoryFilter !== 'all' || filterType !== 'all' || filterStart || filterEnd) && (
              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setCategoryFilter('all'); setFilterType('all'); setFilterStart(''); setFilterEnd(''); }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Balance cards */}
      {balancesLoading ? (
        <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
      ) : (balances || []).length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {(balances as any[]).map((b: any) => {
            const neg = b.current_quantity < 0;
            return (
              <Card key={b.id ?? `${b.product_id}-${b.farm_id}`}>
                <CardContent className="p-3 space-y-1">
                  <p className="text-xs font-semibold leading-tight truncate" title={b.product_name}>{b.product_name}</p>
                  <Badge variant="outline" className="text-xs">{b.product_category}</Badge>
                  <div className="pt-1">
                    <p className="text-xs text-muted-foreground">{b.product_unit}</p>
                    <p className={`text-xl font-bold ${neg ? 'text-red-500' : 'text-green-600'}`}>{fmt(b.current_quantity)}</p>
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
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>DN Ref</TableHead>
                <TableHead>Recorded By</TableHead>
                {canRecord && <TableHead className="w-20"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!entries || entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No entries found</TableCell>
                </TableRow>
              ) : (entries as any[]).slice(0, 200).map((e: any, i: number) => (
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
                  <TableCell className="text-right font-medium">{fmt(e.quantity)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {e.from_to_location
                      || [e.origin_label, e.dest_label].filter(Boolean).join(' → ')
                      || '—'}
                  </TableCell>
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
            initialFarmId={farmId}
            initialCategory={categoryFilter !== 'all' ? categoryFilter : CATEGORIES[0].value}
            farms={farms || []}
            editingEntry={editingEntry}
            onClose={() => { setShowEntry(false); setEditingEntry(null); }}
            onSaved={handleEntrySaved}
          />
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  );
};
