"use client";

import React, { useState, useCallback } from 'react';
import { Package, RefreshCw, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '@/hooks';
import apiService from '@/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { IssuanceCard } from './IssuanceCard';
import type { PendingIssuance, IssuanceStatus } from '@/types/farm-clerk';
import type { Farm } from '@/types';

interface PendingIssuancesProps {
  farms: Farm[];
  isSupervisor?: boolean;
}

export const PendingIssuances: React.FC<PendingIssuancesProps> = ({ farms, isSupervisor = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [preparingId, setPreparingId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const getPendingIssuances = useCallback(() => apiService.getPendingIssuances(), []);
  const { data: issuances, loading, error, refetch } = useApi<PendingIssuance[]>(getPendingIssuances);

  const filteredIssuances = (issuances || []).filter((issuance) => {
    const matchesSearch =
      issuance.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issuance.requester_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issuance.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePrepare = async (id: number) => {
    setPreparingId(id);
    try {
      await apiService.prepareIssuance(id);
      toast.success('Issuance marked as prepared');
      refetch();
    } catch (error) {
      toast.error('Failed to prepare issuance');
      console.error('Prepare error:', error);
    } finally {
      setPreparingId(null);
    }
  };

  const handleConfirm = async (id: number) => {
    setConfirmingId(id);
    try {
      await apiService.confirmIssuance(id);
      toast.success('Issuance confirmed');
      refetch();
    } catch (error) {
      toast.error('Failed to confirm issuance');
      console.error('Confirm error:', error);
    } finally {
      setConfirmingId(null);
    }
  };

  // Group issuances by status
  const groupedIssuances = {
    approved: filteredIssuances.filter((i) => i.status === 'approved'),
    prepared: filteredIssuances.filter((i) => i.status === 'prepared'),
    confirmed: filteredIssuances.filter((i) => i.status === 'confirmed'),
    dispatched: filteredIssuances.filter((i) => i.status === 'dispatched'),
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            <p>Failed to load pending issuances</p>
            <Button variant="outline" onClick={refetch} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Ready to Prepare</p>
            <p className="text-2xl font-bold text-orange-600">{groupedIssuances.approved.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Awaiting Confirmation</p>
            <p className="text-2xl font-bold text-blue-600">{groupedIssuances.prepared.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Ready for Dispatch</p>
            <p className="text-2xl font-bold text-green-600">{groupedIssuances.confirmed.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Dispatched</p>
            <p className="text-2xl font-bold text-gray-600">{groupedIssuances.dispatched.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Issuances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by item or requester..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="prepared">Prepared</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Issuance List */}
      {filteredIssuances.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No Pending Issuances</h3>
              <p className="text-muted-foreground mt-2">
                There are no issuances matching your filters
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredIssuances.map((issuance) => (
            <IssuanceCard
              key={issuance.id}
              issuance={issuance}
              onPrepare={handlePrepare}
              onConfirm={handleConfirm}
              preparing={preparingId === issuance.id}
              confirming={confirmingId === issuance.id}
              isSupervisor={isSupervisor}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingIssuances;
