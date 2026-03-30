// Management API service for inspections, emergencies, etc.
import { BaseApiService } from './base';
import { 
  Inspection, 
  Emergency, 
  Incident, 
  Forecast, 
  Equipment, 
  StorageUnit,
  AttendanceRecord,
  AttendanceReport,
  PerformanceMetrics,
  AttendanceFilters,
  PerformanceFilters
} from '../../types';

export class ManagementApiService extends BaseApiService {
  /**
   * Get manager inspections
   */
  async getManagerInspections(): Promise<Inspection[]> {
    return this.get<Inspection[]>('/manager/inspections');
  }

  /**
   * Create manager inspection
   */
  async createManagerInspection(data: Partial<Inspection>): Promise<Inspection> {
    return this.post<Inspection>('/manager/inspections', data);
  }

  /**
   * Get manager emergencies
   */
  async getManagerEmergencies(): Promise<Emergency[]> {
    return this.get<Emergency[]>('/manager/emergencies');
  }

  /**
   * Create manager emergency
   */
  async createManagerEmergency(data: Partial<Emergency>): Promise<Emergency> {
    return this.post<Emergency>('/manager/emergencies', data);
  }

  /**
   * Get manager incidents
   */
  async getManagerIncidents(): Promise<Incident[]> {
    return this.get<Incident[]>('/manager/incidents');
  }

  /**
   * Create manager incident
   */
  async createManagerIncident(data: Partial<Incident>): Promise<Incident> {
    return this.post<Incident>('/manager/incidents', data);
  }

  /**
   * Get manager forecasts
   */
  async getManagerForecasts(): Promise<Forecast[]> {
    return this.get<Forecast[]>('/manager/forecasts');
  }

  /**
   * Create manager forecast
   */
  async createManagerForecast(data: Partial<Forecast>): Promise<Forecast> {
    return this.post<Forecast>('/manager/forecasts', data);
  }

  /**
   * Get manager equipment
   */
  async getManagerEquipment(): Promise<Equipment[]> {
    return this.get<Equipment[]>('/manager/equipment');
  }

  /**
   * Create manager equipment
   */
  async createManagerEquipment(data: Partial<Equipment>): Promise<Equipment> {
    return this.post<Equipment>('/manager/equipment', data);
  }

  /**
   * Get manager storage
   */
  async getManagerStorage(): Promise<StorageUnit[]> {
    return this.get<StorageUnit[]>('/manager/storage');
  }

  /**
   * Create manager storage
   */
  async createManagerStorage(data: Partial<StorageUnit>): Promise<StorageUnit> {
    return this.post<StorageUnit>('/manager/storage', data);
  }

  /**
   * Get manager attendance records
   */
  async getManagerAttendance(filters?: AttendanceFilters): Promise<AttendanceRecord[]> {
    return this.get<AttendanceRecord[]>('/manager/attendance', filters as any);
  }

  /**
   * Get manager attendance report for specific farm and date
   */
  async getManagerAttendanceReport(farmId: number, reportDate: string): Promise<AttendanceReport> {
    return this.get<AttendanceReport>(
      `/manager/attendance/report/${farmId}`,
      { report_date: reportDate }
    );
  }

  /**
   * Get manager performance metrics
   */
  async getManagerPerformance(filters?: PerformanceFilters): Promise<PerformanceMetrics[]> {
    return this.get<PerformanceMetrics[]>('/manager/performance', filters as any);
  }

  // ─── Farm Clerk: Climate Reports ──────────────────────────────────────────

  async getClimateReports(params?: Record<string, any>): Promise<any[]> {
    return this.get<any[]>('/farm-clerk/climate-reports', params);
  }

  async createClimateReport(data: Record<string, any>): Promise<any> {
    return this.post<any>('/farm-clerk/climate-reports', data);
  }

  async updateClimateReport(reportId: number, data: Record<string, any>): Promise<any> {
    return this.put<any>(`/farm-clerk/climate-reports/${reportId}`, data);
  }

  // ─── Farm Clerk: SMART Recommendations ────────────────────────────────────

  async getFarmClerkRecommendations(): Promise<any[]> {
    return this.get<any[]>('/farm-clerk/recommendations');
  }

  async getFarmClerkThresholds(): Promise<any> {
    return this.get<any>('/farm-clerk/thresholds');
  }

  // ─── Farm Clerk: Workers ──────────────────────────────────────────────────

  async getFarmClerkWorkers(): Promise<any[]> {
    return this.get<any[]>('/farm-clerk/workers');
  }

  async getFarmClerkWorker(workerId: number): Promise<any> {
    return this.get<any>(`/farm-clerk/workers/${workerId}`);
  }
}
