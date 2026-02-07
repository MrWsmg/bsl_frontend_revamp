"use client";

import { useState, useCallback } from 'react';
import { Upload, RefreshCw, Filter } from 'lucide-react';
import { AttendanceCheckInForm } from '../../attendance/AttendanceCheckInForm';
import { WorkerPhotoUploadModal } from '../../attendance/WorkerPhotoUploadModal';
import { AttendanceRecordsTable } from '../../attendance/AttendanceRecordsTable';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface SupervisorAttendanceSectionProps {
  showCheckIn?: boolean;
  showRecords?: boolean;
}

export function SupervisorAttendanceSection({
  showCheckIn = true,
  showRecords = true
}: SupervisorAttendanceSectionProps) {
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [filters, setFilters] = useState({
    farm_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    status: ''
  });

  // Fetch data
  const getWorkers = useCallback(() => apiService.getSupervisorWorkers(), []);
  const getFarms = useCallback(() => apiService.getFarms('supervisor'), []);
  const getAttendance = useCallback(() => {
    const params: any = {};
    if (filters.farm_id) params.farm_id = Number(filters.farm_id);
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (filters.status) params.status = filters.status;
    return apiService.attendance.getSupervisorAttendance(params);
  }, [filters]);

  const { data: workers, loading: loadingWorkers, refetch: refetchWorkers } = useApi(getWorkers);
  const { data: farms, loading: loadingFarms } = useApi(getFarms);
  const {
    data: attendanceRecords,
    loading: loadingAttendance,
    refetch: refetchAttendance
  } = useApi(getAttendance);

  // Handle successful check-in
  const handleCheckInSuccess = () => {
    refetchAttendance();
  };

  // Handle photo uploaded
  const handlePhotoUploaded = (workerId: number) => {
    refetchWorkers();
  };

  if (loadingWorkers || loadingFarms) {
    return (
      <section className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <hgroup>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Record attendance with face verification
          </p>
        </hgroup>
        <Button
          onClick={() => setShowPhotoUploadModal(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Upload className="w-5 h-5 mr-2" />
          Register Worker Faces
        </Button>
      </header>

      {/* Check-in Form */}
      {showCheckIn && (
        <AttendanceCheckInForm
          workers={workers || []}
          farms={farms || []}
          onCheckInSuccess={handleCheckInSuccess}
        />
      )}

      {/* Attendance Records */}
      {showRecords && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Attendance Records</CardTitle>
            <Button
              variant="secondary"
              onClick={() => refetchAttendance()}
              disabled={loadingAttendance}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingAttendance ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters */}
            <fieldset className="bg-muted/50 rounded-lg p-4">
              <legend className="flex items-center gap-2 mb-4 font-medium text-gray-900">
                <Filter className="w-5 h-5 text-gray-600" />
                Filters
              </legend>
              <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <fieldset>
                  <label htmlFor="farm-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Farm
                  </label>
                  <Select
                    value={filters.farm_id || undefined}
                    onValueChange={(value) => setFilters({ ...filters, farm_id: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger id="farm-filter">
                      <SelectValue placeholder="All Farms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Farms</SelectItem>
                      {farms?.filter((farm: any) => farm.id != null).map((farm: any) => (
                        <SelectItem key={farm.id} value={String(farm.id)}>
                          {farm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </fieldset>

                <fieldset>
                  <label htmlFor="start-date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <Input
                    id="start-date-filter"
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  />
                </fieldset>

                <fieldset>
                  <label htmlFor="end-date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <Input
                    id="end-date-filter"
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  />
                </fieldset>

                <fieldset>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Select
                    value={filters.status || undefined}
                    onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="leave">Leave</SelectItem>
                      <SelectItem value="sick">Sick</SelectItem>
                    </SelectContent>
                  </Select>
                </fieldset>
              </form>
            </fieldset>

            {/* Records Table */}
            {loadingAttendance ? (
              <output className="flex justify-center py-8">
                <LoadingSpinner />
              </output>
            ) : (
              <AttendanceRecordsTable
                records={attendanceRecords || []}
                showVerificationDetails={true}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Worker Photo Upload Modal */}
      <WorkerPhotoUploadModal
        isOpen={showPhotoUploadModal}
        onClose={() => setShowPhotoUploadModal(false)}
        workers={workers || []}
        onPhotoUploaded={handlePhotoUploaded}
      />
    </section>
  );
}
