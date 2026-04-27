import { UserRepository } from '@/features/auth/repositories/user.repository';
import {
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
import {
  clearRemoteSession,
  clearSessionUserId,
  getSessionUserId,
  setSessionAuthToken,
  setSessionProfileId,
  setSessionTenantId,
  setSessionUserId,
} from '@/features/auth/services/session-storage.service';
import { hashSecret, matchesSecret } from '@/features/auth/services/security.service';
import type { AuthUser, LoginInput, RegisterInput, UpdateAccountInput } from '@/features/auth/types/auth';

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
  const name = input.name.trim();
  const email = normalizeEmail(input.email);

  if (!name) {
    throw new Error('Informe seu nome.');
  }

  if (!email) {
    throw new Error('Informe seu e-mail.');
  }

  if (!input.age || input.age < 1 || input.age > 130) {
    throw new Error('Informe uma idade válida.');
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
    name,
    email,
    age: input.age,
    password: input.password,
  });

  const user = await userRepository.createUserWithProfile({
    name,
    email,
    passwordHash: await hashSecret(input.password),
    pinHash: await hashSecret(input.pin),
    useBiometric: input.useBiometric,
    age: getRemoteUserAge(remoteAuth.user) ?? input.age,
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
  }

  await setSessionUserId(user.id);
  void syncPendingRecords();
  return user;
}

export async function loginUser(input: LoginInput): Promise<AuthUser> {
  const email = normalizeEmail(input.email);

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
  } else {
    const pin = input.pin?.trim() ?? '';

    if (!(pin.length === 4 || pin.length === 6) || !/^\d+$/.test(pin)) {
      throw new Error('Informe um PIN de 4 ou 6 dígitos para este aparelho.');
    }

    user = await userRepository.createUserWithProfile({
      name: remoteUser?.name ?? email,
      email,
      age: getRemoteUserAge(remoteUser),
      passwordHash: await hashSecret(input.password),
      pinHash: await hashSecret(pin),
      useBiometric: false,
      photoUri: getRemoteUserPhotoUri(remoteUser),
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
