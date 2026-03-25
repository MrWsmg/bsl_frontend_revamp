// Users API service
import { BaseApiService } from './base';
import { User, UserFormData } from '../../types';

export class UsersApiService extends BaseApiService {
  /**
   * Get all users
   */
  async getUsers(): Promise<User[]> {
    return this.get<User[]>('/admin/users');
  }

  /**
   * Get manager users
   */
  async getManagerUsers(): Promise<User[]> {
    return this.get<User[]>('/manager/users');
  }

  /**
   * Get supervisors — tries farm-clerk endpoint first, falls back to manager
   */
  async getSupervisors(): Promise<User[]> {
    try {
      return await this.get<User[]>('/farm-clerk/supervisors');
    } catch {
      return this.get<User[]>('/manager/users');
    }
  }

  /**
   * Create user
   */
  async createUser(userData: UserFormData): Promise<User> {
    return this.post<User>('/admin/users', userData);
  }

  /**
   * Update user
   */
  async updateUser(userId: number, userData: Partial<UserFormData>): Promise<User> {
    return this.put<User>(`/admin/users/${userId}`, userData);
  }

  /**
   * Delete user
   */
  async deleteUser(userId: number): Promise<void> {
    return this.delete<void>(`/admin/users/${userId}`);
  }
}
