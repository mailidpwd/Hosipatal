import { BaseService } from './baseService';
import { client } from '@/utils/orpc';

export interface Medication {
  id: string;
  name: string;
  strength: string;
  frequency: string;
  route: string;
  duration: string;
  instructions: string;
  alert?: string;
  isVerified: boolean;
  isAutoAdded: boolean;
  startDate?: string;
  endDate?: string;
}

export class MedicationService extends BaseService {
  /**
   * Get medications list
   */
  async getMedications(userId?: string): Promise<Medication[]> {
    return this.handleRequest(async () => {
      const response = await (client as any).medications.list({ userId });
      return response as Medication[];
    });
  }

  /**
   * Create medication
   */
  async createMedication(medication: Omit<Medication, 'id'>): Promise<Medication> {
    return this.handleRequest(async () => {
      const response = await (client as any).medications.create(medication);
      return response as Medication;
    });
  }

  /**
   * Update medication
   */
  async updateMedication(id: string, updates: Partial<Medication>): Promise<Medication> {
    return this.handleRequest(async () => {
      const response = await (client as any).medications.update({ id, ...updates });
      return response as Medication;
    });
  }

  /**
   * Delete medication
   */
  async deleteMedication(id: string): Promise<void> {
    return this.handleRequest(async () => {
      await (client as any).medications.delete({ id });
    });
  }

  /**
   * Mark medication as taken
   */
  async markTaken(id: string, timestamp?: Date): Promise<void> {
    return this.handleRequest(async () => {
      await (client as any).medications.markTaken({ id, timestamp: timestamp || new Date() });
    });
  }
}

export const medicationService = new MedicationService();

