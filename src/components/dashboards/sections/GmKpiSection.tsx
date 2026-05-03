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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Target, Plus, RefreshCw, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const KPI_BASE = '/kpis';

export const GmKpiSection: React.FC = () => {
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', target_value: '', unit: '',
    farm_id: '', period: 'monthly',
  });

  const fetchFarms = useCallback(() => apiService.getFarms('admin'), []);
  const { data: farms } = useApi(fetchFarms);
  const farmList = Array.isArray(farms) ? farms : [];

  const fetchKpis = useCallback(async (): Promise<any[]> => {
    try {
      return await (apiService as any).analytics.get(KPI_BASE);
    } catch {
      return [];
    }
  }, []);

  const { data: raw, loading, error, refetch } = useApi<any>(fetchKpis);
  const kpis: any[] = Array.isArray(raw) ? raw : (raw as any)?.kpis ?? (raw as any)?.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', target_value: '', unit: '', farm_id: '', period: 'monthly' });
    setShowForm(true);
  };

  const openEdit = (kpi: any) => {
    setEditing(kpi);
    setForm({
      name:         kpi.name ?? '',
      description:  kpi.description ?? '',
      target_value: kpi.target_value != null ? String(kpi.target_value) : '',
      unit:         kpi.unit ?? '',
      farm_id:      kpi.farm_id != null ? String(kpi.farm_id) : '',
      period:       kpi.period ?? 'monthly',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error('KPI name is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name:        form.name,
        description: form.description || undefined,
        unit:        form.unit        || undefined,
        period:      form.period,
      };
      if (form.target_value) payload.target_value = parseFloat(form.target_value);
      if (form.farm_id)      payload.farm_id      = parseInt(form.farm_id);

      if (editing) {
        await (apiService.analytics as any).put(`${KPI_BASE}/${editing.id}`, payload);
        toast.success('KPI updated');
      } else {
        await (apiService.analytics as any).post(KPI_BASE, payload);
        toast.success('KPI created');
      }
      setShowForm(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save KPI');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (kpi: any) => {
    if (!window.confirm(`Delete KPI "${kpi.name}"?`)) return;
    setDeletingId(kpi.id);
    try {
      await (apiService.analytics as any).delete(`${KPI_BASE}/${kpi.id}`);
      toast.success('KPI deleted');
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete KPI');
    } finally {
      setDeletingId(null);
    }
  };

  const inputCls = 'border border-input rounded-md px-3 py-2 text-sm bg-background';

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">KPIs</h2>
          <p className="text-sm text-muted-foreground">Key Performance Indicators across operations</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> Add KPI
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> KPI List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
          ) : kpis.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No KPIs defined yet</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1" /> Add First KPI
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Farm</th>
                    <th className="text-right px-3 py-2">Target</th>
                    <th className="text-left px-3 py-2">Unit</th>
                    <th className="text-left px-3 py-2">Period</th>
                    <th className="text-right px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {kpis.map((k: any) => (
                    <tr key={k.id} className="hover:bg-muted/50">
                      <td className="px-3 py-2 font-medium">
                        {k.name}
                        {k.description && (
                          <p className="text-xs text-muted-foreground">{k.description}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{k.farm_name ?? k.farm ?? 'All'}</td>
                      <td className="px-3 py-2 text-right font-semibold">{k.target_value ?? '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{k.unit ?? '—'}</td>
                      <td className="px-3 py-2">
                        <Badge variant="secondary" className="text-xs capitalize">{k.period ?? '—'}</Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(k)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(k)}
                            disabled={deletingId === k.id}
                          >
                            {deletingId === k.id
                              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit KPI' : 'Add KPI'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Picking Productivity" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Target Value</Label>
                <Input type="number" value={form.target_value} onChange={e => setForm(p => ({ ...p, target_value: e.target.value }))} placeholder="e.g. 80" />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="e.g. %, kg, TZS" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Farm</Label>
                <select value={form.farm_id} onChange={e => setForm(p => ({ ...p, farm_id: e.target.value }))} className={`w-full ${inputCls}`}>
                  <option value="">All farms</option>
                  {farmList.map((f: any) => {
                    const fid = f.id ?? f.farm_id;
                    return <option key={fid} value={fid}>{f.name}</option>;
                  })}
                </select>
              </div>
              <div>
                <Label>Period</Label>
                <select value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))} className={`w-full ${inputCls}`}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving…' : (editing ? 'Update KPI' : 'Create KPI')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
