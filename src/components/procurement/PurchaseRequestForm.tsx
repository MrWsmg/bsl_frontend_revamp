"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import apiService from '../../services/api';
import { Farm, PurchaseRequestItem } from '../../types';
import { PRIORITY_LEVELS, APPROVAL_THRESHOLDS } from '../../constants';
import { toast } from 'sonner';

interface PurchaseRequestFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PurchaseRequestForm: React.FC<PurchaseRequestFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    farm_id: '',
    department: '',
    justification: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    budget_code: '',
  });
  const [items, setItems] = useState<Partial<PurchaseRequestItem>[]>([
    {
      item_name: '',
      description: '',
      quantity: 0,
      unit: 'kg',
      estimated_unit_price: 0,
      specifications: '',
    },
  ]);

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      const data = await apiService.farms.getFarms();
      setFarms(data);
    } catch (error) {
      console.error('Error loading farms:', error);
      toast.error('Failed to load farms');
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        item_name: '',
        description: '',
        quantity: 0,
        unit: 'kg',
        estimated_unit_price: 0,
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

  const calculateEstimatedCost = () => {
    return items.reduce((total, item) => {
      return total + (item.quantity || 0) * (item.estimated_unit_price || 0);
    }, 0);
  };

  const getApprovalRequirement = () => {
    const cost = calculateEstimatedCost();
    if (cost < APPROVAL_THRESHOLDS.PR_MANAGER_ONLY) {
      return 'Manager approval only';
    } else if (cost < APPROVAL_THRESHOLDS.PR_REQUIRES_MD) {
      return 'Requires Manager + GM approval';
    } else {
      return 'Requires Manager + GM + MD approval';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.farm_id) {
      toast.error('Please select a farm');
      return;
    }
    if (!formData.department) {
      toast.error('Please enter a department');
      return;
    }
    if (!formData.justification) {
      toast.error('Please provide justification');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Validate items
    for (const item of items) {
      if (!item.item_name || !item.quantity || !item.unit || !item.estimated_unit_price) {
        toast.error('Please fill all required fields for all items');
        return;
      }
    }

    setLoading(true);
    try {
      const requestData = {
        ...formData,
        farm_id: parseInt(formData.farm_id),
        items: items.map(item => ({
          ...item,
          quantity: parseFloat(String(item.quantity)),
          estimated_unit_price: parseFloat(String(item.estimated_unit_price)),
        })),
      };

      await apiService.procurement.createPurchaseRequest(requestData);
      toast.success('Purchase Request created successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating purchase request:', error);
      toast.error(error.response?.data?.detail || 'Failed to create purchase request');
    } finally {
      setLoading(false);
    }
  };

  const estimatedCost = calculateEstimatedCost();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Purchase Request</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Farm <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.farm_id}
              onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select farm</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., farm_operations, equipment"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value as 'low' | 'normal' | 'high' | 'urgent',
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={PRIORITY_LEVELS.LOW}>Low</option>
              <option value={PRIORITY_LEVELS.NORMAL}>Normal</option>
              <option value={PRIORITY_LEVELS.HIGH}>High</option>
              <option value={PRIORITY_LEVELS.URGENT}>Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Code</label>
            <input
              type="text"
              value={formData.budget_code}
              onChange={(e) => setFormData({ ...formData, budget_code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional budget code"
            />
          </div>
        </div>

        {/* Justification */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Justification <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.justification}
            onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Explain why these items are needed..."
            required
          />
        </div>

        {/* Items Section */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Items</h3>
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
                      placeholder="e.g., NPK Fertilizer 15-15-15"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Brief description..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
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
                      placeholder="kg, liters, pieces..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Est. Unit Price (TZS) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.estimated_unit_price}
                      onChange={(e) =>
                        updateItem(index, 'estimated_unit_price', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Total
                    </label>
                    <input
                      type="text"
                      value={(
                        (item.quantity || 0) * (item.estimated_unit_price || 0)
                      ).toLocaleString()}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specifications
                    </label>
                    <textarea
                      value={item.specifications}
                      onChange={(e) => updateItem(index, 'specifications', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={2}
                      placeholder="Technical specs, quality requirements..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700">Estimated Total Cost:</span>
            <span className="text-2xl font-bold text-blue-600">
              {estimatedCost.toLocaleString()} TZS
            </span>
          </div>
          <div className="flex items-start mt-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Approval Requirement:</p>
              <p className="text-sm text-gray-600">{getApprovalRequirement()}</p>
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
            {loading ? 'Creating...' : 'Create Purchase Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

