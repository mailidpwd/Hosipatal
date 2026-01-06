import { BaseService } from './baseService';
import { client } from '@/utils/orpc';

export interface WalletTransaction {
  id: string;
  desc: string;
  amount: number;
  date: string;
  type: 'earned' | 'spent' | 'reward';
}

export interface WalletBalance {
  balance: number;
  weeklyEarnings: number;
  totalEarnings: number;
  history: WalletTransaction[];
}

export class WalletService extends BaseService {
  /**
   * Get wallet balance and history
   */
  async getBalance(userId?: string): Promise<WalletBalance> {
    return this.handleRequest(async () => {
      // Short timeout with demo fallback
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 1200);
      });

      try {
        const response = await Promise.race([
          (client as any).wallet.getBalance({ userId }),
          timeoutPromise,
        ]);
        return response as WalletBalance;
      } catch {
        // Demo fallback
        return {
          balance: 12500,
          weeklyEarnings: 350,
          totalEarnings: 45200,
          history: [
            { id: `tx-${Date.now() - 300000}`, desc: 'Pledge bonus', amount: 500, date: new Date().toISOString(), type: 'earned' },
            { id: `tx-${Date.now() - 600000}`, desc: 'Medication adherence', amount: 50, date: new Date().toISOString(), type: 'earned' },
          ],
        };
      }
    });
  }

  /**
   * Get transaction history
   */
  async getHistory(filters?: {
    limit?: number;
    offset?: number;
    type?: 'earned' | 'spent' | 'reward';
  }): Promise<WalletTransaction[]> {
    return this.handleRequest(async () => {
      const response = await (client as any).wallet.getHistory(filters || {});
      return response as WalletTransaction[];
    });
  }

  /**
   * Get earnings summary
   */
  async getEarnings(period?: 'daily' | 'weekly' | 'monthly'): Promise<{
    period: string;
    earnings: number;
    breakdown: Array<{ source: string; amount: number }>;
  }> {
    return this.handleRequest(async () => {
      const response = await (client as any).wallet.getEarnings({ period });
      return response as any;
    });
  }

  /**
   * Redeem reward (spend tokens)
   */
  async redeemReward(rewardId: string, amount: number): Promise<WalletTransaction> {
    return this.handleRequest(async () => {
      const response = await (client as any).wallet.redeem({ rewardId, amount });
      return response as WalletTransaction;
    });
  }
}

export const walletService = new WalletService();

