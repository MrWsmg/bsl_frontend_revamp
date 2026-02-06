// Transfers API service
import { BaseApiService } from './base';
import { ActivityFilters } from '../../types';

export class TransfersApiService extends BaseApiService {
  /**
   * Get transfer records
   */
  async getTransferRecords(params?: ActivityFilters): Promise<any[]> {
    return this.get<any[]>('/farm-clerk/transfers', params);
  }

  /**
   * Create transfer record
   */
  async createTransferRecord(data: any): Promise<any> {
    return this.post<any>('/farm-clerk/transfers', data);
  }

  /**
   * Update transfer status
   */
  async updateTransferStatus(transferId: number, status: string): Promise<any> {
    return this.put<any>(`/farm-clerk/transfers/${transferId}/status`, { status });
  }
}
