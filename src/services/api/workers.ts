// Workers API service
import { BaseApiService } from './base';
import { Worker } from '../../types';

export class WorkersApiService extends BaseApiService {
  /**
   * Get all workers
   */
  async getWorkers(): Promise<Worker[]> {
    return this.get<Worker[]>('/workers');
  }

  /**
   * Get manager workers
   */
  async getManagerWorkers(): Promise<Worker[]> {
    return this.get<Worker[]>('/manager/workers');
  }

  /**
   * Get supervisor workers
   * Note: Using /workers endpoint as /supervisor/workers only accepts POST
   */
  async getSupervisorWorkers(): Promise<Worker[]> {
    return this.get<Worker[]>('/workers');
  }

  /**
   * Create worker
   */
  async createWorker(data: Partial<Worker>): Promise<Worker> {
    return this.post<Worker>('/workers', data);
  }

  /**
   * Create supervisor worker
   */
  async createSupervisorWorker(data: Partial<Worker>): Promise<Worker> {
    return this.post<Worker>('/supervisor/workers', data);
  }

  /**
   * Update worker
   */
  async updateWorker(workerId: number, data: Partial<Worker>): Promise<Worker> {
    return this.put<Worker>(`/workers/${workerId}`, data);
  }

  /**
   * Delete worker
   */
  async deleteWorker(workerId: number): Promise<void> {
    return this.delete<void>(`/workers/${workerId}`);
  }

  /**
   * Assign task to worker
   */
  async assignTaskToWorker(workerId: number, taskData: any): Promise<any> {
    return this.post<any>(`/supervisor/workers/${workerId}/assign-task`, taskData);
  }

  /**
   * Start worker task
   */
  async startWorkerTask(workerId: number, taskId: string | number): Promise<any> {
    const taskIdStr = typeof taskId === 'string' ? taskId : taskId.toString();
    return this.post<any>(`/workers/${workerId}/start-task/${taskIdStr}`);
  }

  /**
   * Complete worker task
   */
  async completeWorkerTask(workerId: number, taskAssignmentId: number, completionData: any): Promise<any> {
    return this.post<any>(`/supervisor/workers/${workerId}/complete-task/${taskAssignmentId}`, completionData);
  }

  /**
   * Get worker stats
   */
  async getWorkerStats(workerId: number): Promise<any> {
    return this.get<any>(`/calculations/worker/stats/${workerId}`);
  }
}
