import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  getAccountProfiles,
  setActiveAccountProfile,
} from '@/features/auth/services/auth.service';
import type { AuthProfile } from '@/features/auth/types/auth';

type UseProfileSelectionOptions = {
  enabled?: boolean;
};

export function useProfileSelection({ enabled = true }: UseProfileSelectionOptions = {}) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<AuthProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const shouldSelectProfile = enabled && user?.accountUsage !== 'personal';

  const visibleProfiles = useMemo(() => {
    if (!user || user.accountUsage === 'personal') {
      return profiles;
    }

    return profiles.filter((profile) => (profile.fullName ?? '').trim() !== user.name.trim());
  }, [profiles, user]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfiles() {
      if (!user || !shouldSelectProfile) {
        setProfiles([]);
        setSelectedProfileId(null);
        return;
      }

      const profileRows = await getAccountProfiles(user.id).catch(() => []);

      if (!isMounted) {
        return;
      }

      setProfiles(profileRows);
      setSelectedProfileId(null);
    }

    void loadProfiles();

    return () => {
      isMounted = false;
    };
  }, [shouldSelectProfile, user]);

  const applySelectedProfile = useCallback(async () => {
    if (!shouldSelectProfile) {
      return;
    }

    if (!selectedProfileId) {
      throw new Error('Selecione um acompanhado antes de salvar.');
    }

    await setActiveAccountProfile(selectedProfileId);
  }, [selectedProfileId, shouldSelectProfile]);

  return {
    applySelectedProfile,
    profiles: visibleProfiles,
    selectedProfileId,
    setSelectedProfileId,
    shouldSelectProfile,
  };
}
