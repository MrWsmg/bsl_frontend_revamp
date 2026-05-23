// Base API service with common functionality
import { API_BASE_URL, STORAGE_KEYS } from '../../constants';
import { ApiResponse } from '../../types';

// FastAPI `detail` can be a string or an array of validation error objects.
function extractDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e: any) => (typeof e?.msg === 'string' ? e.msg : JSON.stringify(e)))
      .join('; ');
  }
  return JSON.stringify(detail);
}

export interface RequestOptions extends RequestInit {
  retryCount?: number;
  timeoutMs?: number;
}

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30_000; // 30 s — tolerant of slow connections

function retryDelay(attempt: number): Promise<void> {
  // exponential backoff: 1 s, 2 s, 4 s
  return new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
}

function isRetryable(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
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
   * Make HTTP request with timeout, retry, and exponential backoff.
   * Tolerant of bad / intermittent connections.
   */
  protected async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { retryCount = 0, timeoutMs = REQUEST_TIMEOUT_MS, headers: customHeaders, body, ...requestOptions } = options;
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

    // Abort the request if it takes longer than timeoutMs
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const config: RequestInit = {
      ...requestOptions,
      headers,
      body: requestBody,
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timer);

      // Handle authentication errors
      if (response.status === 401) {
        let errorMessage = 'Invalid credentials';
        try {
          const errorData = await response.json();
          if (errorData.detail) errorMessage = extractDetail(errorData.detail);
          else if (errorData.message) errorMessage = errorData.message;
        } catch { /* non-JSON body */ }

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
        let errorMessage = `API Error: ${response.status}`;
        let errorData: any = null;
        try {
          errorData = await response.json();
          if (errorData.detail) errorMessage = extractDetail(errorData.detail);
          else if (errorData.message) errorMessage = errorData.message;
          else if (typeof errorData === 'string') errorMessage = errorData;
        } catch { console.warn('Failed to parse error response as JSON'); }

        // Retry on server/gateway errors
        if (retryCount < MAX_RETRIES && (response.status >= 500 || isRetryable(response.status))) {
          console.warn(`Retry ${retryCount + 1}/${MAX_RETRIES} for ${endpoint} (HTTP ${response.status})`);
          await retryDelay(retryCount);
          return this.request(endpoint, { ...options, retryCount: retryCount + 1 });
        }

        const error: any = new Error(errorMessage);
        error.response = { status: response.status, data: errorData };
        throw error;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timer);

      // Retry on network errors (TypeError) and timeouts (AbortError)
      const isNetworkError = error instanceof TypeError;
      const isTimeout = error instanceof DOMException && error.name === 'AbortError';

      if (retryCount < MAX_RETRIES && (isNetworkError || isTimeout)) {
        const reason = isTimeout ? `timeout after ${timeoutMs}ms` : 'network error';
        console.warn(`Retry ${retryCount + 1}/${MAX_RETRIES} for ${endpoint} (${reason})`);
        await retryDelay(retryCount);
        return this.request(endpoint, { ...options, retryCount: retryCount + 1 });
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Request timed out. Check your connection and try again.');
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  protected async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let queryString = '';
    if (params) {
      const clean: Record<string, string> = {};
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          clean[k] = String(v);
        }
      }
      queryString = new URLSearchParams(clean).toString();
    }
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
   * PATCH request
   */
  protected async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
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
