import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import * as Print from 'expo-print';

import { AuthButton } from '@/components/auth/auth-button';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { BrandPalette, Colors, Radius, Space } from '@/constants/theme';
import { formatGlicoseContext } from '@/features/glicose/glicose-utils';
import { buildScopedReportHtml, getReportData } from '@/services/report.service';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { formatDateTime } from '@/utils/date';
import type { ReportData, ReportKind, ReportPeriodDays } from '@/types/health';

const periods: ReportPeriodDays[] = [7, 30, 90];
const reportKinds: { label: string; value: ReportKind }[] = [
  { label: 'Completo', value: 'complete' },
  { label: 'Pressão', value: 'pressure' },
  { label: 'Glicose', value: 'glicose' },
  { label: 'Peso', value: 'weight' },
  { label: 'Medicação', value: 'medications' },
];

function formatPatientWeight(data: ReportData) {
  const latestWeight = data.summary.latestWeight;

  return latestWeight ? `${latestWeight.weight.toFixed(1)} ${latestWeight.unit}` : 'Sem pesagem no período';
}

function getReportSubjectName(data: ReportData | null) {
  return data?.patient?.name ?? 'perfil ativo';
}

export default function ReportScreen() {
  const { resumeAutoLock, suspendAutoLock } = useAuth();
  const [periodDays, setPeriodDays] = useState<ReportPeriodDays>(30);
  const [reportKind, setReportKind] = useState<ReportKind>('complete');
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
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
      const html = buildScopedReportHtml(data, reportKind);
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

  const showPressure = reportKind === 'complete' || reportKind === 'pressure';
  const showGlicose = reportKind === 'complete' || reportKind === 'glicose';
  const showWeight = reportKind === 'complete' || reportKind === 'weight';
  const showMedications = reportKind === 'complete' || reportKind === 'medications';

  return (
    <Screen isRefreshing={isLoading} onRefresh={load}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backText}>Voltar</ThemedText>
        </Pressable>
        <View style={styles.hero}>
          <View style={styles.kickerWrap}>
            <ThemedText style={styles.kicker}>Relatório</ThemedText>
          </View>
          <ThemedText type="title" style={styles.title}>
            Relatório de {getReportSubjectName(data)}.
          </ThemedText>
          <ThemedText style={styles.description}>
            Consolide leituras, adesão e tendências do Meu Controle em uma visão única e exporte em PDF.
          </ThemedText>
        </View>
      </View>

      <Card muted style={styles.periodCard}>
        <SectionHeader title="Período" hint={data ? `Gerado em ${formatDateTime(data.generatedAt)}` : undefined} />
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
        <SectionHeader title="Tipo de relatório" hint="Escolha o conteúdo do PDF" />
        <View style={styles.kindRow}>
          {reportKinds.map((kind) => (
            <AuthButton
              key={kind.value}
              label={kind.label}
              variant="secondary"
              selected={reportKind === kind.value}
              selectedBackgroundColor={BrandPalette.navy}
              selectedTextColor={BrandPalette.white}
              style={styles.kindButton}
              onPress={() => setReportKind(kind.value)}
            />
          ))}
        </View>
        <AuthButton
          label={isExporting ? 'Abrindo relatório...' : 'Abrir PDF'}
          onPress={handleExport}
          disabled={!data || isExporting}
        />
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

          {reportKind === 'complete' ? (
            <View style={styles.summaryGrid}>
              <Card style={styles.summaryCard}>
                <ThemedText style={styles.summaryLabel}>Registros no período</ThemedText>
                <ThemedText style={styles.summaryValue}>{data.summary.totalReadings}</ThemedText>
                <ThemedText style={styles.summaryHint}>
                  Pressão {data.pressure.summary.count} | Glicose {data.glicose.summary.count} | Peso {data.weight.summary.count}
                </ThemedText>
              </Card>
              <Card style={styles.summaryCard}>
                <ThemedText style={styles.summaryLabel}>Medicação</ThemedText>
                <ThemedText style={styles.summaryValue}>{data.medications.summary.activeCount}</ThemedText>
                <ThemedText style={styles.summaryHint}>
                  ativas | adesão {data.medications.summary.adherenceRate}% no período
                </ThemedText>
              </Card>
            </View>
          ) : null}

          {reportKind !== 'medications' ? (
            <Card style={styles.summaryCardSingle}>
              <ThemedText style={styles.summaryLabel}>Últimas leituras</ThemedText>
              {showPressure ? <ThemedText style={styles.latestRow}>Pressão: {data.pressure.summary.latestLabel}</ThemedText> : null}
              {showGlicose ? <ThemedText style={styles.latestRow}>Glicose: {data.glicose.summary.latestLabel}</ThemedText> : null}
              {showWeight ? <ThemedText style={styles.latestRow}>Peso: {data.weight.summary.latestLabel}</ThemedText> : null}
            </Card>
          ) : (
            <Card style={styles.summaryCardSingle}>
              <ThemedText style={styles.summaryLabel}>Medicação</ThemedText>
              <ThemedText style={styles.latestRow}>Ativas: {data.medications.summary.activeCount}</ThemedText>
              <ThemedText style={styles.latestRow}>Adesão no período: {data.medications.summary.adherenceRate}%</ThemedText>
            </Card>
          )}

          {reportKind !== 'medications' ? <View style={styles.section}>
            <SectionHeader title="Tendências" hint={`Últimos ${periodDays} dias`} />
            {showPressure ? <Card>
              <ThemedText style={styles.trendTitle}>{data.trends.pressure.label}</ThemedText>
              <ThemedText style={styles.trendValue}>
                {data.trends.pressure.latestValue !== null
                  ? `${data.trends.pressure.latestValue.toFixed(0)} ${data.trends.pressure.unit}`
                  : 'Sem dado'}
              </ThemedText>
              <ThemedText style={styles.trendDetail}>{data.trends.pressure.detail}</ThemedText>
            </Card> : null}
            {showGlicose ? <Card>
              <ThemedText style={styles.trendTitle}>{data.trends.glicose.label}</ThemedText>
              <ThemedText style={styles.trendValue}>
                {data.trends.glicose.latestValue !== null
                  ? `${data.trends.glicose.latestValue.toFixed(0)} ${data.trends.glicose.unit}`
                  : 'Sem dado'}
              </ThemedText>
              <ThemedText style={styles.trendDetail}>{data.trends.glicose.detail}</ThemedText>
            </Card> : null}
            {showWeight ? <Card>
              <ThemedText style={styles.trendTitle}>{data.trends.weight.label}</ThemedText>
              <ThemedText style={styles.trendValue}>
                {data.trends.weight.latestValue !== null
                  ? `${data.trends.weight.latestValue.toFixed(1)} ${data.trends.weight.unit}`
                  : 'Sem dado'}
              </ThemedText>
              <ThemedText style={styles.trendDetail}>{data.trends.weight.detail}</ThemedText>
            </Card> : null}
          </View> : null}

          <View style={styles.section}>
            <SectionHeader title="Detalhamento" hint="Leituras recentes do período" />
            {showPressure ? <Card>
              <ThemedText style={styles.blockTitle}>Pressão</ThemedText>
              {data.pressure.readings.length > 0 ? (
                data.pressure.readings.map((item) => (
                  <View key={`pressure-${item.id}`} style={styles.listRow}>
                    <ThemedText style={styles.listTitle}>{item.systolic}/{item.diastolic} mmHg</ThemedText>
                    <ThemedText style={styles.listMeta}>{formatDateTime(item.measuredAt)}</ThemedText>
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
                    <ThemedText style={styles.listMeta}>{formatDateTime(item.measuredAt)}</ThemedText>
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
                      {item.scheduledTime ? `Horário: ${item.scheduledTime}` : 'Sem horário'} | {item.active ? 'Ativa' : 'Inativa'}
                    </ThemedText>
                  </View>
                ))
              ) : (
                <ThemedText style={styles.emptyText}>Sem medicações cadastradas.</ThemedText>
              )}
            </Card> : null}
          </View>
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
    gap: 14,
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
