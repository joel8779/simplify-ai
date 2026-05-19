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

export interface SignupResponse {
  email: string;
  verification_required: boolean;
  expires_in_seconds: number;
  resend_after_seconds: number;
}

export interface PasswordResetResponse {
  email: string;
  expires_in_seconds: number;
  resend_after_seconds: number;
}

export const authService = {
  async signup(credentials: SignupCredentials): Promise<SignupResponse> {
    return api.post<SignupResponse>('/api/v1/auth/signup', {
      full_name: credentials.name,
      email: credentials.email,
      password: credentials.password,
    });
  },

  async login(credentials: LoginCredentials): Promise<void> {
    const response = await api.post<AuthResponse>('/api/v1/auth/login', credentials);
    authUtils.setTokens({
      access_token: response.access_token,
      refresh_token: response.refresh_token,
    });
  },

  async logout(options: { allDevices?: boolean } = {}): Promise<void> {
    const refreshToken = authUtils.getRefreshToken();
    try {
      await api.post('/api/v1/auth/logout', {
        refresh_token: refreshToken,
        all_devices: options.allDevices === true,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    authUtils.clearSessionState();
  },

  async verifyOtp(credentials: { email: string; otp: string }): Promise<void> {
    const response = await api.post<AuthResponse>('/api/v1/auth/verify-otp', credentials);
    authUtils.setTokens({
      access_token: response.access_token,
      refresh_token: response.refresh_token,
    });
  },

  async resendOtp(email: string): Promise<SignupResponse> {
    return api.post<SignupResponse>('/api/v1/auth/resend-otp', { email });
  },

  async forgotPassword(email: string): Promise<PasswordResetResponse> {
    return api.post<PasswordResetResponse>('/api/v1/auth/forgot-password', { email });
  },

  async resetPassword(credentials: {
    email: string;
    otp: string;
    new_password: string;
  }): Promise<void> {
    await api.post('/api/v1/auth/reset-password', credentials);
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
