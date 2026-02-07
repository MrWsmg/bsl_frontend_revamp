import { z } from "zod";

// User Roles
export const userRoles = [
  "admin",
  "manager",
  "payroll",
  "account_manager",
  "financial_controller",
  "payroll_master",
  "stock",
  "farm_clerk",
  "supervisor",
  "worker",
] as const;

// Add User Schema
export const addUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  farm_id: z.string().optional(),
  role: z.enum(userRoles),
  assigned_farms: z.array(z.number()),
});

export type AddUserFormData = z.infer<typeof addUserSchema>;

// Worker Types
export const workerTypes = ["permanent", "contract"] as const;

// Add Worker Schema
export const addWorkerSchema = z.object({
  name: z.string().optional(),
  full_name: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
  worker_type: z.enum(workerTypes),
  skills: z.string().optional(),
  is_active: z.boolean(),
  farm_assignments: z.array(z.number()),
});

export type AddWorkerFormData = z.infer<typeof addWorkerSchema>;
