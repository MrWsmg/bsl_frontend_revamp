// Application constants
export const API_BASE_URL = 'http://localhost:8000/api';

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  PAYROLL: 'payroll',
  STOCK: 'stock',
  STOREKEEPER: 'storekeeper',
  SUPERVISOR: 'supervisor',
  WORKER: 'worker',
  MANAGER: 'manager',
  ACCOUNT_MANAGER: 'account_manager',
  FINANCIAL_CONTROLLER: 'financial_controller',
  PAYROLL_MASTER: 'payroll_master',
  GENERAL_MANAGER: 'general_manager',
  MANAGING_DIRECTOR: 'managing_director',
} as const;

// Dashboard tabs
export const ADMIN_TABS = [
  { id: 'overview', label: 'Overview', icon: 'BarChart3' },
  { id: 'summary', label: 'Summary', icon: 'BarChart3' },
  { id: 'analytics', label: 'Analytics', icon: 'TrendingUp' },
  { id: 'analytical', label: 'Analytical Dashboard', icon: 'PieChart' },
  { id: 'calendar', label: 'Activities Calendar', icon: 'Calendar' },
  { id: 'users', label: 'Users', icon: 'Users' },
  { id: 'managers', label: 'Managers', icon: 'Users' },
  { id: 'store', label: 'Store', icon: 'Warehouse' },
  { id: 'reports', label: 'Reports', icon: 'ClipboardList' },
  { id: 'activities', label: 'Activities', icon: 'Eye' },
] as const;

export const MANAGER_TABS = [
  { id: 'overview', label: 'Overview', icon: 'BarChart3' },
  { id: 'payroll', label: 'Payroll', icon: 'ClipboardList' },
  { id: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
  { id: 'item_requests', label: 'Item Requests', icon: 'Package' },
  { id: 'workers', label: 'Workers', icon: 'User' },
  { id: 'attendance', label: 'Attendance', icon: 'Calendar' },
  { id: 'performance', label: 'Performance', icon: 'TrendingUp' },
  { id: 'stock', label: 'Stock', icon: 'Package' },
  { id: 'equipment', label: 'Equipment', icon: 'Wrench' },
  { id: 'reports', label: 'Reports', icon: 'ClipboardList' },
] as const;

// Activity types
export const ACTIVITY_TYPES = {
  PAYROLL: 'payroll',
  STOCK: 'stock',
  EXPENSE: 'expense',
} as const;

// Worker types
export const WORKER_TYPES = {
  PERMANENT: 'permanent',
  CONTRACTED: 'contracted',
} as const;

// Approval statuses
export const APPROVAL_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Task statuses
export const TASK_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

// Equipment statuses
export const EQUIPMENT_STATUSES = {
  OPERATIONAL: 'operational',
  MAINTENANCE: 'maintenance',
  BROKEN: 'broken',
} as const;

// Emergency types
export const EMERGENCY_TYPES = [
  'disease_outbreak',
  'equipment_failure',
  'weather_damage',
  'pest_infestation',
  'other',
] as const;

// Incident types
export const INCIDENT_TYPES = [
  'theft',
  'bribery',
  'accident',
  'damage',
  'other',
] as const;

// Equipment types
export const EQUIPMENT_TYPES = [
  'tractor',
  'harvester',
  'sprayer',
  'irrigation',
  'other',
] as const;

// Storage item types
export const STORAGE_ITEM_TYPES = [
  'coffee',
  'maize',
  'beans',
  'fertilizer',
  'other',
] as const;

// Units
export const UNITS = {
  KG: 'kg',
  TONS: 'tons',
  LITERS: 'liters',
  BAGS: 'bags',
} as const;

// Analytics periods
export const ANALYTICS_PERIODS = {
  WEEK: '7',
  MONTH: '30',
  QUARTER: '90',
} as const;

// Report formats
export const REPORT_FORMATS = {
  EXCEL: 'excel',
  PDF: 'pdf',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  LOGIN: '/login',
  LOGOUT: '/logout',
  FARMS: '/farms',
  USERS: '/admin/users',
  WORKERS: '/workers',
  PAYROLL: '/payroll/payroll',
  STOCK: '/stock/stock',
  EXPENSES: '/storekeeper/expenses',
  TRANSFERS: '/storekeeper/transfers',
  ACTIVITIES: '/admin/activities',
  ANALYTICS: '/admin/analytics',
  REPORTS: {
    DAILY: '/admin/daily-report',
    WEEKLY: '/admin/weekly-report',
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please log in again.',
  SERVER_ERROR: 'Server error. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logout successful!',
  SAVE_SUCCESS: 'Data saved successfully!',
  UPDATE_SUCCESS: 'Data updated successfully!',
  DELETE_SUCCESS: 'Data deleted successfully!',
  APPROVE_SUCCESS: 'Approved successfully!',
  REJECT_SUCCESS: 'Rejected successfully!',
} as const;

// Procurement constants
export const PR_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  PENDING_GM_APPROVAL: 'pending_gm_approval',
  PENDING_MD_APPROVAL: 'pending_md_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ORDERED: 'ordered',
} as const;

export const PO_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  PENDING_ACCOUNT_APPROVAL: 'pending_account_approval',
  PENDING_PAYROLL_MASTER_APPROVAL: 'pending_payroll_master_approval',
  APPROVED: 'approved',
  SENT: 'sent',
  CONFIRMED: 'confirmed',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const APPROVAL_LEVELS = {
  PENDING: 0,
  MANAGER: 1,
  GM_OR_ACCOUNT: 2,
  MD_OR_PAYROLL: 3,
  FULLY_APPROVED: 4,
} as const;

export const INSPECTION_STATUS = {
  PENDING: 'pending',
  PASSED: 'passed',
  FAILED: 'failed',
  PARTIAL: 'partial',
} as const;

export const ITEM_CONDITION = {
  GOOD: 'good',
  DAMAGED: 'damaged',
  WRONG_ITEM: 'wrong_item',
} as const;

export const GRN_PHOTO_TYPES = {
  INSPECTION: 'inspection',
  DELIVERY: 'delivery',
  DAMAGE: 'damage',
} as const;

// Approval thresholds (in TZS)
export const APPROVAL_THRESHOLDS = {
  PR_MANAGER_ONLY: 5000000, // 5M TZS
  PR_REQUIRES_GM: 5000000, // 5M TZS
  PR_REQUIRES_MD: 20000000, // 20M TZS
} as const;
