import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Colors, ModulePalette } from '@/constants/theme';
import { formatBodyMassIndex, formatHeight } from '@/features/weight/weight-utils';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useProfileNames } from '@/hooks/use-profile-names';
import { useRecordManagement } from '@/hooks/use-record-management';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDateTime } from '@/utils/date';

export default function WeightTabScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { summary, refresh: refreshDashboard, isLoading: dashboardLoading } = useDashboardData(7);
  const { weightReadings, refresh: refreshRecords, isLoading: recordsLoading, deleteWeight } = useRecordManagement();
  const { getProfileName, refreshProfileNames } = useProfileNames();

  async function handleRefresh() {
    await Promise.all([refreshDashboard(), refreshRecords(), refreshProfileNames()]);
  }

  function confirmDeleteReading(readingId: number) {
    Alert.alert(
      'Excluir medição',
      'Deseja excluir esta pesagem? Essa alteração também será sincronizada com a nuvem quando disponível.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await deleteWeight(readingId);
              await Promise.all([refreshDashboard(), refreshRecords()]);
            })();
          },
        },
      ]
    );
  }

  const latest = weightReadings[0];
  const latestProfileName = getProfileName(latest?.profileId);

  return (
    <Screen isRefreshing={dashboardLoading || recordsLoading} onRefresh={handleRefresh}>
      <View style={[styles.hero, { backgroundColor: ModulePalette.weight.soft }]}>
        <View style={styles.heroHeader}>
          <ThemedText style={[styles.eyebrow, { color: ModulePalette.weight.base }]}>Modulo de peso</ThemedText>
          <ThemedText type="title" style={styles.heroTitle}>
            Acompanhamento simples da evolução corporal.
          </ThemedText>
          <ThemedText style={styles.heroText}>
            Veja a última pesagem, atualize rapidamente e mantenha a série histórica consolidada.
          </ThemedText>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Ultima pesagem</ThemedText>
            <ThemedText
              style={[styles.statValue, { color: ModulePalette.weight.base }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}>
              {latest ? `${latest.weight} ${latest.unit}` : '--'}
            </ThemedText>
            <ThemedText style={styles.statMeta}>
              {latest
                ? [
                    formatDateTime(latest.measuredAt),
                    latest.height ? `IMC ${formatBodyMassIndex(latest.weight, latest.height)}` : null,
                  ]
                    .filter(Boolean)
                    .join(' • ')
                : 'Nenhum registro ainda'}
            </ThemedText>
            {latestProfileName ? (
              <ThemedText style={styles.profileMeta}>Acompanhado: {latestProfileName}</ThemedText>
            ) : null}
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Nos últimos 7 dias</ThemedText>
            <ThemedText
              style={[styles.statValue, { color: ModulePalette.weight.base }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}>
              {summary ? String(summary.weightLastSevenDays) : '--'}
            </ThemedText>
            <ThemedText style={styles.statMeta}>pesagens salvas</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
            Recentes
          </ThemedText>
          <ThemedText style={[styles.sectionHint, { color: Colors[colorScheme].textMuted }]}>
            Ultimas 5 pesagens
          </ThemedText>
        </View>
        <AuthButton label="Adicionar nova pesagem" onPress={() => router.push('/weight-form')} />

        {weightReadings.length > 0 ? (
          weightReadings.map((item) => {
            const profileName = getProfileName(item.profileId);

            return (
              <Pressable
                key={item.id}
                style={styles.recordCard}
                onPress={() => router.push({ pathname: '/weight-form', params: { id: String(item.id) } })}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordCopy}>
                    <ThemedText style={styles.recordTitle}>{item.weight} {item.unit}</ThemedText>
                    {profileName ? (
                      <ThemedText style={styles.profileMeta}>Acompanhado: {profileName}</ThemedText>
                    ) : null}
                    <ThemedText style={styles.recordMeta}>{formatDateTime(item.measuredAt)}</ThemedText>
                    {item.height ? (
                      <ThemedText style={styles.recordMeta}>
                        {`Altura ${formatHeight(item.height)} m • IMC ${formatBodyMassIndex(item.weight, item.height)}`}
                      </ThemedText>
                    ) : null}
                  </View>
                  <View style={styles.recordActions}>
                    <AuthButton
                      label="Editar"
                      variant="secondary"
                      onPress={() => router.push({ pathname: '/weight-form', params: { id: String(item.id) } })}
                      style={styles.actionButton}
                    />
                    <AuthButton
                      label="Excluir"
                      variant="secondary"
                      selected
                      selectedBackgroundColor="#FFF1F1"
                      selectedBorderColor="#F2B8B8"
                      selectedTextColor={Colors.light.danger}
                      onPress={() => confirmDeleteReading(item.id)}
                      style={styles.actionButton}
                    />
                  </View>
                </View>
                {item.notes ? <ThemedText style={styles.recordNotes}>{item.notes}</ThemedText> : null}
              </Pressable>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.emptyTitle}>Nenhuma pesagem registrada.</ThemedText>
            <ThemedText style={styles.emptyText}>
              Adicione sua primeira pesagem para acompanhar variações com mais clareza.
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
    borderWidth: 1,
    borderColor: '#D5ECE2',
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
    borderRadius: 22,
    backgroundColor: Colors.light.surface,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2ECEF',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontWeight: '800',
  },
  sectionHint: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  recordCard: {
    borderRadius: 24,
    backgroundColor: Colors.light.surface,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2ECEF',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  recordCopy: {
    flex: 1,
    gap: 8,
  },
  recordActions: {
    gap: 8,
  },
  actionButton: {
    minWidth: 84,
    minHeight: 42,
    borderRadius: 14,
  },
  recordTitle: {
    color: Colors.light.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  recordMeta: {
    color: Colors.light.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  profileMeta: {
    color: ModulePalette.weight.base,
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
    borderRadius: 24,
    backgroundColor: Colors.light.surface,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2ECEF',
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
