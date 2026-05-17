import { api } from '@/lib/api/client';
import { authUtils, type TokenPair } from '@/lib/utils/auth';

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const authService = {
  async signup(credentials: SignupCredentials): Promise<void> {
    const response = await api.post<AuthResponse>('/api/v1/auth/signup', credentials);
    authUtils.setTokens({
      access_token: response.access_token,
      refresh_token: response.refresh_token,
    });
  },

  async login(credentials: LoginCredentials): Promise<void> {
    const response = await api.post<AuthResponse>('/api/v1/auth/login', credentials);
    authUtils.setTokens({
      access_token: response.access_token,
      refresh_token: response.refresh_token,
    });
  },

  async logout(): Promise<void> {
    const refreshToken = authUtils.getRefreshToken();
    if (refreshToken) {
      try {
        await api.post('/api/v1/auth/logout', { refresh_token: refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    authUtils.clearTokens();
  },

  async refreshToken(): Promise<void> {
    const refreshToken = authUtils.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<AuthResponse>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });

    authUtils.setTokens({
      access_token: response.access_token,
      refresh_token: response.refresh_token,
    });
  },
};
