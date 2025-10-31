/**
 * API Client Utilities
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('accessToken') 
      : null;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      const data = await response.json();

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

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
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

