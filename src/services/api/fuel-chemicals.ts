// Fuel & Chemicals API service
import { BaseApiService } from './base';
import { FuelChemProduct, FuelChemEntry, FuelChemBalance, FuelChemLocations, FuelChemBlockConsumption } from '../../types';

export class FuelChemApiService extends BaseApiService {
  async getFuelChemProducts(params?: {
    sub_store?: 'coffee' | 'otc';
    category?: string;
    active_only?: boolean;
  }): Promise<FuelChemProduct[]> {
    return this.get<FuelChemProduct[]>('/fuel-chemicals/products', params);
  }

  async getFuelChemLocations(params?: { farm_id?: number }): Promise<FuelChemLocations> {
    return this.get<FuelChemLocations>('/fuel-chemicals/locations', params);
  }

  async getFuelChemEntries(params?: {
    farm_id?: number;
    sub_store?: 'coffee' | 'otc';
    category?: string;
    transaction_type?: 'in' | 'out';
    start_date?: string;
    end_date?: string;
    [key: string]: any;
  }): Promise<FuelChemEntry[]> {
    return this.get<FuelChemEntry[]>('/fuel-chemicals/entries', params);
  }

  async createFuelChemEntry(data: Omit<FuelChemEntry, 'id'>): Promise<FuelChemEntry> {
    return this.post<FuelChemEntry>('/fuel-chemicals/entries', data);
  }

  async updateFuelChemEntry(entryId: number, data: Partial<FuelChemEntry>): Promise<FuelChemEntry> {
    return this.put<FuelChemEntry>(`/fuel-chemicals/entries/${entryId}`, data);
  }

  async deleteFuelChemEntry(entryId: number): Promise<{ deleted: number }> {
    return this.delete<{ deleted: number }>(`/fuel-chemicals/entries/${entryId}`);
  }

  async getFuelChemBalances(params?: {
    farm_id?: number;
    sub_store?: 'coffee' | 'otc';
    category?: string;
  }): Promise<FuelChemBalance[]> {
    return this.get<FuelChemBalance[]>('/fuel-chemicals/balances', params);
  }

  async getFuelChemBlockConsumption(params?: {
    farm_id?: number;
    start_date?: string;
    end_date?: string;
    category?: string;
  }): Promise<FuelChemBlockConsumption> {
    return this.get<FuelChemBlockConsumption>('/fuel-chemicals/reports/block-consumption', params);
  }
}
