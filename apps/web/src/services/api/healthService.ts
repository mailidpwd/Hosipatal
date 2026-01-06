import { BaseService } from './baseService';
import { client } from '@/utils/orpc';

export interface Vitals {
  heartRate: number;
  bloodPressure: string;
  weight: string;
  temperature?: number;
  oxygenSaturation?: number;
  timestamp: Date;
}

export interface HealthMetrics {
  steps: number;
  stepsTarget: number;
  water: number;
  waterTarget: number;
  calories?: number;
  activeMinutes?: number;
  streak: number;
}

export class HealthService extends BaseService {
  /**
   * Get current vitals
   */
  async getVitals(userId?: string): Promise<Vitals> {
    return this.handleRequest(async () => {
      // Router expects optional input, so pass undefined if no userId
      const input = userId ? { userId } : undefined;
      const response = await (client as any).health.getVitals(input);
      return {
        ...response,
        timestamp: new Date(response.timestamp),
      } as Vitals;
    });
  }

  /**
   * Update vitals
   */
  async updateVitals(vitals: Partial<Vitals>): Promise<Vitals> {
    return this.handleRequest(async () => {
      const response = await (client as any).health.updateVitals(vitals);
      return {
        ...response,
        timestamp: new Date(response.timestamp),
      } as Vitals;
    });
  }

  /**
   * Get health metrics (steps, water, etc.)
   */
  async getMetrics(userId?: string): Promise<HealthMetrics> {
    return this.handleRequest(async () => {
      // Router expects optional input, so pass undefined if no userId
      const input = userId ? { userId } : undefined;
      const response = await (client as any).health.getMetrics(input);
      return response as HealthMetrics;
    });
  }

  /**
   * Update steps
   */
  async updateSteps(steps: number): Promise<HealthMetrics> {
    return this.handleRequest(async () => {
      const response = await (client as any).health.updateSteps({ steps });
      return response as HealthMetrics;
    });
  }

  /**
   * Update water intake
   */
  async updateWater(water: number): Promise<HealthMetrics> {
    return this.handleRequest(async () => {
      const response = await (client as any).health.updateWater({ water });
      return response as HealthMetrics;
    });
  }
}

export const healthService = new HealthService();

