import { UserRepository } from '@/features/auth/repositories/user.repository';
import {
  clearSessionUserId,
  getSessionUserId,
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

  if (input.password.length < 6) {
    throw new Error('A senha precisa ter ao menos 6 caracteres.');
  }

  if (!(input.pin.length === 4 || input.pin.length === 6) || !/^\d+$/.test(input.pin)) {
    throw new Error('O PIN deve ter 4 ou 6 digitos numéricos.');
  }

  const user = await userRepository.createUserWithProfile({
    name,
    email,
    passwordHash: await hashSecret(input.password),
    pinHash: await hashSecret(input.pin),
    useBiometric: input.useBiometric,
  });

  await setSessionUserId(user.id);
  return user;
}

export async function loginUser(input: LoginInput): Promise<AuthUser> {
  const email = normalizeEmail(input.email);
  const record = await userRepository.getCredentialRecordByEmail(email);

  if (!record || !record.password_hash) {
    throw new Error('Conta nao encontrada.');
  }

  const isValid = await matchesSecret(input.password, record.password_hash);

  if (!isValid) {
    throw new Error('Senha incorreta.');
  }

  const user = await userRepository.getById(record.id);

  if (!user) {
    throw new Error('Falha ao iniciar sessao.');
  }

  await setSessionUserId(user.id);
  return user;
}

export async function unlockWithPin(userId: number, pin: string) {
  const record = await userRepository.getCredentialRecordById(userId);

  if (!record || !record.pin_hash) {
    throw new Error('PIN indisponivel para esta conta.');
  }

  const isValid = await matchesSecret(pin, record.pin_hash);

  if (!isValid) {
    throw new Error('PIN invalido.');
  }

  const user = await userRepository.getById(userId);

  if (!user) {
    throw new Error('Conta nao encontrada.');
  }

  return user;
}

export async function logoutUser() {
  await clearSessionUserId();
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
    throw new Error('Conta nao encontrada.');
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

  return userRepository.updateUserAccount(userId, {
    name,
    email,
    passwordHash: newPassword ? await hashSecret(newPassword) : undefined,
  });
}
