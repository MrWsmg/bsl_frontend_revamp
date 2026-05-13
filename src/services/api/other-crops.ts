// Other Crops API service (Maize, Beans, Soya, etc.)
import { BaseApiService } from './base';
import { OtherCropsHarvest, OtherCropsShelling, OtherCropsSale, CropBalance } from '../../types';

export class OtherCropsApiService extends BaseApiService {
  async getHarvestRecords(params?: {
    farm_id?: number;
    crop_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<OtherCropsHarvest[]> {
    return this.get<OtherCropsHarvest[]>('/other-crops/harvest', params);
  }

  async getHarvestRecord(recordId: number): Promise<OtherCropsHarvest> {
    return this.get<OtherCropsHarvest>(`/other-crops/harvest/${recordId}`);
  }

  async createHarvestRecord(data: Omit<OtherCropsHarvest, 'id' | 'recorded_by' | 'created_at'>): Promise<OtherCropsHarvest> {
    return this.post<OtherCropsHarvest>('/other-crops/harvest', data);
  }

  async updateHarvestRecord(recordId: number, data: Partial<OtherCropsHarvest>): Promise<OtherCropsHarvest> {
    return this.put<OtherCropsHarvest>(`/other-crops/harvest/${recordId}`, data);
  }

  async getShellingRecords(params?: {
    farm_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<OtherCropsShelling[]> {
    return this.get<OtherCropsShelling[]>('/other-crops/shelling', params);
  }

  async createShellingRecord(data: Omit<OtherCropsShelling, 'id'>): Promise<OtherCropsShelling> {
    return this.post<OtherCropsShelling>('/other-crops/shelling', data);
  }

  async updateShellingRecord(recordId: number, data: Partial<OtherCropsShelling>): Promise<OtherCropsShelling> {
    return this.put<OtherCropsShelling>(`/other-crops/shelling/${recordId}`, data);
  }

  async deleteShellingRecord(recordId: number): Promise<{ deleted: number }> {
    return this.delete<{ deleted: number }>(`/other-crops/shelling/${recordId}`);
  }

  async getSaleRecords(params?: {
    farm_id?: number;
    crop_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<OtherCropsSale[]> {
    return this.get<OtherCropsSale[]>('/other-crops/sales', params);
  }

  async getSaleRecord(recordId: number): Promise<OtherCropsSale> {
    return this.get<OtherCropsSale>(`/other-crops/sales/${recordId}`);
  }

  async createSaleRecord(data: Omit<OtherCropsSale, 'id'>): Promise<OtherCropsSale> {
    return this.post<OtherCropsSale>('/other-crops/sales', data);
  }

  async updateSaleRecord(recordId: number, data: Partial<OtherCropsSale>): Promise<OtherCropsSale> {
    return this.put<OtherCropsSale>(`/other-crops/sales/${recordId}`, data);
  }

  async deleteSaleRecord(recordId: number): Promise<{ deleted: number }> {
    return this.delete<{ deleted: number }>(`/other-crops/sales/${recordId}`);
  }

  async getCropBalances(params?: { farm_id?: number }): Promise<CropBalance[]> {
    return this.get<CropBalance[]>('/other-crops/balances', params);
  }
}
