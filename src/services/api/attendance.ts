import { BaseApiService } from './base';
import { AttendanceRecord, FaceVerificationResult } from '../../types';
import type { AttendanceReportResponse, AttendanceResponse } from '../../types/farm-clerk';

// ── Combined check-in + task assignment ───────────────────────────────────────

export interface CheckinAndAssignParams {
  farm_id: number;
  date: string;                    // YYYY-MM-DD
  check_in_time?: string;          // ISO datetime — defaults to server utcnow()
  notes?: string;                  // attendance notes
  task_code: string;
  block_id: number;
  crop_type?: string;
  quantity: number;
  rate: number;
  payment_method?: 'per_task' | 'per_day';
  task_notes?: string;
}

export interface CheckinAndAssignResult {
  attendance_id: number;
  task_id: number;
  worker_id: number;
  worker_name: string;
  farm_id: number;
  check_in_time: string;
  task_code: string;
  block: string;
  block_id: number;
  quantity: number;
  rate: number;
  total_amount: number;
  payment_method: string;
  date_worked: string;
  status: string;
}

// ── Combined check-in + face verification + task assignment (multipart) ────────

export interface CheckinAssignWithFaceParams {
  file: File;
  farm_id: number;
  date_worked: string;           // YYYY-MM-DD
  task_code: string;
  block_id: number;
  quantity: number;
  rate: number;
  payment_method?: 'per_task' | 'per_day';
  notes?: string;
  task_notes?: string;
  crop_type?: string;
}

export interface CheckinAssignWithFaceResult extends CheckinAndAssignResult {
  face_verified: boolean;
  face_verification_status: 'verified' | 'failed' | 'manual';
  confidence: number;
  needs_review: boolean;
  verification_photo_url?: string;
}

/** Returns today's date as YYYY-MM-DD in the browser's LOCAL timezone, not UTC. */
function localDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'sick';

export interface CheckInParams {
  worker_id: number;
  farm_id: number;
  block_id?: number;
  file: File;
  // GPS — TEMPORARILY DISABLED
  // latitude?: number;
  // longitude?: number;
  // gps_accuracy?: number;
  status?: AttendanceStatus;
  notes?: string;
}

export interface CheckOutParams {
  worker_id: number;
  farm_id: number;
  file: File;
  // GPS — TEMPORARILY DISABLED
  // latitude?: number;
  // longitude?: number;
  // gps_accuracy?: number;
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
    block_id,
    file,
    // GPS — TEMPORARILY DISABLED
    // latitude,
    // longitude,
    // gps_accuracy,
    status = 'present',
    notes,
  }: CheckInParams): Promise<FaceVerificationResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('worker_id', String(worker_id));
    formData.append('farm_id', String(farm_id));
    if (block_id != null) formData.append('block_id', String(block_id));
    // GPS fields — TEMPORARILY DISABLED
    // if (latitude != null) formData.append('latitude', String(latitude));
    // if (longitude != null) formData.append('longitude', String(longitude));
    // if (gps_accuracy != null) formData.append('gps_accuracy', String(gps_accuracy));
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
    // GPS — TEMPORARILY DISABLED
    // latitude,
    // longitude,
    // gps_accuracy,
    notes,
  }: CheckOutParams): Promise<FaceVerificationResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('worker_id', String(worker_id));
    formData.append('farm_id', String(farm_id));
    // GPS fields — TEMPORARILY DISABLED
    // if (latitude != null) formData.append('latitude', String(latitude));
    // if (longitude != null) formData.append('longitude', String(longitude));
    // if (gps_accuracy != null) formData.append('gps_accuracy', String(gps_accuracy));
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
   * Replace check-in and/or check-out photos on an attendance record.
   * PATCH /supervisor/attendance/{id}/update-photos (multipart form)
   */
  async updateAttendancePhotos(
    attendanceId: number,
    photos: { verification_photo?: File; checkout_photo?: File }
  ): Promise<AttendanceResponse> {
    const formData = new FormData();
    if (photos.verification_photo) {
      formData.append('verification_photo', photos.verification_photo);
    }
    if (photos.checkout_photo) {
      formData.append('checkout_photo', photos.checkout_photo);
    }
    return this.patch<AttendanceResponse>(
      `/supervisor/attendance/${attendanceId}/update-photos`,
      formData
    );
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

  /**
   * Combined check-in + task assignment (atomic) —
   * POST /supervisor/workers/{worker_id}/checkin-and-assign
   *
   * Replaces the old two-step pattern:
   *   POST /workers/{id}/check-in  →  POST /supervisor/workers/{id}/assign-task
   */
  async checkinAndAssign(
    workerId: number,
    params: CheckinAndAssignParams,
  ): Promise<CheckinAndAssignResult> {
    return this.post<CheckinAndAssignResult>(
      `/supervisor/workers/${workerId}/checkin-and-assign`,
      params,
    );
  }

  /**
   * Combined check-in + face verification + task assignment (multipart).
   * POST /supervisor/workers/{workerId}/checkin-assign-with-face
   *
   * Sends photo as multipart/form-data alongside all task fields.
   * Face verification is best-effort on the backend — never blocks the operation.
   */
  async checkinAssignWithFace(
    workerId: number,
    params: CheckinAssignWithFaceParams,
  ): Promise<CheckinAssignWithFaceResult> {
    const fd = new FormData();
    fd.append('file', params.file);
    fd.append('farm_id', String(params.farm_id));
    fd.append('date_worked', params.date_worked);
    fd.append('task_code', params.task_code);
    fd.append('block_id', String(params.block_id));
    fd.append('quantity', String(params.quantity));
    fd.append('rate', String(params.rate));
    fd.append('payment_method', params.payment_method ?? 'per_task');
    if (params.notes)      fd.append('notes', params.notes);
    if (params.task_notes) fd.append('task_notes', params.task_notes);
    if (params.crop_type)  fd.append('crop_type', params.crop_type);
    return this.post<CheckinAssignWithFaceResult>(
      `/supervisor/workers/${workerId}/checkin-assign-with-face`,
      fd,
    );
  }
}
