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
import { Scale, DollarSign, RefreshCw, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';

type SubTab = 'sessions' | 'records' | 'prices';

export const GmPickingSection: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('sessions');

  return (
    <div className="space-y-4 p-6">
      <div>
        <h2 className="text-xl font-bold">Picking Operations</h2>
        <p className="text-sm text-muted-foreground">Sessions, records, and daily picking prices</p>
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {(['sessions', 'records', 'prices'] as SubTab[]).map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              subTab === t
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === 'sessions' && <PickingSessionsView />}
      {subTab === 'records'  && <PickingRecordsView />}
      {subTab === 'prices'   && <PickingPricesView />}
    </div>
  );
};

// ── Sessions ──────────────────────────────────────────────────────────────────

const PickingSessionsView: React.FC = () => {
  const fetch = useCallback(async (): Promise<any[]> => {
    try { return await (apiService as any).getPickingSessions(); } catch { return []; }
  }, []);
  const { data: raw, loading, error, refetch } = useApi<any>(fetch);
  const sessions: any[] = Array.isArray(raw) ? raw : (raw as any)?.sessions ?? (raw as any)?.data ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" /> Picking Sessions
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <ErrorBanner message={error} />}
        {loading ? (
          <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
        ) : sessions.length === 0 ? (
          <EmptyState message="No picking sessions found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="text-left px-3 py-2">Session</th>
                  <th className="text-left px-3 py-2">Farm</th>
                  <th className="text-left px-3 py-2">Block</th>
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-right px-3 py-2">Total (kg)</th>
                  <th className="text-left px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((s: any, i: number) => (
                  <tr key={s.id ?? i} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-medium">{s.session_name ?? s.id ?? '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{s.farm_name ?? s.farm ?? '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{s.block_name ?? s.block ?? '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{s.date ?? s.session_date ?? '—'}</td>
                    <td className="px-3 py-2 text-right font-medium">
                      {s.total_weight_kg != null ? Number(s.total_weight_kg).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <SessionStatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── Records ───────────────────────────────────────────────────────────────────

const PickingRecordsView: React.FC = () => {
  const [farmId, setFarmId] = useState('');
  const [dateFrom, setDateFrom] = useState('');

  const fetchFarms = useCallback(() => apiService.getFarms('admin'), []);
  const { data: farms } = useApi(fetchFarms);
  const farmList = Array.isArray(farms) ? farms : [];

  const buildParams = useCallback(() => {
    const p: Record<string, any> = {};
    if (farmId)   p.farm_id   = parseInt(farmId);
    if (dateFrom) p.start_date = dateFrom;
    return p;
  }, [farmId, dateFrom]);

  const fetch = useCallback(() => apiService.getPickingRecords(buildParams()), [buildParams]);
  const { data: raw, loading, error, refetch } = useApi<any>(fetch);
  const records: any[] = Array.isArray(raw) ? raw : (raw as any)?.records ?? (raw as any)?.data ?? [];

  const inputCls = 'border border-input rounded-md px-3 py-2 text-sm bg-background';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Picking Records</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Farm</label>
            <select value={farmId} onChange={e => setFarmId(e.target.value)} className={inputCls}>
              <option value="">All farms</option>
              {farmList.map((f: any) => {
                const fid = f.id ?? f.farm_id;
                return <option key={fid} value={fid}>{f.name}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">From</label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm" />
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {error && <ErrorBanner message={error} />}
        {loading ? (
          <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
        ) : records.length === 0 ? (
          <EmptyState message="No picking records found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="text-left px-3 py-2">Picker</th>
                  <th className="text-left px-3 py-2">Farm</th>
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-right px-3 py-2">Weight (kg)</th>
                  <th className="text-right px-3 py-2">Price/kg</th>
                  <th className="text-right px-3 py-2">Total (TZS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((r: any, i: number) => (
                  <tr key={r.id ?? i} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-medium">{r.picker_name ?? r.worker_name ?? '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.farm_name ?? '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.date ?? r.picking_date ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{r.weight_kg ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{r.price_per_kg ?? '—'}</td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {r.total_amount != null ? Number(r.total_amount).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── Prices ────────────────────────────────────────────────────────────────────

const PickingPricesView: React.FC = () => {
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [priceForm, setPriceForm] = useState({ farm_id: '', price_per_kg: '', effective_date: '' });

  const fetchFarms = useCallback(() => apiService.getFarms('admin'), []);
  const { data: farms } = useApi(fetchFarms);
  const farmList = Array.isArray(farms) ? farms : [];

  const fetch = useCallback(() => (apiService as any).getPickingPrices
    ? (apiService as any).getPickingPrices()
    : Promise.resolve([]), []);
  const { data: raw, loading, error, refetch } = useApi<any>(fetch);
  const prices: any[] = Array.isArray(raw) ? raw : (raw as any)?.prices ?? (raw as any)?.data ?? [];

  const handleSetPrice = async () => {
    if (!priceForm.farm_id || !priceForm.price_per_kg) {
      toast.error('Farm and price are required');
      return;
    }
    setSubmitting(true);
    try {
      await (apiService as any).setPickingPrice({
        farm_id:        parseInt(priceForm.farm_id),
        price_per_kg:   parseFloat(priceForm.price_per_kg),
        effective_date: priceForm.effective_date || new Date().toISOString().split('T')[0],
      });
      toast.success('Picking price updated');
      setShowForm(false);
      setPriceForm({ farm_id: '', price_per_kg: '', effective_date: '' });
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update price');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-success" /> Daily Picking Prices
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-1" /> Set Price
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <ErrorBanner message={error} />}
          {loading ? (
            <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
          ) : prices.length === 0 ? (
            <EmptyState message="No price records found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <th className="text-left px-3 py-2">Farm</th>
                    <th className="text-right px-3 py-2">Price / kg (TZS)</th>
                    <th className="text-left px-3 py-2">Effective Date</th>
                    <th className="text-left px-3 py-2">Set By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {prices.map((p: any, i: number) => (
                    <tr key={p.id ?? i} className="hover:bg-muted/50">
                      <td className="px-3 py-2 font-medium">{p.farm_name ?? p.farm ?? '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {p.price_per_kg != null ? Number(p.price_per_kg).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {p.effective_date ?? p.date ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {p.set_by ?? p.created_by ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Picking Price</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Farm *</Label>
              <select
                value={priceForm.farm_id}
                onChange={e => setPriceForm(p => ({ ...p, farm_id: e.target.value }))}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">Select farm</option>
                {farmList.map((f: any) => {
                  const fid = f.id ?? f.farm_id;
                  return <option key={fid} value={fid}>{f.name}</option>;
                })}
              </select>
            </div>
            <div>
              <Label>Price per kg (TZS) *</Label>
              <Input
                type="number"
                value={priceForm.price_per_kg}
                onChange={e => setPriceForm(p => ({ ...p, price_per_kg: e.target.value }))}
                placeholder="e.g. 500"
              />
            </div>
            <div>
              <Label>Effective Date</Label>
              <Input
                type="date"
                value={priceForm.effective_date}
                onChange={e => setPriceForm(p => ({ ...p, effective_date: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSetPrice} disabled={submitting}>
                {submitting ? 'Saving…' : 'Set Price'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const SessionStatusBadge = ({ status }: { status?: string }) => {
  if (!status) return <span className="text-muted-foreground">—</span>;
  const cls =
    status === 'active'    ? 'bg-success/20 text-success' :
    status === 'closed'    ? 'bg-muted text-muted-foreground' :
    status === 'confirmed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
    'bg-muted text-muted-foreground';
  return <Badge variant="secondary" className={`text-xs ${cls}`}>{status}</Badge>;
};

const ErrorBanner = ({ message }: { message: string }) => (
  <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive mb-3">
    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {message}
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-10 text-muted-foreground">
    <Scale className="w-8 h-8 mx-auto mb-2 opacity-40" />
    <p className="text-sm">{message}</p>
  </div>
);
