// Main API service that combines all API services
import { BaseApiService } from './base';
import { AuthApiService } from './auth';
import { FarmsApiService } from './farms';
import { UsersApiService } from './users';
import { WorkersApiService } from './workers';
import { PayrollApiService } from './payroll';
import { StockApiService } from './stock';
import { ExpensesApiService } from './expenses';
import { TransfersApiService } from './transfers';
import { ActivitiesApiService } from './activities';
import { ReportsApiService } from './reports';
import { ItemsApiService } from './items';
import { TasksApiService } from './tasks';
import { ManagementApiService } from './management';
import { AnalyticsApiService } from './analytics';
import { PhotosApiService } from './photos';
import { ProcurementApiService } from './procurement';
import { AttendanceApiService } from './attendance';

export class ApiService extends BaseApiService {
  public auth: AuthApiService;
  public farms: FarmsApiService;
  public users: UsersApiService;
  public workers: WorkersApiService;
  public payroll: PayrollApiService;
  public stock: StockApiService;
  public expenses: ExpensesApiService;
  public transfers: TransfersApiService;
  public activities: ActivitiesApiService;
  public reports: ReportsApiService;
  public items: ItemsApiService;
  public tasks: TasksApiService;
  public management: ManagementApiService;
  public analytics: AnalyticsApiService;
  public photos: PhotosApiService;
  public procurement: ProcurementApiService;
  public attendance: AttendanceApiService;

  constructor() {
    super();
    this.auth = new AuthApiService();
    this.farms = new FarmsApiService();
    this.users = new UsersApiService();
    this.workers = new WorkersApiService();
    this.payroll = new PayrollApiService();
    this.stock = new StockApiService();
    this.expenses = new ExpensesApiService();
    this.transfers = new TransfersApiService();
    this.activities = new ActivitiesApiService();
    this.reports = new ReportsApiService();
    this.items = new ItemsApiService();
    this.tasks = new TasksApiService();
    this.management = new ManagementApiService();
    this.analytics = new AnalyticsApiService();
    this.photos = new PhotosApiService();
    this.procurement = new ProcurementApiService();
    this.attendance = new AttendanceApiService();
  }

  // Legacy methods for backward compatibility
  async login(credentials: { username: string; password: string }) {
    return this.auth.login(credentials);
  }

  async getFarms(role?: string) {
    return this.farms.getFarms(role);
  }

  async getUsers() {
    return this.users.getUsers();
  }

  async getWorkers() {
    return this.workers.getWorkers();
  }

  async getPayrollFarms() {
    return this.payroll.getPayrollFarms();
  }

  async getPayrollRecords(params?: { farm_id?: number; start_date?: string; end_date?: string }) {
    return this.payroll.getPayrollRecords(params);
  }

  async createPayrollRecord(data: any) {
    return this.payroll.createPayrollRecord(data);
  }

  async updatePayrollRecord(recordId: number, data: any) {
    return this.payroll.updatePayrollRecord(recordId, data);
  }

  async approvePayrollRecord(recordId: number) {
    return this.payroll.approvePayrollRecord(recordId);
  }

  async rejectPayrollRecord(recordId: number) {
    return this.payroll.rejectPayrollRecord(recordId);
  }

  async getPayrollSummary(params?: { farm_id?: number; start_date?: string; end_date?: string }) {
    return this.payroll.getPayrollSummary(params);
  }

  async getWeeklySummary() {
    return this.payroll.getWeeklySummary();
  }

  async getPickingRecords(params?: { farm_id?: number; start_date?: string; end_date?: string }) {
    return this.payroll.getPickingRecords(params);
  }

  async getPickingSummary(params?: { farm_id?: number; start_date?: string; end_date?: string }) {
    return this.payroll.getPickingSummary(params);
  }

  async getPickingWeeklySummary() {
    return this.payroll.getPickingWeeklySummary();
  }

  async getStockFarms() {
    return this.stock.getStockFarms();
  }

  async getStockRecords(params?: Record<string, any>) {
    return this.stock.getStockRecords(params);
  }

  async createStockRecord(data: any) {
    return this.stock.createStockRecord(data);
  }

  async getStockSummary(params?: Record<string, any>) {
    return this.stock.getStockSummary(params);
  }

  async getExpenseRecords(params?: Record<string, any>) {
    return this.expenses.getExpenseRecords(params);
  }

  async createExpenseRecord(data: any) {
    return this.expenses.createExpenseRecord(data);
  }

  async getTransferRecords(params?: Record<string, any>) {
    return this.transfers.getTransferRecords(params);
  }

  async createTransferRecord(data: any) {
    return this.transfers.createTransferRecord(data);
  }

  async updateTransferStatus(transferId: number, status: string) {
    return this.transfers.updateTransferStatus(transferId, status);
  }

  async uploadReceipt(file: File) {
    return this.uploadFile('/upload-receipt', file);
  }

  async createUser(userData: any) {
    return this.users.createUser(userData);
  }

  async updateUser(userId: number, userData: any) {
    return this.users.updateUser(userId, userData);
  }

  async createWorker(data: any) {
    return this.workers.createWorker(data);
  }

  async createSupervisorWorker(data: any) {
    return this.workers.createSupervisorWorker(data);
  }

  async updateWorker(workerId: number, data: any) {
    return this.workers.updateWorker(workerId, data);
  }

  async deleteWorker(workerId: number) {
    return this.workers.deleteWorker(workerId);
  }

  async assignTaskToWorker(workerId: number, taskData: any) {
    return this.workers.assignTaskToWorker(workerId, taskData);
  }

  async startWorkerTask(workerId: number, taskId: string | number) {
    return this.workers.startWorkerTask(workerId, taskId);
  }

  async completeWorkerTask(workerId: number, taskAssignmentId: number, completionData: any) {
    return this.workers.completeWorkerTask(workerId, taskAssignmentId, completionData);
  }

  async initializeTaskCodes() {
    return this.tasks.initializeTaskCodes();
  }

  async getCombinedSummary() {
    return this.activities.getCombinedSummary();
  }

  async getSupervisorDailyTotals(date?: string) {
    return this.activities.getSupervisorDailyTotals(date);
  }

  async getSupervisorWorkHistory(startDate: string, endDate: string) {
    return this.activities.getSupervisorWorkHistory(startDate, endDate);
  }

  async getWorkerStats(workerId: number) {
    return this.workers.getWorkerStats(workerId);
  }

  async getAdminTotalArea() {
    return this.activities.getAdminTotalArea();
  }

  async getPayrollPayrollSummary() {
    return this.payroll.getPayrollSummary();
  }

  async getPendingPayrollRecords(params?: Record<string, any>) {
    return this.payroll.getPendingPayrollRecords(params);
  }

  async requestItem(data: any) {
    return this.items.requestItem(data);
  }

  async getSupervisorItemRequests() {
    return this.items.getSupervisorItemRequests();
  }

  async getAllItemRequests() {
    return this.items.getAllItemRequests();
  }

  async getPendingItemRequests() {
    return this.items.getPendingItemRequests();
  }

  async approveItemRequest(requestId: number) {
    return this.items.approveItemRequest(requestId);
  }

  async rejectItemRequest(requestId: number) {
    return this.items.rejectItemRequest(requestId);
  }

  async issueItemRequest(requestId: number) {
    return this.items.issueItemRequest(requestId);
  }

  async confirmReceipt(requestId: number, receivedStatus: "received" | "not_received") {
    return this.items.confirmReceipt(requestId, receivedStatus);
  }

  async getStockMovements(params?: Record<string, any>) {
    return this.stock.getStockMovements(params);
  }

  async getPriceListData() {
    return this.items.getPriceListData();
  }

  async getManagerActivities(params?: Record<string, any>) {
    return this.activities.getManagerActivities(params);
  }

  async getBlocksForFarm(farmId: number) {
    return this.farms.getBlocksForFarm(farmId);
  }

  async createBlock(data: any) {
    return this.farms.createBlock(data);
  }

  async updateBlock(blockId: number, data: any) {
    return this.farms.updateBlock(blockId, data);
  }

  async deleteBlock(blockId: number) {
    return this.farms.deleteBlock(blockId);
  }

  async getFarmBlocksSummary(farmId: number) {
    return this.farms.getFarmBlocksSummary(farmId);
  }

  async getManagerFarms() {
    return this.farms.getManagerFarms();
  }

  async getManagerUsers() {
    return this.users.getManagerUsers();
  }

  async getManagerPendingPayroll() {
    return this.payroll.getManagerPendingPayroll();
  }

  async getManagerAllPayroll() {
    return this.payroll.getManagerAllPayroll();
  }

  async approveManagerPayroll(recordId: number) {
    return this.payroll.approveManagerPayroll(recordId);
  }

  async getManagerItemRequests() {
    return this.items.getManagerItemRequests();
  }

  async getManagerWorkers() {
    return this.workers.getManagerWorkers();
  }

  async getSupervisorWorkers() {
    return this.workers.getSupervisorWorkers();
  }

  async getManagerTaskAssignments() {
    return this.tasks.getManagerTaskAssignments();
  }

  async getManagerCompletedTasks() {
    return this.tasks.getManagerCompletedTasks();
  }

  async getManagerStockRecords() {
    return this.stock.getManagerStockRecords();
  }

  async getManagerInventory() {
    return this.items.getManagerInventory();
  }

  async getManagerExpenses() {
    return this.expenses.getManagerExpenses();
  }

  async getManagerInspections() {
    return this.management.getManagerInspections();
  }

  async createManagerInspection(data: any) {
    return this.management.createManagerInspection(data);
  }

  async getManagerEmergencies() {
    return this.management.getManagerEmergencies();
  }

  async createManagerEmergency(data: any) {
    return this.management.createManagerEmergency(data);
  }

  async getManagerIncidents() {
    return this.management.getManagerIncidents();
  }

  async createManagerIncident(data: any) {
    return this.management.createManagerIncident(data);
  }

  async getManagerForecasts() {
    return this.management.getManagerForecasts();
  }

  async createManagerForecast(data: any) {
    return this.management.createManagerForecast(data);
  }

  async getManagerEquipment() {
    return this.management.getManagerEquipment();
  }

  async createManagerEquipment(data: any) {
    return this.management.createManagerEquipment(data);
  }

  async getManagerStorage() {
    return this.management.getManagerStorage();
  }

  async createManagerStorage(data: any) {
    return this.management.createManagerStorage(data);
  }

  async getAccountManagerPendingPayroll() {
    return this.payroll.getAccountManagerPendingPayroll();
  }

  async approveAccountManagerPayroll(recordId: number) {
    return this.payroll.approveAccountManagerPayroll(recordId);
  }

  async getFinancialControllerPendingPayroll() {
    return this.payroll.getFinancialControllerPendingPayroll();
  }

  async approveFinancialControllerPayroll(recordId: number) {
    return this.payroll.approveFinancialControllerPayroll(recordId);
  }

  async getPayrollMasterPendingPayroll() {
    return this.payroll.getPayrollMasterPendingPayroll();
  }

  async approvePayrollMasterPayroll(recordId: number) {
    return this.payroll.approvePayrollMasterPayroll(recordId);
  }

  async getAnalyticsData(params?: Record<string, any>) {
    return this.activities.getAnalyticsData(params);
  }

  async getAdminManagerDashboardData() {
    return this.analytics.getAdminManagerDashboardData();
  }

  async getAdminManagerBudgets(period: 'weekly' | 'yearly') {
    return this.analytics.getAdminManagerBudgets(period);
  }

  async getAdminManagerPayrollData() {
    return this.analytics.getAdminManagerPayrollData();
  }

  async getAdminManagerStockData() {
    return this.analytics.getAdminManagerStockData();
  }

  async getAdminManagerWorkerData() {
    return this.analytics.getAdminManagerWorkerData();
  }

  async getAdminManagerExpensesData() {
    return this.analytics.getAdminManagerExpensesData();
  }

  async getAdminManagerActivities() {
    return this.analytics.getAdminManagerActivities();
  }

  async getAdminManagerFarms() {
    return this.analytics.getAdminManagerFarms();
  }

  async getAnalyticalDashboardData() {
    return this.analytics.getAnalyticalDashboardData();
  }

  async getAnalyticalBudgets(period: 'weekly' | 'yearly') {
    return this.analytics.getAnalyticalBudgets(period);
  }

  async getAnalyticalPayrollData() {
    return this.analytics.getAnalyticalPayrollData();
  }

  async getAnalyticalStockData() {
    return this.analytics.getAnalyticalStockData();
  }

  async getAnalyticalWorkerData() {
    return this.analytics.getAnalyticalWorkerData();
  }

  async getAnalyticalExpensesData() {
    return this.analytics.getAnalyticalExpensesData();
  }

  async getAnalyticalActivities() {
    return this.analytics.getAnalyticalActivities();
  }

  async getAnalyticalFarms() {
    return this.analytics.getAnalyticalFarms();
  }

  async getAdminActivities(params?: Record<string, any>) {
    return this.activities.getAdminActivities(params);
  }

  async getDailyReport(date: string, farmId?: number) {
    return this.reports.getDailyReport(date, farmId);
  }

  async getWeeklyReport(weekStart: string, farmId?: number) {
    return this.reports.getWeeklyReport(weekStart, farmId);
  }

  async downloadWeeklyReportExcel(weekStart: string, farmId?: number) {
    return this.reports.downloadWeeklyReportExcel(weekStart, farmId);
  }

  async downloadWeeklyReportPDF(weekStart: string, farmId?: number) {
    return this.reports.downloadWeeklyReportPDF(weekStart, farmId);
  }

  async getPayrollWeeklySummary() {
    return this.payroll.getPayrollWeeklySummary();
  }

  async getStockWeeklySummary() {
    return this.stock.getStockWeeklySummary();
  }

  async getStorekeeperWeeklySummary() {
    return this.transfers.getTransferRecords();
  }

  async getTaskCodes() {
    return this.tasks.getTaskCodes();
  }

  async getTaskCodesFromData() {
    return this.tasks.getTaskCodesFromData();
  }

  async getInventoryItems(params?: Record<string, any>) {
    return this.items.getInventoryItems(params);
  }

  async createInventoryItem(data: any) {
    return this.items.createInventoryItem(data);
  }

  async getBslPendingPayrollRecords(params?: Record<string, any>) {
    return this.payroll.getBslPendingPayrollRecords(params);
  }

  async getManagerAttendance(filters?: Record<string, any>) {
    return this.management.getManagerAttendance(filters);
  }

  async getManagerAttendanceReport(farmId: number, reportDate: string) {
    return this.management.getManagerAttendanceReport(farmId, reportDate);
  }

  async getManagerPerformance(filters?: Record<string, any>) {
    return this.management.getManagerPerformance(filters);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
