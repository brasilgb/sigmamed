import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Colors, ModulePalette } from '@/constants/theme';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useRecordManagement } from '@/hooks/use-record-management';
import { formatDateTime } from '@/utils/date';

export default function WeightTabScreen() {
  const { summary, refresh: refreshDashboard, isLoading: dashboardLoading } = useDashboardData(7);
  const { weightReadings, refresh: refreshRecords, isLoading: recordsLoading } = useRecordManagement();

  async function handleRefresh() {
    await Promise.all([refreshDashboard(), refreshRecords()]);
  }

  const latest = weightReadings[0];

  return (
    <Screen isRefreshing={dashboardLoading || recordsLoading} onRefresh={handleRefresh}>
      <View style={[styles.hero, { backgroundColor: ModulePalette.weight.soft }]}>
        <View style={styles.heroHeader}>
          <ThemedText style={[styles.eyebrow, { color: ModulePalette.weight.base }]}>Modulo de peso</ThemedText>
          <ThemedText type="title" style={styles.heroTitle}>
            Acompanhamento simples da evolucao corporal.
          </ThemedText>
          <ThemedText style={styles.heroText}>
            Veja a ultima pesagem, atualize rapidamente e mantenha a serie historica consolidada.
          </ThemedText>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel}>Ultima pesagem</ThemedText>
            <ThemedText style={[styles.statValue, { color: ModulePalette.weight.base }]}>
              {latest ? `${latest.weight} ${latest.unit}` : '--'}
            </ThemedText>
            <ThemedText style={styles.statMeta}>
              {latest ? formatDateTime(latest.measuredAt) : 'Nenhum registro ainda'}
            </ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel}>Nos ultimos 7 dias</ThemedText>
            <ThemedText style={[styles.statValue, { color: ModulePalette.weight.base }]}>
              {summary ? String(summary.weightLastSevenDays) : '--'}
            </ThemedText>
            <ThemedText style={styles.statMeta}>pesagens salvas</ThemedText>
          </View>
        </View>

        <AuthButton label="Nova pesagem" onPress={() => router.push('/weight-form')} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Recentes
          </ThemedText>
          <ThemedText style={styles.sectionHint}>Ultimas 5 pesagens</ThemedText>
        </View>

        {weightReadings.length > 0 ? (
          weightReadings.map((item) => (
            <Pressable
              key={item.id}
              style={styles.recordCard}
              onPress={() => router.push({ pathname: '/weight-form', params: { id: String(item.id) } })}>
              <ThemedText style={styles.recordTitle}>{item.weight} {item.unit}</ThemedText>
              <ThemedText style={styles.recordMeta}>{formatDateTime(item.measuredAt)}</ThemedText>
              {item.notes ? <ThemedText style={styles.recordNotes}>{item.notes}</ThemedText> : null}
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.emptyTitle}>Nenhuma pesagem registrada.</ThemedText>
            <ThemedText style={styles.emptyText}>
              Adicione sua primeira pesagem para acompanhar variacoes com mais clareza.
            </ThemedText>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 30,
    padding: 22,
    gap: 18,
  },
  heroHeader: {
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: Colors.light.text,
    lineHeight: 36,
  },
  heroText: {
    color: Colors.light.textMuted,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: Colors.light.surface,
    padding: 16,
    gap: 6,
  },
  statLabel: {
    color: Colors.light.textMuted,
    fontSize: 13,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  statMeta: {
    color: Colors.light.textSoft,
    fontSize: 13,
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: Colors.light.text,
  },
  sectionHint: {
    color: Colors.light.textSoft,
    fontSize: 13,
  },
  recordCard: {
    borderRadius: 24,
    backgroundColor: Colors.light.surface,
    padding: 18,
    gap: 8,
  },
  recordTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: '800',
  },
  recordMeta: {
    color: Colors.light.textSoft,
    fontSize: 13,
  },
  recordNotes: {
    color: Colors.light.textMuted,
    fontSize: 14,
  },
  emptyCard: {
    borderRadius: 24,
    backgroundColor: Colors.light.surface,
    padding: 18,
    gap: 8,
  },
  emptyTitle: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  emptyText: {
    color: Colors.light.textMuted,
  },
});
