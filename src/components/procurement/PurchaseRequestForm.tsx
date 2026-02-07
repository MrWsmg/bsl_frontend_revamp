"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import apiService from '../../services/api';
import { Farm } from '../../types';
import { PRIORITY_LEVELS, APPROVAL_THRESHOLDS } from '../../constants';
import { toast } from 'sonner';
import { purchaseRequestSchema, type PurchaseRequestFormData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';

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

  const form = useForm<PurchaseRequestFormData>({
    resolver: zodResolver(purchaseRequestSchema),
    defaultValues: {
      farm_id: '',
      department: '',
      justification: '',
      priority: 'normal',
      budget_code: '',
      items: [
        {
          item_name: '',
          description: '',
          quantity: 0,
          unit: 'kg',
          estimated_unit_price: 0,
          specifications: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');

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
    append({
      item_name: '',
      description: '',
      quantity: 0,
      unit: 'kg',
      estimated_unit_price: 0,
      specifications: '',
    });
  };

  const calculateEstimatedCost = () => {
    return (watchedItems || []).reduce((total, item) => {
      return total + (Number(item?.quantity) || 0) * (Number(item?.estimated_unit_price) || 0);
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

  const onSubmit = async (data: PurchaseRequestFormData) => {
    setLoading(true);
    try {
      const requestData = {
        ...data,
        farm_id: parseInt(data.farm_id),
        items: data.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          estimated_unit_price: Number(item.estimated_unit_price),
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

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="farm_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>
                  Farm <span className="text-red-500">*</span>
                </FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={String(farm.id)}>
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
            name="department"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>
                  Department <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  placeholder="e.g., farm_operations, equipment"
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
                <FieldLabel>
                  Priority <span className="text-red-500">*</span>
                </FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PRIORITY_LEVELS.LOW}>Low</SelectItem>
                    <SelectItem value={PRIORITY_LEVELS.NORMAL}>Normal</SelectItem>
                    <SelectItem value={PRIORITY_LEVELS.HIGH}>High</SelectItem>
                    <SelectItem value={PRIORITY_LEVELS.URGENT}>Urgent</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="budget_code"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Budget Code</FieldLabel>
                <Input
                  {...field}
                  placeholder="Optional budget code"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* Justification */}
        <Controller
          name="justification"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>
                Justification <span className="text-red-500">*</span>
              </FieldLabel>
              <Textarea
                {...field}
                rows={3}
                placeholder="Explain why these items are needed..."
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Items Section */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Items</h3>
            <Button type="button" onClick={addItem} variant="default" size="sm">
              <Plus className="w-4 h-4 mr-2" />
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
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-700">Item {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <Controller
                      name={`items.${index}.item_name`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            Item Name <span className="text-red-500">*</span>
                          </FieldLabel>
                          <Input
                            {...field}
                            placeholder="e.g., NPK Fertilizer 15-15-15"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Controller
                      name={`items.${index}.description`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Description</FieldLabel>
                          <Input
                            {...field}
                            placeholder="Brief description..."
                            aria-invalid={fieldState.invalid}
                          />
                        </Field>
                      )}
                    />
                  </div>

                  <Controller
                    name={`items.${index}.quantity`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Quantity <span className="text-red-500">*</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`items.${index}.unit`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Unit <span className="text-red-500">*</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          placeholder="kg, liters, pieces..."
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`items.${index}.estimated_unit_price`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Est. Unit Price (TZS) <span className="text-red-500">*</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <div>
                    <FieldLabel>Item Total</FieldLabel>
                    <Input
                      value={(
                        (Number(watchedItems?.[index]?.quantity) || 0) *
                        (Number(watchedItems?.[index]?.estimated_unit_price) || 0)
                      ).toLocaleString()}
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Controller
                      name={`items.${index}.specifications`}
                      control={form.control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Specifications</FieldLabel>
                          <Textarea
                            {...field}
                            rows={2}
                            placeholder="Technical specs, quality requirements..."
                          />
                        </Field>
                      )}
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Purchase Request'}
          </Button>
        </div>
      </form>
    </div>
  );
};
