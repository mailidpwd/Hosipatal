import { BaseService } from './baseService';
import { client } from '@/utils/orpc';

export interface AdminDashboardData {
  totalStaff: number;
  totalPatients: number;
  pendingVerifications: number;
  verifiedPatients: number;
  recentAlerts: Array<{
    id: string;
    patientId: string;
    patientName: string;
    type: string;
    severity: string;
    message: string;
    details: string;
    timestamp: string;
  }>;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  patientCount: number;
  createdAt: string;
}

export interface StaffListResponse {
  staff: StaffMember[];
  total: number;
  offset: number;
  limit: number;
}

export interface PatientListItem {
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
  email: string;
  contactNumber: string;
  providerId: string;
  adminId: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdBy: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface PatientListResponse {
  patients: PatientListItem[];
  total: number;
  offset: number;
  limit: number;
}

export interface PendingVerification {
  id: string;
  name: string;
  age: number;
  gender: string;
  patientId: string;
  diagnosis: string;
  status: string;
  email: string;
  contactNumber: string;
  providerId: string;
  adminId: string;
  verificationStatus: 'pending';
  createdBy: string;
  createdAt?: string;
  createdByStaff: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface CreateStaffData {
  email: string;
  password: string;
  name: string;
}

export interface PatientDetails extends PatientListItem {
  createdByStaff: {
    id: string;
    name: string;
    email: string;
  } | null;
  vitals: {
    heartRate: number;
    bloodPressure: string;
    weight: string;
  };
}

export class AdminService extends BaseService {
  /**
   * Get admin dashboard data
   */
  async getDashboard(adminId: string): Promise<AdminDashboardData> {
    return this.handleRequest(async () => {
      const response = await (client as any).admin.getDashboard({ adminId });
      return response as AdminDashboardData;
    });
  }

  /**
   * Get all staff under this admin
   */
  async getStaff(
    adminId: string,
    filters?: {
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<StaffListResponse> {
    return this.handleRequest(async () => {
      const response = await (client as any).admin.getStaff({
        adminId,
        ...filters,
      });
      return response as StaffListResponse;
    });
  }

  /**
   * Get all patients under this admin
   */
  async getPatients(
    adminId: string,
    filters?: {
      search?: string;
      status?: 'critical' | 'stable' | 'at-risk' | 'moderate';
      verificationStatus?: 'pending' | 'verified' | 'rejected';
      providerId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<PatientListResponse> {
    return this.handleRequest(async () => {
      const response = await (client as any).admin.getPatients({
        adminId,
        ...filters,
      });
      return response as PatientListResponse;
    });
  }

  /**
   * Get pending verifications
   */
  async getPendingVerifications(adminId: string): Promise<PendingVerification[]> {
    return this.handleRequest(async () => {
      const response = await (client as any).admin.getPendingVerifications({ adminId });
      return response as PendingVerification[];
    });
  }

  /**
   * Verify a patient (approve or reject)
   */
  async verifyPatient(
    adminId: string,
    patientId: string,
    action: 'approve' | 'reject'
  ): Promise<PatientListItem> {
    return this.handleRequest(async () => {
      const response = await (client as any).admin.verifyPatient({
        adminId,
        patientId,
        action,
      });
      return response as PatientListItem;
    });
  }

  /**
   * Create a new staff member
   */
  async createStaff(adminId: string, staffData: CreateStaffData): Promise<StaffMember> {
    return this.handleRequest(async () => {
      const response = await (client as any).admin.createStaff({
        adminId,
        ...staffData,
      });
      return response as StaffMember;
    });
  }

  /**
   * Get patient details
   */
  async getPatientDetails(adminId: string, patientId: string): Promise<PatientDetails> {
    return this.handleRequest(async () => {
      const response = await (client as any).admin.getPatientDetails({
        adminId,
        patientId,
      });
      return response as PatientDetails;
    });
  }

  /**
   * Get command center metrics
   */
  async getCommandCenter(adminId: string): Promise<CommandCenterData> {
    return this.handleRequest(async () => {
      console.log('[AdminService] Calling getCommandCenter with adminId:', adminId);
      const response = await (client as any).admin.getCommandCenter({ adminId });
      console.log('[AdminService] Received response:', response);
      console.log('[AdminService] Response type:', typeof response);
      console.log('[AdminService] Response is null/undefined:', response === null || response === undefined);
      console.log('[AdminService] Response keys:', response ? Object.keys(response) : 'no keys');
      
      if (!response || typeof response !== 'object') {
        console.error('[AdminService] ❌ Invalid response received:', response);
        throw new Error('Invalid response from server: response is not an object');
      }
      
      // Validate response has required fields
      const requiredFields = ['patientExperience', 'clinicalDiscipline', 'safetyHygiene', 'staffEngagement', 'esgCharity'];
      const missingFields = requiredFields.filter(field => !(field in response));
      if (missingFields.length > 0) {
        console.error('[AdminService] ❌ Response missing required fields:', missingFields);
        console.error('[AdminService] Response data:', JSON.stringify(response, null, 2));
        throw new Error(`Response missing required fields: ${missingFields.join(', ')}`);
      }
      
      console.log('[AdminService] ✅ Response validated successfully');
      return response as CommandCenterData;
    });
  }

  /**
   * Get staff leaderboard
   */
  async getLeaderboard(
    adminId: string,
    filters?: {
      role?: 'all' | 'doctors' | 'nurses' | 'techs';
      search?: string;
    }
  ): Promise<LeaderboardData> {
    return this.handleRequest(async () => {
      console.log('[AdminService] Calling getLeaderboard with adminId:', adminId, 'filters:', filters);
      
      try {
        // Add timeout for demo mode fallback
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 2000);
        });
        
        const response = await Promise.race([
          (client as any).admin.getLeaderboard({
            adminId,
            ...filters,
          }),
          timeoutPromise,
        ]) as any;
        
        console.log('[AdminService] Received leaderboard response:', response);
        
        if (!response || typeof response !== 'object') {
          console.error('[AdminService] ❌ Invalid response received:', response);
          throw new Error('Invalid response from server: response is not an object');
        }
        
        // Ensure response has required structure
        if (!Array.isArray(response.staff)) {
          console.error('[AdminService] ❌ Response missing staff array:', response);
          throw new Error('Invalid response structure: missing staff array');
        }
        
        console.log('[AdminService] ✅ Leaderboard response validated, staff count:', response.staff.length);
        return response as LeaderboardData;
      } catch (error: any) {
        console.warn('[AdminService] API call failed, using demo data:', error?.message);
        
        // Demo data fallback
        const demoStaff = [
          {
            id: 'staff-1',
            name: 'Dr. Sarah Johnson',
            email: 'sarah.johnson@hospital.com',
            role: 'Doctor',
            rpi: 95,
            tokenEarnings: 12500,
            keyStrength: 'Patient Satisfaction',
            patientCount: 12,
            avatar: '',
            rank: 1,
          },
          {
            id: 'staff-2',
            name: 'Nurse Michael Chen',
            email: 'michael.chen@hospital.com',
            role: 'Nurse',
            rpi: 88,
            tokenEarnings: 9800,
            keyStrength: 'High Adherence',
            patientCount: 8,
            avatar: '',
            rank: 2,
          },
          {
            id: 'staff-3',
            name: 'Dr. David Kim',
            email: 'david.kim@hospital.com',
            role: 'Doctor',
            rpi: 85,
            tokenEarnings: 11200,
            keyStrength: 'Efficiency Excellence',
            patientCount: 10,
            avatar: '',
            rank: 3,
          },
          {
            id: 'staff-4',
            name: 'Tech Emma Wilson',
            email: 'emma.wilson@hospital.com',
            role: 'Technician',
            rpi: 82,
            tokenEarnings: 7200,
            keyStrength: 'Consistency',
            patientCount: 6,
            avatar: '',
            rank: 4,
          },
          {
            id: 'staff-5',
            name: 'Nurse Lisa Anderson',
            email: 'lisa.anderson@hospital.com',
            role: 'Nurse',
            rpi: 80,
            tokenEarnings: 6500,
            keyStrength: 'Safety Excellence',
            patientCount: 7,
            avatar: '',
            rank: 5,
          },
        ];
        
        // Apply filters if provided
        let filteredStaff = demoStaff;
        if (filters?.role && filters.role !== 'all') {
          const roleMap: Record<string, string> = {
            doctors: 'Doctor',
            nurses: 'Nurse',
            techs: 'Technician',
          };
          filteredStaff = demoStaff.filter(s => s.role === roleMap[filters.role!]);
        }
        
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          filteredStaff = filteredStaff.filter(s => 
            s.name.toLowerCase().includes(searchLower) || 
            s.email.toLowerCase().includes(searchLower)
          );
        }
        
        // Re-rank after filtering
        filteredStaff = filteredStaff.map((s, index) => ({ ...s, rank: index + 1 }));
        
        const demoData: LeaderboardData = {
          staff: filteredStaff,
          topPerformer: filteredStaff.length > 0 ? {
            name: filteredStaff[0].name,
            rpi: filteredStaff[0].rpi,
            tokenEarnings: filteredStaff[0].tokenEarnings,
          } : null,
          mostImproved: filteredStaff.length > 0 ? {
            name: filteredStaff[0].name,
            improvement: '+15%',
            tokenEarnings: filteredStaff[0].tokenEarnings,
          } : null,
          deptVelocity: filteredStaff.reduce((sum, s) => sum + s.tokenEarnings, 0),
        };
        
        console.log('[AdminService] ✅ Returning demo leaderboard data:', demoData.staff.length, 'staff members');
        return demoData;
      }
    });
  }

  /**
   * Get token economy metrics
   */
  async getTokenEconomy(adminId: string): Promise<TokenEconomyData> {
    return this.handleRequest(async () => {
      console.log('[AdminService] Calling getTokenEconomy with adminId:', adminId);
      
      try {
        // Add timeout for demo mode fallback
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 2000);
        });
        
        const response = await Promise.race([
          (client as any).admin.getTokenEconomy({ adminId }),
          timeoutPromise,
        ]) as any;
        
        console.log('[AdminService] Received token economy response:', response);
        
        if (!response || typeof response !== 'object') {
          console.error('[AdminService] ❌ Invalid response received:', response);
          throw new Error('Invalid response from server: response is not an object');
        }
        
        // Validate required fields
        const requiredFields = ['circulatingLiability', 'remorsePool', 'csrFundValue', 'conversionRate', 'minting', 'burning', 'tangibleImpact'];
        const missingFields = requiredFields.filter(field => !(field in response));
        if (missingFields.length > 0) {
          console.error('[AdminService] ❌ Response missing required fields:', missingFields);
          throw new Error(`Invalid response structure: missing required fields: ${missingFields.join(', ')}`);
        }
        
        console.log('[AdminService] ✅ Token economy response validated');
        return response as TokenEconomyData;
      } catch (error: any) {
        console.warn('[AdminService] API call failed, using demo data:', error?.message);
        
        // Demo data fallback
        const demoData: TokenEconomyData = {
          circulatingLiability: 245000,
          remorsePool: 32000,
          csrFundValue: 125000,
          conversionRate: {
            rdm: 100,
            usd: 1,
          },
          minting: {
            adherenceRewards: 85000,
            efficiencyBonuses: 42000,
            tips: 18000,
            total: 145000,
          },
          burning: {
            donations: 25000,
            penalties: 7000,
            total: 32000,
          },
          tangibleImpact: {
            patientsSubsidized: 48,
            freeLabTests: 127,
            energySaved: 23,
          },
        };
        
        console.log('[AdminService] ✅ Returning demo token economy data');
        return demoData;
      }
    });
  }

  /**
   * Get analytics data
   */
  async getAnalytics(
    adminId: string,
    view?: 'scorecard' | 'budget' | 'remorse'
  ): Promise<AnalyticsData> {
    return this.handleRequest(async () => {
      console.log('[AdminService] Calling getAnalytics with adminId:', adminId, 'view:', view);
      const activeView = view || 'budget';
      
      try {
        // Add timeout for demo mode fallback
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 2000);
        });
        
        const response = await Promise.race([
          (client as any).admin.getAnalytics({
            adminId,
            view: activeView,
          }),
          timeoutPromise,
        ]) as any;
        
        console.log('[AdminService] Received analytics response:', response);
        
        if (!response || typeof response !== 'object') {
          console.error('[AdminService] ❌ Invalid response received:', response);
          throw new Error('Invalid response from server: response is not an object');
        }
        
        // Validate response has view field
        if (!response.view) {
          console.error('[AdminService] ❌ Response missing view field:', response);
          throw new Error('Invalid response structure: missing view field');
        }
        
        console.log('[AdminService] ✅ Analytics response validated, view:', response.view);
        return response as AnalyticsData;
      } catch (error: any) {
        console.warn('[AdminService] API call failed, using demo data:', error?.message);
        
        // Demo data fallback based on view
        let demoData: AnalyticsData;
        
        if (activeView === 'budget') {
          demoData = {
            view: 'budget',
            budget: {
              totalMonthly: 1000000,
              currentlySpent: 345000,
              spentPercentage: 34.5,
              projectedStatus: 'on_track',
              projectedDay: null,
              costEfficiency: 120,
            },
          };
        } else if (activeView === 'scorecard') {
          demoData = {
            view: 'scorecard',
            scorecard: {
              adherence: 87,
              satisfaction: 92,
              safety: 89,
              efficiency: 85,
            },
            hotspots: [
              { type: 'Adherence', count: 12, severity: 'medium' as const },
              { type: 'Satisfaction', count: 5, severity: 'low' as const },
              { type: 'Safety', count: 3, severity: 'low' as const },
            ],
          };
        } else {
          // remorse view
          demoData = {
            view: 'remorse',
            hotspots: [
              { type: 'Missed SLA', count: 8, severity: 'high' as const },
              { type: 'Protocol Violation', count: 5, severity: 'medium' as const },
              { type: 'Patient Complaint', count: 3, severity: 'low' as const },
            ],
          };
        }
        
        console.log('[AdminService] ✅ Returning demo analytics data for view:', activeView);
        return demoData;
      }
    });
  }
}

export interface CommandCenterData {
  patientExperience: number;
  clinicalDiscipline: number;
  safetyHygiene: number;
  staffEngagement: number;
  esgCharity: number;
  careRadar: {
    accuracy: number;
    empathy: number;
    timeliness: number;
    hygiene: number;
    compliance: number;
  };
  loopStatus: 'healthy' | 'moderate' | 'needs_attention';
  roleContribution: {
    doctors: number;
    nurses: number;
    techs: number;
  };
  journeyBottleneck: {
    detected: boolean;
    message: string | null;
  };
  remorseLearning: {
    trigger: string;
    frequency: string;
    description: string;
    systemAction: string;
  };
  esgImpact: {
    freeSurgeries: number;
    medicalWasteReduction: number;
  };
}

export interface LeaderboardData {
  staff: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    rpi: number;
    tokenEarnings: number;
    keyStrength: string;
    patientCount: number;
    avatar: string;
    rank: number;
  }>;
  topPerformer: {
    name: string;
    rpi: number;
    tokenEarnings: number;
  } | null;
  mostImproved: {
    name: string;
    improvement: string;
    tokenEarnings: number;
  } | null;
  deptVelocity: number;
}

export interface TokenEconomyData {
  circulatingLiability: number;
  remorsePool: number;
  csrFundValue: number;
  conversionRate: {
    rdm: number;
    usd: number;
  };
  minting: {
    adherenceRewards: number;
    efficiencyBonuses: number;
    tips: number;
    total: number;
  };
  burning: {
    donations: number;
    penalties: number;
    total: number;
  };
  tangibleImpact: {
    patientsSubsidized: number;
    freeLabTests: number;
    energySaved: number;
  };
}

export interface AnalyticsData {
  view: 'scorecard' | 'budget' | 'remorse';
  budget?: {
    totalMonthly: number;
    currentlySpent: number;
    spentPercentage: number;
    projectedStatus: string;
    projectedDay: number | null;
    costEfficiency: number;
  };
  scorecard?: {
    adherence: number;
    satisfaction: number;
    safety: number;
    efficiency: number;
  };
  hotspots?: Array<{
    type: string;
    count: number;
    severity: 'high' | 'medium' | 'low';
  }>;
}

export const adminService = new AdminService();

