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

  async createSimrRequest(data: any) {
    return this.items.createSimrRequest(data);
  }

  async getSimrRequests() {
    return this.items.getSimrRequests();
  }

  async getAllSimrRequests() {
    return this.items.getAllSimrRequests();
  }

  async getPendingSimrRequests() {
    return this.items.getPendingSimrRequests();
  }

  async approveSimrRequest(requestId: number, notes?: string) {
    return this.items.approveSimrRequest(requestId, notes);
  }

  async rejectSimrRequest(requestId: number, reason: string) {
    return this.items.rejectSimrRequest(requestId, reason);
  }

  async collectSimrRequest(requestId: number) {
    return this.items.collectSimrRequest(requestId);
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
  // Picking Operations
  // ===========================

  async setDailyPickingPrice(data: any) {
    return this.post('/picking/daily-price', data);
  }

  async getDailyPickingPrice(farmId: number, date?: string) {
    const params = date ? `?price_date=${date}` : '';
    return this.get(`/picking/daily-price/${farmId}${params}`);
  }

  async getPickingPriceHistory(farmId: number, limit: number = 30) {
    return this.get(`/picking/daily-price/history/${farmId}`, { limit: limit.toString() });
  }

  async createHarvestForecast(data: any) {
    return this.post('/picking/forecast', data);
  }

  async getHarvestForecasts(farmId: number, seasonYear?: number) {
    const params = seasonYear ? { season_year: seasonYear.toString() } : undefined;
    return this.get(`/picking/forecast/${farmId}`, params);
  }

  async updateHarvestForecast(forecastId: number, data: any) {
    return this.put(`/picking/forecast/${forecastId}`, data);
  }

  async sendSeasonCommunication(data: any) {
    return this.post('/picking/communication/send', data);
  }

  async getSeasonCommunications(farmId: number, seasonYear?: number) {
    const params = seasonYear ? { season_year: seasonYear.toString() } : undefined;
    return this.get(`/picking/communication/history/${farmId}`, params);
  }

  async createEquipmentCheck(data: any) {
    return this.post('/picking/equipment-check', data);
  }

  async getEquipmentCheck(farmId: number, seasonYear?: number) {
    const params = seasonYear ? { season_year: seasonYear.toString() } : undefined;
    return this.get(`/picking/equipment-check/${farmId}`, params);
  }

  async getReadinessOverview(farmId: number, seasonYear: number) {
    return this.get(`/picking/readiness/${farmId}`, { season_year: seasonYear.toString() });
  }

  async createPickingSeason(data: any) {
    return this.post('/picking/seasons/create', data);
  }

  async getPickingSeason(farmId: number, seasonYear?: number) {
    const params = seasonYear ? { season_year: seasonYear.toString() } : undefined;
    return this.get(`/picking/seasons/${farmId}`, params);
  }

  async openPickingSession(data: any) {
    return this.post('/picking/sessions', data);
  }

  async closePickingSession(sessionId: number) {
    return this.put(`/picking/sessions/${sessionId}/close`);
  }

  async getPickingSessions(farmId?: number, date?: string, status?: string) {
    const params: Record<string, string> = {};
    if (farmId) params.farm_id = farmId.toString();
    if (date) params.session_date = date;
    if (status) params.status = status;
    return this.get('/picking/sessions', Object.keys(params).length > 0 ? params : undefined);
  }

  async getPickingSessionDetail(sessionId: number) {
    return this.get(`/picking/sessions/${sessionId}`);
  }

  async recordPickerWeight(sessionId: number, data: any) {
    return this.post(`/picking/sessions/${sessionId}/weigh`, data);
  }

  async getDailyPickingSummary(farmId: number, date?: string) {
    const params = date ? { summary_date: date } : undefined;
    return this.get(`/picking/daily-summary/${farmId}`, params);
  }

  async getBlockPickingSummary(farmId: number, blockId: number, startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return this.get(`/picking/block-summary/${farmId}/${blockId}`, Object.keys(params).length > 0 ? params : undefined);
  }

  async getPickerHistory(workerId: number, startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return this.get(`/picking/picker-history/${workerId}`, Object.keys(params).length > 0 ? params : undefined);
  }

  async getPickerLeaderboard(farmId: number, date?: string, limit: number = 20) {
    const params: Record<string, string> = { limit: limit.toString() };
    if (date) params.leader_date = date;
    return this.get(`/picking/leaderboard/${farmId}`, params);
  }

  // ===========================
  // Factory Operations
  // ===========================

  async recordFactoryIntake(data: any) {
    return this.post('/factory/intake', data);
  }

  async getFactoryIntakes(farmId: number, date?: string) {
    const params = date ? { intake_date: date } : undefined;
    return this.get(`/factory/intake/${farmId}`, params);
  }

  async createFermentationTank(data: any) {
    return this.post('/factory/tanks', data);
  }

  async getFermentationTanks(farmId: number) {
    return this.get(`/factory/tanks/${farmId}`);
  }

  async startFermentation(data: any) {
    return this.post('/factory/fermentation/start', data);
  }

  async completeFermentation(batchId: number) {
    return this.put(`/factory/fermentation/${batchId}/complete`);
  }

  async getActiveFermentations(farmId: number) {
    return this.get(`/factory/fermentation/active/${farmId}`);
  }

  async recordWashing(data: any) {
    return this.post('/factory/washing', data);
  }

  async getWashingRecords(farmId: number) {
    return this.get(`/factory/washing/${farmId}`);
  }

  async createDryingTable(data: any) {
    return this.post('/factory/drying-tables', data);
  }

  async getDryingTables(farmId: number) {
    return this.get(`/factory/drying-tables/${farmId}`);
  }

  async startDrying(data: any) {
    return this.post('/factory/drying/start', data);
  }

  async updateDrying(batchId: number, data: any) {
    return this.put(`/factory/drying/${batchId}/update`, data);
  }

  async completeDrying(batchId: number, dryWeight: number, moisture?: number) {
    const params: Record<string, string> = { dry_weight_kg: dryWeight.toString() };
    if (moisture !== undefined) params.moisture_pct = moisture.toString();
    return this.request(`/factory/drying/${batchId}/complete?${new URLSearchParams(params)}`, { method: 'PUT' });
  }

  async getActiveDrying(farmId: number) {
    return this.get(`/factory/drying/active/${farmId}`);
  }

  async getFactoryDailySummary(farmId: number, date?: string) {
    const params = date ? { summary_date: date } : undefined;
    return this.get(`/factory/daily-summary/${farmId}`, params);
  }

  async getCherryToParchmentRatios(farmId: number, limit: number = 50) {
    return this.get(`/factory/ratios/${farmId}`, { limit: limit.toString() });
  }

  // ===========================
  // Godown Operations
  // ===========================

  async receiveFromDrying(data: any) {
    return this.post('/godown/receive', data);
  }

  async issueFromGodown(data: any) {
    return this.post('/godown/issue', data);
  }

  async createBulkMix(data: any) {
    return this.post('/godown/mix', data);
  }

  async getGodownInventory(farmId: number) {
    return this.get(`/godown/inventory/${farmId}`);
  }

  async getGodownPiles(farmId: number, grade?: string) {
    const params = grade ? { grade } : undefined;
    return this.get(`/godown/piles/${farmId}`, params);
  }

  async recordGodownDailyStock(farmId: number) {
    return this.post('/godown/daily-stock', { godown_farm_id: farmId });
  }

  async getGodownDailyStock(farmId: number, date?: string) {
    const params = date ? { stock_date: date } : undefined;
    return this.get(`/godown/daily-stock/${farmId}`, params);
  }

  async getGodownHistory(farmId: number, limit: number = 100) {
    return this.get(`/godown/history/${farmId}`, { limit: limit.toString() });
  }

  // ===========================
  // Milling Operations
  // ===========================

  async createMillingBatch(data: any) {
    return this.post('/milling/batches', data);
  }

  async startMilling(batchId: number) {
    return this.put(`/milling/batches/${batchId}/start`);
  }

  async completeMilling(batchId: number, data: any) {
    return this.put(`/milling/batches/${batchId}/complete`, data);
  }

  async getMillingBatches(farmId: number, status?: string) {
    const params: Record<string, string> = { factory_farm_id: farmId.toString() };
    if (status) params.status = status;
    return this.get('/milling/batches', params);
  }

  // ===========================
  // Traceability
  // ===========================

  async traceForward(entityType: string, entityId: number) {
    return this.get(`/traceability/forward/${entityType}/${entityId}`);
  }

  async traceBackward(entityType: string, entityId: number) {
    return this.get(`/traceability/backward/${entityType}/${entityId}`);
  }

  async investigateComplaint(pileId?: number, millingBatchId?: number) {
    const params: Record<string, string> = {};
    if (pileId) params.pile_id = pileId.toString();
    if (millingBatchId) params.milling_batch_id = millingBatchId.toString();
    return this.get('/traceability/investigate', params);
  }

  async getAuthorizationChain(entityType: string, entityId: number) {
    return this.get(`/traceability/authorization-chain/${entityType}/${entityId}`);
  }

  // ===========================
  // Yield Forecasting
  // ===========================

  async createYieldSample(data: any) {
    return this.post('/yield/samples', data);
  }

  async getYieldSamples(farmId: number, blockId?: number, limit?: number) {
    const params: Record<string, string> = {};
    if (blockId) params.block_id = String(blockId);
    if (limit) params.limit = String(limit);
    return this.get(`/yield/samples/${farmId}`, params);
  }

  async createYieldForecast(farmId: number, data: any) {
    return this.post(`/yield/forecast/${farmId}`, data);
  }

  async getYieldForecasts(farmId: number, seasonYear?: number) {
    const params = seasonYear ? { season_year: String(seasonYear) } : undefined;
    return this.get(`/yield/forecast/${farmId}`, params);
  }

  async confirmYieldForecast(forecastId: number) {
    return this.put(`/yield/forecast/${forecastId}/confirm`);
  }

  // ===========================
  // Harvest Planning
  // ===========================

  async createHarvestPlan(data: any) {
    return this.post('/harvest/plan', data);
  }

  async getHarvestPlans(farmId: number, seasonYear?: number) {
    const params = seasonYear ? { season_year: String(seasonYear) } : undefined;
    return this.get(`/harvest/plan/${farmId}`, params);
  }

  async approveHarvestPlan(planId: number) {
    return this.put(`/harvest/plan/${planId}/approve`);
  }

  async getHarvestChecklist(planId: number) {
    return this.get(`/harvest/checklist/${planId}`);
  }

  async updateHarvestChecklist(planId: number, data: any) {
    return this.put(`/harvest/checklist/${planId}`, data);
  }

  // ===========================
  // Daily Picking Rate (GM)
  // ===========================

  async setDailyPickingRate(data: any) {
    return this.post('/harvest/picking-rate', data);
  }

  async getDailyPickingRates(farmId: number, pickingType?: string, fromDate?: string, toDate?: string) {
    const params: Record<string, string> = {};
    if (pickingType) params.picking_type = pickingType;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    return this.get(`/harvest/picking-rate/${farmId}`, params);
  }

  // ===========================
  // Picker Weighing (Harvest)
  // ===========================

  async recordPickerWeighing(data: any) {
    return this.post('/harvest/weighing', data);
  }

  async getPickerWeighingRecords(farmId: number, datePicked?: string, harvestPlanId?: number) {
    const params: Record<string, string> = {};
    if (datePicked) params.date_picked = datePicked;
    if (harvestPlanId) params.harvest_plan_id = String(harvestPlanId);
    return this.get(`/harvest/weighing/${farmId}`, params);
  }

  // ===========================
  // Coffee Processing Batches
  // ===========================

  async createProcessingBatch(data: any) {
    return this.post('/harvest/processing/batch', data);
  }

  async getProcessingBatches(farmId: number, status?: string) {
    const params = status ? { status } : undefined;
    return this.get(`/harvest/processing/${farmId}`, params);
  }

  async updateBatchHopper(batchId: number, hopperWeightKg: number) {
    return this.put(`/harvest/processing/${batchId}/hopper`, { hopper_weight_kg: hopperWeightKg });
  }

  async updateBatchPulping(batchId: number, data: any) {
    return this.put(`/harvest/processing/${batchId}/pulping`, data);
  }

  async startBatchFermentation(batchId: number, fermentationStart: string) {
    return this.put(`/harvest/processing/${batchId}/fermentation-start`, { fermentation_start: fermentationStart });
  }

  async endBatchFermentation(batchId: number, fermentationEnd: string) {
    return this.put(`/harvest/processing/${batchId}/fermentation-end`, { fermentation_end: fermentationEnd });
  }

  async startBatchDrying(batchId: number, data: any) {
    return this.put(`/harvest/processing/${batchId}/drying`, data);
  }

  async completeBatch(batchId: number, data: any) {
    return this.put(`/harvest/processing/${batchId}/complete`, data);
  }

  // ===========================
  // Drying Monitoring
  // ===========================

  async logDrying(data: any) {
    return this.post('/harvest/drying/log', data);
  }

  async getDryingLogs(batchId: number) {
    return this.get(`/harvest/drying/${batchId}/logs`);
  }

  async getDryingForecast(batchId: number, targetMoisture?: number) {
    const params = targetMoisture ? { target_moisture: String(targetMoisture) } : undefined;
    return this.get(`/harvest/drying/${batchId}/forecast`, params);
  }

  // ===========================
  // Harvest Report
  // ===========================

  async getHarvestReport(farmId: number, seasonYear: number) {
    return this.get(`/harvest/report/${farmId}`, { season_year: String(seasonYear) });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
