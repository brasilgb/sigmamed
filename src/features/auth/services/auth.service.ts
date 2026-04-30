import { UserRepository } from '@/features/auth/repositories/user.repository';
import {
  createRemoteProfile,
  deleteRemoteAccount,
  getRemoteAuthenticatedUser,
  getRemoteUserAge,
  getRemoteProfileId,
  getRemoteSessionContext,
  getRemoteUserPhotoUri,
  loginRemoteUser,
  registerRemoteUser,
} from '@/features/auth/services/auth-api.service';
import { deleteRemoteAvatar, uploadRemoteAvatar } from '@/features/auth/services/profile-photo.service';
import { pullRemoteRecords } from '@/services/remote-sync.service';
import { syncPendingRecords } from '@/services/pending-sync.service';
import { getActiveLocalProfileId, setActiveLocalProfileId } from '@/services/sync-metadata.service';
import {
  clearRemoteSession,
  clearSessionLocalProfileId,
  clearSessionUserId,
  getSessionAuthToken,
  getSessionUserId,
  setSessionAuthToken,
  setSessionProfileId,
  setSessionTenantId,
  setSessionUserId,
} from '@/features/auth/services/session-storage.service';
import { hashSecret, matchesSecret } from '@/features/auth/services/security.service';
import { ApiRequestError } from '@/services/api-client';
import type { AuthProfile, AuthUser, LoginInput, RegisterInput, UpdateAccountInput } from '@/features/auth/types/auth';

const userRepository = new UserRepository();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hasRegisteredUser() {
  return (await userRepository.getCount()) > 0;
}

export async function restoreSessionUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  return userRepository.getById(userId);
}

export async function registerUser(input: RegisterInput): Promise<AuthUser> {
  const accountUsage = input.accountUsage;
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const hasExistingLocalUser = await hasRegisteredUser();

  if (hasExistingLocalUser) {
    throw new Error('Este aparelho ja possui uma conta principal cadastrada.');
  }

  if (!name) {
    throw new Error('Informe seu nome.');
  }

  if (!email) {
    throw new Error('Informe seu e-mail.');
  }

  if (accountUsage === 'personal' && (!input.age || input.age < 1 || input.age > 130)) {
    throw new Error('Informe uma idade valida.');
  }

  if (accountUsage === 'personal' && (!input.height || input.height < 30 || input.height > 250)) {
    throw new Error('Informe uma altura valida em centimetros.');
  }

  if (input.password.length < 6) {
    throw new Error('A senha precisa ter ao menos 6 caracteres.');
  }

  if (!(input.pin.length === 4 || input.pin.length === 6) || !/^\d+$/.test(input.pin)) {
    throw new Error('O PIN deve ter 4 ou 6 dígitos numéricos.');
  }

  const existingUser = await userRepository.getByEmail(email);

  if (existingUser) {
    throw new Error('Ja existe uma conta com este e-mail.');
  }

  const remoteAuth = await registerRemoteUser({
    accountUsage,
    name,
    email,
    age: input.age,
    height: input.height,
    password: input.password,
  });

  const initialRemoteProfileId = remoteAuth?.profileId ?? null;
  const user = await userRepository.createUserWithProfile({
    accountUsage,
    name,
    email,
    passwordHash: await hashSecret(input.password),
    pinHash: await hashSecret(input.pin),
    useBiometric: input.useBiometric,
    age: getRemoteUserAge(remoteAuth?.user ?? null) ?? input.age,
    profileFullName: name,
    profileHeight: accountUsage === 'personal' ? input.height : null,
    remoteProfileId: initialRemoteProfileId,
    createInitialProfile: accountUsage === 'personal',
  });

  await setSessionAuthToken(remoteAuth.token);

  if (remoteAuth.tenantId) {
    await setSessionTenantId(remoteAuth.tenantId);
  }

  const remoteContext = await getRemoteSessionContext().catch(() => null);
  const remoteTenantId = remoteAuth.tenantId ?? remoteContext?.tenantId ?? null;

  if (remoteTenantId) {
    await setSessionTenantId(remoteTenantId);
  }

  const remoteProfileId =
    remoteAuth.profileId ?? remoteContext?.profileId ?? (await getRemoteProfileId().catch(() => null));

  if (remoteProfileId) {
    await setSessionProfileId(remoteProfileId);
    await userRepository.updateFirstProfileRemoteId(user.id, remoteProfileId);
  }

  await setSessionUserId(user.id);
  void syncPendingRecords();
  return user;
}

export async function loginUser(input: LoginInput): Promise<AuthUser> {
  const email = normalizeEmail(input.email);
  const localUserCount = await userRepository.getCount();

  const remoteAuth = await loginRemoteUser({
    email,
    password: input.password,
  });

  await setSessionAuthToken(remoteAuth.token);

  const remoteContext = await getRemoteSessionContext().catch(() => null);
  const remoteTenantId = remoteAuth.tenantId ?? remoteContext?.tenantId ?? null;

  if (remoteTenantId) {
    await setSessionTenantId(remoteTenantId);
  }

  const remoteProfileId =
    remoteAuth.profileId ?? remoteContext?.profileId ?? (await getRemoteProfileId().catch(() => null));

  if (remoteProfileId) {
    await setSessionProfileId(remoteProfileId);
  }

  const remoteUser =
    remoteAuth.user ??
    remoteContext?.user ??
    (await getRemoteAuthenticatedUser().catch(() => null));
  const record = await userRepository.getCredentialRecordByEmail(email);
  let user: AuthUser | null = null;

  if (record) {
    user = await userRepository.updateUserAccount(record.id, {
      name: remoteUser?.name ?? record.name,
      email,
      age: getRemoteUserAge(remoteUser) ?? record.age,
      photoUri: getRemoteUserPhotoUri(remoteUser) ?? record.photo_uri,
      passwordHash: await hashSecret(input.password),
    });

    if (remoteProfileId) {
      await userRepository.updateFirstProfileRemoteId(user.id, remoteProfileId);
    }
  } else {
    if (localUserCount > 0) {
      throw new Error('Este aparelho ja possui uma conta principal cadastrada.');
    }

    const pin = input.pin?.trim() ?? '';

    if (!(pin.length === 4 || pin.length === 6) || !/^\d+$/.test(pin)) {
      throw new Error('Informe um PIN de 4 ou 6 dígitos para este aparelho.');
    }

    user = await userRepository.createUserWithProfile({
      accountUsage: 'personal',
      name: remoteUser?.name ?? email,
      email,
      age: getRemoteUserAge(remoteUser),
      passwordHash: await hashSecret(input.password),
      pinHash: await hashSecret(pin),
      useBiometric: false,
      photoUri: getRemoteUserPhotoUri(remoteUser),
      remoteProfileId,
    });
  }

  await setSessionUserId(user.id);
  await pullRemoteRecords().catch(() => undefined);
  void syncPendingRecords();
  return user;
}

export async function unlockWithPin(userId: number, pin: string) {
  const record = await userRepository.getCredentialRecordById(userId);

  if (!record || !record.pin_hash) {
    throw new Error('PIN indisponível para esta conta.');
  }

  const isValid = await matchesSecret(pin, record.pin_hash);

  if (!isValid) {
    throw new Error('PIN inválido.');
  }

  const user = await userRepository.getById(userId);

  if (!user) {
    throw new Error('Conta não encontrada.');
  }

  return user;
}

export async function logoutUser() {
  await Promise.all([clearSessionUserId(), clearRemoteSession()]);
}

export async function deleteLocalAccount(userId: number) {
  const user = await userRepository.getById(userId);

  if (!user) {
    throw new Error('Conta não encontrada.');
  }

  const token = await getSessionAuthToken();

  if (token) {
    try {
      await deleteRemoteAccount();
    } catch (error) {
      if (!(error instanceof ApiRequestError && (error.status === 401 || error.status === 404))) {
        throw error;
      }
    }
  }

  await userRepository.deleteAccount(userId);
  await Promise.all([clearSessionUserId(), clearRemoteSession(), clearSessionLocalProfileId()]);
}

export async function setBiometricPreference(userId: number, enabled: boolean) {
  await userRepository.updateBiometricPreference(userId, enabled);
}

export async function updateAccount(userId: number, input: UpdateAccountInput): Promise<AuthUser> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const currentPassword = input.currentPassword?.trim() ?? '';
  const newPassword = input.newPassword?.trim() ?? '';

  if (!name) {
    throw new Error('Informe seu nome.');
  }

  if (!email) {
    throw new Error('Informe seu e-mail.');
  }

  const record = await userRepository.getCredentialRecordById(userId);

  if (!record) {
    throw new Error('Conta não encontrada.');
  }

  const isChangingSensitiveData = email !== normalizeEmail(record.email) || newPassword.length > 0;

  if (newPassword && newPassword.length < 6) {
    throw new Error('A nova senha precisa ter ao menos 6 caracteres.');
  }

  if (isChangingSensitiveData) {
    if (!currentPassword) {
      throw new Error('Informe a senha atual para alterar e-mail ou senha.');
    }

    const isCurrentPasswordValid = await matchesSecret(currentPassword, record.password_hash);

    if (!isCurrentPasswordValid) {
      throw new Error('Senha atual incorreta.');
    }
  }

  let photoUri = input.photoUri;

  if (photoUri && photoUri !== record.photo_uri) {
    photoUri = await uploadRemoteAvatar(photoUri);
  }

  if (!photoUri && record.photo_uri) {
    await deleteRemoteAvatar();
  }

  return userRepository.updateUserAccount(userId, {
    name,
    email,
    age: record.age,
    photoUri,
    passwordHash: newPassword ? await hashSecret(newPassword) : undefined,
  });
}

export async function getAccountProfiles(userId: number): Promise<AuthProfile[]> {
  return userRepository.getProfilesByUserId(userId);
}

export async function getActiveAccountProfileId() {
  return getActiveLocalProfileId();
}

export async function getActiveAccountProfile() {
  const profileId = await getActiveLocalProfileId();

  if (profileId) {
    return userRepository.getProfileById(profileId);
  }

  const userId = await getSessionUserId();
  return userId ? userRepository.getProfileByUserId(userId) : null;
}

export async function setActiveAccountProfile(profileId: number) {
  await setActiveLocalProfileId(profileId);
}

export async function createAccountProfile(input: {
  userId: number;
  fullName: string;
  age?: number | null;
  height?: number | null;
  notes?: string | null;
}): Promise<AuthProfile> {
  const user = await userRepository.getById(input.userId);

  if (!user) {
    throw new Error('Conta não encontrada.');
  }

  if (user.accountUsage === 'personal') {
    throw new Error('Contas pessoais usam somente o perfil da propria conta.');
  }

  if (input.age !== null && input.age !== undefined && (input.age < 1 || input.age > 130)) {
    throw new Error('Informe uma idade valida.');
  }

  if (input.height !== null && input.height !== undefined && (input.height < 30 || input.height > 250)) {
    throw new Error('Informe uma altura valida em centimetros.');
  }

  const remoteProfileId = await createRemoteProfile(input).catch(() => null);
  return userRepository.createProfile({ ...input, remoteProfileId });
}
