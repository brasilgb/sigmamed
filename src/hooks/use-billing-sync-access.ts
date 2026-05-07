import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  getBillingSyncAccess,
  isBillingSyncEnabled,
  type BillingSyncAccess,
} from '@/services/billing.service';
import { syncCloudRecordsAfterActivation } from '@/services/cloud-sync-orchestrator.service';

type UseBillingSyncAccessOptions = {
  enabled: boolean;
};

export function useBillingSyncAccess({ enabled }: UseBillingSyncAccessOptions) {
  const [syncAccess, setSyncAccess] = useState<BillingSyncAccess | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function applySyncAccess(access: BillingSyncAccess) {
    setSyncAccess(access);

    if (isBillingSyncEnabled(access)) {
      void syncCloudRecordsAfterActivation();
    }
  }

  const refreshSyncAccess = useCallback(async () => {
    if (!enabled) {
      setSyncAccess(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);

    try {
      const access = await getBillingSyncAccess();
      applySyncAccess(access);
      return access;
    } catch {
      setSyncAccess(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function refreshOnFocus() {
        if (!enabled) {
          setSyncAccess(null);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);

        try {
          const access = await getBillingSyncAccess();

          if (isActive) {
            applySyncAccess(access);
          }
        } catch {
          if (isActive) {
            setSyncAccess(null);
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      void refreshOnFocus();

      return () => {
        isActive = false;
      };
    }, [enabled])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refreshSyncAccess();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshSyncAccess]);

  return {
    isLoading,
    refreshSyncAccess,
    syncAccess,
  };
}
