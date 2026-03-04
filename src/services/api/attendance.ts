import { BaseApiService } from './base';
import { AttendanceRecord, FaceVerificationResult } from '../../types';
import type { AttendanceReportResponse } from '../../types/farm-clerk';

export interface ManualAttendanceParams {
  worker_id: number;
  farm_id: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  check_in_time?: string;
  notes?: string;
}

export interface CheckInParams {
  worker_id: number;
  farm_id: number;
  file: File;
  status?: 'present' | 'absent' | 'leave' | 'sick';
  notes?: string;
}

export interface ManualCheckInParams {
  worker_id: number;
  farm_id: number;
  status?: 'present' | 'absent' | 'leave' | 'sick';
  notes?: string;
}

export class AttendanceApiService extends BaseApiService {
  /**
   * Check in attendance with face verification
   */
  async checkInWithFaceVerification({
    worker_id,
    farm_id,
    file,
    status = 'present',
    notes
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
   * Manual check-in without face verification
   */
  async manualCheckIn(params: ManualCheckInParams): Promise<AttendanceRecord> {
    return this.post<AttendanceRecord>('/supervisor/attendance/manual-checkin', params);
  }

  /**
   * Get attendance records for a supervisor
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
   * Get today's attendance for a farm
   */
  async getTodayAttendance(farmId: number): Promise<AttendanceRecord[]> {
    return this.get<AttendanceRecord[]>(`/supervisor/attendance/today/${farmId}`);
  }

  /**
   * Checkout with face verification
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
   * Manual checkout without face verification
   */
  async manualCheckOut(params: ManualCheckInParams): Promise<AttendanceRecord> {
    return this.post<AttendanceRecord>('/supervisor/attendance/manual-checkout', params);
  }

  /**
   * Phase 3 — Manual attendance entry with date/time (backdated or no-camera fallback)
   */
  async createManualAttendance(params: ManualAttendanceParams): Promise<AttendanceRecord> {
    return this.post<AttendanceRecord>('/supervisor/attendance', params);
  }

  /**
   * Phase 5 — Daily attendance report for a farm
   */
  async getAttendanceReport(farmId: number, reportDate: string): Promise<AttendanceReportResponse> {
    return this.get<AttendanceReportResponse>(`/supervisor/attendance/report/${farmId}`, { report_date: reportDate });
  }
}
