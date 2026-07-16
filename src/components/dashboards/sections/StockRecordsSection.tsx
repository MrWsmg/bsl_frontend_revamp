"use client";

// Stock Records Section - Using shadcn/ui blocks pattern
import React, { useState, useCallback, useMemo } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Plus, Filter, Package, X } from 'lucide-react';
import { toast } from '../../ui/sonner';

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Pagination, usePagination } from '../../common/Pagination';

interface StockFormData {
  farm_id: number;
  item_description: string;
  grade: string;
  worker_name: string;
  number_of_workers: number;
  ratio: number;
  quantity_kg: number;
  payment_per_day: number;
  payment_per_kg: number;
  date_recorded: string;
  receipt_image_url?: string;
  crop_type: string;
}

// Stat Card Block
interface StatCardProps {
  title: string;
  value: string | number;
  valueClassName?: string;
}

const StatCard = ({ title, value, valueClassName = "text-foreground" }: StatCardProps) => (
  <Card>
    <CardContent className="p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${valueClassName}`}>{value}</p>
    </CardContent>
  </Card>
);

export const StockRecordsSection: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [formData, setFormData] = useState<StockFormData>({
    farm_id: 0,
    item_description: '',
    grade: 'A',
    worker_name: '',
    number_of_workers: 1,
    ratio: 0,
    quantity_kg: 0,
    payment_per_day: 0,
    payment_per_kg: 0,
    date_recorded: new Date().toISOString().split('T')[0],
    receipt_image_url: '',
    crop_type: '',
  });

  // Fetch data
  const getFarms = useCallback(() => apiService.getStockFarms(), []);

  const getStockRecords = useCallback(() => {
    const params: any = {};
    if (selectedFarm !== 'all') params.farm_id = parseInt(selectedFarm);
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return apiService.getStockRecords(params);
  }, [selectedFarm, startDate, endDate]);

  const { data: farms } = useApi(getFarms);
  const { data: records, loading, refetch } = useApi(getStockRecords);

  // Client-side pagination over the returned harvest records.
  const {
    paginatedItems: pagedRecords,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    totalPages, totalItems,
  } = usePagination<any>((records as any[]) || [], 25);

  const stats = useMemo(() => {
    if (!records?.length) return { total: 0, totalQuantity: 0, totalWorkers: 0, totalPayment: 0 };

    return {
      total: records.length,
      totalQuantity: records.reduce((sum: number, r: any) => sum + (r.quantity_kg || 0), 0),
      totalWorkers: records.reduce((sum: number, r: any) => sum + (r.number_of_workers || 0), 0),
      totalPayment: records.reduce((sum: number, r: any) => {
        const dayPay = (r.payment_per_day || 0) * (r.number_of_workers || 0);
        const kgPay = (r.payment_per_kg || 0) * (r.quantity_kg || 0);
        return sum + dayPay + kgPay;
      }, 0),
    };
  }, [records]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[StockRecords] Form submitted with data:', formData);

    // Validate data before submission
    if (!formData.farm_id || formData.farm_id === 0 || isNaN(formData.farm_id)) {
      toast.error('Please select a farm');
      return;
    }

    if (!formData.item_description.trim()) {
      toast.error('Please enter an item description');
      return;
    }

    if (!formData.crop_type.trim()) {
      toast.error('Please enter a crop type');
      return;
    }

    if (!formData.worker_name.trim()) {
      toast.error('Please enter a worker name');
      return;
    }

    if (formData.quantity_kg <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (formData.number_of_workers <= 0) {
      toast.error('Number of workers must be at least 1');
      return;
    }

    const stockData = {
      farm_id: formData.farm_id,
      item_description: formData.item_description.trim(),
      grade: formData.grade,
      worker_name: formData.worker_name.trim(),
      number_of_workers: formData.number_of_workers,
      ratio: formData.ratio,
      quantity_kg: formData.quantity_kg,
      payment_per_day: formData.payment_per_day,
      payment_per_kg: formData.payment_per_kg,
      date_recorded: formData.date_recorded,
      receipt_image_url: formData.receipt_image_url?.trim() || '',
      crop_type: formData.crop_type.trim()
    };

    console.log('[StockRecords] Sending to API:', stockData);

    try {
      const response = await apiService.createStockRecord(stockData);
      console.log('[StockRecords] API response:', response);
      toast.success('Stock record created successfully');
      setShowCreateModal(false);
      resetForm();
      refetch();
    } catch (error: any) {
      console.error('[StockRecords] API error:', error);
      console.error('Error details:', error.response?.data);

      if (error.response?.data?.detail) {
        const details = error.response.data.detail;
        if (Array.isArray(details)) {
          details.forEach((err: any) => {
            console.error(`Validation error on ${err.loc?.join('.')}: ${err.msg}`);
          });
          toast.error(`Validation failed: ${details[0].msg || 'Please check your input'}`);
        } else {
          toast.error(details);
        }
      } else {
        toast.error(error.message || 'Failed to create stock record');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      farm_id: 0,
      item_description: '',
      grade: 'A',
      worker_name: '',
      number_of_workers: 1,
      ratio: 0,
      quantity_kg: 0,
      payment_per_day: 0,
      payment_per_kg: 0,
      date_recorded: new Date().toISOString().split('T')[0],
      receipt_image_url: '',
      crop_type: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Records" value={stats.total} />
        <StatCard
          title="Total Quantity (kg)"
          value={stats.totalQuantity.toFixed(2)}
          valueClassName="text-success"
        />
        <StatCard
          title="Total Workers"
          value={stats.totalWorkers}
          valueClassName="text-primary"
        />
        <StatCard
          title="Total Payment"
          value={stats.totalPayment.toLocaleString('en-US', { style: 'currency', currency: 'TZS' })}
          valueClassName="text-purple-600"
        />
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
            {!readOnly && (
              <Button onClick={() => { resetForm(); setShowCreateModal(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Harvest Record
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Farm</Label>
              <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                <SelectTrigger>
                  <SelectValue placeholder="All Farms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Farms</SelectItem>
                  {farms?.map((farm: any) => (
                    <SelectItem key={farm.farm_id} value={String(farm.farm_id)}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedFarm('all');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records Table Card */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !records || records.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No harvest records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farm</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Crop Type</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Workers</TableHead>
                    <TableHead>Quantity (kg)</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRecords.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.farm_name || 'N/A'}</TableCell>
                      <TableCell className="font-medium">{record.item_description}</TableCell>
                      <TableCell className="text-muted-foreground">{record.crop_type}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Grade {record.grade}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{record.worker_name}</TableCell>
                      <TableCell className="text-muted-foreground">{record.number_of_workers}</TableCell>
                      <TableCell className="font-semibold text-success">
                        {record.quantity_kg?.toFixed(2) || 0}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(record.date_recorded || record.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalItems > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Record Dialog */}
      <Dialog open={!readOnly && showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Harvest Record</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Farm Selection */}
              <div className="space-y-2">
                <Label>Farm *</Label>
                <Select
                  value={formData.farm_id ? String(formData.farm_id) : ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, farm_id: Number(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms?.map((farm: any) => (
                      <SelectItem key={farm.farm_id} value={String(farm.farm_id)}>
                        {farm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Item Description */}
              <div className="space-y-2">
                <Label>Item Description *</Label>
                <Input
                  value={formData.item_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, item_description: e.target.value }))}
                  placeholder="e.g., Fresh Avocados"
                />
              </div>

              {/* Crop Type */}
              <div className="space-y-2">
                <Label>Crop Type *</Label>
                <Input
                  value={formData.crop_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, crop_type: e.target.value }))}
                  placeholder="e.g., Avocado"
                />
              </div>

              {/* Grade */}
              <div className="space-y-2">
                <Label>Grade *</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, grade: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Grade A</SelectItem>
                    <SelectItem value="B">Grade B</SelectItem>
                    <SelectItem value="C">Grade C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Worker Name */}
              <div className="space-y-2">
                <Label>Worker Name *</Label>
                <Input
                  value={formData.worker_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, worker_name: e.target.value }))}
                  placeholder="e.g., John Doe"
                />
              </div>

              {/* Number of Workers */}
              <div className="space-y-2">
                <Label>Number of Workers *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.number_of_workers || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setFormData(prev => ({ ...prev, number_of_workers: isNaN(value) ? 1 : value }));
                  }}
                  placeholder="1"
                />
              </div>

              {/* Quantity (kg) */}
              <div className="space-y-2">
                <Label>Quantity (kg) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.quantity_kg || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setFormData(prev => ({ ...prev, quantity_kg: isNaN(value) ? 0 : value }));
                  }}
                  placeholder="0.00"
                />
              </div>

              {/* Ratio */}
              <div className="space-y-2">
                <Label>Ratio</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.ratio || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setFormData(prev => ({ ...prev, ratio: isNaN(value) ? 0 : value }));
                  }}
                  placeholder="0.00"
                />
              </div>

              {/* Payment per Day */}
              <div className="space-y-2">
                <Label>Payment per Day (TZS)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.payment_per_day || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setFormData(prev => ({ ...prev, payment_per_day: isNaN(value) ? 0 : value }));
                  }}
                  placeholder="0.00"
                />
              </div>

              {/* Payment per Kg */}
              <div className="space-y-2">
                <Label>Payment per Kg (TZS)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.payment_per_kg || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setFormData(prev => ({ ...prev, payment_per_kg: isNaN(value) ? 0 : value }));
                  }}
                  placeholder="0.00"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>Date Recorded *</Label>
                <Input
                  type="date"
                  value={formData.date_recorded}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_recorded: e.target.value }))}
                />
              </div>

              {/* Receipt Image URL */}
              <div className="space-y-2">
                <Label>Receipt Image URL</Label>
                <Input
                  value={formData.receipt_image_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, receipt_image_url: e.target.value }))}
                  placeholder="https://example.com/receipt.jpg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Create Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
