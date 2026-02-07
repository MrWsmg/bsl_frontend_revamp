"use client";

// Supervisor Item Requests Section - Request and manage SIMR (Smart Internal Material Request)
import React, { useState, useCallback, useEffect } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Plus, Package, CheckCircle, XCircle, Clock, User, Wheat, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '../../ui/sonner';

interface SimrItemFormData {
  item_name: string;
  quantity_requested: number;
  unit: string;
  price_list_id?: number;
  accounting_code?: string;
  specifications?: string;
}

interface SimrRequestFormData {
  farm_id?: number;
  block_id?: number;
  purpose: string;
  priority: string;
  items: SimrItemFormData[];
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

const UNIT_OPTIONS = [
  { value: 'piece', label: 'Piece(s)' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'liter', label: 'Liter (l)' },
  { value: 'bag', label: 'Bag(s)' },
  { value: 'box', label: 'Box(es)' },
  { value: 'pack', label: 'Pack(s)' },
  { value: 'liters', label: 'Liters' },
  { value: 'kgs', label: 'KGs' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
];

export const SupervisorItemRequestsSection: React.FC = () => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my_requests' | 'all_requests'>('my_requests');
  const [expandedRequests, setExpandedRequests] = useState<Set<number>>(new Set());
  
  const [formData, setFormData] = useState<SimrRequestFormData>({
    farm_id: undefined,
    block_id: undefined,
    purpose: '',
    priority: 'normal',
    items: [{
      item_name: '',
      quantity_requested: 1,
      unit: 'piece',
    }],
  });

  const [blocks, setBlocks] = useState<any[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  // Fetch blocks when farm is selected
  useEffect(() => {
    const fetchBlocks = async () => {
      if (formData.farm_id) {
        setLoadingBlocks(true);
        try {
          const data = await apiService.getBlocksForFarm(formData.farm_id);
          setBlocks(data);
        } catch (error) {
          console.error('Error fetching blocks:', error);
          setBlocks([]);
        } finally {
          setLoadingBlocks(false);
        }
      } else {
        setBlocks([]);
        setFormData(prev => ({ ...prev, block_id: undefined }));
      }
    };
    
    fetchBlocks();
  }, [formData.farm_id]);

  // Fetch data
  const getMyRequests = useCallback(() => apiService.getSimrRequests(), []);
  const getAllRequests = useCallback(() => apiService.getAllSimrRequests(), []);
  const getFarms = useCallback(() => apiService.getFarms('supervisor'), []);
  const getPriceList = useCallback(() => apiService.getPriceListData(), []);

  const { data: myRequests, loading: loadingMyRequests, refetch: refetchMyRequests } = useApi(getMyRequests);
  const { data: allRequests, loading: loadingAllRequests, refetch: refetchAllRequests } = useApi(getAllRequests);
  const { data: farms } = useApi(getFarms);
  const { data: priceListItems, loading: loadingItems, error: itemsError } = useApi(getPriceList);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        item_name: '',
        quantity_requested: 1,
        unit: 'piece',
      }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.farm_id) {
      toast.error('Please select a farm');
      return;
    }

    if (!formData.purpose.trim()) {
      toast.error('Please enter a purpose for the request');
      return;
    }

    const invalidItems = formData.items.filter(item => !item.item_name || item.quantity_requested <= 0 || !item.unit);
    if (invalidItems.length > 0) {
      toast.error('Please fill in all required item fields');
      return;
    }

    try {
      await apiService.createSimrRequest({
        farm_id: formData.farm_id,
        block_id: formData.block_id || undefined,
        purpose: formData.purpose.trim(),
        priority: formData.priority,
        items: formData.items.map(item => ({
          item_name: item.item_name,
          quantity_requested: item.quantity_requested,
          unit: item.unit,
          accounting_code: item.accounting_code || undefined,
          specifications: item.specifications || undefined,
        })),
      });
      
      toast.success('SIMR request submitted successfully');
      setShowRequestModal(false);
      resetForm();
      refetchMyRequests();
      refetchAllRequests();
    } catch (error: any) {
      console.error('Failed to submit SIMR request:', error);
      toast.error(error.message || 'Failed to submit SIMR request');
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
      farm_id: undefined,
      block_id: undefined,
      purpose: '',
      priority: 'normal',
      items: [{
        item_name: '',
        quantity_requested: 1,
        unit: 'piece',
      }],
    });
    setBlocks([]);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending_fm':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'collected':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleExpanded = (requestId: number) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  const currentRequests = activeTab === 'my_requests' ? myRequests : allRequests;
  const loading = activeTab === 'my_requests' ? loadingMyRequests : loadingAllRequests;

  // Calculate statistics
  const stats = {
    total: currentRequests?.length || 0,
    pending: currentRequests?.filter((r: any) => r.status === 'pending_fm').length || 0,
    approved: currentRequests?.filter((r: any) => r.status === 'approved').length || 0,
    collected: currentRequests?.filter((r: any) => r.status === 'collected').length || 0,
  };

  // Check if request is SIMR format
  const isSimrRequest = (req: any): req is { simr_number: string; items: any[]; purpose: string; status: string } => {
    return 'simr_number' in req && 'items' in req;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">SIMR Requests</h2>
            <p className="text-sm text-gray-600 mt-1">Request and manage items from the store</p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New SIMR Request
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
          <p className="text-sm text-gray-600">Pending FM</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Collected</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.collected}</p>
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
              <p className="text-gray-500">No SIMR requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentRequests.map((request: any) => {
                const isExpanded = expandedRequests.has(request.id);
                const simrReq = isSimrRequest(request) ? request : null;

                return (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            {simrReq ? (
                              <>
                                <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded mr-2">
                                  {simrReq.simr_number}
                                </span>
                                <h4 className="font-semibold text-gray-900 text-lg inline">
                                  {simrReq.purpose}
                                </h4>
                              </>
                            ) : (
                              <h4 className="font-semibold text-gray-900 text-lg">
                                {request.item_name || 'Request'}
                              </h4>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                              {request.status?.replace('_', ' ')}
                            </span>
                            {request.priority && (
                              <span className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(request.priority)}`}>
                                {request.priority}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Items Summary */}
                        {simrReq ? (
                          <div>
                            <button
                              onClick={() => toggleExpanded(request.id)}
                              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-2"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Hide {simrReq.items.length} Items
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Show {simrReq.items.length} Items
                                </>
                              )}
                            </button>

                            {isExpanded && (
                              <div className="space-y-2 mt-2">
                                {simrReq.items.map((item: any, idx: number) => (
                                  <div key={idx} className="p-2 bg-muted rounded text-sm">
                                    <p className="font-medium">{item.item_name}</p>
                                    <p className="text-xs text-gray-600">
                                      {item.quantity_requested} {item.unit}
                                      {item.specifications && ` - ${item.specifications}`}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 mt-1">
                            Quantity: <span className="font-medium">{request.quantity} {request.unit || 'units'}</span>
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                          {request.requester_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {request.requester_name}
                            </span>
                          )}
                          {request.farm_name && (
                            <span className="flex items-center gap-1">
                              <Wheat className="w-3 h-3" />
                              {request.farm_name}
                            </span>
                          )}
                          {request.block_id && (
                            <span className="flex items-center gap-1">
                              Block: {request.block_id}
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

                      {/* Actions - only for collected items */}
                      {activeTab === 'my_requests' && request.status === 'collected' && (
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
                );
              })}
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
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create SIMR Request</h2>
              
              <form onSubmit={handleSubmitRequest} className="space-y-6">
                {/* Farm and Block Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Farm */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
                    <select
                      required
                      value={formData.farm_id || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, farm_id: Number(e.target.value) || undefined }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}>-- Select Farm --</option>
                      {farms?.map((farm: any) => (
                        <option key={farm.id || farm.farm_id} value={farm.id || farm.farm_id}>
                          {farm.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Block */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Block (Optional)</label>
                    <select
                      value={formData.block_id || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, block_id: Number(e.target.value) || undefined }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!formData.farm_id || loadingBlocks}
                    >
                      <option value={0}>-- Select Block --</option>
                      {loadingBlocks ? (
                        <option value="">Loading blocks...</option>
                      ) : blocks.length > 0 ? (
                        blocks.map((block: any) => (
                          <option key={block.id} value={block.id}>
                            {block.name || `Block ${block.id}`}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No blocks available</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Purpose and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Purpose */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
                    <input
                      type="text"
                      required
                      value={formData.purpose}
                      onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Reason for this request"
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Items Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">Items *</label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          {/* Item Name */}
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Item Name *</label>
                            {priceListItems && priceListItems.length > 0 ? (
                              <select
                                required
                                value={item.item_name || ''}
                                onChange={(e) => {
                                  const selectedItemName = e.target.value;
                                  const selectedItem = priceListItems.find((p: any) => p.name === selectedItemName);
                                  
                                  // Map unit from price list format
                                  let unit = item.unit || 'piece';
                                  if (selectedItem?.unit) {
                                    const unitLower = selectedItem.unit.toLowerCase();
                                    if (unitLower.includes('kg') && !unitLower.includes('ltr')) unit = 'kg';
                                    else if (unitLower.includes('ltr') || unitLower.includes('liter')) unit = 'liter';
                                    else if (unitLower.includes('bag')) unit = 'bag';
                                    else if (unitLower.includes('box')) unit = 'box';
                                    else if (unitLower.includes('pack')) unit = 'pack';
                                  }
                                  
                                  // Update both item name and unit
                                  handleItemChange(index, 'item_name', selectedItemName);
                                  if (unit !== item.unit) {
                                    handleItemChange(index, 'unit', unit);
                                  }
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">-- Select Item --</option>
                                {priceListItems.map((p: any, idx: number) => (
                                  <option key={`${p.category}-${p.name}-${idx}`} value={String(p.name)}>
                                    {String(p.name)} ({String(p.unit || 'N/A')})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                required
                                value={item.item_name || ''}
                                onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter item name"
                              />
                            )}
                          </div>

                          {/* Quantity */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
                            <input
                              type="number"
                              required
                              min="0.01"
                              step="0.01"
                              value={item.quantity_requested || ''}
                              onChange={(e) => handleItemChange(index, 'quantity_requested', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          {/* Unit */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Unit *</label>
                            <select
                              required
                              value={item.unit}
                              onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {UNIT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Accounting Code */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Accounting Code</label>
                            <input
                              type="text"
                              value={item.accounting_code || ''}
                              onChange={(e) => handleItemChange(index, 'accounting_code', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 5101"
                            />
                          </div>

                          {/* Specifications */}
                          <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Specifications</label>
                            <input
                              type="text"
                              value={item.specifications || ''}
                              onChange={(e) => handleItemChange(index, 'specifications', e.target.value)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Additional details"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
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
                    Submit SIMR Request
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
