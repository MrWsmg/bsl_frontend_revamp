// Fertilizer Stock API service
import { BaseApiService } from './base';
import { FertilizerProduct, FertilizerEntry, FertilizerBalance } from '../../types';

export class FertilizerApiService extends BaseApiService {
  async getFertilizerProducts(params?: {
    sub_store?: 'coffee' | 'otc';
    active_only?: boolean;
  }): Promise<FertilizerProduct[]> {
    return this.get<FertilizerProduct[]>('/fertilizer/products', params);
  }

  async getFertilizerEntries(params?: {
    farm_id?: number;
    sub_store?: 'coffee' | 'otc';
    transaction_type?: 'in' | 'out';
    start_date?: string;
    end_date?: string;
  }): Promise<FertilizerEntry[]> {
    return this.get<FertilizerEntry[]>('/fertilizer/entries', params);
  }

  async createFertilizerEntry(data: Omit<FertilizerEntry, 'id'>): Promise<FertilizerEntry> {
    return this.post<FertilizerEntry>('/fertilizer/entries', data);
  }

  async getFertilizerBalances(params?: {
    farm_id?: number;
    sub_store?: 'coffee' | 'otc';
  }): Promise<FertilizerBalance[]> {
    return this.get<FertilizerBalance[]>('/fertilizer/balances', params);
  }
}
