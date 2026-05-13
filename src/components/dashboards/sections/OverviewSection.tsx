"use client";

// Overview section component - shadcn patterns
import React, { useCallback } from 'react';
import { Warehouse, Users, BarChart3 } from 'lucide-react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const OverviewSection: React.FC = () => {
  const getFarms = useCallback(() => apiService.farms.getFarms(), []);
  const getUsers = useCallback(() => apiService.users.getUsers(), []);
  const getTotalArea = useCallback(() => apiService.activities.getAdminTotalArea(), []);

  const { data: farms, loading: farmsLoading } = useApi(getFarms);
  const { data: users, loading: usersLoading } = useApi(getUsers);
  const { data: totalArea, loading: areaLoading } = useApi(getTotalArea);

  const loading = farmsLoading || usersLoading || areaLoading;

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-8 bg-muted rounded w-1/2 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const farmsCount = farms?.length || 0;
  const activeUsersCount = users?.filter((u: any) => u.is_active).length || 0;
  const totalAreaValue = Math.round((totalArea?.totalArea || 0) * 10) / 10;

  const stats = [
    { title: 'Total Farms', value: farmsCount, icon: Warehouse, color: 'text-blue-600', bg: 'bg-blue-500' },
    { title: 'Active Users', value: activeUsersCount, icon: Users, color: 'text-green-600', bg: 'bg-green-500' },
    { title: 'Total Area', value: `${totalAreaValue} ha`, icon: BarChart3, color: 'text-yellow-600', bg: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className={`p-3 sm:p-4 rounded-xl ${stat.bg} text-white`}>
                  <stat.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div className="ml-4 sm:ml-5">
                  <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.title}</h3>
                  <p className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Farms Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farm Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Crops</TableHead>
                  <TableHead>Area (ha)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farms?.map((farm: any, index: number) => {
                  let crops: string[] = [];
                  try { crops = Array.isArray(farm.crops) ? farm.crops : JSON.parse(farm.crops ?? '[]'); } catch { crops = []; }
                  return (
                  <TableRow key={farm.farm_id ?? farm.id ?? index}>
                    <TableCell className="font-medium">{farm.name}</TableCell>
                    <TableCell>{farm.location}</TableCell>
                    <TableCell>{crops.join(', ') || '—'}</TableCell>
                    <TableCell>{Math.round((farm.total_area ?? 0) * 10) / 10}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                        Active
                      </Badge>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
