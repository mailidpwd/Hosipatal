import { BaseService } from './baseService';
import { client } from '@/utils/orpc';
import type { UserProfile } from '@/context/DataContext';
import type { Pledge } from './providerService';

export class UserService extends BaseService {
  /**
   * Get user profile
   */
  async getProfile(userId?: string): Promise<UserProfile> {
    return this.handleRequest(async () => {
      const response = await (client as any).user.getProfile({ userId });
      return response as UserProfile;
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    return this.handleRequest(async () => {
      const response = await (client as any).user.updateProfile(updates);
      return response as UserProfile;
    });
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    return this.handleRequest(async () => {
      // Convert file to base64 or FormData
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await (client as any).user.uploadAvatar(formData);
      return response as { avatarUrl: string };
    });
  }

  /**
   * Get active pledges for current patient
   */
  async getMyPledges(userId?: string): Promise<Pledge[]> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.getMyPledges({ userId });
      return response as Pledge[];
    });
  }

  /**
   * Accept a pledge
   */
  async acceptPledge(pledgeId: string): Promise<Pledge> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.acceptPledge({ pledgeId });
      return response as Pledge;
    });
  }

  /**
   * Send a tip/wish to provider
   */
  async sendTip(patientId: string, amount: number, options?: {
    message?: string;
    type?: 'tip' | 'rating';
    rating?: number;
  }): Promise<{ id: string; patientId: string; amount: number; message?: string; timestamp: string }> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.sendTip({
        patientId,
        amount,
        message: options?.message,
        type: options?.type || 'tip',
        rating: options?.rating,
      });
      return response;
    });
  }

  /**
   * Get tips/wishes sent by current patient
   */
  async getMySentTips(patientId?: string): Promise<Array<{
    id: string;
    patientId: string;
    patientName: string;
    amount: number;
    message?: string;
    timestamp: string;
    type?: string;
    rating?: number;
  }>> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.getMySentTips({ patientId });
      return response || [];
    });
  }
}

export const userService = new UserService();

