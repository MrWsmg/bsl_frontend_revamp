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
  }): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/payroll/payroll', params);
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
   * Get manager payroll records
   */
  async getManagerPayroll(params?: { approval_status?: string; farm_id?: number }): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/manager/payroll', params);
  }

  /**
   * Get manager pending payroll
   */
  async getManagerPendingPayroll(): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/manager/payroll', { approval_status: 'pending' });
  }

  /**
   * Get manager all payroll
   */
  async getManagerAllPayroll(): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/manager/payroll');
  }

  /**
   * Approve manager payroll
   */
  async approveManagerPayroll(recordId: number): Promise<PayrollRecord> {
    return this.post<PayrollRecord>(`/manager/payroll/${recordId}/approve`, {});
  }

  /**
   * Reject manager payroll
   */
  async rejectManagerPayroll(recordId: number, reason?: string): Promise<PayrollRecord> {
    return this.post<PayrollRecord>(`/manager/payroll/${recordId}/reject`, { reason });
  }

  /**
   * Get account manager pending payroll
   */
  async getAccountManagerPendingPayroll(): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/account-manager/pending-payroll');
  }

  /**
   * Approve account manager payroll
   */
  async approveAccountManagerPayroll(recordId: number): Promise<PayrollRecord> {
    return this.post<PayrollRecord>(`/account-manager/approve-payroll/${recordId}`);
  }

  /**
   * Get financial controller pending payroll
   */
  async getFinancialControllerPendingPayroll(): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/financial-controller/pending-payroll');
  }

  /**
   * Approve financial controller payroll
   */
  async approveFinancialControllerPayroll(recordId: number): Promise<PayrollRecord> {
    return this.post<PayrollRecord>(`/financial-controller/approve-payroll/${recordId}`);
  }

  /**
   * Get payroll master pending payroll
   */
  async getPayrollMasterPendingPayroll(): Promise<PayrollRecord[]> {
    return this.get<PayrollRecord[]>('/payroll-master/pending-payroll');
  }

  /**
   * Approve payroll master payroll
   */
  async approvePayrollMasterPayroll(recordId: number): Promise<PayrollRecord> {
    return this.post<PayrollRecord>(`/payroll-master/approve-payroll/${recordId}`);
  }
}
