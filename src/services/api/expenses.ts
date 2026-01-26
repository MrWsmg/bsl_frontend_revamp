// Expenses API service
import { BaseApiService } from './base';
import { ExpenseRecord, ActivityFilters } from '../../types';

export class ExpensesApiService extends BaseApiService {
  /**
   * Get expense records
   */
  async getExpenseRecords(params?: ActivityFilters): Promise<ExpenseRecord[]> {
    return this.get<ExpenseRecord[]>('/storekeeper/expenses', params);
  }

  /**
   * Create expense record
   */
  async createExpenseRecord(data: Partial<ExpenseRecord>): Promise<ExpenseRecord> {
    return this.post<ExpenseRecord>('/storekeeper/expenses', data);
  }

  /**
   * Get manager expenses
   */
  async getManagerExpenses(): Promise<ExpenseRecord[]> {
    return this.get<ExpenseRecord[]>('/manager/expenses');
  }

  /**
   * Get expenses by period
   */
  async getExpensesByPeriod(period: string): Promise<ExpenseRecord[]> {
    return this.get<ExpenseRecord[]>('/expenses', { period });
  }
}
