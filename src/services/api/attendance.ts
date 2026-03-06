import { BaseApiService } from './base';
import { AttendanceRecord, FaceVerificationResult } from '../../types';
import type { AttendanceReportResponse } from '../../types/farm-clerk';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day';

export interface CheckInParams {
  worker_id: number;
  farm_id: number;
  file: File;
  status?: AttendanceStatus;
  notes?: string;
}

export interface ManualCheckInParams {
  worker_id: number;
  farm_id: number;
  date?: string;
  check_in_time?: string;
  status?: AttendanceStatus;
  notes?: string;
}

export interface ManualCheckOutParams {
  worker_id: number;
  attendance_id: number;
  check_out_time?: string;
}

export class AttendanceApiService extends BaseApiService {
  /**
   * Check in with face verification — POST /supervisor/attendance/checkin
   */
  async checkInWithFaceVerification({
    worker_id,
    farm_id,
    file,
    status = 'present',
    notes,
  }: CheckInParams): Promise<FaceVerificationResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('worker_id', String(worker_id));
    formData.append('farm_id', String(farm_id));
    if (status) formData.append('status', status);
    if (notes) formData.append('notes', notes);
    return this.post<FaceVerificationResult>('/supervisor/attendance/checkin', formData);
  }

  /**
   * Manual check-in — POST /workers/{worker_id}/check-in
   */
  async manualCheckIn({
    worker_id,
    farm_id,
    date,
    check_in_time,
    status = 'present',
    notes,
  }: ManualCheckInParams): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0];
    return this.post<AttendanceRecord>(`/workers/${worker_id}/check-in`, {
      farm_id,
      date: date || today,
      check_in_time: check_in_time || new Date().toISOString(),
      status,
      notes,
    });
  }

  /**
   * Manual check-out — PUT /workers/{worker_id}/check-out/{attendance_id}?check_out_time=...
   */
  async manualCheckOut({
    worker_id,
    attendance_id,
    check_out_time,
  }: ManualCheckOutParams): Promise<AttendanceRecord> {
    const time = check_out_time || new Date().toISOString();
    const params = new URLSearchParams({ check_out_time: time });
    return this.put<AttendanceRecord>(`/workers/${worker_id}/check-out/${attendance_id}?${params}`);
  }

  /**
   * Get attendance records — GET /supervisor/attendance
   */
  async getSupervisorAttendance(filters?: {
    farm_id?: number;
    start_date?: string;
    end_date?: string;
    status?: string;
  }): Promise<AttendanceRecord[]> {
    return this.get<AttendanceRecord[]>('/supervisor/attendance', filters);
  }

  /**
   * Get today's attendance for a farm — reuses getSupervisorAttendance with today's date
   */
  async getTodayAttendance(farmId: number): Promise<AttendanceRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getSupervisorAttendance({ farm_id: farmId, start_date: today, end_date: today });
  }

  /**
   * Check out with face verification — POST /supervisor/attendance/checkout
   */
  async checkOutWithFaceVerification({
    worker_id,
    farm_id,
    file,
    notes,
  }: Omit<CheckInParams, 'status'>): Promise<FaceVerificationResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('worker_id', String(worker_id));
    formData.append('farm_id', String(farm_id));
    if (notes) formData.append('notes', notes);
    return this.post<FaceVerificationResult>('/supervisor/attendance/checkout', formData);
  }

  /**
   * Daily attendance report — GET /supervisor/attendance/report/{farm_id}?report_date=
   */
  async getAttendanceReport(farmId: number, reportDate: string): Promise<AttendanceReportResponse> {
    return this.get<AttendanceReportResponse>(`/supervisor/attendance/report/${farmId}`, { report_date: reportDate });
  }
}
