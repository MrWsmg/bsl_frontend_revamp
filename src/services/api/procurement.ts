// Procurement API service
import { BaseApiService } from './base';
import {
  PurchaseRequest,
  PurchaseOrder,
  GoodsReceiptNote,
  GinDocument,
  CardexSummary,
  Supplier,
  ProcurementFilters
} from '../../types';

export class ProcurementApiService extends BaseApiService {
  // ==================== MANAGER SIMR / GIN APPROVAL ====================

  /**
   * Get SIMRs pending farm manager approval — supervisors submitted these
   */
  async getManagerPendingSimrs(farmId?: number): Promise<any[]> {
    const params: Record<string, any> = { status: 'pending_fm_approval' };
    if (farmId) params.farm_id = farmId;
    return this.get<any[]>('/procurement/internal/simr', params);
  }

  /**
   * Get all SIMRs visible to the manager (all statuses)
   */
  async getManagerAllSimrs(params?: Record<string, any>): Promise<any[]> {
    return this.get<any[]>('/procurement/internal/simr', params);
  }

  /**
   * Get a specific SIMR in detail
   */
  async getSimrDetail(simrId: number): Promise<any> {
    return this.get<any>(`/procurement/internal/simr/${simrId}`);
  }

  /**
   * Get GINs pending farm manager approval
   */
  async getPendingGins(farmId?: number): Promise<any[]> {
    const params: Record<string, any> = { status: 'pending_fm_approval' };
    if (farmId) params.farm_id = farmId;
    return this.get<any[]>('/procurement/internal/gin', params);
  }

  /**
   * Manager approves a SIMR at pending_fm_approval — triggers stock allocation and GIN creation
   */
  async approveFmSimr(simrId: number, notes?: string): Promise<any> {
    return this.post<any>(`/procurement/internal/simr/${simrId}/approve`, { notes: notes ?? '' });
  }

  /**
   * Manager rejects a SIMR at pending_fm_approval
   */
  async rejectFmSimr(simrId: number, rejectionReason: string): Promise<any> {
    return this.post<any>(`/procurement/internal/simr/${simrId}/reject`, { rejection_reason: rejectionReason });
  }

  /**
   * Manager approves a GIN — releases items to farm clerk for issuance
   */
  async approveGin(ginId: number): Promise<any> {
    return this.post<any>(`/procurement/internal/gin/${ginId}/approve`, {});
  }

  // ==================== INTER-FARM TRANSFERS ====================

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
    return this.post<any>(`/procurement/internal/transfer/${transferId}/dispatch`, {});
  }

  /**
   * Destination farm clerk receives items — creates GRN, increases dest Cardex
   */
  async receiveInterFarmTransfer(transferId: number): Promise<any> {
    return this.post<any>(`/procurement/internal/transfer/${transferId}/receive`, {});
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

  // ==================== STORE / CARDEX (Procurement Officer) ====================

  async getStores(): Promise<any[]> {
    return this.get<any[]>('/procurement/stores');
  }

  async getStoreDetail(farmId: number): Promise<any> {
    return this.get<any>(`/procurement/stores/${farmId}`);
  }

  async searchStock(itemName: string): Promise<any[]> {
    return this.get<any[]>('/procurement/stores/stock-search', { item_name: itemName });
  }

  // ==================== SMR (view only) ====================

  async getProcurementSmrs(filters?: Record<string, any>): Promise<any[]> {
    return this.get<any[]>('/procurement/external/smr', filters);
  }

  async getProcurementSmrDetail(smrId: number): Promise<any> {
    return this.get<any>(`/procurement/external/smr/${smrId}`);
  }

  async markSmrOrdered(smrId: number): Promise<any> {
    return this.patch<any>(`/procurement/external/smr/${smrId}`, { status: 'lpo_created' });
  }

  // ==================== PFI ====================

  async createPfi(data: any): Promise<any> {
    return this.post<any>('/procurement/external/pfi', data);
  }

  /** List all PFIs with optional filters */
  async getPfis(filters?: Record<string, any>): Promise<any[]> {
    return this.get<any[]>('/procurement/external/pfi', filters);
  }

  /** List PFIs linked to a specific SMR */
  async getPfisBySmr(smrId: number): Promise<any[]> {
    return this.get<any[]>(`/procurement/external/pfi/smr/${smrId}`);
  }

  // ==================== LPO ====================

  async createLpo(data: any): Promise<any> {
    return this.post<any>('/procurement/external/lpo', data);
  }

  async getLpos(filters?: Record<string, any>): Promise<any[]> {
    return this.get<any[]>('/procurement/external/lpo', filters);
  }

  async getLpoDetail(lpoId: number): Promise<any> {
    return this.get<any>(`/procurement/external/lpo/${lpoId}`);
  }

  async getLposForGrn(farmId?: number): Promise<any[]> {
    return this.get<any[]>('/procurement/external/lpo/for-grn', farmId ? { farm_id: farmId } : undefined);
  }

  async getLpoPrefill(lpoId: number): Promise<any> {
    return this.get<any>(`/procurement/external/lpo/${lpoId}/grn-prefill`);
  }

  async approveLpo(lpoId: number, notes?: string): Promise<any> {
    return this.post<any>(`/procurement/external/lpo/${lpoId}/approve`, { notes });
  }

  async rejectLpo(lpoId: number, notes: string): Promise<any> {
    return this.post<any>(`/procurement/external/lpo/${lpoId}/reject`, { notes });
  }

  async sendLpoToSupplier(lpoId: number): Promise<any> {
    return this.post<any>(`/procurement/external/lpo/${lpoId}/send`, {});
  }

  // ==================== GRN ====================

  async createGrn(data: any): Promise<any> {
    return this.post<any>('/procurement/external/grn', data);
  }

  async getGrns(filters?: Record<string, any>): Promise<GoodsReceiptNote[]> {
    return this.get<GoodsReceiptNote[]>('/procurement/external/grn', filters);
  }

  async getGrnDetail(grnId: number): Promise<any> {
    return this.get<any>(`/procurement/external/grn/${grnId}`);
  }

  async approveGrn(grnId: number): Promise<any> {
    return this.post<any>(`/procurement/external/grn/${grnId}/approve`, {});
  }

  async rejectGrn(grnId: number, reason: string): Promise<any> {
    return this.post<any>(`/procurement/external/grn/${grnId}/reject`, { rejection_reason: reason });
  }

  async patchGrnItem(grnId: number, itemId: number, data: { quantity_accepted: number; rejection_reason?: string }): Promise<any> {
    return this.patch<any>(`/procurement/external/grn/${grnId}/items/${itemId}`, data);
  }

  async uploadGrnDocument(grnId: number, file: File): Promise<any> {
    return this.uploadFile<any>(`/procurement/external/grn/${grnId}/upload-document`, file, 'document');
  }

  async createDirectReceipt(data: any): Promise<any> {
    return this.post<any>('/procurement/external/grn/direct', data);
  }

  async uploadDnPhoto(grnId: number, file: File): Promise<{ grn_document_url: string }> {
    return this.uploadFile<{ grn_document_url: string }>(
      `/procurement/external/grn/${grnId}/upload-dn-photo`,
      file,
      'file'
    );
  }

  async getPriceLists(farmId?: number): Promise<any[]> {
    return this.get<any[]>('/farm-clerk/price-list', farmId ? { farm_id: farmId } : undefined);
  }

  // ==================== SMR CREATE (manager/admin) ====================

  async createSmr(data: any): Promise<any> {
    return this.post<any>('/procurement/external/smr', data);
  }

  async getExternalChain(smrNumber: string): Promise<any> {
    return this.get<any>(`/procurement/external/chain/${smrNumber}`);
  }

  // ==================== GIN (internal) ====================

  async createGin(data: any): Promise<any> {
    return this.post<any>('/procurement/internal/gin', data);
  }

  async getGins(filters?: Record<string, any>): Promise<GinDocument[]> {
    return this.get<GinDocument[]>('/procurement/internal/gin', filters);
  }

  async getGinDetail(ginId: number): Promise<any> {
    return this.get<any>(`/procurement/internal/gin/${ginId}`);
  }

  async rejectGin(ginId: number, reason: string): Promise<any> {
    return this.post<any>(`/procurement/internal/gin/${ginId}/reject`, { rejection_reason: reason });
  }

  async issueGin(ginId: number): Promise<any> {
    return this.post<any>(`/procurement/internal/gin/${ginId}/issue`, {});
  }

  // ==================== TRANSPORT VOUCHER ====================

  async createTransportVoucher(data: any): Promise<any> {
    return this.post<any>('/procurement/transport-voucher', data);
  }

  async getTransportVouchers(filters?: Record<string, any>): Promise<any[]> {
    return this.get<any[]>('/procurement/transport-voucher', filters);
  }

  async getTransportVoucherDetail(tvId: number): Promise<any> {
    return this.get<any>(`/procurement/transport-voucher/${tvId}`);
  }

  async approveTransportVoucher(tvId: number): Promise<any> {
    return this.post<any>(`/procurement/transport-voucher/${tvId}/approve`, {});
  }

  async rejectTransportVoucher(tvId: number, reason: string): Promise<any> {
    return this.post<any>(`/procurement/transport-voucher/${tvId}/reject`, { reason });
  }

  async dispatchTransportVoucher(tvId: number): Promise<any> {
    return this.post<any>(`/procurement/transport-voucher/${tvId}/dispatch`, {});
  }

  async signTransportVoucher(tvId: number, data?: any): Promise<any> {
    return this.post<any>(`/procurement/transport-voucher/${tvId}/sign`, data ?? {});
  }

  // ==================== DELIVERY NOTE ====================

  async createDeliveryNote(data: any): Promise<any> {
    return this.post<any>('/procurement/delivery-note', data);
  }

  async getDeliveryNotes(filters?: Record<string, any>): Promise<any[]> {
    return this.get<any[]>('/procurement/delivery-note', filters);
  }

  async getDeliveryNoteDetail(dnId: number): Promise<any> {
    return this.get<any>(`/procurement/delivery-note/${dnId}`);
  }

  async approveDeliveryNote(dnId: number): Promise<any> {
    return this.post<any>(`/procurement/delivery-note/${dnId}/approve`, {});
  }

  async dispatchDeliveryNote(dnId: number): Promise<any> {
    return this.post<any>(`/procurement/delivery-note/${dnId}/dispatch`, {});
  }

  async signDeliveryNote(dnId: number, data?: any): Promise<any> {
    return this.post<any>(`/procurement/delivery-note/${dnId}/sign`, data ?? {});
  }

  // ==================== GATE PASS ====================

  async createGatePass(data: any): Promise<any> {
    return this.post<any>('/procurement/gate-pass', data);
  }

  async getGatePasses(filters?: Record<string, any>): Promise<any[]> {
    return this.get<any[]>('/procurement/gate-pass', filters);
  }

  async getGatePassDetail(gpId: number): Promise<any> {
    return this.get<any>(`/procurement/gate-pass/${gpId}`);
  }

  async issueGatePass(gpId: number): Promise<any> {
    return this.post<any>(`/procurement/gate-pass/${gpId}/issue`, {});
  }

  async recordGatePassExit(gpId: number): Promise<any> {
    return this.post<any>(`/procurement/gate-pass/${gpId}/exit`, {});
  }

  async verifyGatePass(gpId: number): Promise<any> {
    return this.post<any>(`/procurement/gate-pass/${gpId}/verify`, {});
  }

  // ==================== CARDEX ====================

  async getCardex(farmId: number): Promise<CardexSummary[]> {
    return this.get<CardexSummary[]>(`/procurement/cardex/${farmId}`);
  }

  async getCardexItem(farmId: number, itemName: string): Promise<any> {
    return this.get<any>(`/procurement/cardex/${farmId}/${encodeURIComponent(itemName)}`);
  }

  async getCardexItemHistory(farmId: number, itemName: string): Promise<any[]> {
    return this.get<any[]>(`/procurement/cardex/${farmId}/${encodeURIComponent(itemName)}/history`);
  }

  // ==================== INTERNAL TRANSFERS (view) ====================

  async getInternalTransfers(filters?: Record<string, any>): Promise<any[]> {
    return this.get<any[]>('/procurement/internal/transfer', filters);
  }

  async getInternalTransferDetail(transferId: number): Promise<any> {
    return this.get<any>(`/procurement/internal/transfer/${transferId}`);
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

  /**
   * Get internal procurement chain for a SIMR
   */
  async getInternalChain(simrNumber: string): Promise<any> {
    return this.get<any>(`/procurement/internal/chain/${simrNumber}`);
  }

  /**
   * Approve an SMR (manager/admin)
   */
  async approveSMR(smrId: number): Promise<any> {
    return this.post<any>(`/procurement/external/smr/${smrId}/approve`, {});
  }

  /**
   * Attach a Transport Voucher to a GIN
   */
  async attachTVtoGIN(ginId: number, tvId: number): Promise<any> {
    return this.patch<any>(`/procurement/internal/gin/${ginId}/attach-tv?tv_id=${tvId}`, {});
  }
}

