"use client";

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApi } from '@/hooks';
import apiService from '@/services/api';
import type { Farm } from '@/types';
import type { C2PRecord, C2PCreate } from '@/types/cherry-parchment';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  farms: Farm[];
  existing?: C2PRecord | null;
}

export const ParchmentRecordForm: React.FC<Props> = ({ open, onClose, onSaved, farms, existing }) => {
  const [farmId, setFarmId] = useState(existing?.farm_id?.toString() ?? '');
  const [blockCode, setBlockCode] = useState(existing?.block_code ?? '');
  const [blockId, setBlockId] = useState<string>('');

  // Load blocks for the selected farm
  const fetchBlocks = useCallback(() => {
    if (!farmId) return Promise.resolve([]);
    return apiService.getBlocksForFarm(Number(farmId));
  }, [farmId]);
  const { data: blocks, loading: blocksLoading } = useApi<any[]>(fetchBlocks, {
    dependencies: [farmId],
  });

  const handleBlockSelect = (id: string) => {
    setBlockId(id);
    const block = (blocks ?? []).find((b: any) => String(b.id) === id);
    if (block) setBlockCode(block.code ?? '');
  };
  const [batchDate, setBatchDate] = useState(
    existing?.batch_date ? existing.batch_date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [cherryIn, setCherryIn] = useState(existing?.cherry_kg_in?.toString() ?? '');
  const [p1, setP1] = useState(existing?.p1_kg_out?.toString() ?? '');
  const [p2, setP2] = useState(existing?.p2_kg_out?.toString() ?? '');
  const [p3, setP3] = useState(existing?.p3_kg_out?.toString() ?? '');
  const [dnNumber, setDnNumber] = useState(existing?.dn_number ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!existing;

  const totalParchment = (parseFloat(p1 || '0') + parseFloat(p2 || '0') + parseFloat(p3 || '0'));
  const outturn = cherryIn && parseFloat(cherryIn) > 0
    ? ((totalParchment / parseFloat(cherryIn)) * 100).toFixed(1)
    : '0.0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmId || !batchDate || !cherryIn) {
      setError('Farm, date and Cherry In KG are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: C2PCreate = {
        farm_id: parseInt(farmId),
        batch_date: new Date(batchDate).toISOString(),
        cherry_kg_in: parseFloat(cherryIn),
        p1_kg_out: parseFloat(p1) || 0,
        p2_kg_out: parseFloat(p2) || 0,
        p3_kg_out: parseFloat(p3) || 0,
        block_code: blockCode || null,
        dn_number: dnNumber || null,
        notes: notes || null,
      };
      if (isEdit) {
        await apiService.cherryParchment.updateRecord(existing.id, payload);
      } else {
        await apiService.cherryParchment.createRecord(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Parchment Record' : 'Add Parchment Record'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Farm *</Label>
              <Select value={farmId} onValueChange={setFarmId} disabled={isEdit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms.map(f => (
                    <SelectItem key={f.farm_id} value={f.farm_id.toString()}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Block</Label>
              <Select
                value={blockId}
                onValueChange={handleBlockSelect}
                disabled={!farmId || blocksLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !farmId ? 'Select a farm first'
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
              {blockCode && (
                <p className="text-xs text-muted-foreground mt-1">Code: <strong>{blockCode}</strong></p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Batch Date *</Label>
              <Input type="date" value={batchDate} onChange={e => setBatchDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Cherry In (KG) *</Label>
              <Input
                type="number" step="0.01" min="0"
                placeholder="0.00"
                value={cherryIn}
                onChange={e => setCherryIn(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-1 block">Parchment Output (KG)</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">P1</Label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" value={p1} onChange={e => setP1(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">P2</Label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" value={p2} onChange={e => setP2(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">P3</Label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" value={p3} onChange={e => setP3(e.target.value)} />
              </div>
            </div>
          </div>

          {(p1 || p2 || p3) && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900 flex justify-between">
              <span>Total parchment: <strong>{totalParchment.toFixed(2)} KG</strong></span>
              <span>Outturn: <strong>{outturn}%</strong></span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>DN Number</Label>
              <Input placeholder="e.g. DN-202508-0001" value={dnNumber} onChange={e => setDnNumber(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Save Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
