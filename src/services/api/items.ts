// Items API service
import { BaseApiService } from './base';
import { ItemRequest, InventoryItem, SimrRequest, SimrItem, SimrRequestPayload } from '../../types';

export class ItemsApiService extends BaseApiService {
  /**
   * Request item — creates ItemRequest that goes through Manager L1 → Farm Clerk L2 approval
   */
  async requestItem(data: any): Promise<ItemRequest> {
    return this.post<ItemRequest>('/supervisor/request-item', data);
  }

  /**
   * Create SIMR request — creates ItemRequest that goes through Manager L1 → Farm Clerk L2 approval
   */
  async createSimrRequest(data: SimrRequestPayload): Promise<SimrRequest> {
    return this.post<SimrRequest>('/supervisor/request-item', data);
  }

  /**
   * Create procurement SIMR — triggers 3-tier automatic stock check
   * (own farm CardexSummary → cross-farm → external purchase PENDING_SMR)
   * Use this only when the procurement/transfer inter-farm workflow is needed.
   */
  async createProcurementSimr(data: SimrRequestPayload): Promise<any> {
    return this.post<any>('/procurement/internal/simr', data);
  }

  /**
   * Get SIMR requests for supervisor
   */
  async getSimrRequests(): Promise<SimrRequest[]> {
    return this.get<SimrRequest[]>('/supervisor/item-requests');
  }

  /**
   * Get all SIMR requests (admin view)
   */
  async getAllSimrRequests(): Promise<SimrRequest[]> {
    return this.get<SimrRequest[]>('/supervisor/all-item-requests');
  }

  /**
   * Get supervisor item requests (legacy)
   */
  async getSupervisorItemRequests(): Promise<ItemRequest[]> {
    return this.get<ItemRequest[]>('/supervisor/item-requests');
  }

  /**
   * Get all item requests (legacy)
   */
  async getAllItemRequests(): Promise<ItemRequest[]> {
    return this.get<ItemRequest[]>('/supervisor/all-item-requests');
  }

  /**
   * Get pending item requests (legacy)
   */
  async getPendingItemRequests(): Promise<ItemRequest[]> {
    return this.get<ItemRequest[]>('/farm-clerk/pending-requests');
  }

  /**
   * Get manager item requests
   */
  async getManagerItemRequests(): Promise<ItemRequest[]> {
    return this.get<ItemRequest[]>('/manager/item-requests');
  }

  /**
   * Approve item request (Manager endpoint - legacy)
   */
  async approveItemRequest(requestId: number): Promise<ItemRequest> {
    return this.post<ItemRequest>(`/manager/approve-item-request/${requestId}`);
  }

  /**
   * Reject item request (Manager endpoint - legacy)
   */
  async rejectItemRequest(requestId: number): Promise<ItemRequest> {
    return this.post<ItemRequest>(`/manager/reject-item-request/${requestId}`);
  }

  /**
   * Farm clerk approves request (L2) — checks inventory availability
   */
  async approveFarmClerkRequest(requestId: number): Promise<ItemRequest> {
    return this.post<ItemRequest>(`/farm-clerk/approve-request/${requestId}`);
  }

  /**
   * Farm clerk rejects request
   */
  async rejectFarmClerkRequest(requestId: number): Promise<ItemRequest> {
    return this.post<ItemRequest>(`/farm-clerk/reject-request/${requestId}`);
  }

  /**
   * Get requests pending farm clerk approval
   */
  async getFarmClerkPendingRequests(): Promise<ItemRequest[]> {
    return this.get<ItemRequest[]>('/farm-clerk/pending-requests');
  }

  /**
   * Get approved requests ready to issue
   */
  async getPendingIssuances(): Promise<ItemRequest[]> {
    return this.get<ItemRequest[]>('/farm-clerk/pending-issuances');
  }

  /**
   * Farm clerk marks items prepared
   */
  async prepareIssuance(requestId: number): Promise<ItemRequest> {
    return this.post<ItemRequest>(`/farm-clerk/prepare-issuance/${requestId}`);
  }

  /**
   * Issue item request (decreases inventory)
   */
  async issueItemRequest(requestId: number): Promise<ItemRequest> {
    return this.post<ItemRequest>(`/farm-clerk/issue-request/${requestId}`);
  }

  /**
   * Confirm receipt
   */
  async confirmReceipt(
    requestId: number, 
    receivedStatus: "received" | "not_received"
  ): Promise<ItemRequest> {
    return this.post<ItemRequest>(`/supervisor/confirm-receipt/${requestId}`, {
      received_status: receivedStatus
    });
  }

  /**
   * Get inventory items
   */
  async getInventoryItems(params?: Record<string, any>): Promise<InventoryItem[]> {
    return this.get<InventoryItem[]>('/farm-clerk/inventory', params);
  }

  /**
   * Create inventory item
   */
  async createInventoryItem(data: { farm_id: number; item_name: string; quantity: number; unit: string }): Promise<InventoryItem> {
    return this.post<InventoryItem>('/farm-clerk/inventory', data);
  }

  /**
   * Get manager inventory
   */
  async getManagerInventory(): Promise<InventoryItem[]> {
    return this.get<InventoryItem[]>('/manager/inventory');
  }

  /**
   * Search PriceList by name/code (includes accounting_code)
   */
  async itemLookup(query: string): Promise<any[]> {
    return this.get<any[]>('/farm-clerk/item-lookup', { q: query });
  }

  /**
   * Get price list data
   */
  async getPriceListData(): Promise<any[]> {
    return this.get<any[]>('/price-list-data');
  }

  /**
   * List price list items (optionally filter by category)
   */
  async getPriceList(category?: string): Promise<any[]> {
    return this.get<any[]>('/farm-clerk/price-list', category ? { category } : undefined);
  }

  /**
   * Add a new item to the price list
   */
  async addPriceListItem(data: {
    category: string;
    name: string;
    unit: string;
    price: number;
    accounting_code?: string;
  }): Promise<any> {
    return this.post<any>('/farm-clerk/price-list', data);
  }

  /**
   * Delete a price list item (blocked if referenced by SMR/SIMR)
   */
  async deletePriceListItem(itemId: number): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/farm-clerk/price-list/${itemId}`);
  }
}
