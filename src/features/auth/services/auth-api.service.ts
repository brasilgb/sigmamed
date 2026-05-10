import { apiRequest, getApiBaseUrl } from '@/services/api-client';
import { clearRemoteSession } from '@/features/auth/services/session-storage.service';

type AuthApiTenant = {
  id?: number | string;
  account_usage?: string | null;
  accountUsage?: string | null;
  account_type?: string | null;
  profile_type?: string | null;
  type?: string | null;
};

type AuthApiUser = {
  id: number | string;
  account_usage?: string | null;
  accountUsage?: string | null;
  account_type?: string | null;
  profile_type?: string | null;
  type?: string | null;
  name: string;
  email: string;
  age?: number | string | null;
  profile_id?: number | string | null;
  avatar_url?: string | null;
  photo_url?: string | null;
  photo_path?: string | null;
  created_at?: string;
  updated_at?: string;
};

type AuthApiProfile = {
  id: number | string;
  name?: string | null;
  full_name?: string | null;
  age?: number | string | null;
  sex?: string | null;
  height?: number | string | null;
  avatar_url?: string | null;
  photo_url?: string | null;
  photo_path?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type RemoteProfile = AuthApiProfile;
export type RemoteUser = AuthApiUser;

type AuthApiData = {
  token?: string;
  plainTextToken?: string;
  access_token?: string;
  account_usage?: string | null;
  accountUsage?: string | null;
  account_type?: string | null;
  profile_type?: string | null;
  type?: string | null;
  tenant?: AuthApiTenant | null;
  user?: AuthApiUser;
  profile?: AuthApiProfile | null;
  profile_id?: number | string | null;
  avatar_url?: string | null;
  photo_url?: string | null;
  photo_path?: string | null;
};

type AuthApiResponse = {
  token?: string;
  plainTextToken?: string;
  access_token?: string;
  account_usage?: string | null;
  accountUsage?: string | null;
  account_type?: string | null;
  profile_type?: string | null;
  type?: string | null;
  tenant?: AuthApiTenant | null;
  user?: AuthApiUser;
  data?: AuthApiData | AuthApiUser;
  avatar_url?: string | null;
  photo_url?: string | null;
  photo_path?: string | null;
};

type ProfileApiResponse =
  | AuthApiProfile
  | {
      data?:
        | AuthApiProfile
        | { profile?: AuthApiProfile | null; profile_id?: number | string | null; profiles?: AuthApiProfile[] }
        | AuthApiProfile[];
      profile?: AuthApiProfile | null;
      profile_id?: number | string | null;
      profiles?: AuthApiProfile[];
    };

function getToken(response: AuthApiResponse) {
  const data = response.data && 'token' in response.data ? response.data : null;
  return (
    response.token ??
    response.plainTextToken ??
    response.access_token ??
    data?.token ??
    data?.plainTextToken ??
    data?.access_token ??
    null
  );
}

function getTenantId(response: AuthApiResponse) {
  const data = response.data && 'tenant' in response.data ? response.data : null;
  return response.tenant?.id ?? data?.tenant?.id ?? null;
}

function getUser(response: AuthApiResponse) {
  if (response.user) {
    return withResponsePhoto(response.user, response);
  }

  if (response.data && 'user' in response.data && response.data.user) {
    return withResponsePhoto(response.data.user, response);
  }

  if (response.data && 'email' in response.data) {
    return withResponsePhoto(response.data, response);
  }

  return null;
}

function getResponseAccountUsage(response: AuthApiResponse | AuthApiUser) {
  const data = 'data' in response ? response.data : null;
  const dataAccountUsage = data && !Array.isArray(data) && typeof data === 'object'
    ? data.account_usage ?? data.accountUsage ?? data.account_type ?? data.profile_type ?? data.type
    : null;
  const tenantAccountUsage = data && !Array.isArray(data) && typeof data === 'object' && 'tenant' in data
    ? data.tenant?.account_usage ??
      data.tenant?.accountUsage ??
      data.tenant?.account_type ??
      data.tenant?.profile_type ??
      data.tenant?.type
    : null;
  const responseTenantAccountUsage =
    'tenant' in response
      ? response.tenant?.account_usage ??
        response.tenant?.accountUsage ??
        response.tenant?.account_type ??
        response.tenant?.profile_type ??
        response.tenant?.type
      : null;

  return (
    ('account_usage' in response ? response.account_usage : null) ??
    ('accountUsage' in response ? response.accountUsage : null) ??
    ('account_type' in response ? response.account_type : null) ??
    ('profile_type' in response ? response.profile_type : null) ??
    ('type' in response ? response.type : null) ??
    dataAccountUsage ??
    tenantAccountUsage ??
    responseTenantAccountUsage ??
    null
  );
}

function withResponsePhoto(user: AuthApiUser, response: AuthApiResponse | AuthApiUser): AuthApiUser {
  const data = 'data' in response ? response.data : null;
  const dataPhoto =
    data && !Array.isArray(data) && ('avatar_url' in data || 'photo_url' in data || 'photo_path' in data)
      ? {
          avatar_url: data.avatar_url,
          photo_url: data.photo_url,
          photo_path: data.photo_path,
        }
      : {};
  const profilePhoto =
    data && !Array.isArray(data) && 'profile' in data && data.profile
      ? {
          avatar_url: data.profile.avatar_url,
          photo_url: data.profile.photo_url,
          photo_path: data.profile.photo_path,
        }
      : {};
  const responsePhoto =
    'avatar_url' in response || 'photo_url' in response || 'photo_path' in response
      ? {
          avatar_url: response.avatar_url,
          photo_url: response.photo_url,
          photo_path: response.photo_path,
        }
      : {};

  return {
    ...user,
    ...responsePhoto,
    ...profilePhoto,
    ...dataPhoto,
    account_usage: user.account_usage ?? user.accountUsage ?? getResponseAccountUsage(response),
    avatar_url: user.avatar_url ?? dataPhoto.avatar_url ?? profilePhoto.avatar_url ?? responsePhoto.avatar_url,
    photo_url: user.photo_url ?? dataPhoto.photo_url ?? profilePhoto.photo_url ?? responsePhoto.photo_url,
    photo_path: user.photo_path ?? dataPhoto.photo_path ?? profilePhoto.photo_path ?? responsePhoto.photo_path,
  };
}

function getProfileId(response: AuthApiResponse) {
  if (response.user?.profile_id) {
    return response.user.profile_id;
  }

  if (response.data && 'profile' in response.data && response.data.profile?.id) {
    return response.data.profile.id;
  }

  if (response.data && 'profile_id' in response.data && response.data.profile_id) {
    return response.data.profile_id;
  }

  if (response.data && 'user' in response.data && response.data.user?.profile_id) {
    return response.data.user.profile_id;
  }

  return null;
}

export type RemoteAuthResult = {
  token: string;
  tenantId: string | number | null;
  user: AuthApiUser | null;
  profileId: string | number | null;
};

export async function registerRemoteUser(input: {
  accountUsage: string;
  name: string;
  email: string;
  age: number | null;
  sex: string | null;
  height: number | null;
  password: string;
}): Promise<RemoteAuthResult> {
  const response = await apiRequest<AuthApiResponse>('/auth/register', {
    method: 'POST',
    body: {
      account_usage: input.accountUsage,
      name: input.name,
      email: input.email,
      age: input.age,
      sex: input.sex,
      height: input.height,
      password: input.password,
      password_confirmation: input.password,
    },
  });

  const token = getToken(response);

  if (!token) {
    throw new Error('A API nao retornou token de autenticacao.');
  }

  return {
    token,
    tenantId: getTenantId(response),
    user: getUser(response),
    profileId: getProfileId(response),
  };
}

export async function loginRemoteUser(input: {
  email: string;
  password: string;
}): Promise<RemoteAuthResult> {
  const response = await apiRequest<AuthApiResponse>('/auth/login', {
    method: 'POST',
    body: {
      email: input.email,
      password: input.password,
    },
  });

  const token = getToken(response);

  if (!token) {
    throw new Error('A API nao retornou token de autenticacao.');
  }

  return {
    token,
    tenantId: getTenantId(response),
    user: getUser(response),
    profileId: getProfileId(response),
  };
}

export async function requestPasswordReset(input: { email: string }) {
  await apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: {
      email: input.email,
    },
  });
}

export async function resetRemotePassword(input: {
  email: string;
  code: string;
  password: string;
}) {
  await apiRequest('/auth/reset-password', {
    method: 'POST',
    body: {
      email: input.email,
      code: input.code,
      password: input.password,
      password_confirmation: input.password,
    },
  });
  await clearRemoteSession();
}

export async function getRemoteAuthenticatedUser() {
  const context = await getRemoteSessionContext();
  return context.user;
}

export async function updateRemoteAuthenticatedUser(input: {
  name: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  const response = await apiRequest<AuthApiResponse | AuthApiUser>('/auth/me', {
    method: 'PATCH',
    authenticated: true,
    body: {
      name: input.name,
      email: input.email,
      current_password: input.currentPassword || undefined,
      password: input.newPassword || undefined,
      password_confirmation: input.newPassword || undefined,
    },
  });

  if ('data' in response && response.data) {
    if ('user' in response.data && response.data.user) {
      return withResponsePhoto(response.data.user, response);
    }

    if ('email' in response.data) {
      return withResponsePhoto(response.data, response);
    }
  }

  if ('user' in response && response.user) {
    return withResponsePhoto(response.user, response);
  }

  return withResponsePhoto(response as AuthApiUser, response);
}

export async function getRemoteSessionContext() {
  const response = await apiRequest<AuthApiResponse | AuthApiUser>('/auth/me', {
    method: 'GET',
    authenticated: true,
  });

  if ('data' in response && response.data) {
    if ('user' in response.data && response.data.user) {
      return {
        user: withResponsePhoto(response.data.user, response),
        tenantId: 'tenant' in response.data ? response.data.tenant?.id ?? null : null,
        profileId: getProfileId(response),
      };
    }

    if ('email' in response.data) {
      return {
        user: withResponsePhoto(response.data, response),
        tenantId: getTenantId(response as AuthApiResponse),
        profileId: response.data.profile_id ?? null,
      };
    }
  }

  if ('user' in response && response.user) {
    return {
      user: withResponsePhoto(response.user, response),
      tenantId: getTenantId(response),
      profileId: getProfileId(response),
    };

  }

  return {
    user: withResponsePhoto(response as AuthApiUser, response),
    tenantId: getTenantId(response as AuthApiResponse),
    profileId: 'profile_id' in response ? response.profile_id ?? null : null,
  };
}

export async function deleteRemoteAccount() {
  await apiRequest('/auth/me', {
    method: 'DELETE',
    authenticated: true,
  });
}

export function getRemoteUserPhotoUri(user: AuthApiUser | null) {
  return normalizeRemoteAvatarUrl(user?.avatar_url ?? user?.photo_url ?? null) ?? normalizeRemotePhotoPath(user?.photo_path);
}

export function normalizeRemoteAvatarUrl(uri: string | null | undefined) {
  if (!uri) {
    return null;
  }

  const normalizedUri = uri.trim();

  if (!normalizedUri) {
    return null;
  }

  const apiOrigin = new URL(getApiBaseUrl()).origin;

  if (normalizedUri.startsWith('http://') || normalizedUri.startsWith('https://')) {
    try {
      const url = new URL(normalizedUri);

      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return `${apiOrigin}${url.pathname}${url.search}`;
      }

      return normalizedUri;
    } catch {
      return normalizedUri;
    }
  }

  if (normalizedUri.startsWith('/')) {
    return `${apiOrigin}${normalizedUri}`;
  }

  return `${apiOrigin}/${normalizedUri}`;
}

export function normalizeRemotePhotoPath(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return normalizeRemoteAvatarUrl(path);
  }

  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const publicDiskPath = normalizedPath
    .replace(/^public_html\/controle\//, '')
    .replace(/^storage\/app\/public\//, '')
    .replace(/^app\/public\//, '')
    .replace(/^public\//, '')
    .replace(/^avatars\/avatars\//, 'avatars/');
  const storagePath = publicDiskPath.startsWith('storage/')
    ? publicDiskPath
    : `storage/${publicDiskPath}`;

  return normalizeRemoteAvatarUrl(`/${storagePath}`);
}

export function getRemoteUserAge(user: AuthApiUser | null) {
  if (user?.age === null || user?.age === undefined || user.age === '') {
    return null;
  }

  const age = Number(user.age);
  return Number.isFinite(age) ? age : null;
}

export async function getRemoteProfileId() {
  const response = await apiRequest<ProfileApiResponse>('/profile', {
    method: 'GET',
    authenticated: true,
  });

  if ('profile_id' in response && response.profile_id) {
    return response.profile_id;
  }

  if ('data' in response && Array.isArray(response.data) && response.data[0]?.id) {
    return response.data[0].id;
  }

  if ('data' in response && response.data && 'profile_id' in response.data && response.data.profile_id) {
    return response.data.profile_id;
  }

  if ('data' in response && response.data && 'profile' in response.data && response.data.profile?.id) {
    return response.data.profile.id;
  }

  if ('data' in response && response.data && 'id' in response.data && response.data.id) {
    return response.data.id;
  }

  if ('profile' in response && response.profile?.id) {
    return response.profile.id;
  }

  if ('id' in response && response.id) {
    return response.id;
  }

  return null;
}

export async function createRemoteProfile(input: {
  fullName: string;
  age?: number | null;
  sex?: string | null;
  height?: number | null;
  notes?: string | null;
}) {
  const response = await apiRequest<ProfileApiResponse>('/profiles', {
    method: 'POST',
    authenticated: true,
    body: {
      name: input.fullName,
      age: input.age ?? null,
      sex: input.sex ?? null,
      height: input.height ?? null,
      notes: input.notes?.trim() || null,
    },
  });

  if ('data' in response && response.data && !Array.isArray(response.data) && 'id' in response.data) {
    return response.data;
  }

  if ('id' in response && response.id) {
    return response;
  }

  return null;
}

export async function listRemoteProfiles(): Promise<RemoteProfile[]> {
  const response = await apiRequest<ProfileApiResponse>('/profiles', {
    method: 'GET',
    authenticated: true,
  });

  if ('data' in response && Array.isArray(response.data)) {
    return response.data;
  }

  if ('data' in response && response.data && !Array.isArray(response.data) && 'profiles' in response.data && Array.isArray(response.data.profiles)) {
    return response.data.profiles;
  }

  if ('profiles' in response && Array.isArray(response.profiles)) {
    return response.profiles;
  }

  if ('data' in response && response.data && !Array.isArray(response.data) && 'id' in response.data) {
    return [response.data];
  }

  if ('id' in response && response.id) {
    return [response];
  }

  return [];
}

export async function getRemoteProfile(profileId?: number | string | null): Promise<RemoteProfile | null> {
  const response = await apiRequest<ProfileApiResponse>(profileId ? `/profiles/${profileId}` : '/profile', {
    method: 'GET',
    authenticated: true,
  });

  if ('data' in response && Array.isArray(response.data)) {
    return response.data[0] ?? null;
  }

  if ('data' in response && response.data && !Array.isArray(response.data)) {
    if ('profile' in response.data && response.data.profile) {
      return response.data.profile;
    }

    if ('id' in response.data) {
      return response.data;
    }
  }

  if ('profile' in response && response.profile) {
    return response.profile;
  }

  if ('id' in response && response.id) {
    return response;
  }

  return null;
}

export async function updateRemoteProfile(profileId: number | string | null, input: {
  fullName?: string | null;
  age?: number | null;
  sex?: string | null;
  height?: number | null;
  notes?: string | null;
}) {
  const response = await apiRequest<ProfileApiResponse>(profileId ? `/profiles/${profileId}` : '/profile', {
    method: 'PUT',
    authenticated: true,
    body: {
      name: input.fullName,
      full_name: input.fullName,
      age: input.age ?? null,
      sex: input.sex ?? null,
      height: input.height ?? null,
      notes: input.notes ?? null,
    },
  });

  if ('data' in response && response.data && !Array.isArray(response.data)) {
    if ('profile' in response.data && response.data.profile) {
      return response.data.profile;
    }

    if ('id' in response.data) {
      return response.data;
    }
  }

  if ('profile' in response && response.profile) {
    return response.profile;
  }

  if ('id' in response && response.id) {
    return response;
  }

  return getRemoteProfile(profileId);
}

export async function deleteRemoteProfile(profileId: number | string) {
  await apiRequest(`/profiles/${profileId}`, {
    method: 'DELETE',
    authenticated: true,
  });
}
