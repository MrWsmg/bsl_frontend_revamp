"use client";

import { useState, useCallback } from 'react';
import { UserCheck, Upload, RefreshCw, Filter } from 'lucide-react';
import { AttendanceCheckInForm } from '../../attendance/AttendanceCheckInForm';
import { WorkerPhotoUploadModal } from '../../attendance/WorkerPhotoUploadModal';
import { AttendanceRecordsTable } from '../../attendance/AttendanceRecordsTable';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';

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
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Record attendance with face verification
          </p>
        </div>
        <button
          onClick={() => setShowPhotoUploadModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Upload className="w-5 h-5" />
          Register Worker Faces
        </button>
      </div>

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
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
            <button
              onClick={() => refetchAttendance()}
              disabled={loadingAttendance}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loadingAttendance ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Filters</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farm
                </label>
                <select
                  value={filters.farm_id}
                  onChange={(e) => setFilters({ ...filters, farm_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Farms</option>
                  {farms?.map((farm: any, index: number) => (
                    <option key={farm.id ?? `farm-${index}`} value={farm.id}>
                      {farm.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                  <option value="sick">Sick</option>
                </select>
              </div>
            </div>
          </div>

          {/* Records Table */}
          {loadingAttendance ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <AttendanceRecordsTable
              records={attendanceRecords || []}
              showVerificationDetails={true}
            />
          )}
        </div>
      )}

      {/* Worker Photo Upload Modal */}
      <WorkerPhotoUploadModal
        isOpen={showPhotoUploadModal}
        onClose={() => setShowPhotoUploadModal(false)}
        workers={workers || []}
        onPhotoUploaded={handlePhotoUploaded}
      />
    </div>
  );
}
