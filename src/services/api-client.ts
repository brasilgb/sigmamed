import Constants from 'expo-constants';
import { Platform } from 'react-native';

import {
  getSessionAuthToken,
  getSessionTenantId,
} from '@/features/auth/services/session-storage.service';

type ApiRequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: Record<string, string>;
  authenticated?: boolean;
};

type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

const apiMessageTranslations: Record<string, string> = {
  'account deleted.': 'Conta excluída.',
  'avatar removed.': 'Avatar removido.',
  'avatar uploaded.': 'Avatar enviado.',
  'blood-pressure pull completed.': 'Sincronização de pressão baixada com sucesso.',
  'blood-pressure push completed.': 'Sincronização de pressão enviada com sucesso.',
  'feedback received.': 'Feedback recebido.',
  'feedbacks loaded.': 'Feedbacks carregados.',
  'login successful.': 'Login realizado com sucesso.',
  'pix payment created.': 'Pagamento Pix criado.',
  'profile created.': 'Perfil criado.',
  'profile loaded.': 'Perfil carregado.',
  'profiles loaded.': 'Perfis carregados.',
  'registration successful.': 'Cadastro realizado com sucesso.',
  'sync access loaded.': 'Acesso à sincronização carregado.',
  'synchronization is not enabled.': 'Sincronização não liberada para esta conta.',
};

export class ApiRequestError extends Error {
  status: number;
  payload?: ApiErrorResponse;

  constructor(message: string, status: number, payload?: ApiErrorResponse) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.payload = payload;
  }
}

const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  Constants.expoConfig?.extra?.apiBaseUrl ??
  Constants.manifest2?.extra?.expoClient?.extra?.apiBaseUrl ??
  'http://192.168.2.54:8000/api/v1';

export function getApiBaseUrl() {
  const baseUrl = String(configuredBaseUrl).replace(/\/$/, '');

  if (Platform.OS === 'android') {
    return baseUrl.replace('://localhost:', '://10.0.2.2:').replace('://127.0.0.1:', '://10.0.2.2:');
  }

  return baseUrl;
}

export function getApiUrl(path: string) {
  return `${getApiBaseUrl()}${path}`;
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function getApiErrorMessage(payload: ApiErrorResponse | undefined, fallback: string) {
  if (payload?.errors) {
    const firstError = Object.values(payload.errors)[0]?.[0];

    if (firstError) {
      return translateApiMessage(firstError);
    }
  }

  return translateApiMessage(payload?.message ?? fallback);
}

export function translateApiMessage(message: string) {
  return apiMessageTranslations[message.trim().toLowerCase()] ?? message;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.authenticated) {
    const token = await getSessionAuthToken();
    const tenantId = await getSessionTenantId();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }
  }

  const response = await fetch(getApiUrl(path), {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await parseApiResponse<T | ApiErrorResponse>(response);

  if (!response.ok) {
    const errorPayload = payload as ApiErrorResponse | undefined;
    throw new ApiRequestError(
      getApiErrorMessage(errorPayload, 'Falha ao conectar com a API.'),
      response.status,
      errorPayload
    );
  }

  return payload as T;
}
