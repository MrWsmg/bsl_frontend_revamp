// Core types for the application
export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  farm_id?: number | null;
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
  farm_id: number;
  name: string;
  location: string;
  crops: string;
  total_area: number;
}

export interface Block {
  id: number;
  farm_id: number;
  name: string;
  area?: number;
  crops?: string;
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

// SIMR (Supervisor Item Material Request) Types
export type SIMRStatus = 'pending_fm' | 'approved' | 'rejected' | 'collected';

export interface SimrItem {
  id?: number;
  simr_id?: number;
  item_name: string;
  quantity_requested: number;
  unit: string;
  price_list_id?: number;
  accounting_code?: string;
  specifications?: string;
}

export interface SimrRequest {
  id: number;
  simr_number: string;
  farm_id: number;
  block_id?: number;
  purpose: string;
  priority: string;
  status: SIMRStatus;
  requested_by: number;
  requester_name?: string;
  fm_approved_by?: number;
  fm_approved_at?: string;
  fm_approval_notes?: string;
  fm_rejected_reason?: string;
  collected_by?: number;
  collected_at?: string;
  items: SimrItem[];
  created_at: string;
  updated_at: string;
  farm?: Farm;
}

// SIMR Request payload for creating new requests
export interface SimrRequestPayload {
  farm_id: number;
  block_id?: number;
  purpose: string;
  priority?: string;
  items: SimrItem[];
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
  worker_name?: string;          // flat field (some endpoints)
  worker?: { id: number; name?: string; full_name?: string; [key: string]: any }; // nested object
  farm_id: number;
  farm_name?: string;            // flat field (some endpoints)
  farm?: { id: number; name?: string; [key: string]: any }; // nested object
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'sick';
  check_in_time?: string;
  check_out_time?: string;
  hours_worked?: number;
  notes?: string;
  // Face verification fields (check-in)
  verification_photo_url?: string | null;
  face_verification_confidence?: number | null;
  face_verification_status?: 'manual' | 'verified' | 'failed';
  // Face verification fields (checkout)
  checkout_photo_url?: string | null;
  checkout_face_verification_confidence?: number | null;
  checkout_face_verification_status?: 'manual' | 'verified' | 'failed';
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
  lpo_id: number;
  /** @deprecated use lpo_id */
  purchase_order_id?: number;
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

  status?: string;
  lpo_number?: string;
  smr_id?: number;
  smr_number?: string;
  simr_id?: number;
  simr_number?: string;

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

export interface GinItem {
  id: number;
  item_name: string;
  quantity_requested: number;
  quantity_issued: number;
  unit: string;
  accounting_code?: string;
  specifications?: string;
}

export interface GinDocument {
  id: number;
  gin_number: string;
  simr_id?: number;
  simr_number?: string;
  farm_id: number;
  farm?: Farm;
  status: string;
  issued_by?: number;
  issued_by_name?: string;
  issued_to?: number;
  issued_to_name?: string;
  tv_id?: number;
  tv_number?: string;
  tv_required?: boolean;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  items?: GinItem[];
}

export interface ChainNode {
  id: number;
  number: string;
  status: string;
  doc_type: string;
  created_at?: string;
}

export interface ExternalProcurementChain {
  smr: ChainNode | null;
  lpos: ChainNode[];
  grns: ChainNode[];
  tvs: ChainNode[];
  dns: ChainNode[];
  gate_passes: ChainNode[];
}

export interface InternalProcurementChain {
  simr: ChainNode | null;
  gins: ChainNode[];
  grns: ChainNode[];
  tvs: ChainNode[];
  dns: ChainNode[];
  gate_passes: ChainNode[];
  triggered_smr: ChainNode | null;
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
  vrn?: string;
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
  hours_worked?: number;
  face_verification_status: 'verified' | 'failed' | 'manual';
}

export interface WorkerPhotoUploadResponse extends PhotoUploadResponse {
  face_indexed?: boolean;
  face_id?: string;
}

// ===========================
// Picking Operations Types
// ===========================

export interface DailyPickingPrice {
  id: number;
  farm_id: number;
  date: string;
  price_per_kg: number;
  set_by: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface CoffeeHarvestForecast {
  id: number;
  farm_id: number;
  block_id?: number;
  season_year: number;
  flowering_date?: string;
  flowering_intensity?: 'low' | 'medium' | 'high';
  pins_forming_date?: string;
  pins_density?: 'sparse' | 'moderate' | 'dense';
  maturing_date?: string;
  maturing_status?: 'early' | 'on_track' | 'delayed';
  estimated_yield_kg?: number;
  actual_yield_kg?: number;
  variety?: string;
  recorded_by?: number;
  created_at: string;
}

export interface SeasonCommunication {
  id: number;
  farm_id: number;
  season_year: number;
  communication_type: 'one_month' | 'two_weeks' | 'one_day';
  target_audience?: string;
  message_template: string;
  sent_at?: string;
  sent_by?: number;
  recipient_count?: number;
  delivery_method: 'sms' | 'in_app' | 'both';
  status: string;
  created_at: string;
}

export interface PickingEquipmentCheck {
  id: number;
  farm_id: number;
  season_year: number;
  check_date: string;
  checked_by: number;
  bags_available: number;
  bags_condition?: string;
  scales_count: number;
  scales_tared: boolean;
  scales_calibrated: boolean;
  tractors_operational: number;
  popping_discs_available: number;
  fuel_litres_available: number;
  drying_tables_count: number;
  drying_tables_condition?: string;
  overall_status: string;
  created_at: string;
}

export interface PickingSeason {
  id: number;
  farm_id: number;
  season_year: number;
  start_date: string;
  end_date?: string;
  status: 'planned' | 'active' | 'completed';
  total_cherry_kg: number;
  created_at: string;
}

export interface PickingSession {
  id: number;
  season_id?: number;
  farm_id: number;
  block_id?: number;
  block_name?: string;
  date: string;
  sub_supervisor_id?: number;
  sub_supervisor_name?: string;
  scale_supervisor_id: number;
  price_per_kg: number;
  total_cherry_kg: number;
  total_pickers: number;
  status: 'open' | 'closed';
  notes?: string;
  created_at: string;
}

export interface PickingRecord {
  id: number;
  session_id: number;
  worker_id: number;
  worker_name: string;
  worker_phone?: string;
  farm_id: number;
  block_id?: number;
  cherry_weight_kg: number;
  tare_weight_kg: number;
  net_weight_kg: number;
  price_per_kg: number;
  total_payment: number;
  variety?: string;
  weighing_time: string;
  recorded_by: number;
  sms_sent: boolean;
  sms_sent_at?: string;
  payroll_record_id?: number;
  payroll_synced: boolean;
  created_at: string;
}

export interface PickingDailySummary {
  farm_id: number;
  date: string;
  total_sessions: number;
  total_pickers: number;
  total_cherry_kg: number;
  total_payment: number;
  avg_kg_per_picker: number;
  price_per_kg: number;
  sessions: PickingSession[];
}

export interface PickerLeaderboardEntry {
  worker_id: number;
  worker_name: string;
  total_kg: number;
  total_payment: number;
  weighings: number;
}

// ===========================
// Factory Processing Types
// ===========================

export interface FactoryIntake {
  id: number;
  factory_farm_id: number;
  intake_date: string;
  source_farm_id: number;
  source_block_id?: number;
  picking_session_ids?: string;
  variety?: string;
  cherry_weight_kg: number;
  debe_count?: number;
  vehicle_number?: string;
  delivered_by?: string;
  received_by?: number;
  created_at: string;
}

export interface FermentationTank {
  id: number;
  factory_farm_id: number;
  tank_name: string;
  capacity_kg: number;
  is_active: boolean;
  current_batch?: FermentationBatch;
}

export interface FermentationBatch {
  id: number;
  tank_id: number;
  factory_farm_id: number;
  intake_ids?: string;
  source_blocks?: string;
  pulped_weight_kg: number;
  start_time: string;
  expected_end_time?: string;
  actual_end_time?: string;
  fermentation_hours?: number;
  status: 'active' | 'completed' | 'washed';
  quality_notes?: string;
}

export interface WashingRecord {
  id: number;
  fermentation_batch_id: number;
  factory_farm_id: number;
  washed_weight_kg: number;
  washing_date: string;
  water_usage_litres?: number;
}

export interface DryingTable {
  id: number;
  factory_farm_id: number;
  table_name: string;
  table_type: 'table' | 'electrical_dryer';
  capacity_kg: number;
  is_active: boolean;
  active_batch?: DryingBatch;
}

export interface DryingBatch {
  id: number;
  drying_table_id: number;
  factory_farm_id: number;
  washing_record_id?: number;
  grade: 'P1' | 'P2' | 'P3' | 'mbuni';
  origin_label?: string;
  source_blocks?: string;
  variety?: string;
  wet_parchment_weight_kg: number;
  debe_count?: number;
  target_moisture_pct?: number;
  current_moisture_pct?: number;
  dry_parchment_weight_kg?: number;
  original_cherry_kg?: number;
  cherry_to_parchment_ratio?: number;
  drying_method: 'table' | 'electrical';
  status: 'drying' | 'ready' | 'completed';
  started_at: string;
  completed_at?: string;
}

export interface FactoryDailySummary {
  factory_farm_id: number;
  date: string;
  total_intake_kg: number;
  active_fermentations: number;
  washing_today_kg: number;
  active_drying_batches: number;
  completed_drying_kg: number;
}

export interface CherryToParchmentRatio {
  batch_id: number;
  grade: string;
  origin_label?: string;
  cherry_kg: number;
  parchment_kg: number;
  ratio: number;
  completed_at: string;
}

// ===========================
// Godown / Warehouse Types
// ===========================

export interface CoffeeGodownEntry {
  id: number;
  godown_farm_id: number;
  transaction_date: string;
  transaction_type: 'receipt' | 'issue' | 'transfer' | 'bulk_mix';
  grade: string;
  origin_farm_id?: number;
  origin_block_ids?: string;
  origin_label?: string;
  variety?: string;
  reference_type?: string;
  reference_id?: number;
  weight_in_kg?: number;
  weight_out_kg?: number;
  running_balance_kg: number;
  bag_count?: number;
  pile_identifier?: string;
  entered_by?: number;
  authorized_by?: number;
  notes?: string;
  created_at: string;
}

export interface CoffeeGodownPile {
  id: number;
  pile_identifier: string;
  godown_farm_id: number;
  grade: string;
  origin_details?: string;
  variety?: string;
  current_weight_kg: number;
  bag_count: number;
  is_mixed: boolean;
  parent_pile_ids?: string;
  mix_reason?: string;
  status: 'active' | 'depleted' | 'mixed';
  created_at: string;
}

export interface GodownInventory {
  godown_farm_id: number;
  total_weight_kg: number;
  total_bags: number;
  by_grade: Record<string, { weight_kg: number; bags: number; piles: number }>;
  piles: CoffeeGodownPile[];
}

export interface GodownDailyStock {
  id: number;
  godown_farm_id: number;
  date: string;
  p1_weight_kg: number;
  p2_weight_kg: number;
  p3_weight_kg: number;
  mbuni_weight_kg: number;
  total_weight_kg: number;
  total_bag_count: number;
}

// ===========================
// Milling Types
// ===========================

export interface MillingBatch {
  id: number;
  batch_number: string;
  factory_farm_id: number;
  godown_pile_ids?: string;
  transport_method?: string;
  vehicle_number?: string;
  parchment_weight_in_kg: number;
  green_bean_weight_kg?: number;
  grade_separation?: string;
  milling_loss_kg?: number;
  parchment_to_green_ratio?: number;
  total_bags?: number;
  bag_details?: string;
  milling_machine?: string;
  status: 'pending' | 'in_transit' | 'at_mill' | 'milling' | 'completed';
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// ===========================
// Traceability Types
// ===========================

export interface TraceabilityResult {
  entity_type: string;
  entity_id: number;
  chain: TraceabilityNode[];
}

export interface TraceabilityNode {
  stage: string;
  type: string;
  id: number;
  details: Record<string, any>;
  children?: TraceabilityNode[];
}

// ===========================
// Yield Forecasting Types
// ===========================

export interface CoffeeYieldSample {
  id: number;
  farm_id: number;
  block_id?: number;
  sample_date: string;
  sampled_by: string;
  fruiting_branches: number;
  sampled_branches_count: number;
  avg_cherries_per_branch: number;
  branch_counts?: string;
  avg_cherry_weight_kg?: number;
  coffee_stage: 'pinhead' | 'pea_sized' | 'full_green' | 'color_break';
  notes?: string;
  created_at: string;
}

export interface CoffeeYieldForecast {
  id: number;
  farm_id: number;
  block_id?: number;
  forecast_date: string;
  season_year: number;
  crop_type: string;
  variety?: string;
  trees_per_hectare: number;
  conversion_factor_cf: number;
  cherry_ratio_cr: number;
  loss_factor: number;
  fruit_set_factor: number;
  biennial_index: number;
  avg_kg_per_picker_per_day: number;
  harvest_duration_days: number;
  sample_count: number;
  mean_cherries_per_tree: number;
  std_dev?: number;
  std_error?: number;
  ci_lower_kg_per_ha?: number;
  ci_upper_kg_per_ha?: number;
  yield_kg_per_tree: number;
  yield_kg_per_hectare: number;
  adjusted_yield_kg_per_hectare: number;
  total_farm_yield_kg: number;
  optimistic_yield_kg: number;
  base_yield_kg: number;
  pessimistic_yield_kg: number;
  estimated_pickers_needed: number;
  estimated_harvest_start?: string;
  estimated_harvest_end?: string;
  status: 'draft' | 'confirmed';
  confirmed_by?: string;
  notes?: string;
  created_at: string;
}

// ===========================
// Harvest Planning Types
// ===========================

export interface HarvestPlan {
  id: number;
  farm_id: number;
  forecast_id?: number;
  season_year: number;
  crop_type: string;
  fly_picking_start: string;
  main_harvest_start: string;
  estimated_end: string;
  pickers_needed: number;
  pickers_confirmed?: number;
  pickers_type: string;
  status: 'draft' | 'approved' | 'revised' | 'completed';
  checklist_completed: boolean;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  notif_1month_sent: boolean;
  notif_2weeks_sent: boolean;
  notif_1day_sent: boolean;
  created_at: string;
}

export interface HarvestChecklist {
  id: number;
  plan_id: number;
  farm_id: number;
  // Scales
  field_scales_serviced: boolean;
  field_scales_calibrated: boolean;
  hopper_scales_serviced: boolean;
  hopper_scales_calibrated: boolean;
  parchment_scales_serviced: boolean;
  platform_scales_serviced: boolean;
  // Materials
  harvest_bags_ready: boolean;
  bags_count?: number;
  vehicles_listed?: string;
  vehicles_prepared: boolean;
  // Documents
  grn_documents_ready: boolean;
  seals_ready: boolean;
  transfer_documents_ready: boolean;
  // Drying
  drying_tables_repaired: boolean;
  drying_plastic_sheeting_ok: boolean;
  table_legs_ok: boolean;
  shade_netting_ok: boolean;
  electric_driers_serviced: boolean;
  drier_cracks_checked: boolean;
  drier_soot_cleaned: boolean;
  drier_electrical_checked: boolean;
  fuel_availability_confirmed: boolean;
  fuel_stock_days?: number;
  // Storage
  storage_roofing_ok: boolean;
  factory_doors_ok: boolean;
  alarm_system_tested: boolean;
  cctv_tested: boolean;
  fire_extinguishers_checked: boolean;
  // Processing
  pulper_disks_calibrated: boolean;
  pulper_belts_bearings_ok: boolean;
  washing_channels_ok: boolean;
  fermentation_dams_ok: boolean;
  // Security
  security_count?: number;
  security_flashlights: boolean;
  security_whistles: boolean;
  security_rain_gear: boolean;
  security_phones_credit: boolean;
  security_remotes_ok: boolean;
  security_firearms_serviced: boolean;
  // Sign-off
  completed_by?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
}

// ===========================
// Daily Picking Rate Types
// ===========================

export interface DailyPickingRate {
  id: number;
  farm_id: number;
  rate_date: string;
  picking_type: 'fly' | 'main' | 'strip';
  rate_per_kg: number;
  set_by: number;
  notes?: string;
  created_at: string;
}

// ===========================
// Picker Weighing Types
// ===========================

export interface PickerWeighingRecord {
  id: number;
  farm_id: number;
  block_id?: number;
  harvest_plan_id?: number;
  date_picked: string;
  supervisor_name: string;
  picking_type: 'main' | 'fly' | 'strip';
  worker_type: 'permanent' | 'contracted';
  picker_name: string;
  picker_phone?: string;
  picker_token?: string;
  gross_weight_kg: number;
  tare_weight_kg: number;
  net_weight_kg: number;
  rate_per_kg: number;
  amount_due: number;
  delivery_note_ref?: string;
  payroll_record_id?: number;
  sms_sent: boolean;
  sms_sent_at?: string;
  created_at: string;
}

// ===========================
// Coffee Processing Batch Types
// ===========================

export interface CoffeeProcessingBatch {
  id: number;
  farm_id: number;
  block_id?: number;
  batch_ref: string;
  variety?: string;
  processing_type: 'washed' | 'honey';
  field_weight_kg: number;
  hopper_weight_kg: number;
  hopper_vs_field_variance?: number;
  status: 'collecting' | 'pulping' | 'fermenting' | 'drying' | 'completed';
  pulping_start?: string;
  pulping_end?: string;
  pulping_photo_url?: string;
  pulping_notes?: string;
  fermentation_start?: string;
  fermentation_end?: string;
  fermentation_duration_hours?: number;
  drying_method?: 'table' | 'electric';
  drying_start?: string;
  drying_end?: string;
  debe_count?: number;
  parchment_kg?: number;
  final_moisture_pct?: number;
  p1_kg?: number;
  p2_kg?: number;
  floaters_kg?: number;
  cardex_entry_id?: number;
  created_at: string;
}

// ===========================
// Drying Log Types
// ===========================

export interface DryingHourlyLog {
  id: number;
  batch_id: number;
  drier_id?: string;
  drier_levels?: number;
  logged_at: string;
  logged_by: string;
  temperature_c?: number;
  moisture_pct?: number;
  photo_url?: string;
  alert_sent: boolean;
  notes?: string;
}

// ===========================
// Harvest Report Types
// ===========================

export interface HarvestReport {
  farm_id: number;
  farm_name: string;
  season_year: number;
  forecast: {
    total_forecast_kg: number;
    optimistic_kg: number;
    pessimistic_kg: number;
  };
  actual: {
    total_cherry_picked_kg: number;
    total_parchment_kg: number;
    p1_kg: number;
    p2_kg: number;
    floaters_kg: number;
    batches_completed: number;
  };
  labour: {
    unique_pickers: number;
    total_weighing_sessions: number;
    total_paid_to_pickers_tzs: number;
  };
  harvest_plans: HarvestPlan[];
}

