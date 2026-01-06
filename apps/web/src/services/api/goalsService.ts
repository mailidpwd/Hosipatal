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
  private getDemoGoals(): Goal[] {
    // Get demo goals from localStorage
    const storedGoals = localStorage.getItem('demo_goals');
    const customGoals: Goal[] = storedGoals ? JSON.parse(storedGoals) : [];
    
    // Default doctor-assigned BP goal
    const doctorBPGoal: Goal = {
      id: 'bp-goal-doctor',
      title: 'Lower Blood Pressure',
      description: 'Reduce blood pressure to healthy levels',
      category: 'bp',
      target: '120/80',
      current: '145/90',
      reward: 1000,
      status: 'active',
      assignedBy: 'Dr. Smith',
      assignedByRole: 'doctor',
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      progress: 0,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    };
    
    // Combine doctor goal with custom goals
    return [doctorBPGoal, ...customGoals];
  }

  async getGoals(filters?: { status?: 'active' | 'completed' | 'expired' | 'pending' }): Promise<Goal[]> {
    // Try API with timeout
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 1200)
    );
    
    try {
      const apiPromise = this.handleRequest(async () => {
        const response = await (client as any).goals.list(filters || {});
        return (response as any[]).map(goal => ({
          ...goal,
          createdAt: new Date(goal.createdAt || Date.now()),
          completedDate: goal.completedDate ? new Date(goal.completedDate) : undefined,
        })) as Goal[];
      });
      
      return await Promise.race([apiPromise, timeoutPromise]);
    } catch (error) {
      console.log('[GoalsService] API call failed, using demo data:', error);
      // Demo fallback:
      const allGoals = this.getDemoGoals();
      
      // Apply filters
      if (filters?.status) {
        return allGoals.filter(goal => goal.status === filters.status);
      }
      
      return allGoals;
    }
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
    // Try API with timeout
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 1200)
    );
    
    try {
      const apiPromise = this.handleRequest(async () => {
        const response = await (client as any).goals.create(goal);
        return {
          ...response,
          createdAt: new Date(response.createdAt || Date.now()),
        } as Goal;
      });
      
      return await Promise.race([apiPromise, timeoutPromise]);
    } catch (error) {
      console.log('[GoalsService] Create API call failed, using demo mode:', error);
      // Demo fallback: create goal locally
      const newGoal: Goal = {
        ...goal,
        id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      };
      
      // Store in localStorage
      const storedGoals = localStorage.getItem('demo_goals');
      const existingGoals: Goal[] = storedGoals ? JSON.parse(storedGoals) : [];
      existingGoals.push(newGoal);
      localStorage.setItem('demo_goals', JSON.stringify(existingGoals));
      
      console.log('[GoalsService] ✅ Goal created and stored in localStorage:', newGoal);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('demo_goals_updated'));
      
      return newGoal;
    }
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    // Try API with timeout
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 1200)
    );
    
    try {
      const apiPromise = this.handleRequest(async () => {
        const response = await (client as any).goals.update({ id, ...updates });
        return {
          ...response,
          createdAt: new Date(response.createdAt || Date.now()),
        } as Goal;
      });
      
      return await Promise.race([apiPromise, timeoutPromise]);
    } catch (error) {
      console.log('[GoalsService] Update API call failed, using demo mode:', error);
      // Demo fallback: update goal locally
      const storedGoals = localStorage.getItem('demo_goals');
      const existingGoals: Goal[] = storedGoals ? JSON.parse(storedGoals) : [];
      
      const goalIndex = existingGoals.findIndex(g => g.id === id);
      if (goalIndex !== -1) {
        existingGoals[goalIndex] = {
          ...existingGoals[goalIndex],
          ...updates,
        };
        localStorage.setItem('demo_goals', JSON.stringify(existingGoals));
        console.log('[GoalsService] ✅ Goal updated in localStorage:', existingGoals[goalIndex]);
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('demo_goals_updated'));
        
        return existingGoals[goalIndex];
      }
      
      // If not found in custom goals, might be the doctor BP goal - return updated version
      const updatedGoal: Goal = {
        id,
        title: 'Lower Blood Pressure',
        description: 'Reduce blood pressure to healthy levels',
        category: 'bp',
        target: '120/80',
        current: updates.current || '145/90',
        reward: 1000,
        status: updates.status || 'active',
        assignedBy: 'Dr. Smith',
        assignedByRole: 'doctor',
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        progress: updates.progress || 0,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        completedDate: updates.completedDate,
        ...updates,
      };
      
      return updatedGoal;
    }
  }

  async completeGoal(id: string): Promise<void> {
    return this.handleRequest(async () => {
      await (client as any).goals.complete({ id });
    });
  }
}

export const goalsService = new GoalsService();

