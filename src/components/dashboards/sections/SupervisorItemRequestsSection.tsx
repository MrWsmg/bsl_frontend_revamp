"use client";

// Supervisor Item Requests Section - Request and manage item requests
import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Plus, Package, CheckCircle, XCircle, Clock, User, Wheat, Calendar } from 'lucide-react';
import { toast } from '../../ui/sonner';

interface ItemRequestFormData {
  item_id: number;
  item_name: string;
  quantity: number;
  unit: string;
  priority: 'low' | 'medium' | 'high';
  reason: string;
  farm_id?: number;
}

// Helper to generate unique ID from item name
const generateItemId = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export const SupervisorItemRequestsSection: React.FC = () => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my_requests' | 'all_requests'>('my_requests');
  
  const [formData, setFormData] = useState<ItemRequestFormData>({
    item_id: 0,
    item_name: '',
    quantity: 1,
    unit: 'piece',
    priority: 'medium',
    reason: '',
  });

  // Fetch data
  const getMyRequests = useCallback(() => apiService.getSupervisorItemRequests(), []);
  const getAllRequests = useCallback(() => apiService.getAllItemRequests(), []);
  const getFarms = useCallback(() => apiService.getFarms('supervisor'), []);
  const getPriceList = useCallback(() => apiService.getPriceListData(), []);

  const { data: myRequests, loading: loadingMyRequests, refetch: refetchMyRequests } = useApi(getMyRequests);
  const { data: allRequests, loading: loadingAllRequests, refetch: refetchAllRequests } = useApi(getAllRequests);
  const { data: farms } = useApi(getFarms);
  const { data: priceListItems, loading: loadingItems, error: itemsError } = useApi(getPriceList);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.item_name || formData.item_name === '') {
      toast.error('Please select an item');
      return;
    }

    if (formData.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Please provide a reason for the request');
      return;
    }

    try {
      await apiService.requestItem({
        item_name: formData.item_name,
        quantity: formData.quantity,
        unit: formData.unit,
        priority: formData.priority,
        reason: formData.reason.trim(),
        farm_id: formData.farm_id || undefined,
      });
      
      toast.success('Item request submitted successfully');
      setShowRequestModal(false);
      resetForm();
      refetchMyRequests();
      refetchAllRequests();
    } catch (error: any) {
      console.error('Failed to submit item request:', error);
      toast.error(error.message || 'Failed to submit item request');
    }
  };

  const handleConfirmReceipt = async (requestId: number, status: 'received' | 'not_received') => {
    try {
      await apiService.confirmReceipt(requestId, status);
      toast.success(`Receipt ${status === 'received' ? 'confirmed' : 'marked as not received'}`);
      refetchMyRequests();
      refetchAllRequests();
    } catch (error: any) {
      console.error('Failed to confirm receipt:', error);
      toast.error(error.message || 'Failed to confirm receipt');
    }
  };

  const resetForm = () => {
    setFormData({
      item_id: 0,
      item_name: '',
      quantity: 1,
      unit: 'piece',
      priority: 'medium',
      reason: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const currentRequests = activeTab === 'my_requests' ? myRequests : allRequests;
  const loading = activeTab === 'my_requests' ? loadingMyRequests : loadingAllRequests;

  // Calculate statistics
  const stats = {
    total: currentRequests?.length || 0,
    pending: currentRequests?.filter((r: any) => r.status === 'pending').length || 0,
    approved: currentRequests?.filter((r: any) => r.status === 'approved').length || 0,
    issued: currentRequests?.filter((r: any) => r.status === 'issued').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Item Requests</h2>
            <p className="text-sm text-gray-600 mt-1">Request and manage items from the store</p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Issued</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.issued}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('my_requests')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'my_requests'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Requests
            </button>
            <button
              onClick={() => setActiveTab('all_requests')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'all_requests'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All Requests
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !currentRequests || currentRequests.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No item requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentRequests.map((request: any) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">{request.item_name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Quantity: <span className="font-medium">{request.quantity} {request.unit || 'units'}</span>
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                          {request.priority && (
                            <span className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(request.priority)}`}>
                              {request.priority} priority
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {request.reason && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Reason:</span> {request.reason}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                        {request.requested_by && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {request.requested_by}
                          </span>
                        )}
                        {request.farm_name && (
                          <span className="flex items-center gap-1">
                            <Wheat className="w-3 h-3" />
                            {request.farm_name}
                          </span>
                        )}
                        {request.created_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions - only for issued items */}
                    {activeTab === 'my_requests' && request.status === 'issued' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirmReceipt(request.id, 'received')}
                          className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-md text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirm Received
                        </button>
                        <button
                          onClick={() => handleConfirmReceipt(request.id, 'not_received')}
                          className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Not Received
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Request Item Modal */}
      {showRequestModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRequestModal(false);
              resetForm();
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Request Item from Store</h2>
              
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Item Selection */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Item *
                      {loadingItems && <span className="text-sm text-blue-600 ml-2">(Loading items...)</span>}
                    </label>
                    <select
                      required
                      value={formData.item_name}
                      onChange={(e) => {
                        const selectedItemName = e.target.value;
                        const selectedItem = priceListItems?.find((item: any) => item.name === selectedItemName);
                        
                        // Map unit from price list format to standard format
                        let unit = 'piece';
                        if (selectedItem?.unit) {
                          const unitLower = selectedItem.unit.toLowerCase();
                          if (unitLower.includes('kg')) unit = 'kg';
                          else if (unitLower.includes('ltr') || unitLower.includes('liter')) unit = 'liter';
                          else if (unitLower.includes('bag')) unit = 'bag';
                          else if (unitLower.includes('box')) unit = 'box';
                          else if (unitLower.includes('pack')) unit = 'pack';
                          else if (unitLower.includes('pair')) unit = 'piece';
                          else if (unitLower.includes('roll')) unit = 'piece';
                          else if (unitLower.includes('pc')) unit = 'piece';
                        }
                        
                        setFormData(prev => ({
                          ...prev,
                          item_id: selectedItem ? generateItemId(selectedItemName) : 0,
                          item_name: selectedItemName,
                          unit: unit
                        }));
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loadingItems}
                    >
                      <option value="">
                        {loadingItems ? 'Loading items...' : priceListItems && priceListItems.length > 0 ? '-- Select an Item --' : 'No items available'}
                      </option>
                      {priceListItems && priceListItems.length > 0 ? (
                        priceListItems.map((item: any, index: number) => (
                          <option key={`${item.category}-${item.name}-${index}`} value={item.name}>
                            {item.name} ({item.category}) - {item.unit}
                          </option>
                        ))
                      ) : !loadingItems && (
                        <option value="" disabled>No items in price list</option>
                      )}
                    </select>
                    {itemsError && (
                      <p className="text-sm text-red-600 mt-1">
                        Error loading items. Please try again.
                      </p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.quantity || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setFormData(prev => ({ ...prev, quantity: isNaN(value) ? 1 : value }));
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1"
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="piece">Piece(s)</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="liter">Liter (l)</option>
                      <option value="bag">Bag(s)</option>
                      <option value="box">Box(es)</option>
                      <option value="pack">Pack(s)</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                    <select
                      required
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* Farm (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Farm (Optional)</label>
                    <select
                      value={formData.farm_id || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, farm_id: Number(e.target.value) || undefined }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}>-- Select Farm (Optional) --</option>
                      {farms?.map((farm: any) => (
                        <option key={farm.id || farm.farm_id} value={farm.id || farm.farm_id}>
                          {farm.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reason */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Request *</label>
                    <textarea
                      required
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Explain why you need this item..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRequestModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

