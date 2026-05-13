// Fertilizer Stock API service
import { BaseApiService } from './base';
import {
  FertilizerProduct, FertilizerEntry, FertilizerBalance,
  FertilizerProgram, FertilizerProgramBlock, FertilizerProgramSchedule,
  FertilizerProgramReport, FertilizerProgramSummary, FertilizerProgramRound,
  FertilizerExcelImportResult,
} from '../../types';

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

  async updateFertilizerEntry(entryId: number, data: Partial<FertilizerEntry>): Promise<FertilizerEntry> {
    return this.put<FertilizerEntry>(`/fertilizer/entries/${entryId}`, data);
  }

  async deleteFertilizerEntry(entryId: number): Promise<{ deleted: number }> {
    return this.delete<{ deleted: number }>(`/fertilizer/entries/${entryId}`);
  }

  async getFertilizerBalances(params?: {
    farm_id?: number;
    sub_store?: 'coffee' | 'otc';
  }): Promise<FertilizerBalance[]> {
    return this.get<FertilizerBalance[]>('/fertilizer/balances', params);
  }

  async createFertilizerProduct(data: {
    name: string;
    formula?: string;
    unit: string;
    sub_store: 'coffee' | 'otc';
  }): Promise<FertilizerProduct> {
    return this.post<FertilizerProduct>('/fertilizer/products', data);
  }

  async updateFertilizerProduct(productId: number, data: Partial<{
    name: string;
    formula?: string;
    unit: string;
    sub_store: 'coffee' | 'otc';
    active: boolean;
  }>): Promise<FertilizerProduct> {
    return this.put<FertilizerProduct>(`/fertilizer/products/${productId}`, data);
  }

  // ── Fertilizer Programs ──────────────────────────────────────────────────────

  async getFertilizerPrograms(params?: { farm_id?: number; season_year?: number }): Promise<FertilizerProgram[]> {
    return this.get<FertilizerProgram[]>('/fertilizer/programs', params);
  }

  async downloadFertilizerProgramTemplate(): Promise<void> {
    return this.downloadFile('/fertilizer/programs/template', 'fertilizer_program_template.xlsx');
  }

  async getFertilizerProgram(id: number): Promise<FertilizerProgram> {
    return this.get<FertilizerProgram>(`/fertilizer/programs/${id}`);
  }

  async getFertilizerProgramBlocks(id: number): Promise<FertilizerProgramBlock[]> {
    return this.get<FertilizerProgramBlock[]>(`/fertilizer/programs/${id}/blocks`);
  }

  async addFertilizerProgramBlock(id: number, data: {
    block_name: string;
    area_ha: number;
    cherry_kg?: number;
    npk_kg_per_ha?: number;
    blend1_kg_per_ha?: number;
    blend2_kg_per_ha?: number;
    blend3_kg_per_ha?: number;
  }): Promise<FertilizerProgramBlock> {
    return this.post<FertilizerProgramBlock>(`/fertilizer/programs/${id}/blocks`, data);
  }

  async createFertilizerProgram(data: { farm_id: number; season_year: number; tree_type: 'mature' | 'young' }): Promise<FertilizerProgram> {
    return this.post<FertilizerProgram>('/fertilizer/programs', data);
  }

  async importFertilizerProgramsExcel(file: File, seasonYear: number): Promise<FertilizerExcelImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.post<FertilizerExcelImportResult>(`/fertilizer/programs/import-excel?season_year=${seasonYear}`, formData);
  }

  async activateFertilizerProgram(id: number): Promise<FertilizerProgram> {
    return this.post<FertilizerProgram>(`/fertilizer/programs/${id}/activate`);
  }

  async getFertilizerProgramSchedule(id: number): Promise<FertilizerProgramSchedule> {
    return this.get<FertilizerProgramSchedule>(`/fertilizer/programs/${id}/schedule`);
  }

  async applyFertilizerRound(roundId: number, data: {
    applied_date: string;
    actual_npk_kg?: number;
    actual_blend1_kg?: number;
    actual_blend2_kg?: number;
    actual_blend3_kg?: number;
    notes?: string;
  }): Promise<FertilizerProgramRound> {
    return this.post<FertilizerProgramRound>(`/fertilizer/programs/rounds/${roundId}/apply`, data);
  }

  async getFertilizerProgramReport(id: number): Promise<FertilizerProgramReport> {
    return this.get<FertilizerProgramReport>(`/fertilizer/programs/${id}/report`);
  }

  async getFertilizerProgramSummary(id: number): Promise<FertilizerProgramSummary> {
    return this.get<FertilizerProgramSummary>(`/fertilizer/programs/${id}/summary`);
  }
}
