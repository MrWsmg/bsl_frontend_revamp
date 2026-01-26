// Core types for the application
export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  assigned_farms: string;
  is_active: boolean;
}

export interface PhotoInfo {
  photo_url?: string | null;
  id_image_url?: string | null;
}

export interface PhotoUploadResponse {
  success: boolean;
  url: string;
  message: string;
  user_id?: number | null;
  worker_id?: number | null;
}

export interface Farm {
  id: number;
  name: string;
  location: string;
  crops: string;
  total_area: number;
}

export interface Worker {
  id: number;
  name: string;
  full_name?: string;
  phone?: string;
  worker_type: 'permanent' | 'contract';
  skills?: string;
  is_available?: boolean;
  is_active?: boolean;
  farm_assignments?: string;
  blocks?: string;
  face_id?: string | null; // AWS Rekognition face ID
  photo_url?: string | null; // Worker photo URL
}

export interface PayrollRecord {
  id: number;
  worker_name: string;
  task_code: string;
  quantity: number;
  rate: number;
  total_amount: number;
  crop_type?: string;
  farm?: Farm;
  worker_type: 'permanent' | 'contracted';
  block?: string;
  date_worked: string;
  approval_status: 'pending' | 'approved' | 'rejected';
}

export interface StockRecord {
  id: number;
  item_description: string;
  grade?: string;
  picker_name?: string;
  quantity_kg: number;
  total_payment: number;
  crop_type?: string;
  farm?: Farm;
  date_recorded: string;
}

export interface ExpenseRecord {
  id: number;
  description: string;
  amount: number;
  crop_type?: string;
  farm?: Farm;
  date: string;
}

export interface TaskAssignment {
  id: number;
  worker_id: number;
  worker_name: string;
  worker?: Worker;
  farm_id: number;
  task_code: string;
  block?: string;
  crop_type?: string;
  quantity: number;
  rate: number;
  total_amount: number;
  date_worked: string;
  payment_method: string;
  status: string;
  assigned_at: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
}

export interface ItemRequest {
  id: number;
  item_name: string;
  quantity: number;
  unit: string;
  requested_by: number;
  requester_name?: string;
  farm_id: number;
  status: string;
  approved_by?: number;
  approved_at?: string;
  approver_name?: string;
  issued_by?: number;
  issued_at?: string;
  received_by?: number;
  received_at?: string;
  received_status?: string;
  created_at: string;
  farm?: Farm;
}

export interface InventoryItem {
  id: number;
  item_name: string;
  quantity: number;
  unit: string;
  farm?: Farm;
}

export interface Inspection {
  id: number;
  farm_id: number;
  inspection_date: string;
  notes: string;
  issues_found?: string;
  actions_taken?: string;
  inspector?: string;
}

export interface Emergency {
  id: number;
  farm_id: number;
  emergency_type: string;
  description: string;
  actions_taken?: string;
  reported_at: string;
}

export interface Incident {
  id: number;
  farm_id: number;
  incident_type: string;
  description: string;
  actions_taken?: string;
  reported_at: string;
}

export interface Forecast {
  id: number;
  farm_id: number;
  crop_type: string;
  expected_quantity: number;
  unit: string;
  forecast_date: string;
  harvest_start_date?: string;
  notes?: string;
}

export interface Equipment {
  id: number;
  farm_id: number;
  name: string;
  type: string;
  status: 'operational' | 'maintenance' | 'broken';
  last_maintenance?: string;
  next_maintenance?: string;
  notes?: string;
}

export interface StorageUnit {
  id: number;
  farm_id: number;
  name: string;
  item_type: string;
  capacity: number;
  unit: string;
  current_stock: number;
  temperature?: number;
  humidity?: number;
  conditions?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Dashboard specific types
export interface DashboardStats {
  totalFarms: number;
  activeUsers: number;
  totalArea: number;
  pendingPayroll: number;
  activeTasks: number;
  availableWorkers: number;
}

export interface Activity {
  id: number;
  type: 'payroll' | 'stock' | 'expense';
  farm: string;
  crop_type?: string;
  created_at: string;
  // Payroll specific
  worker_name?: string;
  task_code?: string;
  quantity?: number;
  rate?: number;
  total_amount?: number;
  worker_type?: 'permanent' | 'contracted';
  block?: string;
  // Stock specific
  item_description?: string;
  grade?: string;
  picker_name?: string;
  quantity_kg?: number;
  total_payment?: number;
  payment_per_kg?: number;
  payment_per_day?: number;
  // Expense specific
  description?: string;
  amount?: number;
}

// Form types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserFormData {
  username: string;
  full_name: string;
  role: string;
  assigned_farms: string;
  is_active: boolean;
}

// Filter types
export interface ActivityFilters {
  farm_id?: string;
  activity_type?: string;
  start_date?: string;
  end_date?: string;
}

export interface ReportFilters {
  date?: string;
  week_start?: string;
  farm_id?: string;
}

export interface AnalyticsFilters {
  period?: string;
  farm_id?: string;
}

// Attendance types
export interface AttendanceRecord {
  id: number;
  worker_id: number;
  worker_name: string;
  farm_id: number;
  farm_name?: string;
  date: string;
  status: 'present' | 'absent' | 'leave' | 'sick';
  check_in_time?: string;
  check_out_time?: string;
  hours_worked?: number;
  notes?: string;
  // Face verification fields
  verification_photo_url?: string | null;
  face_verification_confidence?: number | null;
  face_verification_status?: 'manual' | 'verified' | 'failed';
}

export interface AttendanceReport {
  farm_id: number;
  farm_name: string;
  report_date: string;
  total_workers: number;
  present: number;
  absent: number;
  on_leave: number;
  sick: number;
  attendance_records: AttendanceRecord[];
}

// Performance types
export interface PerformanceMetrics {
  id: number;
  user_id?: number;
  worker_id?: number;
  name: string;
  role?: string;
  period_start: string;
  period_end: string;
  tasks_completed: number;
  tasks_assigned: number;
  completion_rate: number;
  average_quality_score?: number;
  total_hours_worked?: number;
  productivity_score?: number;
  attendance_rate?: number;
}

// Manager-specific filter types
export interface AttendanceFilters {
  farm_id?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export interface PerformanceFilters {
  user_id?: number;
  worker_id?: number;
  start_date?: string;
  end_date?: string;
}

// Procurement types
export interface PurchaseRequestItem {
  id?: number;
  item_name: string;
  description?: string;
  quantity: number;
  unit: string;
  estimated_unit_price: number;
  required_date?: string;
  specifications?: string;
}

export interface PurchaseRequest {
  id: number;
  pr_number: string;
  farm_id: number;
  farm?: Farm;
  requested_by: number;
  requester?: User;
  department: string;
  justification: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'pending_approval' | 'pending_gm_approval' | 'pending_md_approval' | 'approved' | 'rejected' | 'ordered';
  estimated_cost: number;
  currency: string;
  budget_code?: string;

  // Multi-level approval tracking
  manager_approved_by?: number;
  manager_approved_at?: string;
  manager_approval_notes?: string;
  gm_approved_by?: number;
  gm_approved_at?: string;
  gm_approval_notes?: string;
  md_approved_by?: number;
  md_approved_at?: string;
  md_approval_notes?: string;
  approval_level: number; // 0-4

  // Legacy approval (if needed)
  approved_by?: number;
  approved_at?: string;
  approval_notes?: string;

  // AI analysis
  ai_budget_check?: string;
  ai_duplicate_check?: string;
  ai_risk_score?: number;

  created_at: string;
  updated_at: string;

  // Expanded items
  items?: PurchaseRequestItem[];
}

export interface PurchaseOrderItem {
  id?: number;
  purchase_order_id?: number;
  item_name: string;
  description?: string;
  quantity_ordered: number;
  unit: string;
  unit_price: number;
  specifications?: string;
  total_price?: number;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  purchase_request_id?: number;
  purchase_request?: PurchaseRequest;
  supplier_id: number;
  supplier?: Supplier;
  farm_id: number;
  farm?: Farm;
  order_date: string;
  delivery_date?: string;
  payment_terms: string;
  shipping_address: string;
  status: 'draft' | 'pending_approval' | 'pending_account_approval' | 'pending_payroll_master_approval' | 'approved' | 'sent' | 'confirmed' | 'delivered' | 'cancelled';

  // Financial details
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  currency: string;

  created_by: number;
  creator?: User;
  approval_level: number; // 0-4

  // Multi-level approval tracking
  manager_approved_by?: number;
  manager_approved_at?: string;
  manager_approval_notes?: string;
  account_manager_approved_by?: number;
  account_manager_approved_at?: string;
  account_manager_approval_notes?: string;
  payroll_master_approved_by?: number;
  payroll_master_approved_at?: string;
  payroll_master_approval_notes?: string;

  // Legacy approval
  approved_by?: number;
  approved_at?: string;

  // Supplier acknowledgment
  supplier_acknowledged: boolean;
  supplier_acknowledged_at?: string;
  supplier_acknowledgment_notes?: string;
  supplier_acknowledged_by?: string;

  // Document management
  po_document_url?: string;
  po_sent_to_supplier: boolean;
  po_sent_at?: string;

  // AI analysis
  ai_supplier_risk?: string;
  ai_price_analysis?: string;
  ai_delivery_risk?: string;

  created_at: string;
  updated_at: string;

  // Expanded items
  items?: PurchaseOrderItem[];
}

export interface GoodsReceiptItem {
  id?: number;
  goods_receipt_note_id?: number;
  purchase_order_item_id: number;
  purchase_order_item?: PurchaseOrderItem;
  quantity_received: number;
  condition: 'good' | 'damaged' | 'wrong_item';
  rejection_reason?: string;
}

export interface GoodsReceiptNote {
  id: number;
  grn_number: string;
  purchase_order_id: number;
  purchase_order?: PurchaseOrder;
  farm_id: number;
  farm?: Farm;
  receipt_date: string;
  received_by: number;
  receiver?: User;
  inspected_by?: number;
  inspector?: User;
  delivery_note_number?: string;
  carrier_name?: string;
  vehicle_number?: string;

  // Inspection details
  inspection_status: 'pending' | 'passed' | 'failed' | 'partial';
  inspection_notes?: string;
  quality_rating?: number; // 1-5

  // Photo documentation (JSON arrays of URLs)
  inspection_photos?: string[] | string;
  delivery_photos?: string[] | string;
  damage_photos?: string[] | string;

  // Summary
  total_items_received: number;
  total_quantity_received: number;

  created_at: string;

  // Expanded items
  items?: GoodsReceiptItem[];
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: string;
  risk_score?: number;
  is_active: boolean;
  created_at: string;
}

// Procurement filter types
export interface ProcurementFilters {
  farm_id?: number;
  status?: string;
  supplier_id?: number;
  start_date?: string;
  end_date?: string;
}

// Face Verification types
export interface FaceVerificationResult {
  success: boolean;
  message: string;
  attendance_id: number;
  confidence?: number;
  worker_name?: string;
  face_verification_status: 'verified' | 'failed' | 'manual';
}

export interface WorkerPhotoUploadResponse extends PhotoUploadResponse {
  face_indexed?: boolean;
  face_id?: string;
}

