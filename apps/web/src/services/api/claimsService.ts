import { BaseService } from './baseService';
import { client } from '@/utils/orpc';

export interface Claim {
  id: string;
  patientId: string;
  providerId: string;
  diagnosis: {
    code: string;
    desc: string;
  };
  cpt: {
    code: string;
    desc: string;
  };
  reimbursement: string;
  medications: Array<{
    name: string;
    strength: string;
    frequency: string;
    route: string;
    duration: string;
    instructions: string;
  }>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessClaimData {
  noteText: string;
  audioData?: string;
  patientId?: string;
}

export class ClaimsService extends BaseService {
  /**
   * Process claim from clinical note
   */
  async processClaim(data: ProcessClaimData): Promise<Claim> {
    return this.handleRequest(async () => {
      const response = await (client as any).claims.process(data);
      return {
        ...response,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
      } as Claim;
    });
  }

  /**
   * Get claims list
   */
  async getClaims(filters?: {
    patientId?: string;
    providerId?: string;
    status?: Claim['status'];
  }): Promise<Claim[]> {
    return this.handleRequest(async () => {
      const response = await (client as any).claims.list(filters || {});
      return (response as any[]).map(claim => ({
        ...claim,
        createdAt: new Date(claim.createdAt),
        updatedAt: new Date(claim.updatedAt),
      })) as Claim[];
    });
  }

  /**
   * Get claim by ID
   */
  async getClaim(id: string): Promise<Claim> {
    return this.handleRequest(async () => {
      const response = await (client as any).claims.get({ id });
      return {
        ...response,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
      } as Claim;
    });
  }

  /**
   * Update claim status
   */
  async updateClaimStatus(id: string, status: Claim['status']): Promise<Claim> {
    return this.handleRequest(async () => {
      const response = await (client as any).claims.updateStatus({ id, status });
      return {
        ...response,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
      } as Claim;
    });
  }
}

export const claimsService = new ClaimsService();

