// Irrigation Spare Parts API service
import { BaseApiService } from './base';
import { IrrigationPart, IrrigationEntry, IrrigationBalance } from '../../types';

export class IrrigationStockApiService extends BaseApiService {
  async getIrrigationParts(params?: {
    farm_id?: number;
    supplier?: string;
    active_only?: boolean;
  }): Promise<IrrigationPart[]> {
    return this.get<IrrigationPart[]>('/irrigation-stock/parts', params);
  }

  async getIrrigationPart(partId: number): Promise<IrrigationPart> {
    return this.get<IrrigationPart>(`/irrigation-stock/parts/${partId}`);
  }

  async getIrrigationEntries(params?: {
    farm_id?: number;
    part_id?: number;
    transaction_type?: 'in' | 'out';
  }): Promise<IrrigationEntry[]> {
    return this.get<IrrigationEntry[]>('/irrigation-stock/entries', params);
  }

  async createIrrigationEntry(data: Omit<IrrigationEntry, 'id'>): Promise<IrrigationEntry> {
    return this.post<IrrigationEntry>('/irrigation-stock/entries', data);
  }

  async getIrrigationBalances(params?: { farm_id?: number }): Promise<IrrigationBalance[]> {
    return this.get<IrrigationBalance[]>('/irrigation-stock/balances', params);
  }
}
