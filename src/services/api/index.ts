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
import { CalendarApiService } from './calendar';
import { OtherCropsApiService } from './other-crops';
import { MbuniApiService } from './mbuni';
import { FertilizerApiService } from './fertilizer';
import { FuelChemApiService } from './fuel-chemicals';
import { IrrigationStockApiService } from './irrigation-stock';
import { FishFarmingApiService } from './fish-farming';
import { CsvImportApiService, CsvTemplateName } from './csv-import';
import { StoreCardexApiService } from './store-cardex';
import { CherryParchmentApiService } from './cherry-parchment';
import { FieldApplicationApiService } from './field-applications';
import { MandayApiService } from './manday';

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
  public calendar: CalendarApiService;
  public otherCrops: OtherCropsApiService;
  public mbuni: MbuniApiService;
  public fertilizer: FertilizerApiService;
  public fuelChem: FuelChemApiService;
  public irrigationStock: IrrigationStockApiService;
  public fishFarming: FishFarmingApiService;
  public csvImport: CsvImportApiService;
  public storeCardex: StoreCardexApiService;
  public cherryParchment: CherryParchmentApiService;
  public fieldApplications: FieldApplicationApiService;
  public manday: MandayApiService;

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
    this.calendar = new CalendarApiService();
    this.otherCrops = new OtherCropsApiService();
    this.mbuni = new MbuniApiService();
    this.fertilizer = new FertilizerApiService();
    this.fuelChem = new FuelChemApiService();
    this.irrigationStock = new IrrigationStockApiService();
    this.fishFarming = new FishFarmingApiService();
    this.csvImport = new CsvImportApiService();
    this.storeCardex = new StoreCardexApiService();
    this.cherryParchment = new CherryParchmentApiService();
    this.fieldApplications = new FieldApplicationApiService();
    this.manday = new MandayApiService();
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

  async getPayrollRecords(params?: { farm_id?: number; start_date?: string; end_date?: string; status?: string }) {
    return this.payroll.getPayrollRecords(params);
  }

  async getPayrollRecord(recordId: number) {
    return this.payroll.getPayrollRecord(recordId);
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

  async reactivateWorker(workerId: number) {
    return this.workers.reactivateWorker(workerId);
  }

  async getSupervisorWorkerTasks(workerId: number, params?: { status?: string; task_code?: string; skip?: number; limit?: number }) {
    return this.workers.getSupervisorWorkerTasks(workerId, params);
  }

  async cancelTaskAssignment(taskId: number) {
    return this.workers.cancelTaskAssignment(taskId);
  }

  async getAttendanceById(attendanceId: number) {
    return this.attendance.getAttendanceById(attendanceId);
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

  async createSimrRequest(data: any) {
    return this.items.createSimrRequest(data);
  }

  async createProcurementSimr(data: any) {
    return this.items.createProcurementSimr(data);
  }

  async getSimrRequests() {
    return this.items.getSimrRequests();
  }

  async getAllSimrRequests() {
    return this.items.getAllSimrRequests();
  }

  async getPendingItemRequests() {
    return this.items.getFarmClerkPendingRequests();
  }

  async approveFarmClerkRequest(requestId: number) {
    return this.items.approveFarmClerkRequest(requestId);
  }

  async rejectFarmClerkRequest(requestId: number) {
    return this.items.rejectFarmClerkRequest(requestId);
  }

  async getPendingIssuances() {
    return this.items.getPendingIssuances();
  }

  async prepareIssuance(requestId: number) {
    return this.items.prepareIssuance(requestId);
  }

  async issueItemRequest(requestId: number) {
    return this.items.issueItemRequest(requestId);
  }

  async confirmIssuance(requestId: number) {
    return this.items.confirmIssuance(requestId);
  }

  async uploadDispatchPhoto(requestId: number, file: File) {
    return this.items.uploadDispatchPhoto(requestId, file);
  }

  async confirmReceipt(requestId: number, receivedStatus: "received" | "not_received") {
    return this.items.confirmReceipt(requestId, receivedStatus);
  }

  async itemLookup(query: string) {
    return this.items.itemLookup(query);
  }

  async getStockMovements(params?: Record<string, any>) {
    return this.stock.getStockMovements(params);
  }

  async getDailyStock(farmId?: number) {
    return this.stock.getDailyStock(farmId);
  }

  async getYtdStock(farmId?: number) {
    return this.stock.getYtdStock(farmId);
  }

  async getFarmStock(farmId?: number) {
    return this.stock.getFarmStock(farmId);
  }

  async getPriceListData() {
    return this.items.getPriceListData();
  }

  async getPriceList(category?: string) {
    return this.items.getPriceList(category);
  }

  async addPriceListItem(data: { category: string; name: string; unit: string; price: number; accounting_code?: string }) {
    return this.items.addPriceListItem(data);
  }

  async deletePriceListItem(itemId: number) {
    return this.items.deletePriceListItem(itemId);
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

  async downloadBlocksCsvTemplate() {
    return this.farms.downloadBlocksCsvTemplate();
  }

  async uploadBlocksCsv(file: File) {
    return this.farms.uploadBlocksCsv(file);
  }

  async getManagerFarms() {
    return this.farms.getManagerFarms();
  }

  async getManagerUsers() {
    return this.users.getManagerUsers();
  }

  async getSupervisors() {
    return this.users.getSupervisors();
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

  async bulkApproveManagerPayroll(recordIds: number[]) {
    return this.payroll.bulkApproveManagerPayroll(recordIds);
  }

  async bulkRejectManagerPayroll(recordIds: number[], rejectionReason: string) {
    return this.payroll.bulkRejectManagerPayroll(recordIds, rejectionReason);
  }

  async rejectManagerPayroll(recordId: number, rejectionReason: string) {
    return this.payroll.rejectManagerPayroll(recordId, rejectionReason);
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

  async getFinancialControllerPendingPayroll() {
    return this.payroll.getFinancialControllerPendingPayroll();
  }

  async getFinancialControllerApprovedPayroll() {
    return this.payroll.getFinancialControllerApprovedPayroll();
  }

  async approveFinancialControllerPayroll(recordId: number) {
    return this.payroll.approveFinancialControllerPayroll(recordId);
  }

  async bulkApproveFinancialControllerPayroll(recordIds: number[]) {
    return this.payroll.bulkApproveFinancialControllerPayroll(recordIds);
  }

  async rejectFinancialControllerPayroll(recordId: number, rejectionReason: string) {
    return this.payroll.rejectFinancialControllerPayroll(recordId, rejectionReason);
  }

  async getSupervisorRejectedPayroll() {
    return this.payroll.getSupervisorRejectedPayroll();
  }

  async resubmitSupervisorPayroll(recordId: number) {
    return this.payroll.resubmitSupervisorPayroll(recordId);
  }

  async getSupervisorPendingPayroll() {
    return this.payroll.getSupervisorPendingPayroll();
  }

  async editSupervisorPayrollRecord(recordId: number, data: any) {
    return this.payroll.editSupervisorPayrollRecord(recordId, data);
  }

  async createSupervisorPayrollRecord(data: Parameters<typeof this.payroll.createSupervisorPayrollRecord>[0]) {
    return this.payroll.createSupervisorPayrollRecord(data);
  }

  async updateSupervisorPayrollRecord(recordId: number, data: any) {
    return this.payroll.updateSupervisorPayrollRecord(recordId, data);
  }

  async deleteSupervisorPayrollRecord(recordId: number) {
    return this.payroll.deleteSupervisorPayrollRecord(recordId);
  }

  async bulkRejectFinancialControllerPayroll(data: { record_ids: number[]; rejection_reason: string }) {
    return this.payroll.bulkRejectFinancialControllerPayroll(data);
  }

  // ── Weekly sheet ──
  async getWeeklyPayrollSheet(farmId: number, weekStart: string) {
    return this.payroll.getWeeklyPayrollSheet(farmId, weekStart);
  }
  async getWeeklySheet(params: { farm_id: number; week_start: string }) {
    return this.payroll.getWeeklySheet(params);
  }
  async downloadWeeklyPayrollSheetPdf(farmId: number, weekStart: string) {
    return this.payroll.downloadWeeklyPayrollSheetPdf(farmId, weekStart);
  }
  async downloadWeeklySheetPdf(params: { farm_id: number; week_start: string }) {
    return this.payroll.downloadWeeklySheetPdf(params);
  }
  async downloadWeeklyPayrollSheetCsv(farmId: number, weekStart: string) {
    return this.payroll.downloadWeeklyPayrollSheetCsv(farmId, weekStart);
  }
  async downloadWeeklySheetCsv(params: { farm_id: number; week_start: string }) {
    return this.payroll.downloadWeeklySheetCsv(params);
  }
  async downloadWeeklySheetTemplate() {
    return this.payroll.downloadWeeklySheetTemplate();
  }
  async uploadWeeklySheet(params: { farm_id: number; week_start: string; file: File; overwrite?: boolean }) {
    return this.payroll.uploadWeeklySheet(params);
  }

  // ── Payment summary ──
  async getPaymentSummaryJson(farmId: number, startDate: string, endDate: string) {
    return this.payroll.getPaymentSummaryJson(farmId, startDate, endDate);
  }
  async getPaymentSummary(params: { farm_id: number; start_date: string; end_date: string }) {
    return this.payroll.getPaymentSummary(params);
  }
  async downloadPaymentSummaryPdf(farmIdOrParams: number | { farm_id: number; start_date: string; end_date: string }, startDate?: string, endDate?: string) {
    const params = typeof farmIdOrParams === 'number'
      ? { farm_id: farmIdOrParams, start_date: startDate!, end_date: endDate! }
      : farmIdOrParams;
    return this.payroll.downloadPaymentSummaryPdf(params);
  }

  // ── Payslip ──
  async downloadPayslipPdf(workerNameOrParams: string | { worker_name: string; farm_id: number; start_date: string; end_date: string }, farmId?: number, startDate?: string, endDate?: string) {
    const params = typeof workerNameOrParams === 'string'
      ? { worker_name: workerNameOrParams, farm_id: farmId!, start_date: startDate!, end_date: endDate! }
      : workerNameOrParams;
    return this.payroll.downloadPayslipPdf(params);
  }

  // ── QuickBooks ──
  async getQuickBooksPending() {
    return this.payroll.getQuickBooksPending();
  }
  async markQuickBooksSynced(recordIdsOrData: number[] | { record_ids: number[]; transaction_id_prefix: string }, transactionIdPrefix?: string) {
    const data = Array.isArray(recordIdsOrData)
      ? { record_ids: recordIdsOrData, transaction_id_prefix: transactionIdPrefix || 'QB' }
      : recordIdsOrData;
    return this.payroll.markQuickBooksSynced(data);
  }

  async getWorkerPaymentDetails(workerId: number) {
    return this.payroll.getWorkerPaymentDetails(workerId);
  }

  async updateWorkerPaymentDetails(workerId: number, data: Parameters<typeof this.payroll.updateWorkerPaymentDetails>[1]) {
    return this.payroll.updateWorkerPaymentDetails(workerId, data);
  }

  async getAnalyticsData(params?: Record<string, any>) {
    return this.activities.getAnalyticsData(params);
  }

  async getManagerPendingSimrs(farmId?: number) {
    return this.procurement.getManagerPendingSimrs(farmId);
  }

  async getManagerAllSimrs(params?: Record<string, any>) {
    return this.procurement.getManagerAllSimrs(params);
  }

  async getSimrDetail(simrId: number) {
    return this.procurement.getSimrDetail(simrId);
  }

  async getPendingGins(farmId?: number) {
    return this.procurement.getPendingGins(farmId);
  }

  async approveFmSimr(simrId: number, notes?: string) {
    return this.procurement.approveFmSimr(simrId, notes);
  }

  async rejectFmSimr(simrId: number, rejectionReason: string) {
    return this.procurement.rejectFmSimr(simrId, rejectionReason);
  }

  async approveGin(ginId: number) {
    return this.procurement.approveGin(ginId);
  }

  async getPendingInterFarmSimrs() {
    return this.procurement.getPendingInterFarmSimrs();
  }

  async approveInterFarmSimr(simrId: number) {
    return this.procurement.approveInterFarmSimr(simrId);
  }

  async rejectInterFarmSimr(simrId: number, rejectionReason: string) {
    return this.procurement.rejectInterFarmSimr(simrId, rejectionReason);
  }

  async dispatchInterFarmTransfer(transferId: number) {
    return this.procurement.dispatchInterFarmTransfer(transferId);
  }

  async receiveInterFarmTransfer(transferId: number) {
    return this.procurement.receiveInterFarmTransfer(transferId);
  }

  // ── Budgets ───────────────────────────────────────────────────────────────
  async getBudgets(period: 'weekly' | 'yearly') { return this.analytics.getBudgets(period); }
  async getBudgetsByPeriod(params: { period: string; farm_id?: number; fiscal_year?: number }) { return this.analytics.getBudgetsByPeriod(params); }
  async getCurrentBudget(farmId: number, period: string) { return this.analytics.getCurrentBudget(farmId, period); }
  async getBudgetSummary(farmId: number, fiscalYear?: number) { return this.analytics.getBudgetSummary(farmId, fiscalYear); }
  async getBudgetTracking(params: { period: string; farm_id?: number }) { return this.analytics.getBudgetTracking(params); }
  async getBudgetBlocks(budgetId: number) { return this.analytics.getBudgetBlocks(budgetId); }
  async createBudget(data: any) { return this.analytics.createBudget(data); }
  async updateBudget(budgetId: number, data: any) { return this.analytics.updateBudget(budgetId, data); }
  async createBudgetBlock(budgetId: number, data: any) { return this.analytics.createBudgetBlock(budgetId, data); }
  async updateBudgetBlock(budgetId: number, blockId: number, data: any) { return this.analytics.updateBudgetBlock(budgetId, blockId, data); }
  async validateExpenditure(params: { expenditure_type: string; amount: number; farm_id: number; period: string }) { return this.analytics.validateExpenditure(params); }

  // ── Warnings ──────────────────────────────────────────────────────────────
  async getWarnings(params?: Record<string, any>) { return this.analytics.getWarnings(params); }
  async signWarning(warningId: number) { return this.analytics.signWarning(warningId); }

  // ── Procurement Officer ───────────────────────────────────────────────────
  async getStores() { return this.procurement.getStores(); }
  async getStoreDetail(farmId: number) { return this.procurement.getStoreDetail(farmId); }
  async searchStock(itemName: string) { return this.procurement.searchStock(itemName); }
  async getProcurementSmrs(filters?: Record<string, any>) { return this.procurement.getProcurementSmrs(filters); }
  async getProcurementSmrDetail(smrId: number) { return this.procurement.getProcurementSmrDetail(smrId); }
  async markSmrOrdered(smrId: number) { return this.procurement.markSmrOrdered(smrId); }
  async createPfi(data: any) { return this.procurement.createPfi(data); }
  async getPfis(filters?: Record<string, any>) { return this.procurement.getPfis(filters); }
  async getPfisBySmr(smrId: number) { return this.procurement.getPfisBySmr(smrId); }
  async getSuppliers() { return this.procurement.getSuppliers(); }
  async getSupplier(supplierId: number) { return this.procurement.getSupplier(supplierId); }
  async createSupplier(data: any) { return this.procurement.createSupplier(data); }
  async updateSupplier(id: number, data: any) { return this.procurement.updateSupplier(id, data); }
  async createLpo(data: any) { return this.procurement.createLpo(data); }
  async getLpos(filters?: Record<string, any>) { return this.procurement.getLpos(filters); }
  async getLpoDetail(lpoId: number) { return this.procurement.getLpoDetail(lpoId); }
  async getLposForGrn(farmId?: number) { return this.procurement.getLposForGrn(farmId); }
  async getLpoPrefill(lpoId: number) { return this.procurement.getLpoPrefill(lpoId); }
  async approveLpo(lpoId: number, notes?: string) { return this.procurement.approveLpo(lpoId, notes); }
  async rejectLpo(lpoId: number, notes: string) { return this.procurement.rejectLpo(lpoId, notes); }
  async sendLpoToSupplier(lpoId: number) { return this.procurement.sendLpoToSupplier(lpoId); }
  async poApproveLpo(lpoId: number, notes?: string) { return this.procurement.poApproveLpo(lpoId, notes); }
  async poRejectLpo(lpoId: number, notes: string) { return this.procurement.poRejectLpo(lpoId, notes); }
  async createGrn(data: any) { return this.procurement.createGrn(data); }
  async getGrns(filters?: Record<string, any>) { return this.procurement.getGrns(filters); }
  async getGrnDetail(grnId: number) { return this.procurement.getGrnDetail(grnId); }
  async approveGrn(grnId: number) { return this.procurement.approveGrn(grnId); }
  async rejectGrn(grnId: number, reason: string) { return this.procurement.rejectGrn(grnId, reason); }
  async patchGrnItem(grnId: number, itemId: number, data: any) { return this.procurement.patchGrnItem(grnId, itemId, data); }
  async uploadGrnDocument(grnId: number, file: File) { return this.procurement.uploadGrnDocument(grnId, file); }
  async createDirectReceipt(data: any) { return this.procurement.createDirectReceipt(data); }
  async uploadDnPhoto(grnId: number, file: File) { return this.procurement.uploadDnPhoto(grnId, file); }
  async getPriceLists(farmId?: number) { return this.procurement.getPriceLists(farmId); }
  async getInternalTransfers(filters?: Record<string, any>) { return this.procurement.getInternalTransfers(filters); }
  async getInternalTransferDetail(transferId: number) { return this.procurement.getInternalTransferDetail(transferId); }
  // SMR create + chain
  async cancelSmr(smrId: number) { return this.procurement.cancelSmr(smrId); }
  async patchLpo(lpoId: number, data: Record<string, any>) { return this.procurement.patchLpo(lpoId, data); }
  async getGrnChain(grnNumber: string) { return this.procurement.getGrnChain(grnNumber); }
  async createSmr(data: any) { return this.procurement.createSmr(data); }
  async getExternalChain(smrNumber: string) { return this.procurement.getExternalChain(smrNumber); }
  // GIN
  async getSimrsReadyForGin(farmId?: number) { return this.procurement.getSimrsReadyForGin(farmId); }
  async createGin(data: any) { return this.procurement.createGin(data); }
  async getGins(filters?: Record<string, any>) { return this.procurement.getGins(filters); }
  async getGinDetail(ginId: number) { return this.procurement.getGinDetail(ginId); }
  async rejectGin(ginId: number, reason: string) { return this.procurement.rejectGin(ginId, reason); }
  async issueGin(ginId: number) { return this.procurement.issueGin(ginId); }
  // Transport Voucher
  async createTransportVoucher(data: any) { return this.procurement.createTransportVoucher(data); }
  async getTransportVouchers(filters?: Record<string, any>) { return this.procurement.getTransportVouchers(filters); }
  async getTransportVoucherDetail(tvId: number) { return this.procurement.getTransportVoucherDetail(tvId); }
  async approveTransportVoucher(tvId: number) { return this.procurement.approveTransportVoucher(tvId); }
  async rejectTransportVoucher(tvId: number, reason: string) { return this.procurement.rejectTransportVoucher(tvId, reason); }
  async dispatchTransportVoucher(tvId: number) { return this.procurement.dispatchTransportVoucher(tvId); }
  async signTransportVoucher(tvId: number, data?: any) { return this.procurement.signTransportVoucher(tvId, data); }
  // Delivery Note
  async createDeliveryNote(data: any) { return this.procurement.createDeliveryNote(data); }
  async getDeliveryNotes(filters?: Record<string, any>) { return this.procurement.getDeliveryNotes(filters); }
  async getDeliveryNoteDetail(dnId: number) { return this.procurement.getDeliveryNoteDetail(dnId); }
  async approveDeliveryNote(dnId: number) { return this.procurement.approveDeliveryNote(dnId); }
  async dispatchDeliveryNote(dnId: number) { return this.procurement.dispatchDeliveryNote(dnId); }
  async signDeliveryNote(dnId: number, data?: any) { return this.procurement.signDeliveryNote(dnId, data); }
  async rejectDeliveryNote(dnId: number, reason: string) { return this.procurement.rejectDeliveryNote(dnId, reason); }
  // Gate Pass
  async createGatePass(data: any) { return this.procurement.createGatePass(data); }
  async getGatePasses(filters?: Record<string, any>) { return this.procurement.getGatePasses(filters); }
  async getGatePassDetail(gpId: number) { return this.procurement.getGatePassDetail(gpId); }
  async issueGatePass(gpId: number) { return this.procurement.issueGatePass(gpId); }
  async recordGatePassExit(gpId: number) { return this.procurement.recordGatePassExit(gpId); }
  async verifyGatePass(gpId: number) { return this.procurement.verifyGatePass(gpId); }
  // CARDEX
  async getCardex(farmId: number) { return this.procurement.getCardex(farmId); }
  async getCardexItem(farmId: number, itemName: string) { return this.procurement.getCardexItem(farmId, itemName); }
  async getCardexItemHistory(farmId: number, itemName: string) { return this.procurement.getCardexItemHistory(farmId, itemName); }
  // Chain & actions
  async getInternalChain(simrNumber: string) { return this.procurement.getInternalChain(simrNumber); }
  async approveSMR(smrId: number) { return this.procurement.approveSMR(smrId); }
  async attachTVtoGIN(ginId: number, tvId: number) { return this.procurement.attachTVtoGIN(ginId, tvId); }

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

  async getFarmClerkWeeklySummary() {
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

  // ===========================
  // Attendance shortcuts
  // ===========================

  async checkInWithFace(formData: FormData) {
    return this.post<any>('/supervisor/attendance/checkin', formData);
  }

  async getAttendanceRecords(params?: { farm_id?: number; status?: string; date?: string; start_date?: string; end_date?: string }) {
    return this.attendance.getAttendanceRecords(params);
  }

  async updateAttendance(attendanceId: number, data: any) {
    return this.attendance.updateAttendance(attendanceId, data);
  }

  async deleteAttendance(attendanceId: number) {
    return this.attendance.deleteAttendance(attendanceId);
  }

  async getAttendanceReport(farmId: number, reportDate: string) {
    return this.attendance.getAttendanceReport(farmId, reportDate);
  }

  // ===========================
  // Picking Operations
  // ===========================

  async setDailyPickingPrice(data: any) {
    return this.post<any>('/picking/daily-price', data);
  }

  async getDailyPickingPrice(farmId: number, date?: string) {
    const params = date ? `?price_date=${date}` : '';
    return this.get<any>(`/picking/daily-price/${farmId}${params}`);
  }

  async getPickingPriceHistory(farmId: number, limit: number = 30) {
    return this.get<any>(`/picking/daily-price/history/${farmId}`, { limit: limit.toString() });
  }

  async createHarvestForecast(data: any) {
    return this.post<any>('/picking/forecast', data);
  }

  async getHarvestForecasts(farmId: number, seasonYear?: number) {
    const params = seasonYear ? { season_year: seasonYear.toString() } : undefined;
    return this.get<any>(`/picking/forecast/${farmId}`, params);
  }

  async updateHarvestForecast(forecastId: number, data: any) {
    return this.put<any>(`/picking/forecast/${forecastId}`, data);
  }

  async sendSeasonCommunication(data: any) {
    return this.post<any>('/picking/communication/send', data);
  }

  async getSeasonCommunications(farmId: number, seasonYear?: number) {
    const params = seasonYear ? { season_year: seasonYear.toString() } : undefined;
    return this.get<any>(`/picking/communication/history/${farmId}`, params);
  }

  async createEquipmentCheck(data: any) {
    return this.post<any>('/picking/equipment-check', data);
  }

  async getEquipmentCheck(farmId: number, seasonYear?: number) {
    const params = seasonYear ? { season_year: seasonYear.toString() } : undefined;
    return this.get<any>(`/picking/equipment-check/${farmId}`, params);
  }

  async getReadinessOverview(farmId: number, seasonYear: number) {
    return this.get<any>(`/picking/readiness/${farmId}`, { season_year: seasonYear.toString() });
  }

  async createPickingSeason(data: any) {
    return this.post<any>('/picking/seasons/create', data);
  }

  async getPickingSeason(farmId: number, seasonYear?: number) {
    const params = seasonYear ? { season_year: seasonYear.toString() } : undefined;
    return this.get<any>(`/picking/seasons/${farmId}`, params);
  }

  async openPickingSession(data: any) {
    return this.post<any>('/picking/sessions', data);
  }

  async closePickingSession(sessionId: number) {
    return this.put<any>(`/picking/sessions/${sessionId}/close`);
  }

  async getPickingSessions(farmId?: number, date?: string, status?: string): Promise<any[]> {
    const params: Record<string, string> = {};
    if (farmId) params.farm_id = farmId.toString();
    if (date) params.session_date = date;
    if (status) params.status = status;
    return this.get<any[]>('/picking/sessions', Object.keys(params).length > 0 ? params : undefined);
  }

  async getPickingSessionDetail(sessionId: number): Promise<any> {
    return this.get<any>(`/picking/sessions/${sessionId}`);
  }

  async recordPickerWeight(sessionId: number, data: any): Promise<any> {
    return this.post<any>(`/picking/sessions/${sessionId}/weigh`, data);
  }

  async getDailyPickingSummary(farmId: number, date?: string) {
    const params = date ? { summary_date: date } : undefined;
    return this.get<any>(`/picking/daily-summary/${farmId}`, params);
  }

  async getBlockPickingSummary(farmId: number, blockId: number, startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return this.get<any>(`/picking/block-summary/${farmId}/${blockId}`, Object.keys(params).length > 0 ? params : undefined);
  }

  async getPickerHistory(workerId: number, startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return this.get<any>(`/picking/picker-history/${workerId}`, Object.keys(params).length > 0 ? params : undefined);
  }

  async getPickerLeaderboard(farmId: number, date?: string, limit: number = 20): Promise<any[]> {
    const params: Record<string, string> = { limit: limit.toString() };
    if (date) params.leader_date = date;
    return this.get<any[]>(`/picking/leaderboard/${farmId}`, params);
  }

  // ===========================
  // Factory Operations
  // ===========================

  async recordFactoryIntake(data: any) {
    return this.post<any>('/factory/intake', data);
  }

  async getFactoryIntakes(farmId: number, date?: string) {
    const params = date ? { intake_date: date } : undefined;
    return this.get<any>(`/factory/intake/${farmId}`, params);
  }

  async createFermentationTank(data: any) {
    return this.post<any>('/factory/tanks', data);
  }

  async getFermentationTanks(farmId: number) {
    return this.get<any>(`/factory/tanks/${farmId}`);
  }

  async startFermentation(data: any) {
    return this.post<any>('/factory/fermentation/start', data);
  }

  async completeFermentation(batchId: number) {
    return this.put<any>(`/factory/fermentation/${batchId}/complete`);
  }

  async getActiveFermentations(farmId: number) {
    return this.get<any>(`/factory/fermentation/active/${farmId}`);
  }

  async recordWashing(data: any) {
    return this.post<any>('/factory/washing', data);
  }

  async getWashingRecords(farmId: number) {
    return this.get<any>(`/factory/washing/${farmId}`);
  }

  async createDryingTable(data: any) {
    return this.post<any>('/factory/drying-tables', data);
  }

  async getDryingTables(farmId: number) {
    return this.get<any>(`/factory/drying-tables/${farmId}`);
  }

  async startDrying(data: any) {
    return this.post<any>('/factory/drying/start', data);
  }

  async updateDrying(batchId: number, data: any) {
    return this.put<any>(`/factory/drying/${batchId}/update`, data);
  }

  async completeDrying(batchId: number, dryWeight: number, moisture?: number) {
    const params: Record<string, string> = { dry_weight_kg: dryWeight.toString() };
    if (moisture !== undefined) params.moisture_pct = moisture.toString();
    return this.request(`/factory/drying/${batchId}/complete?${new URLSearchParams(params)}`, { method: 'PUT' });
  }

  async getActiveDrying(farmId: number) {
    return this.get<any>(`/factory/drying/active/${farmId}`);
  }

  async getFactoryDailySummary(farmId: number, date?: string) {
    const params = date ? { summary_date: date } : undefined;
    return this.get<any>(`/factory/daily-summary/${farmId}`, params);
  }

  async getCherryToParchmentRatios(farmId: number, limit: number = 50) {
    return this.get<any>(`/factory/ratios/${farmId}`, { limit: limit.toString() });
  }

  // ===========================
  // Godown Operations
  // ===========================

  async receiveFromDrying(data: any) {
    return this.post<any>('/godown/receive', data);
  }

  async issueFromGodown(data: any) {
    return this.post<any>('/godown/issue', data);
  }

  async createBulkMix(data: any) {
    return this.post<any>('/godown/mix', data);
  }

  async getGodownInventory(farmId: number) {
    return this.get<any>(`/godown/inventory/${farmId}`);
  }

  async getGodownPiles(farmId: number, grade?: string) {
    const params = grade ? { grade } : undefined;
    return this.get<any>(`/godown/piles/${farmId}`, params);
  }

  async recordGodownDailyStock(farmId: number) {
    return this.post<any>('/godown/daily-stock', { godown_farm_id: farmId });
  }

  async getGodownDailyStock(farmId: number, date?: string) {
    const params = date ? { stock_date: date } : undefined;
    return this.get<any>(`/godown/daily-stock/${farmId}`, params);
  }

  async getGodownHistory(farmId: number, limit: number = 100) {
    return this.get<any>(`/godown/history/${farmId}`, { limit: limit.toString() });
  }

  // ===========================
  // Milling Operations
  // ===========================

  async createMillingBatch(data: any) {
    return this.post<any>('/milling/batches', data);
  }

  async startMilling(batchId: number) {
    return this.put<any>(`/milling/batches/${batchId}/start`);
  }

  async completeMilling(batchId: number, data: any) {
    return this.put<any>(`/milling/batches/${batchId}/complete`, data);
  }

  async getMillingBatches(farmId: number, status?: string) {
    const params: Record<string, string> = { factory_farm_id: farmId.toString() };
    if (status) params.status = status;
    return this.get<any>('/milling/batches', params);
  }

  // ===========================
  // Traceability
  // ===========================

  async traceForward(entityType: string, entityId: number) {
    return this.get<any>(`/traceability/forward/${entityType}/${entityId}`);
  }

  async traceBackward(entityType: string, entityId: number) {
    return this.get<any>(`/traceability/backward/${entityType}/${entityId}`);
  }

  async investigateComplaint(pileId?: number, millingBatchId?: number) {
    const params: Record<string, string> = {};
    if (pileId) params.pile_id = pileId.toString();
    if (millingBatchId) params.milling_batch_id = millingBatchId.toString();
    return this.get<any>('/traceability/investigate', params);
  }

  async getAuthorizationChain(entityType: string, entityId: number) {
    return this.get<any>(`/traceability/authorization-chain/${entityType}/${entityId}`);
  }

  // ===========================
  // Yield Forecasting
  // ===========================

  async createYieldSample(data: any) {
    return this.post<any>('/yield/samples', data);
  }

  async getYieldSamples(farmId: number, blockId?: number, limit?: number) {
    const params: Record<string, string> = {};
    if (blockId) params.block_id = String(blockId);
    if (limit) params.limit = String(limit);
    return this.get<any>(`/yield/samples/${farmId}`, params);
  }

  async createYieldForecast(farmId: number, data: any) {
    return this.post<any>(`/yield/forecast/${farmId}`, data);
  }

  async getYieldForecasts(farmId: number, seasonYear?: number) {
    const params = seasonYear ? { season_year: String(seasonYear) } : undefined;
    return this.get<any>(`/yield/forecast/${farmId}`, params);
  }

  async confirmYieldForecast(forecastId: number) {
    return this.put<any>(`/yield/forecast/${forecastId}/confirm`);
  }

  // ===========================
  // Harvest Planning
  // ===========================

  async createHarvestPlan(data: any) {
    return this.post<any>('/harvest/plan', data);
  }

  async getHarvestPlans(farmId: number, seasonYear?: number) {
    const params = seasonYear ? { season_year: String(seasonYear) } : undefined;
    return this.get<any>(`/harvest/plan/${farmId}`, params);
  }

  async approveHarvestPlan(planId: number) {
    return this.put<any>(`/harvest/plan/${planId}/approve`);
  }

  async getHarvestChecklist(planId: number) {
    return this.get<any>(`/harvest/checklist/${planId}`);
  }

  async updateHarvestChecklist(planId: number, data: any) {
    return this.put<any>(`/harvest/checklist/${planId}`, data);
  }

  // ===========================
  // Daily Picking Rate (GM)
  // ===========================

  async setDailyPickingRate(data: any) {
    return this.post<any>('/harvest/picking-rate', data);
  }

  async getDailyPickingRates(farmId: number, pickingType?: string, fromDate?: string, toDate?: string) {
    const params: Record<string, string> = {};
    if (pickingType) params.picking_type = pickingType;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    return this.get<any>(`/harvest/picking-rate/${farmId}`, params);
  }

  // ===========================
  // Picker Weighing (Harvest)
  // ===========================

  async recordPickerWeighing(data: any) {
    return this.post<any>('/harvest/weighing', data);
  }

  async getPickerWeighingRecords(farmId: number, datePicked?: string, harvestPlanId?: number) {
    const params: Record<string, string> = {};
    if (datePicked) params.date_picked = datePicked;
    if (harvestPlanId) params.harvest_plan_id = String(harvestPlanId);
    return this.get<any>(`/harvest/weighing/${farmId}`, params);
  }

  // ===========================
  // Coffee Processing Batches
  // ===========================

  async createProcessingBatch(data: any) {
    return this.post<any>('/harvest/processing/batch', data);
  }

  async getProcessingBatches(farmId: number, status?: string) {
    const params = status ? { status } : undefined;
    return this.get<any>(`/harvest/processing/${farmId}`, params);
  }

  async updateBatchHopper(batchId: number, hopperWeightKg: number) {
    return this.put<any>(`/harvest/processing/${batchId}/hopper`, { hopper_weight_kg: hopperWeightKg });
  }

  async updateBatchPulping(batchId: number, data: any) {
    return this.put<any>(`/harvest/processing/${batchId}/pulping`, data);
  }

  async startBatchFermentation(batchId: number, fermentationStart: string) {
    return this.put<any>(`/harvest/processing/${batchId}/fermentation-start`, { fermentation_start: fermentationStart });
  }

  async endBatchFermentation(batchId: number, fermentationEnd: string) {
    return this.put<any>(`/harvest/processing/${batchId}/fermentation-end`, { fermentation_end: fermentationEnd });
  }

  async startBatchDrying(batchId: number, data: any) {
    return this.put<any>(`/harvest/processing/${batchId}/drying`, data);
  }

  async completeBatch(batchId: number, data: any) {
    return this.put<any>(`/harvest/processing/${batchId}/complete`, data);
  }

  // ===========================
  // Drying Monitoring
  // ===========================

  async logDrying(data: any) {
    return this.post<any>('/harvest/drying/log', data);
  }

  async getDryingLogs(batchId: number) {
    return this.get<any>(`/harvest/drying/${batchId}/logs`);
  }

  async getDryingForecast(batchId: number, targetMoisture?: number) {
    const params = targetMoisture ? { target_moisture: String(targetMoisture) } : undefined;
    return this.get<any>(`/harvest/drying/${batchId}/forecast`, params);
  }

  // ===========================
  // Harvest Report
  // ===========================

  async getHarvestReport(farmId: number, seasonYear: number) {
    return this.get<any>(`/harvest/report/${farmId}`, { season_year: String(seasonYear) });
  }

  // ===========================
  // Farm Clerk: Climate Reports
  // ===========================

  async getClimateReports(params?: Record<string, any>) { return this.management.getClimateReports(params); }
  async createClimateReport(data: Record<string, any>) { return this.management.createClimateReport(data); }
  async updateClimateReport(reportId: number, data: Record<string, any>) { return this.management.updateClimateReport(reportId, data); }

  // ===========================
  // Farm Clerk: SMART Recommendations
  // ===========================

  async getFarmClerkRecommendations() { return this.management.getFarmClerkRecommendations(); }
  async getFarmClerkThresholds() { return this.management.getFarmClerkThresholds(); }

  // ===========================
  // Farm Clerk: Workers View
  // ===========================

  async getFarmClerkWorkers() { return this.management.getFarmClerkWorkers(); }
  async getFarmClerkWorker(workerId: number) { return this.management.getFarmClerkWorker(workerId); }

  // ===========================
  // Admin-exclusive
  // ===========================

  async getAuditLogs(params?: Record<string, any>) { return this.activities.getAuditLogs(params); }
  async getMonthlyReport(farmId: number, year: number, month: number) { return this.reports.getMonthlyReport(farmId, year, month); }
  async getSystemWideReport() { return this.reports.getSystemWideReport(); }
  async createTaskCode(data: Record<string, any>) { return this.tasks.createTaskCode(data); }

  // ===========================
  // MD-exclusive
  // ===========================

  async getMdStrategicExpenditure(params?: Record<string, any>) { return this.analytics.getMdStrategicExpenditure(params); }
  async getMdStrategicCombined() { return this.analytics.getMdStrategicCombined(); }
  async getMdStrategicQuickbooks() { return this.analytics.getMdStrategicQuickbooks(); }
  async getMdPerformanceReview(params?: Record<string, any>) { return this.analytics.getMdPerformanceReview(params); }
  async postMdFinancialRequest(data: Record<string, any>) { return this.analytics.postMdFinancialRequest(data); }
  async postMdInitiateReport(data: Record<string, any>) { return this.analytics.postMdInitiateReport(data); }
  async getMdReports() { return this.analytics.getMdReports(); }
  async postMdMeeting(data: Record<string, any>) { return this.analytics.postMdMeeting(data); }

  // ===========================
  // GM-exclusive
  // ===========================

  async getGmExpenditure(params?: Record<string, any>) { return this.analytics.getGmExpenditure(params); }
  async getGmCombinedFarm() { return this.analytics.getGmCombinedFarm(); }
  async getGmQuickbooks() { return this.analytics.getGmQuickbooks(); }
  async getGmPerformanceIndicators(params?: Record<string, any>) { return this.analytics.getGmPerformanceIndicators(params); }
  async getGmMeetings() { return this.analytics.getGmMeetings(); }
  async postGmMeeting(data: Record<string, any>) { return this.analytics.postGmMeeting(data); }

  // ===========================
  // Other Crops
  // ===========================

  async getOtherCropsHarvestRecords(params?: { farm_id?: number; crop_type?: string; start_date?: string; end_date?: string }) {
    return this.otherCrops.getHarvestRecords(params);
  }
  async getOtherCropsHarvestRecord(recordId: number) { return this.otherCrops.getHarvestRecord(recordId); }
  async createOtherCropsHarvestRecord(data: any) { return this.otherCrops.createHarvestRecord(data); }
  async updateOtherCropsHarvestRecord(recordId: number, data: any) { return this.otherCrops.updateHarvestRecord(recordId, data); }

  async getOtherCropsShellingRecords(params?: { farm_id?: number; start_date?: string; end_date?: string }) {
    return this.otherCrops.getShellingRecords(params);
  }
  async createOtherCropsShellingRecord(data: any) { return this.otherCrops.createShellingRecord(data); }
  async updateOtherCropsShellingRecord(recordId: number, data: any) { return this.otherCrops.updateShellingRecord(recordId, data); }
  async deleteOtherCropsShellingRecord(recordId: number) { return this.otherCrops.deleteShellingRecord(recordId); }

  async getOtherCropsSaleRecords(params?: { farm_id?: number; crop_type?: string; start_date?: string; end_date?: string }) {
    return this.otherCrops.getSaleRecords(params);
  }
  async getOtherCropsSaleRecord(recordId: number) { return this.otherCrops.getSaleRecord(recordId); }
  async createOtherCropsSaleRecord(data: any) { return this.otherCrops.createSaleRecord(data); }
  async updateOtherCropsSaleRecord(recordId: number, data: any) { return this.otherCrops.updateSaleRecord(recordId, data); }
  async deleteOtherCropsSaleRecord(recordId: number) { return this.otherCrops.deleteSaleRecord(recordId); }

  async getCropBalances(params?: { farm_id?: number }) { return this.otherCrops.getCropBalances(params); }

  // ===========================
  // Mbuni (Dried Cherry)
  // ===========================

  async getMbuniRecords(params?: { farm_id?: number; start_date?: string; end_date?: string }) {
    return this.mbuni.getMbuniRecords(params);
  }
  async getMbuniRecord(recordId: number) { return this.mbuni.getMbuniRecord(recordId); }
  async createMbuniRecord(data: any) { return this.mbuni.createMbuniRecord(data); }
  async updateMbuniRecord(recordId: number, data: any) { return this.mbuni.updateMbuniRecord(recordId, data); }
  async deleteMbuniRecord(recordId: number) { return this.mbuni.deleteMbuniRecord(recordId); }

  // ===========================
  // Fertilizer
  // ===========================

  async getFertilizerProducts(params?: { sub_store?: 'coffee' | 'otc'; active_only?: boolean }) {
    return this.fertilizer.getFertilizerProducts(params);
  }
  async getFertilizerEntries(params?: { farm_id?: number; sub_store?: 'coffee' | 'otc'; transaction_type?: 'in' | 'out'; start_date?: string; end_date?: string }) {
    return this.fertilizer.getFertilizerEntries(params);
  }
  async createFertilizerEntry(data: any) { return this.fertilizer.createFertilizerEntry(data); }
  async updateFertilizerEntry(entryId: number, data: any) { return this.fertilizer.updateFertilizerEntry(entryId, data); }
  async deleteFertilizerEntry(entryId: number) { return this.fertilizer.deleteFertilizerEntry(entryId); }
  async getFertilizerBalances(params?: { farm_id?: number; sub_store?: 'coffee' | 'otc' }) {
    return this.fertilizer.getFertilizerBalances(params);
  }
  async createFertilizerProduct(data: { name: string; formula?: string; unit: string; sub_store: 'coffee' | 'otc' }) {
    return this.fertilizer.createFertilizerProduct(data);
  }
  async updateFertilizerProduct(productId: number, data: any) {
    return this.fertilizer.updateFertilizerProduct(productId, data);
  }

  // Fertilizer Programs
  async getFertilizerPrograms(params?: { farm_id?: number; season_year?: number }) {
    return this.fertilizer.getFertilizerPrograms(params);
  }
  async createFertilizerProgram(data: { farm_id: number; season_year: number; tree_type: 'mature' | 'young' }) {
    return this.fertilizer.createFertilizerProgram(data);
  }
  async importFertilizerProgramsExcel(file: File, seasonYear: number) {
    return this.fertilizer.importFertilizerProgramsExcel(file, seasonYear);
  }
  async activateFertilizerProgram(id: number) {
    return this.fertilizer.activateFertilizerProgram(id);
  }
  async getFertilizerProgramSchedule(id: number) {
    return this.fertilizer.getFertilizerProgramSchedule(id);
  }
  async applyFertilizerRound(roundId: number, data: any) {
    return this.fertilizer.applyFertilizerRound(roundId, data);
  }
  async getFertilizerProgramReport(id: number) {
    return this.fertilizer.getFertilizerProgramReport(id);
  }
  async getFertilizerProgramSummary(id: number) {
    return this.fertilizer.getFertilizerProgramSummary(id);
  }
  async downloadFertilizerProgramTemplate() {
    return this.fertilizer.downloadFertilizerProgramTemplate();
  }
  async getFertilizerProgram(id: number) {
    return this.fertilizer.getFertilizerProgram(id);
  }
  async getFertilizerProgramBlocks(id: number) {
    return this.fertilizer.getFertilizerProgramBlocks(id);
  }
  async addFertilizerProgramBlock(id: number, data: {
    block_name: string; area_ha: number; cherry_kg?: number;
    npk_kg_per_ha?: number; blend1_kg_per_ha?: number; blend2_kg_per_ha?: number; blend3_kg_per_ha?: number;
  }) {
    return this.fertilizer.addFertilizerProgramBlock(id, data);
  }

  // ===========================
  // Fuel & Chemicals
  // ===========================

  async getFuelChemProducts(params?: { sub_store?: 'coffee' | 'otc'; category?: string; active_only?: boolean }) {
    return this.fuelChem.getFuelChemProducts(params);
  }
  async getFuelChemEntries(params?: { farm_id?: number; sub_store?: 'coffee' | 'otc'; category?: string; transaction_type?: 'in' | 'out'; start_date?: string; end_date?: string }) {
    return this.fuelChem.getFuelChemEntries(params);
  }
  async createFuelChemEntry(data: any) { return this.fuelChem.createFuelChemEntry(data); }
  async updateFuelChemEntry(entryId: number, data: any) { return this.fuelChem.updateFuelChemEntry(entryId, data); }
  async deleteFuelChemEntry(entryId: number) { return this.fuelChem.deleteFuelChemEntry(entryId); }
  async getFuelChemBalances(params?: { farm_id?: number; sub_store?: 'coffee' | 'otc'; category?: string }) {
    return this.fuelChem.getFuelChemBalances(params);
  }

  // ===========================
  // Irrigation Parts
  // ===========================

  async getIrrigationParts(params?: { farm_id?: number; supplier?: string; active_only?: boolean }) {
    return this.irrigationStock.getIrrigationParts(params);
  }
  async getIrrigationPart(partId: number) { return this.irrigationStock.getIrrigationPart(partId); }
  async getIrrigationEntries(params?: { farm_id?: number; part_id?: number; transaction_type?: 'in' | 'out' }) {
    return this.irrigationStock.getIrrigationEntries(params);
  }
  async createIrrigationEntry(data: any) { return this.irrigationStock.createIrrigationEntry(data); }
  async updateIrrigationEntry(entryId: number, data: any) { return this.irrigationStock.updateIrrigationEntry(entryId, data); }
  async deleteIrrigationEntry(entryId: number) { return this.irrigationStock.deleteIrrigationEntry(entryId); }
  async getIrrigationBalances(params?: { farm_id?: number }) { return this.irrigationStock.getIrrigationBalances(params); }

  // ===========================
  // Fish Farming
  // ===========================

  async getFishReservoirs(params?: { farm_id?: number; status?: string }) { return this.fishFarming.getFishReservoirs(params); }
  async createFishReservoir(data: any) { return this.fishFarming.createReservoir(data); }
  async updateFishReservoir(id: number, data: any) { return this.fishFarming.updateReservoir(id, data); }
  async getFishReservoirDashboard(reservoirId: number) { return this.fishFarming.getFishReservoirDashboard(reservoirId); }
  async getWaterParameters(params?: { reservoir_id?: number; start_date?: string; end_date?: string; limit?: number }) {
    return this.fishFarming.getWaterParameters(params);
  }
  async createWaterParameter(data: any) { return this.fishFarming.createWaterParameter(data); }
  async getFishFeedingRecords(params?: { reservoir_id?: number; session?: string; start_date?: string; limit?: number }) {
    return this.fishFarming.getFeedingRecords(params);
  }
  async createFishFeedingRecord(data: any) { return this.fishFarming.createFeedingRecord(data); }
  async getDailyFeedingSummary(params: { reservoir_id: number; date: string }) {
    return this.fishFarming.getDailyFeedingSummary(params);
  }
  async getFishWeightRecords(params?: { reservoir_id?: number; start_date?: string; end_date?: string }) {
    return this.fishFarming.getWeightRecords(params);
  }
  async createFishWeightRecord(data: any) { return this.fishFarming.createWeightRecord(data); }
  async getFishAlarmLogs(params?: { reservoir_id?: number; start_date?: string; end_date?: string; limit?: number }) {
    return this.fishFarming.getAlarmLogs(params);
  }
  async createFishAlarmLog(data: any) { return this.fishFarming.createAlarmLog(data); }

  // ===========================
  // CSV Import
  // ===========================

  async downloadCsvTemplate(templateName: CsvTemplateName) { return this.csvImport.downloadTemplate(templateName); }
  async uploadCropHarvestCsv(file: File) { return this.csvImport.uploadCropHarvest(file); }
  async uploadCropShellingCsv(file: File) { return this.csvImport.uploadCropShelling(file); }
  async uploadCropSalesCsv(file: File) { return this.csvImport.uploadCropSales(file); }
  async uploadMbuniHarvestCsv(file: File) { return this.csvImport.uploadMbuniHarvest(file); }
  async uploadFertilizerEntriesCsv(file: File) { return this.csvImport.uploadFertilizerEntries(file); }
  async uploadFuelChemEntriesCsv(file: File) { return this.csvImport.uploadFuelChemEntries(file); }
  async uploadIrrigationEntriesCsv(file: File) { return this.csvImport.uploadIrrigationEntries(file); }
  async uploadFishWaterCsv(file: File) { return this.csvImport.uploadFishWater(file); }
  async uploadFishFeedingCsv(file: File) { return this.csvImport.uploadFishFeeding(file); }
  async uploadFishWeightCsv(file: File) { return this.csvImport.uploadFishWeight(file); }

  // ===========================
  // Field Applications
  // ===========================

  async getFertilizerApplications(params?: Parameters<FieldApplicationApiService['getFertilizerApplications']>[0]) {
    return this.fieldApplications.getFertilizerApplications(params);
  }
  async createFertilizerApplication(data: any) { return this.fieldApplications.createFertilizerApplication(data); }
  async deleteFertilizerApplication(id: number) { return this.fieldApplications.deleteFertilizerApplication(id); }

  async getChemicalApplications(params?: Parameters<FieldApplicationApiService['getChemicalApplications']>[0]) {
    return this.fieldApplications.getChemicalApplications(params);
  }
  async createChemicalApplication(data: any) { return this.fieldApplications.createChemicalApplication(data); }
  async deleteChemicalApplication(id: number) { return this.fieldApplications.deleteChemicalApplication(id); }

  async getBlockApplicationTimeline(blockId: number, params?: { start_date?: string; end_date?: string }) {
    return this.fieldApplications.getBlockTimeline(blockId, params);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
