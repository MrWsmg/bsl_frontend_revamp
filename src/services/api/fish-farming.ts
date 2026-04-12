// Fish Farming API service
import { BaseApiService } from './base';
import {
  FishReservoir,
  FishWaterParameter,
  FishFeedingRecord,
  FishWeightRecord,
  FishAlarmLog,
} from '../../types';

export class FishFarmingApiService extends BaseApiService {
  async getFishReservoirs(params?: {
    farm_id?: number;
    status?: string;
  }): Promise<FishReservoir[]> {
    return this.get<FishReservoir[]>('/fish-farming/reservoirs', params);
  }

  async createReservoir(data: Omit<FishReservoir, 'id'>): Promise<FishReservoir> {
    return this.post<FishReservoir>('/fish-farming/reservoirs', data);
  }

  async updateReservoir(id: number, data: Partial<Omit<FishReservoir, 'id'>>): Promise<FishReservoir> {
    return this.put<FishReservoir>(`/fish-farming/reservoirs/${id}`, data);
  }

  async getFishReservoirDashboard(reservoirId: number): Promise<any> {
    return this.get<any>(`/fish-farming/reservoirs/${reservoirId}/dashboard`);
  }

  async getWaterParameters(params?: {
    reservoir_id?: number;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<FishWaterParameter[]> {
    return this.get<FishWaterParameter[]>('/fish-farming/water-parameters', params);
  }

  async createWaterParameter(data: Omit<FishWaterParameter, 'id'>): Promise<FishWaterParameter> {
    return this.post<FishWaterParameter>('/fish-farming/water-parameters', data);
  }

  async getFeedingRecords(params?: {
    reservoir_id?: number;
    session?: string;
    start_date?: string;
    limit?: number;
  }): Promise<FishFeedingRecord[]> {
    return this.get<FishFeedingRecord[]>('/fish-farming/feeding', params);
  }

  async createFeedingRecord(data: Omit<FishFeedingRecord, 'id'>): Promise<FishFeedingRecord> {
    return this.post<FishFeedingRecord>('/fish-farming/feeding', data);
  }

  async getDailyFeedingSummary(params: {
    reservoir_id: number;
    date: string;
  }): Promise<any> {
    return this.get<any>('/fish-farming/feeding/daily-summary', params);
  }

  async getWeightRecords(params?: {
    reservoir_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<FishWeightRecord[]> {
    return this.get<FishWeightRecord[]>('/fish-farming/weight', params);
  }

  async createWeightRecord(data: Omit<FishWeightRecord, 'id'>): Promise<FishWeightRecord> {
    return this.post<FishWeightRecord>('/fish-farming/weight', data);
  }

  async getAlarmLogs(params?: {
    reservoir_id?: number;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<FishAlarmLog[]> {
    return this.get<FishAlarmLog[]>('/fish-farming/alarm-logs', params);
  }

  async createAlarmLog(data: Omit<FishAlarmLog, 'id'>): Promise<FishAlarmLog> {
    return this.post<FishAlarmLog>('/fish-farming/alarm-logs', data);
  }
}
