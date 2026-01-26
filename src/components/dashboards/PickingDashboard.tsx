"use client";

import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, TrendingUp, Calendar, Users } from 'lucide-react';
import apiService from '../../services/api';

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  assigned_farms: string;
  is_active: boolean;
}

interface PickingDashboardProps {
  user: User;
  onLogout: () => void;
  onBack: () => void;
}

// Stat Card Block
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgClass?: string;
  valueClass?: string;
}

const StatCard = ({ title, value, icon, iconBgClass = "bg-muted", valueClass = "text-foreground" }: StatCardProps) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${iconBgClass}`}>
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-muted-foreground">{title}</h3>
          <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Worker Type Card Block
interface WorkerTypeCardProps {
  type: string;
  stats: { count: number; quantity: number; amount: number };
}

const WorkerTypeCard = ({ type, stats }: WorkerTypeCardProps) => (
  <Card className="bg-muted/50">
    <CardContent className="p-6">
      <div className="flex justify-between items-center mb-4">
        <Badge variant={type === 'permanent' ? 'default' : 'secondary'}>
          {type.charAt(0).toUpperCase() + type.slice(1)} Workers
        </Badge>
        <span className="text-sm text-muted-foreground">{stats.count} records</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold">{stats.quantity.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Total Workers</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-success">{stats.amount.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Total Amount</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-lg font-semibold text-primary">
            {stats.quantity > 0 ? (stats.amount / stats.quantity).toLocaleString(undefined, {maximumFractionDigits: 0}) : '0'}
          </p>
          <p className="text-sm text-muted-foreground">Avg Cost per Worker</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Block Performance Card
interface BlockCardProps {
  block: string;
  stats: { count: number; quantity: number; amount: number };
}

const BlockCard = ({ block, stats }: BlockCardProps) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="font-medium">{block || 'No Block'}</span>
        <span className="text-sm text-muted-foreground">{stats.count} records</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Workers:</span>
          <span className="font-semibold">{stats.quantity.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Total Amount:</span>
          <span className="font-semibold text-success">{stats.amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Avg per Worker:</span>
          <span className="font-semibold text-primary">
            {stats.quantity > 0 ? (stats.amount / stats.quantity).toLocaleString(undefined, {maximumFractionDigits: 0}) : '0'}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const PickingDashboard: React.FC<PickingDashboardProps> = ({ user, onLogout, onBack }) => {
  const [farms, setFarms] = useState<any[]>([]);
  const [pickingRecords, setPickingRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [availableCrops, setAvailableCrops] = useState<string[]>([]);
  const [pickingSummary, setPickingSummary] = useState<any>(null);

  const [pickingForm, setPickingForm] = useState({
    farm_id: '',
    worker_name: '',
    worker_type: 'contracted',
    block: '',
    number_of_workers: '',
    payment_per_worker: '',
    date_worked: new Date().toISOString().split('T')[0],
    crop_type: 'coffee'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (pickingForm.farm_id) {
      const selectedFarm = farms.find((f: any) => f.id === parseInt(pickingForm.farm_id));
      if (selectedFarm && selectedFarm.crops) {
        try {
          const crops = JSON.parse(selectedFarm.crops);
          setAvailableCrops(crops);
        } catch (error) {
          console.error('Error parsing farm crops:', error);
          setAvailableCrops([]);
        }
      } else {
        setAvailableCrops([]);
      }
    } else {
      setAvailableCrops([]);
    }
  }, [pickingForm.farm_id, farms]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [farmsData, pickingData, summaryData] = await Promise.all([
        apiService.getFarms(user.role).catch(() => []),
        apiService.getPickingRecords().catch(() => []),
        apiService.getPickingWeeklySummary().catch(() => null)
      ]);
      setFarms(farmsData);
      setPickingRecords(pickingData);
      setPickingSummary(summaryData);
    } catch (error) {
      console.error('Error loading data:', error);
      setFarms([]);
      setPickingRecords([]);
      setPickingSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPicking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let receiptUrl = null;
      if (receiptFile) {
        const uploadResult = await apiService.uploadReceipt(receiptFile) as { url: string };
        receiptUrl = uploadResult.url;
      }

      const numberOfWorkers = parseFloat(pickingForm.number_of_workers);
      const paymentPerWorker = parseFloat(pickingForm.payment_per_worker);

      await apiService.createPayrollRecord({
        farm_id: parseInt(pickingForm.farm_id),
        task_code: '180',
        worker_name: pickingForm.worker_name,
        worker_type: pickingForm.worker_type,
        block: pickingForm.block || undefined,
        quantity: numberOfWorkers,
        rate: paymentPerWorker,
        date_worked: new Date(pickingForm.date_worked).toISOString(),
        receipt_image_url: receiptUrl || undefined,
        crop_type: pickingForm.crop_type || undefined,
      });

      setPickingForm({
        farm_id: '',
        worker_name: '',
        worker_type: 'contracted',
        block: '',
        number_of_workers: '',
        payment_per_worker: '',
        date_worked: new Date().toISOString().split('T')[0],
        crop_type: 'coffee'
      });
      setReceiptFile(null);
      setShowAddForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating picking record:', error);
      alert('Failed to save picking record. Please try again.');
    }
  };

  const getPickingAnalytics = () => {
    if (!pickingSummary) return null;

    return {
      totalRecords: pickingSummary.total_records || 0,
      totalQuantity: pickingSummary.total_quantity || 0,
      totalAmount: pickingSummary.total_amount || 0,
      avgRate: pickingSummary.avg_rate_per_kg || 0,
      workerTypeStats: pickingSummary.worker_type_breakdown || {},
      farmStats: pickingSummary.farm_breakdown || {},
      blockStats: pickingSummary.block_breakdown || {},
      cropStats: pickingSummary.crop_breakdown || {}
    };
  };

  const analytics = getPickingAnalytics();

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {loading && (
            <Alert>
              <AlertDescription>Loading picking data...</AlertDescription>
            </Alert>
          )}

          {/* Analysis Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Total Records"
                  value={pickingSummary?.total_records || 0}
                  icon={<BarChart3 className="h-6 w-6 text-orange-600" />}
                  iconBgClass="bg-orange-100"
                  valueClass="text-orange-600"
                />
                <StatCard
                  title="Total Workers"
                  value={pickingSummary?.total_quantity?.toLocaleString() || 0}
                  icon={<Users className="h-6 w-6 text-success" />}
                  iconBgClass="bg-green-100"
                  valueClass="text-success"
                />
                <StatCard
                  title="Total Amount"
                  value={pickingSummary?.total_amount?.toLocaleString() || 0}
                  icon={<Calendar className="h-6 w-6 text-primary" />}
                  iconBgClass="bg-blue-100"
                  valueClass="text-primary"
                />
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              {analytics && (
                <>
                  {/* Permanent vs Contracted Workers */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Permanent vs Contracted Workers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(analytics.workerTypeStats).map(([type, stats]: [string, any]) => (
                          <WorkerTypeCard key={type} type={type} stats={stats} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance by Farm */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance by Farm</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Farm</TableHead>
                              <TableHead>Records</TableHead>
                              <TableHead>Workers</TableHead>
                              <TableHead>Total Amount</TableHead>
                              <TableHead>Avg per Worker</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(analytics.farmStats).map(([farmName, data]: [string, any]) => (
                              <TableRow key={farmName}>
                                <TableCell className="font-medium">{farmName}</TableCell>
                                <TableCell>{data.count}</TableCell>
                                <TableCell>{data.quantity.toLocaleString()}</TableCell>
                                <TableCell>{data.amount.toLocaleString()}</TableCell>
                                <TableCell>
                                  {data.quantity > 0 ? (data.amount / data.quantity).toLocaleString(undefined, {maximumFractionDigits: 0}) : '0'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Farm Block Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Farm Block Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(analytics.blockStats).map(([block, stats]: [string, any]) => (
                          <BlockCard key={block} block={block} stats={stats} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Picking Records Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Picking Records</CardTitle>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Picking Record
              </Button>
            </CardHeader>
            <CardContent>
              {pickingRecords.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No picking records found.</p>
                  <p className="text-sm text-muted-foreground mt-1">Add your first picking record using the button above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Farm</TableHead>
                        <TableHead>Worker</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Block</TableHead>
                        <TableHead>Workers</TableHead>
                        <TableHead>Payment/Worker</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pickingRecords.map((record: any) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {record.farm?.name || 'Unknown Farm'}
                          </TableCell>
                          <TableCell>{record.worker_name}</TableCell>
                          <TableCell>
                            <Badge variant={record.worker_type === 'permanent' ? 'default' : 'secondary'}>
                              {record.worker_type === 'permanent' ? 'Permanent' : 'Contracted'}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.block || '-'}</TableCell>
                          <TableCell>{record.quantity}</TableCell>
                          <TableCell>{record.rate?.toLocaleString() || '0'}</TableCell>
                          <TableCell>{record.total_amount?.toLocaleString() || '0'}</TableCell>
                          <TableCell>
                            {new Date(record.date_worked).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Picking Record Dialog */}
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Picking Record</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmitPicking} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Farm</Label>
                    <Select
                      value={pickingForm.farm_id}
                      onValueChange={(value) => setPickingForm({...pickingForm, farm_id: value, crop_type: ''})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={farms.length === 0 ? 'Loading farms...' : 'Select Farm'} />
                      </SelectTrigger>
                      <SelectContent>
                        {farms.map((farm: any) => (
                          <SelectItem key={farm.id} value={String(farm.id)}>{farm.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Worker Name</Label>
                    <Input
                      value={pickingForm.worker_name}
                      onChange={(e) => setPickingForm({...pickingForm, worker_name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Worker Type</Label>
                    <Select
                      value={pickingForm.worker_type}
                      onValueChange={(value) => setPickingForm({...pickingForm, worker_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="contracted">Contracted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Block (optional)</Label>
                    <Input
                      value={pickingForm.block}
                      onChange={(e) => setPickingForm({...pickingForm, block: e.target.value})}
                      placeholder="e.g., Block A, Block 1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Number of Workers</Label>
                    <Input
                      type="number"
                      step="1"
                      value={pickingForm.number_of_workers}
                      onChange={(e) => setPickingForm({...pickingForm, number_of_workers: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Payment per Worker</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={pickingForm.payment_per_worker}
                      onChange={(e) => setPickingForm({...pickingForm, payment_per_worker: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date Worked</Label>
                    <Input
                      type="date"
                      value={pickingForm.date_worked}
                      onChange={(e) => setPickingForm({...pickingForm, date_worked: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Receipt (optional)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Picking Record
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default PickingDashboard;
