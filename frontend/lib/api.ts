/**
 * API Client Utilities
 */

import { authStorage } from './auth';
import { apiCache } from './cache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

class ApiClient {
  private baseURL: string;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Attempt to refresh the access token
   */
  private async refreshAccessToken(): Promise<string | null> {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = authStorage.getRefreshToken();
        if (!refreshToken) {
          return null;
        }

        const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
          credentials: 'include',
        }).catch((fetchError) => {
          console.error('Network error during token refresh:', fetchError);
          throw new Error(
            `Unable to connect to the server. Please make sure the backend is running at ${this.baseURL}.`
          );
        });

        const data = await response.json();

        if (response.ok && data.success && data.data?.accessToken) {
          authStorage.setAccessToken(data.data.accessToken);
          return data.data.accessToken;
        } else {
          // Refresh failed, clear tokens and cache
          authStorage.clear();
          apiCache.clear();
          // Redirect to login if we're in the browser and not already on login page
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
            window.location.href = '/auth/login';
          }
          return null;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        authStorage.clear();
        apiCache.clear();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOn401: boolean = true
  ): Promise<ApiResponse<T>> {
    const token = authStorage.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Don't throw error, let the backend handle authentication
      console.warn('No access token found for request to:', endpoint);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      }).catch((fetchError) => {
        // Handle network errors (backend not reachable, CORS, etc.)
        console.error('Network error:', fetchError);
        throw new Error(
          `Unable to connect to the server. Please make sure the backend is running at ${this.baseURL}. ` +
          `Original error: ${fetchError.message || 'Failed to fetch'}`
        );
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        // If response is not JSON, return error
        throw new Error(`Invalid response format: ${response.statusText}`);
      }

      // Handle 401 Unauthorized - token expired
      if (response.status === 401 && retryOn401 && endpoint !== '/auth/refresh-token') {
        // Only try to refresh if we have a refresh token
        const refreshToken = authStorage.getRefreshToken();
        if (!refreshToken) {
          // No refresh token, clear everything and redirect
          authStorage.clear();
          apiCache.clear();
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
            window.location.href = '/auth/login';
          }
          throw new Error('Session expired. Please login again.');
        }

        // Try to refresh the token
        const newToken = await this.refreshAccessToken();
        
        if (newToken) {
          // Retry the request with the new token
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include',
          }).catch((fetchError) => {
            console.error('Network error on retry:', fetchError);
            throw new Error(
              `Unable to connect to the server. Please make sure the backend is running at ${this.baseURL}. ` +
              `Original error: ${fetchError.message || 'Failed to fetch'}`
            );
          });

          const retryData = await retryResponse.json();

          if (!retryResponse.ok) {
            throw new Error(retryData.message || 'Request failed after token refresh');
          }

          return retryData;
        } else {
          // Refresh failed, user will be redirected to login
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async get<T>(endpoint: string, useCache: boolean = true, ttl: number = 5 * 60 * 1000): Promise<ApiResponse<T>> {
    // Check cache first for GET requests
    if (useCache) {
      const cacheKey = apiCache.generateKey(endpoint);
      const cached = apiCache.get<T>(cacheKey);
      if (cached !== null) {
        return { success: true, data: cached };
      }
    }

    const response = await this.request<T>(endpoint, { method: 'GET' });
    
    // Cache successful responses
    if (useCache && response.success && response.data) {
      const cacheKey = apiCache.generateKey(endpoint);
      apiCache.set(cacheKey, response.data, ttl);
    }

    return response;
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Default export for backward compatibility
export default apiClient;

// Auth API endpoints
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => apiClient.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),

  getProfile: () => apiClient.get('/auth/me'),

  verifyEmail: (token: string) =>
    apiClient.post('/auth/verify-email', { token }),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),

  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh-token', { refreshToken }),
};

// User API endpoints
export const userApi = {
  updateProfile: (data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    timezone?: string;
  }) => apiClient.put('/user/profile', data),

  getPreferences: () => apiClient.get('/user/preferences'),

  updatePreferences: (data: {
    notification_email?: boolean;
    notification_push?: boolean;
    notification_sms?: boolean;
    email_digest_frequency?: 'daily' | 'weekly' | 'monthly' | 'never';
    preferred_language?: string;
    theme?: string;
  }) => apiClient.put('/user/preferences', data),
};

