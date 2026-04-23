import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getDashboardSummary, getDashboardTrends, getRecentHistory } from '@/services/dashboard.service';
import type { DashboardSummary, DashboardTrends, HistoryItem } from '@/types/health';

type DashboardState = {
  isLoading: boolean;
  error: string | null;
  summary: DashboardSummary | null;
  trends: DashboardTrends | null;
  history: HistoryItem[];
  refresh: () => Promise<void>;
};

export function useDashboardData(trendDays: 7 | 30 = 7): DashboardState {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [summaryData, historyData, trendData] = await Promise.all([
        getDashboardSummary(),
        getRecentHistory(),
        getDashboardTrends(trendDays),
      ]);
      setSummary(summaryData);
      setHistory(historyData);
      setTrends(trendData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [trendDays]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return {
    isLoading,
    error,
    summary,
    trends,
    history,
    refresh,
  };
}
