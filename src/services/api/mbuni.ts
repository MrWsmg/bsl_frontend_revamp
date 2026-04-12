// Mbuni (Dried Cherry) API service
import { BaseApiService } from './base';
import { MbuniRecord } from '../../types';

export class MbuniApiService extends BaseApiService {
  async getMbuniRecords(params?: {
    farm_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<MbuniRecord[]> {
    return this.get<MbuniRecord[]>('/mbuni/records', params);
  }

  async getMbuniRecord(recordId: number): Promise<MbuniRecord> {
    return this.get<MbuniRecord>(`/mbuni/records/${recordId}`);
  }

  async createMbuniRecord(data: Omit<MbuniRecord, 'id'>): Promise<MbuniRecord> {
    return this.post<MbuniRecord>('/mbuni/records', data);
  }

  async updateMbuniRecord(recordId: number, data: Partial<MbuniRecord>): Promise<MbuniRecord> {
    return this.put<MbuniRecord>(`/mbuni/records/${recordId}`, data);
  }
}
