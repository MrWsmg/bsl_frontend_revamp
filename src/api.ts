const API_BASE_URL = 'http://localhost:8000/api';

interface ApiService {
  login(credentials: { username: string; password: string }): Promise<any>;
  getFarms(role?: string): Promise<any[]>;
  getTaskCodes(): Promise<any[]>;
  getTaskCodesFromData(): Promise<any[]>;
  getPayrollRecords(params?: Record<string, any>): Promise<any[]>;
  createPayrollRecord(data: any): Promise<any>;
  getStockRecords(params?: Record<string, any>): Promise<any[]>;
  createStockRecord(data: any): Promise<any>;
  getExpenseRecords(params?: Record<string, any>): Promise<any[]>;
  createExpenseRecord(data: any): Promise<any>;
  getTransferRecords(params?: Record<string, any>): Promise<any[]>;
  createTransferRecord(data: any): Promise<any>;
  updateTransferStatus(transferId: number, status: string): Promise<any>;
  uploadReceipt(file: File): Promise<{ url: string }>;
  createUser(userData: any): Promise<any>;
  updateUser(userId: number, userData: any): Promise<any>;
  getUsers(): Promise<any[]>;
  getWorkers(): Promise<any[]>;
  assignTaskToWorker(workerId: number, taskData: any): Promise<any>;
  startWorkerTask(workerId: number, taskId: string | number): Promise<any>;
  completeWorkerTask(workerId: number, completionData: any): Promise<any>;
  initializeTaskCodes(): Promise<any>;
  createWorker(data: any): Promise<any>;
  updateWorker(workerId: number, data: any): Promise<any>;
  deleteWorker(workerId: number): Promise<any>;
  getCombinedSummary(): Promise<any>;
  approvePayrollRecord(recordId: number): Promise<any>;
  rejectPayrollRecord(recordId: number): Promise<any>;
  updatePayrollRecord(recordId: number, data: any): Promise<any>;
  getSupervisorDailyTotals(): Promise<any>;
  getSupervisorWorkHistory(startDate: string, endDate: string): Promise<any>;
  getWorkerStats(workerId: number): Promise<any>;
  getAdminTotalArea(): Promise<any>;
  getPayrollPayrollSummary(): Promise<any>;
  getPendingPayrollRecords(params?: Record<string, any>): Promise<any[]>;
  // Store Management
  requestItem(data: any): Promise<any>;
  createSimrRequest(data: any): Promise<any>;
  getSimrRequests(): Promise<any[]>;
  getAllSimrRequests(): Promise<any[]>;
  getPendingSimrRequests(): Promise<any[]>;
  approveSimrRequest(requestId: number, notes?: string): Promise<any>;
  rejectSimrRequest(requestId: number, reason: string): Promise<any>;
  collectSimrRequest(requestId: number): Promise<any>;
  getSupervisorItemRequests(): Promise<any[]>;
  getAllItemRequests(): Promise<any[]>;
  getPendingItemRequests(): Promise<any[]>;
  approveItemRequest(requestId: number): Promise<any>;
  rejectItemRequest(requestId: number): Promise<any>;
  issueItemRequest(requestId: number): Promise<any>;
  confirmReceipt(requestId: number, receivedStatus: "received" | "not_received"): Promise<any>;
  getStockMovements(params?: Record<string, any>): Promise<any[]>;
  getPriceListData(): Promise<any[]>;
  getManagerActivities(params?: Record<string, any>): Promise<any>;
  // Block Management
  getBlocksForFarm(farmId: number): Promise<any[]>;
  createBlock(data: any): Promise<any>;
  updateBlock(blockId: number, data: any): Promise<any>;
  deleteBlock(blockId: number): Promise<any>;
  getFarmBlocksSummary(farmId: number): Promise<any>;
  // Manager-specific endpoints
  getManagerFarms(): Promise<any[]>;
  getManagerUsers(): Promise<any[]>;
  getManagerPendingPayroll(): Promise<any[]>;
  getManagerAllPayroll(): Promise<any[]>;
  approveManagerPayroll(recordId: number): Promise<any>;
  getManagerItemRequests(): Promise<any[]>;
  getManagerWorkers(): Promise<any[]>;
  getManagerTaskAssignments(): Promise<any[]>;
  getManagerCompletedTasks(): Promise<any[]>;
  getManagerStockRecords(): Promise<any[]>;
  getManagerInventory(): Promise<any[]>;
  getManagerExpenses(): Promise<any[]>;
  getManagerInspections(): Promise<any[]>;
  createManagerInspection(data: any): Promise<any>;
  getManagerEmergencies(): Promise<any[]>;
  createManagerEmergency(data: any): Promise<any>;
  getManagerIncidents(): Promise<any[]>;
  createManagerIncident(data: any): Promise<any>;
  getManagerForecasts(): Promise<any[]>;
  createManagerForecast(data: any): Promise<any>;
  getManagerEquipment(): Promise<any[]>;
  createManagerEquipment(data: any): Promise<any>;
  getManagerStorage(): Promise<any[]>;
  createManagerStorage(data: any): Promise<any>;
  // New approval role endpoints
  getAccountManagerPendingPayroll(): Promise<any[]>;
  approveAccountManagerPayroll(recordId: number): Promise<any>;
  getFinancialControllerPendingPayroll(): Promise<any[]>;
  approveFinancialControllerPayroll(recordId: number): Promise<any>;
  getPayrollMasterPendingPayroll(): Promise<any[]>;
  approvePayrollMasterPayroll(recordId: number): Promise<any>;
  // Analytics endpoints
  getAnalyticsData(params?: Record<string, any>): Promise<any>;
  // Admin Manager Dashboard endpoints
  getAdminManagerDashboardData(): Promise<any>;
  getAdminManagerBudgets(period: 'weekly' | 'yearly'): Promise<any[]>;
  getAdminManagerPayrollData(): Promise<any[]>;
  getAdminManagerStockData(): Promise<any[]>;
  getAdminManagerWorkerData(): Promise<any[]>;
  getAdminManagerExpensesData(): Promise<any[]>;
  getAdminManagerActivities(): Promise<any[]>;
  getAdminManagerFarms(): Promise<any[]>;
  // Analytical Dashboard endpoints
  getAnalyticalDashboardData(): Promise<any>;
  getAnalyticalBudgets(period: 'weekly' | 'yearly'): Promise<any[]>;
  getAnalyticalPayrollData(): Promise<any[]>;
  getAnalyticalStockData(): Promise<any[]>;
  getAnalyticalWorkerData(): Promise<any[]>;
  getAnalyticalExpensesData(): Promise<any[]>;
  getAnalyticalActivities(): Promise<any[]>;
  getAnalyticalFarms(): Promise<any[]>;
  // Attendance endpoints
  createAttendance(data: any): Promise<any>;
  getAttendanceRecords(params?: Record<string, any>): Promise<any[]>;
  updateAttendance(attendanceId: number, data: any): Promise<any>;
  deleteAttendance(attendanceId: number): Promise<void>;
  getAttendanceReport(farmId: number, date: string): Promise<any>;
  checkInWithFace(formData: FormData): Promise<any>;
  getWorker(workerId: number): Promise<any>;
  // Issuance endpoints
  getPendingIssuances(): Promise<any[]>;
  prepareIssuance(requestId: number): Promise<void>;
  confirmIssuance(requestId: number): Promise<void>;
  uploadDispatchPhoto(requestId: number, file: File): Promise<{ photo_url: string }>;
  // Stock visibility endpoints
  getDailyStock(farmId?: number): Promise<any>;
  getYtdStock(farmId?: number): Promise<any>;
  getFarmStock(farmId?: number): Promise<any>;
  itemLookup(query: string): Promise<any[]>;
  // Picking Operations
  setDailyPickingPrice(data: any): Promise<any>;
  getDailyPickingPrice(farmId: number, date?: string): Promise<any>;
  getPickingPriceHistory(farmId: number, limit?: number): Promise<any[]>;
  createHarvestForecast(data: any): Promise<any>;
  getHarvestForecasts(farmId: number, seasonYear?: number): Promise<any[]>;
  updateHarvestForecast(forecastId: number, data: any): Promise<any>;
  sendSeasonCommunication(data: any): Promise<any>;
  getSeasonCommunications(farmId: number, seasonYear?: number): Promise<any[]>;
  createEquipmentCheck(data: any): Promise<any>;
  getEquipmentCheck(farmId: number, seasonYear?: number): Promise<any>;
  getReadinessOverview(farmId: number, seasonYear: number): Promise<any>;
  createPickingSeason(data: any): Promise<any>;
  getPickingSeason(farmId: number, seasonYear?: number): Promise<any>;
  openPickingSession(data: any): Promise<any>;
  closePickingSession(sessionId: number): Promise<any>;
  getPickingSessions(farmId?: number, date?: string, status?: string): Promise<any[]>;
  getPickingSessionDetail(sessionId: number): Promise<any>;
  recordPickerWeight(sessionId: number, data: any): Promise<any>;
  getDailyPickingSummary(farmId: number, date?: string): Promise<any>;
  getBlockPickingSummary(farmId: number, blockId: number, startDate?: string, endDate?: string): Promise<any>;
  getPickerHistory(workerId: number, startDate?: string, endDate?: string): Promise<any>;
  getPickerLeaderboard(farmId: number, date?: string, limit?: number): Promise<any[]>;
  // Factory Operations
  recordFactoryIntake(data: any): Promise<any>;
  getFactoryIntakes(farmId: number, date?: string): Promise<any[]>;
  createFermentationTank(data: any): Promise<any>;
  getFermentationTanks(farmId: number): Promise<any[]>;
  startFermentation(data: any): Promise<any>;
  completeFermentation(batchId: number): Promise<any>;
  getActiveFermentations(farmId: number): Promise<any[]>;
  recordWashing(data: any): Promise<any>;
  getWashingRecords(farmId: number): Promise<any[]>;
  createDryingTable(data: any): Promise<any>;
  getDryingTables(farmId: number): Promise<any[]>;
  startDrying(data: any): Promise<any>;
  updateDrying(batchId: number, data: any): Promise<any>;
  completeDrying(batchId: number, dryWeight: number, moisture?: number): Promise<any>;
  getActiveDrying(farmId: number): Promise<any[]>;
  getFactoryDailySummary(farmId: number, date?: string): Promise<any>;
  getCherryToParchmentRatios(farmId: number, limit?: number): Promise<any[]>;
  // Godown Operations
  receiveFromDrying(data: any): Promise<any>;
  issueFromGodown(data: any): Promise<any>;
  createBulkMix(data: any): Promise<any>;
  getGodownInventory(farmId: number): Promise<any>;
  getGodownPiles(farmId: number, grade?: string): Promise<any[]>;
  recordGodownDailyStock(farmId: number): Promise<any>;
  getGodownDailyStock(farmId: number, date?: string): Promise<any>;
  getGodownHistory(farmId: number, limit?: number): Promise<any[]>;
  // Milling Operations
  createMillingBatch(data: any): Promise<any>;
  startMilling(batchId: number): Promise<any>;
  completeMilling(batchId: number, data: any): Promise<any>;
  getMillingBatches(farmId: number, status?: string): Promise<any[]>;
  // Traceability
  traceForward(entityType: string, entityId: number): Promise<any>;
  traceBackward(entityType: string, entityId: number): Promise<any>;
  investigateComplaint(pileId?: number, millingBatchId?: number): Promise<any>;
  getAuthorizationChain(entityType: string, entityId: number): Promise<any>;
}

class ApiServiceImpl implements ApiService {
  private isLoggedIn: boolean = false;

  constructor() {
    // Check if we have a token
    this.checkSession();
  }

  async checkSession() {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    this.isLoggedIn = !!token;
  }

  setLoggedIn(loggedIn: boolean) {
    this.isLoggedIn = loggedIn;
  }

  clearSession() {
    this.isLoggedIn = false;
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear cookie for middleware auth check
    document.cookie = 'token=; path=/; max-age=0';
  }

  getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async request(endpoint: string, options: RequestInit = {}, retryCount: number = 0): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    // Add body for non-GET requests
    if (options.body && typeof options.body !== 'string') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);

      // Handle authentication errors
      if (response.status === 401) {
        // Only clear session if this is not a HEAD request (session check) and we've already retried
        if (options.method !== 'HEAD' && retryCount > 0) {
          // Clear session
          this.clearSession();
          // Dispatch auth error event
          window.dispatchEvent(new CustomEvent('auth-error', {
            detail: { message: 'Authentication failed. Please log in again.' }
          }));
        }
        // Throw specific error
        throw new Error('Authentication failed. Please log in again.');
      }

      if (!response.ok) {
        // Retry once for non-auth errors
        if (retryCount === 0 && response.status >= 500) {
          console.warn(`Retrying request to ${endpoint} due to server error`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          return this.request(endpoint, options, retryCount + 1);
        }
        throw new Error(`API Error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      // Retry once for network errors
      if (retryCount === 0 && error instanceof TypeError) {
        console.warn(`Retrying request to ${endpoint} due to network error`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return this.request(endpoint, options, retryCount + 1);
      }
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth
  async login(credentials: { username: string; password: string }): Promise<any> {
    console.log('API login called with:', credentials);
    const result = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    console.log('Login API response:', result);
    if (result.access_token && typeof window !== 'undefined') {
      localStorage.setItem('token', result.access_token);
      localStorage.setItem('user', JSON.stringify(result.user_info));
      // Set cookie for middleware auth check
      document.cookie = `token=${result.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
      this.setLoggedIn(true);
    }
    return result;
  }

  // Farms
  async getFarms(role: string = ''): Promise<any[]> {
    if (role === 'payroll') {
      return this.request('/payroll/farms');
    } else if (role === 'stock') {
      return this.request('/stock/farms');
    } else if (role === 'farm_clerk') {
      return this.request('/farm-clerk/farms');
    } else if (role === 'supervisor') {
      return this.request('/farms');
    } else if (role === 'worker') {
      return this.request('/farms');
    } else {
      return this.request('/farms');
    }
  }

  // Task Codes
  async getTaskCodes(): Promise<any[]> {
    return this.request('/task-codes');
  }

  async getTaskCodesFromData(): Promise<any[]> {
    return this.request('/task-codes-data');
  }

  // Payroll Records
  async getPayrollRecords(params: Record<string, any> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/payroll/payroll?${queryString}`);
  }

  async createPayrollRecord(data: any): Promise<any> {
    return this.request('/payroll/payroll', {
      method: 'POST',
      body: data,
    });
  }

  // Stock Records
  async getStockRecords(params: Record<string, any> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/stock/stock?${queryString}`);
  }

  async createStockRecord(data: any): Promise<any> {
    return this.request('/stock/stock', {
      method: 'POST',
      body: data,
    });
  }

  // Inventory Items
  async getInventoryItems(params: Record<string, any> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/farm-clerk/inventory?${queryString}`);
  }

  async createInventoryItem(data: any): Promise<any> {
    return this.request('/farm-clerk/inventory', {
      method: 'POST',
      body: data,
    });
  }

  // Expense Records
  async getExpenseRecords(params: Record<string, any> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/farm-clerk/expenses?${queryString}`);
  }

  async createExpenseRecord(data: any): Promise<any> {
    return this.request('/farm-clerk/expenses', {
      method: 'POST',
      body: data,
    });
  }

  // Transfer Records
  async getTransferRecords(params: Record<string, any> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/farm-clerk/transfers?${queryString}`);
  }

  async createTransferRecord(data: any): Promise<any> {
    return this.request('/farm-clerk/transfers', {
      method: 'POST',
      body: data,
    });
  }

  async updateTransferStatus(transferId: number, status: string): Promise<any> {
    return this.request(`/farm-clerk/transfers/${transferId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // File Upload
  async uploadReceipt(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload-receipt`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  }

  // User Management
  async createUser(userData: any): Promise<any> {
    return this.request('/admin/users', {
      method: 'POST',
      body: userData,
    });
  }

  async updateUser(userId: number, userData: any): Promise<any> {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: userData,
    });
  }

  async getUsers(): Promise<any[]> {
    return this.request('/admin/users');
  }

  // Worker Management
  async getWorkers(): Promise<any[]> {
    return this.request('/workers');
  }

  async createWorker(data: any): Promise<any> {
    return this.request('/workers', {
      method: 'POST',
      body: data,
    });
  }

  async updateWorker(workerId: number, data: any): Promise<any> {
    return this.request(`/workers/${workerId}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteWorker(workerId: number): Promise<any> {
    return this.request(`/workers/${workerId}`, {
      method: 'DELETE',
    });
  }

  // Admin Activities
  async getAdminActivities(params: Record<string, any> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/activities?${queryString}`);
  }

  // Daily Reports
  async getDailyReport(date: string, farmId?: number): Promise<any> {
    const params: Record<string, any> = { date };
    if (farmId) params.farm_id = farmId;
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/daily-report?${queryString}`);
  }

  // Weekly Reports
  async getWeeklyReport(weekStart: string, farmId?: number): Promise<any> {
    const params: Record<string, any> = { week_start: weekStart };
    if (farmId) params.farm_id = farmId;
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/weekly-report?${queryString}`);
  }

  // Weekly Report Exports
  async downloadWeeklyReportExcel(weekStart: string, farmId?: number): Promise<void> {
    const params: Record<string, any> = { week_start: weekStart };
    if (farmId) params.farm_id = farmId;
    const queryString = new URLSearchParams(params).toString();

    const response = await fetch(`${API_BASE_URL}/admin/weekly-report/excel?${queryString}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to download Excel report`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly_report_${weekStart}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async downloadWeeklyReportPDF(weekStart: string, farmId?: number): Promise<void> {
    const params: Record<string, any> = { week_start: weekStart };
    if (farmId) params.farm_id = farmId;
    const queryString = new URLSearchParams(params).toString();

    const response = await fetch(`${API_BASE_URL}/admin/weekly-report/pdf?${queryString}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF report`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly_report_${weekStart}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // Clerk Weekly Summaries
  async getPayrollWeeklySummary(): Promise<any> {
    return this.request('/payroll/weekly-summary');
  }

  async getStockWeeklySummary(): Promise<any> {
    return this.request('/stock/weekly-summary');
  }

  async getFarmClerkWeeklySummary(): Promise<any> {
    return this.request('/farm-clerk/weekly-summary');
  }

  // Picking-specific endpoints
  async getPickingRecords(params: Record<string, any> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/payroll/picking/records?${queryString}`);
  }

  async getPickingSummary(params: Record<string, any> = {}): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/payroll/picking/summary?${queryString}`);
  }

  async getPickingWeeklySummary(): Promise<any> {
    return this.request('/payroll/picking/weekly-summary');
  }
  // Task Management
  async assignTaskToWorker(workerId: number, taskData: any): Promise<any> {
    return this.request(`/workers/${workerId}/assign-task`, {
      method: 'POST',
      body: taskData,
    });
  }

  async startWorkerTask(workerId: number, taskId: string | number): Promise<any> {
    const taskIdStr = typeof taskId === 'string' ? taskId : taskId.toString();
    return this.request(`/workers/${workerId}/start-task/${taskIdStr}`, {
      method: 'POST',
    });
  }

  async completeWorkerTask(workerId: number, completionData: any): Promise<any> {
    return this.request(`/workers/${workerId}/complete-task`, {
      method: 'POST',
      body: completionData,
    });
  }

  // Initialize Task Codes
  async initializeTaskCodes(): Promise<any> {
    return this.request('/initialize-task-codes', {
      method: 'POST',
    });
  }

  // Combined Summary
  async getCombinedSummary(): Promise<any> {
    return this.request('/admin/combined-summary');
  }

  // Payroll Approval
  async approvePayrollRecord(recordId: number): Promise<any> {
    return this.request(`/payroll/payroll/${recordId}/approve`, {
      method: 'PUT',
    });
  }

  async rejectPayrollRecord(recordId: number): Promise<any> {
    return this.request(`/payroll/payroll/${recordId}/reject`, {
      method: 'PUT',
    });
  }

  async updatePayrollRecord(recordId: number, data: any): Promise<any> {
    return this.request(`/payroll/payroll/${recordId}`, {
      method: 'PUT',
      body: data,
    });
  }

  // Calculation endpoints
  async getSupervisorDailyTotals(): Promise<any> {
    return this.request('/supervisor/daily-totals');
  }

  async getSupervisorWorkHistory(startDate: string, endDate: string): Promise<any> {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    return this.request(`/supervisor/work-history?${params}`);
  }

  async getWorkerStats(workerId: number): Promise<any> {
    return this.request(`/calculations/worker/stats/${workerId}`);
  }

  async getAdminTotalArea(): Promise<any> {
    return this.request('/calculations/admin/total-area');
  }

  async getPendingPayrollRecords(params: Record<string, any> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/payroll/payroll/pending?${queryString}`);
  }

  async getBslPendingPayrollRecords(params: Record<string, any> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/payroll/payroll/bsl-pending?${queryString}`);
  }


  async getPayrollPayrollSummary(): Promise<any> {
    return this.request('/calculations/payroll/payroll-summary');
  }

  // Store Management
  async requestItem(data: any): Promise<any> {
    return this.request('/supervisor/request-item', {
      method: 'POST',
      body: data,
    });
  }

  async createSimrRequest(data: any): Promise<any> {
    return this.request('/supervisor/request-item', {
      method: 'POST',
      body: data,
    });
  }

  async getSimrRequests(): Promise<any[]> {
    return this.request('/supervisor/item-requests');
  }

  async getAllSimrRequests(): Promise<any[]> {
    return this.request('/supervisor/all-item-requests');
  }

  async getPendingSimrRequests(): Promise<any[]> {
    return this.request('/supervisor/pending-simr-requests');
  }

  async approveSimrRequest(requestId: number, notes?: string): Promise<any> {
    return this.request(`/supervisor/approve-simr/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectSimrRequest(requestId: number, reason: string): Promise<any> {
    return this.request(`/supervisor/reject-simr/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async collectSimrRequest(requestId: number): Promise<any> {
    return this.request(`/supervisor/collect-simr/${requestId}`, {
      method: 'POST',
    });
  }

  async getSupervisorItemRequests(): Promise<any[]> {
    return this.request('/supervisor/item-requests');
  }

  async getAllItemRequests(): Promise<any[]> {
    return this.request('/supervisor/all-item-requests');
  }

  async getPendingItemRequests(): Promise<any[]> {
    return this.request('/farm-clerk/pending-requests');
  }

  async approveItemRequest(requestId: number): Promise<any> {
    return this.request(`/farm-clerk/approve-request/${requestId}`, {
      method: 'POST',
    });
  }

  async rejectItemRequest(requestId: number): Promise<any> {
    return this.request(`/farm-clerk/reject-request/${requestId}`, {
      method: 'POST',
    });
  }

  async issueItemRequest(requestId: number): Promise<any> {
    return this.request(`/farm-clerk/issue-request/${requestId}`, {
      method: 'POST',
    });
  }

  async confirmReceipt(requestId: number, receivedStatus: "received" | "not_received"): Promise<any> {
    return this.request(`/supervisor/confirm-receipt/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({ received_status: receivedStatus }),
    });
  }

  async getStockMovements(params: Record<string, any> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/farm-clerk/stock-movements?${queryString}`);
  }

  async getPriceListData(): Promise<any[]> {
    return this.request('/price-list-data');
  }

  async getManagerActivities(params: Record<string, any> = {}): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/manager-activities?${queryString}`);
  }

  // Block Management
  async getBlocksForFarm(farmId: number): Promise<any[]> {
    return this.request(`/blocks/${farmId}`);
  }

  async createBlock(data: any): Promise<any> {
    return this.request('/blocks', {
      method: 'POST',
      body: data,
    });
  }

  async updateBlock(blockId: number, data: any): Promise<any> {
    return this.request(`/blocks/${blockId}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteBlock(blockId: number): Promise<any> {
    return this.request(`/blocks/${blockId}`, {
      method: 'DELETE',
    });
  }

  async getFarmBlocksSummary(farmId: number): Promise<any> {
    return this.request(`/farms/${farmId}/blocks-summary`);
  }

  // Manager-specific endpoints
  async getManagerFarms(): Promise<any[]> {
    return this.request('/manager/farms');
  }

  async getManagerUsers(): Promise<any[]> {
    return this.request('/manager/users');
  }

  async getManagerPendingPayroll(): Promise<any[]> {
    return this.request('/manager/payroll-pending');
  }

  async getManagerAllPayroll(): Promise<any[]> {
    return this.request('/manager/payroll-all');
  }

  async approveManagerPayroll(recordId: number): Promise<any> {
    return this.request(`/manager/approve-payroll/${recordId}`, {
      method: 'POST',
    });
  }

  async getManagerItemRequests(): Promise<any[]> {
    return this.request('/manager/item-requests');
  }

  async getManagerWorkers(): Promise<any[]> {
    return this.request('/manager/workers');
  }

  async getManagerTaskAssignments(): Promise<any[]> {
    return this.request('/manager/task-assignments');
  }

  async getManagerCompletedTasks(): Promise<any[]> {
    return this.request('/manager/tasks-completed');
  }

  async getManagerStockRecords(): Promise<any[]> {
    return this.request('/manager/stock-records');
  }

  async getManagerInventory(): Promise<any[]> {
    return this.request('/manager/inventory');
  }

  async getManagerExpenses(): Promise<any[]> {
    return this.request('/manager/expenses');
  }

  async getManagerInspections(): Promise<any[]> {
    return this.request('/manager/inspections');
  }

  async createManagerInspection(data: any): Promise<any> {
    return this.request('/manager/inspections', {
      method: 'POST',
      body: data,
    });
  }

  async getManagerEmergencies(): Promise<any[]> {
    return this.request('/manager/emergencies');
  }

  async createManagerEmergency(data: any): Promise<any> {
    return this.request('/manager/emergencies', {
      method: 'POST',
      body: data,
    });
  }

  async getManagerIncidents(): Promise<any[]> {
    return this.request('/manager/incidents');
  }

  async createManagerIncident(data: any): Promise<any> {
    return this.request('/manager/incidents', {
      method: 'POST',
      body: data,
    });
  }

  async getManagerForecasts(): Promise<any[]> {
    return this.request('/manager/forecasts');
  }

  async createManagerForecast(data: any): Promise<any> {
    return this.request('/manager/forecasts', {
      method: 'POST',
      body: data,
    });
  }

  async getManagerEquipment(): Promise<any[]> {
    return this.request('/manager/equipment');
  }

  async createManagerEquipment(data: any): Promise<any> {
    return this.request('/manager/equipment', {
      method: 'POST',
      body: data,
    });
  }

  async getManagerStorage(): Promise<any[]> {
    return this.request('/manager/storage');
  }

  async createManagerStorage(data: any): Promise<any> {
    return this.request('/manager/storage', {
      method: 'POST',
      body: data,
    });
  }

  // New approval role endpoints
  async getAccountManagerPendingPayroll(): Promise<any[]> {
    return this.request('/account-manager/pending-payroll');
  }

  async approveAccountManagerPayroll(recordId: number): Promise<any> {
    return this.request(`/account-manager/approve-payroll/${recordId}`, {
      method: 'POST',
    });
  }

  async getFinancialControllerPendingPayroll(): Promise<any[]> {
    return this.request('/financial-controller/pending-payroll');
  }

  async approveFinancialControllerPayroll(recordId: number): Promise<any> {
    return this.request(`/financial-controller/approve-payroll/${recordId}`, {
      method: 'POST',
    });
  }

  async getPayrollMasterPendingPayroll(): Promise<any[]> {
    return this.request('/payroll-master/pending-payroll');
  }

  async approvePayrollMasterPayroll(recordId: number): Promise<any> {
    return this.request(`/payroll-master/approve-payroll/${recordId}`, {
      method: 'POST',
    });
  }

  // Analytics endpoints
  async getAnalyticsData(params: Record<string, any> = {}): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/analytics?${queryString}`);
  }

  // Admin Manager Dashboard endpoints
  async getAdminManagerDashboardData(): Promise<any> {
    return this.request('/admin/analytics?period=30');
  }

  async getAdminManagerBudgets(period: 'weekly' | 'yearly'): Promise<any[]> {
    return this.request(`/budgets?period=${period}`);
  }

  async getAdminManagerPayrollData(): Promise<any[]> {
    return this.request('/admin/daily-report?date=' + new Date().toISOString().split('T')[0]);
  }

  async getAdminManagerStockData(): Promise<any[]> {
    return this.request('/stock/levels');
  }

  async getAdminManagerWorkerData(): Promise<any[]> {
    return this.request('/workers/distribution');
  }

  async getAdminManagerExpensesData(): Promise<any[]> {
    return this.request('/expenses?period=monthly');
  }

  async getAdminManagerActivities(): Promise<any[]> {
    return this.request('/admin/activities?limit=50');
  }

  async getAdminManagerFarms(): Promise<any[]> {
    return this.request('/farms/overview');
  }

  // Analytical Dashboard endpoints
  async getAnalyticalDashboardData(): Promise<any> {
    return this.request('/admin/combined-summary');
  }

  async getAnalyticalBudgets(period: 'weekly' | 'yearly'): Promise<any[]> {
    return this.request(`/budgets?period=${period}`);
  }

  async getAnalyticalPayrollData(): Promise<any[]> {
    return this.request('/payroll/trends?period=monthly');
  }

  async getAnalyticalStockData(): Promise<any[]> {
    return this.request('/stock/levels');
  }

  async getAnalyticalWorkerData(): Promise<any[]> {
    return this.request('/workers/distribution');
  }

  async getAnalyticalExpensesData(): Promise<any[]> {
    return this.request('/expenses?period=monthly');
  }

  async getAnalyticalActivities(): Promise<any[]> {
    return this.request('/activities?limit=50');
  }

  async getAnalyticalFarms(): Promise<any[]> {
    return this.request('/farms/overview');
  }

  // Attendance endpoints
  async createAttendance(data: any): Promise<any> {
    return this.request('/farm-clerk/attendance', {
      method: 'POST',
      body: data,
    });
  }

  async getAttendanceRecords(params: Record<string, any> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/farm-clerk/attendance?${queryString}`);
  }

  async updateAttendance(attendanceId: number, data: any): Promise<any> {
    return this.request(`/farm-clerk/attendance/${attendanceId}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteAttendance(attendanceId: number): Promise<void> {
    return this.request(`/farm-clerk/attendance/${attendanceId}`, {
      method: 'DELETE',
    });
  }

  async getAttendanceReport(farmId: number, date: string): Promise<any> {
    const params = new URLSearchParams({ farm_id: farmId.toString(), date });
    return this.request(`/farm-clerk/attendance/report?${params}`);
  }

  async checkInWithFace(formData: FormData): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/farm-clerk/attendance/checkin`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Check-in failed: ${response.status}`);
    }

    return response.json();
  }

  async getWorker(workerId: number): Promise<any> {
    return this.request(`/workers/${workerId}`);
  }

  // Issuance endpoints
  async getPendingIssuances(): Promise<any[]> {
    return this.request('/farm-clerk/issuances/pending');
  }

  async prepareIssuance(requestId: number): Promise<void> {
    return this.request(`/farm-clerk/issuances/${requestId}/prepare`, {
      method: 'POST',
    });
  }

  async confirmIssuance(requestId: number): Promise<void> {
    return this.request(`/farm-clerk/issuances/${requestId}/confirm`, {
      method: 'POST',
    });
  }

  async uploadDispatchPhoto(requestId: number, file: File): Promise<{ photo_url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/farm-clerk/issuances/${requestId}/dispatch-photo`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  }

  // Stock visibility endpoints
  async getDailyStock(farmId?: number): Promise<any> {
    const params = farmId ? `?farm_id=${farmId}` : '';
    return this.request(`/farm-clerk/stock/daily${params}`);
  }

  async getYtdStock(farmId?: number): Promise<any> {
    const params = farmId ? `?farm_id=${farmId}` : '';
    return this.request(`/farm-clerk/stock/ytd${params}`);
  }

  async getFarmStock(farmId?: number): Promise<any> {
    const params = farmId ? `?farm_id=${farmId}` : '';
    return this.request(`/farm-clerk/stock/farm${params}`);
  }

  async itemLookup(query: string): Promise<any[]> {
    const params = new URLSearchParams({ q: query });
    return this.request(`/farm-clerk/items/lookup?${params}`);
  }

  // ===========================
  // Picking Operations
  // ===========================

  async setDailyPickingPrice(data: any): Promise<any> {
    return this.request('/picking/daily-price', { method: 'POST', body: data });
  }

  async getDailyPickingPrice(farmId: number, date?: string): Promise<any> {
    const params = date ? `?price_date=${date}` : '';
    return this.request(`/picking/daily-price/${farmId}${params}`);
  }

  async getPickingPriceHistory(farmId: number, limit: number = 30): Promise<any[]> {
    return this.request(`/picking/daily-price/history/${farmId}?limit=${limit}`);
  }

  async createHarvestForecast(data: any): Promise<any> {
    return this.request('/picking/forecast', { method: 'POST', body: data });
  }

  async getHarvestForecasts(farmId: number, seasonYear?: number): Promise<any[]> {
    const params = seasonYear ? `?season_year=${seasonYear}` : '';
    return this.request(`/picking/forecast/${farmId}${params}`);
  }

  async updateHarvestForecast(forecastId: number, data: any): Promise<any> {
    return this.request(`/picking/forecast/${forecastId}`, { method: 'PUT', body: data });
  }

  async sendSeasonCommunication(data: any): Promise<any> {
    return this.request('/picking/communication/send', { method: 'POST', body: data });
  }

  async getSeasonCommunications(farmId: number, seasonYear?: number): Promise<any[]> {
    const params = seasonYear ? `?season_year=${seasonYear}` : '';
    return this.request(`/picking/communication/history/${farmId}${params}`);
  }

  async createEquipmentCheck(data: any): Promise<any> {
    return this.request('/picking/equipment-check', { method: 'POST', body: data });
  }

  async getEquipmentCheck(farmId: number, seasonYear?: number): Promise<any> {
    const params = seasonYear ? `?season_year=${seasonYear}` : '';
    return this.request(`/picking/equipment-check/${farmId}${params}`);
  }

  async getReadinessOverview(farmId: number, seasonYear: number): Promise<any> {
    return this.request(`/picking/readiness/${farmId}?season_year=${seasonYear}`);
  }

  async createPickingSeason(data: any): Promise<any> {
    return this.request('/picking/seasons/create', { method: 'POST', body: data });
  }

  async getPickingSeason(farmId: number, seasonYear?: number): Promise<any> {
    const params = seasonYear ? `?season_year=${seasonYear}` : '';
    return this.request(`/picking/seasons/${farmId}${params}`);
  }

  async openPickingSession(data: any): Promise<any> {
    return this.request('/picking/sessions', { method: 'POST', body: data });
  }

  async closePickingSession(sessionId: number): Promise<any> {
    return this.request(`/picking/sessions/${sessionId}/close`, { method: 'PUT' });
  }

  async getPickingSessions(farmId?: number, date?: string, status?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (farmId) params.set('farm_id', farmId.toString());
    if (date) params.set('session_date', date);
    if (status) params.set('status', status);
    const qs = params.toString();
    return this.request(`/picking/sessions${qs ? '?' + qs : ''}`);
  }

  async getPickingSessionDetail(sessionId: number): Promise<any> {
    return this.request(`/picking/sessions/${sessionId}`);
  }

  async recordPickerWeight(sessionId: number, data: any): Promise<any> {
    return this.request(`/picking/sessions/${sessionId}/weigh`, { method: 'POST', body: data });
  }

  async getDailyPickingSummary(farmId: number, date?: string): Promise<any> {
    const params = date ? `?summary_date=${date}` : '';
    return this.request(`/picking/daily-summary/${farmId}${params}`);
  }

  async getBlockPickingSummary(farmId: number, blockId: number, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const qs = params.toString();
    return this.request(`/picking/block-summary/${farmId}/${blockId}${qs ? '?' + qs : ''}`);
  }

  async getPickerHistory(workerId: number, startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.set('start_date', startDate);
    if (endDate) params.set('end_date', endDate);
    const qs = params.toString();
    return this.request(`/picking/picker-history/${workerId}${qs ? '?' + qs : ''}`);
  }

  async getPickerLeaderboard(farmId: number, date?: string, limit: number = 20): Promise<any[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (date) params.set('leader_date', date);
    return this.request(`/picking/leaderboard/${farmId}?${params}`);
  }

  // ===========================
  // Factory Operations
  // ===========================

  async recordFactoryIntake(data: any): Promise<any> {
    return this.request('/factory/intake', { method: 'POST', body: data });
  }

  async getFactoryIntakes(farmId: number, date?: string): Promise<any[]> {
    const params = date ? `?intake_date=${date}` : '';
    return this.request(`/factory/intake/${farmId}${params}`);
  }

  async createFermentationTank(data: any): Promise<any> {
    return this.request('/factory/tanks', { method: 'POST', body: data });
  }

  async getFermentationTanks(farmId: number): Promise<any[]> {
    return this.request(`/factory/tanks/${farmId}`);
  }

  async startFermentation(data: any): Promise<any> {
    return this.request('/factory/fermentation/start', { method: 'POST', body: data });
  }

  async completeFermentation(batchId: number): Promise<any> {
    return this.request(`/factory/fermentation/${batchId}/complete`, { method: 'PUT' });
  }

  async getActiveFermentations(farmId: number): Promise<any[]> {
    return this.request(`/factory/fermentation/active/${farmId}`);
  }

  async recordWashing(data: any): Promise<any> {
    return this.request('/factory/washing', { method: 'POST', body: data });
  }

  async getWashingRecords(farmId: number): Promise<any[]> {
    return this.request(`/factory/washing/${farmId}`);
  }

  async createDryingTable(data: any): Promise<any> {
    return this.request('/factory/drying-tables', { method: 'POST', body: data });
  }

  async getDryingTables(farmId: number): Promise<any[]> {
    return this.request(`/factory/drying-tables/${farmId}`);
  }

  async startDrying(data: any): Promise<any> {
    return this.request('/factory/drying/start', { method: 'POST', body: data });
  }

  async updateDrying(batchId: number, data: any): Promise<any> {
    return this.request(`/factory/drying/${batchId}/update`, { method: 'PUT', body: data });
  }

  async completeDrying(batchId: number, dryWeight: number, moisture?: number): Promise<any> {
    const params = new URLSearchParams({ dry_weight_kg: dryWeight.toString() });
    if (moisture !== undefined) params.set('moisture_pct', moisture.toString());
    return this.request(`/factory/drying/${batchId}/complete?${params}`, { method: 'PUT' });
  }

  async getActiveDrying(farmId: number): Promise<any[]> {
    return this.request(`/factory/drying/active/${farmId}`);
  }

  async getFactoryDailySummary(farmId: number, date?: string): Promise<any> {
    const params = date ? `?summary_date=${date}` : '';
    return this.request(`/factory/daily-summary/${farmId}${params}`);
  }

  async getCherryToParchmentRatios(farmId: number, limit: number = 50): Promise<any[]> {
    return this.request(`/factory/ratios/${farmId}?limit=${limit}`);
  }

  // ===========================
  // Godown Operations
  // ===========================

  async receiveFromDrying(data: any): Promise<any> {
    return this.request('/godown/receive', { method: 'POST', body: data });
  }

  async issueFromGodown(data: any): Promise<any> {
    return this.request('/godown/issue', { method: 'POST', body: data });
  }

  async createBulkMix(data: any): Promise<any> {
    return this.request('/godown/mix', { method: 'POST', body: data });
  }

  async getGodownInventory(farmId: number): Promise<any> {
    return this.request(`/godown/inventory/${farmId}`);
  }

  async getGodownPiles(farmId: number, grade?: string): Promise<any[]> {
    const params = grade ? `?grade=${grade}` : '';
    return this.request(`/godown/piles/${farmId}${params}`);
  }

  async recordGodownDailyStock(farmId: number): Promise<any> {
    return this.request('/godown/daily-stock', { method: 'POST', body: JSON.stringify({ godown_farm_id: farmId }) });
  }

  async getGodownDailyStock(farmId: number, date?: string): Promise<any> {
    const params = date ? `?stock_date=${date}` : '';
    return this.request(`/godown/daily-stock/${farmId}${params}`);
  }

  async getGodownHistory(farmId: number, limit: number = 100): Promise<any[]> {
    return this.request(`/godown/history/${farmId}?limit=${limit}`);
  }

  // ===========================
  // Milling Operations
  // ===========================

  async createMillingBatch(data: any): Promise<any> {
    return this.request('/milling/batches', { method: 'POST', body: data });
  }

  async startMilling(batchId: number): Promise<any> {
    return this.request(`/milling/batches/${batchId}/start`, { method: 'PUT' });
  }

  async completeMilling(batchId: number, data: any): Promise<any> {
    return this.request(`/milling/batches/${batchId}/complete`, { method: 'PUT', body: data });
  }

  async getMillingBatches(farmId: number, status?: string): Promise<any[]> {
    const params = new URLSearchParams({ factory_farm_id: farmId.toString() });
    if (status) params.set('status', status);
    return this.request(`/milling/batches?${params}`);
  }

  // ===========================
  // Traceability
  // ===========================

  async traceForward(entityType: string, entityId: number): Promise<any> {
    return this.request(`/traceability/forward/${entityType}/${entityId}`);
  }

  async traceBackward(entityType: string, entityId: number): Promise<any> {
    return this.request(`/traceability/backward/${entityType}/${entityId}`);
  }

  async investigateComplaint(pileId?: number, millingBatchId?: number): Promise<any> {
    const params = new URLSearchParams();
    if (pileId) params.set('pile_id', pileId.toString());
    if (millingBatchId) params.set('milling_batch_id', millingBatchId.toString());
    return this.request(`/traceability/investigate?${params}`);
  }

  async getAuthorizationChain(entityType: string, entityId: number): Promise<any> {
    return this.request(`/traceability/authorization-chain/${entityType}/${entityId}`);
  }
}

const apiService = new ApiServiceImpl();
export default apiService;