"use client";

import React, { useState, useCallback } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useApi } from '@/hooks';
import apiService from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { toast } from '@/components/ui/sonner';
import type { Farm } from '@/types';
import type { ParchmentGrade, ParchmentGradeEntry, ParchmentGradeEntryCreate } from '@/types/cherry-parchment';

interface Props {
  farms: Farm[];
  farmId: number | null;
  dateFrom: string;
  dateTo: string;
}

const GRADES: ParchmentGrade[] = ['P1', 'P2', 'P3'];
const GRADE_COLORS: Record<ParchmentGrade, string> = {
  P1: 'text-green-700',
  P2: 'text-blue-700',
  P3: 'text-purple-700',
};

// ── Add-entry form ────────────────────────────────────────────────────────────

interface FormProps {
  grade: ParchmentGrade;
  farms: Farm[];
  onClose: () => void;
  onSaved: () => void;
}

const GradeEntryForm: React.FC<FormProps> = ({ grade, farms, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [blockId, setBlockId] = useState('');
  const [form, setForm] = useState({
    farm_id: '',
    block_code: '',
    entry_date: new Date().toISOString().slice(0, 10),
    in_kg: '',
    out_kg: '0',
    dn_number: '',
    notes: '',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const fetchBlocks = useCallback(() => {
    if (!form.farm_id) return Promise.resolve([]);
    return apiService.getBlocksForFarm(Number(form.farm_id));
  }, [form.farm_id]);
  const { data: blocks, loading: blocksLoading } = useApi<any[]>(fetchBlocks, {
    dependencies: [form.farm_id],
  });

  const handleBlockSelect = (id: string) => {
    setBlockId(id);
    const block = (blocks ?? []).find((b: any) => String(b.id) === id);
    if (block) set('block_code', block.code ?? '');
  };

  const handleFarmChange = (v: string) => {
    set('farm_id', v);
    setBlockId('');
    set('block_code', '');
  };

  const inKg = parseFloat(form.in_kg) || 0;
  const outKg = parseFloat(form.out_kg) || 0;

  const handleSave = async () => {
    if (!form.farm_id || !form.entry_date) {
      setError('Farm and date are required.');
      return;
    }
    if (!form.in_kg && !form.out_kg) {
      setError('Provide at least IN or OUT kg.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: ParchmentGradeEntryCreate = {
        farm_id: parseInt(form.farm_id),
        grade,
        entry_date: new Date(form.entry_date).toISOString(),
        in_kg: parseFloat(form.in_kg) || 0,
        out_kg: parseFloat(form.out_kg) || 0,
        block_code: form.block_code || null,
        dn_number: form.dn_number || null,
        notes: form.notes || null,
      };
      await apiService.cherryParchment.createParchmentGradeEntry(payload);
      toast.success(`${grade} entry saved`);
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Parchment Stock — <span className={GRADE_COLORS[grade]}>{grade}</span></DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Farm *</Label>
            <Select value={form.farm_id} onValueChange={handleFarmChange}>
              <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
              <SelectContent>
                {farms.map(f => (
                  <SelectItem key={f.farm_id} value={String(f.farm_id)}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Block</Label>
              <Select
                value={blockId}
                onValueChange={handleBlockSelect}
                disabled={!form.farm_id || blocksLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !form.farm_id ? 'Select farm first'
                    : blocksLoading ? 'Loading…'
                    : 'Select block'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {(blocks ?? []).map((b: any) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.code} — {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.block_code && (
                <p className="text-xs text-muted-foreground mt-1">Code: <strong>{form.block_code}</strong></p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Date *</Label>
              <Input type="date" value={form.entry_date} onChange={e => set('entry_date', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>IN (kg)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00"
                value={form.in_kg} onChange={e => set('in_kg', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>OUT (kg)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00"
                value={form.out_kg} onChange={e => set('out_kg', e.target.value)} />
            </div>
          </div>

          {(inKg > 0 || outKg > 0) && (
            <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
              Net movement: <strong>{(inKg - outKg) >= 0 ? '+' : ''}{(inKg - outKg).toFixed(2)} kg</strong>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>DN #</Label>
              <Input placeholder="e.g. DN-202508-0001" value={form.dn_number} onChange={e => set('dn_number', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input placeholder="Optional" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Entry'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Grade sub-tab ─────────────────────────────────────────────────────────────

interface GradeTabProps {
  grade: ParchmentGrade;
  farms: Farm[];
  farmId: number | null;
  dateFrom: string;
  dateTo: string;
}

const GradeTab: React.FC<GradeTabProps> = ({ grade, farms, farmId, dateFrom, dateTo }) => {
  const [showForm, setShowForm] = useState(false);

  const fetchEntries = useCallback(() => {
    return apiService.cherryParchment.listParchmentGradeEntries({
      farm_id: farmId ?? undefined,
      grade,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  }, [farmId, grade, dateFrom, dateTo]);

  const { data: entries, loading, error, refetch } = useApi<ParchmentGradeEntry[]>(fetchEntries, {
    dependencies: [farmId, grade, dateFrom, dateTo],
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this entry?')) return;
    await apiService.cherryParchment.deleteParchmentGradeEntry(id);
    toast.success('Entry deleted');
    refetch();
  };

  const list = entries ?? [];
  const currentBalance = list.length > 0 ? list[list.length - 1].balance_kg : 0;
  const totalIn = list.reduce((s, e) => s + e.in_kg, 0);
  const totalOut = list.reduce((s, e) => s + e.out_kg, 0);
  const colorClass = GRADE_COLORS[grade];

  return (
    <>
      <div className="space-y-4">
        {/* Stats + toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">
              Total IN: <strong className={colorClass}>{totalIn.toFixed(2)} KG</strong>
            </span>
            <span className="text-muted-foreground">
              Total OUT: <strong className="text-orange-700">{totalOut.toFixed(2)} KG</strong>
            </span>
            <span className="text-muted-foreground">
              Balance: <strong className="text-foreground">{currentBalance.toFixed(2)} KG</strong>
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={refetch}><RefreshCw className="h-4 w-4" /></Button>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add {grade}
            </Button>
          </div>
        </div>

        {loading && <div className="flex justify-center py-8"><LoadingSpinner /></div>}
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        {!loading && list.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No {grade} entries found.</p>
        )}

        {!loading && list.length > 0 && (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Block</TableHead>
                    <TableHead className="text-right">IN (kg)</TableHead>
                    <TableHead className="text-right">OUT (kg)</TableHead>
                    <TableHead className="text-right">Balance (kg)</TableHead>
                    <TableHead>DN #</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(e.entry_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {e.block_code ? <Badge variant="outline">{e.block_code}</Badge> : '—'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${colorClass}`}>
                        {e.in_kg > 0 ? e.in_kg.toFixed(2) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-orange-700">
                        {e.out_kg > 0 ? e.out_kg.toFixed(2) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {e.balance_kg.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {e.dn_number ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {e.notes ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500"
                          onClick={() => handleDelete(e.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Summary row */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>Balance</TableCell>
                    <TableCell className={`text-right ${colorClass}`}>{totalIn.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-orange-700">{totalOut.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{currentBalance.toFixed(2)}</TableCell>
                    <TableCell colSpan={3} />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {showForm && (
        <GradeEntryForm
          grade={grade}
          farms={farms}
          onClose={() => setShowForm(false)}
          onSaved={refetch}
        />
      )}
    </>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const ParchmentGradeList: React.FC<Props> = ({ farms, farmId, dateFrom, dateTo }) => {
  return (
    <Tabs defaultValue="P1">
      <TabsList className="mb-4">
        {GRADES.map(g => (
          <TabsTrigger key={g} value={g}>
            <span className={GRADE_COLORS[g]}>{g}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {GRADES.map(g => (
        <TabsContent key={g} value={g}>
          <GradeTab
            grade={g}
            farms={farms}
            farmId={farmId}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};
