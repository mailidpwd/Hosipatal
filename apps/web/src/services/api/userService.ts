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
      try {
        const response = await (client as any).provider.getMyPledges({ userId });
        return response as Pledge[];
      } catch (error: any) {
        // Demo mode fallback - check sessionStorage for created pledges
        if (userId === '83921' || userId?.includes('83921')) {
          console.log('[UserService] Using demo pledges data for Michael Chen');
          try {
            const storedPledges = sessionStorage.getItem('demo_pledges');
            if (storedPledges) {
              const pledges = JSON.parse(storedPledges);
              // Filter pledges for this user
              const userPledges = pledges.filter((p: Pledge) => 
                p.patientId === userId || p.patientId === '83921' || p.patientId?.includes('83921')
              );
              if (userPledges.length > 0) {
                return userPledges;
              }
            }
          } catch (e) {
            console.warn('[UserService] Failed to parse stored pledges:', e);
          }
          // Return empty array if no stored pledges
          return [];
        }
        throw error; // Re-throw if not demo patient
      }
    });
  }

  /**
   * Accept a pledge
   */
  async acceptPledge(pledgeId: string): Promise<Pledge> {
    return this.handleRequest(async () => {
      try {
        const response = await (client as any).provider.acceptPledge({ pledgeId });
        return response as Pledge;
      } catch (error: any) {
        // Demo mode fallback - update pledge in sessionStorage
        console.log('[UserService] Using demo acceptPledge for pledge:', pledgeId);
        try {
          const storedPledges = sessionStorage.getItem('demo_pledges');
          if (storedPledges) {
            const pledges = JSON.parse(storedPledges);
            const pledgeIndex = pledges.findIndex((p: Pledge) => p.id === pledgeId);
            if (pledgeIndex !== -1) {
              const pledge = pledges[pledgeIndex];
              const now = new Date();
              const endDate = new Date(now);
              endDate.setDate(endDate.getDate() + (pledge.totalDays || 7));
              
              const updatedPledge: Pledge = {
                ...pledge,
                accepted: true,
                acceptedAt: now.toISOString(),
                startDate: now.toISOString(),
                endDate: endDate.toISOString(),
                status: 'active',
              };
              
              pledges[pledgeIndex] = updatedPledge;
              sessionStorage.setItem('demo_pledges', JSON.stringify(pledges));
              console.log('[UserService] ✅ Updated pledge in sessionStorage');
              return updatedPledge;
            }
          }
        } catch (e) {
          console.warn('[UserService] Failed to update stored pledge:', e);
        }
        throw error; // Re-throw if not found
      }
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

