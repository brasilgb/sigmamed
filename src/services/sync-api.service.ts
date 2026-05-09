import { apiRequest, ApiRequestError } from '@/services/api-client';
import { getBillingSyncAccess, isBillingSyncEnabled } from '@/services/billing.service';

export type SyncResource =
  | 'blood-pressure'
  | 'glicose'
  | 'weight'
  | 'medications'
  | 'medication-logs';

export type SyncPushInput<TItem extends Record<string, unknown>> = {
  resource: SyncResource;
  items: TItem[];
};

export type SyncPullInput = {
  resource: SyncResource;
  since?: string;
};

export type SyncResponse<TItem> = {
  success: boolean;
  message: string;
  data: TItem[];
};

let cachedSyncEnabled: boolean | null = null;
let cachedSyncEnabledAt = 0;

const SYNC_ACCESS_CACHE_MS = 30000;

export function setCachedCloudSyncEnabled(enabled: boolean) {
  cachedSyncEnabled = enabled;
  cachedSyncEnabledAt = Date.now();
}

async function canUseCloudSync() {
  const now = Date.now();

  if (cachedSyncEnabled !== null && now - cachedSyncEnabledAt < SYNC_ACCESS_CACHE_MS) {
    return cachedSyncEnabled;
  }

  const access = await getBillingSyncAccess().catch(() => null);
  cachedSyncEnabled = isBillingSyncEnabled(access);
  cachedSyncEnabledAt = now;
  return cachedSyncEnabled;
}

export function isSyncDisabledError(error: unknown) {
  if (!(error instanceof ApiRequestError)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes('synchronization is not enabled') ||
    message.includes('sincronização não liberada') ||
    message.includes('sincronizacao nao liberada');
}

export async function pushSyncItems<TItem extends Record<string, unknown>, TResponse = TItem>(
  input: SyncPushInput<TItem>
) {
  if (!(await canUseCloudSync())) {
    throw new ApiRequestError('Sincronização não liberada para esta conta.', 402);
  }

  return apiRequest<SyncResponse<TResponse>>('/sync/push', {
    method: 'POST',
    authenticated: true,
    body: input,
  });
}

export async function pullSyncItems<TResponse>(input: SyncPullInput) {
  if (!(await canUseCloudSync())) {
    throw new ApiRequestError('Sincronização não liberada para esta conta.', 402);
  }

  return apiRequest<SyncResponse<TResponse>>('/sync/pull', {
    method: 'POST',
    authenticated: true,
    body: input,
  });
}
