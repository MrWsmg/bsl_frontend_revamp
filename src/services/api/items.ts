// Items API service
import { BaseApiService } from './base';
import { ItemRequest, InventoryItem, SimrRequest, SimrItem, SimrRequestPayload } from '../../types';

export class ItemsApiService extends BaseApiService {
  /**
   * Request item (legacy single item request)
   */
  async requestItem(data: any): Promise<ItemRequest> {
    return this.post<ItemRequest>('/supervisor/request-item', data);
  }

  /**
   * Create SIMR request (multi-item request)
   */
  async createSimrRequest(data: SimrRequestPayload): Promise<SimrRequest> {
    return this.post<SimrRequest>('/supervisor/request-item', data);
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
   * Get pending SIMR requests for FM approval
   */
  async getPendingSimrRequests(): Promise<SimrRequest[]> {
    return this.get<SimrRequest[]>('/supervisor/pending-simr-requests');
  }

  /**
   * Approve SIMR request (Farm Manager)
   */
  async approveSimrRequest(requestId: number, notes?: string): Promise<SimrRequest> {
    return this.post<SimrRequest>(`/supervisor/approve-simr/${requestId}`, { notes });
  }

  /**
   * Reject SIMR request (Farm Manager)
   */
  async rejectSimrRequest(requestId: number, reason: string): Promise<SimrRequest> {
    return this.post<SimrRequest>(`/supervisor/reject-simr/${requestId}`, { reason });
  }

  /**
   * Mark SIMR as collected
   */
  async collectSimrRequest(requestId: number): Promise<SimrRequest> {
    return this.post<SimrRequest>(`/supervisor/collect-simr/${requestId}`);
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
   * Issue item request
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
   * Get price list data
   */
  async getPriceListData(): Promise<any[]> {
    return this.get<any[]>('/price-list-data');
  }
}
