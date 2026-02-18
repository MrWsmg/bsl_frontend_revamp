"use client";

import React, { useState, useCallback } from 'react';
import { Package, Search, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useApi } from '@/hooks';
import apiService from '@/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { DailyStockItem, DailyStockResponse } from '@/types/farm-clerk';
import type { Farm } from '@/types';

interface DailyStockProps {
  farms: Farm[];
}

export const DailyStock: React.FC<DailyStockProps> = ({ farms }) => {
  const [selectedFarmId, setSelectedFarmId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getDailyStock = useCallback(() => {
    const farmId = selectedFarmId !== 'all' ? parseInt(selectedFarmId) : undefined;
    return apiService.getDailyStock(farmId);
  }, [selectedFarmId]);

  const { data: stockData, loading, error, refetch } = useApi<DailyStockResponse>(getDailyStock, {
    dependencies: [selectedFarmId],
  });

  const filteredItems = stockData?.items?.filter((item: DailyStockItem) =>
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.accounting_code?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getCategoryBadgeVariant = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'chemicals':
        return 'destructive';
      case 'fertilizers':
        return 'default';
      case 'tools':
        return 'secondary';
      default:
        return 'outline';
    }
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
            <p>Failed to load daily stock data</p>
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-3xl font-bold text-blue-600">{stockData?.total_items || 0}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p className="text-xl font-bold">
                  {stockData?.date ? new Date(stockData.date).toLocaleDateString() : new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Farm</p>
                <p className="text-xl font-bold">{stockData?.farm_name || 'All Farms'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Stock Levels</CardTitle>
          <CardDescription>Current inventory levels for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select Farm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Farms</SelectItem>
                {farms.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id.toString()}>
                    {farm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-8 bg-muted/50 rounded-lg">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No stock items found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Accounting Code</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Last Movement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item: DailyStockItem) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>
                        {item.category && (
                          <Badge variant={getCategoryBadgeVariant(item.category)}>
                            {item.category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.accounting_code || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        {item.last_movement_date ? (
                          <div className="flex items-center gap-2">
                            {item.movement_type === 'in' ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">
                              {item.movement_quantity} on {new Date(item.last_movement_date).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
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

export default DailyStock;
