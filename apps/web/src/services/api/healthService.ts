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
      // Short timeout: if API is unreachable, immediately return demo vitals
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 1200);
      });

      try {
        // Router expects optional input, so pass undefined if no userId
        const input = userId ? { userId } : undefined;
        const response = await Promise.race([
          (client as any).health.getVitals(input),
          timeoutPromise,
        ]);
        return {
          ...(response as any),
          timestamp: new Date((response as any).timestamp),
        } as Vitals;
      } catch {
        // Demo fallback
        return {
          heartRate: 78,
          bloodPressure: '150/95',
          weight: '185 lb',
          temperature: 98.6,
          oxygenSaturation: 97,
          timestamp: new Date(),
        };
      }
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
      // Short timeout with demo fallback
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 1200);
      });

      try {
        // Router expects optional input, so pass undefined if no userId
        const input = userId ? { userId } : undefined;
        const response = await Promise.race([
          (client as any).health.getMetrics(input),
          timeoutPromise,
        ]);
        return response as HealthMetrics;
      } catch {
        // Demo fallback
        return {
          steps: 3200,
          stepsTarget: 8000,
          water: 5,
          waterTarget: 8,
          calories: 1200,
          activeMinutes: 24,
          streak: 3,
        };
      }
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

