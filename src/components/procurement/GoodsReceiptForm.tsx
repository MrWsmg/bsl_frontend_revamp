"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package } from 'lucide-react';
import apiService from '../../services/api';
import { PurchaseOrder } from '../../types';
import { ITEM_CONDITION } from '../../constants';
import { toast } from 'sonner';
import { goodsReceiptSchema, type GoodsReceiptFormData } from '@/lib/schemas';
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

  const form = useForm<GoodsReceiptFormData>({
    resolver: zodResolver(goodsReceiptSchema),
    defaultValues: {
      purchase_order_id: '',
      delivery_note_number: '',
      carrier_name: '',
      vehicle_number: '',
      items: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
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
    form.setValue('purchase_order_id', poId);

    if (poId) {
      try {
        const po = await apiService.procurement.getPurchaseOrder(parseInt(poId));
        setSelectedPO(po);

        // Pre-populate items from PO
        if (po.items) {
          const newItems = po.items.map(item => ({
            purchase_order_item_id: item.id!,
            quantity_received: item.quantity_ordered,
            condition: 'good' as const,
            rejection_reason: '',
          }));
          replace(newItems);
        }
      } catch (error) {
        console.error('Error loading PO details:', error);
        toast.error('Failed to load PO details');
      }
    } else {
      setSelectedPO(null);
      replace([]);
    }
  };

  const onSubmit = async (data: GoodsReceiptFormData) => {
    setLoading(true);
    try {
      const requestData = {
        purchase_order_id: parseInt(data.purchase_order_id),
        delivery_note_number: data.delivery_note_number || undefined,
        carrier_name: data.carrier_name || undefined,
        vehicle_number: data.vehicle_number || undefined,
        items: data.items.map(item => ({
          purchase_order_item_id: item.purchase_order_item_id,
          quantity_received: Number(item.quantity_received),
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

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Delivery Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Controller
              name="purchase_order_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Purchase Order <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Select value={field.value} onValueChange={handlePOChange}>
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select purchase order" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseOrders.map((po) => (
                        <SelectItem key={po.id} value={String(po.id)}>
                          {po.po_number} - {po.supplier?.name} ({po.total_amount.toLocaleString()} TZS)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <Controller
            name="delivery_note_number"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Delivery Note Number</FieldLabel>
                <Input {...field} placeholder="DN-2025-XXXX" />
              </Field>
            )}
          />

          <Controller
            name="carrier_name"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Carrier Name</FieldLabel>
                <Input {...field} placeholder="Transport company" />
              </Field>
            )}
          />

          <Controller
            name="vehicle_number"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Vehicle Number</FieldLabel>
                <Input {...field} placeholder="T 123 ABC" />
              </Field>
            )}
          />
        </div>

        {/* Items Section */}
        {selectedPO && fields.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Received Items</h3>

            <div className="space-y-4">
              {fields.map((item, index) => {
                const poItem = selectedPO.items?.[index];
                if (!poItem) return null;

                const currentCondition = watchedItems?.[index]?.condition;

                return (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-3">
                        <h4 className="font-medium text-gray-800">{poItem.item_name}</h4>
                        <p className="text-sm text-gray-600">
                          Ordered: {poItem.quantity_ordered} {poItem.unit}
                        </p>
                      </div>

                      <Controller
                        name={`items.${index}.quantity_received`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>
                              Quantity Received <span className="text-red-500">*</span>
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
                        name={`items.${index}.condition`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>
                              Condition <span className="text-red-500">*</span>
                            </FieldLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger aria-invalid={fieldState.invalid}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={ITEM_CONDITION.GOOD}>Good</SelectItem>
                                <SelectItem value={ITEM_CONDITION.DAMAGED}>Damaged</SelectItem>
                                <SelectItem value={ITEM_CONDITION.WRONG_ITEM}>Wrong Item</SelectItem>
                              </SelectContent>
                            </Select>
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />

                      {currentCondition !== 'good' && (
                        <div className="md:col-span-3">
                          <Controller
                            name={`items.${index}.rejection_reason`}
                            control={form.control}
                            render={({ field }) => (
                              <Field>
                                <FieldLabel>Rejection Reason</FieldLabel>
                                <Textarea
                                  {...field}
                                  rows={2}
                                  placeholder="Describe the issue..."
                                />
                              </Field>
                            )}
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !selectedPO}>
            {loading ? 'Creating...' : 'Create Goods Receipt Note'}
          </Button>
        </div>
      </form>
    </div>
  );
};
