// Store CARDEX API service — unified farm stock ledger
import { BaseApiService } from './base';
import { StoreSummaryItem, StoreHistoryEntry, StoreReportCard, StoreReorderLevels } from '../../types';

export class StoreCardexApiService extends BaseApiService {
  /** All items for a farm across every store category — single call for the unified ledger */
  async getStoreAll(farmId: number): Promise<StoreSummaryItem[]> {
    return this.get<StoreSummaryItem[]>(`/store/all/${farmId}`);
  }

  /** Per-category summary with item count and low/critical stock counts — used for dashboard cards */
  async getStoreReport(farmId: number): Promise<StoreReportCard[]> {
    return this.get<StoreReportCard[]>(`/store/report/${farmId}`);
  }

  /** Bin-card transaction history for one item */
  async getStoreHistory(
    farmId: number,
    itemName: string,
    storeCategory?: string,
  ): Promise<StoreHistoryEntry[]> {
    const params = storeCategory ? { store_category: storeCategory } : undefined;
    return this.get<StoreHistoryEntry[]>(`/store/history/${farmId}/${encodeURIComponent(itemName)}`, params);
  }

  /** Set reorder / min / max thresholds — triggers amber/red status colours */
  async setReorderLevels(
    farmId: number,
    storeCategory: string,
    itemName: string,
    data: StoreReorderLevels,
  ): Promise<void> {
    return this.patch(`/store/levels/${farmId}/${storeCategory}/${encodeURIComponent(itemName)}`, data);
  }
}
