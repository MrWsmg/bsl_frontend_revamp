"use client";

// Manager Inter-Farm Section
// Shows inter-farm internal transfers — view-only list of all transfers between farms.
import React, { useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Truck, ArrowRight, MapPin, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  dispatched: 'bg-blue-100 text-blue-800 border-blue-200',
  received:   'bg-green-100 text-green-800 border-green-200',
  cancelled:  'bg-gray-100 text-gray-600 border-gray-200',
};

export const ManagerInterFarmSection: React.FC = () => {
  const getTransfers = useCallback(() => apiService.getInternalTransfers(), []);
  const { data: transfers, loading, refetch } = useApi(getTransfers);
  const list = Array.isArray(transfers) ? transfers : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="w-5 h-5 text-blue-600" />
              Inter-Farm Transfers
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            All stock transfers between farms. GINs created for stock-out and GRNs for stock-in at the destination farm.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : list.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No inter-farm transfers found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">Transfer</TableHead>
                  <TableHead className="text-xs">Route</TableHead>
                  <TableHead className="text-xs">Items</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((t: any) => (
                  <TableRow key={t.id} className="hover:bg-blue-50/30">
                    <TableCell>
                      <span className="font-mono text-xs bg-blue-50 border border-blue-200 text-blue-800 px-1.5 py-0.5 rounded">
                        TRF-{String(t.id).padStart(4, '0')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-800">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate max-w-[100px]">
                          {t.source_farm?.name ?? t.source_farm_name ?? `Farm #${t.source_farm_id}`}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate max-w-[100px]">
                          {t.destination_farm?.name ?? t.destination_farm_name ?? `Farm #${t.destination_farm_id}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {t.notes ?? '—'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[t.status?.toLowerCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {(t.status ?? 'unknown').replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
