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
   * Get BSL pending payroll records
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

  // ==================== NEW PAYROLL ENDPOINTS ====================

  /**
   * Get supervisor pending payroll records
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
   * Get weekly payroll sheet
   */
  async getWeeklyPayrollSheet(farmId: number, weekStart: string): Promise<any> {
    return this.get<any>('/payroll/weekly-sheet', { farm_id: farmId, week_start: weekStart });
  }

  /**
   * Download weekly payroll sheet PDF
   */
  async downloadWeeklyPayrollSheetPdf(farmId: number, weekStart: string): Promise<void> {
    return this.downloadFile('/payroll/weekly-sheet/pdf', `weekly-sheet-${weekStart}.pdf`, { farm_id: farmId, week_start: weekStart });
  }

  /**
   * Download weekly payroll sheet CSV
   */
  async downloadWeeklyPayrollSheetCsv(farmId: number, weekStart: string): Promise<void> {
    return this.downloadFile('/payroll/weekly-sheet/csv', `weekly-sheet-${weekStart}.csv`, { farm_id: farmId, week_start: weekStart });
  }

  /**
   * Get payment summary JSON
   */
  async getPaymentSummaryJson(farmId: number, startDate: string, endDate: string): Promise<any> {
    return this.get<any>('/payroll/payment-summary/json', { farm_id: farmId, start_date: startDate, end_date: endDate });
  }

  /**
   * Download payment summary PDF
   */
  async downloadPaymentSummaryPdf(farmId: number, startDate: string, endDate: string): Promise<void> {
    return this.downloadFile('/payroll/payment-summary/pdf', `payment-summary-${startDate}-to-${endDate}.pdf`, { farm_id: farmId, start_date: startDate, end_date: endDate });
  }

  /**
   * Download individual payslip PDF
   */
  async downloadPayslipPdf(workerName: string, farmId: number, startDate: string, endDate: string): Promise<void> {
    return this.downloadFile('/payroll/payslip/pdf', `payslip-${workerName}-${startDate}-to-${endDate}.pdf`, { 
      worker_name: workerName, 
      farm_id: farmId, 
      start_date: startDate, 
      end_date: endDate 
    });
  }

  /**
   * Get worker payment details
   */
  async getWorkerPaymentDetails(workerId: number): Promise<any> {
    return this.get<any>(`/supervisor/workers/${workerId}/payment-details`);
  }

  /**
   * Update worker payment details
   */
  async updateWorkerPaymentDetails(workerId: number, data: {
    payment_method: 'cash' | 'bank_transfer' | 'mobile_money';
    bank_name?: string | null;
    bank_account_number?: string | null;
    mobile_money_provider?: 'mpesa' | 'tigopesa' | 'airtel_money' | null;
    mobile_money_number?: string | null;
  }): Promise<any> {
    return this.patch<any>(`/supervisor/workers/${workerId}/payment-details`, data);
  }

  /**
   * Get QuickBooks pending records
   */
  async getQuickBooksPending(): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/payroll/quickbooks/pending');
  }

  /**
   * Mark records as synced to QuickBooks
   */
  async markQuickBooksSynced(recordIds: number[], transactionIdPrefix: string = 'QB'): Promise<any> {
    return this.post<any>('/payroll/quickbooks/mark-synced', { 
      record_ids: recordIds, 
      transaction_id_prefix: transactionIdPrefix 
    });
  }

  /**
   * Bulk reject financial controller payroll
   */
  async bulkRejectFinancialControllerPayroll(recordIds: number[], rejectionReason: string): Promise<any> {
    return this.post<any>('/financial-controller/bulk-reject-payroll', { 
      record_ids: recordIds, 
      rejection_reason: rejectionReason 
    });
  }
}
