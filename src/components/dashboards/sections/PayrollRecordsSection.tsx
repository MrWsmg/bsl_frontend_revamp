"use client";

// Payroll Records Section
import React, { useState, useCallback, useMemo } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Plus, Edit, Check, X, Calendar } from 'lucide-react';
import { toast } from '../../ui/sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PayrollFormData {
  worker_id: number;
  farm_id: number;
  task_code: string;
  quantity: number;
  rate: number;
  date_worked: string;
  notes?: string;
}

export const PayrollRecordsSection: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<PayrollFormData>({
    worker_id: 0,
    farm_id: 0,
    task_code: '',
    quantity: 0,
    rate: 0,
    date_worked: new Date().toISOString().split('T')[0],
  });

  // Fetch data
  const getFarms = useCallback(() => apiService.getPayrollFarms(), []);
  const getWorkers = useCallback(() => apiService.getWorkers(), []);

  const getPayrollRecords = useCallback(() => {
    const params: any = {};
    if (selectedFarm !== 'all') params.farm_id = parseInt(selectedFarm);
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return apiService.getPayrollRecords(params);
  }, [selectedFarm, startDate, endDate]);

  const { data: farms } = useApi(getFarms);
  const { data: workers } = useApi(getWorkers);
  const { data: records, loading, refetch } = useApi(getPayrollRecords);

  const stats = useMemo(() => {
    if (!records?.length) return { total: 0, pending: 0, approved: 0, amount: 0 };

    return {
      total: records.length,
      pending: records.filter((r: any) => r.approval_status === 'pending').length,
      approved: records.filter((r: any) => r.approval_status === 'approved').length,
      amount: records.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0),
    };
  }, [records]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingRecord) {
        await apiService.updatePayrollRecord(editingRecord.id, formData);
        toast.success('Payroll record updated successfully');
      } else {
        await apiService.createPayrollRecord(formData);
        toast.success('Payroll record created successfully');
      }

      setShowCreateModal(false);
      setEditingRecord(null);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save payroll record');
    }
  };

  const handleApprove = async (recordId: number) => {
    setProcessingId(recordId);
    try {
      await apiService.approvePayrollRecord(recordId);
      toast.success('Payroll record approved');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve record');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (recordId: number) => {
    setProcessingId(recordId);
    try {
      await apiService.rejectPayrollRecord(recordId);
      toast.success('Payroll record rejected');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject record');
    } finally {
      setProcessingId(null);
    }
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setFormData({
      worker_id: record.worker_id,
      farm_id: record.farm_id,
      task_code: record.task_code,
      quantity: record.quantity,
      rate: record.rate,
      date_worked: record.date_worked?.split('T')[0] || '',
      notes: record.notes || '',
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      worker_id: 0,
      farm_id: 0,
      task_code: '',
      quantity: 0,
      rate: 0,
      date_worked: new Date().toISOString().split('T')[0],
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const clearFilters = () => {
    setSelectedFarm('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-xl font-bold mt-1">${stats.amount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions & Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter payroll records by farm and date</CardDescription>
          </div>
          <Button onClick={() => {
            resetForm();
            setEditingRecord(null);
            setShowCreateModal(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Record
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Farm</Label>
              <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select farm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Farms</SelectItem>
                  {farms?.filter((farm: any) => farm.id != null).map((farm: any) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
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
              <Button variant="outline" className="w-full" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Records</CardTitle>
          <CardDescription>All payroll entries with approval status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !records || records.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payroll records found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Farm</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.worker_name}</TableCell>
                      <TableCell>{record.farm_name}</TableCell>
                      <TableCell>{record.task_code}</TableCell>
                      <TableCell>{record.quantity}</TableCell>
                      <TableCell>${record.rate}</TableCell>
                      <TableCell className="font-semibold">
                        ${(record.total_amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>{new Date(record.date_worked).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(record.approval_status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {record.approval_status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleApprove(record.id)}
                                disabled={processingId === record.id}
                                className="text-green-600 hover:text-green-900 hover:bg-green-50"
                              >
                                {processingId === record.id ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReject(record.id)}
                                disabled={processingId === record.id}
                                className="text-destructive hover:text-destructive hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(record)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit Payroll Record' : 'Add Payroll Record'}</DialogTitle>
            <DialogDescription>
              {editingRecord ? 'Update the payroll record details' : 'Create a new payroll entry'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Worker *</Label>
                <Select
                  value={formData.worker_id.toString()}
                  onValueChange={(value) => setFormData({ ...formData, worker_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select worker" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers?.filter((worker: any) => worker.id != null).map((worker: any) => (
                      <SelectItem key={worker.id} value={worker.id.toString()}>
                        {worker.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Farm *</Label>
                <Select
                  value={formData.farm_id.toString()}
                  onValueChange={(value) => setFormData({ ...formData, farm_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms?.filter((farm: any) => farm.id != null).map((farm: any) => (
                      <SelectItem key={farm.id} value={farm.id.toString()}>
                        {farm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Task Code *</Label>
                <Input
                  required
                  value={formData.task_code}
                  onChange={(e) => setFormData({ ...formData, task_code: e.target.value })}
                  placeholder="e.g., PICK, PRUNE"
                />
              </div>

              <div className="space-y-2">
                <Label>Date Worked *</Label>
                <Input
                  type="date"
                  required
                  value={formData.date_worked}
                  onChange={(e) => setFormData({ ...formData, date_worked: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  required
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Rate (USD) *</Label>
                <Input
                  type="number"
                  required
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingRecord(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingRecord ? 'Update' : 'Create'} Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
