/**
 * Authentication utilities
 */

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_email_verified: boolean;
  profile_picture_url?: string;
  phone?: string;
  timezone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const;

export const authStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  setAccessToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setRefreshToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser: (user: User): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  setTokens: (tokens: AuthTokens): void => {
    authStorage.setAccessToken(tokens.accessToken);
    authStorage.setRefreshToken(tokens.refreshToken);
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
};

