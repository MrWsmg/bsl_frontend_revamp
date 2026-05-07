"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import apiService from '@/services/api';
import type { Farm } from '@/types';
import type { HopperEntry, HopperEntryCreate } from '@/types/cherry-parchment';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  farms: Farm[];
  existing?: HopperEntry | null;
}

export const HopperEntryForm: React.FC<Props> = ({ open, onClose, onSaved, farms, existing }) => {
  const [farmId, setFarmId] = useState(existing?.farm_id?.toString() ?? '');
  const [entryDate, setEntryDate] = useState(
    existing?.entry_date ? existing.entry_date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [cherryIn, setCherryIn] = useState(existing?.cherry_in_kg?.toString() ?? '');
  const [cherryOut, setCherryOut] = useState(existing?.cherry_out_kg?.toString() ?? '0');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!existing;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmId || !entryDate || !cherryIn) {
      setError('Farm, date and Cherry In KG are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: HopperEntryCreate = {
        farm_id: parseInt(farmId),
        entry_date: new Date(entryDate).toISOString(),
        cherry_in_kg: parseFloat(cherryIn),
        cherry_out_kg: parseFloat(cherryOut) || 0,
        notes: notes || null,
      };
      if (isEdit) {
        await apiService.cherryParchment.updateHopperEntry(existing.id, payload);
      } else {
        await apiService.cherryParchment.createHopperEntry(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Hopper Entry' : 'Add Cherry to Hopper'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label>Date *</Label>
            <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Cherry In (KG) *</Label>
              <Input
                type="number" step="0.01" min="0"
                placeholder="0.00"
                value={cherryIn}
                onChange={e => setCherryIn(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Cherry Out (KG)</Label>
              <Input
                type="number" step="0.01" min="0"
                placeholder="0.00"
                value={cherryOut}
                onChange={e => setCherryOut(e.target.value)}
              />
            </div>
          </div>

          {cherryIn && (
            <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
              Net into hopper:{' '}
              <strong>{(parseFloat(cherryIn || '0') - parseFloat(cherryOut || '0')).toFixed(2)} KG</strong>
            </div>
          )}

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Save Entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
