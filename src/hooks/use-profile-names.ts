import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

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
  const activeProfileIdRef = useRef<number | null>(null);

  const applyActiveProfileId = useCallback((profileId: number | null) => {
    activeProfileIdRef.current = profileId;
    setActiveProfileId(profileId);
  }, []);

  const refreshProfileNames = useCallback(async () => {
    if (!user || !shouldShowProfileNames) {
      setProfiles([]);
      applyActiveProfileId(null);
      return;
    }

    try {
      const [profileRows, currentProfileId] = await Promise.all([
        getAccountProfiles(user.id),
        getActiveAccountProfileId(),
      ]);
      const previousProfileId = activeProfileIdRef.current;
      const hasProfile = (profileId: number | null) =>
        Boolean(profileId && profileRows.some((profile) => profile.id === profileId));
      const nextProfileId = hasProfile(currentProfileId)
        ? currentProfileId
        : hasProfile(previousProfileId)
          ? previousProfileId
          : null;

      setProfiles(profileRows);
      applyActiveProfileId(nextProfileId);
    } catch {
      // Mantem a ultima selecao visivel se a nuvem/local falhar momentaneamente.
    }
  }, [applyActiveProfileId, shouldShowProfileNames, user]);

  useEffect(() => {
    void refreshProfileNames();
  }, [refreshProfileNames]);

  useFocusEffect(
    useCallback(() => {
      void refreshProfileNames();
    }, [refreshProfileNames])
  );

  const selectActiveProfile = useCallback(async (profileId: number) => {
    applyActiveProfileId(profileId);
    await setActiveAccountProfile(profileId);
  }, [applyActiveProfileId]);

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
