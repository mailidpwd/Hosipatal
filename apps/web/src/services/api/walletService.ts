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
      const response = await (client as any).wallet.getBalance({ userId });
      return response as WalletBalance;
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

