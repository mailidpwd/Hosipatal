import { BaseService } from './baseService';
import { client } from '@/utils/orpc';

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'weight' | 'activity' | 'hydration' | 'sleep' | 'bp' | 'other';
  target: string;
  current: string;
  reward: number;
  status: 'active' | 'completed' | 'expired' | 'pending';
  assignedBy?: string;
  assignedByRole?: 'doctor' | 'self';
  startDate: string;
  endDate?: string;
  completedDate?: string;
  progress?: number;
  createdAt: Date;
}

export interface PendingReward {
  id: string;
  goalId: string;
  goalTitle: string;
  reward: number;
  status: 'locked' | 'pending_verification' | 'ready_to_claim';
  unlockCondition: string;
  expiresAt?: string;
  daysRemaining?: number;
}

export class GoalsService extends BaseService {
  async getGoals(filters?: { status?: 'active' | 'completed' | 'expired' | 'pending' }): Promise<Goal[]> {
    return this.handleRequest(async () => {
      const response = await (client as any).goals.list(filters || {});
      return (response as any[]).map(goal => ({
        ...goal,
        createdAt: new Date(goal.createdAt || Date.now()),
        completedDate: goal.completedDate ? new Date(goal.completedDate) : undefined,
      })) as Goal[];
    });
  }

  async getHistory(limit?: number, offset?: number): Promise<Goal[]> {
    return this.handleRequest(async () => {
      const response = await (client as any).goals.getHistory({ limit, offset });
      return (response as any[]).map(goal => ({
        ...goal,
        createdAt: new Date(goal.createdAt || Date.now()),
        completedDate: goal.completedDate ? new Date(goal.completedDate) : undefined,
      })) as Goal[];
    });
  }

  async getPendingRewards(): Promise<PendingReward[]> {
    return this.handleRequest(async () => {
      const response = await (client as any).goals.getPendingRewards({});
      return response as PendingReward[];
    });
  }

  async createGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> {
    return this.handleRequest(async () => {
      const response = await (client as any).goals.create(goal);
      return {
        ...response,
        createdAt: new Date(response.createdAt || Date.now()),
      } as Goal;
    });
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    return this.handleRequest(async () => {
      const response = await (client as any).goals.update({ id, ...updates });
      return {
        ...response,
        createdAt: new Date(response.createdAt || Date.now()),
      } as Goal;
    });
  }

  async completeGoal(id: string): Promise<void> {
    return this.handleRequest(async () => {
      await (client as any).goals.complete({ id });
    });
  }
}

export const goalsService = new GoalsService();

