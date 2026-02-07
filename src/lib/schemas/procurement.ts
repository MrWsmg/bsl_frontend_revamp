import { z } from "zod";

// Purchase Request Item Schema
const purchaseRequestItemSchema = z.object({
  item_name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  estimated_unit_price: z.number().positive("Unit price must be greater than 0"),
  specifications: z.string().optional(),
});

// Purchase Request Schema
export const purchaseRequestSchema = z.object({
  farm_id: z.string().min(1, "Please select a farm"),
  department: z.string().min(1, "Department is required"),
  justification: z.string().min(1, "Justification is required"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  budget_code: z.string().optional(),
  items: z.array(purchaseRequestItemSchema).min(1, "Add at least one item"),
});

export type PurchaseRequestFormData = z.infer<typeof purchaseRequestSchema>;
export type PurchaseRequestItemData = z.infer<typeof purchaseRequestItemSchema>;

// Purchase Order Item Schema
const purchaseOrderItemSchema = z.object({
  item_name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity_ordered: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  unit_price: z.number().positive("Unit price must be greater than 0"),
  specifications: z.string().optional(),
});

// Purchase Order Schema
export const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, "Please select a supplier"),
  delivery_date: z.string().optional(),
  payment_terms: z.string().min(1, "Payment terms are required"),
  shipping_address: z.string().min(1, "Shipping address is required"),
  items: z.array(purchaseOrderItemSchema).min(1, "Add at least one item"),
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderItemData = z.infer<typeof purchaseOrderItemSchema>;

// Goods Receipt Item Schema
const goodsReceiptItemSchema = z.object({
  purchase_order_item_id: z.number(),
  quantity_received: z.number().min(0, "Quantity must be 0 or greater"),
  condition: z.enum(["good", "damaged", "wrong_item"]),
  rejection_reason: z.string().optional(),
});

// Goods Receipt Schema
export const goodsReceiptSchema = z.object({
  purchase_order_id: z.string().min(1, "Please select a purchase order"),
  delivery_note_number: z.string().optional(),
  carrier_name: z.string().optional(),
  vehicle_number: z.string().optional(),
  items: z.array(goodsReceiptItemSchema),
});

export type GoodsReceiptFormData = z.infer<typeof goodsReceiptSchema>;
export type GoodsReceiptItemData = z.infer<typeof goodsReceiptItemSchema>;
