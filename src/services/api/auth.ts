// Authentication API service
import { BaseApiService } from './base';
import { LoginCredentials, User } from '../../types';
import { STORAGE_KEYS } from '../../constants';

export interface LoginResponse {
  access_token: string;
  user_info: User;
}

export class AuthApiService extends BaseApiService {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    console.log('API login called with:', credentials);
    const result = await this.post<LoginResponse>('/login', credentials);
    console.log('Login API response:', result);
    
    if (result.access_token && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TOKEN, result.access_token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user_info));
      // Set cookie for Next.js middleware
      document.cookie = `token=${result.access_token}; path=/; max-age=86400; SameSite=Lax`;
      this.setLoggedIn(true);
    }
    
    return result;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    // Get token before clearing session
    const token = typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEYS.TOKEN)
      : null;

    // Clear local session first - this is the important part
    this.clearSession();

    // Optionally notify server (fire and forget - don't wait or throw)
    if (token) {
      fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(() => {
        // Silently ignore - server logout is optional
      });
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
    return null;
  }
}
