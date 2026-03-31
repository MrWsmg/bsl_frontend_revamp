"use client";

import React, { useState, useCallback } from 'react';
import { Package, Search, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';
import { useApi } from '@/hooks';
import apiService from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import type { YtdStockItem, YtdStockResponse } from '@/types/farm-clerk';
import type { Farm } from '@/types';

interface YtdStockProps {
  farms: Farm[];
}

export const YtdStock: React.FC<YtdStockProps> = ({ farms }) => {
  const [selectedFarmId, setSelectedFarmId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getYtdStock = useCallback(() => {
    const farmId = selectedFarmId !== 'all' ? parseInt(selectedFarmId) : undefined;
    return apiService.getYtdStock(farmId);
  }, [selectedFarmId]);

  const { data: stockData, loading, error, refetch } = useApi<YtdStockResponse>(getYtdStock, {
    dependencies: [selectedFarmId],
  });

  const filteredItems = stockData?.items?.filter((item: YtdStockItem) =>
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.accounting_code?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getBudgetStatus = (percentage?: number) => {
    if (percentage === undefined) return { variant: 'outline' as const, label: 'N/A' };
    if (percentage >= 90) return { variant: 'destructive' as const, label: 'Critical' };
    if (percentage >= 75) return { variant: 'secondary' as const, label: 'Warning' };
    return { variant: 'default' as const, label: 'Normal' };
  };

  const getProgressColor = (percentage?: number) => {
    if (percentage === undefined) return 'bg-gray-300';
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
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
            <p>Failed to load YTD stock data</p>
            <Button variant="outline" onClick={refetch} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = stockData?.summary;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-3xl font-bold text-blue-600">{summary?.total_items || 0}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Budget Allocated</p>
                <p className="text-2xl font-bold text-green-600">
                  TZS {(summary?.total_budget_allocated || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget Used</p>
                <p className="text-2xl font-bold text-orange-600">
                  TZS {(summary?.total_budget_used || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget Remaining</p>
                <p className="text-2xl font-bold text-purple-600">
                  TZS {(summary?.total_budget_remaining || 0).toLocaleString()}
                </p>
              </div>
            </div>
            {summary?.overall_budget_percentage !== undefined && (
              <div className="mt-3">
                <Progress
                  value={summary.overall_budget_percentage}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.overall_budget_percentage.toFixed(1)}% used
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Year-to-Date Stock Summary</CardTitle>
          <CardDescription>
            Stock movements and budget comparison for {stockData?.year || new Date().getFullYear()}
          </CardDescription>
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
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Opening</TableHead>
                    <TableHead className="text-right">Total In</TableHead>
                    <TableHead className="text-right">Total Out</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead>Budget Usage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item: YtdStockItem) => {
                    const budgetStatus = getBudgetStatus(item.budget_percentage);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {item.category || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{item.opening_balance}</TableCell>
                        <TableCell className="text-right text-green-600">+{item.total_in}</TableCell>
                        <TableCell className="text-right text-red-600">-{item.total_out}</TableCell>
                        <TableCell className="text-right font-medium">{item.current_balance}</TableCell>
                        <TableCell>
                          {item.budget_allocated !== undefined ? (
                            <div className="w-32">
                              <div className="flex justify-between text-xs mb-1">
                                <span>TZS {(item.budget_used || 0).toLocaleString()}</span>
                                <span className="text-muted-foreground">
                                  {item.budget_percentage?.toFixed(0)}%
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${getProgressColor(item.budget_percentage)}`}
                                  style={{ width: `${Math.min(item.budget_percentage || 0, 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.budget_percentage !== undefined && item.budget_percentage >= 90 && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <Badge variant={budgetStatus.variant}>
                              {budgetStatus.label}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default YtdStock;
