import { apiClient } from './client';
import { AuthResponse, User } from '../types';

export interface SignupInput {
  email: string;
  full_name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  signup: async (data: SignupInput): Promise<AuthResponse> => {
    return apiClient<AuthResponse>('auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (data: LoginInput): Promise<AuthResponse> => {
    return apiClient<AuthResponse>('auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMe: async (): Promise<User> => {
    return apiClient<User>('auth/me', {
      method: 'GET',
    });
  },

  logout: async (): Promise<{ message: string }> => {
    return apiClient<{ message: string }>('auth/logout', {
      method: 'POST',
    });
  },
};
