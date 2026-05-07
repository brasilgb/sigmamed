import { apiRequest } from '@/services/api-client';

export type BillingPlan =
  | 'personal_monthly'
  | 'personal_annual'
  | 'family_caregiver_monthly'
  | 'family_caregiver_annual';

export type BillingSyncAccess = {
  sync_enabled: boolean;
  status: 'inactive' | 'active';
  plan: BillingPlan | null;
  cycle: 'monthly' | 'annual' | null;
  expires_at: string | null;
  provider: string | null;
  paid_at?: string | null;
};

export type BillingCheckout = {
  payment_id: string;
  status: 'pending' | 'expired' | 'approved' | 'rejected' | 'cancelled' | 'canceled' | 'inactive' | string;
  raw_status?: string | null;
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
      return 'Pessoal mensal';
    case 'personal_annual':
      return 'Pessoal anual';
    case 'family_caregiver_monthly':
      return 'Familiar/acompanhante mensal';
    case 'family_caregiver_annual':
      return 'Familiar/acompanhante anual';
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

function asBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'active'].includes(value.trim().toLowerCase());
  }

  return false;
}

function asBillingPlan(value: unknown): BillingPlan | null {
  return value === 'personal_monthly' ||
    value === 'personal_annual' ||
    value === 'family_caregiver_monthly' ||
    value === 'family_caregiver_annual'
    ? value
    : null;
}

function asBillingCycle(value: unknown): BillingSyncAccess['cycle'] {
  return value === 'monthly' || value === 'annual' ? value : null;
}

function asBillingStatus(value: unknown): BillingSyncAccess['status'] {
  return value === 'active' ? 'active' : 'inactive';
}

function asNullableString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function normalizeBillingSyncAccess(input: unknown): BillingSyncAccess {
  const record = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const status = asBillingStatus(record.status);
  const syncEnabled = asBoolean(record.sync_enabled ?? record.syncEnabled) || status === 'active';

  return {
    sync_enabled: syncEnabled,
    status: syncEnabled ? 'active' : status,
    plan: asBillingPlan(record.plan),
    cycle: asBillingCycle(record.cycle),
    expires_at: asNullableString(record.expires_at ?? record.expiresAt),
    provider: asNullableString(record.provider),
    paid_at: asNullableString(record.paid_at ?? record.paidAt),
  };
}

export function isBillingSyncEnabled(access: BillingSyncAccess | null | undefined) {
  return Boolean(access?.sync_enabled || access?.status === 'active');
}

export async function getBillingSyncAccess() {
  const response = await apiRequest<ApiDataResponse<unknown> | BillingSyncAccess>('/billing/sync-access', {
    method: 'GET',
    authenticated: true,
  });

  const payload =
    response && typeof response === 'object' && 'data' in response
      ? response.data
      : response;

  return normalizeBillingSyncAccess(payload);
}

export async function createBillingCheckout(plan: BillingPlan) {
  const response = await apiRequest<ApiDataResponse<BillingCheckout>>('/billing/sync-access/checkout', {
    method: 'POST',
    authenticated: true,
    body: { plan },
  });

  return response.data;
}
