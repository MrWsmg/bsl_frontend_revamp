"use client";

// Payroll Records Section — read-only view for Payroll Officer role
import React, { useState, useCallback, useMemo } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export const PayrollRecordsSection: React.FC = () => {
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Fetch data
  const getFarms = useCallback(() => apiService.getPayrollFarms(), []);

  const getPayrollRecords = useCallback(() => {
    const params: any = {};
    if (selectedFarm !== 'all') params.farm_id = parseInt(selectedFarm);
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return apiService.getPayrollRecords(params);
  }, [selectedFarm, startDate, endDate]);

  const { data: farms } = useApi(getFarms);
  const { data: records, loading } = useApi(getPayrollRecords);

  const stats = useMemo(() => {
    if (!records?.length) return { total: 0, pending: 0, approved: 0, amount: 0 };

    return {
      total: records.length,
      pending: records.filter((r: any) => r.approval_status === 'supervisor_pending' || r.approval_status === 'manager_approved').length,
      approved: records.filter((r: any) => r.approval_status === 'approved').length,
      amount: records.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0),
    };
  }, [records]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'supervisor_pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Supervisor</Badge>;
      case 'manager_approved':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Pending FC</Badge>;
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
            <p className="text-sm text-muted-foreground">Total Amount (TZS)</p>
            <p className="text-xl font-bold mt-1">{stats.amount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter payroll records by farm and date</CardDescription>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};
