import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Screen } from '@/components/ui/screen';
import { Colors, ModulePalette, Radius, Space } from '@/constants/theme';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useRecordManagement } from '@/hooks/use-record-management';
import { formatDateTime } from '@/utils/date';

export default function PressureTabScreen() {
  const { summary, refresh: refreshDashboard, isLoading: dashboardLoading } = useDashboardData(7);
  const { pressureReadings, refresh: refreshRecords, isLoading: recordsLoading } = useRecordManagement();

  async function handleRefresh() {
    await Promise.all([refreshDashboard(), refreshRecords()]);
  }

  const latest = pressureReadings[0];

  return (
    <Screen isRefreshing={dashboardLoading || recordsLoading} onRefresh={handleRefresh}>
      <View style={[styles.hero, { backgroundColor: ModulePalette.pressure.soft }]}>
        <View style={styles.heroHeader}>
          <ThemedText style={[styles.eyebrow, { color: ModulePalette.pressure.base }]}>Modulo de pressao</ThemedText>
          <ThemedText type="title" style={styles.heroTitle}>
            Leituras organizadas, com acesso rapido ao cadastro.
          </ThemedText>
          <ThemedText style={styles.heroText}>
            Centralize medidores, revise a ultima leitura e mantenha o historico num lugar fixo.
          </ThemedText>
        </View>

        <View style={styles.heroStats}>
          <Card style={styles.statCard}>
            <ThemedText style={styles.statLabel}>Ultima leitura</ThemedText>
            <ThemedText style={[styles.statValue, { color: ModulePalette.pressure.base }]}>
              {latest ? `${latest.systolic}/${latest.diastolic}` : '--'}
            </ThemedText>
            <ThemedText style={styles.statMeta}>
              {latest ? formatDateTime(latest.measuredAt) : 'Nenhum registro ainda'}
            </ThemedText>
          </Card>
          <Card style={styles.statCard}>
            <ThemedText style={styles.statLabel}>Nos ultimos 7 dias</ThemedText>
            <ThemedText style={[styles.statValue, { color: ModulePalette.pressure.base }]}>
              {summary ? String(summary.pressureLastSevenDays) : '--'}
            </ThemedText>
            <ThemedText style={styles.statMeta}>leituras salvas</ThemedText>
          </Card>
        </View>

        <View style={styles.actionRow}>
          <AuthButton label="Nova leitura" onPress={() => router.push('/pressure-form')} style={styles.actionButton} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Recentes" hint="Ultimas 5 medicoes" />

        {pressureReadings.length > 0 ? (
          pressureReadings.map((item) => (
            <Card key={item.id} style={styles.recordCard}>
              <Pressable
                style={styles.recordPressable}
                onPress={() => router.push({ pathname: '/pressure-form', params: { id: String(item.id) } })}>
                <View style={styles.recordHeader}>
                  <View>
                    <ThemedText style={styles.recordTitle}>{item.systolic}/{item.diastolic} mmHg</ThemedText>
                    <ThemedText style={styles.recordSubtitle}>
                      {item.pulse ? `Pulso ${item.pulse} bpm` : 'Pulso nao informado'}
                    </ThemedText>
                  </View>
                  <View style={[styles.badge, { backgroundColor: ModulePalette.pressure.soft }]}>
                    <ThemedText style={[styles.badgeText, { color: ModulePalette.pressure.base }]}>
                      {item.source === 'bluetooth' ? 'Bluetooth' : 'Manual'}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.recordMeta}>{formatDateTime(item.measuredAt)}</ThemedText>
                {item.notes ? <ThemedText style={styles.recordNotes}>{item.notes}</ThemedText> : null}
              </Pressable>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <ThemedText style={styles.emptyTitle}>Nenhuma leitura de pressao ainda.</ThemedText>
            <ThemedText style={styles.emptyText}>
              Comece por uma medicao manual para montar seu historico.
            </ThemedText>
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.xl,
    padding: Space.xl,
    gap: 18,
    borderWidth: 1,
    borderColor: '#D7E7F0',
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
    lineHeight: 22,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    gap: 6,
  },
  statLabel: {
    color: Colors.light.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  statMeta: {
    color: Colors.light.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  section: {
    gap: 14,
  },
  recordCard: {
    padding: 0,
  },
  recordPressable: {
    padding: Space.md,
    gap: 8,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  recordTitle: {
    color: Colors.light.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  recordSubtitle: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  recordMeta: {
    color: Colors.light.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  recordNotes: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyCard: {
    gap: 8,
  },
  emptyTitle: {
    color: Colors.light.text,
    fontWeight: '700',
    lineHeight: 22,
  },
  emptyText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
  },
});
