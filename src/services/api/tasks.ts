// Tasks API service
import { BaseApiService } from './base';
import { TaskAssignment } from '../../types';

export class TasksApiService extends BaseApiService {
  /**
   * Get task codes
   */
  async getTaskCodes(): Promise<any[]> {
    return this.get<any[]>('/task-codes');
  }

  /**
   * Get task codes from data
   */
  async getTaskCodesFromData(): Promise<any[]> {
    return this.get<any[]>('/task-codes-data');
  }

  /**
   * Initialize task codes
   */
  async initializeTaskCodes(): Promise<any> {
    return this.post<any>('/initialize-task-codes');
  }

  /**
   * Get manager task assignments
   */
  async getManagerTaskAssignments(): Promise<TaskAssignment[]> {
    return this.get<TaskAssignment[]>('/manager/task-assignments');
  }

  /**
   * Get manager completed tasks
   */
  async getManagerCompletedTasks(): Promise<TaskAssignment[]> {
    return this.get<TaskAssignment[]>('/manager/tasks-completed');
  }

  async createTaskCode(data: Record<string, any>): Promise<any> {
    return this.post<any>('/admin/task-codes', data);
  }

  /**
   * Get all supervisor task assignments — GET /supervisor/task-assignments/{id}
   */
  async getSupervisorTaskAssignment(taskId: number): Promise<TaskAssignment> {
    return this.get<TaskAssignment>(`/supervisor/task-assignments/${taskId}`);
  }
}
