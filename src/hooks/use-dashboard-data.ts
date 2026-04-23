import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getDashboardSummary, getRecentHistory } from '@/services/dashboard.service';
import type { DashboardSummary, HistoryItem } from '@/types/health';

type DashboardState = {
  isLoading: boolean;
  error: string | null;
  summary: DashboardSummary | null;
  history: HistoryItem[];
  refresh: () => Promise<void>;
};

export function useDashboardData(): DashboardState {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [summaryData, historyData] = await Promise.all([
        getDashboardSummary(),
        getRecentHistory(),
      ]);
      setSummary(summaryData);
      setHistory(historyData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return {
    isLoading,
    error,
    summary,
    history,
    refresh,
  };
}
