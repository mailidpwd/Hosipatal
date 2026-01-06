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
      // Short timeout with demo fallback
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 1200);
      });

      try {
        const response = await Promise.race([
          (client as any).appointments.list(filters || {}),
          timeoutPromise,
        ]);
        return (response as any[]).map(apt => ({
          ...apt,
          date: apt.date,
          time: apt.time,
        })) as Appointment[];
      } catch {
        // Demo fallback (1 upcoming appointment later today)
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
          (now.getMinutes() + 120) % 60
        ).padStart(2, '0')}`;
        return filters?.type === 'past'
          ? []
          : [
              {
                id: `apt-${Date.now()}`,
                doctorName: 'Dr. Sarah Smith',
                specialty: 'Cardiology',
                time: timeStr,
                date: dateStr,
                isCompleted: false,
                type: 'upcoming',
              },
            ];
      }
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

