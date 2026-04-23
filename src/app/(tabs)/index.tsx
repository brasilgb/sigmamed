import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { HistoryList } from '@/components/dashboard/history-list';
import { MetricPreview } from '@/components/dashboard/metric-preview';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { formatDateTime } from '@/utils/date';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { error, history, isLoading, refresh, summary } = useDashboardData();

  return (
    <Screen isRefreshing={isLoading} onRefresh={refresh}>
      <View style={styles.hero}>
        <ThemedText style={styles.kicker}>SigmaMed</ThemedText>
        <ThemedText type="title" style={styles.title}>
          Monitoramento simples para casa, mesmo offline.
        </ThemedText>
        <ThemedText style={styles.description}>
          {user ? `${user.name.split(' ')[0]}, ` : ''}
          registre pressao, glicose, peso e medicacoes com historico local primeiro.
        </ThemedText>
      </View>

      {summary ? (
        <>
          <View style={styles.summaryGrid}>
            <SummaryCard
              label="Registros totais"
              value={String(summary.totalReadings)}
              tone="default"
            />
            <SummaryCard
              label="Aderencia hoje"
              value={`${summary.adherenceToday}%`}
              tone="accent"
            />
          </View>

          <View style={styles.summaryGrid}>
            <SummaryCard
              label="Pressao em 7 dias"
              value={String(summary.pressureLastSevenDays)}
              tone="success"
            />
            <SummaryCard
              label="Medicacoes ativas"
              value={String(summary.activeMedications)}
            />
          </View>

          <MetricPreview
            label="Ultima pressao"
            value={
              summary.latestPressure
                ? `${summary.latestPressure.systolic}/${summary.latestPressure.diastolic} mmHg`
                : 'Sem leitura'
            }
            detail={
              summary.latestPressure
                ? `Atualizado em ${formatDateTime(summary.latestPressure.measuredAt)}`
                : 'Crie o primeiro registro para iniciar o acompanhamento.'
            }
          />

          <View style={styles.metricRow}>
            <View style={styles.metricTile}>
              <ThemedText style={styles.metricLabel}>Glicose recente</ThemedText>
              <ThemedText style={styles.metricValue}>
                {summary.latestGlicose
                  ? `${summary.latestGlicose.glicoseValue} ${summary.latestGlicose.unit}`
                  : 'Sem dado'}
              </ThemedText>
            </View>
            <View style={styles.metricTile}>
              <ThemedText style={styles.metricLabel}>Peso recente</ThemedText>
              <ThemedText style={styles.metricValue}>
                {summary.latestWeight
                  ? `${summary.latestWeight.weight} ${summary.latestWeight.unit}`
                  : 'Sem dado'}
              </ThemedText>
            </View>
          </View>
        </>
      ) : null}

      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Historico recente
        </ThemedText>
        <ThemedText style={styles.sectionHint}>Puxe para atualizar</ThemedText>
      </View>

      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : <HistoryList items={history} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 8,
    borderRadius: 32,
    backgroundColor: '#17303a',
    padding: 24,
  },
  kicker: {
    color: '#98c6ce',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 12,
    lineHeight: 16,
  },
  title: {
    color: '#ffffff',
    lineHeight: 38,
  },
  description: {
    color: '#c2d6db',
    fontSize: 16,
    lineHeight: 24,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricTile: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 18,
    gap: 6,
  },
  metricLabel: {
    color: '#5f747c',
    fontSize: 14,
    lineHeight: 20,
  },
  metricValue: {
    color: '#17303a',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: '#17303a',
  },
  sectionHint: {
    color: '#688089',
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: '#a34343',
  },
});
