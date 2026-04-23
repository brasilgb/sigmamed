import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AlertsCard } from '@/components/dashboard/alerts-card';
import { ThemedText } from '@/components/themed-text';
import { useMedications } from '@/hooks/use-medications';
import { HistoryList } from '@/components/dashboard/history-list';
import { MetricPreview } from '@/components/dashboard/metric-preview';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { TrendCard } from '@/components/dashboard/trend-card';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { getDashboardAlerts } from '@/services/dashboard-alerts.service';
import type { DashboardAlert, MetricTrend } from '@/types/health';
import { formatDateTime } from '@/utils/date';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { error, history, isLoading, refresh, summary, trends } = useDashboardData(7);
  const { items: medications } = useMedications();
  const alerts = getDashboardAlerts(summary, trends);

  function handleAlertPress(alert: DashboardAlert) {
    if (alert.metric === 'medication') {
      router.push({
        pathname: '/explore',
        params: {
          recordFilter: 'medication',
          medicationStatusFilter: 'active',
          timeFilter: 'all',
        },
      });
      return;
    }

    if (alert.metric === 'pressure' || alert.metric === 'glicose' || alert.metric === 'weight') {
      router.push({
        pathname: '/explore',
        params: {
          recordFilter: alert.metric,
          timeFilter: '7d',
          recordSort: 'newest',
        },
      });
    }
  }

  function handleTrendPress(metric: MetricTrend) {
    router.push({
      pathname: '/explore',
      params: {
        recordFilter: metric.key,
        timeFilter: '7d',
        recordSort: 'newest',
      },
    });
  }

  function openExploreWithParams(params: {
    recordFilter?: 'all' | 'pressure' | 'glicose' | 'weight' | 'medication';
    timeFilter?: 'all' | '7d' | '30d';
    recordSort?: 'newest' | 'oldest' | 'highest';
    medicationStatusFilter?: 'all' | 'active' | 'inactive';
  }) {
    router.push({
      pathname: '/explore',
      params,
    });
  }

  function handleLatestPressurePress() {
    if (summary?.latestPressure) {
      router.push({ pathname: '/pressure-form', params: { id: String(summary.latestPressure.id) } });
      return;
    }

    router.push('/pressure-form');
  }

  function handleLatestGlicosePress() {
    if (summary?.latestGlicose) {
      router.push({ pathname: '/glicose-form', params: { id: String(summary.latestGlicose.id) } });
      return;
    }

    router.push('/glicose-form');
  }

  function handleLatestWeightPress() {
    if (summary?.latestWeight) {
      router.push({ pathname: '/weight-form', params: { id: String(summary.latestWeight.id) } });
      return;
    }

    router.push('/weight-form');
  }

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

      <View style={styles.quickActions}>
        <Pressable style={styles.actionCard} onPress={() => router.push('/pressure-form')}>
          <ThemedText style={styles.actionTitle}>Nova pressao</ThemedText>
          <ThemedText style={styles.actionText}>Registrar sistolica, diastolica e pulso.</ThemedText>
        </Pressable>
        <Pressable style={styles.actionCard} onPress={() => router.push('/glicose-form')}>
          <ThemedText style={styles.actionTitle}>Nova glicose</ThemedText>
          <ThemedText style={styles.actionText}>Salvar com contexto da medicao.</ThemedText>
        </Pressable>
        <Pressable style={styles.actionCard} onPress={() => router.push('/pressure-scan')}>
          <ThemedText style={styles.actionTitle}>Foto pressao</ThemedText>
          <ThemedText style={styles.actionText}>Capturar o visor e sugerir valores.</ThemedText>
        </Pressable>
        <Pressable style={styles.actionCard} onPress={() => router.push('/glicose-scan')}>
          <ThemedText style={styles.actionTitle}>Foto glicose</ThemedText>
          <ThemedText style={styles.actionText}>Ler o medidor e preencher o formulario.</ThemedText>
        </Pressable>
        <Pressable style={styles.actionCard} onPress={() => router.push('/weight-form')}>
          <ThemedText style={styles.actionTitle}>Novo peso</ThemedText>
          <ThemedText style={styles.actionText}>Atualizar pesagem em poucos toques.</ThemedText>
        </Pressable>
        <Pressable style={styles.actionCard} onPress={() => router.push('/medication-form')}>
          <ThemedText style={styles.actionTitle}>Nova medicacao</ThemedText>
          <ThemedText style={styles.actionText}>Cadastrar tratamento ativo.</ThemedText>
        </Pressable>
      </View>

      {summary ? (
        <>
          <View style={styles.summaryGrid}>
            <SummaryCard
              label="Registros totais"
              value={String(summary.totalReadings)}
              tone="default"
              onPress={() => openExploreWithParams({ recordFilter: 'all', timeFilter: 'all', recordSort: 'newest' })}
              actionLabel="Abrir historico"
            />
            <SummaryCard
              label="Aderencia hoje"
              value={`${summary.adherenceToday}%`}
              tone="accent"
              onPress={() =>
                openExploreWithParams({
                  recordFilter: 'medication',
                  medicationStatusFilter: 'active',
                  timeFilter: 'all',
                })}
              actionLabel="Ver medicacoes"
            />
          </View>

          <View style={styles.summaryGrid}>
            <SummaryCard
              label="Pressao em 7 dias"
              value={String(summary.pressureLastSevenDays)}
              tone="success"
              onPress={() => openExploreWithParams({ recordFilter: 'pressure', timeFilter: '7d', recordSort: 'newest' })}
              actionLabel="Ver pressao"
            />
            <SummaryCard
              label="Medicacoes ativas"
              value={String(summary.activeMedications)}
              onPress={() =>
                openExploreWithParams({
                  recordFilter: 'medication',
                  medicationStatusFilter: 'active',
                  timeFilter: 'all',
                })}
              actionLabel="Abrir lista"
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
            onPress={handleLatestPressurePress}
            actionLabel={summary.latestPressure ? 'Editar ultima leitura' : 'Criar leitura'}
          />

          <View style={styles.metricRow}>
            <Pressable style={styles.metricTile} onPress={handleLatestGlicosePress}>
              <ThemedText style={styles.metricLabel}>Glicose recente</ThemedText>
              <ThemedText style={styles.metricValue}>
                {summary.latestGlicose
                  ? `${summary.latestGlicose.glicoseValue} ${summary.latestGlicose.unit}`
                  : 'Sem dado'}
              </ThemedText>
              <ThemedText style={styles.metricAction}>
                {summary.latestGlicose ? 'Editar ultima leitura' : 'Criar leitura'}
              </ThemedText>
            </Pressable>
            <Pressable style={styles.metricTile} onPress={handleLatestWeightPress}>
              <ThemedText style={styles.metricLabel}>Peso recente</ThemedText>
              <ThemedText style={styles.metricValue}>
                {summary.latestWeight
                  ? `${summary.latestWeight.weight} ${summary.latestWeight.unit}`
                  : 'Sem dado'}
              </ThemedText>
              <ThemedText style={styles.metricAction}>
                {summary.latestWeight ? 'Editar ultima pesagem' : 'Criar pesagem'}
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.trendsSection}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Alertas rapidos
              </ThemedText>
              <ThemedText style={styles.sectionHint}>Heuristicas locais</ThemedText>
            </View>
            <AlertsCard alerts={alerts} onPressAlert={handleAlertPress} />
          </View>

          {trends ? (
            <View style={styles.trendsSection}>
              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Tendencias em 7 dias
                </ThemedText>
                <ThemedText style={styles.sectionHint}>Medias diarias</ThemedText>
              </View>
              <TrendCard metric={trends.pressure} onPress={handleTrendPress} actionLabel="Abrir leituras de pressao" />
              <TrendCard metric={trends.glicose} onPress={handleTrendPress} actionLabel="Abrir leituras de glicose" />
              <TrendCard metric={trends.weight} onPress={handleTrendPress} actionLabel="Abrir leituras de peso" />
            </View>
          ) : null}
        </>
      ) : null}

      {medications.length > 0 ? (
        <View style={styles.medicationCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Medicacoes ativas
          </ThemedText>
          {medications.slice(0, 3).map((medication) => (
            <View key={medication.id} style={styles.medicationRow}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.medicationName}>
                  {medication.name} {medication.dosage}
                </ThemedText>
                <ThemedText style={styles.medicationInstructions}>
                  {medication.instructions || 'Sem instrucoes cadastradas'}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
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
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    borderRadius: 22,
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 6,
  },
  actionTitle: {
    color: '#17303a',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  actionText: {
    color: '#5f747c',
    fontSize: 13,
    lineHeight: 18,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  trendsSection: {
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
  metricAction: {
    color: '#21438f',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  medicationCard: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 18,
    gap: 12,
  },
  medicationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  medicationName: {
    color: '#17303a',
    fontWeight: '700',
  },
  medicationInstructions: {
    color: '#5f747c',
    fontSize: 14,
    lineHeight: 20,
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
