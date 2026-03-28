"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Plus, Package, CheckCircle, XCircle, User, Wheat, Calendar, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

const UNIT_OPTIONS = [
  'piece', 'kg', 'kgs', 'liter', 'liters', 'bag', 'bags', 'box', 'pack',
];

const PRIORITY_OPTIONS = ['low', 'normal', 'high'] as const;

interface ItemRow {
  item_name: string;
  quantity: string;
  unit: string;
  price_list_id?: number;
  // UI search state
  search: string;
  results: any[];
  searchLoading: boolean;
  showDropdown: boolean;
}

const emptyItem = (): ItemRow => ({
  item_name: '',
  quantity: '',
  unit: 'piece',
  price_list_id: undefined,
  search: '',
  results: [],
  searchLoading: false,
  showDropdown: false,
});

const emptyForm = {
  farm_id: '',
  purpose: '',
  priority: 'normal' as 'low' | 'normal' | 'high',
};

export const SupervisorItemRequestsSection: React.FC = () => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my_requests' | 'all_requests'>('my_requests');
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const debounceRefs = useRef<(ReturnType<typeof setTimeout> | null)[]>([]);
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch data
  const getMyRequests  = useCallback(() => apiService.getSimrRequests(), []);
  const getAllRequests  = useCallback(() => apiService.getAllSimrRequests(), []);
  const getFarms       = useCallback(() => apiService.getFarms('supervisor'), []);

  const { data: myRequests,  loading: loadingMyRequests,  refetch: refetchMyRequests }  = useApi(getMyRequests);
  const { data: allRequests, loading: loadingAllRequests, refetch: refetchAllRequests } = useApi(getAllRequests);
  const { data: farms } = useApi(getFarms);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      dropdownRefs.current.forEach((ref, i) => {
        if (ref && !ref.contains(e.target as Node)) {
          setItems(prev => prev.map((row, idx) => idx === i ? { ...row, showDropdown: false } : row));
        }
      });
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── item row helpers ────────────────────────────────────────────────────────

  const updateItem = (index: number, patch: Partial<ItemRow>) => {
    setItems(prev => prev.map((row, i) => i === index ? { ...row, ...patch } : row));
  };

  const handleItemSearch = (index: number, value: string) => {
    updateItem(index, { search: value, item_name: value, price_list_id: undefined });
    if (debounceRefs.current[index]) clearTimeout(debounceRefs.current[index]!);
    if (!value.trim()) {
      updateItem(index, { results: [], showDropdown: false });
      return;
    }
    debounceRefs.current[index] = setTimeout(async () => {
      updateItem(index, { searchLoading: true });
      try {
        const results = await apiService.itemLookup(value.trim());
        updateItem(index, { results: results || [], showDropdown: true, searchLoading: false });
      } catch {
        updateItem(index, { results: [], searchLoading: false });
      }
    }, 300);
  };

  const handleSelectItem = (index: number, item: any) => {
    updateItem(index, {
      item_name: item.name,
      search: item.name,
      unit: item.unit || 'piece',
      price_list_id: item.id,
      showDropdown: false,
    });
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
    debounceRefs.current.splice(index, 1);
    dropdownRefs.current.splice(index, 1);
  };

  // ── submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setFormError('');
    if (!form.farm_id) { setFormError('Please select a farm.'); return; }
    if (!form.purpose.trim()) { setFormError('Purpose is required.'); return; }

    const validItems = items.filter(r => r.item_name.trim() && r.quantity && parseFloat(r.quantity) > 0);
    if (validItems.length === 0) {
      setFormError('Add at least one item with a valid quantity.');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createProcurementSimr({
        farm_id: parseInt(form.farm_id),
        purpose: form.purpose.trim(),
        priority: form.priority,
        items: validItems.map(r => ({
          item_name: r.item_name.trim(),
          quantity_requested: parseFloat(r.quantity),
          unit: r.unit,
          ...(r.price_list_id ? { price_list_id: r.price_list_id } : {}),
        })),
      });
      toast.success('Item request submitted — stock check in progress');
      setShowRequestModal(false);
      setForm(emptyForm);
      setItems([emptyItem()]);
      refetchMyRequests();
      refetchAllRequests();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || 'Failed to submit request';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowRequestModal(false);
    setForm(emptyForm);
    setItems([emptyItem()]);
    setFormError('');
  };

  const handleConfirmReceipt = async (requestId: number, status: 'received' | 'not_received') => {
    try {
      await apiService.confirmReceipt(requestId, status);
      toast.success(status === 'received' ? 'Receipt confirmed' : 'Marked as not received');
      refetchMyRequests();
      refetchAllRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to confirm receipt');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'pending_fm_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'gin_created':         return 'bg-blue-100 text-blue-800';
      case 'pending_inter_farm':  return 'bg-indigo-100 text-indigo-800';
      case 'pending_smr':         return 'bg-orange-100 text-orange-800';
      case 'issued':              return 'bg-purple-100 text-purple-800';
      case 'received':            return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'not_received':        return 'bg-red-100 text-red-800';
      default:                    return 'bg-gray-100 text-gray-800';
    }
  };

  const statusLabel = (s: string) =>
    s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const currentRequests = activeTab === 'my_requests' ? myRequests : allRequests;
  const loading = activeTab === 'my_requests' ? loadingMyRequests : loadingAllRequests;

  const statusIs = (r: any, s: string) => r.status?.toLowerCase() === s;

  const stats = {
    total:    currentRequests?.length || 0,
    pending:  currentRequests?.filter((r: any) => statusIs(r, 'pending') || statusIs(r, 'pending_fm_approval')).length || 0,
    issued:   currentRequests?.filter((r: any) => statusIs(r, 'issued')).length || 0,
    received: currentRequests?.filter((r: any) => statusIs(r, 'received')).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Item Requests</h2>
            <p className="text-sm text-gray-600 mt-1">Request items from the store</p>
          </div>
          <Button onClick={() => setShowRequestModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Request
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-gray-600">Issued</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats.issued}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-gray-600">Received</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.received}</p>
        </CardContent></Card>
      </div>

      {/* Tabs + List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <div className="flex">
            {(['my_requests', 'all_requests'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'my_requests' ? 'My Requests' : 'All Requests'}
              </button>
            ))}
          </div>
        </div>

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
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          {request.simr_number && (
                            <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded mr-2">
                              {request.simr_number}
                            </span>
                          )}
                          <h4 className="font-semibold text-gray-900 text-base inline">
                            {request.purpose || request.item_name || 'Item Request'}
                          </h4>
                          {request.priority && (
                            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                              request.priority === 'high' ? 'bg-red-100 text-red-700' :
                              request.priority === 'low'  ? 'bg-green-100 text-green-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {request.priority}
                            </span>
                          )}
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-full flex-shrink-0 ${getStatusColor(request.status)}`}>
                          {statusLabel(request.status)}
                        </span>
                      </div>

                      {/* Items list (SIMR) */}
                      {Array.isArray(request.items) && request.items.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {request.items.map((item: any, idx: number) => (
                            <div key={idx} className="text-sm text-gray-600 bg-gray-50 rounded px-3 py-1 flex justify-between">
                              <span>{item.item_name}</span>
                              <span className="text-gray-400">{item.quantity_requested ?? item.quantity} {item.unit}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Single-item fallback */}
                      {!Array.isArray(request.items) && request.item_name && (
                        <p className="text-sm text-gray-600 mb-2">
                          {request.item_name} — {request.quantity} {request.unit || 'units'}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-500">
                        {request.requested_by_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {request.requested_by_name}
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

                    {/* Confirm receipt — only when issued, only on My Requests tab */}
                    {activeTab === 'my_requests' && statusIs(request, 'issued') && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConfirmReceipt(request.id, 'received')}
                          className="gap-2 text-green-700 border-green-300 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirm Received
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConfirmReceipt(request.id, 'not_received')}
                          className="gap-2 text-red-700 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Not Received
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Request Dialog */}
      <Dialog open={showRequestModal} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Item Request</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">
                {formError}
              </div>
            )}

            {/* Farm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
              <Select
                value={form.farm_id || undefined}
                onValueChange={(v) => setForm(f => ({ ...f, farm_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms?.map((farm: any) => {
                    const farmId = farm.id ?? farm.farm_id;
                    if (farmId == null) return null;
                    return (
                      <SelectItem key={farmId} value={String(farmId)}>
                        {farm.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
              <Input
                value={form.purpose}
                onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value }))}
                placeholder="e.g. Weekly crop spraying supplies"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <Select
                value={form.priority}
                onValueChange={(v: any) => setForm(f => ({ ...f, priority: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Items *</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((row, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-3 space-y-2">
                    {/* Item name search */}
                    <div
                      ref={el => { dropdownRefs.current[index] = el; }}
                      className="relative"
                    >
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        <Input
                          value={row.search}
                          onChange={(e) => handleItemSearch(index, e.target.value)}
                          placeholder="Search item name…"
                          className="pl-8 text-sm"
                          autoComplete="off"
                        />
                        {row.searchLoading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      {row.showDropdown && row.results.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-44 overflow-y-auto">
                          {row.results.map((item: any, idx: number) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={() => handleSelectItem(index, item)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex justify-between items-center"
                            >
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-400 text-xs">{item.unit} · {item.category}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {row.showDropdown && !row.searchLoading && row.results.length === 0 && row.search.length >= 2 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-sm text-gray-500">
                          No items found — you can still type a custom name
                        </div>
                      )}
                    </div>

                    {/* Quantity + Unit + remove */}
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={row.quantity}
                        onChange={(e) => updateItem(index, { quantity: e.target.value })}
                        placeholder="Qty"
                        className="w-24 text-sm"
                      />
                      <Select
                        value={row.unit}
                        onValueChange={(v) => updateItem(index, { unit: v })}
                      >
                        <SelectTrigger className="flex-1 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map((u) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
