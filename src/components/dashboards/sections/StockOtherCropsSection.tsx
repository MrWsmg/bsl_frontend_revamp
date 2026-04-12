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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '../../ui/sonner';
import { Plus, Scale, ShoppingCart, Layers } from 'lucide-react';
import { OtherCropType } from '../../../types';

const CROP_TYPES: { value: OtherCropType; label: string }[] = [
  { value: 'maize', label: 'Maize' },
  { value: 'beans', label: 'Beans' },
  { value: 'soya', label: 'Soya' },
  { value: 'rose_coco', label: 'Rose Coco' },
  { value: 'maize_rejects', label: 'Maize Rejects' },
  { value: 'bean_rejects', label: 'Bean Rejects' },
];

const CROP_TABS = CROP_TYPES.slice(0, 3); // Maize, Beans, Soya as primary tabs

function fmt(n: number | undefined | null) {
  if (n == null) return '—';
  return n.toLocaleString();
}

function fmtDate(d: string) {
  return d ? new Date(d).toLocaleDateString() : '—';
}

// ─── Harvest Sub-Tab ───────────────────────────────────────────────────────

interface HarvestSubTabProps {
  farmId: number | null;
  cropType: OtherCropType;
  farms: any[];
}

const HarvestSubTab: React.FC<HarvestSubTabProps> = ({ farmId, cropType, farms }) => {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({
    farm_id: farmId || '',
    crop_type: cropType,
    block_name: '',
    harvest_date: new Date().toISOString().slice(0, 10),
    bags: '',
    kgs: '',
    num_workers: '',
    paid_per_bag: '',
    paid_per_kg: '',
    total_payment: '',
    comments: '',
  });

  const getRecords = useCallback(
    () => apiService.getOtherCropsHarvestRecords({ farm_id: farmId || undefined, crop_type: cropType }),
    [farmId, cropType]
  );
  const { data: records, loading, refetch } = useApi(getRecords);

  const setField = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.farm_id || !form.block_name || !form.harvest_date) {
      toast.error('Farm, block name, and harvest date are required');
      return;
    }
    setSaving(true);
    try {
      await apiService.createOtherCropsHarvestRecord({
        ...form,
        farm_id: Number(form.farm_id),
        harvest_date: new Date(form.harvest_date).toISOString(),
        bags: form.bags ? Number(form.bags) : null,
        kgs: form.kgs ? Number(form.kgs) : null,
        num_workers: form.num_workers ? Number(form.num_workers) : null,
        paid_per_bag: form.paid_per_bag ? Number(form.paid_per_bag) : null,
        paid_per_kg: form.paid_per_kg ? Number(form.paid_per_kg) : null,
        total_payment: form.total_payment ? Number(form.total_payment) : null,
      });
      toast.success('Harvest record saved');
      setShowModal(false);
      refetch();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Harvest Record
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Block</TableHead>
              <TableHead className="text-right">Bags</TableHead>
              <TableHead className="text-right">KGs</TableHead>
              <TableHead className="text-right">Workers</TableHead>
              <TableHead className="text-right">Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!records || records.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No harvest records found</TableCell></TableRow>
            ) : records.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>{fmtDate(r.harvest_date)}</TableCell>
                <TableCell>{r.block_name}{r.block_side ? ` (${r.block_side})` : ''}</TableCell>
                <TableCell className="text-right">{fmt(r.bags)}</TableCell>
                <TableCell className="text-right">{fmt(r.kgs)}</TableCell>
                <TableCell className="text-right">{fmt(r.num_workers)}</TableCell>
                <TableCell className="text-right">{r.total_payment ? `TZS ${fmt(r.total_payment)}` : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add {cropType.charAt(0).toUpperCase() + cropType.slice(1)} Harvest Record</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Farm *</Label>
              <Select value={String(form.farm_id)} onValueChange={v => setField('farm_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                <SelectContent>{farms.map((f: any) => <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Block Name *</Label><Input value={form.block_name} onChange={e => setField('block_name', e.target.value)} placeholder="e.g. LAMBO 1" /></div>
            <div><Label>Block Side</Label><Input value={form.block_side || ''} onChange={e => setField('block_side', e.target.value)} placeholder="EAST / WEST" /></div>
            <div><Label>Harvest Date *</Label><Input type="date" value={form.harvest_date} onChange={e => setField('harvest_date', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Bags</Label><Input type="number" value={form.bags} onChange={e => setField('bags', e.target.value)} placeholder="0" /></div>
              <div><Label>KGs</Label><Input type="number" value={form.kgs} onChange={e => setField('kgs', e.target.value)} placeholder="0" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>No. of Workers</Label><Input type="number" value={form.num_workers} onChange={e => setField('num_workers', e.target.value)} /></div>
              <div><Label>Acres Harvested</Label><Input type="number" value={form.acres_harvested || ''} onChange={e => setField('acres_harvested', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Paid per Bag</Label><Input type="number" value={form.paid_per_bag} onChange={e => setField('paid_per_bag', e.target.value)} /></div>
              <div><Label>Paid per KG</Label><Input type="number" value={form.paid_per_kg} onChange={e => setField('paid_per_kg', e.target.value)} /></div>
            </div>
            <div><Label>Total Payment</Label><Input type="number" value={form.total_payment} onChange={e => setField('total_payment', e.target.value)} /></div>
            <div><Label>Comments</Label><Input value={form.comments} onChange={e => setField('comments', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Shelling Sub-Tab (Maize only) ────────────────────────────────────────

interface ShellingSubTabProps {
  farmId: number | null;
  farms: any[];
}

const ShellingSubTab: React.FC<ShellingSubTabProps> = ({ farmId, farms }) => {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({
    farm_id: farmId || '',
    block_name: '',
    shell_date: new Date().toISOString().slice(0, 10),
    kgs_in: '',
    num_shellers: '',
    bags_out: '',
    paid_per_kg: '',
    total_payment: '',
    comments: '',
  });

  const getRecords = useCallback(
    () => apiService.getOtherCropsShellingRecords({ farm_id: farmId || undefined }),
    [farmId]
  );
  const { data: records, loading, refetch } = useApi(getRecords);

  const setField = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.farm_id || !form.shell_date || !form.kgs_in) {
      toast.error('Farm, shell date, and KGs in are required');
      return;
    }
    setSaving(true);
    try {
      await apiService.createOtherCropsShellingRecord({
        ...form,
        farm_id: Number(form.farm_id),
        shell_date: new Date(form.shell_date).toISOString(),
        kgs_in: Number(form.kgs_in),
        num_shellers: form.num_shellers ? Number(form.num_shellers) : null,
        bags_out: form.bags_out ? Number(form.bags_out) : null,
        paid_per_kg: form.paid_per_kg ? Number(form.paid_per_kg) : null,
        total_payment: form.total_payment ? Number(form.total_payment) : null,
      });
      toast.success('Shelling record saved');
      setShowModal(false);
      refetch();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Shelling Record
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Block</TableHead>
              <TableHead className="text-right">KGs In</TableHead>
              <TableHead className="text-right">Bags Out</TableHead>
              <TableHead className="text-right">Shellers</TableHead>
              <TableHead className="text-right">Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!records || records.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No shelling records</TableCell></TableRow>
            ) : records.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>{fmtDate(r.shell_date)}</TableCell>
                <TableCell>{r.block_name || '—'}</TableCell>
                <TableCell className="text-right">{fmt(r.kgs_in)}</TableCell>
                <TableCell className="text-right">{fmt(r.bags_out)}</TableCell>
                <TableCell className="text-right">{fmt(r.num_shellers)}</TableCell>
                <TableCell className="text-right">{r.total_payment ? `TZS ${fmt(r.total_payment)}` : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Shelling Record</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Farm *</Label>
              <Select value={String(form.farm_id)} onValueChange={v => setField('farm_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                <SelectContent>{farms.map((f: any) => <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Block Name</Label><Input value={form.block_name} onChange={e => setField('block_name', e.target.value)} /></div>
            <div><Label>Shell Date *</Label><Input type="date" value={form.shell_date} onChange={e => setField('shell_date', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>KGs In *</Label><Input type="number" value={form.kgs_in} onChange={e => setField('kgs_in', e.target.value)} /></div>
              <div><Label>Bags Out</Label><Input type="number" value={form.bags_out} onChange={e => setField('bags_out', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>No. of Shellers</Label><Input type="number" value={form.num_shellers} onChange={e => setField('num_shellers', e.target.value)} /></div>
              <div><Label>Paid per KG</Label><Input type="number" value={form.paid_per_kg} onChange={e => setField('paid_per_kg', e.target.value)} /></div>
            </div>
            <div><Label>Total Payment</Label><Input type="number" value={form.total_payment} onChange={e => setField('total_payment', e.target.value)} /></div>
            <div><Label>Comments</Label><Input value={form.comments} onChange={e => setField('comments', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Sales Sub-Tab ─────────────────────────────────────────────────────────

interface SalesSubTabProps {
  farmId: number | null;
  cropType: OtherCropType;
  farms: any[];
}

const SalesSubTab: React.FC<SalesSubTabProps> = ({ farmId, cropType, farms }) => {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({
    farm_id: farmId || '',
    crop_type: cropType,
    sale_date: new Date().toISOString().slice(0, 10),
    invoice_number: '',
    buyer_name: '',
    kgs_sold: '',
    paid_amount: '',
    vehicle_registration: '',
    security_name: '',
    security_signed: false,
    comments: '',
  });

  const getRecords = useCallback(
    () => apiService.getOtherCropsSaleRecords({ farm_id: farmId || undefined, crop_type: cropType }),
    [farmId, cropType]
  );
  const { data: records, loading, refetch } = useApi(getRecords);

  const setField = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.farm_id || !form.buyer_name || !form.kgs_sold) {
      toast.error('Farm, buyer name, and KGs sold are required');
      return;
    }
    setSaving(true);
    try {
      await apiService.createOtherCropsSaleRecord({
        ...form,
        farm_id: Number(form.farm_id),
        sale_date: new Date(form.sale_date).toISOString(),
        kgs_sold: Number(form.kgs_sold),
        paid_amount: form.paid_amount ? Number(form.paid_amount) : null,
      });
      toast.success('Sale record saved');
      setShowModal(false);
      refetch();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" /> Record Sale
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead className="text-right">KGs Sold</TableHead>
              <TableHead className="text-right">Amount (TZS)</TableHead>
              <TableHead>Vehicle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!records || records.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No sales records</TableCell></TableRow>
            ) : records.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>{fmtDate(r.sale_date)}</TableCell>
                <TableCell>{r.invoice_number || '—'}</TableCell>
                <TableCell>{r.buyer_name}</TableCell>
                <TableCell className="text-right">{fmt(r.kgs_sold)}</TableCell>
                <TableCell className="text-right">{r.paid_amount ? fmt(r.paid_amount) : '—'}</TableCell>
                <TableCell>{r.vehicle_registration || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record {cropType.charAt(0).toUpperCase() + cropType.slice(1)} Sale</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Farm *</Label>
              <Select value={String(form.farm_id)} onValueChange={v => setField('farm_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                <SelectContent>{farms.map((f: any) => <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Sale Date *</Label><Input type="date" value={form.sale_date} onChange={e => setField('sale_date', e.target.value)} /></div>
            <div><Label>Invoice Number</Label><Input value={form.invoice_number} onChange={e => setField('invoice_number', e.target.value)} /></div>
            <div><Label>Buyer Name *</Label><Input value={form.buyer_name} onChange={e => setField('buyer_name', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>KGs Sold *</Label><Input type="number" value={form.kgs_sold} onChange={e => setField('kgs_sold', e.target.value)} /></div>
              <div><Label>Paid Amount</Label><Input type="number" value={form.paid_amount} onChange={e => setField('paid_amount', e.target.value)} /></div>
            </div>
            <div><Label>Vehicle Registration</Label><Input value={form.vehicle_registration} onChange={e => setField('vehicle_registration', e.target.value)} /></div>
            <div><Label>Security Name</Label><Input value={form.security_name} onChange={e => setField('security_name', e.target.value)} /></div>
            <div><Label>Comments</Label><Input value={form.comments} onChange={e => setField('comments', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Balance Sub-Tab ───────────────────────────────────────────────────────

interface BalanceSubTabProps {
  farmId: number | null;
  cropType: OtherCropType;
}

const BalanceSubTab: React.FC<BalanceSubTabProps> = ({ farmId, cropType }) => {
  const getBalances = useCallback(
    () => apiService.getCropBalances({ farm_id: farmId || undefined }),
    [farmId]
  );
  const { data: balances, loading } = useApi(getBalances);

  if (loading) return <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>;

  const filtered = balances?.filter((b: any) => b.crop_type === cropType) || [];

  return (
    <div className="space-y-4">
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No balance data available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b: any) => (
            <Card key={b.id}>
              <CardContent className="p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Running Balance</p>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">KGs</span>
                  <span className="text-lg font-bold text-green-600">{fmt(b.current_kgs)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Bags</span>
                  <span className="text-lg font-bold text-blue-600">{fmt(b.current_bags)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Updated {fmtDate(b.last_updated)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Section ──────────────────────────────────────────────────────────

export const StockOtherCropsSection: React.FC = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [activeCrop, setActiveCrop] = useState<OtherCropType>('maize');

  const getFarms = useCallback(() => apiService.getStockFarms(), []);
  const { data: farms, loading: farmsLoading } = useApi(getFarms);

  if (farmsLoading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      {/* Farm selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label className="min-w-fit">Farm:</Label>
            <Select
              value={selectedFarmId ? String(selectedFarmId) : 'all'}
              onValueChange={v => setSelectedFarmId(v === 'all' ? null : Number(v))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All farms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All farms</SelectItem>
                {(farms || []).map((f: any) => (
                  <SelectItem key={f.farm_id ?? f.id} value={String(f.farm_id ?? f.id)}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Crop tabs */}
      <Tabs value={activeCrop} onValueChange={(v: string) => setActiveCrop(v as OtherCropType)}>
        <TabsList>
          {CROP_TABS.map(c => (
            <TabsTrigger key={c.value} value={c.value}>{c.label}</TabsTrigger>
          ))}
        </TabsList>

        {CROP_TABS.map(({ value: crop }) => (
          <TabsContent key={crop} value={crop}>
            <Tabs defaultValue="harvest">
              <TabsList className="mb-4">
                <TabsTrigger value="harvest"><Layers className="w-4 h-4 mr-1" />Harvest</TabsTrigger>
                {crop === 'maize' && <TabsTrigger value="shelling"><Scale className="w-4 h-4 mr-1" />Shelling</TabsTrigger>}
                <TabsTrigger value="sales"><ShoppingCart className="w-4 h-4 mr-1" />Sales</TabsTrigger>
                <TabsTrigger value="balance">Balance</TabsTrigger>
              </TabsList>
              <TabsContent value="harvest">
                <HarvestSubTab farmId={selectedFarmId} cropType={crop} farms={farms || []} />
              </TabsContent>
              {crop === 'maize' && (
                <TabsContent value="shelling">
                  <ShellingSubTab farmId={selectedFarmId} farms={farms || []} />
                </TabsContent>
              )}
              <TabsContent value="sales">
                <SalesSubTab farmId={selectedFarmId} cropType={crop} farms={farms || []} />
              </TabsContent>
              <TabsContent value="balance">
                <BalanceSubTab farmId={selectedFarmId} cropType={crop} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
