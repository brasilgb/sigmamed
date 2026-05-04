import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Screen } from '@/components/ui/screen';
import { Colors, ModulePalette, Radius, Space } from '@/constants/theme';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useProfileNames } from '@/hooks/use-profile-names';
import { useRecordManagement } from '@/hooks/use-record-management';
import { formatDateTime } from '@/utils/date';

export default function PressureTabScreen() {
  const { summary, refresh: refreshDashboard, isLoading: dashboardLoading } = useDashboardData(7);
  const { pressureReadings, refresh: refreshRecords, isLoading: recordsLoading } = useRecordManagement();
  const { getProfileName, refreshProfileNames } = useProfileNames();

  async function handleRefresh() {
    await Promise.all([refreshDashboard(), refreshRecords(), refreshProfileNames()]);
  }

  const latest = pressureReadings[0];
  const latestProfileName = getProfileName(latest?.profileId);

  return (
    <Screen isRefreshing={dashboardLoading || recordsLoading} onRefresh={handleRefresh}>
      <View style={[styles.hero, { backgroundColor: ModulePalette.pressure.soft }]}>
        <View style={styles.heroHeader}>
          <ThemedText style={[styles.eyebrow, { color: ModulePalette.pressure.base }]}>Módulo de pressão</ThemedText>
          <ThemedText type="title" style={styles.heroTitle}>
            Leituras organizadas, com acesso rápido ao cadastro.
          </ThemedText>
          <ThemedText style={styles.heroText}>
            Centralize medidores, revise a última leitura e mantenha o histórico num lugar fixo.
          </ThemedText>
        </View>

        <View style={styles.heroStats}>
          <Card style={styles.statCard}>
            <ThemedText style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Ultima leitura</ThemedText>
            <ThemedText
              style={[styles.statValue, { color: ModulePalette.pressure.base }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}>
              {latest ? `${latest.systolic}/${latest.diastolic}` : '--'}
            </ThemedText>
            <ThemedText style={styles.statMeta}>
              {latest ? formatDateTime(latest.measuredAt) : 'Nenhum registro ainda'}
            </ThemedText>
            {latestProfileName ? (
              <ThemedText style={styles.profileMeta}>Acompanhado: {latestProfileName}</ThemedText>
            ) : null}
          </Card>
          <Card style={styles.statCard}>
            <ThemedText style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Nos últimos 7 dias</ThemedText>
            <ThemedText
              style={[styles.statValue, { color: ModulePalette.pressure.base }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}>
              {summary ? String(summary.pressureLastSevenDays) : '--'}
            </ThemedText>
            <ThemedText style={styles.statMeta}>leituras salvas</ThemedText>
          </Card>
        </View>

      </View>

      <View style={styles.section}>
        <SectionHeader title="Recentes" hint="Últimas 5 medições" />
        <AuthButton label="Adicionar nova leitura" onPress={() => router.push('/pressure-form')} />

        {pressureReadings.length > 0 ? (
          pressureReadings.map((item) => {
            const profileName = getProfileName(item.profileId);

            return (
              <Card key={item.id} style={styles.recordCard}>
                <Pressable
                  style={styles.recordPressable}
                  onPress={() => router.push({ pathname: '/pressure-form', params: { id: String(item.id) } })}>
                  <View style={styles.recordHeader}>
                    <View style={styles.recordCopy}>
                    <ThemedText style={styles.recordTitle}>{item.systolic}/{item.diastolic} mmHg</ThemedText>
                    <ThemedText style={styles.recordSubtitle}>
                      {item.pulse ? `Pulso ${item.pulse} bpm` : 'Pulso não informado'}
                    </ThemedText>
                    {profileName ? (
                      <ThemedText style={styles.profileMeta}>Acompanhado: {profileName}</ThemedText>
                    ) : null}
                    </View>
                    <AuthButton
                      label="Editar"
                      variant="secondary"
                      onPress={() => router.push({ pathname: '/pressure-form', params: { id: String(item.id) } })}
                      style={styles.editButton}
                    />
                  </View>
                  <ThemedText style={styles.recordMeta}>{formatDateTime(item.measuredAt)}</ThemedText>
                  {item.notes ? <ThemedText style={styles.recordNotes}>{item.notes}</ThemedText> : null}
                </Pressable>
              </Card>
            );
          })
        ) : (
          <Card style={styles.emptyCard}>
            <ThemedText style={styles.emptyTitle}>Nenhuma leitura de pressão ainda.</ThemedText>
            <ThemedText style={styles.emptyText}>
              Comece por uma medição manual para montar seu histórico.
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
    minWidth: 0,
    gap: 6,
  },
  statLabel: {
    color: Colors.light.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    includeFontPadding: false,
  },
  statMeta: {
    color: Colors.light.textSoft,
    fontSize: 13,
    lineHeight: 18,
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
  recordCopy: {
    flex: 1,
    gap: 4,
  },
  editButton: {
    minWidth: 84,
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
  profileMeta: {
    color: ModulePalette.pressure.base,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  recordNotes: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
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
