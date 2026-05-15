import { BaseApiService } from './base';
import { AttendanceRecord, FaceVerificationResult } from '../../types';
import type { AttendanceReportResponse, AttendanceResponse } from '../../types/farm-clerk';

/** Returns today's date as YYYY-MM-DD in the browser's LOCAL timezone, not UTC. */
function localDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'sick';

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
  check_out_time?: string;
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
    check_out_time,
    status = 'present',
    notes,
  }: ManualCheckInParams): Promise<AttendanceRecord> {
    const today = localDateString();
    return this.post<AttendanceRecord>(`/workers/${worker_id}/check-in`, {
      farm_id,
      date: date || today,
      check_in_time: check_in_time || new Date().toISOString(),
      check_out_time,
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
    skip?: number;
    limit?: number;
  }): Promise<AttendanceRecord[]> {
    return this.get<AttendanceRecord[]>('/supervisor/attendance', filters);
  }

  /**
   * Get single attendance record — GET /supervisor/attendance/{id}
   */
  async getAttendanceById(attendanceId: number): Promise<AttendanceRecord> {
    return this.get<AttendanceRecord>(`/supervisor/attendance/${attendanceId}`);
  }

  /**
   * Get today's attendance for a farm — reuses getSupervisorAttendance with today's date
   */
  async getTodayAttendance(farmId: number): Promise<AttendanceRecord[]> {
    const today = localDateString();
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

  /**
   * List attendance records with filters — GET /supervisor/attendance
   */
  async getAttendanceRecords(params?: Record<string, any>): Promise<AttendanceResponse[]> {
    return this.get<AttendanceResponse[]>('/supervisor/attendance', params);
  }

  /**
   * Update an attendance record — PUT /supervisor/attendance/{id}
   */
  async updateAttendance(attendanceId: number, data: Record<string, unknown>): Promise<AttendanceResponse> {
    return this.put<AttendanceResponse>(`/supervisor/attendance/${attendanceId}`, data);
  }

  /**
   * Delete an attendance record — DELETE /supervisor/attendance/{id}
   */
  async deleteAttendance(attendanceId: number): Promise<void> {
    return this.delete<void>(`/supervisor/attendance/${attendanceId}`);
  }

  /**
   * Records pending supervisor review (face failed, not yet approved/rejected)
   * GET /supervisor/attendance/pending-review
   */
  async getPendingReview(farmId?: number): Promise<AttendanceRecord[]> {
    return this.get<AttendanceRecord[]>('/supervisor/attendance/pending-review', farmId ? { farm_id: farmId } : undefined);
  }

  /**
   * Approve or reject a manually recorded attendance
   * POST /supervisor/attendance/{id}/review?approved=true|false
   */
  async reviewAttendance(attendanceId: number, approved: boolean, notes?: string): Promise<{ success: boolean; message: string; supervisor_approved: boolean }> {
    const params = new URLSearchParams({ approved: String(approved) });
    if (notes) params.set('notes', notes);
    return this.post(`/supervisor/attendance/${attendanceId}/review?${params}`, {});
  }
}
