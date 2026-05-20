import { BaseApiService } from './base';

export interface MandayStatus {
  budget: number | null;
  actual: number | null;
  ratio: number | null;
  pct_used: number | null;
  over_budget: boolean;
  at_warning: boolean;
  has_benchmark: boolean;
}

export interface MandayAnalysisRow {
  block_id: number;
  block_name: string | null;
  task_code: string;
  task_name: string;
  budget_mandays: number;
  actual_mandays: number;
  pct_used: number;
  over_budget: boolean;
  at_warning: boolean;
}

export interface MandayOverrideRequest {
  id: number;
  farm_id: number;
  block_id: number | null;
  task_code: string;
  season_label: string | null;
  budget_mandays: number;
  actual_mandays: number;
  overage_pct: number;
  justification: string | null;
  status: 'pending_gm' | 'approved_gm' | 'pending_md' | 'approved_md' | 'rejected';
  requested_by: number;
  requested_at: string;
  gm_approved_by: number | null;
  gm_approved_at: string | null;
  gm_notes: string | null;
  md_approved_by: number | null;
  md_approved_at: string | null;
  md_notes: string | null;
  fc_reviewed_by: number | null;
  fc_reviewed_at: string | null;
  fc_notes: string | null;
  rejected_by: number | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export class MandayApiService extends BaseApiService {
  getMandayAnalysis(params: {
    farm_id: number;
    date_from?: string;
    date_to?: string;
  }): Promise<MandayAnalysisRow[]> {
    return this.get('/manday/analysis', params as any);
  }

  getMandayStatus(params: {
    farm_id: number;
    block_id: number;
    task_code: string;
  }): Promise<MandayStatus> {
    return this.get('/manday/status', params as any);
  }

  getOverBudget(params: {
    farm_id: number;
    date_from?: string;
    date_to?: string;
  }): Promise<MandayAnalysisRow[]> {
    return this.get('/manday/over-budget', params as any);
  }

  // Manager: create override request (all params are query params on the backend)
  createOverrideRequest(params: {
    farm_id: number;
    block_id: number;
    task_code: string;
    justification: string;
  }): Promise<MandayOverrideRequest> {
    const qs = new URLSearchParams(params as any).toString();
    return this.post(`/manday/override-requests?${qs}`);
  }

  listOverrideRequests(params?: {
    farm_id?: number;
    status?: string;
  }): Promise<MandayOverrideRequest[]> {
    return this.get('/manday/override-requests', params as any);
  }

  getOverrideRequest(requestId: number): Promise<MandayOverrideRequest> {
    return this.get(`/manday/override-requests/${requestId}`);
  }

  // GM: approve → moves to approved_gm / pending_md
  gmApprove(requestId: number, notes?: string): Promise<MandayOverrideRequest> {
    const qs = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    return this.put(`/manday/override-requests/${requestId}/approve-gm${qs}`);
  }

  // MD: final approval
  mdApprove(requestId: number, notes?: string): Promise<MandayOverrideRequest> {
    const qs = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    return this.put(`/manday/override-requests/${requestId}/approve-md${qs}`);
  }

  // GM or MD: reject
  reject(requestId: number, reason: string): Promise<MandayOverrideRequest> {
    return this.put(`/manday/override-requests/${requestId}/reject?reason=${encodeURIComponent(reason)}`);
  }

  // FC: record review
  fcReview(requestId: number, notes?: string): Promise<MandayOverrideRequest> {
    const qs = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    return this.put(`/manday/override-requests/${requestId}/fc-review${qs}`);
  }
}
