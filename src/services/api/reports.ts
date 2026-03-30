// Reports API service
import { BaseApiService } from './base';
import { ReportFilters } from '../../types';

export class ReportsApiService extends BaseApiService {
  /**
   * Get daily report
   */
  async getDailyReport(date: string, farmId?: number): Promise<any> {
    const params: Record<string, any> = { date };
    if (farmId) params.farm_id = farmId;
    return this.get<any>('/admin/daily-report', params);
  }

  /**
   * Get weekly report
   */
  async getWeeklyReport(weekStart: string, farmId?: number): Promise<any> {
    const params: Record<string, any> = { week_start: weekStart };
    if (farmId) params.farm_id = farmId;
    return this.get<any>('/admin/weekly-report', params);
  }

  /**
   * Download weekly report as Excel
   */
  async downloadWeeklyReportExcel(weekStart: string, farmId?: number): Promise<void> {
    const params: Record<string, any> = { week_start: weekStart };
    if (farmId) params.farm_id = farmId;
    const filename = `weekly_report_${weekStart}.xlsx`;
    return this.downloadFile('/admin/weekly-report/excel', filename, params);
  }

  /**
   * Download weekly report as PDF
   */
  async downloadWeeklyReportPDF(weekStart: string, farmId?: number): Promise<void> {
    const params: Record<string, any> = { week_start: weekStart };
    if (farmId) params.farm_id = farmId;
    const filename = `weekly_report_${weekStart}.pdf`;
    return this.downloadFile('/admin/weekly-report/pdf', filename, params);
  }

  /**
   * Download daily report as Excel
   */
  async downloadDailyReportExcel(date: string, farmId?: number): Promise<void> {
    const params: Record<string, any> = { date };
    if (farmId) params.farm_id = farmId;
    const filename = `daily_report_${date}.xlsx`;
    return this.downloadFile('/admin/daily-report/excel', filename, params);
  }

  /**
   * Download daily report as PDF
   */
  async downloadDailyReportPDF(date: string, farmId?: number): Promise<void> {
    const params: Record<string, any> = { date };
    if (farmId) params.farm_id = farmId;
    const filename = `daily_report_${date}.pdf`;
    return this.downloadFile('/admin/daily-report/pdf', filename, params);
  }

  async getMonthlyReport(farmId: number, year: number, month: number): Promise<any> {
    return this.get<any>(`/reports/monthly/${farmId}/${year}/${month}`);
  }

  async getSystemWideReport(): Promise<any> {
    return this.get<any>('/admin/reports/system-wide');
  }
}
