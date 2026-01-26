// Transfers API service
import { BaseApiService } from './base';
import { ActivityFilters } from '../../types';

export class TransfersApiService extends BaseApiService {
  /**
   * Get transfer records
   */
  async getTransferRecords(params?: ActivityFilters): Promise<any[]> {
    return this.get<any[]>('/storekeeper/transfers', params);
  }

  /**
   * Create transfer record
   */
  async createTransferRecord(data: any): Promise<any> {
    return this.post<any>('/storekeeper/transfers', data);
  }

  /**
   * Update transfer status
   */
  async updateTransferStatus(transferId: number, status: string): Promise<any> {
    return this.put<any>(`/storekeeper/transfers/${transferId}/status`, { status });
  }
}
