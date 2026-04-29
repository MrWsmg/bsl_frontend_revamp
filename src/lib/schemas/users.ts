import { z } from "zod";

// User Roles
export const userRoles = [
  "admin",
  "managing_director",
  "general_manager",
  "manager",
  "account_manager",
  "financial_controller",
  "payroll_master",
  "payroll",
  "stock",
  "farm_clerk",
  "procurement_officer",
  "supervisor",
  "sub_supervisor",
  "factory_supervisor",
  "godown_manager",
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
  birth_date: z.string().optional(),
  worker_type: z.enum(workerTypes),
  skills: z.string().optional(),
  is_active: z.boolean(),
  farm_assignments: z.array(z.number()),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
});

export type AddWorkerFormData = z.infer<typeof addWorkerSchema>;
