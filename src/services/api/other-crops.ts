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

  async getCropBalances(params?: { farm_id?: number }): Promise<CropBalance[]> {
    return this.get<CropBalance[]>('/other-crops/balances', params);
  }
}
