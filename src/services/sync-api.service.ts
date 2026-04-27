import { apiRequest } from '@/services/api-client';

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

export async function pushSyncItems<TItem extends Record<string, unknown>, TResponse = TItem>(
  input: SyncPushInput<TItem>
) {
  return apiRequest<SyncResponse<TResponse>>('/sync/push', {
    method: 'POST',
    authenticated: true,
    body: input,
  });
}

export async function pullSyncItems<TResponse>(input: SyncPullInput) {
  return apiRequest<SyncResponse<TResponse>>('/sync/pull', {
    method: 'POST',
    authenticated: true,
    body: input,
  });
}

