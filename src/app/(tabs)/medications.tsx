import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Colors, ModulePalette } from '@/constants/theme';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useMedications } from '@/hooks/use-medications';
import { useProfileNames } from '@/hooks/use-profile-names';
import { useRecordManagement } from '@/hooks/use-record-management';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function MedicationsTabScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { summary, refresh: refreshDashboard, isLoading: dashboardLoading } = useDashboardData(7);
  const { items: activeMedications, toggleTakenStatus, refresh: refreshActive } = useMedications();
  const { medications, refresh: refreshRecords, isLoading: recordsLoading } = useRecordManagement();
  const { activeProfileName, getProfileName, refreshProfileNames } = useProfileNames();
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleRefresh() {
    await Promise.all([refreshDashboard(), refreshActive(), refreshRecords(), refreshProfileNames()]);
  }

  async function handleMedicationTaken(medicationId: number, isTaken: boolean) {
    try {
      setActionError(null);
      await toggleTakenStatus(medicationId, isTaken);
      await Promise.all([refreshDashboard(), refreshRecords()]);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Falha ao atualizar medicação.');
    }
  }

  return (
    <Screen isRefreshing={dashboardLoading || recordsLoading} onRefresh={handleRefresh}>
      <View style={[styles.hero, { backgroundColor: ModulePalette.medication.soft }]}>
        <View style={styles.heroHeader}>
          <ThemedText style={[styles.eyebrow, { color: ModulePalette.medication.base }]}>Módulo de medicação</ThemedText>
          <ThemedText type="title" style={styles.heroTitle}>
            Registros ativos, rotina diária e lembretes no mesmo lugar.
          </ThemedText>
          <ThemedText style={styles.heroText}>
            Cadastre, edite e acompanhe a adesão com uma visualização mais direta do uso diário.
          </ThemedText>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel}>Ativas</ThemedText>
            <ThemedText style={[styles.statValue, { color: ModulePalette.medication.base }]}>
              {summary ? String(summary.activeMedications) : '--'}
            </ThemedText>
            <ThemedText style={styles.statMeta}>medicações em andamento</ThemedText>
            {activeProfileName ? (
              <ThemedText style={styles.profileMeta}>Acompanhado: {activeProfileName}</ThemedText>
            ) : null}
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel}>Aderência hoje</ThemedText>
            <ThemedText style={[styles.statValue, { color: ModulePalette.medication.base }]}>
              {summary ? `${summary.adherenceToday}%` : '--'}
            </ThemedText>
            <ThemedText style={styles.statMeta}>registros do dia</ThemedText>
            {activeProfileName ? (
              <ThemedText style={styles.profileMeta}>Acompanhado: {activeProfileName}</ThemedText>
            ) : null}
          </View>
        </View>
      </View>

      <AuthButton label="Adicionar medicação" onPress={() => router.push('/medication-form')} />

      {activeMedications.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
            Uso diário
          </ThemedText>
          {actionError ? <ThemedText style={styles.errorText}>{actionError}</ThemedText> : null}

          {activeMedications.map((medication) => {
            const isTakenToday = medication.todayStatus === 'taken';
            const profileName = getProfileName(medication.profileId);

            return (
              <View key={medication.id} style={styles.medicationCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordCopy}>
                    <ThemedText style={styles.recordTitle}>
                      {medication.name} {medication.dosage}
                    </ThemedText>
                    <ThemedText style={styles.recordSubtitle}>
                      {medication.scheduledTime ? `Dose prevista às ${medication.scheduledTime}` : 'Sem horário definido'}
                    </ThemedText>
                    {profileName ? (
                      <ThemedText style={styles.profileMeta}>Acompanhado: {profileName}</ThemedText>
                    ) : null}
                  </View>
                  <View style={[styles.badge, { backgroundColor: ModulePalette.medication.soft }]}>
                    <ThemedText style={[styles.badgeText, { color: ModulePalette.medication.base }]}>
                      {isTakenToday ? 'Tomado hoje' : 'Não tomado'}
                    </ThemedText>
                  </View>
                </View>

                {medication.instructions ? <ThemedText style={styles.recordNotes}>{medication.instructions}</ThemedText> : null}

                {medication.todayLoggedAt ? (
                  <ThemedText style={styles.recordStatus}>
                    {isTakenToday
                      ? `Registrado como tomado hoje às ${medication.todayLoggedAt.slice(11, 16)}`
                      : null}
                  </ThemedText>
                ) : null}

                <View style={styles.actionRow}>
                  <AuthButton
                    label="Tomado"
                    variant="secondary"
                    selected={isTakenToday}
                    selectedBackgroundColor={ModulePalette.medication.base}
                    selectedBorderColor={ModulePalette.medication.base}
                    onPress={() => void handleMedicationTaken(medication.id, medication.todayStatus === 'taken')}
                    style={styles.actionButton}
                  />
                  <AuthButton
                    label="Editar"
                    variant="secondary"
                    onPress={() => router.push({ pathname: '/medication-form', params: { id: String(medication.id) } })}
                    style={styles.actionButton}
                  />
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <ThemedText style={styles.emptyTitle}>Nenhuma medicação ativa no momento.</ThemedText>
          <ThemedText style={styles.emptyText}>
            Cadastre uma medicação já orientada por profissional para acompanhar horário, lembrete e adesão.
          </ThemedText>
        </View>
      )}

      {medications.some((item) => !item.active) ? (
        <View style={styles.section}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
            Inativas
          </ThemedText>
          {medications
            .filter((item) => !item.active)
            .slice(0, 3)
            .map((medication) => {
              const profileName = getProfileName(medication.profileId);

              return (
                <Pressable
                  key={medication.id}
                  style={styles.inactiveCard}
                  onPress={() => router.push({ pathname: '/medication-form', params: { id: String(medication.id) } })}>
                  <ThemedText style={styles.inactiveTitle}>
                    {medication.name} {medication.dosage}
                  </ThemedText>
                  {profileName ? (
                    <ThemedText style={styles.profileMeta}>Acompanhado: {profileName}</ThemedText>
                  ) : null}
                  <ThemedText style={styles.inactiveMeta}>Toque para revisar ou reativar</ThemedText>
                </Pressable>
              );
            })}
        </View>
      ) : null}

    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 30,
    padding: 22,
    gap: 18,
    borderWidth: 1,
    borderColor: '#E3D8F6',
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
    borderRadius: 22,
    backgroundColor: Colors.light.surface,
    padding: 16,
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
    fontSize: 26,
    fontWeight: '800',
  },
  statMeta: {
    color: Colors.light.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  profileMeta: {
    color: ModulePalette.medication.base,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    fontWeight: '800',
  },
  errorText: {
    color: Colors.light.danger,
    lineHeight: 20,
    fontWeight: '600',
  },
  medicationCard: {
    borderRadius: 24,
    backgroundColor: Colors.light.surface,
    padding: 18,
    gap: 10,
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
    gap: 4,
  },
  recordTitle: {
    color: Colors.light.text,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
  },
  recordSubtitle: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  recordNotes: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  recordStatus: {
    color: ModulePalette.medication.base,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
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
  inactiveCard: {
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceMuted,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  inactiveTitle: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  inactiveMeta: {
    color: Colors.light.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
});
