import { apiClient } from './client';
import type { User } from '../store/useAuthStore';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    // OAuth2PasswordRequestForm expects form-urlencoded
    const response = await apiClient.post<LoginResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (userData: Record<string, string>): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', userData);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
