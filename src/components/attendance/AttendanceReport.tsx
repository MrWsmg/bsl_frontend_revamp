"use client";

import React, { useState, useCallback } from 'react';
import { Users, UserCheck, UserX, Calendar, RefreshCw, BarChart3 } from 'lucide-react';
import { useApi } from '@/hooks';
import apiService from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { Farm } from '@/types';
import type { AttendanceReportResponse } from '@/types/farm-clerk';

interface AttendanceReportProps {
  farms: Farm[];
}

export const AttendanceReport: React.FC<AttendanceReportProps> = ({ farms }) => {
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id.toString() || '');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const getAttendanceReport = useCallback(() => {
    if (!selectedFarmId) return Promise.resolve(null as unknown as AttendanceReportResponse);
    return apiService.getAttendanceReport(parseInt(selectedFarmId), selectedDate);
  }, [selectedFarmId, selectedDate]);

  const { data: report, loading, error, refetch } = useApi<AttendanceReportResponse | null>(getAttendanceReport, {
    dependencies: [selectedFarmId, selectedDate],
  });

  if (!selectedFarmId && farms.length > 0) {
    setSelectedFarmId(farms[0].id.toString());
  }

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
            <p>Failed to load attendance report</p>
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
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Daily Attendance Report
          </CardTitle>
          <CardDescription>View attendance summary for a specific date and farm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Farm</Label>
              <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={refetch}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!report ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Select a farm to view the report</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{report.total_workers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Present</p>
                    <p className="text-2xl font-bold text-green-600">{report.present_count}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Absent</p>
                    <p className="text-2xl font-bold text-red-600">{report.absent_count}</p>
                  </div>
                  <UserX className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Late</p>
                  <p className="text-2xl font-bold text-yellow-600">{report.late_count}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Half Day</p>
                  <p className="text-2xl font-bold text-orange-600">{report.half_day_count}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold text-primary">
                    {report.attendance_rate.toFixed(1)}%
                  </span>
                  <Badge
                    variant={
                      report.attendance_rate >= 90
                        ? 'default'
                        : report.attendance_rate >= 75
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {report.attendance_rate >= 90
                      ? 'Excellent'
                      : report.attendance_rate >= 75
                      ? 'Good'
                      : 'Needs Attention'}
                  </Badge>
                </div>
                <Progress value={report.attendance_rate} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {report.present_count} out of {report.total_workers} workers present
                  {report.total_hours_worked > 0 && ` · ${report.total_hours_worked.toFixed(1)} hrs total`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Summary footer */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Report for {report.farm_name} · {report.date}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AttendanceReport;
