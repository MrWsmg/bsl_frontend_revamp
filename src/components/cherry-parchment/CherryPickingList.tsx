"use client";

import React, { useState, useCallback } from 'react';
import { Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { useApi } from '@/hooks';
import apiService from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from '@/components/ui/sonner';
import type { Farm } from '@/types';
import type { PickingEntry, PickingEntryCreate } from '@/types/cherry-parchment';

interface Props {
  farms: Farm[];
  farmId: number | null;
  dateFrom: string;
  dateTo: string;
}

function fmt(n: number) { return n.toLocaleString(undefined, { maximumFractionDigits: 2 }); }
function fmtCurrency(n: number) { return 'TZS ' + n.toLocaleString('en-TZ', { maximumFractionDigits: 0 }); }

// ── Form ─────────────────────────────────────────────────────────────────────

interface FormProps {
  farms: Farm[];
  existing?: PickingEntry | null;
  onClose: () => void;
  onSaved: () => void;
}

const PickingEntryForm: React.FC<FormProps> = ({ farms, existing, onClose, onSaved }) => {
  const isEdit = !!existing;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    farm_id: existing?.farm_id?.toString() ?? '',
    block_code: existing?.block_code ?? '',
    block_description: existing?.block_description ?? '',
    area_ha: existing?.area_ha?.toString() ?? '',
    variety: existing?.variety ?? '',
    picking_date: existing?.picking_date
      ? existing.picking_date.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    pickers_count: existing?.pickers_count?.toString() ?? '',
    cherry_kg: existing?.cherry_kg?.toString() ?? '',
    price_per_kg: existing?.price_per_kg?.toString() ?? '',
    dn_number: existing?.dn_number ?? '',
    comments: existing?.comments ?? '',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  // Load blocks when a farm is selected
  const fetchBlocks = useCallback(() => {
    if (!form.farm_id) return Promise.resolve([]);
    return apiService.getBlocksForFarm(Number(form.farm_id));
  }, [form.farm_id]);
  const { data: blocks, loading: blocksLoading } = useApi<any[]>(fetchBlocks, {
    dependencies: [form.farm_id],
  });

  const handleBlockSelect = (blockId: string) => {
    const block = (blocks ?? []).find((b: any) => String(b.id) === blockId);
    if (block) {
      setForm(p => ({
        ...p,
        block_code: block.code ?? '',
        block_description: block.name ?? '',
        area_ha: block.area_ha != null ? String(block.area_ha) : p.area_ha,
        variety: block.variety ?? p.variety,
      }));
    }
  };

  const pickers = parseFloat(form.pickers_count) || 0;
  const kg = parseFloat(form.cherry_kg) || 0;
  const price = parseFloat(form.price_per_kg) || 0;
  const ratio = pickers > 0 ? (kg / pickers).toFixed(2) : '—';
  const totalPayment = (kg * price).toFixed(2);

  const handleSave = async () => {
    if (!form.farm_id || !form.picking_date || !form.pickers_count || !form.cherry_kg || !form.price_per_kg) {
      setError('Farm, date, pickers, KGS and price/kg are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: PickingEntryCreate = {
        farm_id: parseInt(form.farm_id),
        picking_date: new Date(form.picking_date).toISOString(),
        pickers_count: parseInt(form.pickers_count),
        cherry_kg: parseFloat(form.cherry_kg),
        price_per_kg: parseFloat(form.price_per_kg),
        block_code: form.block_code || null,
        block_description: form.block_description || null,
        area_ha: form.area_ha ? parseFloat(form.area_ha) : null,
        variety: form.variety || null,
        dn_number: form.dn_number || null,
        comments: form.comments || null,
      };
      if (isEdit && existing) {
        await apiService.cherryParchment.updatePickingEntry(existing.id, payload);
      } else {
        await apiService.cherryParchment.createPickingEntry(payload);
      }
      toast.success(isEdit ? 'Entry updated' : 'Picking entry saved');
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Picking Entry' : 'Add Cherry Picking Entry'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Row 1: Farm */}
          <div className="space-y-1">
            <Label>Farm *</Label>
            <Select value={form.farm_id} onValueChange={v => set('farm_id', v)} disabled={isEdit}>
              <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
              <SelectContent>
                {farms.map(f => (
                  <SelectItem key={f.farm_id} value={String(f.farm_id)}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 2: Block selector */}
          <div className="space-y-1">
            <Label>Block</Label>
            <Select
              value={(blocks ?? []).find((b: any) => b.code === form.block_code) ? String((blocks ?? []).find((b: any) => b.code === form.block_code).id) : ''}
              onValueChange={handleBlockSelect}
              disabled={!form.farm_id || blocksLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !form.farm_id ? 'Select a farm first'
                  : blocksLoading ? 'Loading blocks…'
                  : 'Select block'
                } />
              </SelectTrigger>
              <SelectContent>
                {(blocks ?? []).map((b: any) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.code} — {b.name}
                    {b.area_ha ? ` (${b.area_ha} ha)` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.block_code && (
              <p className="text-xs text-muted-foreground mt-1">
                Code: <strong>{form.block_code}</strong>
                {form.block_description && <> · {form.block_description}</>}
                {form.area_ha && <> · {form.area_ha} ha</>}
                {form.variety && <> · {form.variety}</>}
              </p>
            )}
          </div>

          {/* Row 3: Date + Pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Picking Date *</Label>
              <Input type="date" value={form.picking_date} onChange={e => set('picking_date', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Pickers *</Label>
              <Input type="number" min="0" placeholder="0" value={form.pickers_count} onChange={e => set('pickers_count', e.target.value)} />
            </div>
          </div>

          {/* Row 4: KGS + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Cherry KGS *</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.cherry_kg} onChange={e => set('cherry_kg', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Price / KG (TZS) *</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.price_per_kg} onChange={e => set('price_per_kg', e.target.value)} />
            </div>
          </div>

          {/* Live preview */}
          {(form.cherry_kg || form.pickers_count) && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900 flex justify-between">
              <span>Ratio: <strong>{ratio} kg/picker</strong></span>
              <span>T. Payment: <strong>TZS {parseFloat(totalPayment).toLocaleString()}</strong></span>
            </div>
          )}

          {/* DN # + Comments */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>DN #</Label>
              <Input placeholder="e.g. DN-202508-0001" value={form.dn_number} onChange={e => set('dn_number', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Comments</Label>
              <Input placeholder="Optional" value={form.comments} onChange={e => set('comments', e.target.value)} />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Update' : 'Save Entry'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── List ──────────────────────────────────────────────────────────────────────

export const CherryPickingList: React.FC<Props> = ({ farms, farmId, dateFrom, dateTo }) => {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PickingEntry | null>(null);

  const fetchEntries = useCallback(() => {
    return apiService.cherryParchment.listPickingEntries({
      farm_id: farmId ?? undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  }, [farmId, dateFrom, dateTo]);

  const { data: entries, loading, error, refetch } = useApi<PickingEntry[]>(fetchEntries, {
    dependencies: [farmId, dateFrom, dateTo],
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this picking entry?')) return;
    await apiService.cherryParchment.deletePickingEntry(id);
    toast.success('Entry deleted');
    refetch();
  };

  const list = entries ?? [];
  const totalKg = list.reduce((s, e) => s + e.cherry_kg, 0);
  const totalPayment = list.reduce((s, e) => s + e.total_payment, 0);
  const totalPickers = list.reduce((s, e) => s + e.pickers_count, 0);

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">
              Total: <strong className="text-amber-700">{totalKg.toFixed(1)} KG</strong>
            </span>
            <span className="text-muted-foreground">
              Pickers: <strong>{totalPickers}</strong>
            </span>
            <span className="text-muted-foreground">
              Payment: <strong>{fmtCurrency(totalPayment)}</strong>
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={refetch}><RefreshCw className="h-4 w-4" /></Button>
            <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Entry
            </Button>
          </div>
        </div>

        {loading && <div className="flex justify-center py-8"><LoadingSpinner /></div>}
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        {!loading && list.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No picking entries found.</p>
        )}

        {!loading && list.length > 0 && (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Variety</TableHead>
                    <TableHead className="text-right">Area (ha)</TableHead>
                    <TableHead className="text-right">Pickers</TableHead>
                    <TableHead className="text-right">KGS</TableHead>
                    <TableHead className="text-right">Ratio</TableHead>
                    <TableHead className="text-right">Paid/KG</TableHead>
                    <TableHead className="text-right">T. Payment</TableHead>
                    <TableHead>DN #</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(e.picking_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {e.block_code ? <Badge variant="outline">{e.block_code}</Badge> : '—'}
                      </TableCell>
                      <TableCell className="text-sm max-w-[140px] truncate">
                        {e.block_description ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {e.variety ?? '—'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {e.area_ha != null ? e.area_ha.toFixed(2) : '—'}
                      </TableCell>
                      <TableCell className="text-right">{e.pickers_count}</TableCell>
                      <TableCell className="text-right font-semibold text-amber-700">
                        {fmt(e.cherry_kg)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {fmt(e.ratio_kg_per_picker)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {fmt(e.price_per_kg)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-700">
                        {fmtCurrency(e.total_payment)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {e.dn_number ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">
                        {e.comments ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => { setEditing(e); setShowForm(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500"
                            onClick={() => handleDelete(e.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals row */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={5}>Totals</TableCell>
                    <TableCell className="text-right">{totalPickers}</TableCell>
                    <TableCell className="text-right text-amber-700">{totalKg.toFixed(1)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {totalPickers > 0 ? (totalKg / totalPickers).toFixed(2) : '—'}
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-right text-green-700">{fmtCurrency(totalPayment)}</TableCell>
                    <TableCell colSpan={3} />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {showForm && (
        <PickingEntryForm
          farms={farms}
          existing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={refetch}
        />
      )}
    </>
  );
};
