"use client";

// Payroll Records Section — browser with status filter + detail modal, create/edit form with all fields
import React, { useState, useCallback, useMemo } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { PayrollRecord } from '../../../types';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { StatusBadge } from '../../common/StatusBadge';
import { Plus, Edit, Check, X, Calendar, Eye } from 'lucide-react';
import { toast } from '../../ui/sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

// Common task codes used on the farm
const TASK_CODES = [
  'PICK', 'PRUNE', 'WEED', 'SPRAY', 'FERTILISE', 'HARVEST',
  'TRANSPORT', 'IRRIGATE', 'PLANT', 'DIG', 'CARRY', 'SORT', 'OTHER',
];

interface PayrollFormData {
  worker_id: number;
  farm_id: number;
  task_code: string;
  worker_type: 'permanent' | 'contracted';
  block: string;
  payment_method: 'per_task' | 'per_day';
  quantity: number;
  rate: number;
  date_worked: string;
  notes?: string;
}

const DEFAULT_FORM: PayrollFormData = {
  worker_id: 0,
  farm_id: 0,
  task_code: '',
  worker_type: 'permanent',
  block: '',
  payment_method: 'per_task',
  quantity: 0,
  rate: 0,
  date_worked: new Date().toISOString().split('T')[0],
};

export const PayrollRecordsSection: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [detailRecord, setDetailRecord] = useState<PayrollRecord | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PayrollFormData>(DEFAULT_FORM);

  const getFarms = useCallback(() => apiService.getPayrollFarms(), []);
  const getWorkers = useCallback(() => apiService.getWorkers(), []);
  const getPayrollRecords = useCallback(() => {
    const params: Record<string, any> = {};
    if (selectedFarm !== 'all') params.farm_id = parseInt(selectedFarm);
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return apiService.getPayrollRecords(params);
  }, [selectedFarm, startDate, endDate]);

  const { data: farms } = useApi(getFarms);
  const { data: workers } = useApi(getWorkers);
  const { data: records, loading, refetch } = useApi(getPayrollRecords);

  // Client-side status filter
  const filteredRecords = useMemo(() => {
    if (!records) return [];
    if (selectedStatus === 'all') return records;
    return records.filter((r: PayrollRecord) => r.approval_status === selectedStatus);
  }, [records, selectedStatus]);

  const stats = useMemo(() => {
    if (!records?.length) return { total: 0, pending: 0, approved: 0, amount: 0 };
    return {
      total: records.length,
      pending: records.filter((r: PayrollRecord) => r.approval_status === 'supervisor_pending' || r.approval_status === 'pending').length,
      approved: records.filter((r: PayrollRecord) => r.approval_status === 'approved').length,
      amount: records.reduce((sum: number, r: PayrollRecord) => sum + (r.total_amount || 0), 0),
    };
  }, [records]);

  const calculatedTotal = useMemo(
    () => (formData.quantity || 0) * (formData.rate || 0),
    [formData.quantity, formData.rate]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, total_amount: calculatedTotal };
    try {
      if (editingRecord) {
        await apiService.updatePayrollRecord(editingRecord.id, payload);
        toast.success('Payroll record updated');
      } else {
        await apiService.createPayrollRecord(payload);
        toast.success('Payroll record created');
      }
      setShowCreateModal(false);
      setEditingRecord(null);
      setFormData(DEFAULT_FORM);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save payroll record');
    }
  };

  const handleApprove = async (recordId: number) => {
    setProcessingId(recordId);
    try {
      await apiService.approvePayrollRecord(recordId);
      toast.success('Record approved');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve record');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (recordId: number) => {
    setProcessingId(recordId);
    try {
      await apiService.rejectPayrollRecord(recordId);
      toast.success('Record rejected');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject record');
    } finally {
      setProcessingId(null);
    }
  };

  const openEdit = (record: PayrollRecord) => {
    setEditingRecord(record);
    setFormData({
      worker_id: (record as any).worker_id ?? 0,
      farm_id: (record as any).farm_id ?? 0,
      task_code: record.task_code || '',
      worker_type: record.worker_type || 'permanent',
      block: record.block || '',
      payment_method: record.payment_method || 'per_task',
      quantity: record.quantity,
      rate: record.rate,
      date_worked: record.date_worked?.split('T')[0] || '',
      notes: (record as any).notes || '',
    });
    setShowCreateModal(true);
  };

  const clearFilters = () => {
    setSelectedFarm('all');
    setSelectedStatus('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
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
            <p className="text-xl font-bold mt-1">TZS {stats.amount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter by farm, status, and date range</CardDescription>
          </div>
          <Button onClick={() => { setFormData(DEFAULT_FORM); setEditingRecord(null); setShowCreateModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Record
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Farm</Label>
              <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                <SelectTrigger><SelectValue placeholder="All Farms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Farms</SelectItem>
                  {farms?.filter((f: any) => f.id != null).map((f: any) => (
                    <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="supervisor_pending">Supervisor Pending</SelectItem>
                  <SelectItem value="manager_approved">Manager Approved</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={clearFilters}>Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Records</CardTitle>
          <CardDescription>{filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12"><LoadingSpinner size="lg" /></div>
          ) : filteredRecords.length === 0 ? (
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
                    <TableHead>Block</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record: PayrollRecord) => (
                    <TableRow
                      key={record.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setDetailRecord(record)}
                    >
                      <TableCell className="font-medium">{record.worker_name}</TableCell>
                      <TableCell>{(record as any).farm_name || record.farm?.name || '—'}</TableCell>
                      <TableCell>{record.task_code}</TableCell>
                      <TableCell>{record.block || '—'}</TableCell>
                      <TableCell>{record.quantity}</TableCell>
                      <TableCell>TZS {record.rate?.toLocaleString()}</TableCell>
                      <TableCell className="font-semibold">TZS {(record.total_amount || 0).toLocaleString()}</TableCell>
                      <TableCell>{new Date(record.date_worked + 'T00:00:00').toLocaleDateString()}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <StatusBadge status={record.approval_status || 'pending'} />
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setDetailRecord(record)} title="View detail">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(record.approval_status === 'pending' || record.approval_status === 'supervisor_pending') && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleApprove(record.id)}
                                disabled={processingId === record.id} className="text-green-600 hover:bg-green-50">
                                {processingId === record.id ? <LoadingSpinner size="sm" /> : <Check className="w-4 h-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleReject(record.id)}
                                disabled={processingId === record.id} className="text-destructive hover:bg-red-50">
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEdit(record)} title="Edit">
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

      {/* Detail Modal */}
      <Dialog open={!!detailRecord} onOpenChange={(open) => { if (!open) setDetailRecord(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Payroll Record Detail</DialogTitle>
          </DialogHeader>
          {detailRecord && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Worker</span><p className="font-medium">{detailRecord.worker_name}</p></div>
                <div><span className="text-muted-foreground">Worker Type</span><p className="font-medium capitalize">{detailRecord.worker_type || '—'}</p></div>
                <div><span className="text-muted-foreground">Farm</span><p className="font-medium">{(detailRecord as any).farm_name || detailRecord.farm?.name || '—'}</p></div>
                <div><span className="text-muted-foreground">Block</span><p className="font-medium">{detailRecord.block || '—'}</p></div>
                <div><span className="text-muted-foreground">Task Code</span><p className="font-medium">{detailRecord.task_code}</p></div>
                <div><span className="text-muted-foreground">Payment Method</span><p className="font-medium capitalize">{detailRecord.payment_method?.replace('_', ' ') || '—'}</p></div>
                <div><span className="text-muted-foreground">Quantity</span><p className="font-medium">{detailRecord.quantity}</p></div>
                <div><span className="text-muted-foreground">Rate</span><p className="font-medium">TZS {detailRecord.rate?.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Total Amount</span><p className="font-semibold text-base">TZS {(detailRecord.total_amount || 0).toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Date Worked</span><p className="font-medium">{new Date(detailRecord.date_worked + 'T00:00:00').toLocaleDateString()}</p></div>
                <div><span className="text-muted-foreground">Status</span><p><StatusBadge status={detailRecord.approval_status || 'pending'} /></p></div>
                {detailRecord.entered_by && <div><span className="text-muted-foreground">Entered By</span><p className="font-medium">{detailRecord.entered_by}</p></div>}
              </div>
              {detailRecord.rejection_reason && (
                <div className="p-3 bg-red-50 rounded border border-red-200">
                  <p className="text-sm font-medium text-red-700">Rejection Reason</p>
                  <p className="text-sm text-red-600 mt-1">{detailRecord.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailRecord(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog open={showCreateModal} onOpenChange={(open) => { if (!open) { setShowCreateModal(false); setEditingRecord(null); setFormData(DEFAULT_FORM); } }}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit Payroll Record' : 'Add Payroll Record'}</DialogTitle>
            <DialogDescription>{editingRecord ? 'Update the payroll record details' : 'Create a new payroll entry'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">

              {/* Worker */}
              <div className="space-y-2">
                <Label>Worker *</Label>
                <Select value={formData.worker_id ? formData.worker_id.toString() : ''}
                  onValueChange={(v) => setFormData({ ...formData, worker_id: parseInt(v) })}>
                  <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                  <SelectContent>
                    {workers?.filter((w: any) => w.id != null).map((w: any) => (
                      <SelectItem key={w.id} value={w.id.toString()}>{w.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Worker Type */}
              <div className="space-y-2">
                <Label>Worker Type *</Label>
                <Select value={formData.worker_type}
                  onValueChange={(v) => setFormData({ ...formData, worker_type: v as 'permanent' | 'contracted' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="contracted">Contracted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Farm */}
              <div className="space-y-2">
                <Label>Farm *</Label>
                <Select value={formData.farm_id ? formData.farm_id.toString() : ''}
                  onValueChange={(v) => setFormData({ ...formData, farm_id: parseInt(v) })}>
                  <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                  <SelectContent>
                    {farms?.filter((f: any) => f.id != null).map((f: any) => (
                      <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Block */}
              <div className="space-y-2">
                <Label>Block</Label>
                <Input value={formData.block} onChange={(e) => setFormData({ ...formData, block: e.target.value })} placeholder="e.g. A1, B3 (optional)" />
              </div>

              {/* Task Code */}
              <div className="space-y-2">
                <Label>Task Code *</Label>
                <Select value={formData.task_code}
                  onValueChange={(v) => setFormData({ ...formData, task_code: v })}>
                  <SelectTrigger><SelectValue placeholder="Select task" /></SelectTrigger>
                  <SelectContent>
                    {TASK_CODES.map((code) => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select value={formData.payment_method}
                  onValueChange={(v) => setFormData({ ...formData, payment_method: v as 'per_task' | 'per_day' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_task">Per Task</SelectItem>
                    <SelectItem value="per_day">Per Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Worked */}
              <div className="space-y-2">
                <Label>Date Worked *</Label>
                <Input type="date" required value={formData.date_worked}
                  onChange={(e) => setFormData({ ...formData, date_worked: e.target.value })} />
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input type="number" required step="0.01" min="0" value={formData.quantity || ''}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00" />
              </div>

              {/* Rate */}
              <div className="space-y-2">
                <Label>Rate (TZS) *</Label>
                <Input type="number" required step="0.01" min="0" value={formData.rate || ''}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00" />
              </div>

              {/* Total Amount (read-only) */}
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <Input readOnly value={`TZS ${calculatedTotal.toLocaleString()}`}
                  className="bg-muted cursor-not-allowed font-semibold" />
              </div>

            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..." rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowCreateModal(false); setEditingRecord(null); setFormData(DEFAULT_FORM); }}>
                Cancel
              </Button>
              <Button type="submit">{editingRecord ? 'Update' : 'Create'} Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
