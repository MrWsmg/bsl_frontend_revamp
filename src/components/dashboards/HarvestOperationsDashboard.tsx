"use client";

// Harvest Operations Dashboard — yield forecasting, harvest planning, processing pipeline
import React, { useState, useCallback } from 'react';
import {
  Sprout, BarChart3, ClipboardList, Scale, Layers, Thermometer,
  Plus, RefreshCw, CheckCircle2, AlertTriangle, LayoutDashboard,
  TrendingUp, Calendar, Wheat, Sun, FileText, Play, Warehouse,
} from 'lucide-react';
import { SharedCardexSection } from './sections';
import { Layout } from '../layout/Layout';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { User } from '../../types';
import { useApi } from '../../hooks';
import apiService from '../../services/api';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

const HARVEST_NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  {
    id: 'forecasting',
    label: 'Yield Forecasting',
    icon: TrendingUp,
    children: [
      { id: 'samples', label: 'Field Samples', icon: Sprout },
      { id: 'forecasts', label: 'Forecasts', icon: BarChart3 },
    ],
  },
  {
    id: 'planning',
    label: 'Harvest Planning',
    icon: Calendar,
    children: [
      { id: 'plans', label: 'Harvest Plans', icon: ClipboardList },
      { id: 'checklist', label: 'Checklist', icon: CheckCircle2 },
    ],
  },
  { id: 'weighing', label: 'Picker Weighing', icon: Scale },
  {
    id: 'processing',
    label: 'Processing',
    icon: Layers,
    children: [
      { id: 'batches', label: 'Batches', icon: Wheat },
      { id: 'drying', label: 'Drying Logs', icon: Sun },
    ],
  },
  { id: 'report', label: 'Season Report', icon: FileText },
  { id: 'store',  label: 'Store/CARDEX',  icon: Warehouse },
];

interface HarvestOperationsDashboardProps {
  user: User;
  onLogout: () => void;
}

export const HarvestOperationsDashboard: React.FC<HarvestOperationsDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(['overview']));
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [seasonYear, setSeasonYear] = useState<string>(String(new Date().getFullYear()));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialogs
  const [showSampleForm, setShowSampleForm] = useState(false);
  const [showForecastForm, setShowForecastForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showWeighForm, setShowWeighForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [showDryingLogForm, setShowDryingLogForm] = useState(false);

  // Forms
  const [sampleForm, setSampleForm] = useState({
    sampled_by: user.full_name || '',
    fruiting_branches: '', sampled_branches_count: '', avg_cherries_per_branch: '',
    avg_cherry_weight_kg: '', coffee_stage: 'full_green', notes: '',
  });
  const [forecastForm, setForecastForm] = useState({
    season_year: seasonYear, trees_per_hectare: '800',
    conversion_factor_cf: '550', cherry_ratio_cr: '5.5',
    loss_factor: '0.10', fruit_set_factor: '0.90',
    avg_kg_per_picker_per_day: '30', harvest_duration_days: '60', notes: '',
  });
  const [planForm, setPlanForm] = useState({
    season_year: seasonYear, fly_picking_start: '', main_harvest_start: '',
    estimated_end: '', pickers_needed: '', pickers_type: 'contracted',
  });
  const [weighForm, setWeighForm] = useState({
    supervisor_name: user.full_name || '', picking_type: 'main',
    worker_type: 'contracted', picker_name: '', picker_phone: '',
    gross_weight_kg: '', tare_weight_kg: '1.0', delivery_note_ref: '',
  });
  const [batchForm, setBatchForm] = useState({
    processing_type: 'washed', variety: '',
    field_weight_kg: '', hopper_weight_kg: '',
  });
  const [dryingLogForm, setDryingLogForm] = useState({
    logged_by: user.full_name || '', temperature_c: '',
    moisture_pct: '', notes: '',
  });

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMountedTabs(prev => new Set(prev).add(tabId));
  };

  const fid = selectedFarmId ? parseInt(selectedFarmId) : 0;
  const sy = parseInt(seasonYear) || new Date().getFullYear();

  // Data fetching
  const getFarms = useCallback(() => apiService.getFarms(user.role), [user.role]);
  const { data: farms, loading: loadingFarms } = useApi(getFarms);

  React.useEffect(() => {
    if (farms?.length && !selectedFarmId) {
      setSelectedFarmId(String((farms as any[])[0].farm_id));
    }
  }, [farms, selectedFarmId]);

  const getSamples = useCallback(() => fid ? apiService.getYieldSamples(fid).catch(() => []) : Promise.resolve([]), [fid]);
  const getForecasts = useCallback(() => fid ? apiService.getYieldForecasts(fid, sy).catch(() => []) : Promise.resolve([]), [fid, sy]);
  const getPlans = useCallback(() => fid ? apiService.getHarvestPlans(fid, sy).catch(() => []) : Promise.resolve([]), [fid, sy]);
  const getWeighing = useCallback(() => fid ? apiService.getPickerWeighingRecords(fid).catch(() => ({ records: [], total_net_kg: 0, total_amount: 0 })) : Promise.resolve({ records: [], total_net_kg: 0, total_amount: 0 }), [fid]);
  const getBatches = useCallback(() => fid ? apiService.getProcessingBatches(fid).catch(() => []) : Promise.resolve([]), [fid]);
  const getDryingLogs = useCallback(() => selectedBatchId ? apiService.getDryingLogs(parseInt(selectedBatchId)).catch(() => []) : Promise.resolve([]), [selectedBatchId]);
  const getReport = useCallback(() => fid ? apiService.getHarvestReport(fid, sy).catch(() => null) : Promise.resolve(null), [fid, sy]);

  const { data: samples, loading: loadingSamples, refetch: refetchSamples } = useApi(getSamples);
  const { data: forecasts, loading: loadingForecasts, refetch: refetchForecasts } = useApi(getForecasts);
  const { data: plans, loading: loadingPlans, refetch: refetchPlans } = useApi(getPlans);
  const { data: weighingData, loading: loadingWeighing, refetch: refetchWeighing } = useApi(getWeighing);
  const { data: batches, loading: loadingBatches, refetch: refetchBatches } = useApi(getBatches);
  const { data: dryingLogs, loading: loadingDrying, refetch: refetchDrying } = useApi(getDryingLogs);
  const { data: report, loading: loadingReport, refetch: refetchReport } = useApi(getReport);

  const clearMessages = () => { setError(null); setSuccess(null); };

  // ===== Handlers =====

  const handleCreateSample = async (e: React.FormEvent) => {
    e.preventDefault(); clearMessages();
    try {
      await apiService.createYieldSample({
        farm_id: fid,
        sample_date: new Date().toISOString(),
        sampled_by: sampleForm.sampled_by,
        fruiting_branches: parseInt(sampleForm.fruiting_branches),
        sampled_branches_count: parseInt(sampleForm.sampled_branches_count),
        avg_cherries_per_branch: parseFloat(sampleForm.avg_cherries_per_branch),
        avg_cherry_weight_kg: sampleForm.avg_cherry_weight_kg ? parseFloat(sampleForm.avg_cherry_weight_kg) : undefined,
        coffee_stage: sampleForm.coffee_stage,
        notes: sampleForm.notes || undefined,
      });
      setSuccess('Sample recorded!');
      setShowSampleForm(false);
      setSampleForm({ sampled_by: user.full_name || '', fruiting_branches: '', sampled_branches_count: '', avg_cherries_per_branch: '', avg_cherry_weight_kg: '', coffee_stage: 'full_green', notes: '' });
      refetchSamples();
    } catch (err: any) { setError(err.message); }
  };

  const handleCreateForecast = async (e: React.FormEvent) => {
    e.preventDefault(); clearMessages();
    try {
      await apiService.createYieldForecast(fid, {
        season_year: parseInt(forecastForm.season_year),
        trees_per_hectare: parseInt(forecastForm.trees_per_hectare),
        conversion_factor_cf: parseFloat(forecastForm.conversion_factor_cf),
        cherry_ratio_cr: parseFloat(forecastForm.cherry_ratio_cr),
        loss_factor: parseFloat(forecastForm.loss_factor),
        fruit_set_factor: parseFloat(forecastForm.fruit_set_factor),
        avg_kg_per_picker_per_day: parseFloat(forecastForm.avg_kg_per_picker_per_day),
        harvest_duration_days: parseInt(forecastForm.harvest_duration_days),
        notes: forecastForm.notes || undefined,
      });
      setSuccess('Forecast generated!');
      setShowForecastForm(false);
      refetchForecasts();
    } catch (err: any) { setError(err.message); }
  };

  const handleConfirmForecast = async (forecastId: number) => {
    clearMessages();
    try {
      await apiService.confirmYieldForecast(forecastId);
      setSuccess('Forecast confirmed!');
      refetchForecasts();
    } catch (err: any) { setError(err.message); }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault(); clearMessages();
    try {
      await apiService.createHarvestPlan({
        farm_id: fid,
        season_year: parseInt(planForm.season_year),
        fly_picking_start: new Date(planForm.fly_picking_start).toISOString(),
        main_harvest_start: new Date(planForm.main_harvest_start).toISOString(),
        estimated_end: new Date(planForm.estimated_end).toISOString(),
        pickers_needed: parseInt(planForm.pickers_needed),
        pickers_type: planForm.pickers_type,
      });
      setSuccess('Harvest plan created!');
      setShowPlanForm(false);
      setPlanForm({ season_year: seasonYear, fly_picking_start: '', main_harvest_start: '', estimated_end: '', pickers_needed: '', pickers_type: 'contracted' });
      refetchPlans();
    } catch (err: any) { setError(err.message); }
  };

  const handleApprovePlan = async (planId: number) => {
    clearMessages();
    try {
      await apiService.approveHarvestPlan(planId);
      setSuccess('Plan approved!');
      refetchPlans();
    } catch (err: any) { setError(err.message); }
  };

  const handleRecordWeighing = async (e: React.FormEvent) => {
    e.preventDefault(); clearMessages();
    try {
      const res: any = await apiService.recordPickerWeighing({
        farm_id: fid,
        date_picked: new Date().toISOString(),
        supervisor_name: weighForm.supervisor_name,
        picking_type: weighForm.picking_type,
        worker_type: weighForm.worker_type,
        picker_name: weighForm.picker_name,
        picker_phone: weighForm.picker_phone || undefined,
        gross_weight_kg: parseFloat(weighForm.gross_weight_kg),
        tare_weight_kg: parseFloat(weighForm.tare_weight_kg),
        delivery_note_ref: weighForm.delivery_note_ref || undefined,
      });
      setSuccess(`Weighed: ${res.net_weight_kg?.toFixed(1)} kg → TZS ${res.amount_due?.toLocaleString()} (${res.rate_source})`);
      setShowWeighForm(false);
      setWeighForm({ supervisor_name: user.full_name || '', picking_type: 'main', worker_type: 'contracted', picker_name: '', picker_phone: '', gross_weight_kg: '', tare_weight_kg: '1.0', delivery_note_ref: '' });
      refetchWeighing();
    } catch (err: any) { setError(err.message); }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault(); clearMessages();
    try {
      const res: any = await apiService.createProcessingBatch({
        farm_id: fid,
        processing_type: batchForm.processing_type,
        variety: batchForm.variety || undefined,
        field_weight_kg: parseFloat(batchForm.field_weight_kg),
        hopper_weight_kg: parseFloat(batchForm.hopper_weight_kg),
      });
      setSuccess(`Batch created: ${res.batch_ref}`);
      setShowBatchForm(false);
      setBatchForm({ processing_type: 'washed', variety: '', field_weight_kg: '', hopper_weight_kg: '' });
      refetchBatches();
    } catch (err: any) { setError(err.message); }
  };

  const handleAdvanceBatch = async (batchId: number, stage: string) => {
    clearMessages();
    try {
      const now = new Date().toISOString();
      if (stage === 'pulping') await apiService.updateBatchPulping(batchId, { pulping_start: now });
      else if (stage === 'fermentation-start') await apiService.startBatchFermentation(batchId, now);
      else if (stage === 'fermentation-end') await apiService.endBatchFermentation(batchId, now);
      else if (stage === 'drying') await apiService.startBatchDrying(batchId, { drying_start: now, drying_method: 'table' });
      setSuccess('Batch stage updated!');
      refetchBatches();
    } catch (err: any) { setError(err.message); }
  };

  const handleLogDrying = async (e: React.FormEvent) => {
    e.preventDefault(); clearMessages();
    try {
      await apiService.logDrying({
        batch_id: parseInt(selectedBatchId),
        logged_at: new Date().toISOString(),
        logged_by: dryingLogForm.logged_by,
        temperature_c: dryingLogForm.temperature_c ? parseFloat(dryingLogForm.temperature_c) : undefined,
        moisture_pct: dryingLogForm.moisture_pct ? parseFloat(dryingLogForm.moisture_pct) : undefined,
        notes: dryingLogForm.notes || undefined,
      });
      setSuccess('Drying log recorded!');
      setShowDryingLogForm(false);
      setDryingLogForm({ logged_by: user.full_name || '', temperature_c: '', moisture_pct: '', notes: '' });
      refetchDrying();
    } catch (err: any) { setError(err.message); }
  };

  // ===== Render helpers =====

  const getStageColor = (status: string) => {
    const map: Record<string, string> = {
      collecting: 'bg-gray-100 text-gray-600',
      pulping: 'bg-orange-100 text-orange-700',
      fermenting: 'bg-yellow-100 text-yellow-700',
      drying: 'bg-amber-100 text-amber-700',
      completed: 'bg-green-100 text-green-700',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  const nextStageLabel = (status: string) => {
    const map: Record<string, [string, string]> = {
      collecting: ['pulping', 'Start Pulping'],
      pulping: ['fermentation-start', 'Start Fermentation'],
      fermenting: ['fermentation-end', 'End Fermentation'],
      drying: ['', ''],
    };
    return map[status] || ['', ''];
  };

  // ===== Render: Overview =====
  const renderOverview = () => {
    if (loadingFarms) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
    if (!selectedFarmId) return <Card><CardContent className="p-8 text-center text-muted-foreground">Select a farm.</CardContent></Card>;

    const rep = report as any;
    const totalPicked = rep?.actual?.total_cherry_picked_kg?.toFixed(0) || 0;
    const totalParchment = rep?.actual?.total_parchment_kg?.toFixed(0) || 0;
    const forecastBase = rep?.forecast?.total_forecast_kg?.toFixed(0) || '—';
    const labourPaid = rep?.labour?.total_paid_to_pickers_tzs?.toLocaleString() || 0;

    return (
      <div className="space-y-6">
        {/* Farm + Season selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Label className="text-sm font-medium">Farm</Label>
              <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Select farm" /></SelectTrigger>
                <SelectContent>
                  {(farms as any[] || []).map((f: any) => (
                    <SelectItem key={f.farm_id} value={String(f.farm_id)}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label className="text-sm font-medium">Season</Label>
              <Input className="w-24" type="number" value={seasonYear}
                onChange={e => setSeasonYear(e.target.value)} />
              <Button variant="outline" size="icon" onClick={() => { refetchForecasts(); refetchPlans(); refetchWeighing(); refetchBatches(); refetchReport(); }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}

        {/* Season stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Forecast (base)', value: `${forecastBase} kg`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-500' },
            { label: 'Cherry Picked', value: `${totalPicked} kg`, icon: Wheat, color: 'text-green-600', bg: 'bg-green-500' },
            { label: 'Parchment Out', value: `${totalParchment} kg`, icon: Layers, color: 'text-amber-600', bg: 'bg-amber-500' },
            { label: 'Paid to Pickers', value: `TZS ${labourPaid}`, icon: Scale, color: 'text-purple-600', bg: 'bg-purple-500' },
          ].map((s, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  </div>
                  <div className={`${s.bg} p-3 rounded-xl`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active processing batches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Active Processing Batches</CardTitle>
              <CardDescription>Collecting → Pulping → Fermenting → Drying</CardDescription>
            </div>
            <Button variant="link" size="sm" onClick={() => handleTabChange('batches')}>View All</Button>
          </CardHeader>
          <CardContent>
            {(batches as any[] || []).filter((b: any) => b.status !== 'completed').length === 0 ? (
              <div className="text-center py-6 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">No active batches</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(batches as any[] || []).filter((b: any) => b.status !== 'completed').slice(0, 5).map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{b.batch_ref}</span>
                        <Badge className={getStageColor(b.status)}>{b.status}</Badge>
                        <Badge variant="outline">{b.processing_type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Field: {b.field_weight_kg} kg &bull; Hopper: {b.hopper_weight_kg} kg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ===== Render: Samples =====
  const renderSamples = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Field Yield Samples</CardTitle>
            <CardDescription>Cherry count samples used for forecasting</CardDescription>
          </div>
          <Button onClick={() => setShowSampleForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Sample
          </Button>
        </CardHeader>
        <CardContent>
          {loadingSamples ? <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div> :
            !(samples as any[])?.length ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No samples yet. Add field samples to generate forecasts.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(samples as any[]).map((s: any) => (
                  <div key={s.id} className="bg-muted/50 p-4 rounded-lg border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-green-100 text-green-600">{s.coffee_stage}</Badge>
                          <span className="text-sm text-muted-foreground">{new Date(s.sample_date).toLocaleDateString()}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          <div><span className="font-medium">Branches:</span> {s.sampled_branches_count}</div>
                          <div><span className="font-medium">Avg cherries/branch:</span> {s.avg_cherries_per_branch}</div>
                          <div><span className="font-medium">Fruiting:</span> {s.fruiting_branches}</div>
                          <div><span className="font-medium">By:</span> {s.sampled_by}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );

  // ===== Render: Forecasts =====
  const renderForecasts = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Yield Forecasts</CardTitle>
            <CardDescription>Statistical CI-based yield predictions for {seasonYear}</CardDescription>
          </div>
          <Button onClick={() => setShowForecastForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> Generate Forecast
          </Button>
        </CardHeader>
        <CardContent>
          {loadingForecasts ? <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div> :
            !(forecasts as any[])?.length ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No forecasts yet. Add field samples first, then generate a forecast.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(forecasts as any[]).map((f: any) => (
                  <div key={f.id} className="bg-muted/50 p-5 rounded-lg border-l-4 border-blue-500">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={f.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                          {f.status}
                        </Badge>
                        <span className="font-medium">Season {f.season_year}</span>
                        <span className="text-sm text-muted-foreground">({f.sample_count} samples)</span>
                      </div>
                      {f.status === 'draft' && (
                        <Button size="sm" onClick={() => handleConfirmForecast(f.id)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Confirm
                        </Button>
                      )}
                    </div>

                    {/* Scenario bars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                      {[
                        { label: 'Pessimistic', value: f.pessimistic_yield_kg, color: 'bg-red-500' },
                        { label: 'Base', value: f.base_yield_kg, color: 'bg-blue-500' },
                        { label: 'Optimistic', value: f.optimistic_yield_kg, color: 'bg-green-500' },
                      ].map((sc) => (
                        <div key={sc.label} className="text-center p-3 bg-white rounded-lg border">
                          <p className="text-xs text-muted-foreground">{sc.label}</p>
                          <p className="text-lg font-bold">{(sc.value / 1000).toFixed(1)} t</p>
                          <div className={`${sc.color} h-1.5 rounded-full mt-1`} style={{ width: `${Math.min((sc.value / f.optimistic_yield_kg) * 100, 100)}%` }} />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <div><span className="font-medium">Yield/ha:</span> {f.yield_kg_per_hectare?.toFixed(0)} kg</div>
                      <div><span className="font-medium">Pickers needed:</span> {f.estimated_pickers_needed}</div>
                      <div><span className="font-medium">Harvest days:</span> {f.harvest_duration_days}</div>
                      {f.ci_lower_kg_per_ha && <div><span className="font-medium">CI 95%:</span> {f.ci_lower_kg_per_ha?.toFixed(0)}–{f.ci_upper_kg_per_ha?.toFixed(0)} kg/ha</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );

  // ===== Render: Plans =====
  const renderPlans = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Harvest Plans</CardTitle>
            <CardDescription>Season {seasonYear} harvest schedule</CardDescription>
          </div>
          <Button onClick={() => setShowPlanForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Plan
          </Button>
        </CardHeader>
        <CardContent>
          {loadingPlans ? <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div> :
            !(plans as any[])?.length ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No harvest plans yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(plans as any[]).map((p: any) => (
                  <div key={p.id} className="bg-muted/50 p-5 rounded-lg border-l-4 border-indigo-500">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={
                          p.status === 'approved' ? 'bg-green-100 text-green-700' :
                          p.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'
                        }>{p.status}</Badge>
                        <span className="font-medium">Plan #{p.id} — Season {p.season_year}</span>
                      </div>
                      <div className="flex gap-2">
                        {p.status === 'draft' && (
                          <Button size="sm" onClick={() => handleApprovePlan(p.id)}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => { setSelectedPlanId(String(p.id)); handleTabChange('checklist'); }}>
                          Checklist
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div><span className="font-medium">Fly picking:</span> {new Date(p.fly_picking_start).toLocaleDateString()}</div>
                      <div><span className="font-medium">Main harvest:</span> {new Date(p.main_harvest_start).toLocaleDateString()}</div>
                      <div><span className="font-medium">Est. end:</span> {new Date(p.estimated_end).toLocaleDateString()}</div>
                      <div><span className="font-medium">Pickers needed:</span> {p.pickers_needed}</div>
                      <div><span className="font-medium">Type:</span> {p.pickers_type}</div>
                      <div><span className="font-medium">Checklist:</span> {p.checklist_completed ? '✓' : 'Pending'}</div>
                    </div>
                    {/* Notification status */}
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline" className={p.notif_1month_sent ? 'text-green-600' : 'text-gray-400'}>30d notif</Badge>
                      <Badge variant="outline" className={p.notif_2weeks_sent ? 'text-green-600' : 'text-gray-400'}>14d notif</Badge>
                      <Badge variant="outline" className={p.notif_1day_sent ? 'text-green-600' : 'text-gray-400'}>1d notif</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );

  // ===== Render: Checklist =====
  const renderChecklist = () => {
    const plan = (plans as any[] || []).find((p: any) => String(p.id) === selectedPlanId);

    const CheckRow = ({ label, value }: { label: string; value: boolean }) => (
      <div className="flex items-center justify-between py-2 border-b last:border-0">
        <span className="text-sm">{label}</span>
        <Badge className={value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
          {value ? '✓ Ready' : '✗ Pending'}
        </Badge>
      </div>
    );

    if (!selectedPlanId) {
      return (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Select a plan from the Harvest Plans tab to view its checklist.
          </CardContent>
        </Card>
      );
    }

    // Load checklist separately
    const ChecklistLoader = () => {
      const getChecklist = useCallback(() =>
        selectedPlanId ? apiService.getHarvestChecklist(parseInt(selectedPlanId)).catch(() => null) : Promise.resolve(null),
        []);
      const { data: checklist, loading } = useApi(getChecklist);
      const cl = checklist as any;

      if (loading) return <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>;
      if (!cl) return <div className="text-center py-8 bg-muted/50 rounded-lg"><p className="text-muted-foreground">Checklist not available yet.</p></div>;

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: 'Scales', items: [['Field scales serviced', cl.field_scales_serviced], ['Field scales calibrated', cl.field_scales_calibrated], ['Hopper scales serviced', cl.hopper_scales_serviced], ['Hopper scales calibrated', cl.hopper_scales_calibrated], ['Parchment scales serviced', cl.parchment_scales_serviced]] },
            { title: 'Materials & Documents', items: [['Harvest bags ready', cl.harvest_bags_ready], ['Vehicles prepared', cl.vehicles_prepared], ['GRN documents ready', cl.grn_documents_ready], ['Seals ready', cl.seals_ready], ['Transfer documents ready', cl.transfer_documents_ready]] },
            { title: 'Drying Infrastructure', items: [['Drying tables repaired', cl.drying_tables_repaired], ['Plastic sheeting ok', cl.drying_plastic_sheeting_ok], ['Table legs ok', cl.table_legs_ok], ['Shade netting ok', cl.shade_netting_ok], ['Electric driers serviced', cl.electric_driers_serviced], ['Fuel availability confirmed', cl.fuel_availability_confirmed]] },
            { title: 'Storage & Processing', items: [['Storage roofing ok', cl.storage_roofing_ok], ['Factory doors ok', cl.factory_doors_ok], ['Alarm system tested', cl.alarm_system_tested], ['CCTV tested', cl.cctv_tested], ['Fire extinguishers checked', cl.fire_extinguishers_checked], ['Pulper disks calibrated', cl.pulper_disks_calibrated], ['Washing channels ok', cl.washing_channels_ok], ['Fermentation dams ok', cl.fermentation_dams_ok]] },
            { title: 'Security', items: [['Flashlights ready', cl.security_flashlights], ['Whistles ready', cl.security_whistles], ['Rain gear ready', cl.security_rain_gear], ['Phones with credit', cl.security_phones_credit], ['Remotes working', cl.security_remotes_ok], ['Firearms serviced', cl.security_firearms_serviced]] },
          ].map((section) => (
            <Card key={section.title}>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{section.title}</CardTitle></CardHeader>
              <CardContent>
                {section.items.map(([label, value]) => (
                  <CheckRow key={label as string} label={label as string} value={value as boolean} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium">Viewing checklist for</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>
                  {(plans as any[] || []).map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>Plan #{p.id} — {p.season_year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        {plan && <ChecklistLoader />}
      </div>
    );
  };

  // ===== Render: Weighing =====
  const renderWeighing = () => {
    const wd = weighingData as any;
    const records = wd?.records || [];
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Picker Weighing</CardTitle>
              <CardDescription>Record weights and auto-generate payroll</CardDescription>
            </div>
            <Button onClick={() => setShowWeighForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Record Weight
            </Button>
          </CardHeader>
          <CardContent>
            {/* Totals */}
            {(wd?.total_net_kg || wd?.total_amount) && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="bg-green-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Net Weight</p>
                    <p className="text-2xl font-bold text-green-700">{wd?.total_net_kg?.toFixed(1)} kg</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Amount Due</p>
                    <p className="text-2xl font-bold text-blue-700">TZS {wd?.total_amount?.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {loadingWeighing ? <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div> :
              !records.length ? (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">No weighing records yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {records.slice(0, 30).map((r: any) => (
                    <div key={r.id} className="bg-muted/50 p-4 rounded-lg border-l-4 border-green-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{r.picker_name}</span>
                            <Badge variant="secondary">{r.picking_type}</Badge>
                            <Badge variant="outline">{r.worker_type}</Badge>
                            {r.sms_sent && <Badge className="bg-blue-100 text-blue-600">SMS sent</Badge>}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                            <div><span className="font-medium">Gross:</span> {r.gross_weight_kg} kg</div>
                            <div><span className="font-medium">Net:</span> {r.net_weight_kg?.toFixed(1)} kg</div>
                            <div><span className="font-medium">Rate:</span> TZS {r.rate_per_kg}/kg</div>
                            <div><span className="font-medium">Amount:</span> TZS {r.amount_due?.toLocaleString()}</div>
                          </div>
                        </div>
                        {r.picker_token && <Badge variant="secondary" className="font-mono">{r.picker_token}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ===== Render: Batches =====
  const renderBatches = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Processing Batches</CardTitle>
            <CardDescription>Cherry → Pulping → Fermentation → Drying → Parchment</CardDescription>
          </div>
          <Button onClick={() => setShowBatchForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Batch
          </Button>
        </CardHeader>
        <CardContent>
          {loadingBatches ? <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div> :
            !(batches as any[])?.length ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No processing batches yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(batches as any[]).map((b: any) => {
                  const [nextStage, nextLabel] = nextStageLabel(b.status);
                  return (
                    <div key={b.id} className="bg-muted/50 p-5 rounded-lg border-l-4 border-amber-500">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{b.batch_ref}</span>
                          <Badge className={getStageColor(b.status)}>{b.status}</Badge>
                          <Badge variant="outline">{b.processing_type}</Badge>
                          {b.variety && <Badge variant="secondary">{b.variety}</Badge>}
                        </div>
                        <div className="flex gap-2">
                          {nextStage && (
                            <Button size="sm" variant="outline" onClick={() => handleAdvanceBatch(b.id, nextStage)}>
                              <Play className="h-3 w-3 mr-1" /> {nextLabel}
                            </Button>
                          )}
                          {b.status === 'drying' && (
                            <Button size="sm" variant="outline" onClick={() => { setSelectedBatchId(String(b.id)); handleTabChange('drying'); }}>
                              <Thermometer className="h-3 w-3 mr-1" /> Drying Logs
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <div><span className="font-medium">Field weight:</span> {b.field_weight_kg} kg</div>
                        <div><span className="font-medium">Hopper weight:</span> {b.hopper_weight_kg} kg</div>
                        {b.hopper_vs_field_variance != null && (
                          <div className={Math.abs(b.hopper_vs_field_variance) > 5 ? 'text-red-600' : ''}>
                            <span className="font-medium">Variance:</span> {b.hopper_vs_field_variance?.toFixed(1)}%
                            {Math.abs(b.hopper_vs_field_variance) > 5 && <AlertTriangle className="inline h-3 w-3 ml-1" />}
                          </div>
                        )}
                        {b.parchment_kg && <div><span className="font-medium">Parchment:</span> {b.parchment_kg} kg</div>}
                        {b.fermentation_duration_hours && <div><span className="font-medium">Ferm. time:</span> {b.fermentation_duration_hours?.toFixed(1)}h</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );

  // ===== Render: Drying Logs =====
  const renderDryingLogs = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">Batch</Label>
            <Select value={selectedBatchId} onValueChange={(v) => { setSelectedBatchId(v); setTimeout(refetchDrying, 100); }}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Select batch..." /></SelectTrigger>
              <SelectContent>
                {(batches as any[] || []).filter((b: any) => ['drying', 'completed'].includes(b.status)).map((b: any) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.batch_ref} ({b.status})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBatchId && (
              <Button onClick={() => setShowDryingLogForm(true)}>
                <Plus className="h-4 w-4 mr-2" /> Log Reading
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedBatchId && (
        <Card>
          <CardHeader>
            <CardTitle>Drying Logs — Batch #{selectedBatchId}</CardTitle>
            <CardDescription>Temperature & moisture monitoring (target: 40-50°C, &lt;10.5% moisture)</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDrying ? <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div> :
              !(dryingLogs as any[])?.length ? (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">No logs yet. Add readings to track drying progress.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(dryingLogs as any[]).map((log: any) => {
                    const tempAlert = log.temperature_c != null && (log.temperature_c < 40 || log.temperature_c > 50);
                    return (
                      <div key={log.id} className={`p-4 rounded-lg border-l-4 ${tempAlert ? 'border-red-500 bg-red-50' : 'bg-muted/50 border-amber-500'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">{new Date(log.logged_at).toLocaleString()}</span>
                          {log.alert_sent && <Badge className="bg-red-100 text-red-600"><AlertTriangle className="h-3 w-3 mr-1" /> Alert sent</Badge>}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          {log.temperature_c != null && (
                            <div className={tempAlert ? 'text-red-600 font-bold' : ''}>
                              <span className="font-medium">Temp:</span> {log.temperature_c}°C
                              {tempAlert && <AlertTriangle className="inline h-3 w-3 ml-1" />}
                            </div>
                          )}
                          {log.moisture_pct != null && <div><span className="font-medium">Moisture:</span> {log.moisture_pct}%</div>}
                          <div><span className="font-medium">By:</span> {log.logged_by}</div>
                          {log.drier_id && <div><span className="font-medium">Drier:</span> {log.drier_id}</div>}
                        </div>
                        {log.notes && <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ===== Render: Report =====
  const renderReport = () => {
    const rep = report as any;
    if (loadingReport) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
    if (!rep) return <Card><CardContent className="p-8 text-center text-muted-foreground">No report data for season {seasonYear}.</CardContent></Card>;
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Season {seasonYear} Harvest Report — {rep.farm_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Forecast */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-600">Forecast</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Base</span><strong>{rep.forecast?.total_forecast_kg?.toFixed(0)} kg</strong></div>
                  <div className="flex justify-between text-green-600"><span>Optimistic</span><strong>{rep.forecast?.optimistic_kg?.toFixed(0)} kg</strong></div>
                  <div className="flex justify-between text-red-600"><span>Pessimistic</span><strong>{rep.forecast?.pessimistic_kg?.toFixed(0)} kg</strong></div>
                </CardContent>
              </Card>
              {/* Actual */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-green-600">Actual Production</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Cherry picked</span><strong>{rep.actual?.total_cherry_picked_kg?.toFixed(0)} kg</strong></div>
                  <div className="flex justify-between"><span>Parchment</span><strong>{rep.actual?.total_parchment_kg?.toFixed(0)} kg</strong></div>
                  <div className="flex justify-between"><span>P1</span><strong>{rep.actual?.p1_kg?.toFixed(0)} kg</strong></div>
                  <div className="flex justify-between"><span>P2</span><strong>{rep.actual?.p2_kg?.toFixed(0)} kg</strong></div>
                  <div className="flex justify-between text-muted-foreground"><span>Batches completed</span><strong>{rep.actual?.batches_completed}</strong></div>
                </CardContent>
              </Card>
              {/* Labour */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-purple-600">Labour</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Unique pickers</span><strong>{rep.labour?.unique_pickers}</strong></div>
                  <div className="flex justify-between"><span>Weighing sessions</span><strong>{rep.labour?.total_weighing_sessions}</strong></div>
                  <div className="flex justify-between"><span>Total paid</span><strong>TZS {rep.labour?.total_paid_to_pickers_tzs?.toLocaleString()}</strong></div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const getTitle = () => ({
    overview: 'Harvest Overview', samples: 'Field Samples', forecasts: 'Yield Forecasts',
    plans: 'Harvest Plans', checklist: 'Pre-Harvest Checklist', weighing: 'Picker Weighing',
    batches: 'Processing Batches', drying: 'Drying Logs', report: 'Season Report',
    store: 'Store / CARDEX',
  }[activeTab] || 'Harvest Operations');

  return (
    <ErrorBoundary>
      <Layout
        user={user} onLogout={onLogout}
        sidebarItems={HARVEST_NAV_ITEMS}
        activeTab={activeTab} onTabChange={handleTabChange}
        title={getTitle()}
      >
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}

        {(['overview', 'samples', 'forecasts', 'plans', 'checklist', 'weighing', 'batches', 'drying', 'report'] as const).map(tab => (
          <div key={tab} className={activeTab === tab ? '' : 'hidden'}>
            {mountedTabs.has(tab) && (
              tab === 'overview' ? renderOverview() :
              tab === 'samples' ? renderSamples() :
              tab === 'forecasts' ? renderForecasts() :
              tab === 'plans' ? renderPlans() :
              tab === 'checklist' ? renderChecklist() :
              tab === 'weighing' ? renderWeighing() :
              tab === 'batches' ? renderBatches() :
              tab === 'drying' ? renderDryingLogs() :
              renderReport()
            )}
          </div>
        ))}
        <div className={activeTab === 'store' ? '' : 'hidden'}>
          {mountedTabs.has('store') && <SharedCardexSection userRole="general_manager" />}
        </div>

        {/* ===== DIALOGS ===== */}

        {/* Sample Form */}
        <Dialog open={showSampleForm} onOpenChange={setShowSampleForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Field Sample</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateSample} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sampled by *</Label>
                  <Input value={sampleForm.sampled_by} onChange={e => setSampleForm({ ...sampleForm, sampled_by: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Coffee Stage *</Label>
                  <Select value={sampleForm.coffee_stage} onValueChange={v => setSampleForm({ ...sampleForm, coffee_stage: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pinhead">Pinhead</SelectItem>
                      <SelectItem value="pea_sized">Pea-sized</SelectItem>
                      <SelectItem value="full_green">Full green</SelectItem>
                      <SelectItem value="color_break">Color break</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fruiting branches (total) *</Label>
                  <Input type="number" value={sampleForm.fruiting_branches} onChange={e => setSampleForm({ ...sampleForm, fruiting_branches: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Branches sampled *</Label>
                  <Input type="number" value={sampleForm.sampled_branches_count} onChange={e => setSampleForm({ ...sampleForm, sampled_branches_count: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Avg cherries/branch *</Label>
                  <Input type="number" step="0.1" value={sampleForm.avg_cherries_per_branch} onChange={e => setSampleForm({ ...sampleForm, avg_cherries_per_branch: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Avg cherry weight (kg)</Label>
                  <Input type="number" step="0.001" value={sampleForm.avg_cherry_weight_kg} onChange={e => setSampleForm({ ...sampleForm, avg_cherry_weight_kg: e.target.value })} placeholder="Optional" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={sampleForm.notes} onChange={e => setSampleForm({ ...sampleForm, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowSampleForm(false)}>Cancel</Button>
                <Button type="submit">Record Sample</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Forecast Form */}
        <Dialog open={showForecastForm} onOpenChange={setShowForecastForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Generate Yield Forecast</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateForecast} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Season year *</Label>
                  <Input type="number" value={forecastForm.season_year} onChange={e => setForecastForm({ ...forecastForm, season_year: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Trees/hectare *</Label>
                  <Input type="number" value={forecastForm.trees_per_hectare} onChange={e => setForecastForm({ ...forecastForm, trees_per_hectare: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Conversion factor (CF)</Label>
                  <Input type="number" step="1" value={forecastForm.conversion_factor_cf} onChange={e => setForecastForm({ ...forecastForm, conversion_factor_cf: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Cherry ratio (CR)</Label>
                  <Input type="number" step="0.1" value={forecastForm.cherry_ratio_cr} onChange={e => setForecastForm({ ...forecastForm, cherry_ratio_cr: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Loss factor (0–1)</Label>
                  <Input type="number" step="0.01" value={forecastForm.loss_factor} onChange={e => setForecastForm({ ...forecastForm, loss_factor: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Fruit set factor (0–1)</Label>
                  <Input type="number" step="0.01" value={forecastForm.fruit_set_factor} onChange={e => setForecastForm({ ...forecastForm, fruit_set_factor: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Avg kg/picker/day</Label>
                  <Input type="number" step="1" value={forecastForm.avg_kg_per_picker_per_day} onChange={e => setForecastForm({ ...forecastForm, avg_kg_per_picker_per_day: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Harvest duration (days)</Label>
                  <Input type="number" step="1" value={forecastForm.harvest_duration_days} onChange={e => setForecastForm({ ...forecastForm, harvest_duration_days: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForecastForm(false)}>Cancel</Button>
                <Button type="submit"><BarChart3 className="h-4 w-4 mr-2" /> Generate</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Plan Form */}
        <Dialog open={showPlanForm} onOpenChange={setShowPlanForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Harvest Plan</DialogTitle></DialogHeader>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Season year *</Label>
                  <Input type="number" value={planForm.season_year} onChange={e => setPlanForm({ ...planForm, season_year: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Pickers needed *</Label>
                  <Input type="number" value={planForm.pickers_needed} onChange={e => setPlanForm({ ...planForm, pickers_needed: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Fly picking start *</Label>
                  <Input type="date" value={planForm.fly_picking_start} onChange={e => setPlanForm({ ...planForm, fly_picking_start: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Main harvest start *</Label>
                  <Input type="date" value={planForm.main_harvest_start} onChange={e => setPlanForm({ ...planForm, main_harvest_start: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Estimated end *</Label>
                  <Input type="date" value={planForm.estimated_end} onChange={e => setPlanForm({ ...planForm, estimated_end: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Pickers type</Label>
                  <Select value={planForm.pickers_type} onValueChange={v => setPlanForm({ ...planForm, pickers_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contracted">Contracted</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowPlanForm(false)}>Cancel</Button>
                <Button type="submit">Create Plan</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Weighing Form */}
        <Dialog open={showWeighForm} onOpenChange={setShowWeighForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Picker Weight</DialogTitle></DialogHeader>
            <form onSubmit={handleRecordWeighing} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Picker name *</Label>
                  <Input value={weighForm.picker_name} onChange={e => setWeighForm({ ...weighForm, picker_name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Picker phone</Label>
                  <Input value={weighForm.picker_phone} onChange={e => setWeighForm({ ...weighForm, picker_phone: e.target.value })} placeholder="+255..." />
                </div>
                <div className="space-y-2">
                  <Label>Picking type *</Label>
                  <Select value={weighForm.picking_type} onValueChange={v => setWeighForm({ ...weighForm, picking_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main</SelectItem>
                      <SelectItem value="fly">Fly</SelectItem>
                      <SelectItem value="strip">Strip</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Worker type *</Label>
                  <Select value={weighForm.worker_type} onValueChange={v => setWeighForm({ ...weighForm, worker_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contracted">Contracted</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gross weight (kg) *</Label>
                  <Input type="number" step="0.1" value={weighForm.gross_weight_kg} onChange={e => setWeighForm({ ...weighForm, gross_weight_kg: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Tare weight (kg)</Label>
                  <Input type="number" step="0.1" value={weighForm.tare_weight_kg} onChange={e => setWeighForm({ ...weighForm, tare_weight_kg: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Delivery note ref</Label>
                <Input value={weighForm.delivery_note_ref} onChange={e => setWeighForm({ ...weighForm, delivery_note_ref: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowWeighForm(false)}>Cancel</Button>
                <Button type="submit"><Scale className="h-4 w-4 mr-2" /> Record & Generate Payroll</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Batch Form */}
        <Dialog open={showBatchForm} onOpenChange={setShowBatchForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Processing Batch</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Processing type *</Label>
                  <Select value={batchForm.processing_type} onValueChange={v => setBatchForm({ ...batchForm, processing_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="washed">Washed</SelectItem>
                      <SelectItem value="honey">Honey</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Variety</Label>
                  <Input value={batchForm.variety} onChange={e => setBatchForm({ ...batchForm, variety: e.target.value })} placeholder="e.g. Bourbon" />
                </div>
                <div className="space-y-2">
                  <Label>Field weight (kg) *</Label>
                  <Input type="number" step="0.1" value={batchForm.field_weight_kg} onChange={e => setBatchForm({ ...batchForm, field_weight_kg: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Hopper weight (kg) *</Label>
                  <Input type="number" step="0.1" value={batchForm.hopper_weight_kg} onChange={e => setBatchForm({ ...batchForm, hopper_weight_kg: e.target.value })} required />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowBatchForm(false)}>Cancel</Button>
                <Button type="submit">Create Batch</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Drying Log Form */}
        <Dialog open={showDryingLogForm} onOpenChange={setShowDryingLogForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Drying Reading</DialogTitle></DialogHeader>
            <form onSubmit={handleLogDrying} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Logged by *</Label>
                  <Input value={dryingLogForm.logged_by} onChange={e => setDryingLogForm({ ...dryingLogForm, logged_by: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Temperature (°C)</Label>
                  <Input type="number" step="0.1" value={dryingLogForm.temperature_c} onChange={e => setDryingLogForm({ ...dryingLogForm, temperature_c: e.target.value })} placeholder="40–50°C" />
                </div>
                <div className="space-y-2">
                  <Label>Moisture (%)</Label>
                  <Input type="number" step="0.1" value={dryingLogForm.moisture_pct} onChange={e => setDryingLogForm({ ...dryingLogForm, moisture_pct: e.target.value })} placeholder="Target: 10.5%" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={dryingLogForm.notes} onChange={e => setDryingLogForm({ ...dryingLogForm, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowDryingLogForm(false)}>Cancel</Button>
                <Button type="submit"><Thermometer className="h-4 w-4 mr-2" /> Log Reading</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </Layout>
    </ErrorBoundary>
  );
};

export default HarvestOperationsDashboard;
