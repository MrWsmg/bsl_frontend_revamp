"use client";

// Factory Supervisor Dashboard - matches Layout/sidebar pattern
import React, { useState, useCallback, useMemo } from 'react';
import {
  Factory, Thermometer, Droplets, Sun, Scale, BarChart3,
  Plus, RefreshCw, Play, CheckCircle2, AlertTriangle,
  LayoutDashboard, Beaker, Clock, Package,
} from 'lucide-react';
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

// Sidebar navigation items
const FACTORY_NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  {
    id: 'processing',
    label: 'Processing',
    icon: Factory,
    children: [
      { id: 'intake', label: 'Cherry Intake', icon: Scale },
      { id: 'fermentation', label: 'Fermentation', icon: Thermometer },
      { id: 'washing', label: 'Washing', icon: Droplets },
      { id: 'drying', label: 'Drying', icon: Sun },
    ],
  },
  { id: 'ratios', label: 'Ratios', icon: BarChart3 },
];

interface FactorySupervisorDashboardProps {
  user: User;
  onLogout: () => void;
}

export const FactorySupervisorDashboard: React.FC<FactorySupervisorDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(['overview']));
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialogs
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [showFermentForm, setShowFermentForm] = useState(false);
  const [showWashForm, setShowWashForm] = useState(false);
  const [showDryingForm, setShowDryingForm] = useState(false);

  // Forms
  const [intakeForm, setIntakeForm] = useState({
    source_farm_id: '', cherry_weight_kg: '', debe_count: '', variety: '', vehicle_number: '', delivered_by: '',
  });
  const [fermentForm, setFermentForm] = useState({
    tank_id: '', intake_ids: '', pulped_weight_kg: '',
  });
  const [washForm, setWashForm] = useState({
    fermentation_batch_id: '', washed_weight_kg: '', water_usage_litres: '',
  });
  const [dryingForm, setDryingForm] = useState({
    drying_table_id: '', washing_record_id: '', grade: 'P1',
    wet_parchment_weight_kg: '', debe_count: '', variety: '',
  });

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMountedTabs(prev => new Set(prev).add(tabId));
  };

  // Data fetching
  const getFarms = useCallback(() => apiService.getFarms(user.role), [user.role]);
  const { data: farms, loading: loadingFarms } = useApi(getFarms);

  // Auto-select first farm
  React.useEffect(() => {
    if (farms?.length && !selectedFarmId) {
      setSelectedFarmId(String((farms as any[])[0].farm_id));
    }
  }, [farms, selectedFarmId]);

  const fid = selectedFarmId ? parseInt(selectedFarmId) : 0;

  const getIntakes = useCallback(() => fid ? apiService.getFactoryIntakes(fid).catch(() => []) : Promise.resolve([]), [fid]);
  const getTanks = useCallback(() => fid ? apiService.getFermentationTanks(fid).catch(() => []) : Promise.resolve([]), [fid]);
  const getActiveFerm = useCallback(() => fid ? apiService.getActiveFermentations(fid).catch(() => []) : Promise.resolve([]), [fid]);
  const getWashing = useCallback(() => fid ? apiService.getWashingRecords(fid).catch(() => []) : Promise.resolve([]), [fid]);
  const getDryingTables = useCallback(() => fid ? apiService.getDryingTables(fid).catch(() => []) : Promise.resolve([]), [fid]);
  const getActiveDry = useCallback(() => fid ? apiService.getActiveDrying(fid).catch(() => []) : Promise.resolve([]), [fid]);
  const getRatios = useCallback(() => fid ? apiService.getCherryToParchmentRatios(fid, 20).catch(() => []) : Promise.resolve([]), [fid]);
  const getSummary = useCallback(() => fid ? apiService.getFactoryDailySummary(fid).catch(() => null) : Promise.resolve(null), [fid]);

  const { data: intakes, loading: loadingIntakes, refetch: refetchIntakes } = useApi(getIntakes);
  const { data: tanks, loading: loadingTanks, refetch: refetchTanks } = useApi(getTanks);
  const { data: activeFermentations, refetch: refetchFerm } = useApi(getActiveFerm);
  const { data: washingRecords, loading: loadingWashing, refetch: refetchWashing } = useApi(getWashing);
  const { data: dryingTables, loading: loadingDrying, refetch: refetchDryingTables } = useApi(getDryingTables);
  const { data: activeDrying, refetch: refetchActiveDry } = useApi(getActiveDry);
  const { data: ratios, loading: loadingRatios, refetch: refetchRatios } = useApi(getRatios);
  const { data: dailySummary, loading: loadingSummary, refetch: refetchSummary } = useApi(getSummary);

  const refreshAll = () => {
    refetchIntakes(); refetchTanks(); refetchFerm(); refetchWashing();
    refetchDryingTables(); refetchActiveDry(); refetchRatios(); refetchSummary();
  };

  const isLoading = loadingFarms || loadingSummary;
  const clearMessages = () => { setError(null); setSuccess(null); };

  // Action handlers
  const handleRecordIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      await apiService.recordFactoryIntake({
        factory_farm_id: fid,
        source_farm_id: parseInt(intakeForm.source_farm_id || selectedFarmId),
        cherry_weight_kg: parseFloat(intakeForm.cherry_weight_kg),
        debe_count: intakeForm.debe_count ? parseInt(intakeForm.debe_count) : undefined,
        variety: intakeForm.variety || undefined,
        vehicle_number: intakeForm.vehicle_number || undefined,
        delivered_by: intakeForm.delivered_by || undefined,
      });
      setSuccess('Intake recorded successfully!');
      setShowIntakeForm(false);
      setIntakeForm({ source_farm_id: '', cherry_weight_kg: '', debe_count: '', variety: '', vehicle_number: '', delivered_by: '' });
      refreshAll();
    } catch (err: any) { setError(err.message); }
  };

  const handleStartFermentation = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      await apiService.startFermentation({
        factory_farm_id: fid,
        tank_id: parseInt(fermentForm.tank_id),
        intake_ids: fermentForm.intake_ids || undefined,
        pulped_weight_kg: parseFloat(fermentForm.pulped_weight_kg),
      });
      setSuccess('Fermentation started!');
      setShowFermentForm(false);
      setFermentForm({ tank_id: '', intake_ids: '', pulped_weight_kg: '' });
      refreshAll();
    } catch (err: any) { setError(err.message); }
  };

  const handleCompleteFermentation = async (batchId: number) => {
    clearMessages();
    try {
      await apiService.completeFermentation(batchId);
      setSuccess('Fermentation completed!');
      refreshAll();
    } catch (err: any) { setError(err.message); }
  };

  const handleRecordWashing = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      await apiService.recordWashing({
        factory_farm_id: fid,
        fermentation_batch_id: parseInt(washForm.fermentation_batch_id),
        washed_weight_kg: parseFloat(washForm.washed_weight_kg),
        water_usage_litres: washForm.water_usage_litres ? parseFloat(washForm.water_usage_litres) : undefined,
      });
      setSuccess('Washing recorded!');
      setShowWashForm(false);
      setWashForm({ fermentation_batch_id: '', washed_weight_kg: '', water_usage_litres: '' });
      refreshAll();
    } catch (err: any) { setError(err.message); }
  };

  const handleStartDrying = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      await apiService.startDrying({
        factory_farm_id: fid,
        drying_table_id: parseInt(dryingForm.drying_table_id),
        washing_record_id: dryingForm.washing_record_id ? parseInt(dryingForm.washing_record_id) : undefined,
        grade: dryingForm.grade,
        wet_parchment_weight_kg: parseFloat(dryingForm.wet_parchment_weight_kg),
        debe_count: dryingForm.debe_count ? parseInt(dryingForm.debe_count) : undefined,
        variety: dryingForm.variety || undefined,
      });
      setSuccess('Drying started!');
      setShowDryingForm(false);
      setDryingForm({ drying_table_id: '', washing_record_id: '', grade: 'P1', wet_parchment_weight_kg: '', debe_count: '', variety: '' });
      refreshAll();
    } catch (err: any) { setError(err.message); }
  };

  const getRatioColor = (ratio: number) => {
    if (ratio <= 4.5) return 'text-green-600';
    if (ratio <= 5.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  // ======== Render: Overview ========
  const renderOverview = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (!selectedFarmId) {
      return (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Select a farm to view factory data.
          </CardContent>
        </Card>
      );
    }

    const summary = dailySummary as any;

    const stats = [
      { title: 'Cherry Intake', value: `${summary?.total_intake_kg?.toFixed(0) || 0} kg`, subtitle: "Today's intake", icon: Scale, color: 'text-red-600', bg: 'bg-red-500' },
      { title: 'Fermenting', value: summary?.active_fermentations || 0, subtitle: 'Active batches', icon: Thermometer, color: 'text-orange-600', bg: 'bg-orange-500' },
      { title: 'Washed Today', value: `${summary?.washing_today_kg?.toFixed(0) || 0} kg`, subtitle: 'Parchment washed', icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-500' },
      { title: 'Active Drying', value: summary?.active_drying_batches || 0, subtitle: 'On tables/dryers', icon: Sun, color: 'text-yellow-600', bg: 'bg-yellow-500' },
    ];

    return (
      <div className="space-y-6">
        {/* Farm Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium whitespace-nowrap">Factory Farm</Label>
              <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Farm" />
                </SelectTrigger>
                <SelectContent>
                  {(farms as any[] || []).map((f: any) => (
                    <SelectItem key={f.farm_id} value={String(f.farm_id)}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={refreshAll}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-xl`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Fermentation Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Active Fermentations</CardTitle>
              <CardDescription>Tanks currently in use</CardDescription>
            </div>
            <Button variant="link" size="sm" onClick={() => handleTabChange('fermentation')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {!activeFermentations || (activeFermentations as any[]).length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No active fermentations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(activeFermentations as any[]).slice(0, 5).map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border-l-4 border-orange-500">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Batch #{f.id}</span>
                        <Badge variant="secondary">{f.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {f.pulped_weight_kg?.toFixed(1)} kg &bull; Started {new Date(f.start_time).toLocaleString()}
                        {f.fermentation_hours ? ` \u2022 ${f.fermentation_hours?.toFixed(1)}h` : ''}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleCompleteFermentation(f.id)}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Drying Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Active Drying</CardTitle>
              <CardDescription>Coffee currently on drying tables</CardDescription>
            </div>
            <Button variant="link" size="sm" onClick={() => handleTabChange('drying')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {!activeDrying || (activeDrying as any[]).length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No active drying batches</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(activeDrying as any[]).slice(0, 5).map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{d.origin_label || `Batch #${d.id}`}</span>
                        <Badge>{d.grade}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {d.wet_parchment_weight_kg?.toFixed(1)} kg &bull; Moisture: {d.current_moisture_pct || '-'}%
                      </p>
                    </div>
                    <Badge variant="secondary">{d.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ======== Render: Intake ========
  const renderIntake = () => {
    if (!selectedFarmId) {
      return <Card><CardContent className="p-8 text-center text-muted-foreground">Select a farm first.</CardContent></Card>;
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Cherry Intake (Hopper)</CardTitle>
              <CardDescription>Record cherry deliveries to the factory</CardDescription>
            </div>
            <Button onClick={() => setShowIntakeForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Record Intake
            </Button>
          </CardHeader>
          <CardContent>
            {loadingIntakes ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
            ) : !intakes || (intakes as any[]).length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No intakes recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(intakes as any[]).slice(0, 20).map((r: any) => (
                  <div key={r.id} className="bg-muted/50 p-4 rounded-lg border-l-4 border-red-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-red-100 text-red-600">Intake</Badge>
                          <span className="text-sm font-medium">{r.cherry_weight_kg?.toFixed(1)} kg</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          <div><span className="font-medium">Date:</span> {new Date(r.intake_date || r.created_at).toLocaleDateString()}</div>
                          <div><span className="font-medium">Debe:</span> {r.debe_count || '-'}</div>
                          <div><span className="font-medium">Variety:</span> {r.variety || '-'}</div>
                          <div><span className="font-medium">Vehicle:</span> {r.vehicle_number || '-'}</div>
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
  };

  // ======== Render: Fermentation ========
  const renderFermentation = () => {
    if (!selectedFarmId) {
      return <Card><CardContent className="p-8 text-center text-muted-foreground">Select a farm first.</CardContent></Card>;
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Fermentation Tanks</CardTitle>
              <CardDescription>Manage fermentation batches (10-12 hours)</CardDescription>
            </div>
            <Button onClick={() => setShowFermentForm(true)}>
              <Play className="h-4 w-4 mr-2" /> Start Fermentation
            </Button>
          </CardHeader>
          <CardContent>
            {loadingTanks ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
            ) : (
              <>
                {/* Tank Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {(tanks as any[] || []).map((t: any) => (
                    <Card key={t.id} className={`hover:shadow-lg transition-shadow ${t.current_batch ? 'border-l-4 border-orange-500' : 'border-l-4 border-green-500'}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold">{t.tank_name}</span>
                          <Badge variant={t.current_batch ? 'default' : 'secondary'}>
                            {t.current_batch ? 'In Use' : 'Available'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Capacity: {t.capacity_kg} kg</p>
                        {t.current_batch && (
                          <div className="mt-3 pt-3 border-t space-y-1 text-sm">
                            <p><span className="text-muted-foreground">Weight:</span> <span className="font-medium">{t.current_batch.pulped_weight_kg} kg</span></p>
                            <p><span className="text-muted-foreground">Started:</span> <span className="font-medium">{new Date(t.current_batch.start_time).toLocaleString()}</span></p>
                            <Button size="sm" className="mt-2 w-full" onClick={() => handleCompleteFermentation(t.current_batch.id)}>
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Active Batches List */}
                {(activeFermentations as any[] || []).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Active Batches</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(activeFermentations as any[]).map((f: any) => (
                          <div key={f.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium">Batch #{f.id} &bull; {f.tank_name || `Tank #${f.tank_id}`}</h4>
                              <p className="text-sm text-muted-foreground">
                                {f.pulped_weight_kg?.toFixed(1)} kg &bull; {f.fermentation_hours?.toFixed(1) || '-'}h
                              </p>
                            </div>
                            <Badge variant={f.status === 'fermenting' ? 'default' : 'secondary'}>{f.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ======== Render: Washing ========
  const renderWashing = () => {
    if (!selectedFarmId) {
      return <Card><CardContent className="p-8 text-center text-muted-foreground">Select a farm first.</CardContent></Card>;
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Washing Records</CardTitle>
              <CardDescription>Post-fermentation washing operations</CardDescription>
            </div>
            <Button onClick={() => setShowWashForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Record Washing
            </Button>
          </CardHeader>
          <CardContent>
            {loadingWashing ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
            ) : !washingRecords || (washingRecords as any[]).length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No washing records yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(washingRecords as any[]).slice(0, 20).map((w: any) => (
                  <div key={w.id} className="bg-muted/50 p-4 rounded-lg border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-blue-100 text-blue-600">Washed</Badge>
                          <span className="text-sm font-medium">{w.washed_weight_kg?.toFixed(1)} kg</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div><span className="font-medium">Batch:</span> #{w.fermentation_batch_id}</div>
                          <div><span className="font-medium">Water:</span> {w.water_usage_litres || '-'} L</div>
                          <div><span className="font-medium">Date:</span> {new Date(w.washing_date || w.created_at).toLocaleDateString()}</div>
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
  };

  // ======== Render: Drying ========
  const renderDrying = () => {
    if (!selectedFarmId) {
      return <Card><CardContent className="p-8 text-center text-muted-foreground">Select a farm first.</CardContent></Card>;
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Drying Tables</CardTitle>
              <CardDescription>Manage parchment coffee drying</CardDescription>
            </div>
            <Button onClick={() => setShowDryingForm(true)}>
              <Sun className="h-4 w-4 mr-2" /> Start Drying
            </Button>
          </CardHeader>
          <CardContent>
            {loadingDrying ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
            ) : (
              <>
                {/* Table Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {(dryingTables as any[] || []).map((dt: any) => (
                    <Card key={dt.id} className={`hover:shadow-lg transition-shadow ${dt.active_batch ? 'border-l-4 border-yellow-500' : 'border-l-4 border-green-500'}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-sm">{dt.table_name}</span>
                          <Badge variant={dt.active_batch ? 'default' : 'secondary'} className="text-xs">
                            {dt.active_batch ? dt.active_batch.grade : 'Empty'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{dt.table_type} &bull; {dt.capacity_kg} kg</p>
                        {dt.active_batch && (
                          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                            <p>{dt.active_batch.wet_parchment_weight_kg} kg &bull; {dt.active_batch.origin_label || ''}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Active Drying List */}
                {(activeDrying as any[] || []).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Active Drying Batches</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(activeDrying as any[]).map((d: any) => (
                          <div key={d.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{d.origin_label || `Batch #${d.id}`}</h4>
                                <Badge>{d.grade}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {d.wet_parchment_weight_kg?.toFixed(1)} kg &bull; Moisture: {d.current_moisture_pct || '-'}%
                              </p>
                            </div>
                            <Badge variant="secondary">{d.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ======== Render: Ratios ========
  const renderRatios = () => {
    if (!selectedFarmId) {
      return <Card><CardContent className="p-8 text-center text-muted-foreground">Select a farm first.</CardContent></Card>;
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Cherry-to-Parchment Ratios
            </CardTitle>
            <CardDescription>Processing efficiency tracking</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Target Range: 4.3 (excellent) to 5.3 (less excellent)</p>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Below 4.5 = Excellent</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> 4.5 - 5.0 = Good</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Above 5.0 = Needs attention</span>
              </div>
            </div>

            {loadingRatios ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
            ) : !ratios || (ratios as any[]).length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No ratio data yet. Complete drying batches with cherry origin data to see ratios.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(ratios as any[]).map((r: any) => {
                  const ratioVal = r.ratio || r.cherry_to_parchment_ratio || 0;
                  return (
                    <div key={r.batch_id || r.id} className="bg-muted/50 p-4 rounded-lg border-l-4"
                      style={{ borderLeftColor: ratioVal <= 4.5 ? '#22c55e' : ratioVal <= 5.0 ? '#eab308' : '#ef4444' }}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>{r.grade}</Badge>
                            <span className="text-sm font-medium">{r.origin_label || `Batch #${r.batch_id || r.id}`}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                            <div><span className="font-medium">Cherry:</span> {(r.cherry_kg || r.original_cherry_kg)?.toFixed(0)} kg</div>
                            <div><span className="font-medium">Parchment:</span> {(r.parchment_kg || r.dry_parchment_weight_kg)?.toFixed(0)} kg</div>
                            <div>
                              <span className="font-medium">Ratio: </span>
                              <span className={`font-bold ${getRatioColor(ratioVal)}`}>{ratioVal.toFixed(2)}</span>
                            </div>
                            <div><span className="font-medium">Date:</span> {r.completed_at ? new Date(r.completed_at).toLocaleDateString() : '-'}</div>
                          </div>
                        </div>
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
  };

  // ======== Page title ========
  const getTitle = () => {
    const titles: Record<string, string> = {
      overview: 'Factory Overview',
      intake: 'Cherry Intake',
      fermentation: 'Fermentation',
      washing: 'Washing',
      drying: 'Drying',
      ratios: 'Ratios',
    };
    return titles[activeTab] || 'Factory Processing';
  };

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLogout={onLogout}
        sidebarItems={FACTORY_NAV_ITEMS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        title={getTitle()}
      >
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}

        {/* Keep tabs mounted but hidden to preserve data */}
        <div className={activeTab === 'overview' ? '' : 'hidden'}>
          {mountedTabs.has('overview') && renderOverview()}
        </div>
        <div className={activeTab === 'intake' ? '' : 'hidden'}>
          {mountedTabs.has('intake') && renderIntake()}
        </div>
        <div className={activeTab === 'fermentation' ? '' : 'hidden'}>
          {mountedTabs.has('fermentation') && renderFermentation()}
        </div>
        <div className={activeTab === 'washing' ? '' : 'hidden'}>
          {mountedTabs.has('washing') && renderWashing()}
        </div>
        <div className={activeTab === 'drying' ? '' : 'hidden'}>
          {mountedTabs.has('drying') && renderDrying()}
        </div>
        <div className={activeTab === 'ratios' ? '' : 'hidden'}>
          {mountedTabs.has('ratios') && renderRatios()}
        </div>

        {/* ========== DIALOGS ========== */}

        {/* Intake Dialog */}
        <Dialog open={showIntakeForm} onOpenChange={setShowIntakeForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Cherry Intake</DialogTitle></DialogHeader>
            <form onSubmit={handleRecordIntake} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cherry Weight (kg) *</Label>
                  <Input type="number" step="0.1" value={intakeForm.cherry_weight_kg}
                    onChange={(e) => setIntakeForm({ ...intakeForm, cherry_weight_kg: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Debe Count</Label>
                  <Input type="number" value={intakeForm.debe_count}
                    onChange={(e) => setIntakeForm({ ...intakeForm, debe_count: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Variety</Label>
                  <Input value={intakeForm.variety}
                    onChange={(e) => setIntakeForm({ ...intakeForm, variety: e.target.value })} placeholder="e.g. Bourbon" />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Number</Label>
                  <Input value={intakeForm.vehicle_number}
                    onChange={(e) => setIntakeForm({ ...intakeForm, vehicle_number: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowIntakeForm(false)}>Cancel</Button>
                <Button type="submit">Record Intake</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Fermentation Dialog */}
        <Dialog open={showFermentForm} onOpenChange={setShowFermentForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>Start Fermentation</DialogTitle></DialogHeader>
            <form onSubmit={handleStartFermentation} className="space-y-4">
              <div className="space-y-2">
                <Label>Tank *</Label>
                <Select value={fermentForm.tank_id}
                  onValueChange={(v) => setFermentForm({ ...fermentForm, tank_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select tank..." /></SelectTrigger>
                  <SelectContent>
                    {(tanks as any[] || []).filter((t: any) => !t.current_batch).map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.tank_name} ({t.capacity_kg} kg)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pulped Weight (kg) *</Label>
                <Input type="number" step="0.1" value={fermentForm.pulped_weight_kg}
                  onChange={(e) => setFermentForm({ ...fermentForm, pulped_weight_kg: e.target.value })} required />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowFermentForm(false)}>Cancel</Button>
                <Button type="submit"><Play className="h-4 w-4 mr-2" />Start</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Washing Dialog */}
        <Dialog open={showWashForm} onOpenChange={setShowWashForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Washing</DialogTitle></DialogHeader>
            <form onSubmit={handleRecordWashing} className="space-y-4">
              <div className="space-y-2">
                <Label>Fermentation Batch ID *</Label>
                <Input type="number" value={washForm.fermentation_batch_id}
                  onChange={(e) => setWashForm({ ...washForm, fermentation_batch_id: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Washed Weight (kg) *</Label>
                  <Input type="number" step="0.1" value={washForm.washed_weight_kg}
                    onChange={(e) => setWashForm({ ...washForm, washed_weight_kg: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Water Usage (L)</Label>
                  <Input type="number" step="0.1" value={washForm.water_usage_litres}
                    onChange={(e) => setWashForm({ ...washForm, water_usage_litres: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowWashForm(false)}>Cancel</Button>
                <Button type="submit">Record Washing</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Drying Dialog */}
        <Dialog open={showDryingForm} onOpenChange={setShowDryingForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>Start Drying</DialogTitle></DialogHeader>
            <form onSubmit={handleStartDrying} className="space-y-4">
              <div className="space-y-2">
                <Label>Drying Table *</Label>
                <Select value={dryingForm.drying_table_id}
                  onValueChange={(v) => setDryingForm({ ...dryingForm, drying_table_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select table..." /></SelectTrigger>
                  <SelectContent>
                    {(dryingTables as any[] || []).filter((dt: any) => !dt.active_batch).map((dt: any) => (
                      <SelectItem key={dt.id} value={String(dt.id)}>{dt.table_name} ({dt.table_type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grade *</Label>
                  <Select value={dryingForm.grade}
                    onValueChange={(v) => setDryingForm({ ...dryingForm, grade: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P1">P1</SelectItem>
                      <SelectItem value="P2">P2</SelectItem>
                      <SelectItem value="P3">P3</SelectItem>
                      <SelectItem value="mbuni">Mbuni</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Wet Parchment (kg) *</Label>
                  <Input type="number" step="0.1" value={dryingForm.wet_parchment_weight_kg}
                    onChange={(e) => setDryingForm({ ...dryingForm, wet_parchment_weight_kg: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Variety</Label>
                <Input value={dryingForm.variety}
                  onChange={(e) => setDryingForm({ ...dryingForm, variety: e.target.value })} placeholder="e.g. Bourbon" />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowDryingForm(false)}>Cancel</Button>
                <Button type="submit"><Sun className="h-4 w-4 mr-2" />Start Drying</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </Layout>
    </ErrorBoundary>
  );
};

export default FactorySupervisorDashboard;
