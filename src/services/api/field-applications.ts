import { BaseApiService } from './base';
import { FertilizerFieldApplication, ChemicalFieldApplication } from '../../types';

export interface FertilizerAppFilters {
  farm_id?: number;
  block_id?: number;
  start_date?: string;
  end_date?: string;
  product_name?: string;
  limit?: number;
}

export interface ChemicalAppFilters extends FertilizerAppFilters {
  chemical_type?: 'AGROCHEMICAL' | 'HERBICIDE' | 'FUNGICIDE' | 'OTHER';
}

export class FieldApplicationApiService extends BaseApiService {
  // ── Fertilizer ──────────────────────────────────────────────────────────────

  async getFertilizerApplications(params?: FertilizerAppFilters): Promise<FertilizerFieldApplication[]> {
    return this.get<FertilizerFieldApplication[]>('/field-applications/fertilizer', params);
  }

  async createFertilizerApplication(data: Partial<FertilizerFieldApplication>): Promise<FertilizerFieldApplication> {
    return this.post<FertilizerFieldApplication>('/field-applications/fertilizer', data);
  }

  async deleteFertilizerApplication(id: number): Promise<{ deleted: boolean; id: number }> {
    return this.delete(`/field-applications/fertilizer/${id}`);
  }

  // ── Chemicals ───────────────────────────────────────────────────────────────

  async getChemicalApplications(params?: ChemicalAppFilters): Promise<ChemicalFieldApplication[]> {
    return this.get<ChemicalFieldApplication[]>('/field-applications/chemicals', params);
  }

  async createChemicalApplication(data: Partial<ChemicalFieldApplication>): Promise<ChemicalFieldApplication> {
    return this.post<ChemicalFieldApplication>('/field-applications/chemicals', data);
  }

  async deleteChemicalApplication(id: number): Promise<{ deleted: boolean; id: number }> {
    return this.delete(`/field-applications/chemicals/${id}`);
  }

  // ── Block Timeline ───────────────────────────────────────────────────────────

  async getBlockTimeline(blockId: number, params?: { start_date?: string; end_date?: string }) {
    return this.get<{ block_id: number; records: any[]; total: number }>(
      `/field-applications/block/${blockId}/timeline`,
      params,
    );
  }
}
