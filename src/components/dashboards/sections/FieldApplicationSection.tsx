"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '../../ui/sonner';
import { Leaf, FlaskConical, Plus, Trash2, Filter } from 'lucide-react';
import { FertilizerFieldApplication, ChemicalFieldApplication } from '../../../types';

const CAN_WRITE = new Set(['admin', 'farm_clerk', 'supervisor', 'manager', 'general_manager', 'managing_director']);
const CAN_DELETE = new Set(['admin', 'manager', 'general_manager', 'managing_director']);

const CHEMICAL_TYPES = ['AGROCHEMICAL', 'HERBICIDE', 'FUNGICIDE', 'OTHER'] as const;
const APPL_METHODS_FERT = ['broadcast', 'band', 'foliar', 'drench', 'other'];
const APPL_METHODS_CHEM = ['spray', 'drench', 'drip', 'foliar', 'other'];
const CHEM_UNITS = ['L', 'ml', 'kg', 'g'];

function fmt(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Radix Select cannot have value="". Convert empty ↔ sentinel at the boundary.
const toSel = (v: string, sentinel = '__none__') => v || sentinel;
const fromSel = (v: string) => v.startsWith('__') ? '' : v;

// ── Fertilizer Log Form ───────────────────────────────────────────────────────

interface FertFormProps {
  farms: any[];
  products: any[];
  onSaved: () => void;
  onClose: () => void;
}

function FertForm({ farms, products, onSaved, onClose }: FertFormProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [form, setForm] = useState({
    farm_id: '',
    block_id: '',
    application_date: '',
    price_list_id: '',
    product_name: '',
    quantity_kg: '',
    quantity_bags: '',
    application_method: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Fetch blocks when farm changes
  useEffect(() => {
    if (!form.farm_id) { setBlocks([]); return; }
    apiService.getBlocksForFarm(Number(form.farm_id))
      .then(setBlocks)
      .catch(() => setBlocks([]));
  }, [form.farm_id]);

  // Auto-fill product_name from selected price_list item
  useEffect(() => {
    if (!form.price_list_id) return;
    const p = products.find((x: any) => String(x.id) === form.price_list_id);
    if (p) set('product_name', p.name);
  }, [form.price_list_id, products]);

  const handleSave = async () => {
    if (!form.farm_id || !form.application_date || (!form.price_list_id && !form.product_name)) {
      toast.error('Farm, date, and product are required');
      return;
    }
    if (!form.quantity_kg && !form.quantity_bags) {
      toast.error('Enter quantity (kg or bags)');
      return;
    }
    setSaving(true);
    try {
      await apiService.createFertilizerApplication({
        farm_id: Number(form.farm_id),
        block_id: form.block_id ? Number(form.block_id) : undefined,
        application_date: new Date(form.application_date).toISOString(),
        price_list_id: form.price_list_id ? Number(form.price_list_id) : undefined,
        product_name: form.product_name,
        quantity_kg: form.quantity_kg ? Number(form.quantity_kg) : 0,
        quantity_bags: form.quantity_bags ? Number(form.quantity_bags) : undefined,
        application_method: form.application_method || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Fertilizer application recorded');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Farm *</Label>
          <Select value={form.farm_id} onValueChange={v => set('farm_id', v)}>
            <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
            <SelectContent>
              {farms.map((f: any) => (
                <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Block</Label>
          <Select value={toSel(form.block_id)} onValueChange={v => set('block_id', fromSel(v))} disabled={!form.farm_id}>
            <SelectTrigger><SelectValue placeholder={form.farm_id ? 'Select block' : 'Select farm first'} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Farm-wide —</SelectItem>
              {blocks.map((b: any) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.code} — {b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Application Date *</Label>
        <Input type="date" value={form.application_date} onChange={e => set('application_date', e.target.value)} />
      </div>

      <div>
        <Label>Product (from price list)</Label>
        <Select value={toSel(form.price_list_id, '__manual__')} onValueChange={v => set('price_list_id', fromSel(v))}>
          <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__manual__">— manual entry —</SelectItem>
            {products.map((p: any) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Product Name *</Label>
        <Input value={form.product_name} onChange={e => set('product_name', e.target.value)} placeholder="e.g. UREA 46%" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Quantity (kg)</Label>
          <Input type="number" min="0" step="0.1" value={form.quantity_kg} onChange={e => set('quantity_kg', e.target.value)} />
        </div>
        <div>
          <Label>Quantity (bags)</Label>
          <Input type="number" min="0" step="0.5" value={form.quantity_bags} onChange={e => set('quantity_bags', e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Application Method</Label>
        <Select value={toSel(form.application_method)} onValueChange={v => set('application_method', fromSel(v))}>
          <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— none —</SelectItem>
            {APPL_METHODS_FERT.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Notes</Label>
        <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </div>
  );
}

// ── Chemical Log Form ─────────────────────────────────────────────────────────

interface ChemFormProps {
  farms: any[];
  products: any[];
  onSaved: () => void;
  onClose: () => void;
}

function ChemForm({ farms, products, onSaved, onClose }: ChemFormProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [form, setForm] = useState({
    farm_id: '',
    block_id: '',
    application_date: '',
    price_list_id: '',
    product_name: '',
    chemical_type: 'AGROCHEMICAL',
    quantity_applied: '',
    unit: 'L',
    dilution_rate: '',
    target_pest_weed: '',
    application_method: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!form.farm_id) { setBlocks([]); return; }
    apiService.getBlocksForFarm(Number(form.farm_id))
      .then(setBlocks)
      .catch(() => setBlocks([]));
  }, [form.farm_id]);

  useEffect(() => {
    if (!form.price_list_id) return;
    const p = products.find((x: any) => String(x.id) === form.price_list_id);
    if (p) {
      set('product_name', p.name);
      if (p.category) set('chemical_type', p.category.toUpperCase());
    }
  }, [form.price_list_id, products]);

  const handleSave = async () => {
    if (!form.farm_id || !form.application_date || (!form.price_list_id && !form.product_name)) {
      toast.error('Farm, date, and product are required');
      return;
    }
    if (!form.quantity_applied) {
      toast.error('Enter quantity applied');
      return;
    }
    setSaving(true);
    try {
      await apiService.createChemicalApplication({
        farm_id: Number(form.farm_id),
        block_id: form.block_id ? Number(form.block_id) : undefined,
        application_date: new Date(form.application_date).toISOString(),
        price_list_id: form.price_list_id ? Number(form.price_list_id) : undefined,
        product_name: form.product_name,
        chemical_type: form.chemical_type,
        quantity_applied: Number(form.quantity_applied),
        unit: form.unit,
        dilution_rate: form.dilution_rate || undefined,
        target_pest_weed: form.target_pest_weed || undefined,
        application_method: form.application_method || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Chemical application recorded');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Farm *</Label>
          <Select value={form.farm_id} onValueChange={v => set('farm_id', v)}>
            <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
            <SelectContent>
              {farms.map((f: any) => (
                <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Block</Label>
          <Select value={toSel(form.block_id)} onValueChange={v => set('block_id', fromSel(v))} disabled={!form.farm_id}>
            <SelectTrigger><SelectValue placeholder={form.farm_id ? 'Select block' : 'Select farm first'} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Farm-wide —</SelectItem>
              {blocks.map((b: any) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.code} — {b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Application Date *</Label>
        <Input type="date" value={form.application_date} onChange={e => set('application_date', e.target.value)} />
      </div>

      <div>
        <Label>Chemical Type</Label>
        <Select value={form.chemical_type} onValueChange={v => set('chemical_type', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CHEMICAL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Product (from price list)</Label>
        <Select value={toSel(form.price_list_id, '__manual__')} onValueChange={v => set('price_list_id', fromSel(v))}>
          <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__manual__">— manual entry —</SelectItem>
            {products.map((p: any) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Product Name *</Label>
        <Input value={form.product_name} onChange={e => set('product_name', e.target.value)} placeholder="e.g. CYPERMETHRINE 10EC" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Quantity *</Label>
          <Input type="number" min="0" step="0.01" value={form.quantity_applied} onChange={e => set('quantity_applied', e.target.value)} />
        </div>
        <div>
          <Label>Unit</Label>
          <Select value={form.unit} onValueChange={v => set('unit', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CHEM_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Dilution Rate</Label>
          <Input value={form.dilution_rate} onChange={e => set('dilution_rate', e.target.value)} placeholder="e.g. 200ml/20L" />
        </div>
        <div>
          <Label>Target Pest / Weed</Label>
          <Input value={form.target_pest_weed} onChange={e => set('target_pest_weed', e.target.value)} placeholder="e.g. Coffee Berry Borer" />
        </div>
      </div>

      <div>
        <Label>Application Method</Label>
        <Select value={toSel(form.application_method)} onValueChange={v => set('application_method', fromSel(v))}>
          <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— none —</SelectItem>
            {APPL_METHODS_CHEM.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Notes</Label>
        <Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </div>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────

interface Filters {
  farm_id: string;
  block_id: string;
  start_date: string;
  end_date: string;
  product_name: string;
  chemical_type: string;
}

const EMPTY_FILTERS: Filters = {
  farm_id: '', block_id: '', start_date: '', end_date: '', product_name: '', chemical_type: '',
};

interface FilterBarProps {
  farms: any[];
  filters: Filters;
  onChange: (f: Filters) => void;
  onApply: () => void;
  showChemType?: boolean;
}

function FilterBar({ farms, filters, onChange, onApply, showChemType }: FilterBarProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const set = (k: keyof Filters, v: string) => onChange({ ...filters, [k]: v });

  useEffect(() => {
    if (!filters.farm_id) { setBlocks([]); return; }
    apiService.getBlocksForFarm(Number(filters.farm_id))
      .then(setBlocks)
      .catch(() => setBlocks([]));
  }, [filters.farm_id]);

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div className="min-w-[160px]">
        <Label className="text-xs">Farm</Label>
        <Select value={toSel(filters.farm_id, '__all__')} onValueChange={v => set('farm_id', fromSel(v))}>
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All farms" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All farms</SelectItem>
            {farms.map((f: any) => (
              <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-[140px]">
        <Label className="text-xs">Block</Label>
        <Select value={toSel(filters.block_id, '__all__')} onValueChange={v => set('block_id', fromSel(v))} disabled={!filters.farm_id}>
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All blocks" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All blocks</SelectItem>
            {blocks.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.code}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {showChemType && (
        <div className="min-w-[150px]">
          <Label className="text-xs">Chemical Type</Label>
          <Select value={toSel(filters.chemical_type, '__all__')} onValueChange={v => set('chemical_type', fromSel(v))}>
            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All types</SelectItem>
              {CHEMICAL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label className="text-xs">From</Label>
        <Input type="date" className="h-8 text-sm w-36" value={filters.start_date} onChange={e => set('start_date', e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">To</Label>
        <Input type="date" className="h-8 text-sm w-36" value={filters.end_date} onChange={e => set('end_date', e.target.value)} />
      </div>
      <div className="flex-1 min-w-[160px]">
        <Label className="text-xs">Product name</Label>
        <Input className="h-8 text-sm" value={filters.product_name} onChange={e => set('product_name', e.target.value)} placeholder="Search product…" />
      </div>
      <Button size="sm" onClick={onApply} className="h-8 gap-1"><Filter className="h-3 w-3" /> Apply</Button>
      <Button size="sm" variant="ghost" className="h-8" onClick={() => { onChange(EMPTY_FILTERS); }}>Clear</Button>
    </div>
  );
}

// ── Fertilizer Tab ────────────────────────────────────────────────────────────

function FertilizerTab({ farms, products, canWrite, canDelete }: { farms: any[]; products: any[]; canWrite: boolean; canDelete: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState<Filters>(EMPTY_FILTERS);

  const getRecords = useCallback(() => apiService.getFertilizerApplications({
    farm_id: activeFilters.farm_id ? Number(activeFilters.farm_id) : undefined,
    block_id: activeFilters.block_id ? Number(activeFilters.block_id) : undefined,
    start_date: activeFilters.start_date || undefined,
    end_date: activeFilters.end_date || undefined,
    product_name: activeFilters.product_name || undefined,
  }), [activeFilters]);

  const { data: records, loading, refetch } = useApi(getRecords);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this application record?')) return;
    try {
      await apiService.deleteFertilizerApplication(id);
      toast.success('Deleted');
      refetch();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Fertilizer Applications</h3>
        {canWrite && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Log Application
          </Button>
        )}
      </div>

      <FilterBar farms={farms} filters={filters} onChange={setFilters} onApply={() => setActiveFilters({ ...filters })} />

      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
      ) : (
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Farm</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty (kg)</TableHead>
                <TableHead className="text-right">Qty (bags)</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Notes</TableHead>
                {canDelete && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!records || records.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
              ) : (records as FertilizerFieldApplication[]).map(r => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap font-medium">{fmt(r.application_date)}</TableCell>
                  <TableCell>{(r as any).farm_name || r.farm_id}</TableCell>
                  <TableCell>{r.block_code || '—'}</TableCell>
                  <TableCell>{r.product_name}</TableCell>
                  <TableCell className="text-right">{r.quantity_kg > 0 ? r.quantity_kg.toLocaleString() : '—'}</TableCell>
                  <TableCell className="text-right">{r.quantity_bags != null ? r.quantity_bags : '—'}</TableCell>
                  <TableCell>{r.application_method || '—'}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-muted-foreground">{r.notes || '—'}</TableCell>
                  {canDelete && (
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Fertilizer Application</DialogTitle></DialogHeader>
          <FertForm farms={farms} products={products} onSaved={refetch} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Chemical Tab ──────────────────────────────────────────────────────────────

function ChemicalTab({ farms, products, canWrite, canDelete }: { farms: any[]; products: any[]; canWrite: boolean; canDelete: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState<Filters>(EMPTY_FILTERS);

  const getRecords = useCallback(() => apiService.getChemicalApplications({
    farm_id: activeFilters.farm_id ? Number(activeFilters.farm_id) : undefined,
    block_id: activeFilters.block_id ? Number(activeFilters.block_id) : undefined,
    chemical_type: (activeFilters.chemical_type as any) || undefined,
    start_date: activeFilters.start_date || undefined,
    end_date: activeFilters.end_date || undefined,
    product_name: activeFilters.product_name || undefined,
  }), [activeFilters]);

  const { data: records, loading, refetch } = useApi(getRecords);

  const typeColor: Record<string, string> = {
    AGROCHEMICAL: 'bg-amber-100 text-amber-800',
    HERBICIDE: 'bg-red-100 text-red-800',
    FUNGICIDE: 'bg-purple-100 text-purple-800',
    OTHER: 'bg-gray-100 text-gray-700',
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this application record?')) return;
    try {
      await apiService.deleteChemicalApplication(id);
      toast.success('Deleted');
      refetch();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Chemical / Agrochemical Applications</h3>
        {canWrite && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Log Application
          </Button>
        )}
      </div>

      <FilterBar farms={farms} filters={filters} onChange={setFilters} onApply={() => setActiveFilters({ ...filters })} showChemType />

      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
      ) : (
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Farm</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Dilution</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Method</TableHead>
                {canDelete && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!records || records.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
              ) : (records as ChemicalFieldApplication[]).map(r => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap font-medium">{fmt(r.application_date)}</TableCell>
                  <TableCell>{(r as any).farm_name || r.farm_id}</TableCell>
                  <TableCell>{r.block_code || '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${typeColor[r.chemical_type] || typeColor.OTHER}`}>
                      {r.chemical_type}
                    </span>
                  </TableCell>
                  <TableCell>{r.product_name}</TableCell>
                  <TableCell className="text-right">{r.quantity_applied}</TableCell>
                  <TableCell>{r.unit}</TableCell>
                  <TableCell>{r.dilution_rate || '—'}</TableCell>
                  <TableCell className="max-w-[120px] truncate">{r.target_pest_weed || '—'}</TableCell>
                  <TableCell>{r.application_method || '—'}</TableCell>
                  {canDelete && (
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Chemical Application</DialogTitle></DialogHeader>
          <ChemForm farms={farms} products={products} onSaved={refetch} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────

interface FieldApplicationSectionProps {
  userRole?: string;
}

export const FieldApplicationSection: React.FC<FieldApplicationSectionProps> = ({ userRole }) => {
  const { user } = useAuth();
  const role = userRole || user?.role || '';

  const canWrite = CAN_WRITE.has(role);
  const canDelete = CAN_DELETE.has(role);

  // Fetch farms, fertilizer products, and chemical products in parallel
  const getFarms = useCallback(() => apiService.getFarms(), []);
  const getFertProducts = useCallback(() => apiService.getFertilizerProducts({}), []);
  const getChemProducts = useCallback(() => apiService.getFuelChemProducts({ category: 'AGROCHEMICAL' }), []);

  const { data: farms, loading: farmsLoading } = useApi(getFarms);
  const { data: fertProducts } = useApi(getFertProducts);
  const { data: chemProducts } = useApi(getChemProducts);

  if (farmsLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            Field Application Records
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Record when fertilizers and chemicals were applied to blocks — separate from stock movements.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fertilizer">
            <TabsList className="mb-4">
              <TabsTrigger value="fertilizer" className="gap-1.5">
                <Leaf className="h-4 w-4" /> Fertilizer
              </TabsTrigger>
              <TabsTrigger value="chemicals" className="gap-1.5">
                <FlaskConical className="h-4 w-4" /> Chemicals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fertilizer">
              <FertilizerTab
                farms={farms || []}
                products={fertProducts || []}
                canWrite={canWrite}
                canDelete={canDelete}
              />
            </TabsContent>

            <TabsContent value="chemicals">
              <ChemicalTab
                farms={farms || []}
                products={chemProducts || []}
                canWrite={canWrite}
                canDelete={canDelete}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
