// Cherry → Parchment API service
import { BaseApiService } from './base';
import {
  C2PRecord, C2PCreate, C2PUpdate,
  HopperEntry, HopperEntryCreate,
  C2PSummary, ReconciliationResult, MillingComparison, CherryStockSummary,
  PickingEntry, PickingEntryCreate,
  ParchmentGradeEntry, ParchmentGradeEntryCreate,
} from '../../types/cherry-parchment';

export class CherryParchmentApiService extends BaseApiService {

  // ── Parchment Records ──────────────────────────────────────────────────────

  async createRecord(data: C2PCreate): Promise<C2PRecord> {
    return this.post<C2PRecord>('/cherry-parchment/records', data);
  }

  async listRecords(params?: {
    farm_id?: number;
    block_id?: number;
    date_from?: string;
    date_to?: string;
    dn_signed?: boolean;
  }): Promise<C2PRecord[]> {
    return this.get<C2PRecord[]>('/cherry-parchment/records', params);
  }

  async getRecord(id: number): Promise<C2PRecord> {
    return this.get<C2PRecord>(`/cherry-parchment/records/${id}`);
  }

  async updateRecord(id: number, data: C2PUpdate | C2PCreate): Promise<C2PRecord> {
    return this.put<C2PRecord>(`/cherry-parchment/records/${id}`, data);
  }

  async deleteRecord(id: number): Promise<void> {
    return this.delete<void>(`/cherry-parchment/records/${id}`);
  }

  async signDN(id: number): Promise<C2PRecord> {
    return this.request<C2PRecord>(`/cherry-parchment/records/${id}/sign-dn`, { method: 'PATCH' });
  }

  async getSummary(params?: {
    farm_id?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<C2PSummary> {
    return this.get<C2PSummary>('/cherry-parchment/summary', params);
  }

  // ── Hopper Stock Entries ───────────────────────────────────────────────────

  async createHopperEntry(data: HopperEntryCreate): Promise<HopperEntry> {
    return this.post<HopperEntry>('/cherry-parchment/hopper-entries', data);
  }

  async listHopperEntries(params: {
    farm_id: number;
    date_from?: string;
    date_to?: string;
  }): Promise<HopperEntry[]> {
    return this.get<HopperEntry[]>('/cherry-parchment/hopper-entries', params);
  }

  async getHopperEntry(id: number): Promise<HopperEntry> {
    return this.get<HopperEntry>(`/cherry-parchment/hopper-entries/${id}`);
  }

  async updateHopperEntry(id: number, data: Partial<HopperEntryCreate>): Promise<HopperEntry> {
    return this.put<HopperEntry>(`/cherry-parchment/hopper-entries/${id}`, data);
  }

  async deleteHopperEntry(id: number): Promise<void> {
    return this.delete<void>(`/cherry-parchment/hopper-entries/${id}`);
  }

  // ── Reports ────────────────────────────────────────────────────────────────

  async getReconciliation(params: {
    farm_id: number;
    date_from?: string;
    date_to?: string;
  }): Promise<ReconciliationResult> {
    return this.get<ReconciliationResult>('/cherry-parchment/farm-hopper-reconciliation', params);
  }

  async getMillingComparison(params: {
    farm_id: number;
    date_from?: string;
    date_to?: string;
  }): Promise<MillingComparison> {
    return this.get<MillingComparison>('/cherry-parchment/parchment-milling-comparison', params);
  }

  async getCherryStockSummary(params: {
    farm_id: number;
    date_from?: string;
    date_to?: string;
  }): Promise<CherryStockSummary> {
    return this.get<CherryStockSummary>('/cherry-parchment/cherry-stock-summary', params);
  }

  // ── Cherry Picking Entries ─────────────────────────────────────────────────

  async createPickingEntry(data: PickingEntryCreate): Promise<PickingEntry> {
    return this.post<PickingEntry>('/cherry-parchment/picking-entries', data);
  }

  async listPickingEntries(params?: {
    farm_id?: number;
    block_code?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<PickingEntry[]> {
    return this.get<PickingEntry[]>('/cherry-parchment/picking-entries', params);
  }

  async updatePickingEntry(id: number, data: Partial<PickingEntryCreate>): Promise<PickingEntry> {
    return this.put<PickingEntry>(`/cherry-parchment/picking-entries/${id}`, data);
  }

  async deletePickingEntry(id: number): Promise<void> {
    return this.delete<void>(`/cherry-parchment/picking-entries/${id}`);
  }

  // ── Parchment Grade Entries ────────────────────────────────────────────────

  async createParchmentGradeEntry(data: ParchmentGradeEntryCreate): Promise<ParchmentGradeEntry> {
    return this.post<ParchmentGradeEntry>('/cherry-parchment/parchment-grade-entries', data);
  }

  async listParchmentGradeEntries(params?: {
    farm_id?: number;
    grade?: string;
    block_code?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ParchmentGradeEntry[]> {
    return this.get<ParchmentGradeEntry[]>('/cherry-parchment/parchment-grade-entries', params);
  }

  async deleteParchmentGradeEntry(id: number): Promise<void> {
    return this.delete<void>(`/cherry-parchment/parchment-grade-entries/${id}`);
  }
}
