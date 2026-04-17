import { z } from "zod";

// Task Assignment Schema
export const taskAssignmentSchema = z.object({
  worker_id: z.number().min(1, "Please select a worker"),
  farm_id: z.number().min(1, "Please select a farm"),
  task_code: z.string().min(1, "Please select a task code"),
  block_id: z.number().min(1, "Please select a block").optional(),
  crop_type: z.string().optional(),
  quantity: z.number().positive("Quantity must be greater than 0").optional(),
  rate: z.number().positive("Rate must be greater than 0"),
  date_worked: z.string().min(1, "Please select a date"),
  payment_method: z.enum(["per_task", "per_day"]),
});

export type TaskAssignmentFormData = z.infer<typeof taskAssignmentSchema>;

// Task Completion Schema
export const taskCompletionSchema = z.object({
  task_assignment_id: z.number().min(1, "Please select a task"),
  actual_quantity: z.number().min(0).optional(),
  completion_notes: z.string().optional(),
});

export type TaskCompletionFormData = z.infer<typeof taskCompletionSchema>;
