import { UserRepository } from '@/features/auth/repositories/user.repository';
import {
  createRemoteProfile,
  deleteRemoteAccount,
  deleteRemoteProfile,
  getRemoteProfile,
  getRemoteAuthenticatedUser,
  getRemoteUserAge,
  getRemoteProfileId,
  getRemoteSessionContext,
  getRemoteUserPhotoUri,
  listRemoteProfiles,
  loginRemoteUser,
  registerRemoteUser,
  updateRemoteAuthenticatedUser,
  updateRemoteProfile,
  type RemoteProfile,
  type RemoteUser,
} from '@/features/auth/services/auth-api.service';
import {
  deleteRemoteAvatar,
  isManagedProfilePhotoUri,
  removeManagedProfilePhoto,
  uploadRemoteAvatar,
} from '@/features/auth/services/profile-photo.service';
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
import type { AccountUsage, AuthProfile, AuthUser, LoginInput, RegisterInput, UpdateAccountInput } from '@/features/auth/types/auth';

const userRepository = new UserRepository();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeAccountUsage(value: string | null | undefined, fallback: AccountUsage): AccountUsage {
  const normalized = value?.trim().toLowerCase();

  if (normalized === 'personal' || normalized === 'family' || normalized === 'professional') {
    return normalized;
  }

  if (normalized === 'familiar' || normalized === 'cuidador' || normalized === 'caregiver') {
    return 'family';
  }

  if (normalized === 'pessoal' || normalized === 'individual') {
    return 'personal';
  }

  return fallback;
}

function getRemoteProfileName(profile: RemoteProfile) {
  return profile.name ?? profile.full_name ?? null;
}

function mapRemoteUserToLocalUser(remoteUser: RemoteUser | null, localUser: AuthUser): AuthUser {
  if (!remoteUser) {
    return localUser;
  }

  return {
    ...localUser,
    accountUsage: normalizeAccountUsage(remoteUser.account_usage, localUser.accountUsage),
    name: remoteUser.name ?? localUser.name,
    email: remoteUser.email ?? localUser.email,
    age: getRemoteUserAge(remoteUser) ?? localUser.age,
    photoUri: getRemoteUserPhotoUri(remoteUser) ?? localUser.photoUri,
    updatedAt: remoteUser.updated_at ?? localUser.updatedAt,
  };
}

function mergeRemoteUsers(...users: (RemoteUser | null | undefined)[]) {
  const merged = users.reduce<RemoteUser | null>((currentUser, nextUser) => {
    if (!nextUser) {
      return currentUser;
    }

    if (!currentUser) {
      return nextUser;
    }

    return {
      ...currentUser,
      ...nextUser,
      account_usage: nextUser.account_usage ?? currentUser.account_usage,
      age: nextUser.age ?? currentUser.age,
      profile_id: nextUser.profile_id ?? currentUser.profile_id,
      avatar_url: nextUser.avatar_url ?? currentUser.avatar_url,
      photo_url: nextUser.photo_url ?? currentUser.photo_url,
      photo_path: nextUser.photo_path ?? currentUser.photo_path,
      created_at: nextUser.created_at ?? currentUser.created_at,
      updated_at: nextUser.updated_at ?? currentUser.updated_at,
    };
  }, null);

  return merged;
}

async function cacheRemoteUser(userId: number, remoteUser: RemoteUser | null, passwordHash?: string) {
  const localUser = await userRepository.getById(userId);

  if (!localUser || !remoteUser) {
    return localUser;
  }

  return userRepository.updateUserAccount(userId, {
    name: remoteUser.name ?? localUser.name,
    email: normalizeEmail(remoteUser.email ?? localUser.email),
    accountUsage: normalizeAccountUsage(remoteUser.account_usage, localUser.accountUsage),
    age: getRemoteUserAge(remoteUser) ?? localUser.age,
    photoUri: getRemoteUserPhotoUri(remoteUser) ?? localUser.photoUri,
    passwordHash,
  });
}

async function cacheRemoteProfile(userId: number, profile: RemoteProfile) {
  return userRepository.upsertRemoteProfile({
    userId,
    remoteProfileId: profile.id,
    fullName: getRemoteProfileName(profile),
    age: profile.age ?? null,
    sex: profile.sex ?? null,
    height: profile.height ?? null,
    notes: profile.notes ?? null,
  });
}

async function refreshRemoteProfiles(userId: number) {
  const remoteProfiles = await listRemoteProfiles();
  const cachedProfiles = await Promise.all(
    remoteProfiles.map((profile) => cacheRemoteProfile(userId, profile))
  );

  if (cachedProfiles.length === 0) {
    const remoteProfile = await getRemoteProfile().catch(() => null);

    if (remoteProfile) {
      return [await cacheRemoteProfile(userId, remoteProfile)];
    }
  }

  return cachedProfiles;
}

function mergeProfileLists(localProfiles: AuthProfile[], remoteProfiles: AuthProfile[]) {
  const mergedProfiles = [...localProfiles];

  for (const remoteProfile of remoteProfiles) {
    const existingIndex = mergedProfiles.findIndex((localProfile) => {
      if (localProfile.id === remoteProfile.id) {
        return true;
      }

      return Boolean(
        localProfile.remoteProfileId &&
          remoteProfile.remoteProfileId &&
          localProfile.remoteProfileId === remoteProfile.remoteProfileId
      );
    });

    if (existingIndex >= 0) {
      mergedProfiles[existingIndex] = remoteProfile;
    } else {
      mergedProfiles.push(remoteProfile);
    }
  }

  return mergedProfiles.sort((firstProfile, secondProfile) => {
    const firstTime = new Date(firstProfile.updatedAt).getTime();
    const secondTime = new Date(secondProfile.updatedAt).getTime();

    if (Number.isFinite(firstTime) && Number.isFinite(secondTime) && firstTime !== secondTime) {
      return secondTime - firstTime;
    }

    if (Number.isFinite(firstTime) && !Number.isFinite(secondTime)) {
      return -1;
    }

    if (!Number.isFinite(firstTime) && Number.isFinite(secondTime)) {
      return 1;
    }

    return secondProfile.id - firstProfile.id;
  });
}

export async function hasRegisteredUser() {
  return (await userRepository.getCount()) > 0;
}

export async function restoreSessionUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  const user = await userRepository.getById(userId);

  if (!user) {
    return user;
  }

  const remoteUser = await getRemoteAuthenticatedUser().catch(() => null);
  const cachedUser = await cacheRemoteUser(user.id, remoteUser);

  if (cachedUser && remoteUser) {
    await refreshRemoteProfiles(cachedUser.id).catch(() => []);
    return mapRemoteUserToLocalUser(remoteUser, cachedUser);
  }

  return user;
}

export async function getLocalBiometricLoginUser() {
  return userRepository.getFirstUser();
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

  if (accountUsage === 'personal' && !input.sex?.trim()) {
    throw new Error('Informe o sexo.');
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
    sex: accountUsage === 'personal' ? input.sex : null,
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
    profileAge: accountUsage === 'personal' ? input.age : null,
    profileSex: accountUsage === 'personal' ? input.sex : null,
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

  let remoteProfileId =
    remoteAuth.profileId ?? remoteContext?.profileId ?? (await getRemoteProfileId().catch(() => null));

  if (!remoteProfileId && accountUsage === 'personal') {
    remoteProfileId = (await createRemoteProfile({
      fullName: name,
      age: input.age,
      sex: input.sex,
      height: input.height,
      notes: null,
    }).catch(() => null))?.id ?? null;
  }

  if (remoteProfileId) {
    await setSessionProfileId(remoteProfileId);
    await userRepository.updateFirstProfileRemoteId(user.id, remoteProfileId);
  }

  await refreshRemoteProfiles(user.id).catch(() => []);
  await setSessionUserId(user.id);
  void syncPendingRecords();
  return mapRemoteUserToLocalUser(mergeRemoteUsers(remoteAuth.user, remoteContext?.user), user);
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

  const remoteUser = mergeRemoteUsers(
    remoteAuth.user,
    remoteContext?.user,
    await getRemoteAuthenticatedUser().catch(() => null)
  );
  const record = await userRepository.getCredentialRecordByEmail(email);
  let user: AuthUser | null = null;

  if (record) {
    const accountUsage = normalizeAccountUsage(remoteUser?.account_usage, record.account_usage ?? 'personal');
    user = await userRepository.updateUserAccount(record.id, {
      name: remoteUser?.name ?? record.name,
      email,
      accountUsage,
      age: getRemoteUserAge(remoteUser) ?? record.age,
      photoUri: getRemoteUserPhotoUri(remoteUser) ?? record.photo_uri,
      passwordHash: await hashSecret(input.password),
    });

    if (remoteProfileId) {
      await userRepository.updateFirstProfileRemoteId(user.id, remoteProfileId);
    }

    if (input.resetLocalPin) {
      user = await userRepository.clearPinHash(user.id);
    }
  } else {
    if (localUserCount > 0) {
      throw new Error('Este aparelho ja possui uma conta principal cadastrada.');
    }

    const remoteProfiles = await listRemoteProfiles().catch(() => []);
    const inferredAccountUsage = inferAccountUsageForNewDevice(remoteUser, remoteProfiles);

    user = await userRepository.createUserWithProfile({
      accountUsage: inferredAccountUsage,
      name: remoteUser?.name ?? email,
      email,
      age: getRemoteUserAge(remoteUser),
      passwordHash: await hashSecret(input.password),
      pinHash: null,
      useBiometric: false,
      photoUri: getRemoteUserPhotoUri(remoteUser),
      remoteProfileId,
      createInitialProfile: inferredAccountUsage === 'personal',
    });

  }

  await setSessionUserId(user.id);
  await refreshRemoteProfiles(user.id).catch(() => []);
  await pullRemoteRecords().catch(() => undefined);
  void syncPendingRecords();
  return mapRemoteUserToLocalUser(remoteUser, user);
}

function inferAccountUsageForNewDevice(remoteUser: RemoteUser | null, remoteProfiles: RemoteProfile[]): AccountUsage {
  const explicitAccountUsage = normalizeAccountUsage(remoteUser?.account_usage, 'professional');

  if (explicitAccountUsage !== 'professional') {
    return explicitAccountUsage;
  }

  if (remoteProfiles.length === 0) {
    return 'family';
  }

  const remoteUserName = remoteUser?.name?.trim().toLowerCase();
  const hasOwnProfile = Boolean(
    remoteUserName &&
    remoteProfiles.some((profile) => getRemoteProfileName(profile)?.trim().toLowerCase() === remoteUserName)
  );

  return hasOwnProfile ? 'personal' : 'family';
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

  const remoteUser = await getRemoteAuthenticatedUser().catch(() => null);
  const cachedUser = await cacheRemoteUser(user.id, remoteUser);
  return mapRemoteUserToLocalUser(remoteUser, cachedUser ?? user);
}

export async function setLocalUnlockPin(userId: number, pin: string): Promise<AuthUser> {
  const normalizedPin = pin.trim();

  if (!(normalizedPin.length === 4 || normalizedPin.length === 6) || !/^\d+$/.test(normalizedPin)) {
    throw new Error('O PIN deve ter 4 ou 6 dígitos numéricos.');
  }

  return userRepository.updatePinHash(userId, await hashSecret(normalizedPin));
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

    if (isManagedProfilePhotoUri(input.photoUri)) {
      await removeManagedProfilePhoto(input.photoUri);
    }
  }

  if (!photoUri && record.photo_uri) {
    await deleteRemoteAvatar();
  }

  const remoteUser = await updateRemoteAuthenticatedUser({
    name,
    email,
    currentPassword,
    newPassword,
  });
  const passwordHash = newPassword ? await hashSecret(newPassword) : undefined;
  const cachedUser = await userRepository.updateUserAccount(userId, {
    name,
    email: normalizeEmail(remoteUser.email ?? email),
    age: getRemoteUserAge(remoteUser) ?? record.age,
    photoUri: getRemoteUserPhotoUri(remoteUser) ?? photoUri,
    passwordHash,
  });

  return mapRemoteUserToLocalUser(remoteUser, cachedUser);
}

export async function getAccountProfiles(userId: number): Promise<AuthProfile[]> {
  const localProfiles = await userRepository.getProfilesByUserId(userId);

  try {
    const remoteProfiles = await refreshRemoteProfiles(userId);
    return mergeProfileLists(localProfiles, remoteProfiles);
  } catch {
    return localProfiles;
  }
}

export async function getAccountProfileById(profileId: number): Promise<AuthProfile | null> {
  const localProfile = await userRepository.getProfileById(profileId);

  if (!localProfile?.remoteProfileId) {
    return localProfile;
  }

  const remoteProfile = await getRemoteProfile(localProfile.remoteProfileId).catch(() => null);
  return remoteProfile ? cacheRemoteProfile(localProfile.userId, remoteProfile) : localProfile;
}

export async function getActiveAccountProfileId() {
  return getActiveLocalProfileId();
}

export async function getActiveAccountProfile() {
  const profileId = await getActiveLocalProfileId();

  if (profileId) {
    return getAccountProfileById(profileId);
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  const profiles = await refreshRemoteProfiles(userId).catch(() => []);
  return profiles[0] ?? userRepository.getProfileByUserId(userId);
}

export async function setActiveAccountProfile(profileId: number) {
  await setActiveLocalProfileId(profileId);
}

export async function updateActiveAccountProfile(input: {
  sex?: string | null;
  height?: number | null;
}): Promise<AuthProfile | null> {
  const profileId = await getActiveLocalProfileId();

  if (!profileId) {
    return null;
  }

  if (input.height !== null && input.height !== undefined && (input.height < 30 || input.height > 250)) {
    throw new Error('Informe uma altura valida em centimetros.');
  }

  const localProfile = await userRepository.getProfileById(profileId);
  const remoteProfile = await updateRemoteProfile(localProfile?.remoteProfileId ?? null, input);

  if (!remoteProfile || !localProfile) {
    return localProfile ? userRepository.updateProfile(localProfile.id, input) : null;
  }

  return cacheRemoteProfile(localProfile.userId, remoteProfile);
}

export async function updateAccountProfile(profileId: number, input: {
  fullName: string;
  age: number;
  sex: string;
  height: number;
  notes?: string | null;
}): Promise<AuthProfile> {
  if (!input.fullName.trim()) {
    throw new Error('Informe o nome do acompanhado.');
  }

  if (input.age < 1 || input.age > 130) {
    throw new Error('Informe uma idade valida.');
  }

  if (!input.sex.trim()) {
    throw new Error('Informe o sexo.');
  }

  if (input.height < 30 || input.height > 250) {
    throw new Error('Informe uma altura valida em centimetros.');
  }

  const localProfile = await userRepository.getProfileById(profileId);

  if (!localProfile) {
    throw new Error('Perfil não encontrado.');
  }

  const remoteProfile = await updateRemoteProfile(localProfile.remoteProfileId, input);

  if (!remoteProfile) {
    throw new Error('Falha ao atualizar perfil na nuvem.');
  }

  return cacheRemoteProfile(localProfile.userId, remoteProfile);
}

export async function deleteAccountProfile(userId: number, profileId: number): Promise<void> {
  const user = await userRepository.getById(userId);

  if (!user) {
    throw new Error('Conta não encontrada.');
  }

  if (user.accountUsage === 'personal') {
    throw new Error('Contas pessoais não podem excluir o perfil principal.');
  }

  const profile = await userRepository.getProfileById(profileId);

  if (!profile?.remoteProfileId) {
    throw new Error('Perfil remoto não encontrado.');
  }

  await deleteRemoteProfile(profile.remoteProfileId);
  await userRepository.deleteProfile(profileId, userId);
}

export async function createAccountProfile(input: {
  userId: number;
  fullName: string;
  age: number;
  sex: string;
  height: number;
  notes?: string | null;
}): Promise<AuthProfile> {
  const user = await userRepository.getById(input.userId);

  if (!user) {
    throw new Error('Conta não encontrada.');
  }

  if (user.accountUsage === 'personal') {
    throw new Error('Contas pessoais usam somente o perfil da propria conta.');
  }

  if (input.age < 1 || input.age > 130) {
    throw new Error('Informe uma idade valida.');
  }

  if (!input.sex.trim()) {
    throw new Error('Informe o sexo.');
  }

  if (input.height < 30 || input.height > 250) {
    throw new Error('Informe uma altura valida em centimetros.');
  }

  const remoteProfile = await createRemoteProfile(input);

  if (!remoteProfile) {
    throw new Error('Falha ao cadastrar acompanhado na nuvem.');
  }

  return cacheRemoteProfile(input.userId, remoteProfile);
}
