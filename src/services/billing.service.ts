import { apiRequest } from '@/services/api-client';

export type BillingPlan =
  | 'personal_monthly'
  | 'personal_annual'
  | 'family_caregiver_monthly'
  | 'family_caregiver_annual';

export type BillingSyncAccess = {
  sync_enabled: boolean;
  status: 'inactive' | 'pending' | 'active' | 'expired' | 'canceled';
  plan: BillingPlan | null;
  cycle: 'monthly' | 'annual' | null;
  expires_at: string | null;
  provider: string | null;
  paid_at?: string | null;
};

export type BillingCheckout = {
  payment_id: string;
  status: string;
  plan: BillingPlan;
  amount: number;
  currency: 'BRL';
  qr_code: string;
  qr_code_base64?: string | null;
  checkout_url?: string | null;
  expires_at: string;
};

export function getBillingPlanLabel(plan: BillingPlan | null | undefined) {
  switch (plan) {
    case 'personal_monthly':
      return 'Essencial mensal';
    case 'personal_annual':
      return 'Essencial anual';
    case 'family_caregiver_monthly':
      return 'Cuidado Familiar mensal';
    case 'family_caregiver_annual':
      return 'Cuidado Familiar anual';
    default:
      return 'Nuvem não ativada';
  }
}

export function getBillingPlanPriceLabel(plan: BillingPlan | null | undefined) {
  switch (plan) {
    case 'personal_monthly':
      return 'R$ 9,90/mês';
    case 'personal_annual':
      return 'R$ 99,90/ano';
    case 'family_caregiver_monthly':
      return 'R$ 19,90/mês';
    case 'family_caregiver_annual':
      return 'R$ 199,90/ano';
    default:
      return null;
  }
}

export function getBillingCycleLabel(cycle: BillingSyncAccess['cycle']) {
  switch (cycle) {
    case 'monthly':
      return 'Mensal';
    case 'annual':
      return 'Anual';
    default:
      return null;
  }
}

type ApiDataResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
  message?: string;
};

export async function getBillingSyncAccess() {
  const response = await apiRequest<ApiDataResponse<BillingSyncAccess>>('/billing/sync-access', {
    method: 'GET',
    authenticated: true,
  });

  return response.data;
}

export async function createBillingCheckout(plan: BillingPlan) {
  const response = await apiRequest<ApiDataResponse<BillingCheckout>>('/billing/sync-access/checkout', {
    method: 'POST',
    authenticated: true,
    body: { plan },
  });

  return response.data;
}
