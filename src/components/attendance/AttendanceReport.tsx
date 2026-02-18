"use client";

import React, { useState, useCallback } from 'react';
import { Users, UserCheck, UserX, Clock, Calendar, RefreshCw, BarChart3, Download } from 'lucide-react';
import { useApi } from '@/hooks';
import apiService from '@/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
    if (!selectedFarmId) return Promise.resolve(null);
    return apiService.getAttendanceReport(parseInt(selectedFarmId), selectedDate);
  }, [selectedFarmId, selectedDate]);

  const { data: report, loading, error, refetch } = useApi<AttendanceReportResponse>(getAttendanceReport, {
    dependencies: [selectedFarmId, selectedDate],
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500';
      case 'absent':
        return 'bg-red-500';
      case 'half_day':
        return 'bg-yellow-500';
      case 'leave':
        return 'bg-blue-500';
      case 'sick':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
                    <p className="text-2xl font-bold text-green-600">{report.present}</p>
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
                    <p className="text-2xl font-bold text-red-600">{report.absent}</p>
                  </div>
                  <UserX className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Half Day</p>
                  <p className="text-2xl font-bold text-yellow-600">{report.half_day}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">On Leave</p>
                  <p className="text-2xl font-bold text-blue-600">{report.on_leave}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Sick</p>
                  <p className="text-2xl font-bold text-purple-600">{report.sick}</p>
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
                  {report.present} out of {report.total_workers} workers present
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Worker Details */}
          <Card>
            <CardHeader>
              <CardTitle>Worker Attendance Details</CardTitle>
              <CardDescription>Individual attendance status for {report.report_date}</CardDescription>
            </CardHeader>
            <CardContent>
              {report.details && report.details.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {report.details.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 p-3 rounded-lg border"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{getInitials(record.worker_name)}</AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(
                            record.status
                          )}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{record.worker_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {record.check_in_time && (
                            <>
                              <Clock className="h-3 w-3" />
                              <span>{new Date(record.check_in_time).toLocaleTimeString()}</span>
                            </>
                          )}
                          <Badge variant="outline" className="text-xs capitalize">
                            {record.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No attendance records for this date</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AttendanceReport;
