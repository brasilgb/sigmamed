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

export default function GlicoseTabScreen() {
  const { summary, refresh: refreshDashboard, isLoading: dashboardLoading } = useDashboardData(7);
  const { glicoseReadings, refresh: refreshRecords, isLoading: recordsLoading } = useRecordManagement();

  async function handleRefresh() {
    await Promise.all([refreshDashboard(), refreshRecords()]);
  }

  const latest = glicoseReadings[0];

  return (
    <Screen isRefreshing={dashboardLoading || recordsLoading} onRefresh={handleRefresh}>
      <View style={[styles.hero, { backgroundColor: ModulePalette.glicose.soft }]}>
        <View style={styles.heroHeader}>
          <ThemedText style={[styles.eyebrow, { color: ModulePalette.glicose.base }]}>Modulo de glicose</ThemedText>
          <ThemedText type="title" style={styles.heroTitle}>
            Registros por contexto, com leitura manual ou por foto.
          </ThemedText>
          <ThemedText style={styles.heroText}>
            Jejum, pos-refeicao e leituras aleatorias ficam organizadas sem misturar origem e horario.
          </ThemedText>
        </View>

        <View style={styles.heroStats}>
          <Card style={styles.statCard}>
            <ThemedText style={styles.statLabel}>Ultima leitura</ThemedText>
            <ThemedText style={[styles.statValue, { color: ModulePalette.glicose.base }]}>
              {latest ? `${latest.glicoseValue} ${latest.unit}` : '--'}
            </ThemedText>
            <ThemedText style={styles.statMeta}>{latest ? latest.context : 'Sem contexto ainda'}</ThemedText>
          </Card>
          <Card style={styles.statCard}>
            <ThemedText style={styles.statLabel}>Nos ultimos 7 dias</ThemedText>
            <ThemedText style={[styles.statValue, { color: ModulePalette.glicose.base }]}>
              {summary ? String(summary.glicoseLastSevenDays) : '--'}
            </ThemedText>
            <ThemedText style={styles.statMeta}>leituras salvas</ThemedText>
          </Card>
        </View>

        <View style={styles.actionRow}>
          <AuthButton label="Nova leitura" onPress={() => router.push('/glicose-form')} style={styles.actionButton} />
          <AuthButton
            label="Ler por foto"
            variant="secondary"
            onPress={() => router.push('/glicose-scan')}
            style={styles.actionButton}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Recentes" hint="Ultimas 5 medicoes" />

        {glicoseReadings.length > 0 ? (
          glicoseReadings.map((item) => (
            <Card key={item.id} style={styles.recordCard}>
              <Pressable onPress={() => router.push({ pathname: '/glicose-form', params: { id: String(item.id) } })}>
              <View style={styles.recordHeader}>
                <View>
                  <ThemedText style={styles.recordTitle}>{item.glicoseValue} {item.unit}</ThemedText>
                  <ThemedText style={styles.recordSubtitle}>{item.context}</ThemedText>
                </View>
                <View style={[styles.badge, { backgroundColor: ModulePalette.glicose.soft }]}>
                  <ThemedText style={[styles.badgeText, { color: ModulePalette.glicose.base }]}>
                    {item.source === 'photo' ? 'Foto' : item.source === 'bluetooth' ? 'Bluetooth' : 'Manual'}
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
            <ThemedText style={styles.emptyTitle}>Nenhuma leitura de glicose ainda.</ThemedText>
            <ThemedText style={styles.emptyText}>
              Registre uma leitura manual ou use a captura por foto para preencher mais rapido.
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
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  recordTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: '800',
  },
  recordSubtitle: {
    color: Colors.light.textMuted,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  recordMeta: {
    color: Colors.light.textSoft,
    fontSize: 13,
  },
  recordNotes: {
    color: Colors.light.textMuted,
    fontSize: 14,
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
  },
  emptyText: {
    color: Colors.light.textMuted,
  },
});
