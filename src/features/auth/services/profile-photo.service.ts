import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import {
  normalizeRemoteAvatarUrl,
  normalizeRemotePhotoPath,
  getRemoteAuthenticatedUser,
  getRemoteUserPhotoUri,
} from '@/features/auth/services/auth-api.service';
import {
  getSessionAuthToken,
  getSessionTenantId,
} from '@/features/auth/services/session-storage.service';
import { getApiUrl, translateApiMessage } from '@/services/api-client';

const PROFILE_PHOTO_DIR = `${FileSystem.documentDirectory ?? ''}profile-photos/`;
const AVATAR_REQUEST_TIMEOUT_MS = 30000;

type AvatarUploadResponse = {
  data?: {
    photo_path?: string;
    avatar_url?: string;
  };
  message?: string;
};

function getFileExtension(uri: string) {
  const cleanUri = uri.split('?')[0] ?? uri;
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : 'jpg';
}

function getMimeType(uri: string) {
  const extension = getFileExtension(uri);

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  return 'image/jpeg';
}

async function getAvatarHeaders() {
  const token = await getSessionAuthToken();
  const tenantId = await getSessionTenantId();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }

  return headers;
}

async function fetchAvatarEndpoint(path: string, init: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AVATAR_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(getApiUrl(path), {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Tempo esgotado ao salvar a foto. Tente novamente.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function isManagedProfilePhotoUri(uri: string | null | undefined) {
  if (!uri || !PROFILE_PHOTO_DIR) {
    return false;
  }

  return uri.startsWith(PROFILE_PHOTO_DIR);
}

export async function persistProfilePhoto(sourceUri: string, userId: number) {
  if (Platform.OS === 'web' || !PROFILE_PHOTO_DIR) {
    return sourceUri;
  }

  await FileSystem.makeDirectoryAsync(PROFILE_PHOTO_DIR, { intermediates: true });

  const extension = getFileExtension(sourceUri);
  const destinationUri = `${PROFILE_PHOTO_DIR}user-${userId}-${Date.now()}.${extension}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destinationUri,
  });

  return destinationUri;
}

export async function removeManagedProfilePhoto(uri: string | null | undefined) {
  if (!isManagedProfilePhotoUri(uri)) {
    return;
  }

  try {
    await FileSystem.deleteAsync(uri!, { idempotent: true });
  } catch {
    // Ignore cleanup failures because the DB state is more important than orphan cleanup.
  }
}

export function isRemoteProfilePhotoUri(uri: string | null | undefined) {
  return Boolean(uri?.startsWith('http://') || uri?.startsWith('https://'));
}

export async function loadRemoteProfilePhotoDataUri(uri: string) {
  const response = await fetch(uri, {
    headers: await getAvatarHeaders(),
  });

  if (!response.ok) {
    throw new Error('Falha ao carregar avatar remoto.');
  }

  const contentType = response.headers.get('content-type') ?? getMimeType(uri);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Falha ao preparar avatar remoto.'));
    };
    reader.onerror = () => reject(new Error('Falha ao preparar avatar remoto.'));
    reader.readAsDataURL(blob);
  }).then((dataUri) => {
    if (dataUri.startsWith('data:application/octet-stream')) {
      return dataUri.replace('data:application/octet-stream', `data:${contentType}`);
    }

    return dataUri;
  });
}

export async function uploadRemoteAvatar(uri: string) {
  const extension = getFileExtension(uri);
  const formData = new FormData();

  formData.append('avatar', {
    uri,
    name: `avatar.${extension}`,
    type: getMimeType(uri),
  } as unknown as Blob);

  const response = await fetchAvatarEndpoint('/auth/me/avatar', {
    method: 'POST',
    headers: await getAvatarHeaders(),
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as AvatarUploadResponse | null;

  if (!response.ok) {
    throw new Error(payload?.message ? translateApiMessage(payload.message) : 'Falha ao enviar avatar.');
  }

  const uploadedUri =
    normalizeRemoteAvatarUrl(payload?.data?.avatar_url) ??
    normalizeRemotePhotoPath(payload?.data?.photo_path);

  if (uploadedUri) {
    return `${uploadedUri}${uploadedUri.includes('?') ? '&' : '?'}t=${Date.now()}`;
  }

  const remoteUser = await getRemoteAuthenticatedUser().catch(() => null);
  return getRemoteUserPhotoUri(remoteUser) ?? uri;
}

export async function deleteRemoteAvatar() {
  const response = await fetchAvatarEndpoint('/auth/me/avatar', {
    method: 'DELETE',
    headers: await getAvatarHeaders(),
  });

  const payload = (await response.json().catch(() => null)) as AvatarUploadResponse | null;

  if (!response.ok) {
    throw new Error(payload?.message ? translateApiMessage(payload.message) : 'Falha ao remover avatar.');
  }
}
