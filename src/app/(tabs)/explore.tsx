import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { HistoryList } from '@/components/dashboard/history-list';
import { TrendCard } from '@/components/dashboard/trend-card';
import { BrandPalette, Colors, ModulePalette } from '@/constants/theme';
import { SearchInput } from '@/components/forms/search-input';
import { OptionSelector } from '@/components/forms/option-selector';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { formatBodyMassIndex, formatHeight } from '@/features/weight/weight-utils';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useMedications } from '@/hooks/use-medications';
import { useRecordManagement } from '@/hooks/use-record-management';
import { formatDateTime } from '@/utils/date';

const moduleCards = [
  {
    title: 'Pressao',
    description: 'Registra sistolica, diastolica, pulso, horario e origem da leitura.',
  },
  {
    title: 'Glicose',
    description: 'Mantem contexto da medicao para separar jejum, pos-refeicao e aleatoria.',
  },
  {
    title: 'Peso',
    description: 'Acompanha variacao corporal e deixa pronto o terreno para graficos.',
  },
  {
    title: 'Medicacao',
    description: 'Organiza cadastro ativo e logs de adesao para futuras notificacoes.',
  },
];

export default function HistoryScreen() {
  const params = useLocalSearchParams<{
    recordFilter?: 'all' | 'pressure' | 'glicose' | 'weight' | 'medication';
    recordSort?: 'newest' | 'oldest' | 'highest';
    timeFilter?: 'all' | '7d' | '30d';
    medicationStatusFilter?: 'all' | 'active' | 'inactive';
  }>();
  const { biometricAvailable, lock, logout, updateBiometric, user } = useAuth();
  const [trendRange, setTrendRange] = useState<'7d' | '30d'>('7d');
  const { history, isLoading, refresh, summary, trends } = useDashboardData(trendRange === '7d' ? 7 : 30);
  const { items: medications, logStatus } = useMedications();
  const {
    pressureReadings,
    glicoseReadings,
    weightReadings,
    medications: allMedications,
    refresh: refreshRecords,
    deletePressure,
    deleteGlicose,
    deleteWeight,
    deleteMedication,
  } = useRecordManagement();
  const [query, setQuery] = useState('');
  const [recordFilter, setRecordFilter] = useState<'all' | 'pressure' | 'glicose' | 'weight' | 'medication'>('all');
  const [recordSort, setRecordSort] = useState<'newest' | 'oldest' | 'highest'>('newest');
  const [timeFilter, setTimeFilter] = useState<'all' | '7d' | '30d'>('all');
  const [medicationStatusFilter, setMedicationStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [visibleCounts, setVisibleCounts] = useState({
    pressure: 3,
    glicose: 3,
    weight: 3,
    medication: 3,
  });

  const normalizedQuery = query.trim().toLowerCase();
  const now = Date.now();

  function handleTrendPress(metric: { key: 'pressure' | 'glicose' | 'weight' }) {
    setRecordFilter(metric.key);
    setTimeFilter(trendRange);
    setRecordSort('newest');
  }

  useEffect(() => {
    if (params.recordFilter) {
      setRecordFilter(params.recordFilter);
    }

    if (params.recordSort) {
      setRecordSort(params.recordSort);
    }

    if (params.timeFilter) {
      setTimeFilter(params.timeFilter);
      if (params.timeFilter === '7d' || params.timeFilter === '30d') {
        setTrendRange(params.timeFilter);
      }
    }

    if (params.medicationStatusFilter) {
      setMedicationStatusFilter(params.medicationStatusFilter);
    }
  }, [params.medicationStatusFilter, params.recordFilter, params.recordSort, params.timeFilter]);

  const withinSelectedTime = useCallback((isoDate: string) => {
    if (timeFilter === 'all') {
      return true;
    }

    const diffMs = now - new Date(isoDate).getTime();
    const limitDays = timeFilter === '7d' ? 7 : 30;
    return diffMs <= limitDays * 24 * 60 * 60 * 1000;
  }, [now, timeFilter]);

  const sortByDateAndValue = useCallback(<T,>(
    items: T[],
    getDate: (item: T) => string,
    getValue?: (item: T) => number
  ) => {
    return [...items].sort((a, b) => {
      if (recordSort === 'oldest') {
        return new Date(getDate(a)).getTime() - new Date(getDate(b)).getTime();
      }

      if (recordSort === 'highest' && getValue) {
        return getValue(b) - getValue(a);
      }

      return new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime();
    });
  }, [recordSort]);

  async function handleMedicationStatus(medicationId: number, status: 'taken' | 'skipped') {
    await logStatus(medicationId, status);
    await refresh();
  }

  function confirmDelete(label: string, onConfirm: () => Promise<void>) {
    Alert.alert('Excluir registro', `Deseja excluir ${label}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await onConfirm();
            await refreshRecords();
            await refresh();
          })();
        },
      },
    ]);
  }

  function showMore(section: keyof typeof visibleCounts) {
    setVisibleCounts((current) => ({
      ...current,
      [section]: current[section] + 5,
    }));
  }

  const filteredPressure = useMemo(
    () =>
      pressureReadings.filter((item) => {
        if (!withinSelectedTime(item.measuredAt)) {
          return false;
        }

        return (
          !normalizedQuery ||
          [item.systolic, item.diastolic, item.pulse ?? '', item.notes ?? '']
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
        );
      }),
    [normalizedQuery, pressureReadings, withinSelectedTime]
  );
  const sortedPressure = useMemo(
    () => sortByDateAndValue(filteredPressure, (item) => item.measuredAt, (item) => item.systolic),
    [filteredPressure, sortByDateAndValue]
  );

  const filteredGlicose = useMemo(
    () =>
      glicoseReadings.filter((item) => {
        if (!withinSelectedTime(item.measuredAt)) {
          return false;
        }

        return (
          !normalizedQuery ||
          [item.glicoseValue, item.context, item.notes ?? '']
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
        );
      }),
    [glicoseReadings, normalizedQuery, withinSelectedTime]
  );
  const sortedGlicose = useMemo(
    () => sortByDateAndValue(filteredGlicose, (item) => item.measuredAt, (item) => item.glicoseValue),
    [filteredGlicose, sortByDateAndValue]
  );

  const filteredWeight = useMemo(
    () =>
      weightReadings.filter((item) => {
        if (!withinSelectedTime(item.measuredAt)) {
          return false;
        }

        return (
          !normalizedQuery ||
          [item.weight, item.notes ?? ''].join(' ').toLowerCase().includes(normalizedQuery)
        );
      }),
    [normalizedQuery, weightReadings, withinSelectedTime]
  );
  const sortedWeight = useMemo(
    () => sortByDateAndValue(filteredWeight, (item) => item.measuredAt, (item) => item.weight),
    [filteredWeight, sortByDateAndValue]
  );

  const filteredMedications = useMemo(
    () =>
      allMedications.filter((item) => {
        if (medicationStatusFilter === 'active' && !item.active) {
          return false;
        }

        if (medicationStatusFilter === 'inactive' && item.active) {
          return false;
        }

        return (
          !normalizedQuery ||
          [item.name, item.dosage, item.instructions ?? '', item.active ? 'ativa' : 'inativa']
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
        );
      }),
    [allMedications, medicationStatusFilter, normalizedQuery]
  );
  const sortedMedications = useMemo(
    () =>
      [...filteredMedications].sort((a, b) => {
        if (recordSort === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }

        if (recordSort === 'highest') {
          return a.name.localeCompare(b.name);
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [filteredMedications, recordSort]
  );

  return (
    <Screen isRefreshing={isLoading} onRefresh={refresh}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          MVP estruturado para evoluir.
        </ThemedText>
        <ThemedText style={styles.description}>
          O app ja possui banco local, migrations, seed inicial e repositories por modulo.
        </ThemedText>
      </View>

      <View style={styles.moduleList}>
        {moduleCards.map((module) => (
          <View key={module.title} style={styles.moduleCard}>
            <ThemedText style={styles.moduleTitle}>{module.title}</ThemedText>
            <ThemedText style={styles.moduleDescription}>{module.description}</ThemedText>
          </View>
        ))}
      </View>

      <Pressable style={styles.createMedicationCta} onPress={() => router.push('/medication-form')}>
        <ThemedText style={styles.createMedicationTitle}>Cadastrar medicacao</ThemedText>
        <ThemedText style={styles.createMedicationText}>
          Adicione um tratamento e registre tomadas ou pulos logo abaixo.
        </ThemedText>
      </Pressable>

      {medications.length > 0 ? (
        <View style={styles.medicationsSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Uso diario de medicacoes
          </ThemedText>
          {medications.map((medication) => (
            <View key={medication.id} style={styles.medicationCard}>
              <ThemedText style={styles.medicationName}>
                {medication.name} {medication.dosage}
              </ThemedText>
              <ThemedText style={styles.medicationInstructions}>
                {medication.instructions || 'Sem instrucoes cadastradas'}
              </ThemedText>
              <View style={styles.actionRow}>
                <AuthButton
                  label="Tomado"
                  variant="secondary"
                  onPress={() => void handleMedicationStatus(medication.id, 'taken')}
                  style={styles.actionButton}
                />
                <AuthButton
                  label="Pular"
                  onPress={() => void handleMedicationStatus(medication.id, 'skipped')}
                  style={styles.actionButton}
                />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.roadmapCard}>
        <ThemedText style={styles.roadmapTitle}>Proximo passo sugerido</ThemedText>
        <ThemedText style={styles.roadmapText}>
          Evoluir para edicao/exclusao dos registros e agendamento de doses.
        </ThemedText>
        {summary ? (
          <ThemedText style={styles.roadmapMeta}>
            Base atual: {summary.totalReadings} registros e {summary.activeMedications} medicacoes ativas.
          </ThemedText>
        ) : null}
      </View>

      {user ? (
        <View style={styles.accountCard}>
          <ThemedText style={styles.accountTitle}>Conta local protegida</ThemedText>
          <ThemedText style={styles.accountMeta}>{user.name}</ThemedText>
          <ThemedText style={styles.accountMeta}>{user.email}</ThemedText>
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceText}>
              <ThemedText style={styles.preferenceTitle}>Biometria</ThemedText>
              <ThemedText style={styles.preferenceDescription}>
                {biometricAvailable
                  ? 'Ative para desbloqueio rapido no dia a dia.'
                  : 'Biometria nao disponivel neste dispositivo.'}
              </ThemedText>
            </View>
            <Switch
              disabled={!biometricAvailable}
              value={user.useBiometric}
              onValueChange={(value) => {
                updateBiometric(value).catch(() => null);
              }}
            />
          </View>
          <View style={styles.actionRow}>
            <AuthButton label="Bloquear app" variant="secondary" onPress={lock} style={styles.actionButton} />
            <AuthButton label="Logout" onPress={() => void logout()} style={styles.actionButton} />
          </View>
        </View>
      ) : null}

      {trends ? (
        <View style={styles.managementSection}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Tendencias por periodo
            </ThemedText>
            <ThemedText style={styles.sectionHint}>Series locais</ThemedText>
          </View>
          <View style={styles.manageCard}>
            <OptionSelector
              label="Janela de analise"
              value={trendRange}
              onChange={setTrendRange}
              options={[
                { label: '7 dias', value: '7d' },
                { label: '30 dias', value: '30d' },
              ]}
            />
            <TrendCard metric={trends.pressure} onPress={handleTrendPress} actionLabel="Filtrar pressao abaixo" />
            <TrendCard metric={trends.glicose} onPress={handleTrendPress} actionLabel="Filtrar glicose abaixo" />
            <TrendCard metric={trends.weight} onPress={handleTrendPress} actionLabel="Filtrar peso abaixo" />
          </View>
        </View>
      ) : null}

      <View style={styles.managementSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Editar e excluir registros
        </ThemedText>

        <View style={styles.manageCard}>
          <SearchInput
            label="Buscar registros"
            placeholder="Ex.: losartana, 120, jejum, 78"
            value={query}
            onChangeText={setQuery}
          />
          <OptionSelector
            label="Filtrar modulo"
            value={recordFilter}
            onChange={setRecordFilter}
            options={[
              { label: 'Todos', value: 'all' },
              { label: 'Pressao', value: 'pressure' },
              { label: 'Glicose', value: 'glicose' },
              { label: 'Peso', value: 'weight' },
              { label: 'Medicacao', value: 'medication' },
            ]}
          />
          <OptionSelector
            label="Periodo"
            value={timeFilter}
            onChange={setTimeFilter}
            options={[
              { label: 'Tudo', value: 'all' },
              { label: '7 dias', value: '7d' },
              { label: '30 dias', value: '30d' },
            ]}
          />
          <OptionSelector
            label="Ordenar"
            value={recordSort}
            onChange={setRecordSort}
            options={[
              { label: 'Mais novos', value: 'newest' },
              { label: 'Mais antigos', value: 'oldest' },
              { label: 'Maior valor', value: 'highest' },
            ]}
          />
          {(recordFilter === 'all' || recordFilter === 'medication') ? (
            <OptionSelector
              label="Status da medicacao"
              value={medicationStatusFilter}
              onChange={setMedicationStatusFilter}
              options={[
                { label: 'Todas', value: 'all' },
                { label: 'Ativas', value: 'active' },
                { label: 'Inativas', value: 'inactive' },
              ]}
            />
          ) : null}
        </View>

        {recordFilter === 'all' || recordFilter === 'pressure' ? (
          <View style={styles.manageCard}>
          <ThemedText style={styles.manageTitle}>Pressao</ThemedText>
          {sortedPressure.slice(0, visibleCounts.pressure).map((item) => (
            <View key={item.id} style={styles.manageRow}>
              <View style={styles.manageInfo}>
                <ThemedText style={styles.manageValue}>
                  {item.systolic}/{item.diastolic} mmHg
                </ThemedText>
                <ThemedText style={styles.manageMeta}>{formatDateTime(item.measuredAt)}</ThemedText>
              </View>
              <View style={styles.manageActions}>
                <AuthButton
                  label="Editar"
                  variant="secondary"
                  onPress={() => router.push({ pathname: '/pressure-form', params: { id: String(item.id) } })}
                  style={styles.manageButton}
                />
                <AuthButton
                  label="Excluir"
                  onPress={() => confirmDelete('esta leitura de pressao', () => deletePressure(item.id))}
                  style={styles.manageButton}
                />
              </View>
            </View>
          ))}
          {sortedPressure.length > visibleCounts.pressure ? (
            <AuthButton label="Mostrar mais" variant="secondary" onPress={() => showMore('pressure')} />
          ) : null}
        </View>
        ) : null}

        {recordFilter === 'all' || recordFilter === 'glicose' ? (
          <View style={styles.manageCard}>
          <ThemedText style={styles.manageTitle}>Glicose</ThemedText>
          {sortedGlicose.slice(0, visibleCounts.glicose).map((item) => (
            <View key={item.id} style={styles.manageRow}>
              <View style={styles.manageInfo}>
                <ThemedText style={styles.manageValue}>
                  {item.glicoseValue} {item.unit}
                </ThemedText>
                <ThemedText style={styles.manageMeta}>{formatDateTime(item.measuredAt)}</ThemedText>
              </View>
              <View style={styles.manageActions}>
                <AuthButton
                  label="Editar"
                  variant="secondary"
                  onPress={() => router.push({ pathname: '/glicose-form', params: { id: String(item.id) } })}
                  style={styles.manageButton}
                />
                <AuthButton
                  label="Excluir"
                  onPress={() => confirmDelete('esta leitura de glicose', () => deleteGlicose(item.id))}
                  style={styles.manageButton}
                />
              </View>
            </View>
          ))}
          {sortedGlicose.length > visibleCounts.glicose ? (
            <AuthButton label="Mostrar mais" variant="secondary" onPress={() => showMore('glicose')} />
          ) : null}
        </View>
        ) : null}

        {recordFilter === 'all' || recordFilter === 'weight' ? (
          <View style={styles.manageCard}>
          <ThemedText style={styles.manageTitle}>Peso</ThemedText>
          {sortedWeight.slice(0, visibleCounts.weight).map((item) => (
            <View key={item.id} style={styles.manageRow}>
              <View style={styles.manageInfo}>
                <ThemedText style={styles.manageValue}>
                  {item.weight} {item.unit}
                </ThemedText>
                <ThemedText style={styles.manageMeta}>{formatDateTime(item.measuredAt)}</ThemedText>
                {item.height ? (
                  <ThemedText style={styles.manageMeta}>
                    {`Altura ${formatHeight(item.height)} m • IMC ${formatBodyMassIndex(item.weight, item.height)}`}
                  </ThemedText>
                ) : null}
              </View>
              <View style={styles.manageActions}>
                <AuthButton
                  label="Editar"
                  variant="secondary"
                  onPress={() => router.push({ pathname: '/weight-form', params: { id: String(item.id) } })}
                  style={styles.manageButton}
                />
                <AuthButton
                  label="Excluir"
                  onPress={() => confirmDelete('esta pesagem', () => deleteWeight(item.id))}
                  style={styles.manageButton}
                />
              </View>
            </View>
          ))}
          {sortedWeight.length > visibleCounts.weight ? (
            <AuthButton label="Mostrar mais" variant="secondary" onPress={() => showMore('weight')} />
          ) : null}
        </View>
        ) : null}

        {recordFilter === 'all' || recordFilter === 'medication' ? (
          <View style={styles.manageCard}>
          <ThemedText style={styles.manageTitle}>Medicacoes</ThemedText>
          {sortedMedications.slice(0, visibleCounts.medication).map((item) => (
            <View key={item.id} style={styles.manageRow}>
              <View style={styles.manageInfo}>
                <ThemedText style={styles.manageValue}>
                  {item.name} {item.dosage}
                </ThemedText>
                <ThemedText style={styles.manageMeta}>
                  {item.active ? 'Ativa' : 'Inativa'} · {item.instructions || 'Sem instrucoes'}
                </ThemedText>
              </View>
              <View style={styles.manageActions}>
                <AuthButton
                  label="Editar"
                  variant="secondary"
                  onPress={() => router.push({ pathname: '/medication-form', params: { id: String(item.id) } })}
                  style={styles.manageButton}
                />
                <AuthButton
                  label="Excluir"
                  onPress={() => confirmDelete('esta medicacao', () => deleteMedication(item.id))}
                  style={styles.manageButton}
                />
              </View>
            </View>
          ))}
          {sortedMedications.length > visibleCounts.medication ? (
            <AuthButton label="Mostrar mais" variant="secondary" onPress={() => showMore('medication')} />
          ) : null}
        </View>
        ) : null}
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Timeline unificada
        </ThemedText>
        <ThemedText style={styles.sectionHint}>Dados locais</ThemedText>
      </View>

      <HistoryList items={history} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  title: {
    color: Colors.light.text,
    lineHeight: 38,
  },
  description: {
    color: Colors.light.textMuted,
  },
  moduleList: {
    gap: 12,
  },
  moduleCard: {
    borderRadius: 24,
    backgroundColor: Colors.light.surface,
    padding: 18,
    gap: 6,
  },
  moduleTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  moduleDescription: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  createMedicationCta: {
    borderRadius: 24,
    backgroundColor: BrandPalette.navy,
    padding: 18,
    gap: 6,
  },
  createMedicationTitle: {
    color: BrandPalette.white,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  createMedicationText: {
    color: '#C7E3E6',
    fontSize: 14,
    lineHeight: 20,
  },
  medicationsSection: {
    gap: 12,
  },
  medicationCard: {
    borderRadius: 24,
    backgroundColor: Colors.light.surface,
    padding: 18,
    gap: 10,
  },
  medicationName: {
    color: Colors.light.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  medicationInstructions: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  roadmapCard: {
    borderRadius: 28,
    backgroundColor: ModulePalette.weight.soft,
    padding: 20,
    gap: 8,
  },
  roadmapTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: ModulePalette.weight.base,
  },
  roadmapText: {
    color: '#275847',
  },
  roadmapMeta: {
    color: '#346454',
    fontSize: 14,
    lineHeight: 20,
  },
  accountCard: {
    borderRadius: 28,
    backgroundColor: Colors.light.surface,
    padding: 20,
    gap: 12,
  },
  accountTitle: {
    color: Colors.light.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  accountMeta: {
    color: Colors.light.textMuted,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: Colors.light.surfaceMuted,
    padding: 16,
  },
  preferenceText: {
    flex: 1,
    gap: 4,
  },
  preferenceTitle: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  preferenceDescription: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: Colors.light.text,
  },
  sectionHint: {
    color: Colors.light.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  managementSection: {
    gap: 12,
  },
  manageCard: {
    borderRadius: 24,
    backgroundColor: Colors.light.surface,
    padding: 18,
    gap: 12,
  },
  manageTitle: {
    color: Colors.light.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  manageRow: {
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
  },
  manageInfo: {
    gap: 4,
  },
  manageValue: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  manageMeta: {
    color: Colors.light.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  manageActions: {
    flexDirection: 'row',
    gap: 10,
  },
  manageButton: {
    flex: 1,
  },
});
