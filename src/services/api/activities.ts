// Activities API service
import { BaseApiService } from './base';
import { Activity, ActivityFilters } from '../../types';

export class ActivitiesApiService extends BaseApiService {
  /**
   * Get admin activities
   */
  async getAdminActivities(params?: ActivityFilters): Promise<Activity[]> {
    return this.get<Activity[]>('/admin/activities', params);
  }

  /**
   * Get manager activities
   */
  async getManagerActivities(params?: ActivityFilters): Promise<any> {
    return this.get<any>('/admin/manager-activities', params);
  }

  /**
   * Get analytics data
   * Note: Also available via analytics.getAnalyticsData() - kept for backward compatibility
   */
  async getAnalyticsData(params?: ActivityFilters): Promise<any> {
    return this.get<any>('/admin/analytics', params);
  }

  /**
   * Get combined summary
   * Note: Also available via analytics.getCombinedSummary() - kept for backward compatibility
   */
  async getCombinedSummary(): Promise<any> {
    return this.get<any>('/admin/combined-summary');
  }

  /**
   * Get admin total area
   */
  async getAdminTotalArea(): Promise<any> {
    return this.get<any>('/calculations/admin/total-area');
  }

  /**
   * Get supervisor daily totals
   */
  async getSupervisorDailyTotals(date?: string): Promise<any> {
    const params = date ? { date } : {};
    return this.get<any>('/supervisor/daily-totals', params);
  }

  /**
   * Get supervisor work history
   */
  async getSupervisorWorkHistory(startDate: string, endDate: string): Promise<any> {
    return this.get<any>('/supervisor/work-history', { start_date: startDate, end_date: endDate });
  }

  async getAuditLogs(params?: Record<string, any>): Promise<any> {
    return this.get<any>('/admin/audit-logs', params);
  }
}
