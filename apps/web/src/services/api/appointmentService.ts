import { BaseService } from './baseService';
import { client } from '@/utils/orpc';
import type { Appointment } from '@/context/DataContext';

export class AppointmentService extends BaseService {
  /**
   * Get appointments list
   */
  async getAppointments(filters?: {
    type?: 'upcoming' | 'past';
    userId?: string;
  }): Promise<Appointment[]> {
    return this.handleRequest(async () => {
      const response = await (client as any).appointments.list(filters || {});
      return (response as any[]).map(apt => ({
        ...apt,
        date: apt.date,
        time: apt.time,
      })) as Appointment[];
    });
  }

  /**
   * Create new appointment
   */
  async createAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    return this.handleRequest(async () => {
      const response = await (client as any).appointments.create(appointment);
      return response as Appointment;
    });
  }

  /**
   * Update appointment
   */
  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    return this.handleRequest(async () => {
      const response = await (client as any).appointments.update({ id, ...updates });
      return response as Appointment;
    });
  }

  /**
   * Delete appointment
   */
  async deleteAppointment(id: string): Promise<void> {
    return this.handleRequest(async () => {
      await (client as any).appointments.delete({ id });
    });
  }
}

export const appointmentService = new AppointmentService();

