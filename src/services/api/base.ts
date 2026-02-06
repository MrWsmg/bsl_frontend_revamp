// Base API service with common functionality
import { API_BASE_URL, STORAGE_KEYS } from '../../constants';
import { ApiResponse } from '../../types';

export interface RequestOptions extends RequestInit {
  retryCount?: number;
}

export class BaseApiService {
  protected baseUrl: string;
  private isLoggedIn: boolean = false;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.checkSession();
  }

  /**
   * Check if user is logged in
   */
  async checkSession(): Promise<void> {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      this.isLoggedIn = !!token;
    }
  }

  /**
   * Set login status
   */
  setLoggedIn(loggedIn: boolean): void {
    this.isLoggedIn = loggedIn;
  }

  /**
   * Clear session data
   */
  clearSession(): void {
    this.isLoggedIn = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      // Clear cookie for Next.js middleware
      document.cookie = 'token=; path=/; max-age=0';
    }
  }

  /**
   * Get base URL
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get authentication headers
   */
  protected getAuthHeaders(): Record<string, string> {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
    return {};
  }

  /**
   * Make HTTP request with error handling and retry logic
   */
  protected async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { retryCount = 0, headers: customHeaders, body, ...requestOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;

    const headers = new Headers(this.getAuthHeaders());
    if (customHeaders) {
      const extraHeaders = new Headers(customHeaders as HeadersInit);
      extraHeaders.forEach((value, key) => headers.set(key, value));
    }

    const isFormData = body instanceof FormData;
    let requestBody: BodyInit | null | undefined = body;

    if (isFormData) {
      requestBody = body;
      headers.delete('Content-Type');
    } else if (body instanceof Blob) {
      requestBody = body;
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', body.type || 'application/octet-stream');
      }
    } else if (typeof body === 'string') {
      requestBody = body;
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    } else if (body !== undefined) {
      requestBody = JSON.stringify(body);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }
    
    const config: RequestInit = {
      ...requestOptions,
      headers,
      body: requestBody,
    };

    try {
      const response = await fetch(url, config);

      // Handle authentication errors
      if (response.status === 401) {
        // Try to get the actual error message from the response
        let errorMessage = 'Invalid credentials';
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Response body might not be JSON
        }

        // Only clear session and dispatch auth-error for non-login endpoints
        // Login endpoint failures should just show the error, not trigger session clear
        const isLoginEndpoint = endpoint === '/login';
        if (!isLoginEndpoint && typeof window !== 'undefined') {
          this.clearSession();
          window.dispatchEvent(new CustomEvent('auth-error', {
            detail: { message: 'Session expired. Please log in again.' }
          }));
        }

        throw new Error(errorMessage);
      }

      if (!response.ok) {
        // Try to get error details from response body
        let errorMessage = `API Error: ${response.status}`;
        let errorData: any = null;
        try {
          errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
          // Only log if there are actual error details
          if (errorData && Object.keys(errorData).length > 0) {
            console.error('API Error Details:', errorData);
          }
        } catch (e) {
          // Response body might not be JSON
          console.warn('Failed to parse error response as JSON');
        }

        // Retry once for server errors
        if (retryCount === 0 && response.status >= 500) {
          console.warn(`Retrying request to ${endpoint} due to server error`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.request(endpoint, { ...options, retryCount: retryCount + 1 });
        }
        
        // Create error with response data attached
        const error: any = new Error(errorMessage);
        error.response = { status: response.status, data: errorData };
        throw error;
      }

      return response.json();
    } catch (error) {
      // Retry once for network errors
      if (retryCount === 0 && error instanceof TypeError) {
        console.warn(`Retrying request to ${endpoint} due to network error`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.request(endpoint, { ...options, retryCount: retryCount + 1 });
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  protected async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  protected async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * PUT request
   */
  protected async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  /**
   * DELETE request
   */
  protected async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload file
   */
  public async uploadFile<T>(
    endpoint: string, 
    file: File, 
    fieldName: string = 'file'
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Download file
   */
  protected async downloadFile(
    endpoint: string, 
    filename: string, 
    params?: Record<string, any>
  ): Promise<void> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const url = queryString ? `${this.baseUrl}${endpoint}?${queryString}` : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(link);
  }
}
