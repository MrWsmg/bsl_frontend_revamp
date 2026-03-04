"use client";

// Godown Manager Dashboard - matches Layout/sidebar pattern
import React, { useState, useCallback } from 'react';
import {
  Warehouse, Package, ArrowDownToLine, ArrowUpFromLine, Blend,
  ClipboardList, BarChart3, RefreshCw, Plus, Play, CheckCircle2,
  LayoutDashboard, Search, Truck, Factory,
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

const GODOWN_NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  {
    id: 'operations',
    label: 'Operations',
    icon: Warehouse,
    children: [
      { id: 'receive', label: 'Receive Coffee', icon: ArrowDownToLine },
      { id: 'issue', label: 'Issue Coffee', icon: ArrowUpFromLine },
      { id: 'mixing', label: 'Pile Mixing', icon: Blend },
    ],
  },
  { id: 'piles', label: 'Piles', icon: Package },
  { id: 'milling', label: 'Milling', icon: Factory },
  { id: 'history', label: 'History', icon: ClipboardList },
  { id: 'traceability', label: 'Traceability', icon: Search },
];

interface GodownManagerDashboardProps {
  user: User;
  onLogout: () => void;
}

export const GodownManagerDashboard: React.FC<GodownManagerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set(['overview']));
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialogs
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showMixForm, setShowMixForm] = useState(false);
  const [showMillingForm, setShowMillingForm] = useState(false);
  const [showTraceForm, setShowTraceForm] = useState(false);

  // Forms
  const [receiveForm, setReceiveForm] = useState({
    grade: 'P1', origin_label: '', variety: '', weight_in_kg: '',
    bag_count: '', pile_identifier: '', notes: '',
  });
  const [issueForm, setIssueForm] = useState({
    pile_identifier: '', weight_out_kg: '', bag_count: '', reason: 'milling',
  });
  const [mixForm, setMixForm] = useState({
    source_pile_ids: '', new_grade: 'P1', mix_reason: '',
  });
  const [millingForm, setMillingForm] = useState({
    godown_pile_ids: '', transport_method: '', vehicle_number: '',
    parchment_weight_in_kg: '', milling_machine: '',
  });
  const [millingCompleteForm, setMillingCompleteForm] = useState({
    batch_id: '', green_bean_weight_kg: '', total_bags: '',
  });
  const [traceForm, setTraceForm] = useState({
    direction: 'backward', entity_type: 'godown_pile', entity_id: '',
  });
  const [traceResult, setTraceResult] = useState<any>(null);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMountedTabs(prev => new Set(prev).add(tabId));
  };

  // Data fetching
  const getFarms = useCallback(() => apiService.getFarms(user.role), [user.role]);
  const { data: farms, loading: loadingFarms } = useApi(getFarms);

  React.useEffect(() => {
    if (farms?.length && !selectedFarmId) {
      setSelectedFarmId(String((farms as any[])[0].farm_id));
    }
  }, [farms, selectedFarmId]);

  const fid = selectedFarmId ? parseInt(selectedFarmId) : 0;

  const getInventory = useCallback(() => fid ? apiService.getGodownInventory(fid).catch(() => null) : Promise.resolve(null), [fid]);
  const getPiles = useCallback(() => fid ? apiService.getGodownPiles(fid).catch(() => []) : Promise.resolve([]), [fid]);
  const getDailyStock = useCallback(() => fid ? apiService.getGodownDailyStock(fid).catch(() => []) : Promise.resolve([]), [fid]);
  const getHistory = useCallback(() => fid ? apiService.getGodownHistory(fid, 100).catch(() => []) : Promise.resolve([]), [fid]);
  const getMillingBatches = useCallback(() => fid ? apiService.getMillingBatches(fid).catch(() => []) : Promise.resolve([]), [fid]);

  const { data: inventory, loading: loadingInventory, refetch: refetchInventory } = useApi(getInventory);
  const { data: piles, loading: loadingPiles, refetch: refetchPiles } = useApi(getPiles);
  const { data: dailyStock, loading: loadingStock, refetch: refetchStock } = useApi(getDailyStock);
  const { data: history, loading: loadingHistory, refetch: refetchHistory } = useApi(getHistory);
  const { data: millingBatches, loading: loadingMilling, refetch: refetchMilling } = useApi(getMillingBatches);

  const refreshAll = () => {
    refetchInventory(); refetchPiles(); refetchStock(); refetchHistory(); refetchMilling();
  };

  const isLoading = loadingFarms || loadingInventory;
  const clearMessages = () => { setError(null); setSuccess(null); };

  // ======== Action Handlers ========

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      await apiService.receiveFromDrying({
        godown_farm_id: fid,
        grade: receiveForm.grade,
        origin_label: receiveForm.origin_label || undefined,
        variety: receiveForm.variety || undefined,
        weight_in_kg: parseFloat(receiveForm.weight_in_kg),
        bag_count: receiveForm.bag_count ? parseInt(receiveForm.bag_count) : undefined,
        pile_identifier: receiveForm.pile_identifier || undefined,
        notes: receiveForm.notes || undefined,
      });
      setSuccess('Coffee received into godown!');
      setShowReceiveForm(false);
      setReceiveForm({ grade: 'P1', origin_label: '', variety: '', weight_in_kg: '', bag_count: '', pile_identifier: '', notes: '' });
      refreshAll();
    } catch (err: any) { setError(err.message); }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      await apiService.issueFromGodown({
        godown_farm_id: fid,
        pile_identifier: issueForm.pile_identifier,
        weight_out_kg: parseFloat(issueForm.weight_out_kg),
        bag_count: issueForm.bag_count ? parseInt(issueForm.bag_count) : undefined,
        reason: issueForm.reason,
      });
      setSuccess('Coffee issued from godown!');
      setShowIssueForm(false);
      setIssueForm({ pile_identifier: '', weight_out_kg: '', bag_count: '', reason: 'milling' });
      refreshAll();
    } catch (err: any) { setError(err.message); }
  };

  const handleMix = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      const sourceIds = mixForm.source_pile_ids.split(',').map(s => s.trim()).filter(Boolean);
      await apiService.createBulkMix({
        godown_farm_id: fid,
        source_pile_ids: sourceIds,
        new_grade: mixForm.new_grade,
        mix_reason: mixForm.mix_reason || undefined,
      });
      setSuccess('Piles mixed successfully!');
      setShowMixForm(false);
      setMixForm({ source_pile_ids: '', new_grade: 'P1', mix_reason: '' });
      refreshAll();
    } catch (err: any) { setError(err.message); }
  };

  const handleCreateMillingBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      const pileIds = millingForm.godown_pile_ids.split(',').map(s => s.trim()).filter(Boolean);
      await apiService.createMillingBatch({
        factory_farm_id: fid,
        godown_pile_ids: pileIds,
        transport_method: millingForm.transport_method || undefined,
        vehicle_number: millingForm.vehicle_number || undefined,
        parchment_weight_in_kg: parseFloat(millingForm.parchment_weight_in_kg),
        milling_machine: millingForm.milling_machine || undefined,
      });
      setSuccess('Milling batch created!');
      setShowMillingForm(false);
      setMillingForm({ godown_pile_ids: '', transport_method: '', vehicle_number: '', parchment_weight_in_kg: '', milling_machine: '' });
      refetchMilling();
    } catch (err: any) { setError(err.message); }
  };

  const handleStartMilling = async (batchId: number) => {
    clearMessages();
    try {
      await apiService.startMilling(batchId);
      setSuccess('Milling started!');
      refetchMilling();
    } catch (err: any) { setError(err.message); }
  };

  const handleCompleteMilling = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      await apiService.completeMilling(parseInt(millingCompleteForm.batch_id), {
        green_bean_weight_kg: parseFloat(millingCompleteForm.green_bean_weight_kg),
        total_bags: millingCompleteForm.total_bags ? parseInt(millingCompleteForm.total_bags) : undefined,
      });
      setSuccess('Milling completed!');
      setMillingCompleteForm({ batch_id: '', green_bean_weight_kg: '', total_bags: '' });
      refetchMilling();
    } catch (err: any) { setError(err.message); }
  };

  const handleRecordDailyStock = async () => {
    clearMessages();
    try {
      await apiService.recordGodownDailyStock(fid);
      setSuccess('Daily stock snapshot recorded!');
      refetchStock();
    } catch (err: any) { setError(err.message); }
  };

  const handleTrace = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setTraceResult(null);
    try {
      const id = parseInt(traceForm.entity_id);
      let result;
      if (traceForm.direction === 'forward') {
        result = await apiService.traceForward(traceForm.entity_type, id);
      } else {
        result = await apiService.traceBackward(traceForm.entity_type, id);
      }
      setTraceResult(result);
    } catch (err: any) { setError(err.message); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'depleted': return 'bg-gray-100 text-gray-600';
      case 'mixed': return 'bg-purple-100 text-purple-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'milling': return 'bg-yellow-100 text-yellow-700';
      case 'pending': return 'bg-blue-100 text-blue-700';
      case 'in_transit': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case 'P1': return 'border-green-500';
      case 'P2': return 'border-blue-500';
      case 'P3': return 'border-yellow-500';
      default: return 'border-orange-500';
    }
  };

  // ======== Render: Overview ========
  const renderOverview = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center py-12"><LoadingSpinner size="lg" /></div>;
    }
    if (!selectedFarmId) {
      return <Card><CardContent className="p-8 text-center text-muted-foreground">Select a farm to view godown data.</CardContent></Card>;
    }

    const inv = inventory as any;
    const byGrade = inv?.by_grade || {};
    const grades = ['P1', 'P2', 'P3', 'mbuni'];

    return (
      <div className="space-y-6">
        {/* Farm Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium whitespace-nowrap">Godown Farm</Label>
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
              <Button variant="outline" size="sm" onClick={handleRecordDailyStock}>
                <ClipboardList className="h-4 w-4 mr-2" /> Snapshot
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}

        {/* Inventory Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Stock</p>
                  <p className="text-3xl font-bold mt-1 text-emerald-600">{inv?.total_weight_kg?.toFixed(0) || 0} kg</p>
                  <p className="text-xs text-muted-foreground mt-1">{inv?.total_bags || 0} bags</p>
                </div>
                <div className="bg-emerald-500 p-3 rounded-xl">
                  <Warehouse className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          {grades.map(g => {
            const gradeData = byGrade[g] || byGrade[g.toUpperCase()] || {};
            return (
              <Card key={g} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">{g.toUpperCase()}</p>
                  <p className="text-2xl font-bold mt-1">{gradeData.weight_kg?.toFixed(0) || 0} kg</p>
                  <p className="text-xs text-muted-foreground">{gradeData.bags || 0} bags &bull; {gradeData.piles || 0} piles</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Active Piles Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Active Piles</CardTitle>
              <CardDescription>Current coffee piles in godown</CardDescription>
            </div>
            <Button variant="link" size="sm" onClick={() => handleTabChange('piles')}>View All</Button>
          </CardHeader>
          <CardContent>
            {!piles || (piles as any[]).filter((p: any) => p.status === 'active').length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No active piles</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(piles as any[]).filter((p: any) => p.status === 'active').slice(0, 6).map((p: any) => (
                  <div key={p.id} className={`flex items-center justify-between p-3 bg-muted/50 rounded-lg border-l-4 ${getGradeColor(p.grade)}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{p.pile_identifier}</span>
                        <Badge>{p.grade}</Badge>
                        {p.is_mixed && <Badge variant="secondary">Mixed</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {p.current_weight_kg?.toFixed(1)} kg &bull; {p.bag_count} bags
                        {p.variety ? ` \u2022 ${p.variety}` : ''}
                      </p>
                    </div>
                    <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Daily Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Daily Stock Snapshots</CardTitle>
              <CardDescription>Historical stock records</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStock ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
            ) : !dailyStock || (dailyStock as any[]).length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No stock snapshots yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Date</th>
                      <th className="text-right py-2 px-3 font-medium">P1</th>
                      <th className="text-right py-2 px-3 font-medium">P2</th>
                      <th className="text-right py-2 px-3 font-medium">P3</th>
                      <th className="text-right py-2 px-3 font-medium">Mbuni</th>
                      <th className="text-right py-2 px-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dailyStock as any[]).slice(0, 10).map((s: any) => (
                      <tr key={s.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">{new Date(s.date).toLocaleDateString()}</td>
                        <td className="text-right py-2 px-3">{s.p1_weight_kg?.toFixed(0)}</td>
                        <td className="text-right py-2 px-3">{s.p2_weight_kg?.toFixed(0)}</td>
                        <td className="text-right py-2 px-3">{s.p3_weight_kg?.toFixed(0)}</td>
                        <td className="text-right py-2 px-3">{s.mbuni_weight_kg?.toFixed(0)}</td>
                        <td className="text-right py-2 px-3 font-medium">{s.total_weight_kg?.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ======== Render: Receive ========
  const renderReceive = () => {
    if (!selectedFarmId) {
      return <Card><CardContent className="p-8 text-center text-muted-foreground">Select a farm first.</CardContent></Card>;
    }

    const recentReceipts = (history as any[] || []).filter((h: any) => h.transaction_type === 'receipt');

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Receive Coffee</CardTitle>
              <CardDescription>Receive dried parchment from factory into godown</CardDescription>
            </div>
            <Button onClick={() => setShowReceiveForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Receive Coffee
            </Button>
          </CardHeader>
          <CardContent>
            {recentReceipts.length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No receipts recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReceipts.slice(0, 20).map((r: any) => (
                  <div key={r.id} className={`bg-muted/50 p-4 rounded-lg border-l-4 ${getGradeColor(r.grade)}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-green-100 text-green-600">Receipt</Badge>
                          <Badge>{r.grade}</Badge>
                          <span className="text-sm font-medium">{r.weight_in_kg?.toFixed(1)} kg</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          <div><span className="font-medium">Pile:</span> {r.pile_identifier || '-'}</div>
                          <div><span className="font-medium">Bags:</span> {r.bag_count || '-'}</div>
                          <div><span className="font-medium">Origin:</span> {r.origin_label || '-'}</div>
                          <div><span className="font-medium">Date:</span> {new Date(r.transaction_date || r.created_at).toLocaleDateString()}</div>
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

  // ======== Render: Issue ========
  const renderIssue = () => {
    if (!selectedFarmId) {
      return <Card><CardContent className="p-8 text-center text-muted-foreground">Select a farm first.</CardContent></Card>;
    }

    const recentIssues = (history as any[] || []).filter((h: any) => h.transaction_type === 'issue');
    const activePiles = (piles as any[] || []).filter((p: any) => p.status === 'active');

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Issue Coffee</CardTitle>
              <CardDescription>Issue parchment for milling or sale</CardDescription>
            </div>
            <Button onClick={() => setShowIssueForm(true)}>
              <ArrowUpFromLine className="h-4 w-4 mr-2" /> Issue Coffee
            </Button>
          </CardHeader>
          <CardContent>
            {/* Available Piles */}
            {activePiles.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3">Available Piles</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activePiles.slice(0, 9).map((p: any) => (
                    <div key={p.id} className={`p-3 bg-muted/50 rounded-lg border-l-4 ${getGradeColor(p.grade)}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">{p.pile_identifier}</span>
                        <Badge variant="secondary">{p.grade}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.current_weight_kg?.toFixed(1)} kg &bull; {p.bag_count} bags</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Issues */}
            {recentIssues.length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No issues recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentIssues.slice(0, 20).map((r: any) => (
                  <div key={r.id} className="bg-muted/50 p-4 rounded-lg border-l-4 border-red-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-red-100 text-red-600">Issue</Badge>
                      <Badge>{r.grade}</Badge>
                      <span className="text-sm font-medium">{r.weight_out_kg?.toFixed(1)} kg</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div><span className="font-medium">Pile:</span> {r.pile_identifier || '-'}</div>
                      <div><span className="font-medium">Reason:</span> {r.notes || '-'}</div>
                      <div><span className="font-medium">Date:</span> {new Date(r.transaction_date || r.created_at).toLocaleDateString()}</div>
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

  // ======== Render: Mixing ========
  const renderMixing = () => {
    if (!selectedFarmId) {
      return <Card><CardContent className="p-8 text-center text-muted-foreground">Select a farm first.</CardContent></Card>;
    }

    const activePiles = (piles as any[] || []).filter((p: any) => p.status === 'active');
    const mixedPiles = (piles as any[] || []).filter((p: any) => p.is_mixed);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pile Mixing</CardTitle>
              <CardDescription>Combine multiple piles into a new mixed pile</CardDescription>
            </div>
            <Button onClick={() => setShowMixForm(true)}>
              <Blend className="h-4 w-4 mr-2" /> Mix Piles
            </Button>
          </CardHeader>
          <CardContent>
            {/* Active Piles for selection */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3">Available Piles for Mixing</h4>
              {activePiles.length === 0 ? (
                <div className="text-center py-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">No active piles to mix</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activePiles.map((p: any) => (
                    <div key={p.id} className={`p-3 bg-muted/50 rounded-lg border-l-4 ${getGradeColor(p.grade)}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">{p.pile_identifier}</span>
                        <Badge variant="secondary">{p.grade}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.current_weight_kg?.toFixed(1)} kg &bull; {p.variety || 'Mixed'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mixed Piles */}
            {mixedPiles.length > 0 && (
              <>
                <h4 className="text-sm font-medium mb-3">Previously Mixed Piles</h4>
                <div className="space-y-3">
                  {mixedPiles.map((p: any) => (
                    <div key={p.id} className="bg-muted/50 p-4 rounded-lg border-l-4 border-purple-500">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-purple-100 text-purple-600">Mixed</Badge>
                        <Badge>{p.grade}</Badge>
                        <span className="font-medium">{p.pile_identifier}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div><span className="font-medium">Weight:</span> {p.current_weight_kg?.toFixed(1)} kg</div>
                        <div><span className="font-medium">Bags:</span> {p.bag_count}</div>
                        <div><span className="font-medium">Reason:</span> {p.mix_reason || '-'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ======== Render: Piles ========
  const renderPiles = () => {
    if (!selectedFarmId) {
      return <Card><CardContent className="p-8 text-center text-muted-foreground">Select a farm first.</CardContent></Card>;
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All Piles</CardTitle>
              <CardDescription>Complete pile inventory</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={refetchPiles}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {loadingPiles ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
            ) : !piles || (piles as any[]).length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No piles found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(piles as any[]).map((p: any) => (
                  <div key={p.id} className={`bg-muted/50 p-4 rounded-lg border-l-4 ${getGradeColor(p.grade)}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{p.pile_identifier}</span>
                          <Badge>{p.grade}</Badge>
                          {p.is_mixed && <Badge variant="secondary">Mixed</Badge>}
                          <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          <div><span className="font-medium">Weight:</span> {p.current_weight_kg?.toFixed(1)} kg</div>
                          <div><span className="font-medium">Bags:</span> {p.bag_count}</div>
                          <div><span className="font-medium">Variety:</span> {p.variety || '-'}</div>
                          <div><span className="font-medium">Created:</span> {new Date(p.created_at).toLocaleDateString()}</div>
                        </div>
                        {p.origin_details && (
                          <p className="text-xs text-muted-foreground mt-1">Origin: {p.origin_details}</p>
                        )}
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

  // ======== Render: Milling ========
  const renderMilling = () => {
    if (!selectedFarmId) {
      return <Card><CardContent className="p-8 text-center text-muted-foreground">Select a farm first.</CardContent></Card>;
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Milling Batches</CardTitle>
              <CardDescription>Track parchment to green bean conversion</CardDescription>
            </div>
            <Button onClick={() => setShowMillingForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Batch
            </Button>
          </CardHeader>
          <CardContent>
            {loadingMilling ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
            ) : !millingBatches || (millingBatches as any[]).length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No milling batches yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(millingBatches as any[]).map((b: any) => (
                  <div key={b.id} className="bg-muted/50 p-4 rounded-lg border-l-4 border-amber-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold">{b.batch_number}</span>
                          <Badge className={getStatusColor(b.status)}>{b.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          <div><span className="font-medium">Parchment:</span> {b.parchment_weight_in_kg?.toFixed(1)} kg</div>
                          <div><span className="font-medium">Green Bean:</span> {b.green_bean_weight_kg?.toFixed(1) || '-'} kg</div>
                          <div><span className="font-medium">Ratio:</span> {b.parchment_to_green_ratio?.toFixed(2) || '-'}</div>
                          <div><span className="font-medium">Loss:</span> {b.milling_loss_kg?.toFixed(1) || '-'} kg</div>
                        </div>
                        {b.transport_method && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Truck className="inline h-3 w-3 mr-1" />
                            {b.transport_method} {b.vehicle_number ? `- ${b.vehicle_number}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {b.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => handleStartMilling(b.id)}>
                            <Play className="h-3 w-3 mr-1" /> Start
                          </Button>
                        )}
                        {b.status === 'milling' && (
                          <Button size="sm" variant="outline" onClick={() => setMillingCompleteForm({ ...millingCompleteForm, batch_id: String(b.id) })}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Complete Milling Form (inline) */}
        {millingCompleteForm.batch_id && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Complete Milling Batch #{millingCompleteForm.batch_id}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompleteMilling} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Green Bean Weight (kg) *</Label>
                    <Input type="number" step="0.1" value={millingCompleteForm.green_bean_weight_kg}
                      onChange={(e) => setMillingCompleteForm({ ...millingCompleteForm, green_bean_weight_kg: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Bags</Label>
                    <Input type="number" value={millingCompleteForm.total_bags}
                      onChange={(e) => setMillingCompleteForm({ ...millingCompleteForm, total_bags: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit"><CheckCircle2 className="h-4 w-4 mr-2" /> Complete Milling</Button>
                  <Button type="button" variant="outline" onClick={() => setMillingCompleteForm({ batch_id: '', green_bean_weight_kg: '', total_bags: '' })}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // ======== Render: History ========
  const renderHistory = () => {
    if (!selectedFarmId) {
      return <Card><CardContent className="p-8 text-center text-muted-foreground">Select a farm first.</CardContent></Card>;
    }

    const typeColors: Record<string, string> = {
      receipt: 'bg-green-100 text-green-600',
      issue: 'bg-red-100 text-red-600',
      transfer: 'bg-blue-100 text-blue-600',
      bulk_mix: 'bg-purple-100 text-purple-600',
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>CARDEX-style godown transactions</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={refetchHistory}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
            ) : !history || (history as any[]).length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(history as any[]).map((h: any) => (
                  <div key={h.id} className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={typeColors[h.transaction_type] || 'bg-gray-100 text-gray-600'}>
                            {h.transaction_type}
                          </Badge>
                          <Badge>{h.grade}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(h.transaction_date || h.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          {h.weight_in_kg && <div><span className="font-medium text-green-600">In:</span> {h.weight_in_kg?.toFixed(1)} kg</div>}
                          {h.weight_out_kg && <div><span className="font-medium text-red-600">Out:</span> {h.weight_out_kg?.toFixed(1)} kg</div>}
                          <div><span className="font-medium">Balance:</span> {h.running_balance_kg?.toFixed(1)} kg</div>
                          <div><span className="font-medium">Pile:</span> {h.pile_identifier || '-'}</div>
                        </div>
                        {h.notes && <p className="text-xs text-muted-foreground mt-1">{h.notes}</p>}
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

  // ======== Render: Traceability ========
  const renderTraceability = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" /> Coffee Traceability
            </CardTitle>
            <CardDescription>Trace coffee from field to cup or investigate complaints</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrace} className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Direction</Label>
                  <Select value={traceForm.direction}
                    onValueChange={(v) => setTraceForm({ ...traceForm, direction: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forward">Forward (Source → Product)</SelectItem>
                      <SelectItem value="backward">Backward (Product → Source)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Entity Type</Label>
                  <Select value={traceForm.entity_type}
                    onValueChange={(v) => setTraceForm({ ...traceForm, entity_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="picking_session">Picking Session</SelectItem>
                      <SelectItem value="picking_record">Picking Record</SelectItem>
                      <SelectItem value="factory_intake">Factory Intake</SelectItem>
                      <SelectItem value="godown_pile">Godown Pile</SelectItem>
                      <SelectItem value="milling_batch">Milling Batch</SelectItem>
                      <SelectItem value="drying_batch">Drying Batch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Entity ID</Label>
                  <div className="flex gap-2">
                    <Input type="number" value={traceForm.entity_id}
                      onChange={(e) => setTraceForm({ ...traceForm, entity_id: e.target.value })}
                      placeholder="Enter ID" required />
                    <Button type="submit"><Search className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </form>

            {/* Trace Results */}
            {traceResult && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Traceability Chain</h4>
                <div className="space-y-2">
                  {traceResult.chain ? (
                    traceResult.chain.map((node: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          {idx < traceResult.chain.length - 1 && (
                            <div className="w-0.5 h-6 bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary">{node.stage || node.type}</Badge>
                            <span className="text-sm font-medium">#{node.id}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {Object.entries(node.details || {}).map(([key, val]) => (
                              <span key={key} className="mr-3">{key}: <strong>{String(val)}</strong></span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <pre className="text-sm bg-muted p-3 rounded overflow-auto max-h-64">
                      {JSON.stringify(traceResult, null, 2)}
                    </pre>
                  )}
                </div>
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
      overview: 'Godown Overview',
      receive: 'Receive Coffee',
      issue: 'Issue Coffee',
      mixing: 'Pile Mixing',
      piles: 'All Piles',
      milling: 'Milling',
      history: 'Transaction History',
      traceability: 'Traceability',
    };
    return titles[activeTab] || 'Godown Management';
  };

  return (
    <ErrorBoundary>
      <Layout
        user={user}
        onLogout={onLogout}
        sidebarItems={GODOWN_NAV_ITEMS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        title={getTitle()}
      >
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}

        <div className={activeTab === 'overview' ? '' : 'hidden'}>
          {mountedTabs.has('overview') && renderOverview()}
        </div>
        <div className={activeTab === 'receive' ? '' : 'hidden'}>
          {mountedTabs.has('receive') && renderReceive()}
        </div>
        <div className={activeTab === 'issue' ? '' : 'hidden'}>
          {mountedTabs.has('issue') && renderIssue()}
        </div>
        <div className={activeTab === 'mixing' ? '' : 'hidden'}>
          {mountedTabs.has('mixing') && renderMixing()}
        </div>
        <div className={activeTab === 'piles' ? '' : 'hidden'}>
          {mountedTabs.has('piles') && renderPiles()}
        </div>
        <div className={activeTab === 'milling' ? '' : 'hidden'}>
          {mountedTabs.has('milling') && renderMilling()}
        </div>
        <div className={activeTab === 'history' ? '' : 'hidden'}>
          {mountedTabs.has('history') && renderHistory()}
        </div>
        <div className={activeTab === 'traceability' ? '' : 'hidden'}>
          {mountedTabs.has('traceability') && renderTraceability()}
        </div>

        {/* ========== DIALOGS ========== */}

        {/* Receive Dialog */}
        <Dialog open={showReceiveForm} onOpenChange={setShowReceiveForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>Receive Coffee into Godown</DialogTitle></DialogHeader>
            <form onSubmit={handleReceive} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grade *</Label>
                  <Select value={receiveForm.grade}
                    onValueChange={(v) => setReceiveForm({ ...receiveForm, grade: v })}>
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
                  <Label>Weight (kg) *</Label>
                  <Input type="number" step="0.1" value={receiveForm.weight_in_kg}
                    onChange={(e) => setReceiveForm({ ...receiveForm, weight_in_kg: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Bag Count</Label>
                  <Input type="number" value={receiveForm.bag_count}
                    onChange={(e) => setReceiveForm({ ...receiveForm, bag_count: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Pile Identifier</Label>
                  <Input value={receiveForm.pile_identifier}
                    onChange={(e) => setReceiveForm({ ...receiveForm, pile_identifier: e.target.value })}
                    placeholder="Auto-generated if empty" />
                </div>
                <div className="space-y-2">
                  <Label>Origin Label</Label>
                  <Input value={receiveForm.origin_label}
                    onChange={(e) => setReceiveForm({ ...receiveForm, origin_label: e.target.value })}
                    placeholder="e.g. Block A - Bourbon" />
                </div>
                <div className="space-y-2">
                  <Label>Variety</Label>
                  <Input value={receiveForm.variety}
                    onChange={(e) => setReceiveForm({ ...receiveForm, variety: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={receiveForm.notes}
                  onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowReceiveForm(false)}>Cancel</Button>
                <Button type="submit">Receive Coffee</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Issue Dialog */}
        <Dialog open={showIssueForm} onOpenChange={setShowIssueForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>Issue Coffee from Godown</DialogTitle></DialogHeader>
            <form onSubmit={handleIssue} className="space-y-4">
              <div className="space-y-2">
                <Label>Pile *</Label>
                <Select value={issueForm.pile_identifier}
                  onValueChange={(v) => setIssueForm({ ...issueForm, pile_identifier: v })}>
                  <SelectTrigger><SelectValue placeholder="Select pile..." /></SelectTrigger>
                  <SelectContent>
                    {(piles as any[] || []).filter((p: any) => p.status === 'active').map((p: any) => (
                      <SelectItem key={p.id} value={p.pile_identifier}>
                        {p.pile_identifier} ({p.grade} - {p.current_weight_kg?.toFixed(1)} kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Weight Out (kg) *</Label>
                  <Input type="number" step="0.1" value={issueForm.weight_out_kg}
                    onChange={(e) => setIssueForm({ ...issueForm, weight_out_kg: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Bag Count</Label>
                  <Input type="number" value={issueForm.bag_count}
                    onChange={(e) => setIssueForm({ ...issueForm, bag_count: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Select value={issueForm.reason}
                  onValueChange={(v) => setIssueForm({ ...issueForm, reason: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="milling">Milling</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="sample">Sample</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowIssueForm(false)}>Cancel</Button>
                <Button type="submit">Issue Coffee</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Mix Dialog */}
        <Dialog open={showMixForm} onOpenChange={setShowMixForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>Mix Piles</DialogTitle></DialogHeader>
            <form onSubmit={handleMix} className="space-y-4">
              <div className="space-y-2">
                <Label>Source Pile Identifiers *</Label>
                <Input value={mixForm.source_pile_ids}
                  onChange={(e) => setMixForm({ ...mixForm, source_pile_ids: e.target.value })}
                  placeholder="Comma-separated, e.g. GD-1-P1-2026-001, GD-1-P1-2026-002" required />
                <p className="text-xs text-muted-foreground">Enter pile identifiers separated by commas</p>
              </div>
              <div className="space-y-2">
                <Label>New Grade *</Label>
                <Select value={mixForm.new_grade}
                  onValueChange={(v) => setMixForm({ ...mixForm, new_grade: v })}>
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
                <Label>Mix Reason</Label>
                <Input value={mixForm.mix_reason}
                  onChange={(e) => setMixForm({ ...mixForm, mix_reason: e.target.value })}
                  placeholder="e.g. Grade consolidation" />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowMixForm(false)}>Cancel</Button>
                <Button type="submit"><Blend className="h-4 w-4 mr-2" /> Mix</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Milling Batch Dialog */}
        <Dialog open={showMillingForm} onOpenChange={setShowMillingForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Milling Batch</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateMillingBatch} className="space-y-4">
              <div className="space-y-2">
                <Label>Godown Pile IDs *</Label>
                <Input value={millingForm.godown_pile_ids}
                  onChange={(e) => setMillingForm({ ...millingForm, godown_pile_ids: e.target.value })}
                  placeholder="Comma-separated pile identifiers" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Parchment Weight (kg) *</Label>
                  <Input type="number" step="0.1" value={millingForm.parchment_weight_in_kg}
                    onChange={(e) => setMillingForm({ ...millingForm, parchment_weight_in_kg: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Milling Machine</Label>
                  <Input value={millingForm.milling_machine}
                    onChange={(e) => setMillingForm({ ...millingForm, milling_machine: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Transport Method</Label>
                  <Input value={millingForm.transport_method}
                    onChange={(e) => setMillingForm({ ...millingForm, transport_method: e.target.value })}
                    placeholder="e.g. Truck" />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Number</Label>
                  <Input value={millingForm.vehicle_number}
                    onChange={(e) => setMillingForm({ ...millingForm, vehicle_number: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowMillingForm(false)}>Cancel</Button>
                <Button type="submit">Create Batch</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </Layout>
    </ErrorBoundary>
  );
};

export default GodownManagerDashboard;
