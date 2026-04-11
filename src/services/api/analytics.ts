// Analytics API service - Consolidated to avoid duplicate calls
import { BaseApiService } from './base';

export class AnalyticsApiService extends BaseApiService {
  // ============ CORE DATA METHODS (Single source of truth) ============

  /**
   * Get analytics data with optional period
   */
  async getAnalyticsData(params?: { period?: string }): Promise<any> {
    return this.get<any>('/admin/analytics', params);
  }

  /**
   * Get combined summary data
   */
  async getCombinedSummary(): Promise<any> {
    return this.get<any>('/admin/combined-summary');
  }

  /**
   * Get budgets data
   */
  async getBudgets(period: 'weekly' | 'yearly'): Promise<any[]> {
    return this.get<any[]>('/budgets', { period });
  }

  async getBudgetsByPeriod(params: { period: string; farm_id?: number; fiscal_year?: number }): Promise<any[]> {
    return this.get<any[]>('/budgets', params);
  }

  async getCurrentBudget(farmId: number, period: string): Promise<any> {
    return this.get<any>(`/budgets/current/${farmId}`, { period });
  }

  async getBudgetSummary(farmId: number, fiscalYear?: number): Promise<any> {
    return this.get<any>(`/budgets/summary/${farmId}`, fiscalYear ? { fiscal_year: fiscalYear } : undefined);
  }

  async getBudgetTracking(params: { period: string; farm_id?: number }): Promise<any> {
    return this.get<any>('/budget/tracking', params);
  }

  async getBudgetBlocks(budgetId: number): Promise<any[]> {
    return this.get<any[]>(`/budgets/${budgetId}/blocks`);
  }

  async createBudget(data: any): Promise<any> {
    return this.post<any>('/budgets', data);
  }

  async updateBudget(budgetId: number, data: any): Promise<any> {
    return this.put<any>(`/budgets/${budgetId}`, data);
  }

  async createBudgetBlock(budgetId: number, data: any): Promise<any> {
    return this.post<any>(`/budgets/${budgetId}/blocks`, data);
  }

  async updateBudgetBlock(budgetId: number, blockId: number, data: any): Promise<any> {
    return this.put<any>(`/budgets/${budgetId}/blocks/${blockId}`, data);
  }

  async validateExpenditure(params: { expenditure_type: string; amount: number; farm_id: number; period: string }): Promise<any> {
    return this.post<any>('/budget/validate-expenditure', undefined, { params });
  }

  async getWarnings(params?: Record<string, any>): Promise<any> {
    return this.get<any>('/hr/warnings', params);
  }

  async signWarning(warningId: number): Promise<any> {
    return this.post<any>(`/hr/warnings/${warningId}/sign/manager`, {});
  }

  /**
   * Get daily report data
   */
  async getDailyReport(date?: string): Promise<any[]> {
    const reportDate = date || new Date().toISOString().split('T')[0];
    return this.get<any[]>('/admin/daily-report', { date: reportDate });
  }

  /**
   * Get stock levels
   */
  async getStockLevels(): Promise<any[]> {
    return this.get<any[]>('/stock/levels');
  }

  /**
   * Get worker distribution
   */
  async getWorkerDistribution(): Promise<any[]> {
    return this.get<any[]>('/workers/distribution');
  }

  /**
   * Get expenses data
   */
  async getExpensesData(period: string = 'monthly'): Promise<any[]> {
    return this.get<any[]>('/expenses', { period });
  }

  /**
   * Get activities with limit
   */
  async getActivities(limit: number = 50): Promise<any[]> {
    return this.get<any[]>('/admin/activities', { limit });
  }

  /**
   * Get farms overview
   */
  async getFarmsOverview(): Promise<any[]> {
    return this.get<any[]>('/farms/overview');
  }

  /**
   * Get payroll trends
   */
  async getPayrollTrends(period: string = 'monthly'): Promise<any[]> {
    return this.get<any[]>('/payroll/trends', { period });
  }

  /**
   * Get general activities (non-admin)
   */
  async getGeneralActivities(limit: number = 50): Promise<any[]> {
    return this.get<any[]>('/activities', { limit });
  }

  // ============ GM-EXCLUSIVE ENDPOINTS ============

  async getGmExpenditure(params?: Record<string, any>): Promise<any> {
    return this.get<any>('/gm/financial-monitoring/expenditure', params);
  }

  async getGmCombinedFarm(): Promise<any> {
    return this.get<any>('/gm/financial-monitoring/combined-farm');
  }

  async getGmQuickbooks(): Promise<any> {
    return this.get<any>('/gm/financial-monitoring/quickbooks');
  }

  async getGmPerformanceIndicators(params?: Record<string, any>): Promise<any> {
    return this.get<any>('/gm/performance-indicators', params);
  }

  async getGmMeetings(): Promise<any> {
    return this.get<any>('/gm/meetings');
  }

  async postGmMeeting(data: Record<string, any>): Promise<any> {
    return this.post<any>('/gm/meetings', data);
  }

  // ============ MD-EXCLUSIVE ENDPOINTS ============

  async getMdStrategicExpenditure(params?: Record<string, any>): Promise<any> {
    return this.get<any>('/md/strategic-financial/expenditure', params);
  }

  async getMdStrategicCombined(): Promise<any> {
    return this.get<any>('/md/strategic-financial/combined');
  }

  async getMdStrategicQuickbooks(): Promise<any> {
    return this.get<any>('/md/strategic-financial/quickbooks');
  }

  async getMdPerformanceReview(params?: Record<string, any>): Promise<any> {
    return this.get<any>('/md/performance-review', params);
  }

  async postMdFinancialRequest(data: Record<string, any>): Promise<any> {
    return this.post<any>('/md/financial-request', data);
  }

  async postMdInitiateReport(data: Record<string, any>): Promise<any> {
    return this.post<any>('/md/reports/initiate', data);
  }

  async getMdReports(): Promise<any> {
    return this.get<any>('/md/reports');
  }

  async postMdMeeting(data: Record<string, any>): Promise<any> {
    return this.post<any>('/md/meetings', data);
  }

  // ============ LEGACY ALIASES (For backward compatibility) ============
  // These call the core methods above to avoid duplicate network requests

  /** @deprecated Use getAnalyticsData({ period: '30' }) instead */
  async getAdminManagerDashboardData(): Promise<any> {
    return this.getAnalyticsData({ period: '30' });
  }

  /** @deprecated Use getBudgets() instead */
  async getAdminManagerBudgets(period: 'weekly' | 'yearly'): Promise<any[]> {
    return this.getBudgets(period);
  }

  /** @deprecated Use getDailyReport() instead */
  async getAdminManagerPayrollData(): Promise<any[]> {
    return this.getDailyReport();
  }

  /** @deprecated Use getStockLevels() instead */
  async getAdminManagerStockData(): Promise<any[]> {
    return this.getStockLevels();
  }

  /** @deprecated Use getWorkerDistribution() instead */
  async getAdminManagerWorkerData(): Promise<any[]> {
    return this.getWorkerDistribution();
  }

  /** @deprecated Use getExpensesData() instead */
  async getAdminManagerExpensesData(): Promise<any[]> {
    return this.getExpensesData('monthly');
  }

  /** @deprecated Use getActivities() instead */
  async getAdminManagerActivities(): Promise<any[]> {
    return this.getActivities(50);
  }

  /** @deprecated Use getFarmsOverview() instead */
  async getAdminManagerFarms(): Promise<any[]> {
    return this.getFarmsOverview();
  }

  /** @deprecated Use getCombinedSummary() instead */
  async getAnalyticalDashboardData(): Promise<any> {
    return this.getCombinedSummary();
  }

  /** @deprecated Use getBudgets() instead */
  async getAnalyticalBudgets(period: 'weekly' | 'yearly'): Promise<any[]> {
    return this.getBudgets(period);
  }

  /** @deprecated Use getPayrollTrends() instead */
  async getAnalyticalPayrollData(): Promise<any[]> {
    return this.getPayrollTrends('monthly');
  }

  /** @deprecated Use getStockLevels() instead */
  async getAnalyticalStockData(): Promise<any[]> {
    return this.getStockLevels();
  }

  /** @deprecated Use getWorkerDistribution() instead */
  async getAnalyticalWorkerData(): Promise<any[]> {
    return this.getWorkerDistribution();
  }

  /** @deprecated Use getExpensesData() instead */
  async getAnalyticalExpensesData(): Promise<any[]> {
    return this.getExpensesData('monthly');
  }

  /** @deprecated Use getGeneralActivities() instead */
  async getAnalyticalActivities(): Promise<any[]> {
    return this.getGeneralActivities(50);
  }

  /** @deprecated Use getFarmsOverview() instead */
  async getAnalyticalFarms(): Promise<any[]> {
    return this.getFarmsOverview();
  }
}
