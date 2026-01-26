"use client";

import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, XCircle } from 'lucide-react';
import apiService from '../../services/api';
import { PurchaseOrder, GoodsReceiptItem } from '../../types';
import { ITEM_CONDITION, INSPECTION_STATUS } from '../../constants';
import { toast } from 'sonner';

interface GoodsReceiptFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const GoodsReceiptForm: React.FC<GoodsReceiptFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    purchase_order_id: '',
    delivery_note_number: '',
    carrier_name: '',
    vehicle_number: '',
  });
  const [items, setItems] = useState<Partial<GoodsReceiptItem>[]>([]);

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      // Load only confirmed POs that are awaiting delivery
      const data = await apiService.procurement.getPurchaseOrders({
        status: 'confirmed',
      });
      setPurchaseOrders(data);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      toast.error('Failed to load purchase orders');
    }
  };

  const handlePOChange = async (poId: string) => {
    setFormData({ ...formData, purchase_order_id: poId });

    if (poId) {
      try {
        const po = await apiService.procurement.getPurchaseOrder(parseInt(poId));
        setSelectedPO(po);

        // Pre-populate items from PO
        if (po.items) {
          setItems(
            po.items.map(item => ({
              purchase_order_item_id: item.id!,
              quantity_received: item.quantity_ordered,
              condition: 'good',
              rejection_reason: '',
            }))
          );
        }
      } catch (error) {
        console.error('Error loading PO details:', error);
        toast.error('Failed to load PO details');
      }
    } else {
      setSelectedPO(null);
      setItems([]);
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.purchase_order_id) {
      toast.error('Please select a purchase order');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        purchase_order_id: parseInt(formData.purchase_order_id),
        delivery_note_number: formData.delivery_note_number || undefined,
        carrier_name: formData.carrier_name || undefined,
        vehicle_number: formData.vehicle_number || undefined,
        items: items.map(item => ({
          purchase_order_item_id: item.purchase_order_item_id!,
          quantity_received: parseFloat(String(item.quantity_received)),
          condition: item.condition || 'good',
          rejection_reason: item.rejection_reason || undefined,
        })),
      };

      await apiService.procurement.createGoodsReceiptNote(requestData);
      toast.success('Goods Receipt Note created successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating GRN:', error);
      toast.error(error.response?.data?.detail || 'Failed to create GRN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Create Goods Receipt Note</h2>
          <p className="text-sm text-gray-600 mt-1">Record delivery of goods from supplier</p>
        </div>
        <Package className="w-8 h-8 text-blue-500" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Delivery Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Order <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.purchase_order_id}
              onChange={(e) => handlePOChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select purchase order</option>
              {purchaseOrders.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.po_number} - {po.supplier?.name} ({po.total_amount.toLocaleString()} TZS)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Note Number</label>
            <input
              type="text"
              value={formData.delivery_note_number}
              onChange={(e) => setFormData({ ...formData, delivery_note_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="DN-2025-XXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carrier Name</label>
            <input
              type="text"
              value={formData.carrier_name}
              onChange={(e) => setFormData({ ...formData, carrier_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Transport company"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
            <input
              type="text"
              value={formData.vehicle_number}
              onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="T 123 ABC"
            />
          </div>
        </div>

        {/* Items Section */}
        {selectedPO && items.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Received Items</h3>

            <div className="space-y-4">
              {items.map((item, index) => {
                const poItem = selectedPO.items?.[index];
                if (!poItem) return null;

                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-3">
                        <h4 className="font-medium text-gray-800">{poItem.item_name}</h4>
                        <p className="text-sm text-gray-600">
                          Ordered: {poItem.quantity_ordered} {poItem.unit}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity Received <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.quantity_received}
                          onChange={(e) => updateItem(index, 'quantity_received', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Condition <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.condition}
                          onChange={(e) => updateItem(index, 'condition', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        >
                          <option value={ITEM_CONDITION.GOOD}>Good</option>
                          <option value={ITEM_CONDITION.DAMAGED}>Damaged</option>
                          <option value={ITEM_CONDITION.WRONG_ITEM}>Wrong Item</option>
                        </select>
                      </div>

                      {item.condition !== 'good' && (
                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rejection Reason
                          </label>
                          <textarea
                            value={item.rejection_reason}
                            onChange={(e) => updateItem(index, 'rejection_reason', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={2}
                            placeholder="Describe the issue..."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            disabled={loading || !selectedPO}
          >
            {loading ? 'Creating...' : 'Create Goods Receipt Note'}
          </button>
        </div>
      </form>
    </div>
  );
};

