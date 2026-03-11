// Procurement API service
import { BaseApiService } from './base';
import { 
  PurchaseRequest, 
  PurchaseOrder, 
  GoodsReceiptNote, 
  Supplier,
  ProcurementFilters 
} from '../../types';

export class ProcurementApiService extends BaseApiService {
  // ==================== INTER-FARM TRANSFERS (Modern SIMR workflow) ====================

  /**
   * Get SIMRs with PENDING_INTER_FARM status — these need source farm manager approval
   */
  async getPendingInterFarmSimrs(): Promise<any[]> {
    return this.get<any[]>('/procurement/internal/simr', { status: 'PENDING_INTER_FARM' });
  }

  /**
   * Manager approves inter-farm SIMR — auto-creates GIN/DN/GatePass/InternalTransfer
   */
  async approveInterFarmSimr(simrId: number): Promise<any> {
    return this.post<any>(`/procurement/internal/simr/${simrId}/approve-inter-farm`, {});
  }

  /**
   * Manager rejects inter-farm SIMR — falls back to external purchase
   */
  async rejectInterFarmSimr(simrId: number, rejectionReason: string): Promise<any> {
    return this.post<any>(`/procurement/internal/simr/${simrId}/reject-inter-farm`, { rejection_reason: rejectionReason });
  }

  /**
   * Source farm clerk dispatches items — reduces source Cardex
   */
  async dispatchInterFarmTransfer(transferId: number): Promise<any> {
    return this.post<any>(`/procurement/internal/transfers/${transferId}/dispatch`, {});
  }

  /**
   * Destination farm clerk receives items — creates GRN, increases dest Cardex
   */
  async receiveInterFarmTransfer(transferId: number): Promise<any> {
    return this.post<any>(`/procurement/internal/transfers/${transferId}/receive`, {});
  }

  // ==================== PURCHASE REQUESTS ====================
  
  /**
   * Create a new purchase request
   */
  async createPurchaseRequest(data: any): Promise<PurchaseRequest> {
    return this.post<PurchaseRequest>('/procurement/purchase-requests', data);
  }

  /**
   * Get all purchase requests with optional filters
   */
  async getPurchaseRequests(filters?: ProcurementFilters): Promise<PurchaseRequest[]> {
    return this.get<PurchaseRequest[]>('/procurement/purchase-requests', filters);
  }

  /**
   * Get single purchase request by ID
   */
  async getPurchaseRequest(prId: number): Promise<PurchaseRequest> {
    return this.get<PurchaseRequest>(`/procurement/purchase-requests/${prId}`);
  }

  /**
   * Approve purchase request - Manager level
   */
  async approvePurchaseRequestManager(prId: number, approvalNotes?: string): Promise<any> {
    return this.put<any>(`/procurement/purchase-requests/${prId}/approve-manager`, {
      approval_notes: approvalNotes || ''
    });
  }

  /**
   * Approve purchase request - GM level
   */
  async approvePurchaseRequestGM(prId: number, approvalNotes?: string): Promise<any> {
    return this.put<any>(`/procurement/purchase-requests/${prId}/approve-gm`, {
      approval_notes: approvalNotes || ''
    });
  }

  /**
   * Approve purchase request - MD level
   */
  async approvePurchaseRequestMD(prId: number, approvalNotes?: string): Promise<any> {
    return this.put<any>(`/procurement/purchase-requests/${prId}/approve-md`, {
      approval_notes: approvalNotes || ''
    });
  }

  /**
   * Reject purchase request
   */
  async rejectPurchaseRequest(prId: number, rejectionNotes: string): Promise<any> {
    return this.put<any>(`/procurement/purchase-requests/${prId}/reject`, {
      rejection_notes: rejectionNotes
    });
  }

  // ==================== PURCHASE ORDERS ====================
  
  /**
   * Create a new purchase order
   */
  async createPurchaseOrder(data: any): Promise<PurchaseOrder> {
    return this.post<PurchaseOrder>('/procurement/purchase-orders', data);
  }

  /**
   * Get all purchase orders with optional filters
   */
  async getPurchaseOrders(filters?: ProcurementFilters): Promise<PurchaseOrder[]> {
    return this.get<PurchaseOrder[]>('/procurement/purchase-orders', filters);
  }

  /**
   * Get single purchase order by ID
   */
  async getPurchaseOrder(poId: number): Promise<PurchaseOrder> {
    return this.get<PurchaseOrder>(`/procurement/purchase-orders/${poId}`);
  }

  /**
   * Approve purchase order - Manager level
   */
  async approvePurchaseOrderManager(poId: number, approvalNotes?: string): Promise<any> {
    return this.put<any>(`/procurement/purchase-orders/${poId}/approve-manager`, {
      approval_notes: approvalNotes || ''
    });
  }

  /**
   * Approve purchase order - Account Manager level
   */
  async approvePurchaseOrderAccountManager(poId: number, approvalNotes?: string): Promise<any> {
    return this.put<any>(`/procurement/purchase-orders/${poId}/approve-account-manager`, {
      approval_notes: approvalNotes || ''
    });
  }

  /**
   * Approve purchase order - Payroll Master level
   */
  async approvePurchaseOrderPayrollMaster(poId: number, approvalNotes?: string): Promise<any> {
    return this.put<any>(`/procurement/purchase-orders/${poId}/approve-payroll-master`, {
      approval_notes: approvalNotes || ''
    });
  }

  /**
   * Record supplier acknowledgment of PO
   */
  async acknowledgeSupplierPO(poId: number, data: {
    acknowledged_by: string;
    acknowledgment_notes?: string;
  }): Promise<any> {
    return this.put<any>(`/procurement/purchase-orders/${poId}/supplier-acknowledge`, data);
  }

  /**
   * Generate PDF document for purchase order
   */
  async generatePurchaseOrderPDF(poId: number): Promise<{
    message: string;
    po_number: string;
    pdf_url: string;
    pdf_path: string;
  }> {
    return this.post<any>(`/procurement/purchase-orders/${poId}/generate-pdf`, {});
  }

  /**
   * Reject purchase order
   */
  async rejectPurchaseOrder(poId: number, rejectionNotes: string): Promise<any> {
    return this.put<any>(`/procurement/purchase-orders/${poId}/reject`, {
      rejection_notes: rejectionNotes
    });
  }

  // ==================== GOODS RECEIPT NOTES ====================
  
  /**
   * Create a new goods receipt note
   */
  async createGoodsReceiptNote(data: any): Promise<GoodsReceiptNote> {
    return this.post<GoodsReceiptNote>('/procurement/goods-receipts', data);
  }

  /**
   * Get all goods receipt notes with optional filters
   */
  async getGoodsReceiptNotes(filters?: ProcurementFilters): Promise<GoodsReceiptNote[]> {
    return this.get<GoodsReceiptNote[]>('/procurement/goods-receipts', filters);
  }

  /**
   * Get single goods receipt note by ID
   */
  async getGoodsReceiptNote(grnId: number): Promise<GoodsReceiptNote> {
    return this.get<GoodsReceiptNote>(`/procurement/goods-receipts/${grnId}`);
  }

  /**
   * Perform inspection on goods receipt
   */
  async inspectGoodsReceipt(grnId: number, data: {
    inspection_status: 'pending' | 'passed' | 'failed' | 'partial';
    inspection_notes?: string;
    quality_rating?: number;
  }): Promise<any> {
    return this.put<any>(`/procurement/goods-receipts/${grnId}/inspect`, data);
  }

  /**
   * Upload photos for goods receipt
   */
  async uploadGRNPhotos(grnId: number, data: {
    photo_type: 'inspection' | 'delivery' | 'damage';
    photo_urls: string[];
  }): Promise<any> {
    return this.put<any>(`/procurement/goods-receipts/${grnId}/upload-photos`, data);
  }

  // ==================== SUPPLIERS ====================
  
  /**
   * Get all suppliers
   */
  async getSuppliers(farmId?: number): Promise<Supplier[]> {
    const params = farmId ? { farm_id: farmId } : undefined;
    return this.get<Supplier[]>('/procurement/suppliers', params);
  }

  /**
   * Get single supplier by ID
   */
  async getSupplier(supplierId: number): Promise<Supplier> {
    return this.get<Supplier>(`/procurement/suppliers/${supplierId}`);
  }

  /**
   * Create a new supplier
   */
  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    return this.post<Supplier>('/procurement/suppliers', data);
  }

  /**
   * Update supplier
   */
  async updateSupplier(supplierId: number, data: Partial<Supplier>): Promise<Supplier> {
    return this.put<Supplier>(`/procurement/suppliers/${supplierId}`, data);
  }
}

