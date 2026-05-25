// Farms API service
import { BaseApiService } from './base';
import { Farm } from '../../types';

export class FarmsApiService extends BaseApiService {
  /**
   * Get farms based on user role
   */
  async getFarms(role?: string): Promise<Farm[]> {
    if (role === 'payroll') {
      return this.get<Farm[]>('/payroll/farms');
    } else if (role === 'stock') {
      return this.get<Farm[]>('/stock/farms');
    } else if (role === 'farm_clerk') {
      return this.get<Farm[]>('/farm-clerk/farms');
    } else if (role === 'supervisor') {
      return this.get<Farm[]>('/supervisor/farms');
    } else {
      return this.get<Farm[]>('/farms');
    }
  }

  /**
   * Get farms for manager
   */
  async getManagerFarms(): Promise<Farm[]> {
    return this.get<Farm[]>('/manager/farms');
  }

  /**
   * Get farm blocks
   */
  async getBlocksForFarm(farmId: number): Promise<any[]> {
    return this.get<any[]>(`/blocks/${farmId}`);
  }

  /**
   * Create block
   */
  async createBlock(data: any): Promise<any> {
    return this.post<any>('/blocks', data);
  }

  /**
   * Update block
   */
  async updateBlock(blockId: number, data: any): Promise<any> {
    return this.put<any>(`/blocks/${blockId}`, data);
  }

  /**
   * Delete block
   */
  async deleteBlock(blockId: number): Promise<any> {
    return this.delete<any>(`/blocks/${blockId}`);
  }

  /**
   * Get farm blocks summary
   */
  async getFarmBlocksSummary(farmId: number): Promise<any> {
    return this.get<any>(`/farms/${farmId}/blocks-summary`);
  }

  /**
   * Get farms overview
   */
  async getFarmsOverview(): Promise<Farm[]> {
    return this.get<Farm[]>('/farms/overview');
  }

  /**
   * Download blocks CSV template
   */
  async downloadBlocksCsvTemplate(): Promise<void> {
    return this.downloadFile('/blocks/csv-template', 'blocks_template.csv');
  }

  /**
   * Upload blocks via CSV
   */
  async uploadBlocksCsv(file: File): Promise<any> {
    return this.uploadFile<any>('/blocks/upload-csv', file, 'file');
  }

  // ── GPS location management — TEMPORARILY DISABLED ──────────────────────

  // async getFarmLocation(farmId: number): Promise<any> {
  //   return this.get<any>(`/farms/${farmId}/location`);
  // }

  // async setFarmLocation(farmId: number, data: { center_lat: number; center_lon: number; geofence_radius_m?: number; boundary_polygon?: number[][] | null }): Promise<any> {
  //   return this.patch<any>(`/farms/${farmId}/location`, data);
  // }

  // async getBlockLocation(blockId: number): Promise<any> {
  //   return this.get<any>(`/blocks/${blockId}/location`);
  // }

  // async setBlockLocation(
  //   blockId: number,
  //   data: {
  //     center_lat: number;
  //     center_lon: number;
  //     geofence_radius_m?: number;
  //     boundary_polygon?: number[][] | null;
  //   },
  // ): Promise<any> {
  //   return this.patch<any>(`/blocks/${blockId}/location`, data);
  // }
}

