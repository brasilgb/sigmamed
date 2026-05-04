import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  getAccountProfiles,
  getActiveAccountProfileId,
  setActiveAccountProfile,
} from '@/features/auth/services/auth.service';
import type { AuthProfile } from '@/features/auth/types/auth';

export function useProfileNames() {
  const { user } = useAuth();
  const shouldShowProfileNames = user?.accountUsage !== 'personal';
  const [profiles, setProfiles] = useState<AuthProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);

  const refreshProfileNames = useCallback(async () => {
    if (!user || !shouldShowProfileNames) {
      setProfiles([]);
      setActiveProfileId(null);
      return;
    }

    const [profileRows, currentProfileId] = await Promise.all([
      getAccountProfiles(user.id),
      getActiveAccountProfileId(),
    ]);
    setProfiles(profileRows);
    setActiveProfileId(currentProfileId);
  }, [shouldShowProfileNames, user]);

  useEffect(() => {
    void refreshProfileNames();
  }, [refreshProfileNames]);

  const selectActiveProfile = useCallback(async (profileId: number) => {
    await setActiveAccountProfile(profileId);
    setActiveProfileId(profileId);
  }, []);

  const profileNames = useMemo(() => {
    return new Map(
      profiles.map((profile) => [
        profile.id,
        profile.fullName?.trim() || 'Acompanhado sem nome',
      ])
    );
  }, [profiles]);

  const getProfileName = useCallback(
    (profileId: number | null | undefined) => {
      if (!shouldShowProfileNames || !profileId) {
        return null;
      }

      return profileNames.get(profileId) ?? 'Acompanhado';
    },
    [profileNames, shouldShowProfileNames]
  );

  return {
    activeProfileId,
    activeProfileName: getProfileName(activeProfileId),
    getProfileName,
    profiles,
    refreshProfileNames,
    selectActiveProfile,
    shouldShowProfileNames,
  };
}
