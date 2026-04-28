import * as Crypto from 'expo-crypto';

import { UserRepository } from '@/features/auth/repositories/user.repository';
import {
  getSessionAuthToken,
  getSessionLocalProfileId,
  getSessionProfileId,
  getSessionUserId,
  clearSessionProfileId,
  setSessionLocalProfileId,
  setSessionProfileId,
} from '@/features/auth/services/session-storage.service';
import { getRemoteProfileId } from '@/features/auth/services/auth-api.service';

const userRepository = new UserRepository();
let didWarnMissingRemoteProfile = false;

export function createSyncUuid() {
  return Crypto.randomUUID();
}

export async function setActiveLocalProfileId(profileId: number) {
  await setSessionLocalProfileId(profileId);
}

export async function getActiveLocalProfileId() {
  const cachedProfileId = await getSessionLocalProfileId();
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  if (cachedProfileId) {
    const profiles = await userRepository.getProfilesByUserId(userId);
    const exists = profiles.some((profile) => profile.id === cachedProfileId);

    if (exists) {
      return cachedProfileId;
    }
  }

  const profile = await userRepository.getProfileByUserId(userId);

  if (!profile) {
    return null;
  }

  await setSessionLocalProfileId(profile.id);
  return profile.id;
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

export async function getRemoteProfileIdForLocalProfile(localProfileId: number | null | undefined) {
  if (!localProfileId) {
    return null;
  }

  const profile = await userRepository.getProfileById(localProfileId);

  if (profile?.remoteProfileId) {
    return profile.remoteProfileId;
  }

  const token = await getSessionAuthToken();
  const activeLocalProfileId = await getActiveLocalProfileId();

  if (!token || activeLocalProfileId !== localProfileId) {
    return null;
  }

  const fetchedProfileId = await getRemoteProfileId().catch(() => null);

  if (!fetchedProfileId) {
    return null;
  }

  await userRepository.updateProfileRemoteId(localProfileId, fetchedProfileId);
  return Number(fetchedProfileId);
}

export async function getLocalProfileIdForRemoteProfile(remoteProfileId: number | null | undefined) {
  if (!remoteProfileId) {
    return getActiveLocalProfileId();
  }

  const profile = await userRepository.getProfileByRemoteId(remoteProfileId);

  if (profile) {
    return profile.id;
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  const profiles = await userRepository.getProfilesByUserId(userId);
  const onlyLocalProfile = profiles.length === 1 ? profiles[0] : null;

  if (onlyLocalProfile && !onlyLocalProfile.remoteProfileId) {
    await userRepository.updateProfileRemoteId(onlyLocalProfile.id, remoteProfileId);
    return onlyLocalProfile.id;
  }

  return null;
}
