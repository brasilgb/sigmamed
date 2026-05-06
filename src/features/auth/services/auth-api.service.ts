import { apiRequest, getApiBaseUrl } from '@/services/api-client';

type AuthApiTenant = {
  id?: number | string;
};

type AuthApiUser = {
  id: number | string;
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
  notes?: string | null;
};

export type RemoteProfile = AuthApiProfile;

type AuthApiData = {
  token?: string;
  plainTextToken?: string;
  access_token?: string;
  tenant?: AuthApiTenant | null;
  user?: AuthApiUser;
  profile?: AuthApiProfile | null;
  profile_id?: number | string | null;
};

type AuthApiResponse = {
  token?: string;
  plainTextToken?: string;
  access_token?: string;
  tenant?: AuthApiTenant | null;
  user?: AuthApiUser;
  data?: AuthApiData | AuthApiUser;
};

type ProfileApiResponse =
  | AuthApiProfile
  | {
      data?:
        | AuthApiProfile
        | { profile?: AuthApiProfile | null; profile_id?: number | string | null }
        | AuthApiProfile[];
      profile?: AuthApiProfile | null;
      profile_id?: number | string | null;
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
    return response.user;
  }

  if (response.data && 'user' in response.data && response.data.user) {
    return response.data.user;
  }

  if (response.data && 'email' in response.data) {
    return response.data;
  }

  return null;
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

export async function getRemoteAuthenticatedUser() {
  const context = await getRemoteSessionContext();
  return context.user;
}

export async function getRemoteSessionContext() {
  const response = await apiRequest<AuthApiResponse | AuthApiUser>('/auth/me', {
    method: 'GET',
    authenticated: true,
  });

  if ('data' in response && response.data) {
    if ('user' in response.data && response.data.user) {
      return {
        user: response.data.user,
        tenantId: 'tenant' in response.data ? response.data.tenant?.id ?? null : null,
        profileId: getProfileId(response),
      };
    }

    if ('email' in response.data) {
      return {
        user: response.data,
        tenantId: null,
        profileId: response.data.profile_id ?? null,
      };
    }
  }

  if ('user' in response && response.user) {
    return {
      user: response.user,
      tenantId: getTenantId(response),
      profileId: getProfileId(response),
    };
  }

  return {
    user: response as AuthApiUser,
    tenantId: null,
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

  const apiOrigin = new URL(getApiBaseUrl()).origin;

  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    try {
      const url = new URL(uri);

      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return `${apiOrigin}${url.pathname}${url.search}`;
      }

      return uri;
    } catch {
      return uri;
    }
  }

  if (uri.startsWith('/')) {
    return `${apiOrigin}${uri}`;
  }

  return `${apiOrigin}/${uri}`;
}

export function normalizeRemotePhotoPath(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return normalizeRemoteAvatarUrl(path);
  }

  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const storagePath = normalizedPath.startsWith('storage/')
    ? normalizedPath
    : `storage/${normalizedPath}`;

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
    return response.data.id;
  }

  if ('id' in response && response.id) {
    return response.id;
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

  if ('data' in response && response.data && !Array.isArray(response.data) && 'id' in response.data) {
    return [response.data];
  }

  if ('id' in response && response.id) {
    return [response];
  }

  return [];
}
