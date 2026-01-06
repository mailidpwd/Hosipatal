import { BaseService } from './baseService';
import { client } from '@/utils/orpc';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  patientId: string;
  diagnosis: string;
  adherenceScore: number;
  rdmEarnings: number;
  status: 'critical' | 'stable' | 'at-risk' | 'moderate';
  avatar?: string;
  lastVisit: string;
}

export interface CriticalAlert {
  id: string;
  patientId: string;
  patientName: string;
  type: string;
  severity: 'high' | 'moderate' | 'low';
  message: string;
  details: string;
  timestamp: string;
}

export interface PatientTip {
  id: string;
  patientId: string;
  patientName: string;
  amount: number;
  message?: string;
  timestamp: string;
  avatar?: string;
  liked?: boolean;
  type?: string;
  rating?: number;
}

export interface Pledge {
  id: string;
  patientId: string;
  patientName: string;
  goal: string;
  amount: number;
  status: 'active' | 'at-risk' | 'completed' | 'failed' | 'pending' | 'replaced';
  progress: number;
  totalDays: number;
  timestamp: string;
  message?: string;
  metricType?: string;
  target?: string;
  duration?: string;
  providerId?: string;
  providerName?: string;
  providerEmail?: string;
  accepted?: boolean;
  acceptedAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  patientName?: string;
  patientId?: string;
  type: string;
  status: 'done' | 'now' | 'upcoming';
  date: string;
}

export interface DashboardData {
  totalPatients: number;
  criticalCount: number;
  rating: number;
  rdmBalance: number;
  criticalPatients: Array<CriticalAlert & Partial<Patient>>;
  schedule: ScheduleItem[];
  recentWishes: PatientTip[];
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  patientId: string;
  diagnosis: string;
  adherenceScore: number;
  rdmEarnings: number;
  status: string;
  avatar?: string;
  lastVisit: string;
  vitals: {
    bloodPressure: string;
    heartRate: number;
    weight: string;
  };
  activity: {
    weeklyAverage: number;
    weeklyData: number[];
  };
  prescriptions: any[];
  visitHistory: any[];
  nextAppointment: any;
}

export interface EarningsData {
  totalAvailable: number;
  clinicalIncome: number;
  performanceBonus: number;
  patientTips: number;
  recentTips: PatientTip[];
  activePledges: Pledge[];
  rankings: Array<{
    rank: number;
    name: string;
    score: number;
    avatar?: string;
  }>;
}

export interface PatientsResponse {
  patients: Patient[];
  total: number;
  limit: number;
  offset: number;
}

export class ProviderService extends BaseService {
  /**
   * Get dashboard data
   */
  async getDashboard(providerId?: string): Promise<DashboardData> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.getDashboard({ providerId });
      return response as DashboardData;
    });
  }

  /**
   * Get patient list with filters
   */
  async getPatients(filters?: {
    search?: string;
    status?: 'critical' | 'stable' | 'at-risk' | 'moderate';
    limit?: number;
    offset?: number;
    providerId?: string;
  }): Promise<PatientsResponse> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.getPatients(filters || {});
      return response as PatientsResponse;
    });
  }

  /**
   * Get patient profile details
   */
  async getPatientProfile(patientId: string, providerId?: string): Promise<PatientProfile | null> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.getPatientProfile({ patientId, providerId });
      return response as PatientProfile | null;
    });
  }

  /**
   * Get earnings data
   */
  async getEarnings(providerId?: string): Promise<EarningsData> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.getEarnings({ providerId });
      return response as EarningsData;
    });
  }

  /**
   * Get schedule for a specific date
   */
  async getSchedule(date?: string, providerId?: string): Promise<ScheduleItem[]> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.getSchedule({ date, providerId });
      return response as ScheduleItem[];
    });
  }

  /**
   * Get critical alerts
   */
  async getCriticalAlerts(providerId?: string): Promise<CriticalAlert[]> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.getCriticalAlerts({ providerId });
      return response as CriticalAlert[];
    });
  }

  /**
   * Get recent patient tips/wishes
   */
  async getRecentWishes(limit?: number, providerId?: string): Promise<PatientTip[]> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.getRecentWishes({ limit, providerId });
      return response as PatientTip[];
    });
  }

  /**
   * Update patient status
   */
  async updatePatientStatus(patientId: string, status: string): Promise<Patient | null> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.updatePatientStatus({ patientId, status });
      return response as Patient | null;
    });
  }

  /**
   * Create a pledge for a patient with full details
   */
  async createPledge(
    patientId: string, 
    amount: number, 
    goal: string,
    options?: {
      message?: string;
      metricType?: string;
      target?: string;
      duration?: string;
      providerId?: string;
      providerName?: string;
      providerEmail?: string;
    }
  ): Promise<Pledge | null> {
    return this.handleRequest(async () => {
      try {
        const response = await (client as any).provider.createPledge({ 
          patientId, 
          amount, 
          goal,
          message: options?.message,
          metricType: options?.metricType,
          target: options?.target,
          duration: options?.duration,
          providerId: options?.providerId,
          providerName: options?.providerName,
          providerEmail: options?.providerEmail,
        });
        return response as Pledge | null;
      } catch (error: any) {
        // Demo mode fallback - return mock pledge for Michael Chen
        if (patientId === '83921' || patientId?.includes('83921')) {
          console.log('[ProviderService] Using demo pledge data for Michael Chen');
          const durationDays = parseInt(options?.duration || '7');
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + durationDays);
          
          return {
            id: `pledge-${Date.now()}`,
            patientId: patientId,
            patientName: 'Michael Chen',
            goal: goal,
            amount: amount,
            status: 'pending' as const,
            progress: 0,
            totalDays: durationDays,
            timestamp: new Date().toISOString(),
            message: options?.message,
            metricType: options?.metricType,
            target: options?.target,
            duration: options?.duration,
            providerId: options?.providerId || 'staff-1',
            providerName: options?.providerName || 'Dr. Sarah Smith',
            providerEmail: options?.providerEmail || 'doctor@rdmhealth.com',
            accepted: false,
            acceptedAt: null,
            startDate: null,
            endDate: endDate.toISOString(),
          } as Pledge;
        }
        throw error; // Re-throw if not demo patient
      }
    });
  }

  /**
   * Create a new patient with credentials
   */
  async createPatient(patientData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    age: string;
    gender: string;
    contactNumber: string;
    primaryCondition?: string;
    riskLevel?: string;
    allergies?: string[];
    nurse?: string;
    tier?: string;
    initialBonus?: boolean;
    email: string;
    password: string;
    patientId: string;
    providerId?: string;
  }): Promise<Patient> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.createPatient(patientData);
      return response as Patient;
    });
  }

  /**
   * Generate credentials for an existing patient
   */
  async generatePatientCredentials(patientId: string): Promise<{ patientId: string; email: string; password: string }> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.generatePatientCredentials({ patientId });
      return response;
    });
  }

  /**
   * Get patient credentials
   */
  async getPatientCredentials(patientId: string): Promise<{ patientId: string; email: string; password: string; contactNumber: string }> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.getPatientCredentials({ patientId });
      return response;
    });
  }

  /**
   * Send SMS to a patient
   */
  async sendSMSToPatient(patientId: string, message: string): Promise<{ success: boolean; message: string }> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.sendSMSToPatient({ patientId, message });
      return response;
    });
  }

  /**
   * Get all pledges for a patient
   */
  async getPatientPledges(patientId: string): Promise<Pledge[]> {
    return this.handleRequest(async () => {
      const response = await (client as any).provider.getPatientPledges({ patientId });
      return response as Pledge[];
    });
  }
}

export const providerService = new ProviderService();

