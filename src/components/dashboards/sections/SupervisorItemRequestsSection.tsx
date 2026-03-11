"use client";

// Supervisor Item Requests Section - Request and manage SIMR (Smart Internal Material Request)
import React, { useState, useCallback, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Plus, Package, CheckCircle, XCircle, User, Wheat, Calendar, ChevronDown, ChevronUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { simrRequestSchema, type SimrRequestFormData } from '@/lib/schemas';
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
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Card, CardContent } from '@/components/ui/card';

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
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  const form = useForm<SimrRequestFormData>({
    resolver: zodResolver(simrRequestSchema),
    defaultValues: {
      farm_id: '',
      block_id: '',
      purpose: '',
      priority: 'normal',
      items: [{
        item_name: '',
        quantity_requested: 1,
        unit: 'piece',
        accounting_code: '',
        specifications: '',
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedFarmId = form.watch('farm_id');

  // Fetch blocks when farm is selected
  useEffect(() => {
    const fetchBlocks = async () => {
      if (watchedFarmId) {
        setLoadingBlocks(true);
        try {
          const data = await apiService.getBlocksForFarm(parseInt(watchedFarmId));
          setBlocks(data);
        } catch (error) {
          console.error('Error fetching blocks:', error);
          setBlocks([]);
        } finally {
          setLoadingBlocks(false);
        }
      } else {
        setBlocks([]);
        form.setValue('block_id', '');
      }
    };

    fetchBlocks();
  }, [watchedFarmId, form]);

  // Fetch data
  const getMyRequests = useCallback(() => apiService.getSimrRequests(), []);
  const getAllRequests = useCallback(() => apiService.getAllSimrRequests(), []);
  const getFarms = useCallback(() => apiService.getFarms('supervisor'), []);
  const getPriceList = useCallback(() => apiService.getPriceListData(), []);

  const { data: myRequests, loading: loadingMyRequests, refetch: refetchMyRequests } = useApi(getMyRequests);
  const { data: allRequests, loading: loadingAllRequests, refetch: refetchAllRequests } = useApi(getAllRequests);
  const { data: farms } = useApi(getFarms);
  const { data: priceListItems } = useApi(getPriceList);

  const handleAddItem = () => {
    append({
      item_name: '',
      quantity_requested: 1,
      unit: 'piece',
      accounting_code: '',
      specifications: '',
    });
  };

  const handleSubmitRequest = async (data: SimrRequestFormData) => {
    try {
      await apiService.createSimrRequest({
        farm_id: parseInt(data.farm_id),
        block_id: data.block_id ? parseInt(data.block_id) : undefined,
        purpose: data.purpose.trim(),
        priority: data.priority,
        items: data.items.map(item => ({
          item_name: item.item_name,
          quantity_requested: Number(item.quantity_requested),
          unit: item.unit,
          accounting_code: item.accounting_code || undefined,
          specifications: item.specifications || undefined,
        })),
      });

      toast.success('SIMR request submitted successfully');
      setShowRequestModal(false);
      form.reset();
      setBlocks([]);
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

  const handleCloseModal = () => {
    setShowRequestModal(false);
    form.reset();
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
          <Button onClick={() => setShowRequestModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New SIMR Request
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Pending FM</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Collected</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.collected}</p>
          </CardContent>
        </Card>
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
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Request Item Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create SIMR Request</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmitRequest)} className="space-y-6">
            {/* Farm and Block Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="farm_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Farm *</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select Farm" />
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
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="block_id"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Block (Optional)</FieldLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                      disabled={!watchedFarmId || loadingBlocks}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Block" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingBlocks ? (
                          <SelectItem value="loading" disabled>Loading blocks...</SelectItem>
                        ) : blocks.length > 0 ? (
                          blocks.map((block: any) => (
                            <SelectItem key={block.id} value={String(block.id)}>
                              {block.name || `Block ${block.id}`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="empty" disabled>No blocks available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </div>

            {/* Purpose and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="purpose"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Purpose *</FieldLabel>
                    <Input
                      {...field}
                      placeholder="Reason for this request"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="priority"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Priority</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </div>

            {/* Items Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <FieldLabel className="text-base">Items *</FieldLabel>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-1">
                  <Plus className="w-4 h-4" />
                  Add Item
                </Button>
              </div>

              {form.formState.errors.items?.root && (
                <div className="text-red-500 text-sm mb-4">
                  {form.formState.errors.items.root.message}
                </div>
              )}

              <div className="space-y-4">
                {fields.map((item, index) => (
                  <Card key={item.id} className="relative">
                    <CardContent className="p-4">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {/* Item Name */}
                        <div className="md:col-span-2">
                          <Controller
                            name={`items.${index}.item_name`}
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel className="text-xs">Item Name *</FieldLabel>
                                {priceListItems && priceListItems.length > 0 ? (
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger aria-invalid={fieldState.invalid}>
                                      <SelectValue placeholder="Select Item" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {priceListItems.map((p: any, idx: number) => (
                                        <SelectItem key={`${p.category}-${p.name}-${idx}`} value={String(p.name)}>
                                          {String(p.name)} ({String(p.unit || 'N/A')})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    {...field}
                                    placeholder="Enter item name"
                                    aria-invalid={fieldState.invalid}
                                  />
                                )}
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                              </Field>
                            )}
                          />
                        </div>

                        {/* Quantity */}
                        <Controller
                          name={`items.${index}.quantity_requested`}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-xs">Quantity *</FieldLabel>
                              <Input
                                {...field}
                                type="number"
                                min="0.01"
                                step="0.01"
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                aria-invalid={fieldState.invalid}
                              />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />

                        {/* Unit */}
                        <Controller
                          name={`items.${index}.unit`}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-xs">Unit *</FieldLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger aria-invalid={fieldState.invalid}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {UNIT_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />

                        {/* Accounting Code */}
                        <Controller
                          name={`items.${index}.accounting_code`}
                          control={form.control}
                          render={({ field }) => (
                            <Field>
                              <FieldLabel className="text-xs">Accounting Code</FieldLabel>
                              <Input {...field} placeholder="e.g., 5101" />
                            </Field>
                          )}
                        />

                        {/* Specifications */}
                        <div className="md:col-span-3">
                          <Controller
                            name={`items.${index}.specifications`}
                            control={form.control}
                            render={({ field }) => (
                              <Field>
                                <FieldLabel className="text-xs">Specifications</FieldLabel>
                                <Input {...field} placeholder="Additional details" />
                              </Field>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit">
                Submit SIMR Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
