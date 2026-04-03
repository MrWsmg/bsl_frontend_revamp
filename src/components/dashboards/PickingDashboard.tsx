"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Scale, Users, TrendingUp, DollarSign, Play, Square,
  Plus, RefreshCw, Trophy, Calendar, MessageSquare,
} from 'lucide-react';
import apiService from '../../services/api';
import { User } from '../../types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

interface PickingDashboardProps {
  user: User;
  onLogout: () => void;
  onBack?: () => void;
}

const PickingDashboard: React.FC<PickingDashboardProps> = ({ user }) => {
  const [farms, setFarms] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [allWorkers, setAllWorkers] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Active session state
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [sessionRecords, setSessionRecords] = useState<any[]>([]);
  const [showOpenSession, setShowOpenSession] = useState(false);
  const [showWeighForm, setShowWeighForm] = useState(false);

  // Daily summary / leaderboard
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Price management (GM only)
  const [todayPrice, setTodayPrice] = useState<any>(null);
  const [showSetPrice, setShowSetPrice] = useState(false);

  // Picker search
  const [pickerSearch, setPickerSearch] = useState('');

  // Forms
  const [sessionForm, setSessionForm] = useState({ block_id: '', notes: '' });
  const [weighForm, setWeighForm] = useState({
    worker_id: '', cherry_weight_kg: '', tare_weight_kg: '0',
  });
  const [priceForm, setPriceForm] = useState({ price_per_kg: '', notes: '' });

  // Filter workers: only those assigned to the selected farm
  const farmWorkers = React.useMemo(() => {
    if (!selectedFarmId) return [];
    return allWorkers.filter((w: any) => {
      if (!w.farm_assignments) return false;
      try {
        // farm_assignments is a JSON string like "[1,2]" or "1,2" or contains the farm ID
        const assignments = typeof w.farm_assignments === 'string'
          ? w.farm_assignments
          : String(w.farm_assignments);
        return assignments.includes(selectedFarmId);
      } catch {
        return false;
      }
    });
  }, [allWorkers, selectedFarmId]);

  // Filter by search term for the weigh dialog
  const filteredWorkers = React.useMemo(() => {
    if (!pickerSearch.trim()) return farmWorkers;
    const q = pickerSearch.toLowerCase();
    return farmWorkers.filter((w: any) =>
      (w.full_name || w.name || '').toLowerCase().includes(q) ||
      (w.phone || '').includes(q)
    );
  }, [farmWorkers, pickerSearch]);

  const isGM = ['admin', 'general_manager', 'managing_director'].includes(user.role);
  const canManageSessions = ['admin', 'supervisor', 'scale_supervisor'].includes(user.role);

  const loadFarms = useCallback(async () => {
    try {
      const data = await apiService.getFarms(user.role);
      setFarms(data || []);
      if (data?.length === 1) {
        setSelectedFarmId(String(data[0].farm_id));
      }
    } catch { setFarms([]); }
  }, [user.role]);

  const loadFarmData = useCallback(async () => {
    if (!selectedFarmId) return;
    const farmId = parseInt(selectedFarmId);
    setLoading(true);
    try {
      const [blocksData, workersData, sessionsData, summaryData, leaderData, priceData] = await Promise.all([
        apiService.getBlocksForFarm(farmId).catch((): any[] => []),
        apiService.getWorkers().catch((): any[] => []),
        apiService.getPickingSessions(farmId, undefined, undefined).catch((): any[] => []),
        apiService.getDailyPickingSummary(farmId).catch(() => null),
        apiService.getPickerLeaderboard(farmId).catch((): any[] => []),
        apiService.getDailyPickingPrice(farmId).catch(() => null),
      ]);
      setBlocks(blocksData || []);
      setAllWorkers(workersData || []);
      setSessions(sessionsData || []);
      setDailySummary(summaryData);
      setLeaderboard(leaderData || []);
      setTodayPrice(priceData);

      // Auto-select the first open session
      const openSession = (sessionsData || []).find((s: any) => s.status === 'open');
      if (openSession) {
        setActiveSession(openSession);
        loadSessionRecords(openSession.id);
      } else {
        setActiveSession(null);
        setSessionRecords([]);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [selectedFarmId]);

  const loadSessionRecords = async (sessionId: number) => {
    try {
      const detail = await apiService.getPickingSessionDetail(sessionId);
      setSessionRecords(detail?.records || []);
      if (detail) setActiveSession(detail);
    } catch { setSessionRecords([]); }
  };

  useEffect(() => { loadFarms(); }, [loadFarms]);
  useEffect(() => { if (selectedFarmId) loadFarmData(); }, [selectedFarmId, loadFarmData]);

  const clearMessages = () => { setError(null); setSuccess(null); };

  // Open a new picking session
  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      const result = await apiService.openPickingSession({
        farm_id: parseInt(selectedFarmId),
        block_id: sessionForm.block_id ? parseInt(sessionForm.block_id) : undefined,
        notes: sessionForm.notes || undefined,
      });
      setSuccess('Picking session opened!');
      setShowOpenSession(false);
      setSessionForm({ block_id: '', notes: '' });
      setActiveSession(result);
      setSessionRecords([]);
      loadFarmData();
    } catch (err: any) {
      setError(err.message || 'Failed to open session');
    }
  };

  // Close the active session
  const handleCloseSession = async () => {
    if (!activeSession) return;
    clearMessages();
    try {
      await apiService.closePickingSession(activeSession.id);
      setSuccess('Session closed.');
      setActiveSession(null);
      setSessionRecords([]);
      loadFarmData();
    } catch (err: any) {
      setError(err.message || 'Failed to close session');
    }
  };

  // Record picker weight (core action)
  const handleRecordWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    clearMessages();
    try {
      const result = await apiService.recordPickerWeight(activeSession.id, {
        worker_id: parseInt(weighForm.worker_id),
        cherry_weight_kg: parseFloat(weighForm.cherry_weight_kg),
        tare_weight_kg: parseFloat(weighForm.tare_weight_kg) || 0,
      });
      setSuccess(
        `Recorded ${result.net_weight_kg} kg for ${result.worker_name}. ` +
        `Payment: ${result.total_payment?.toLocaleString()} TZS. ` +
        (result.sms_sent ? 'SMS sent.' : '')
      );
      setShowWeighForm(false);
      setWeighForm({ worker_id: '', cherry_weight_kg: '', tare_weight_kg: '0' });
      loadSessionRecords(activeSession.id);
      loadFarmData();
    } catch (err: any) {
      setError(err.message || 'Failed to record weight');
    }
  };

  // Set daily picking price (GM only)
  const handleSetPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      await apiService.setDailyPickingPrice({
        farm_id: parseInt(selectedFarmId),
        date: new Date().toISOString().split('T')[0],
        price_per_kg: parseFloat(priceForm.price_per_kg),
        notes: priceForm.notes || undefined,
      });
      setSuccess('Daily price set!');
      setShowSetPrice(false);
      setPriceForm({ price_per_kg: '', notes: '' });
      loadFarmData();
    } catch (err: any) {
      setError(err.message || 'Failed to set price');
    }
  };

  const todaySessions = sessions.filter((s: any) => {
    const sessionDate = new Date(s.date || s.created_at).toISOString().split('T')[0];
    return sessionDate === new Date().toISOString().split('T')[0];
  });

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Picking Operations</h1>
              <p className="text-muted-foreground">Per-picker cherry weight tracking with instant SMS</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select Farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((f: any) => (
                    <SelectItem key={f.farm_id} value={String(f.farm_id)}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={loadFarmData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}

          {!selectedFarmId ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Select a farm to begin.</CardContent></Card>
          ) : (
            <Tabs defaultValue="session" className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <TabsList className="w-full flex flex-wrap h-auto gap-1">
                    <TabsTrigger value="session" className="flex-1 min-w-[120px]">Active Session</TabsTrigger>
                    <TabsTrigger value="daily" className="flex-1 min-w-[120px]">Daily Overview</TabsTrigger>
                    <TabsTrigger value="leaderboard" className="flex-1 min-w-[120px]">Leaderboard</TabsTrigger>
                    {isGM && <TabsTrigger value="price" className="flex-1 min-w-[120px]">Price Management</TabsTrigger>}
                  </TabsList>
                </CardContent>
              </Card>

              {/* ========== ACTIVE SESSION TAB ========== */}
              <TabsContent value="session" className="space-y-6">
                {/* Today's price banner */}
                <Card className={todayPrice ? 'border-green-500' : 'border-yellow-500'}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5" />
                      <span className="font-medium">
                        {todayPrice
                          ? `Today's Price: ${todayPrice.price_per_kg?.toLocaleString()} TZS/kg`
                          : 'No price set for today'}
                      </span>
                    </div>
                    {!todayPrice && isGM && (
                      <Button size="sm" onClick={() => setShowSetPrice(true)}>Set Price</Button>
                    )}
                  </CardContent>
                </Card>

                {/* Session controls */}
                {activeSession ? (
                  <>
                    <Card>
                      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-3">
                        <div>
                          <CardTitle className="text-lg">
                            Session #{activeSession.id}
                            {activeSession.block_name && ` - ${activeSession.block_name}`}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Price: {activeSession.price_per_kg?.toLocaleString()} TZS/kg |
                            Pickers: {activeSession.total_pickers || sessionRecords.length} |
                            Total: {activeSession.total_cherry_kg?.toFixed(1) || '0'} kg
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => setShowWeighForm(true)}>
                            <Scale className="h-4 w-4 mr-2" />
                            Weigh Picker
                          </Button>
                          {canManageSessions && (
                            <Button variant="destructive" size="sm" onClick={handleCloseSession}>
                              <Square className="h-4 w-4 mr-2" />
                              Close Session
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {sessionRecords.length === 0 ? (
                          <p className="text-center py-4 text-muted-foreground">No weights recorded yet. Start weighing pickers.</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Picker</TableHead>
                                <TableHead>Gross (kg)</TableHead>
                                <TableHead>Tare (kg)</TableHead>
                                <TableHead>Net (kg)</TableHead>
                                <TableHead>Payment (TZS)</TableHead>
                                <TableHead>SMS</TableHead>
                                <TableHead>Time</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sessionRecords.map((r: any, i: number) => (
                                <TableRow key={r.id}>
                                  <TableCell>{i + 1}</TableCell>
                                  <TableCell className="font-medium">{r.worker_name}</TableCell>
                                  <TableCell>{r.cherry_weight_kg?.toFixed(1)}</TableCell>
                                  <TableCell>{r.tare_weight_kg?.toFixed(1)}</TableCell>
                                  <TableCell className="font-bold">{r.net_weight_kg?.toFixed(1)}</TableCell>
                                  <TableCell className="font-semibold text-green-600">
                                    {r.total_payment?.toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={r.sms_sent ? 'default' : 'secondary'}>
                                      {r.sms_sent ? 'Sent' : 'Pending'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {r.weighing_time ? new Date(r.weighing_time).toLocaleTimeString() : '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground mb-4">No active picking session.</p>
                      {canManageSessions && (
                        <Button onClick={() => setShowOpenSession(true)} disabled={!todayPrice}>
                          <Play className="h-4 w-4 mr-2" />
                          Open New Session
                        </Button>
                      )}
                      {!todayPrice && (
                        <p className="text-sm text-yellow-600 mt-2">A daily price must be set before opening sessions.</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ========== DAILY OVERVIEW TAB ========== */}
              <TabsContent value="daily" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold">{todaySessions.length}</p>
                      <p className="text-sm text-muted-foreground">Sessions Today</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold">{dailySummary?.total_pickers || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Pickers</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Scale className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                      <p className="text-2xl font-bold">{dailySummary?.total_cherry_kg?.toFixed(0) || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Cherry (kg)</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold">{dailySummary?.total_payment?.toLocaleString() || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Payment (TZS)</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Sessions list */}
                <Card>
                  <CardHeader><CardTitle>Today&apos;s Sessions</CardTitle></CardHeader>
                  <CardContent>
                    {todaySessions.length === 0 ? (
                      <p className="text-center py-4 text-muted-foreground">No sessions today.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Block</TableHead>
                            <TableHead>Pickers</TableHead>
                            <TableHead>Cherry (kg)</TableHead>
                            <TableHead>Price/kg</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {todaySessions.map((s: any) => (
                            <TableRow
                              key={s.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => { setActiveSession(s); loadSessionRecords(s.id); }}
                            >
                              <TableCell>#{s.id}</TableCell>
                              <TableCell>{s.block_name || '-'}</TableCell>
                              <TableCell>{s.total_pickers || 0}</TableCell>
                              <TableCell>{s.total_cherry_kg?.toFixed(1) || '0'}</TableCell>
                              <TableCell>{s.price_per_kg?.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={s.status === 'open' ? 'default' : 'secondary'}>
                                  {s.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ========== LEADERBOARD TAB ========== */}
              <TabsContent value="leaderboard" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Top Pickers Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {leaderboard.length === 0 ? (
                      <p className="text-center py-4 text-muted-foreground">No picking data for today.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Picker</TableHead>
                            <TableHead>Total kg</TableHead>
                            <TableHead>Weighings</TableHead>
                            <TableHead>Total Payment (TZS)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaderboard.map((entry: any, i: number) => (
                            <TableRow key={entry.worker_id}>
                              <TableCell>
                                {i < 3 ? (
                                  <Badge variant={i === 0 ? 'default' : 'secondary'}>
                                    {i === 0 ? 'Gold' : i === 1 ? 'Silver' : 'Bronze'}
                                  </Badge>
                                ) : (
                                  <span>#{i + 1}</span>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{entry.worker_name}</TableCell>
                              <TableCell className="font-bold">{entry.total_kg?.toFixed(1)}</TableCell>
                              <TableCell>{entry.weighings}</TableCell>
                              <TableCell className="text-green-600 font-semibold">
                                {entry.total_payment?.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ========== PRICE MANAGEMENT TAB (GM only) ========== */}
              {isGM && (
                <TabsContent value="price" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Current Price</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {todayPrice ? (
                          <div className="space-y-2">
                            <p className="text-3xl font-bold text-green-600">
                              {todayPrice.price_per_kg?.toLocaleString()} TZS/kg
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Set on {new Date(todayPrice.created_at).toLocaleDateString()}
                            </p>
                            {todayPrice.notes && <p className="text-sm">{todayPrice.notes}</p>}
                          </div>
                        ) : (
                          <div>
                            <p className="text-muted-foreground mb-4">No price set for today.</p>
                            <Button onClick={() => setShowSetPrice(true)}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Set Today&apos;s Price
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle>Quick Set Price</CardTitle></CardHeader>
                      <CardContent>
                        <form onSubmit={handleSetPrice} className="space-y-4">
                          <div className="space-y-2">
                            <Label>Price per kg (TZS)</Label>
                            <Input
                              type="number"
                              step="1"
                              value={priceForm.price_per_kg}
                              onChange={(e) => setPriceForm({ ...priceForm, price_per_kg: e.target.value })}
                              placeholder="e.g. 1200"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Notes (optional)</Label>
                            <Textarea
                              value={priceForm.notes}
                              onChange={(e) => setPriceForm({ ...priceForm, notes: e.target.value })}
                              placeholder="Reason for price change..."
                            />
                          </div>
                          <Button type="submit">Set Price</Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          )}

          {/* ========== DIALOGS ========== */}

          {/* Open Session Dialog */}
          <Dialog open={showOpenSession} onOpenChange={setShowOpenSession}>
            <DialogContent>
              <DialogHeader><DialogTitle>Open Picking Session</DialogTitle></DialogHeader>
              <form onSubmit={handleOpenSession} className="space-y-4">
                <div className="space-y-2">
                  <Label>Block (optional)</Label>
                  <Select
                    value={sessionForm.block_id}
                    onValueChange={(v) => setSessionForm({ ...sessionForm, block_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select block..." />
                    </SelectTrigger>
                    <SelectContent>
                      {blocks.map((b: any) => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={sessionForm.notes}
                    onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowOpenSession(false)}>Cancel</Button>
                  <Button type="submit">
                    <Play className="h-4 w-4 mr-2" />
                    Open Session
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Weigh Picker Dialog */}
          <Dialog open={showWeighForm} onOpenChange={(open) => {
            setShowWeighForm(open);
            if (!open) setPickerSearch('');
          }}>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Picker Weight</DialogTitle></DialogHeader>
              <form onSubmit={handleRecordWeight} className="space-y-4">
                <div className="space-y-2">
                  <Label>Picker (Worker) — {farmWorkers.length} assigned to this farm</Label>
                  <Input
                    placeholder="Search by name or phone..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="mb-2"
                  />
                  <Select
                    value={weighForm.worker_id}
                    onValueChange={(v) => setWeighForm({ ...weighForm, worker_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select picker..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredWorkers.length === 0 ? (
                        <SelectItem value="__none" disabled>
                          {farmWorkers.length === 0
                            ? 'No workers assigned to this farm'
                            : 'No matching workers'}
                        </SelectItem>
                      ) : (
                        filteredWorkers.map((w: any) => (
                          <SelectItem key={w.id} value={String(w.id)}>
                            {w.full_name || w.name} {w.phone ? `(${w.phone})` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cherry Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={weighForm.cherry_weight_kg}
                      onChange={(e) => setWeighForm({ ...weighForm, cherry_weight_kg: e.target.value })}
                      placeholder="e.g. 45.5"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tare Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={weighForm.tare_weight_kg}
                      onChange={(e) => setWeighForm({ ...weighForm, tare_weight_kg: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                {weighForm.cherry_weight_kg && todayPrice && (
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <p>Net weight: <strong>{(parseFloat(weighForm.cherry_weight_kg) - parseFloat(weighForm.tare_weight_kg || '0')).toFixed(1)} kg</strong></p>
                    <p>
                      Estimated payment: <strong className="text-green-600">
                        {((parseFloat(weighForm.cherry_weight_kg) - parseFloat(weighForm.tare_weight_kg || '0')) * todayPrice.price_per_kg).toLocaleString()} TZS
                      </strong>
                    </p>
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowWeighForm(false)}>Cancel</Button>
                  <Button type="submit">
                    <Scale className="h-4 w-4 mr-2" />
                    Record & Send SMS
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Set Price Dialog */}
          <Dialog open={showSetPrice} onOpenChange={setShowSetPrice}>
            <DialogContent>
              <DialogHeader><DialogTitle>Set Daily Picking Price</DialogTitle></DialogHeader>
              <form onSubmit={handleSetPrice} className="space-y-4">
                <div className="space-y-2">
                  <Label>Price per kg (TZS)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={priceForm.price_per_kg}
                    onChange={(e) => setPriceForm({ ...priceForm, price_per_kg: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={priceForm.notes}
                    onChange={(e) => setPriceForm({ ...priceForm, notes: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowSetPrice(false)}>Cancel</Button>
                  <Button type="submit">Set Price</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export { PickingDashboard };
export default PickingDashboard;
