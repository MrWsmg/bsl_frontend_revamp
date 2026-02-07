import { z } from "zod";

// SIMR Item Schema
const simrItemSchema = z.object({
  item_name: z.string().min(1, "Item name is required"),
  quantity_requested: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  price_list_id: z.number().optional(),
  accounting_code: z.string().optional(),
  specifications: z.string().optional(),
});

// SIMR Request Schema
export const simrRequestSchema = z.object({
  farm_id: z.string().min(1, "Please select a farm"),
  block_id: z.string().optional(),
  purpose: z.string().min(1, "Purpose is required"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  items: z.array(simrItemSchema).min(1, "Add at least one item"),
});

export type SimrRequestFormData = z.infer<typeof simrRequestSchema>;
export type SimrItemData = z.infer<typeof simrItemSchema>;
