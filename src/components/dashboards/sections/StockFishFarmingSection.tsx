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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from '../../ui/sonner';
import {
  Plus, Waves, Scale, Beef, ShieldAlert, ChevronLeft,
  Droplets, Thermometer, FlaskConical, Edit2,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null, d = 1) {
  if (n == null) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: d });
}
function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString() : '—'; }
function fmtDt(d: string)   { return d ? new Date(d).toLocaleString()    : '—'; }

const SESSIONS = ['morning', 'midday', 'afternoon'] as const;

const STATUS_BADGE: Record<string, string> = {
  active:      'bg-green-100 text-green-700',
  dormant:     'bg-amber-100 text-amber-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
};
const STATUS_ICON: Record<string, string> = {
  active: '🟢', dormant: '🟡', maintenance: '🔧',
};

// ─── Safe-range cell helpers ──────────────────────────────────────────────────

function doClass(v: number | null)   { return v != null && v < 5.0         ? 'text-red-600 font-bold' : ''; }
function tempClass(v: number | null) { return v != null && (v < 26 || v > 30) ? 'text-red-600 font-bold' : ''; }
function phClass(v: number | null)   { return v != null && (v < 6.5 || v > 8.5) ? 'text-red-600 font-bold' : ''; }
function nh3Class(v: number | null)  { return v != null && v > 0.02        ? 'text-red-600 font-bold' : ''; }

// ─── Reservoir form (create / edit) ──────────────────────────────────────────

interface ReservoirFormProps {
  farms: any[];
  initial?: any;
  onClose: () => void;
  onSaved: () => void;
}

const ReservoirForm: React.FC<ReservoirFormProps> = ({ farms, initial, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:           initial?.name           ?? '',
    farm_id:        initial?.farm_id        ? String(initial.farm_id) : '',
    species:        initial?.species        ?? '',
    capacity_m3:    initial?.capacity_m3    ? String(initial.capacity_m3) : '',
    stocking_count: initial?.stocking_count ? String(initial.stocking_count) : '',
    status:         initial?.status         ?? 'active',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.farm_id) { toast.error('Name and farm are required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        farm_id:        Number(form.farm_id),
        capacity_m3:    form.capacity_m3    ? Number(form.capacity_m3)    : undefined,
        stocking_count: form.stocking_count ? Number(form.stocking_count) : undefined,
      };
      if (initial?.id) {
        await apiService.fishFarming.updateReservoir(initial.id, payload);
      } else {
        await apiService.fishFarming.createReservoir(payload);
      }
      toast.success(initial?.id ? 'Reservoir updated' : 'Reservoir created');
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
      <div><Label>Name *</Label><Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Reservoir 1" className="mt-1" /></div>
      <div>
        <Label>Farm *</Label>
        <Select value={form.farm_id} onValueChange={v => set('farm_id', v)}>
          <SelectTrigger className="mt-1"><SelectValue placeholder="Select farm" /></SelectTrigger>
          <SelectContent>{farms.map((f: any) => <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Species</Label><Input value={form.species} onChange={e => set('species', e.target.value)} placeholder="e.g. Tilapia" className="mt-1" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Capacity (m³)</Label><Input type="number" value={form.capacity_m3} onChange={e => set('capacity_m3', e.target.value)} placeholder="1200" className="mt-1" /></div>
        <div><Label>Fish Stocked</Label><Input type="number" value={form.stocking_count} onChange={e => set('stocking_count', e.target.value)} placeholder="5000" className="mt-1" /></div>
      </div>
      <div>
        <Label>Status</Label>
        <Select value={form.status} onValueChange={v => set('status', v)}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="dormant">Dormant</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter className="pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </DialogFooter>
    </div>
  );
};

// ─── Reservoir Dashboard ──────────────────────────────────────────────────────

const ReservoirDashboard: React.FC<{ reservoir: any }> = ({ reservoir }) => {
  const getDash = useCallback(() => apiService.getFishReservoirDashboard(reservoir.id), [reservoir.id]);
  const { data: dash, loading } = useApi(getDash);

  if (loading) return <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>;
  if (!dash) return null;

  const wq  = dash.latest_water_parameters;
  const wt  = dash.latest_weight;
  const fd  = dash.today_feeding ?? dash.recent_feedings ?? [];
  const sec = dash.latest_alarm_log;

  const feedList = Array.isArray(fd) ? fd : [];
  const totalFeed = feedList.reduce((s: number, f: any) => s + (f.kg_fed || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Water Quality */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-blue-500" /> Water Quality
          </CardTitle>
          {wq?.recorded_at && <p className="text-xs text-gray-400">{fmtDt(wq.recorded_at)}</p>}
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {!wq ? <p className="text-muted-foreground text-xs">No readings yet</p> : (
            <>
              <p className={`flex justify-between ${doClass(wq.dissolved_oxygen_mg_l)}`}>
                <span>DO (mg/L)</span><span>{fmt(wq.dissolved_oxygen_mg_l, 2)}</span>
              </p>
              <p className={`flex justify-between ${tempClass(wq.temperature_c)}`}>
                <span>Temp (°C)</span><span>{fmt(wq.temperature_c, 1)}</span>
              </p>
              <p className={`flex justify-between ${phClass(wq.ph)}`}>
                <span>pH</span><span>{fmt(wq.ph, 2)}</span>
              </p>
              <p className={`flex justify-between ${nh3Class(wq.un_ionized_ammonia_mg_l)}`}>
                <span>NH₃ (mg/L)</span><span>{fmt(wq.un_ionized_ammonia_mg_l, 4)}</span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Today's Feeding */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Beef className="w-4 h-4 text-orange-500" /> Today&apos;s Feeding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {feedList.length === 0 ? <p className="text-muted-foreground text-xs">No feeds recorded today</p> : (
            <>
              {feedList.map((f: any, i: number) => (
                <p key={i} className="flex justify-between">
                  <span className="capitalize">{f.session}</span>
                  <span className="font-medium">{fmt(f.kg_fed, 2)} kg</span>
                </p>
              ))}
              <p className="flex justify-between font-bold border-t pt-1 mt-1">
                <span>Total</span><span>{fmt(totalFeed, 2)} kg</span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Latest Weight */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-purple-500" /> Latest Weight
          </CardTitle>
          {wt?.sample_date && <p className="text-xs text-gray-400">{fmtDate(wt.sample_date)}</p>}
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {!wt ? <p className="text-muted-foreground text-xs">No weight samples yet</p> : (
            <>
              <p className="flex justify-between"><span>Avg Weight</span><span className="font-bold">{fmt(wt.avg_weight_g)}g</span></p>
              <p className="flex justify-between"><span>Sample Count</span><span>{wt.sample_count ?? '—'}</span></p>
              <p className="flex justify-between"><span>Min / Max</span><span>{fmt(wt.min_weight_g)}g / {fmt(wt.max_weight_g)}g</span></p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-500" /> Security
          </CardTitle>
          {sec?.log_date && <p className="text-xs text-gray-400">{fmtDate(sec.log_date)}</p>}
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {!sec ? <p className="text-muted-foreground text-xs">No log recorded</p> : (
            <>
              <p className="flex justify-between">
                <span>Alarm On</span><span>{sec.alarm_activated_at || '—'}</span>
              </p>
              <p className="flex justify-between">
                <span>Alarm Off</span><span>{sec.alarm_deactivated_at || '—'}</span>
              </p>
              <p className="flex justify-between">
                <span>Alarm Activity</span>
                <Badge variant={sec.alarm_activity_reported ? 'destructive' : 'secondary'} className="text-xs">
                  {sec.alarm_activity_reported ? 'Yes' : 'No'}
                </Badge>
              </p>
              <p className="flex justify-between">
                <span>CCTV Activity</span>
                <Badge variant={sec.cctv_activity_reported ? 'destructive' : 'secondary'} className="text-xs">
                  {sec.cctv_activity_reported ? 'Yes' : 'No'}
                </Badge>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ─── Water Parameters Tab ─────────────────────────────────────────────────────

const WaterParamsTab: React.FC<{ reservoirId: number }> = ({ reservoirId }) => {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState<Record<string, any>>({
    reservoir_id:           reservoirId,
    recorded_at:            new Date().toISOString().slice(0, 16),
    ph:                     '',
    temperature_c:          '',
    dissolved_oxygen_mg_l:  '',
    nitrogen_dioxide_mg_l:  '',
    ammonium_nitrate_mg_l:  '',
    un_ionized_ammonia_mg_l:'',
    comments:               '',
  });

  const getRecords = useCallback(
    () => apiService.getWaterParameters({ reservoir_id: reservoirId, limit: 100 }),
    [reservoirId],
  );
  const { data: records, loading, refetch } = useApi(getRecords);
  const setField = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.createWaterParameter({
        ...form,
        reservoir_id:            reservoirId,
        recorded_at:             new Date(form.recorded_at).toISOString(),
        ph:                      form.ph                       ? Number(form.ph)                       : null,
        temperature_c:           form.temperature_c            ? Number(form.temperature_c)            : null,
        dissolved_oxygen_mg_l:   form.dissolved_oxygen_mg_l   ? Number(form.dissolved_oxygen_mg_l)   : null,
        nitrogen_dioxide_mg_l:   form.nitrogen_dioxide_mg_l   ? Number(form.nitrogen_dioxide_mg_l)   : null,
        ammonium_nitrate_mg_l:   form.ammonium_nitrate_mg_l   ? Number(form.ammonium_nitrate_mg_l)   : null,
        un_ionized_ammonia_mg_l: form.un_ionized_ammonia_mg_l ? Number(form.un_ionized_ammonia_mg_l) : null,
      });
      toast.success('Water parameters recorded');
      setShowModal(false);
      refetch();
    } catch (e: any) { toast.error(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Out of safe range</span>
          <span>DO &gt;5 | Temp 26–30°C | pH 6.5–8.5 | NH₃ &lt;0.02</span>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Record Parameters
        </Button>
      </div>

      {loading ? <div className="flex justify-center py-6"><LoadingSpinner size="sm" /></div> : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recorded At</TableHead>
                <TableHead className="text-right">
                  <span className="flex items-center justify-end gap-1"><Droplets className="w-3 h-3" /> DO (mg/L)</span>
                </TableHead>
                <TableHead className="text-right">
                  <span className="flex items-center justify-end gap-1"><Thermometer className="w-3 h-3" /> Temp (°C)</span>
                </TableHead>
                <TableHead className="text-right">pH</TableHead>
                <TableHead className="text-right">NO₂</TableHead>
                <TableHead className="text-right">NH₄</TableHead>
                <TableHead className="text-right">
                  <span className="flex items-center justify-end gap-1"><FlaskConical className="w-3 h-3" /> NH₃</span>
                </TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!records || records.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No records</TableCell></TableRow>
              ) : (records as any[]).map((r: any) => (
                <TableRow key={r.id} className="hover:bg-gray-50">
                  <TableCell className="text-xs text-gray-500">{fmtDt(r.recorded_at)}</TableCell>
                  <TableCell className={`text-right text-sm tabular-nums ${doClass(r.dissolved_oxygen_mg_l)}`}>
                    {fmt(r.dissolved_oxygen_mg_l, 2)}
                  </TableCell>
                  <TableCell className={`text-right text-sm tabular-nums ${tempClass(r.temperature_c)}`}>
                    {fmt(r.temperature_c, 1)}
                  </TableCell>
                  <TableCell className={`text-right text-sm tabular-nums ${phClass(r.ph)}`}>
                    {fmt(r.ph, 2)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-gray-600">
                    {fmt(r.nitrogen_dioxide_mg_l, 3)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-gray-600">
                    {fmt(r.ammonium_nitrate_mg_l, 3)}
                  </TableCell>
                  <TableCell className={`text-right text-sm tabular-nums ${nh3Class(r.un_ionized_ammonia_mg_l)}`}>
                    {fmt(r.un_ionized_ammonia_mg_l, 4)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.comments || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Water Parameters</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Recorded At *</Label><Input type="datetime-local" value={form.recorded_at} onChange={e => setField('recorded_at', e.target.value)} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>pH <span className="text-xs text-gray-400">(6.5–8.5)</span></Label><Input type="number" step="0.1" value={form.ph} onChange={e => setField('ph', e.target.value)} placeholder="7.2" className="mt-1" /></div>
              <div><Label>Temp °C <span className="text-xs text-gray-400">(26–30)</span></Label><Input type="number" step="0.1" value={form.temperature_c} onChange={e => setField('temperature_c', e.target.value)} placeholder="28" className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>DO mg/L <span className="text-xs text-gray-400">(&gt;5.0)</span></Label><Input type="number" step="0.01" value={form.dissolved_oxygen_mg_l} onChange={e => setField('dissolved_oxygen_mg_l', e.target.value)} className="mt-1" /></div>
              <div><Label>NO₂ mg/L</Label><Input type="number" step="0.001" value={form.nitrogen_dioxide_mg_l} onChange={e => setField('nitrogen_dioxide_mg_l', e.target.value)} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>NH₄ mg/L</Label><Input type="number" step="0.001" value={form.ammonium_nitrate_mg_l} onChange={e => setField('ammonium_nitrate_mg_l', e.target.value)} className="mt-1" /></div>
              <div><Label>NH₃ mg/L <span className="text-xs text-gray-400">(&lt;0.02)</span></Label><Input type="number" step="0.001" value={form.un_ionized_ammonia_mg_l} onChange={e => setField('un_ionized_ammonia_mg_l', e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>Comments</Label><Input value={form.comments} onChange={e => setField('comments', e.target.value)} className="mt-1" /></div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Feeding Tab ──────────────────────────────────────────────────────────────

const FeedingTab: React.FC<{ reservoirId: number }> = ({ reservoirId }) => {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState<Record<string, any>>({
    reservoir_id: reservoirId,
    feeding_date: new Date().toISOString().slice(0, 10),
    session:      'morning',
    feeding_time: '',
    kg_fed:       '',
    observations: '',
  });

  const getRecords = useCallback(
    () => apiService.getFishFeedingRecords({ reservoir_id: reservoirId, limit: 60 }),
    [reservoirId],
  );
  const { data: records, loading, refetch } = useApi(getRecords);
  const setField = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.kg_fed) { toast.error('KGs fed is required'); return; }
    setSaving(true);
    try {
      await apiService.createFishFeedingRecord({
        ...form,
        reservoir_id: reservoirId,
        feeding_date: new Date(form.feeding_date).toISOString(),
        kg_fed:       Number(form.kg_fed),
        feeding_time: form.feeding_time || null,
      });
      toast.success('Feeding recorded');
      setShowModal(false);
      refetch();
    } catch (e: any) { toast.error(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const sessionBadge: Record<string, string> = {
    morning:  'bg-yellow-100 text-yellow-700',
    midday:   'bg-orange-100 text-orange-700',
    afternoon:'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Record Feeding
        </Button>
      </div>
      {loading ? <div className="flex justify-center py-6"><LoadingSpinner size="sm" /></div> : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">KGs Fed</TableHead>
                <TableHead>Observations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!records || records.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No feeding records</TableCell></TableRow>
              ) : (records as any[]).map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{fmtDate(r.feeding_date)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${sessionBadge[r.session] || ''}`}>
                      {r.session}
                    </span>
                  </TableCell>
                  <TableCell>{r.feeding_time || '—'}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(r.kg_fed, 2)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.observations || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Record Feeding Session</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Date *</Label><Input type="date" value={form.feeding_date} onChange={e => setField('feeding_date', e.target.value)} className="mt-1" /></div>
            <div>
              <Label>Session *</Label>
              <Select value={form.session} onValueChange={v => setField('session', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SESSIONS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Time (HH:MM)</Label><Input type="time" value={form.feeding_time} onChange={e => setField('feeding_time', e.target.value)} className="mt-1" /></div>
            <div><Label>KGs Fed *</Label><Input type="number" step="0.1" value={form.kg_fed} onChange={e => setField('kg_fed', e.target.value)} placeholder="0.4" className="mt-1" /></div>
            <div><Label>Observations</Label><Input value={form.observations} onChange={e => setField('observations', e.target.value)} className="mt-1" /></div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Weight Tab ───────────────────────────────────────────────────────────────

const WeightTab: React.FC<{ reservoirId: number }> = ({ reservoirId }) => {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState<Record<string, any>>({
    reservoir_id: reservoirId,
    sample_date:  new Date().toISOString().slice(0, 10),
    avg_weight_g: '',
    sample_count: '',
    min_weight_g: '',
    max_weight_g: '',
    notes:        '',
  });

  const getRecords = useCallback(
    () => apiService.getFishWeightRecords({ reservoir_id: reservoirId }),
    [reservoirId],
  );
  const { data: records, loading, refetch } = useApi(getRecords);
  const setField = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.createFishWeightRecord({
        ...form,
        reservoir_id: reservoirId,
        sample_date:  new Date(form.sample_date).toISOString(),
        avg_weight_g: form.avg_weight_g ? Number(form.avg_weight_g) : null,
        sample_count: form.sample_count ? Number(form.sample_count) : null,
        min_weight_g: form.min_weight_g ? Number(form.min_weight_g) : null,
        max_weight_g: form.max_weight_g ? Number(form.max_weight_g) : null,
      });
      toast.success('Weight record saved');
      setShowModal(false);
      refetch();
    } catch (e: any) { toast.error(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const chartData = records
    ? [...(records as any[])]
        .sort((a, b) => new Date(a.sample_date).getTime() - new Date(b.sample_date).getTime())
        .map((r: any) => ({
          date: fmtDate(r.sample_date),
          avg:  r.avg_weight_g ?? null,
        }))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Record Weight
        </Button>
      </div>

      {/* Growth chart */}
      {chartData.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Growth Trend — Avg Weight (g)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="g" />
                <Tooltip formatter={(v: any) => [`${v}g`, 'Avg Weight']} />
                <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {loading ? <div className="flex justify-center py-6"><LoadingSpinner size="sm" /></div> : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Avg (g)</TableHead>
                <TableHead className="text-right">Sample Count</TableHead>
                <TableHead className="text-right">Min (g)</TableHead>
                <TableHead className="text-right">Max (g)</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!records || records.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No weight records</TableCell></TableRow>
              ) : (records as any[]).map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{fmtDate(r.sample_date)}</TableCell>
                  <TableCell className="text-right font-bold">{fmt(r.avg_weight_g)}g</TableCell>
                  <TableCell className="text-right">{r.sample_count ?? '—'}</TableCell>
                  <TableCell className="text-right">{fmt(r.min_weight_g)}</TableCell>
                  <TableCell className="text-right">{fmt(r.max_weight_g)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.notes || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Record Weight Sample</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Sample Date *</Label><Input type="date" value={form.sample_date} onChange={e => setField('sample_date', e.target.value)} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Avg Weight (g)</Label><Input type="number" value={form.avg_weight_g} onChange={e => setField('avg_weight_g', e.target.value)} className="mt-1" /></div>
              <div><Label>Sample Count</Label><Input type="number" value={form.sample_count} onChange={e => setField('sample_count', e.target.value)} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Min (g)</Label><Input type="number" value={form.min_weight_g} onChange={e => setField('min_weight_g', e.target.value)} className="mt-1" /></div>
              <div><Label>Max (g)</Label><Input type="number" value={form.max_weight_g} onChange={e => setField('max_weight_g', e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label>Notes</Label><Input value={form.notes} onChange={e => setField('notes', e.target.value)} className="mt-1" /></div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Alarm Log Tab ────────────────────────────────────────────────────────────

const AlarmLogTab: React.FC<{ reservoirId: number }> = ({ reservoirId }) => {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState<Record<string, any>>({
    reservoir_id:            reservoirId,
    log_date:                new Date().toISOString().slice(0, 10),
    alarm_activated_at:      '',
    alarm_deactivated_at:    '',
    alarm_activity_reported: false,
    cctv_activity_reported:  false,
    surveillance_notes:      '',
    control_room_notes:      '',
  });

  const getRecords = useCallback(
    () => apiService.getFishAlarmLogs({ reservoir_id: reservoirId, limit: 60 }),
    [reservoirId],
  );
  const { data: records, loading, refetch } = useApi(getRecords);
  const setField = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.createFishAlarmLog({
        ...form,
        reservoir_id:         reservoirId,
        log_date:             new Date(form.log_date).toISOString(),
        alarm_activated_at:   form.alarm_activated_at   || null,
        alarm_deactivated_at: form.alarm_deactivated_at || null,
      });
      toast.success('Alarm log saved');
      setShowModal(false);
      refetch();
    } catch (e: any) { toast.error(e.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Record Daily Log
        </Button>
      </div>
      {loading ? <div className="flex justify-center py-6"><LoadingSpinner size="sm" /></div> : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Alarm On</TableHead>
                <TableHead>Alarm Off</TableHead>
                <TableHead>Alarm Activity</TableHead>
                <TableHead>CCTV Activity</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!records || records.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No alarm logs</TableCell></TableRow>
              ) : (records as any[]).map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{fmtDate(r.log_date)}</TableCell>
                  <TableCell>{r.alarm_activated_at || '—'}</TableCell>
                  <TableCell>{r.alarm_deactivated_at || '—'}</TableCell>
                  <TableCell><Badge variant={r.alarm_activity_reported ? 'destructive' : 'secondary'}>{r.alarm_activity_reported ? 'Yes' : 'No'}</Badge></TableCell>
                  <TableCell><Badge variant={r.cctv_activity_reported ? 'destructive' : 'secondary'}>{r.cctv_activity_reported ? 'Yes' : 'No'}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.surveillance_notes || r.control_room_notes || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Daily Alarm Log</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Date *</Label><Input type="date" value={form.log_date} onChange={e => setField('log_date', e.target.value)} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Alarm Activated (HH:MM)</Label><Input type="time" value={form.alarm_activated_at} onChange={e => setField('alarm_activated_at', e.target.value)} className="mt-1" /></div>
              <div><Label>Alarm Deactivated (HH:MM)</Label><Input type="time" value={form.alarm_deactivated_at} onChange={e => setField('alarm_deactivated_at', e.target.value)} className="mt-1" /></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.alarm_activity_reported} onCheckedChange={v => setField('alarm_activity_reported', v)} />
              <Label>Alarm activity reported</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.cctv_activity_reported} onCheckedChange={v => setField('cctv_activity_reported', v)} />
              <Label>CCTV activity reported</Label>
            </div>
            <div><Label>Surveillance Notes</Label><Input value={form.surveillance_notes} onChange={e => setField('surveillance_notes', e.target.value)} className="mt-1" /></div>
            <div><Label>Control Room Notes</Label><Input value={form.control_room_notes} onChange={e => setField('control_room_notes', e.target.value)} className="mt-1" /></div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Main Section ─────────────────────────────────────────────────────────────

const CAN_MANAGE = ['admin', 'manager', 'stock', 'godown_manager'];

export const StockFishFarmingSection: React.FC<{ userRole?: string }> = ({ userRole = '' }) => {
  const [selectedFarmId, setSelectedFarmId]     = useState('all');
  const [selectedReservoir, setSelectedReservoir] = useState<any | null>(null);
  const [showReservoirForm, setShowReservoirForm] = useState(false);
  const [editingReservoir, setEditingReservoir]   = useState<any | null>(null);

  const getFarms = useCallback(() => apiService.getStockFarms(), []);
  const { data: farms, loading: farmsLoading } = useApi(getFarms);

  const getReservoirs = useCallback(
    () => apiService.getFishReservoirs({
      farm_id: selectedFarmId !== 'all' ? Number(selectedFarmId) : undefined,
    }),
    [selectedFarmId],
  );
  const { data: reservoirsRaw, loading: reservoirsLoading, refetch: refetchReservoirs } = useApi(getReservoirs);
  const reservoirs: any[] = Array.isArray(reservoirsRaw) ? reservoirsRaw : [];

  const canManage = CAN_MANAGE.includes(userRole);

  if (farmsLoading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selectedReservoir) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => setSelectedReservoir(null)} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> All Reservoirs
            </Button>
            <div>
              <h2 className="text-base font-semibold text-gray-900">{selectedReservoir.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {selectedReservoir.species && (
                  <span className="text-xs text-gray-500">{selectedReservoir.species}</span>
                )}
                {selectedReservoir.stocking_count && (
                  <span className="text-xs text-gray-500">· {selectedReservoir.stocking_count.toLocaleString()} fish</span>
                )}
                {selectedReservoir.capacity_m3 && (
                  <span className="text-xs text-gray-500">· {selectedReservoir.capacity_m3.toLocaleString()} m³</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[selectedReservoir.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_ICON[selectedReservoir.status] || ''} {selectedReservoir.status}
                </span>
              </div>
            </div>
          </div>
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setEditingReservoir(selectedReservoir); setShowReservoirForm(true); }}
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          )}
        </div>

        {/* Dashboard summary cards */}
        <ReservoirDashboard reservoir={selectedReservoir} />

        {/* Data entry tabs */}
        <Tabs defaultValue="water">
          <TabsList>
            <TabsTrigger value="water"><Waves className="w-4 h-4 mr-1" />Water Params</TabsTrigger>
            <TabsTrigger value="feeding"><Beef className="w-4 h-4 mr-1" />Feeding</TabsTrigger>
            <TabsTrigger value="weight"><Scale className="w-4 h-4 mr-1" />Weight</TabsTrigger>
            <TabsTrigger value="alarm"><ShieldAlert className="w-4 h-4 mr-1" />Alarm Logs</TabsTrigger>
          </TabsList>
          <TabsContent value="water">  <WaterParamsTab reservoirId={selectedReservoir.id} /></TabsContent>
          <TabsContent value="feeding"><FeedingTab     reservoirId={selectedReservoir.id} /></TabsContent>
          <TabsContent value="weight"> <WeightTab      reservoirId={selectedReservoir.id} /></TabsContent>
          <TabsContent value="alarm">  <AlarmLogTab    reservoirId={selectedReservoir.id} /></TabsContent>
        </Tabs>

        {/* Edit dialog */}
        <Dialog open={showReservoirForm && !!editingReservoir} onOpenChange={open => { if (!open) { setShowReservoirForm(false); setEditingReservoir(null); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Edit Reservoir</DialogTitle></DialogHeader>
            <ReservoirForm
              farms={farms || []}
              initial={editingReservoir}
              onClose={() => { setShowReservoirForm(false); setEditingReservoir(null); }}
              onSaved={() => {
                refetchReservoirs();
                // refresh selected reservoir data
                const updated = reservoirs.find((r: any) => r.id === editingReservoir?.id);
                if (updated) setSelectedReservoir(updated);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Farm filter + create */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Label className="min-w-fit">Farm:</Label>
          <Select value={selectedFarmId} onValueChange={v => setSelectedFarmId(v)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All farms</SelectItem>
              {(farms || []).map((f: any) => (
                <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => { setEditingReservoir(null); setShowReservoirForm(true); }}>
            <Plus className="w-4 h-4 mr-1" /> New Reservoir
          </Button>
        )}
      </div>

      {/* Reservoir list table */}
      <Card>
        <CardContent className="p-0">
          {reservoirsLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="sm" /></div>
          ) : reservoirs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Waves className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No fish reservoirs found for this farm</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Reservoir</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead className="text-right">Capacity (m³)</TableHead>
                  <TableHead className="text-right">Fish Stocked</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservoirs.map((r: any) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-indigo-50/40 transition-colors"
                    onClick={() => setSelectedReservoir(r)}
                  >
                    <TableCell className="font-semibold text-gray-900">{r.name}</TableCell>
                    <TableCell className="text-gray-600">{r.species || '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.capacity_m3 ? r.capacity_m3.toLocaleString() : '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.stocking_count ? r.stocking_count.toLocaleString() : '—'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_ICON[r.status] || ''} {r.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showReservoirForm && !editingReservoir} onOpenChange={open => { if (!open) setShowReservoirForm(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Reservoir</DialogTitle></DialogHeader>
          <ReservoirForm
            farms={farms || []}
            onClose={() => setShowReservoirForm(false)}
            onSaved={refetchReservoirs}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
