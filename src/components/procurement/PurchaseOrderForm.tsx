"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, FileText } from 'lucide-react';
import apiService from '../../services/api';
import { Supplier, PurchaseRequest } from '../../types';
import { toast } from 'sonner';
import { purchaseOrderSchema, type PurchaseOrderFormData } from '@/lib/schemas';
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

  // Prepare default items from purchase request if available
  const getDefaultItems = () => {
    if (purchaseRequest?.items && purchaseRequest.items.length > 0) {
      return purchaseRequest.items.map(item => ({
        item_name: item.item_name,
        description: item.description || '',
        quantity_ordered: item.quantity,
        unit: item.unit,
        unit_price: item.estimated_unit_price,
        specifications: item.specifications || '',
      }));
    }
    return [
      {
        item_name: '',
        description: '',
        quantity_ordered: 0,
        unit: 'kg',
        unit_price: 0,
        specifications: '',
      },
    ];
  };

  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplier_id: '',
      delivery_date: '',
      payment_terms: 'Net 30 days after delivery',
      shipping_address: purchaseRequest?.farm
        ? `${purchaseRequest.farm.name}, ${purchaseRequest.farm.location}`
        : '',
      items: getDefaultItems(),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await apiService.procurement.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Failed to load suppliers');
    }
  };

  const addItem = () => {
    append({
      item_name: '',
      description: '',
      quantity_ordered: 0,
      unit: 'kg',
      unit_price: 0,
      specifications: '',
    });
  };

  const calculateSubtotal = () => {
    return (watchedItems || []).reduce((total, item) => {
      return total + (Number(item?.quantity_ordered) || 0) * (Number(item?.unit_price) || 0);
    }, 0);
  };

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.18; // 18% VAT
  };

  const onSubmit = async (data: PurchaseOrderFormData) => {
    setLoading(true);
    try {
      const requestData = {
        purchase_request_id: purchaseRequest?.id,
        supplier_id: parseInt(data.supplier_id),
        delivery_date: data.delivery_date || undefined,
        payment_terms: data.payment_terms,
        shipping_address: data.shipping_address,
        items: data.items.map(item => ({
          ...item,
          quantity_ordered: Number(item.quantity_ordered),
          unit_price: Number(item.unit_price),
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

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Supplier & Delivery Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="supplier_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>
                  Supplier <span className="text-red-500">*</span>
                </FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={String(supplier.id)}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="delivery_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Expected Delivery Date</FieldLabel>
                <Input
                  {...field}
                  type="date"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <div className="md:col-span-2">
            <Controller
              name="payment_terms"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Payment Terms <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    placeholder="e.g., Net 30 days after delivery"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <div className="md:col-span-2">
            <Controller
              name="shipping_address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    Shipping Address <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Textarea
                    {...field}
                    rows={2}
                    placeholder="Complete delivery address..."
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Order Items</h3>
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
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Description</FieldLabel>
                          <Input {...field} />
                        </Field>
                      )}
                    />
                  </div>

                  <Controller
                    name={`items.${index}.quantity_ordered`}
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
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`items.${index}.unit_price`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Unit Price (TZS) <span className="text-red-500">*</span>
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
                    <FieldLabel>Line Total</FieldLabel>
                    <Input
                      value={(
                        (Number(watchedItems?.[index]?.quantity_ordered) || 0) *
                        (Number(watchedItems?.[index]?.unit_price) || 0)
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
                          <Textarea {...field} rows={2} />
                        </Field>
                      )}
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Purchase Order'}
          </Button>
        </div>
      </form>
    </div>
  );
};
