import * as Crypto from 'expo-crypto';

import { UserRepository } from '@/features/auth/repositories/user.repository';
import {
  getSessionAuthToken,
  getSessionProfileId,
  getSessionUserId,
  clearSessionProfileId,
  setSessionProfileId,
} from '@/features/auth/services/session-storage.service';
import { getRemoteProfileId } from '@/features/auth/services/auth-api.service';

const userRepository = new UserRepository();
let didWarnMissingRemoteProfile = false;

export function createSyncUuid() {
  return Crypto.randomUUID();
}

export async function getActiveProfileId() {
  const token = await getSessionAuthToken();
  const cachedProfileId = await getSessionProfileId();

  if (cachedProfileId) {
    return Number(cachedProfileId);
  }

  const fetchedProfileId = token ? await getRemoteProfileId().catch(() => null) : null;

  if (fetchedProfileId) {
    didWarnMissingRemoteProfile = false;
    await setSessionProfileId(fetchedProfileId);
    return Number(fetchedProfileId);
  }

  if (token) {
    await clearSessionProfileId();

    if (!didWarnMissingRemoteProfile) {
      didWarnMissingRemoteProfile = true;
      console.warn('Sync skipped: remote profile id was not found.');
    }

    return null;
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  const profile = await userRepository.getProfileByUserId(userId);
  return profile?.id ?? null;
}
