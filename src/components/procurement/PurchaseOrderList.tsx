"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Download, FileCheck } from 'lucide-react';
import apiService from '../../services/api';
import { PurchaseOrder, Supplier } from '../../types';
import { PO_STATUS } from '../../constants';
import { toast } from 'sonner';

interface PurchaseOrderListProps {
  userRole: string;
}

export const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({ userRole }) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        apiService.procurement.getPurchaseOrders({
          status: selectedStatus || undefined,
        }),
        apiService.procurement.getSuppliers(),
      ]);
      if (results[0].status === 'fulfilled') setOrders(results[0].value);
      if (results[1].status === 'fulfilled') setSuppliers(results[1].value);
      if (results.every(r => r.status === 'rejected')) {
        toast.error('Failed to load purchase orders');
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const canApprove = (po: PurchaseOrder) => {
    if (userRole === 'manager' && po.status === PO_STATUS.PENDING_APPROVAL) return true;
    if (userRole === 'account_manager' && po.status === PO_STATUS.PENDING_ACCOUNT_APPROVAL) return true;
    if (userRole === 'payroll_master' && po.status === PO_STATUS.PENDING_PAYROLL_MASTER_APPROVAL) return true;
    return false;
  };

  const handleApprove = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setApprovalNotes('');
    setShowApprovalModal(true);
  };

  const submitApproval = async () => {
    if (!selectedPO) return;

    try {
      if (userRole === 'manager') {
        await apiService.procurement.approvePurchaseOrderManager(selectedPO.id, approvalNotes);
      } else if (userRole === 'account_manager') {
        await apiService.procurement.approvePurchaseOrderAccountManager(selectedPO.id, approvalNotes);
      } else if (userRole === 'payroll_master') {
        await apiService.procurement.approvePurchaseOrderPayrollMaster(selectedPO.id, approvalNotes);
      }

      toast.success('Purchase Order approved successfully!');
      setShowApprovalModal(false);
      setSelectedPO(null);
      loadData();
    } catch (error: any) {
      console.error('Error approving purchase order:', error);
      toast.error(error.response?.data?.detail || 'Failed to approve purchase order');
    }
  };

  const handleGeneratePDF = async (po: PurchaseOrder) => {
    try {
      const result = await apiService.procurement.generatePurchaseOrderPDF(po.id);
      toast.success('PDF generated successfully!');
      
      // Open PDF in new tab
      const pdfUrl = `${apiService.getBaseUrl()}${result.pdf_url}`;
      window.open(pdfUrl, '_blank');
      
      loadData();
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate PDF');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      [PO_STATUS.DRAFT]: { color: 'gray', text: 'Draft' },
      [PO_STATUS.PENDING_APPROVAL]: { color: 'yellow', text: 'Pending Manager' },
      [PO_STATUS.PENDING_ACCOUNT_APPROVAL]: { color: 'orange', text: 'Pending Account Manager' },
      [PO_STATUS.PENDING_PAYROLL_MASTER_APPROVAL]: { color: 'orange', text: 'Pending Payroll Master' },
      [PO_STATUS.APPROVED]: { color: 'green', text: 'Approved' },
      [PO_STATUS.SENT]: { color: 'blue', text: 'Sent to Supplier' },
      [PO_STATUS.CONFIRMED]: { color: 'green', text: 'Confirmed by Supplier' },
      [PO_STATUS.DELIVERED]: { color: 'green', text: 'Delivered' },
      [PO_STATUS.CANCELLED]: { color: 'red', text: 'Cancelled' },
    };

    const badge = badges[status] || badges[PO_STATUS.DRAFT];
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium bg-${badge.color}-100 text-${badge.color}-800`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Purchase Orders</h2>
          <p className="text-sm text-gray-600 mt-1">Review and approve purchase orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value={PO_STATUS.PENDING_APPROVAL}>Pending Manager</option>
              <option value={PO_STATUS.PENDING_ACCOUNT_APPROVAL}>Pending Account Manager</option>
              <option value={PO_STATUS.PENDING_PAYROLL_MASTER_APPROVAL}>Pending Payroll Master</option>
              <option value={PO_STATUS.APPROVED}>Approved</option>
              <option value={PO_STATUS.CONFIRMED}>Confirmed</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Purchase Orders List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Loading purchase orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-700">No Purchase Orders Found</h3>
          <p className="text-gray-600">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((po) => (
            <div key={po.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{po.po_number}</h3>
                    {getStatusBadge(po.status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Supplier: {suppliers.find(s => s.id === po.supplier_id)?.name || 'Unknown'} |
                    Farm: {po.farm?.name || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    {po.total_amount.toLocaleString()} {po.currency}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(po.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Approval Progress */}
              {po.approval_level > 0 && (
                <div className="bg-gray-50 rounded p-3 mb-4 text-xs space-y-1">
                  {po.manager_approved_at && (
                    <div className="flex items-center text-green-700">
                      <CheckCircle className="w-3 h-3 mr-2" />
                      <span>Manager approved on {new Date(po.manager_approved_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {po.account_manager_approved_at && (
                    <div className="flex items-center text-green-700">
                      <CheckCircle className="w-3 h-3 mr-2" />
                      <span>Account Manager approved on {new Date(po.account_manager_approved_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {po.payroll_master_approved_at && (
                    <div className="flex items-center text-green-700">
                      <CheckCircle className="w-3 h-3 mr-2" />
                      <span>Payroll Master approved on {new Date(po.payroll_master_approved_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                {po.po_document_url && (
                  <button
                    onClick={() => window.open(`${apiService.getBaseUrl()}${po.po_document_url}`, '_blank')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </button>
                )}

                {po.status === PO_STATUS.APPROVED && !po.po_document_url && (
                  <button
                    onClick={() => handleGeneratePDF(po)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center"
                  >
                    <FileCheck className="w-4 h-4 mr-2" />
                    Generate PDF
                  </button>
                )}

                {canApprove(po) && (
                  <button
                    onClick={() => handleApprove(po)}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Approve Purchase Order</h3>
            <p className="text-sm text-gray-600 mb-4">
              PO Number: <span className="font-medium">{selectedPO.po_number}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Approval Notes</label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Enter your approval notes..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitApproval}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

