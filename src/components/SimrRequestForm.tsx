"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Package, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import apiService from '../services/api';
import { Farm, Block } from '../types';
import { simrRequestSchema, type SimrRequestFormData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
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

  const form = useForm<SimrRequestFormData>({
    resolver: zodResolver(simrRequestSchema),
    defaultValues: {
      farm_id: '',
      block_id: '',
      purpose: '',
      priority: 'normal',
      items: [
        {
          item_name: '',
          quantity_requested: 0,
          unit: '',
          price_list_id: undefined,
          accounting_code: '',
          specifications: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedFarmId = form.watch('farm_id');

  // Load blocks when farm is selected
  useEffect(() => {
    if (watchedFarmId) {
      loadBlocks(parseInt(watchedFarmId));
    } else {
      setBlocks([]);
    }
  }, [watchedFarmId]);

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

  const addItem = () => {
    append({
      item_name: '',
      quantity_requested: 0,
      unit: '',
      price_list_id: undefined,
      accounting_code: '',
      specifications: '',
    });
  };

  const onSubmit = async (data: SimrRequestFormData) => {
    setLoading(true);
    const loadingToast = toast.loading('Creating SIMR request...');

    try {
      const payload = {
        farm_id: parseInt(data.farm_id),
        block_id: data.block_id ? parseInt(data.block_id) : undefined,
        purpose: data.purpose,
        priority: data.priority,
        items: data.items.map(item => ({
          item_name: item.item_name,
          quantity_requested: Number(item.quantity_requested),
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
    form.reset();
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

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Farm and Block Selection */}
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="farm_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Farm *</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={fieldState.invalid}>
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
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="block_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Block (Optional)</FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!watchedFarmId || blocks.length === 0}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
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
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Purpose and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="purpose"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Purpose *</FieldLabel>
                    <Textarea
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
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Priority</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={fieldState.invalid}>
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
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FieldLabel className="text-base">Requested Items *</FieldLabel>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                  <Plus className="w-3 h-3" />
                  Add Item
                </Button>
              </div>

              {form.formState.errors.items?.root && (
                <div className="text-red-500 text-sm">
                  {form.formState.errors.items.root.message}
                </div>
              )}

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

                    <div className="grid grid-cols-12 gap-3">
                      {/* Item Name */}
                      <div className="col-span-4">
                        <Controller
                          name={`items.${index}.item_name`}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-xs">Item Name *</FieldLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger aria-invalid={fieldState.invalid}>
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
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      </div>

                      {/* Quantity */}
                      <div className="col-span-3">
                        <Controller
                          name={`items.${index}.quantity_requested`}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-xs">Quantity *</FieldLabel>
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Amount"
                                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                aria-invalid={fieldState.invalid}
                              />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      </div>

                      {/* Unit */}
                      <div className="col-span-2">
                        <Controller
                          name={`items.${index}.unit`}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="text-xs">Unit *</FieldLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger aria-invalid={fieldState.invalid}>
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
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      </div>

                      {/* Accounting Code */}
                      <div className="col-span-3">
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
                      </div>

                      {/* Specifications */}
                      <div className="col-span-12">
                        <Controller
                          name={`items.${index}.specifications`}
                          control={form.control}
                          render={({ field }) => (
                            <Field>
                              <FieldLabel className="text-xs">Specifications (Optional)</FieldLabel>
                              <Input {...field} placeholder="Additional specifications or notes" />
                            </Field>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={loading} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-1">
                <Save className="w-4 h-4" />
                {loading ? 'Creating...' : 'Create SIMR Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
