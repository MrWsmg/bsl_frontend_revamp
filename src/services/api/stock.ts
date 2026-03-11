// Stock API service
import { BaseApiService } from './base';
import { StockRecord, ActivityFilters } from '../../types';

export class StockApiService extends BaseApiService {
  /**
   * Get stock farms
   */
  async getStockFarms(): Promise<any[]> {
    return this.get<any[]>('/stock/farms');
  }

  /**
   * Get stock records
   */
  async getStockRecords(params?: ActivityFilters): Promise<StockRecord[]> {
    return this.get<StockRecord[]>('/stock/stock', params);
  }

  /**
   * Create stock record
   */
  async createStockRecord(data: Partial<StockRecord>): Promise<StockRecord> {
    return this.post<StockRecord>('/stock/stock', data);
  }

  /**
   * Get stock summary
   */
  async getStockSummary(params?: Record<string, any>): Promise<any> {
    return this.get<any>('/stock/reports/summary', params);
  }

  /**
   * Get manager stock records
   */
  async getManagerStockRecords(): Promise<StockRecord[]> {
    return this.get<StockRecord[]>('/manager/stock-records');
  }

  /**
   * Get stock weekly summary
   */
  async getStockWeeklySummary(): Promise<any> {
    return this.get<any>('/stock/weekly-summary');
  }

  /**
   * Get stock movements
   */
  async getStockMovements(params?: ActivityFilters): Promise<any[]> {
    return this.get<any[]>('/farm-clerk/stock-movements', params);
  }

  /**
   * Get stock levels
   */
  async getStockLevels(): Promise<any[]> {
    return this.get<any[]>('/stock/levels');
  }

  /**
   * Today's stock levels per farm
   */
  async getDailyStock(farmId?: number): Promise<any> {
    return this.get<any>('/farm-clerk/stock/daily', farmId ? { farm_id: farmId } : undefined);
  }

  /**
   * Year-to-date stock + budget per farm
   */
  async getYtdStock(farmId?: number): Promise<any> {
    return this.get<any>('/farm-clerk/stock/ytd', farmId ? { farm_id: farmId } : undefined);
  }

  /**
   * Full farm stock view
   */
  async getFarmStock(farmId?: number): Promise<any> {
    return this.get<any>('/farm-clerk/stock/farm', farmId ? { farm_id: farmId } : undefined);
  }
}
