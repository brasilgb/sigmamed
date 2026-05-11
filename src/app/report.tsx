import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { AuthButton } from '@/components/auth/auth-button';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { BrandPalette, Colors, Radius, Space } from '@/constants/theme';
import { formatGlicoseContext } from '@/features/glicose/glicose-utils';
import { buildScopedReportHtml, exportReportPdf, getReportData } from '@/services/report.service';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { formatDateTime } from '@/utils/date';
import type { ReportData, ReportModule, ReportPeriodDays } from '@/types/health';

const periods: ReportPeriodDays[] = [7, 30, 90];
const logoAzul = require('../../assets/images/logo_azul.png');
const allReportModules: ReportModule[] = ['pressure', 'glicose', 'weight', 'medications'];
const reportModules: { label: string; value: ReportModule }[] = [
  { label: 'Pressão', value: 'pressure' },
  { label: 'Glicose', value: 'glicose' },
  { label: 'Peso', value: 'weight' },
  { label: 'Medicação', value: 'medications' },
];

function formatPatientWeight(data: ReportData) {
  const latestWeight = data.summary.latestWeight;

  return latestWeight ? `${latestWeight.weight.toFixed(1)} ${latestWeight.unit}` : 'Sem pesagem cadastrada';
}

function getReportSubjectName(data: ReportData | null) {
  return data?.patient?.name ?? 'perfil ativo';
}

export default function ReportScreen() {
  const { resumeAutoLock, suspendAutoLock } = useAuth();
  const [periodDays, setPeriodDays] = useState<ReportPeriodDays>(30);
  const [selectedReportModules, setSelectedReportModules] = useState<ReportModule[]>([]);
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const report = await getReportData(periodDays);
      setData(report);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Falha ao montar o relatório.');
    } finally {
      setIsLoading(false);
    }
  }, [periodDays]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleExport() {
    if (!data) {
      return;
    }

    try {
      setIsExporting(true);
      const html = buildScopedReportHtml(data, selectedReportModules);
      suspendAutoLock();
      await Print.printAsync({ html });
    } catch (exportError) {
      Alert.alert(
        'Falha ao exportar',
        exportError instanceof Error ? exportError.message : 'Não foi possível gerar o PDF.'
      );
    } finally {
      resumeAutoLock();
      setIsExporting(false);
    }
  }

  async function handleShare() {
    if (!data) {
      return;
    }

    try {
      setIsSharing(true);
      suspendAutoLock();

      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (!isSharingAvailable) {
        throw new Error('Compartilhamento indisponível neste dispositivo.');
      }

      const file = await exportReportPdf(data, selectedReportModules);

      await Sharing.shareAsync(file.uri, {
        dialogTitle: 'Compartilhar relatório',
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
      });
    } catch (shareError) {
      Alert.alert(
        'Falha ao compartilhar',
        shareError instanceof Error ? shareError.message : 'Não foi possível compartilhar o relatório.'
      );
    } finally {
      resumeAutoLock();
      setIsSharing(false);
    }
  }

  function toggleReportModule(module: ReportModule) {
    setSelectedReportModules((current) => {
      if (current.includes(module)) {
        return current.filter((item) => item !== module);
      }

      return allReportModules.filter((item) => [...current, module].includes(item));
    });
  }

  const hasSelectedReportModules = selectedReportModules.length > 0;
  const isCompleteReport = selectedReportModules.length === allReportModules.length;
  const showPressure = selectedReportModules.includes('pressure');
  const showGlicose = selectedReportModules.includes('glicose');
  const showWeight = selectedReportModules.includes('weight');
  const showMedications = selectedReportModules.includes('medications');
  const actionsDisabled = !data || !hasSelectedReportModules || isExporting || isSharing;

  return (
    <Screen isRefreshing={isLoading} onRefresh={load}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backText}>Voltar</ThemedText>
        </Pressable>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.reportIconWrap}>
              <Image source={logoAzul} style={styles.reportLogo} resizeMode="contain" />
            </View>
            <View style={styles.kickerWrap}>
              <ThemedText style={styles.kicker}>Relatório</ThemedText>
            </View>
          </View>
          <ThemedText type="title" style={styles.title}>
            Relatório de {getReportSubjectName(data)}.
          </ThemedText>
          <ThemedText style={styles.description}>
            Gere uma ficha com as marcações cadastradas para imprimir ou compartilhar com o médico.
          </ThemedText>
        </View>
      </View>

      <Card muted style={styles.periodCard}>
        <View style={styles.filterHeader}>
          <ThemedText type="subtitle" style={styles.filterTitle}>Período</ThemedText>
          {data ? (
            <ThemedText style={styles.filterHint}>Gerado em {formatDateTime(data.generatedAt)}</ThemedText>
          ) : null}
        </View>
        <View style={styles.periodRow}>
          {periods.map((period) => (
            <AuthButton
              key={period}
              label={`${period} dias`}
              variant="secondary"
              selected={periodDays === period}
              selectedBackgroundColor={BrandPalette.navy}
              selectedTextColor={BrandPalette.white}
              style={styles.periodButton}
              onPress={() => setPeriodDays(period)}
            />
          ))}
        </View>
        <View style={styles.filterHeader}>
          <ThemedText type="subtitle" style={styles.filterTitle}>Tipo de relatório</ThemedText>
          <ThemedText style={styles.filterHint}>Escolha um ou mais conteúdos do PDF</ThemedText>
        </View>
        <View style={styles.kindRow}>
          <AuthButton
            label="Todos"
            variant="secondary"
            selected={isCompleteReport}
            selectedBackgroundColor={BrandPalette.navy}
            selectedTextColor={BrandPalette.white}
            style={styles.kindButton}
            onPress={() => setSelectedReportModules(isCompleteReport ? [] : allReportModules)}
          />
          {reportModules.map((module) => (
            <AuthButton
              key={module.value}
              label={module.label}
              variant="secondary"
              selected={selectedReportModules.includes(module.value)}
              selectedBackgroundColor={BrandPalette.navy}
              selectedTextColor={BrandPalette.white}
              style={styles.kindButton}
              onPress={() => toggleReportModule(module.value)}
            />
          ))}
        </View>
        <View style={styles.reportActionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir PDF"
            onPress={handleExport}
            disabled={actionsDisabled}
            style={({ pressed }) => [
              styles.reportActionButton,
              actionsDisabled && styles.reportActionDisabled,
              pressed && !actionsDisabled && styles.reportActionPressed,
            ]}>
            {isExporting ? (
              <ActivityIndicator color={BrandPalette.primary} />
            ) : (
              <MaterialIcons name="picture-as-pdf" size={25} color={BrandPalette.primary} />
            )}
            <ThemedText style={styles.reportActionText}>PDF</ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Compartilhar relatório"
            onPress={handleShare}
            disabled={actionsDisabled}
            style={({ pressed }) => [
              styles.reportActionButton,
              actionsDisabled && styles.reportActionDisabled,
              pressed && !actionsDisabled && styles.reportActionPressed,
            ]}>
            {isSharing ? (
              <ActivityIndicator color={BrandPalette.primary} />
            ) : (
              <MaterialIcons name="ios-share" size={25} color={BrandPalette.primary} />
            )}
            <ThemedText style={styles.reportActionText}>Compartilhar</ThemedText>
          </Pressable>
        </View>
      </Card>

      {error ? (
        <Card style={styles.errorCard}>
          <ThemedText style={styles.errorTitle}>Não foi possível carregar o relatório.</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </Card>
      ) : null}

      {data ? (
        <>
          {data.patient ? (
            <Card style={styles.patientCard}>
              <ThemedText style={styles.summaryLabel}>Acompanhado</ThemedText>
              <ThemedText style={styles.patientName}>{data.patient.name}</ThemedText>
              <ThemedText style={styles.patientMeta}>{data.patient.email}</ThemedText>
              <View style={styles.patientInfoGrid}>
                <View style={styles.patientInfoItem}>
                  <ThemedText style={styles.patientInfoLabel}>Idade</ThemedText>
                  <ThemedText style={styles.patientInfoValue}>
                    {data.patient.age ? `${data.patient.age} anos` : '-'}
                  </ThemedText>
                </View>
                <View style={styles.patientInfoItem}>
                  <ThemedText style={styles.patientInfoLabel}>Sexo</ThemedText>
                  <ThemedText style={styles.patientInfoValue}>{data.patient.sex ?? '-'}</ThemedText>
                </View>
                <View style={styles.patientInfoItem}>
                  <ThemedText style={styles.patientInfoLabel}>Peso</ThemedText>
                  <ThemedText style={styles.patientInfoValue}>{formatPatientWeight(data)}</ThemedText>
                </View>
              </View>
              {data.patient.hasHypertension || data.patient.hasDiabetes ? (
                <View style={styles.patientBadgeRow}>
                  {data.patient.hasHypertension ? (
                    <ThemedText style={styles.patientBadge}>Hipertensão</ThemedText>
                  ) : null}
                  {data.patient.hasDiabetes ? (
                    <ThemedText style={styles.patientBadge}>Diabetes</ThemedText>
                  ) : null}
                </View>
              ) : null}
            </Card>
          ) : null}

          {!hasSelectedReportModules ? (
            <Card style={styles.summaryCardSingle}>
              <ThemedText style={styles.summaryLabel}>Conteúdo do relatório</ThemedText>
              <ThemedText style={styles.latestRow}>Selecione um ou mais módulos para gerar o PDF.</ThemedText>
            </Card>
          ) : null}

          {hasSelectedReportModules ? (
            <Card style={styles.summaryCardSingle}>
              <ThemedText style={styles.summaryLabel}>Registros cadastrados</ThemedText>
              {showPressure ? <ThemedText style={styles.latestRow}>Pressão: {data.pressure.readings.length} marcações</ThemedText> : null}
              {showGlicose ? <ThemedText style={styles.latestRow}>Glicose: {data.glicose.readings.length} marcações</ThemedText> : null}
              {showWeight ? <ThemedText style={styles.latestRow}>Peso: {data.weight.readings.length} marcações</ThemedText> : null}
              {showMedications ? <ThemedText style={styles.latestRow}>Medicações cadastradas: {data.medications.items.length}</ThemedText> : null}
            </Card>
          ) : null}

          {hasSelectedReportModules ? <View style={styles.section}>
            <SectionHeader
              title="Marcações cadastradas"
              hint={`Últimos ${periodDays} dias`}
            />
            {showPressure ? <Card>
              <ThemedText style={styles.blockTitle}>Pressão</ThemedText>
              {data.pressure.readings.length > 0 ? (
                data.pressure.readings.map((item) => (
                  <View key={`pressure-${item.id}`} style={styles.listRow}>
                    <ThemedText style={styles.listTitle}>{item.systolic}/{item.diastolic} mmHg</ThemedText>
                    <ThemedText style={styles.listMeta}>
                      {formatDateTime(item.measuredAt)}{item.pulse ? ` | Pulso ${item.pulse} bpm` : ''}
                    </ThemedText>
                    {item.notes ? <ThemedText style={styles.listMeta}>Obs.: {item.notes}</ThemedText> : null}
                  </View>
                ))
              ) : (
                <ThemedText style={styles.emptyText}>Sem leituras de pressão.</ThemedText>
              )}
            </Card> : null}

            {showGlicose ? <Card>
              <ThemedText style={styles.blockTitle}>Glicose</ThemedText>
              {data.glicose.readings.length > 0 ? (
                data.glicose.readings.map((item) => (
                  <View key={`glicose-${item.id}`} style={styles.listRow}>
                    <ThemedText style={styles.listTitle}>
                      {item.glicoseValue} {item.unit} ({formatGlicoseContext(item.context)})
                    </ThemedText>
                    <ThemedText style={styles.listMeta}>{formatDateTime(item.measuredAt)}</ThemedText>
                    {item.notes ? <ThemedText style={styles.listMeta}>Obs.: {item.notes}</ThemedText> : null}
                  </View>
                ))
              ) : (
                <ThemedText style={styles.emptyText}>Sem leituras de glicose.</ThemedText>
              )}
            </Card> : null}

            {showWeight ? <Card>
              <ThemedText style={styles.blockTitle}>Peso</ThemedText>
              {data.weight.readings.length > 0 ? (
                data.weight.readings.map((item) => (
                  <View key={`weight-${item.id}`} style={styles.listRow}>
                    <ThemedText style={styles.listTitle}>{item.weight.toFixed(1)} {item.unit}</ThemedText>
                    <ThemedText style={styles.listMeta}>
                      {formatDateTime(item.measuredAt)}{item.height ? ` | Altura ${item.height} cm` : ''}
                    </ThemedText>
                    {item.notes ? <ThemedText style={styles.listMeta}>Obs.: {item.notes}</ThemedText> : null}
                  </View>
                ))
              ) : (
                <ThemedText style={styles.emptyText}>Sem leituras de peso.</ThemedText>
              )}
            </Card> : null}

            {showMedications ? <Card>
              <ThemedText style={styles.blockTitle}>Medicações</ThemedText>
              {data.medications.items.length > 0 ? (
                data.medications.items.map((item) => (
                  <View key={`medication-${item.id}`} style={styles.listRow}>
                    <ThemedText style={styles.listTitle}>{item.name} {item.dosage}</ThemedText>
                    <ThemedText style={styles.listMeta}>
                      {[
                        item.scheduledTime ? `Horário: ${item.scheduledTime}` : 'Sem horário',
                        item.doseInterval ? `Intervalo: ${item.doseInterval}` : null,
                        item.active ? 'Ativa' : 'Inativa',
                      ].filter(Boolean).join(' | ')}
                    </ThemedText>
                    {item.instructions ? <ThemedText style={styles.listMeta}>Instruções: {item.instructions}</ThemedText> : null}
                  </View>
                ))
              ) : (
                <ThemedText style={styles.emptyText}>Sem medicações cadastradas.</ThemedText>
              )}
            </Card> : null}
          </View> : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backText: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  hero: {
    borderRadius: Radius.xl,
    backgroundColor: '#EAF5F2',
    padding: Space.xl,
    gap: 10,
    borderWidth: 1,
    borderColor: '#CFE5DF',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reportIconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: BrandPalette.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CFE5DF',
    overflow: 'hidden',
  },
  reportLogo: {
    width: 44,
    height: 44,
  },
  kickerWrap: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    backgroundColor: BrandPalette.navy,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  kicker: {
    color: BrandPalette.white,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  title: {
    color: Colors.light.text,
    lineHeight: 36,
  },
  description: {
    color: Colors.light.textMuted,
    lineHeight: 22,
  },
  periodCard: {
    gap: 16,
    padding: 18,
  },
  filterHeader: {
    alignItems: 'flex-start',
    gap: 4,
    paddingRight: 4,
  },
  filterTitle: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  filterHint: {
    color: BrandPalette.navySoft,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kindRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  periodButton: {
    flex: 1,
    minHeight: 48,
  },
  kindButton: {
    minHeight: 46,
    minWidth: '30%',
    flexGrow: 1,
  },
  reportActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reportActionButton: {
    flex: 1,
    minHeight: 62,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  reportActionPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  reportActionDisabled: {
    opacity: 0.48,
  },
  reportActionText: {
    color: BrandPalette.primary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    gap: 6,
    minHeight: 132,
    justifyContent: 'center',
  },
  summaryCardSingle: {
    gap: 6,
  },
  summaryLabel: {
    color: Colors.light.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    color: Colors.light.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    paddingTop: 2,
  },
  summaryHint: {
    color: Colors.light.textSoft,
    lineHeight: 20,
  },
  patientCard: {
    gap: 8,
  },
  patientName: {
    color: Colors.light.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  patientMeta: {
    color: Colors.light.textMuted,
    lineHeight: 20,
  },
  patientInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 6,
  },
  patientInfoItem: {
    flexGrow: 1,
    minWidth: '30%',
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 12,
    gap: 4,
  },
  patientInfoLabel: {
    color: Colors.light.textSoft,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  patientInfoValue: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  patientBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  patientBadge: {
    borderRadius: Radius.pill,
    backgroundColor: '#DDF1EC',
    color: BrandPalette.navy,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  latestRow: {
    color: Colors.light.text,
    lineHeight: 22,
    fontWeight: '600',
  },
  section: {
    gap: 14,
  },
  blockTitle: {
    color: Colors.light.text,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 8,
  },
  listRow: {
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
    gap: 2,
  },
  listTitle: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  listMeta: {
    color: Colors.light.textSoft,
    fontSize: 13,
  },
  emptyText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
  },
  trendTitle: {
    color: Colors.light.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trendValue: {
    color: Colors.light.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    marginTop: 6,
  },
  trendDetail: {
    color: Colors.light.textMuted,
    lineHeight: 20,
    marginTop: 6,
  },
  errorCard: {
    backgroundColor: '#FFF6F6',
    borderColor: '#F3D1D1',
  },
  errorTitle: {
    color: Colors.light.danger,
    fontWeight: '800',
  },
  errorText: {
    color: Colors.light.textMuted,
    marginTop: 4,
  },
});
