import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { MedicationRepository } from '@/features/medications/medication.repository';
import type { Medication } from '@/types/health';

const medicationRepository = new MedicationRepository();

export function useMedications() {
  const [items, setItems] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const rows = await medicationRepository.listActive();
      setItems(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar medicacoes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logStatus = useCallback(
    async (medicationId: number, status: 'taken' | 'skipped') => {
      const now = new Date().toISOString();

      await medicationRepository.createLog({
        medicationId,
        scheduledAt: now,
        takenAt: status === 'taken' ? now : null,
        status,
      });

      await refresh();
    },
    [refresh]
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return {
    items,
    isLoading,
    error,
    refresh,
    logStatus,
  };
}
