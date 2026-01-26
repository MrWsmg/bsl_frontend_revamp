"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';
import apiService from '../../services/api';
import { Supplier, PurchaseRequest, PurchaseOrderItem } from '../../types';
import { toast } from 'sonner';

interface PurchaseOrderFormProps {
  purchaseRequest?: PurchaseRequest;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({
  purchaseRequest,
  onSuccess,
  onCancel,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: '',
    delivery_date: '',
    payment_terms: 'Net 30 days after delivery',
    shipping_address: '',
  });
  const [items, setItems] = useState<Partial<PurchaseOrderItem>[]>([]);

  useEffect(() => {
    loadSuppliers();
    initializeForm();
  }, [purchaseRequest]);

  const loadSuppliers = async () => {
    try {
      const data = await apiService.procurement.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Failed to load suppliers');
    }
  };

  const initializeForm = () => {
    if (purchaseRequest?.items && purchaseRequest.items.length > 0) {
      // Pre-populate items from PR
      setItems(
        purchaseRequest.items.map(item => ({
          item_name: item.item_name,
          description: item.description,
          quantity_ordered: item.quantity,
          unit: item.unit,
          unit_price: item.estimated_unit_price,
          specifications: item.specifications,
        }))
      );
      // Set farm's default shipping address if available
      if (purchaseRequest.farm) {
        setFormData(prev => ({
          ...prev,
          shipping_address: `${purchaseRequest.farm!.name}, ${purchaseRequest.farm!.location}`,
        }));
      }
    } else {
      setItems([
        {
          item_name: '',
          description: '',
          quantity_ordered: 0,
          unit: 'kg',
          unit_price: 0,
          specifications: '',
        },
      ]);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        item_name: '',
        description: '',
        quantity_ordered: 0,
        unit: 'kg',
        unit_price: 0,
        specifications: '',
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((total, item) => {
      return total + (item.quantity_ordered || 0) * (item.unit_price || 0);
    }, 0);
  };

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.18; // 18% VAT
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_id) {
      toast.error('Please select a supplier');
      return;
    }
    if (!formData.shipping_address) {
      toast.error('Please enter shipping address');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Validate items
    for (const item of items) {
      if (!item.item_name || !item.quantity_ordered || !item.unit || !item.unit_price) {
        toast.error('Please fill all required fields for all items');
        return;
      }
    }

    setLoading(true);
    try {
      const requestData = {
        purchase_request_id: purchaseRequest?.id,
        supplier_id: parseInt(formData.supplier_id),
        delivery_date: formData.delivery_date || undefined,
        payment_terms: formData.payment_terms,
        shipping_address: formData.shipping_address,
        items: items.map(item => ({
          ...item,
          quantity_ordered: parseFloat(String(item.quantity_ordered)),
          unit_price: parseFloat(String(item.unit_price)),
        })),
      };

      await apiService.procurement.createPurchaseOrder(requestData);
      toast.success('Purchase Order created successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      toast.error(error.response?.data?.detail || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Create Purchase Order</h2>
          {purchaseRequest && (
            <p className="text-sm text-gray-600 mt-1">
              Based on PR: {purchaseRequest.pr_number}
            </p>
          )}
        </div>
        <FileText className="w-8 h-8 text-blue-500" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier & Delivery Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={formData.delivery_date}
              onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Terms <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Net 30 days after delivery"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shipping Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.shipping_address}
              onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Complete delivery address..."
              required
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Order Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-700">Item {index + 1}</h4>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.quantity_ordered}
                      onChange={(e) => updateItem(index, 'quantity_ordered', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price (TZS) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Line Total</label>
                    <input
                      type="text"
                      value={((item.quantity_ordered || 0) * (item.unit_price || 0)).toLocaleString()}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
                    <textarea
                      value={item.specifications}
                      onChange={(e) => updateItem(index, 'specifications', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span className="font-semibold">{subtotal.toLocaleString()} TZS</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Tax (18% VAT):</span>
              <span className="font-semibold">{tax.toLocaleString()} TZS</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-blue-600 border-t pt-2">
              <span>Total Amount:</span>
              <span>{total.toLocaleString()} TZS</span>
            </div>
          </div>
        </div>

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
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Purchase Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

