// Payroll API service
import { BaseApiService } from './base';
import { PayrollRecord, ActivityFilters, Farm } from '../../types';

export class PayrollApiService extends BaseApiService {
  /**
   * Get payroll farms
   */
  async getPayrollFarms(): Promise<Farm[]> {
    return this.get<Farm[]>('/payroll/farms');
  }

  /**
   * Get payroll records with filters
   */
  async getPayrollRecords(params?: {
    farm_id?: number;
    start_date?: string;
    end_date?: string;
    status?: string;
  }): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/payroll/payroll', params);
  }

  /**
   * Get single payroll record by ID
   */
  async getPayrollRecord(recordId: number): Promise<PayrollRecord> {
    return this.get<PayrollRecord>(`/payroll/${recordId}`);
  }

  /**
   * Create payroll record
   */
  async createPayrollRecord(data: Partial<PayrollRecord>): Promise<PayrollRecord> {
    return this.post<PayrollRecord>('/payroll/payroll', data);
  }

  /**
   * Update payroll record
   */
  async updatePayrollRecord(recordId: number, data: Partial<PayrollRecord>): Promise<PayrollRecord> {
    return this.put<PayrollRecord>(`/payroll/payroll/${recordId}`, data);
  }

  /**
   * Approve payroll record
   */
  async approvePayrollRecord(recordId: number): Promise<PayrollRecord> {
    return this.put<PayrollRecord>(`/payroll/payroll/${recordId}/approve`, {});
  }

  /**
   * Reject payroll record
   */
  async rejectPayrollRecord(recordId: number): Promise<PayrollRecord> {
    return this.put<PayrollRecord>(`/payroll/payroll/${recordId}/reject`, {});
  }

  /**
   * Get pending payroll records
   */
  async getPendingPayrollRecords(params?: ActivityFilters): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/payroll/payroll/pending', params);
  }

   /**
    * Get AGENTIC pending payroll records
    */
  async getBslPendingPayrollRecords(params?: { 
    farm_id?: number; 
    start_date?: string; 
    end_date?: string;
  }): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/payroll/payroll/bsl-pending', params);
  }

  /**
   * Get payroll summary
   */
  async getPayrollSummary(params?: { 
    farm_id?: number; 
    start_date?: string; 
    end_date?: string;
  }): Promise<any> {
    return this.get<any>('/payroll/reports/summary', params);
  }

  /**
   * Get weekly summary
   */
  async getWeeklySummary(): Promise<any> {
    return this.get<any>('/payroll/weekly-summary');
  }

  /**
   * Get payroll weekly summary
   * @deprecated Use getWeeklySummary() instead - this is a duplicate
   */
  async getPayrollWeeklySummary(): Promise<any> {
    return this.getWeeklySummary();
  }

  /**
   * Get picking records
   */
  async getPickingRecords(params?: { 
    farm_id?: number; 
    start_date?: string; 
    end_date?: string;
  }): Promise<any[]> {
    return this.get<any[]>('/payroll/picking/records', params);
  }

  /**
   * Get picking summary
   */
  async getPickingSummary(params?: { 
    farm_id?: number; 
    start_date?: string; 
    end_date?: string;
  }): Promise<any> {
    return this.get<any>('/payroll/picking/summary', params);
  }

  /**
   * Get picking weekly summary
   */
  async getPickingWeeklySummary(): Promise<any> {
    return this.get<any>('/payroll/picking/weekly-summary');
  }

  /**
   * Get manager pending payroll (supervisor_pending records)
   */
  async getManagerPendingPayroll(): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/manager/payroll-pending');
  }

  /**
   * Get all payroll records ever approved by this manager
   */
  async getManagerAllPayroll(): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/manager/payroll-all');
  }

  /**
   * Approve manager payroll (level 2)
   */
  async approveManagerPayroll(recordId: number): Promise<PayrollRecord> {
    return this.post<PayrollRecord>(`/manager/approve-payroll/${recordId}`, {});
  }

  /**
   * Bulk approve manager payroll (level 2)
   */
  async bulkApproveManagerPayroll(recordIds: number[]): Promise<any> {
    return this.post<any>('/manager/bulk-approve-payroll', { record_ids: recordIds });
  }

  /**
   * Bulk reject manager payroll
   */
  async bulkRejectManagerPayroll(recordIds: number[], rejectionReason: string): Promise<any> {
    return this.post<any>('/manager/bulk-reject-payroll', { record_ids: recordIds, rejection_reason: rejectionReason });
  }

  /**
   * Reject manager payroll
   */
  async rejectManagerPayroll(recordId: number, rejectionReason: string): Promise<PayrollRecord> {
    return this.post<PayrollRecord>(`/manager/reject-payroll/${recordId}`, { rejection_reason: rejectionReason });
  }

  /**
   * Get financial controller pending payroll
   */
  async getFinancialControllerPendingPayroll(): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/financial-controller/pending-payroll');
  }

  /**
   * Approve financial controller payroll (final approval + budget deduction)
   */
  async approveFinancialControllerPayroll(recordId: number): Promise<PayrollRecord> {
    return this.post<PayrollRecord>(`/financial-controller/approve-payroll/${recordId}`);
  }

  /**
   * Bulk approve financial controller payroll
   */
  async bulkApproveFinancialControllerPayroll(recordIds: number[]): Promise<any> {
    return this.post<any>('/financial-controller/bulk-approve-payroll', { record_ids: recordIds });
  }

  /**
   * Reject financial controller payroll (can reject at any level)
   */
  async rejectFinancialControllerPayroll(recordId: number, rejectionReason: string): Promise<PayrollRecord> {
    return this.post<PayrollRecord>(`/financial-controller/reject-payroll/${recordId}`, { rejection_reason: rejectionReason });
  }

  /**
   * Get supervisor's own rejected payroll records
   */
  async getSupervisorRejectedPayroll(): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/supervisor/rejected-payroll');
  }

  /**
   * Resubmit a rejected payroll record (supervisor only, own records)
   */
  async resubmitSupervisorPayroll(recordId: number): Promise<PayrollRecord> {
    return this.put<PayrollRecord>(`/supervisor/resubmit-payroll/${recordId}`, {});
  }

  // ==================== SUPERVISOR CRUD ====================

  /**
   * Get supervisor's own pending payroll records
   */
  async getSupervisorPendingPayroll(): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/supervisor/payroll/pending');
  }

  /**
   * Create supervisor payroll record
   */
  async createSupervisorPayrollRecord(data: {
    farm_id: number;
    date_worked: string;
    worker_name: string;
    task_code: string;
    worker_type: 'permanent' | 'contracted';
    block?: string;
    payment_method: 'per_task' | 'per_day';
    quantity: number;
    rate: number;
    total_amount: number;
  }): Promise<PayrollRecord> {
    return this.post<PayrollRecord>('/supervisor/payroll', data);
  }

  /**
   * Supervisor edits own payroll record (PATCH /supervisor/payroll/{id})
   */
  async editSupervisorPayrollRecord(recordId: number, data: Partial<PayrollRecord>): Promise<PayrollRecord> {
    return this.patch<PayrollRecord>(`/supervisor/payroll/${recordId}`, data);
  }

  /**
   * Update supervisor payroll record
   */
  async updateSupervisorPayrollRecord(recordId: number, data: Partial<PayrollRecord>): Promise<PayrollRecord> {
    return this.patch<PayrollRecord>(`/supervisor/payroll/${recordId}`, data);
  }

  /**
   * Delete supervisor payroll record
   */
  async deleteSupervisorPayrollRecord(recordId: number): Promise<void> {
    return this.delete<void>(`/supervisor/payroll/${recordId}`);
  }

  /**
   * Get weekly payroll sheet (legacy positional-args style)
   */
  async getWeeklyPayrollSheet(farmId: number, weekStart: string): Promise<any> {
    return this.get<any>('/payroll/weekly-sheet', { farm_id: farmId, week_start: weekStart });
  }

  /**
   * Download weekly payroll sheet PDF (legacy positional-args style)
   */
  async downloadWeeklyPayrollSheetPdf(farmId: number, weekStart: string): Promise<void> {
    return this.downloadFile('/payroll/weekly-sheet/pdf', `weekly-sheet-${weekStart}.pdf`, { farm_id: farmId, week_start: weekStart });
  }

  /**
   * Download weekly payroll sheet CSV (legacy positional-args style)
   */
  async downloadWeeklyPayrollSheetCsv(farmId: number, weekStart: string): Promise<void> {
    return this.downloadFile('/payroll/weekly-sheet/csv', `weekly-sheet-${weekStart}.csv`, { farm_id: farmId, week_start: weekStart });
  }

  /**
   * Get payment summary JSON (legacy positional-args style)
   */
  async getPaymentSummaryJson(farmId: number, startDate: string, endDate: string): Promise<any> {
    return this.get<any>('/payroll/payment-summary/json', { farm_id: farmId, start_date: startDate, end_date: endDate });
  }

  /**
   * Bulk reject financial controller payroll
   */
  async bulkRejectFinancialControllerPayroll(data: { record_ids: number[]; rejection_reason: string }): Promise<any> {
    return this.post<any>('/financial-controller/bulk-reject-payroll', data);
  }

  // ==================== PRIVATE HELPERS ====================

  private async fetchBlob(endpoint: string, params?: Record<string, string>): Promise<Blob> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const url = queryString
      ? `${this.baseUrl}${endpoint}?${queryString}`
      : `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, { headers: this.getAuthHeaders() });
    if (!response.ok) {
      let errorMessage = `Download failed: ${response.status}`;
      let errorData: any = null;
      try {
        errorData = await response.json();
        if (errorData.detail) errorMessage = errorData.detail;
        else if (errorData.message) errorMessage = errorData.message;
      } catch {
        // Response body might not be JSON
      }
      const error: any = new Error(errorMessage);
      error.response = { status: response.status, data: errorData };
      throw error;
    }
    return response.blob();
  }

  // ==================== WEEKLY SHEET ====================

  /**
   * Get weekly sheet JSON grid data
   */
  async getWeeklySheet(params: { farm_id: number; week_start: string }): Promise<any> {
    return this.get<any>('/payroll/weekly-sheet', {
      farm_id: String(params.farm_id),
      week_start: params.week_start,
    });
  }

  /**
   * Download weekly sheet as PDF (returns Blob)
   */
  async downloadWeeklySheetPdf(params: { farm_id: number; week_start: string }): Promise<Blob> {
    return this.fetchBlob('/payroll/weekly-sheet/pdf', {
      farm_id: String(params.farm_id),
      week_start: params.week_start,
    });
  }

  /**
   * Download weekly sheet as CSV (returns Blob)
   */
  async downloadWeeklySheetCsv(params: { farm_id: number; week_start: string }): Promise<Blob> {
    return this.fetchBlob('/payroll/weekly-sheet/csv', {
      farm_id: String(params.farm_id),
      week_start: params.week_start,
    });
  }

  // ==================== PAYMENT SUMMARY ====================

  /**
   * Get payment summary JSON
   */
  async getPaymentSummary(params: { farm_id: number; start_date: string; end_date: string }): Promise<any> {
    return this.get<any>('/payroll/payment-summary/json', {
      farm_id: String(params.farm_id),
      start_date: params.start_date,
      end_date: params.end_date,
    });
  }

  /**
   * Download payment summary as PDF (returns Blob)
   */
  async downloadPaymentSummaryPdf(params: { farm_id: number; start_date: string; end_date: string }): Promise<Blob> {
    return this.fetchBlob('/payroll/payment-summary/pdf', {
      farm_id: String(params.farm_id),
      start_date: params.start_date,
      end_date: params.end_date,
    });
  }

  // ==================== PAYSLIP ====================

  /**
   * Download payslip as PDF (returns Blob)
   */
  async downloadPayslipPdf(params: { worker_name: string; farm_id: number; start_date: string; end_date: string }): Promise<Blob> {
    return this.fetchBlob('/payroll/payslip/pdf', {
      worker_name: params.worker_name,
      farm_id: String(params.farm_id),
      start_date: params.start_date,
      end_date: params.end_date,
    });
  }

  // ==================== WORKER PAYMENT DETAILS ====================

  /**
   * Get worker payment details (GET /supervisor/workers/{worker_id}/payment-details)
   */
  async getWorkerPaymentDetails(workerId: number): Promise<any> {
    return this.get<any>(`/supervisor/workers/${workerId}/payment-details`);
  }

  /**
   * Update worker payment details (PATCH /supervisor/workers/{worker_id}/payment-details)
   */
  async updateWorkerPaymentDetails(workerId: number, data: {
    payment_method: 'cash' | 'bank_transfer' | 'mobile_money';
    bank_name: string | null;
    bank_account_number: string | null;
    mobile_money_provider: string | null;
    mobile_money_number: string | null;
  }): Promise<any> {
    return this.patch<any>(`/supervisor/workers/${workerId}/payment-details`, data);
  }

  // ==================== QUICKBOOKS ====================

  /**
   * Get QuickBooks pending records (approved, not yet synced)
   */
  async getQuickBooksPending(): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/payroll/quickbooks/pending');
  }

  /**
   * Mark records as synced in QuickBooks
   */
  async markQuickBooksSynced(data: { record_ids: number[]; transaction_id_prefix: string }): Promise<any> {
    return this.post<any>('/payroll/quickbooks/mark-synced', data);
  }

}
