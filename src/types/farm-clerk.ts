// Farm Clerk specific types for Attendance, Issuance, and Stock Visibility

import { Farm, Worker } from './index';

// ============= Attendance Types =============

export interface AttendanceCreate {
  farm_id: number;
  worker_id: number;
  date: string;
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'sick';
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
}

export interface AttendanceResponse {
  id: number;
  worker_id: number;
  worker?: Worker;
  worker_name: string;
  farm_id: number;
  farm?: Farm;
  farm_name?: string;
  date: string;
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'sick';
  check_in_time?: string;
  check_out_time?: string;
  hours_worked?: number;
  verification_status: 'manual' | 'verified' | 'failed';
  confidence_score?: number;
  verification_photo_url?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface AttendanceReportResponse {
  farm_id: number;
  farm_name: string;
  report_date: string;
  total_workers: number;
  present: number;
  absent: number;
  half_day: number;
  on_leave: number;
  sick: number;
  attendance_rate: number;
  details: AttendanceResponse[];
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  attendance_id: number;
  confidence?: number;
  worker_name?: string;
  verification_status: 'manual' | 'verified' | 'failed';
}

// ============= Issuance Types =============

export type IssuanceStatus = 'pending' | 'approved' | 'prepared' | 'confirmed' | 'dispatched' | 'rejected';

export interface PendingIssuance {
  id: number;
  item_name: string;
  quantity: number;
  unit: string;
  requester_id: number;
  requester_name: string;
  farm_id: number;
  farm_name?: string;
  farm?: Farm;
  status: IssuanceStatus;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  prepared_at?: string;
  prepared_by?: number;
  confirmed_at?: string;
  confirmed_by?: number;
  dispatch_photo_url?: string;
  dispatched_at?: string;
  gate_pass_number?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// ============= Stock Visibility Types =============

export interface DailyStockItem {
  id: number;
  item_name: string;
  quantity: number;
  unit: string;
  category?: string;
  accounting_code?: string;
  last_movement_date?: string;
  movement_type?: 'in' | 'out';
  movement_quantity?: number;
}

export interface DailyStockResponse {
  date: string;
  farm_id?: number;
  farm_name?: string;
  items: DailyStockItem[];
  total_items: number;
  total_value?: number;
}

export interface YtdStockItem {
  id: number;
  item_name: string;
  category?: string;
  accounting_code?: string;
  unit: string;
  opening_balance: number;
  total_in: number;
  total_out: number;
  net_quantity: number;
  current_balance: number;
  budget_allocated?: number;
  budget_used?: number;
  budget_remaining?: number;
  budget_percentage?: number;
}

export interface YtdStockResponse {
  year: number;
  farm_id?: number;
  farm_name?: string;
  items: YtdStockItem[];
  summary: {
    total_items: number;
    total_budget_allocated: number;
    total_budget_used: number;
    total_budget_remaining: number;
    overall_budget_percentage: number;
  };
}

export interface FarmStockItem {
  id: number;
  item_name: string;
  quantity: number;
  unit: string;
  category?: string;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_point?: number;
  is_low_stock?: boolean;
  last_restocked?: string;
  location?: string;
}

export interface FarmStockResponse {
  farm_id: number;
  farm_name: string;
  items: FarmStockItem[];
  last_updated: string;
  summary: {
    total_items: number;
    low_stock_items: number;
    total_value?: number;
  };
}

export interface ItemLookupResponse {
  id: number;
  item_name: string;
  category?: string;
  unit: string;
  accounting_code?: string;
  current_quantity?: number;
  price?: number;
}

// ============= Filter Types =============

export interface AttendanceFilters {
  farm_id?: number;
  worker_id?: number;
  date?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export interface StockFilters {
  farm_id?: number;
  category?: string;
  search?: string;
  low_stock_only?: boolean;
}
