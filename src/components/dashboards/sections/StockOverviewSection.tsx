"use client";

// Stock Overview Section - shadcn patterns
import React, { useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Package, TrendingUp, FileText, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export const StockOverviewSection: React.FC = () => {
  const getFarms = useCallback(() => apiService.getStockFarms(), []);
  const getWeeklySummary = useCallback(() => apiService.getStockWeeklySummary(), []);
  const getStockRecords = useCallback(() => apiService.getStockRecords(), []);

  const { data: farms, loading: farmsLoading } = useApi(getFarms);
  const { data: weeklySummary, loading: summaryLoading } = useApi(getWeeklySummary);
  const { data: records, loading: recordsLoading } = useApi(getStockRecords);

  const loading = farmsLoading || summaryLoading || recordsLoading;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalFarms = farms?.length || 0;
  const totalRecords = records?.length || 0;
  const weeklyRecords = weeklySummary?.total_records || 0;
  const lowStockItems = records?.filter((r: any) => r.quantity < 10).length || 0;

  const stats = [
    { title: 'Total Farms', value: totalFarms, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-500' },
    { title: 'Total Records', value: totalRecords, icon: Package, color: 'text-green-600', bg: 'bg-green-500' },
    { title: 'Weekly Records', value: weeklyRecords, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-500' },
    { title: 'Low Stock Items', value: lowStockItems, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-3 rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockItems > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have <strong>{lowStockItems}</strong> items with low stock levels. Please review and restock as needed.
          </AlertDescription>
        </Alert>
      )}

      {/* Farms List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Farms</CardTitle>
        </CardHeader>
        <CardContent>
          {!farms || farms.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No farms assigned</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {farms.map((farm: any) => (
                <Card key={farm.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-foreground">{farm.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{farm.location || 'No location'}</p>
                    {farm.area && (
                      <Badge variant="secondary" className="mt-2">
                        {farm.area} acres
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      {weeklySummary && (
        <Card>
          <CardHeader>
            <CardTitle>This Week Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                <p className="text-sm text-muted-foreground font-medium">Total Records</p>
                <p className="text-2xl font-bold text-blue-600">{weeklySummary.total_records || 0}</p>
              </div>
              <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                <p className="text-sm text-muted-foreground font-medium">Total Quantity</p>
                <p className="text-2xl font-bold text-green-600">{weeklySummary.total_quantity || 0}</p>
              </div>
              <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                <p className="text-sm text-muted-foreground font-medium">Unique Items</p>
                <p className="text-2xl font-bold text-purple-600">{weeklySummary.unique_items || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
