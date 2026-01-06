import { BaseService } from './baseService';
import { client } from '@/utils/orpc';
import { UserRole } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
  };
  sessionId: string;
}

export class AuthService extends BaseService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.handleRequest(async () => {
      // Use client directly - orpc client methods are callable directly
      const response = await (client as any).auth.login(credentials);
      return response as AuthResponse;
    });
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    return this.handleRequest(async () => {
      // Use client directly - orpc client methods are callable directly
      const response = await (client as any).auth.register(data);
      return response as AuthResponse;
    });
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    return this.handleRequest(async () => {
      await (client as any).auth.logout();
    });
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthResponse['user']> {
    return this.handleRequest(async () => {
      const response = await (client as any).auth.me();
      return response as AuthResponse['user'];
    });
  }

  /**
   * Refresh session
   */
  async refreshSession(): Promise<AuthResponse> {
    return this.handleRequest(async () => {
      const response = await (client as any).auth.refresh();
      return response as AuthResponse;
    });
  }
}

export const authService = new AuthService();

