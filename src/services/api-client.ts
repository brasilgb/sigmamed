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
      return firstError;
    }
  }

  return payload?.message ?? fallback;
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
