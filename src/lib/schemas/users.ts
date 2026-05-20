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
  password: z.string().optional(),
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

export const paymentMethods = ["bank", "mobile_money", "cash"] as const;

export const genders = ["male", "female", "other"] as const;

// Add Worker Schema
export const addWorkerSchema = z.object({
  name: z.string().optional(),
  full_name: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  worker_type: z.enum(workerTypes),
  gender: z.enum(genders).optional(),
  origin: z.string().optional(),
  home_farm_id: z.number().optional(),
  skills: z.string().optional(),
  is_active: z.boolean(),
  farm_assignments: z.array(z.number()),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  payment_method: z.enum(paymentMethods).optional(),
  mobile_money_provider: z.string().optional(),
  mobile_money_number: z.string().optional(),
  user_id: z.number().optional(),
}).refine(
  (data) => data.worker_type !== "permanent" || data.home_farm_id != null,
  { message: "Home farm is required for permanent workers", path: ["home_farm_id"] }
);

export type AddWorkerFormData = z.infer<typeof addWorkerSchema>;
