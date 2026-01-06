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
        // Short timeout: if API is unreachable, fallback to local storage
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 2000);
        });
        const response = await Promise.race([
          (client as any).provider.getMyPledges({ userId }),
          timeoutPromise,
        ]);
        return response as Pledge[];
      } catch (error: any) {
        // Demo mode fallback - check both sessionStorage and localStorage for created pledges
        const normalizeId = (id?: string | null) => (id ? String(id).replace('#', '').trim() : '');
        const normalizedUserId = normalizeId(userId);
        try {
          const fromSession = (() => {
            try {
              const s = sessionStorage.getItem('demo_pledges');
              return s ? JSON.parse(s) : [];
            } catch { return []; }
          })();
          const fromLocal = (() => {
            try {
              const l = localStorage.getItem('demo_pledges');
              return l ? JSON.parse(l) : [];
            } catch { return []; }
          })();
          // Merge and de-duplicate by pledge id
          const map = new Map<string, Pledge>();
          [...fromSession, ...fromLocal].forEach((p: Pledge) => map.set(p.id, p));
          const pledges = Array.from(map.values());
          const userPledges = pledges.filter((p: Pledge) => {
            const pid = normalizeId(p.patientId);
            return pid === normalizedUserId || pid === '83921';
          });
          if (userPledges.length > 0) {
            console.log('[UserService] ✅ Returning demo pledges from storage:', userPledges.length);
            return userPledges;
          }
        } catch (e) {
          console.warn('[UserService] Failed to parse stored pledges:', e);
        }
        // Return empty array if no stored pledges
        return [];
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
        // Demo mode fallback - update pledge in sessionStorage and localStorage
        console.log('[UserService] Using demo acceptPledge for pledge:', pledgeId);
        try {
          const read = (): Pledge[] => {
            const s = (() => { try { const v = sessionStorage.getItem('demo_pledges'); return v ? JSON.parse(v) : []; } catch { return []; } })();
            const l = (() => { try { const v = localStorage.getItem('demo_pledges'); return v ? JSON.parse(v) : []; } catch { return []; } })();
            const map = new Map<string, Pledge>();
            [...s, ...l].forEach((p: Pledge) => map.set(p.id, p));
            return Array.from(map.values());
          };
          const pledges = read();
          const index = pledges.findIndex((p: Pledge) => p.id === pledgeId);
          if (index !== -1) {
            const pledge = pledges[index];
            const now = new Date();
            const endDate = new Date(now);
            endDate.setDate(endDate.getDate() + (pledge.totalDays || 7));
            const updated: Pledge = {
              ...pledge,
              accepted: true,
              acceptedAt: now.toISOString(),
              startDate: now.toISOString(),
              endDate: endDate.toISOString(),
              status: 'active',
            };
            pledges[index] = updated;
            // Write back to both storages
            try { sessionStorage.setItem('demo_pledges', JSON.stringify(pledges)); } catch {}
            try { localStorage.setItem('demo_pledges', JSON.stringify(pledges)); } catch {}
            // Notify same-tab listeners
            try { window.dispatchEvent(new Event('demo_pledges_updated')); } catch {}
            console.log('[UserService] ✅ Updated pledge in storage');
            return updated;
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

