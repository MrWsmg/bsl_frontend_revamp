"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Package, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import apiService from '../services/api';
import { Farm, Block } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

interface SimrItem {
  item_name: string;
  quantity_requested: number;
  unit: string;
  price_list_id?: number;
  accounting_code?: string;
  specifications?: string;
}

interface SimrRequestFormProps {
  farms: Farm[];
  onSuccess?: () => void;
}

const UNIT_OPTIONS = [
  'liters',
  'kgs',
  'pieces',
  'bags',
  'boxes',
  'tons',
  'kg',
  'l',
  'units',
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function SimrRequestForm({ farms, onSuccess }: SimrRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [priceList, setPriceList] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    farm_id: '',
    block_id: '',
    purpose: '',
    priority: 'normal',
  });
  
  const [items, setItems] = useState<SimrItem[]>([
    {
      item_name: '',
      quantity_requested: 0,
      unit: '',
      price_list_id: undefined,
      accounting_code: '',
      specifications: '',
    },
  ]);

  // Load blocks when farm is selected
  useEffect(() => {
    if (formData.farm_id) {
      loadBlocks(parseInt(formData.farm_id));
    } else {
      setBlocks([]);
    }
  }, [formData.farm_id]);

  // Load price list data
  useEffect(() => {
    loadPriceList();
  }, []);

  const loadBlocks = async (farmId: number) => {
    try {
      const data = await apiService.getBlocksForFarm(farmId);
      setBlocks(data);
    } catch (error) {
      console.error('Error loading blocks:', error);
      setBlocks([]);
    }
  };

  const loadPriceList = async () => {
    try {
      const data = await apiService.getPriceListData();
      setPriceList(data);
    } catch (error) {
      console.error('Error loading price list:', error);
      setPriceList([]);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        item_name: '',
        quantity_requested: 0,
        unit: '',
        price_list_id: undefined,
        accounting_code: '',
        specifications: '',
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.farm_id) {
      toast.error('Please select a farm');
      return;
    }
    if (!formData.purpose.trim()) {
      toast.error('Please enter a purpose');
      return;
    }
    if (items.some(item => !item.item_name || !item.unit || item.quantity_requested <= 0)) {
      toast.error('Please fill in all required item fields');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Creating SIMR request...');

    try {
      const payload = {
        farm_id: parseInt(formData.farm_id),
        block_id: formData.block_id ? parseInt(formData.block_id) : undefined,
        purpose: formData.purpose,
        priority: formData.priority,
        items: items.map(item => ({
          item_name: item.item_name,
          quantity_requested: item.quantity_requested,
          unit: item.unit,
          price_list_id: item.price_list_id,
          accounting_code: item.accounting_code || undefined,
          specifications: item.specifications || undefined,
        })),
      };

      await apiService.createSimrRequest(payload);
      toast.success('SIMR request created successfully!', { id: loadingToast });
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating SIMR request:', error);
      toast.error(error.response?.data?.detail || 'Failed to create SIMR request. Please try again.', {
        id: loadingToast,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      farm_id: '',
      block_id: '',
      purpose: '',
      priority: 'normal',
    });
    setItems([
      {
        item_name: '',
        quantity_requested: 0,
        unit: '',
        price_list_id: undefined,
        accounting_code: '',
        specifications: '',
      },
    ]);
  };

  const getFilteredPriceList = (itemName: string) => {
    if (!itemName) return priceList;
    return priceList.filter(item => 
      item.item_name?.toLowerCase().includes(itemName.toLowerCase())
    );
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Package className="w-4 h-4" />
        Create SIMR Request
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create SIMR Request</DialogTitle>
            <CardDescription>
              Create a new Supervisor Item Material Request for farm supplies
            </CardDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Farm and Block Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="farm_id">Farm *</Label>
                <Select
                  value={formData.farm_id}
                  onValueChange={(value) => handleFormChange('farm_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id.toString()}>
                        {farm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="block_id">Block (Optional)</Label>
                <Select
                  value={formData.block_id}
                  onValueChange={(value) => handleFormChange('block_id', value)}
                  disabled={!formData.farm_id || blocks.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select block" />
                  </SelectTrigger>
                  <SelectContent>
                    {blocks.map((block) => (
                      <SelectItem key={block.id} value={block.id.toString()}>
                        {block.name || `Block ${block.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Purpose and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose *</Label>
                <Textarea
                  id="purpose"
                  placeholder="Reason for this request"
                  value={formData.purpose}
                  onChange={(e) => handleFormChange('purpose', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleFormChange('priority', value)}
                >
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
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Requested Items *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                  <Plus className="w-3 h-3" />
                  Add Item
                </Button>
              </div>

              {items.map((item, index) => (
                <Card key={index} className="relative">
                  <CardContent className="p-4">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}

                    <div className="grid grid-cols-12 gap-3">
                      {/* Item Name */}
                      <div className="col-span-4 space-y-2">
                        <Label className="text-xs">Item Name *</Label>
                        <Select
                          value={item.item_name}
                          onValueChange={(value) => handleItemChange(index, 'item_name', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {priceList.map((priceItem) => (
                              <SelectItem key={priceItem.id} value={priceItem.item_name}>
                                {priceItem.item_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-3 space-y-2">
                        <Label className="text-xs">Quantity *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Amount"
                          value={item.quantity_requested || ''}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity_requested', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>

                      {/* Unit */}
                      <div className="col-span-2 space-y-2">
                        <Label className="text-xs">Unit *</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(value) => handleItemChange(index, 'unit', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Accounting Code */}
                      <div className="col-span-3 space-y-2">
                        <Label className="text-xs">Accounting Code</Label>
                        <Input
                          placeholder="e.g., 5101"
                          value={item.accounting_code || ''}
                          onChange={(e) => handleItemChange(index, 'accounting_code', e.target.value)}
                        />
                      </div>

                      {/* Specifications */}
                      <div className="col-span-12 space-y-2">
                        <Label className="text-xs">Specifications (Optional)</Label>
                        <Input
                          placeholder="Additional specifications or notes"
                          value={item.specifications || ''}
                          onChange={(e) => handleItemChange(index, 'specifications', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="gap-1">
              <Save className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create SIMR Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
