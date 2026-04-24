import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

import { AuthButton } from '@/components/auth/auth-button';
import { TrendCard } from '@/components/dashboard/trend-card';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { BrandPalette, Colors, Radius, Space } from '@/constants/theme';
import { buildReportHtml, exportReportPdf, getReportData } from '@/services/report.service';
import { formatDateTime } from '@/utils/date';
import type { ReportData, ReportPeriodDays } from '@/types/health';

const periods: ReportPeriodDays[] = [7, 30, 90];

export default function ReportScreen() {
  const [periodDays, setPeriodDays] = useState<ReportPeriodDays>(30);
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
      setError(loadError instanceof Error ? loadError.message : 'Falha ao montar o relatorio.');
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
      const html = buildReportHtml(data);

      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        return;
      }

      const file = await exportReportPdf(data);
      const available = await Sharing.isAvailableAsync();

      if (!available) {
        Alert.alert('Relatorio gerado', `PDF salvo em: ${file.uri}`);
        return;
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartilhar relatorio SigmaMed',
      });
    } catch (exportError) {
      Alert.alert(
        'Falha ao exportar',
        exportError instanceof Error ? exportError.message : 'Nao foi possivel gerar o PDF.'
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Screen isRefreshing={isLoading} onRefresh={load}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backText}>Voltar</ThemedText>
        </Pressable>
        <View style={styles.hero}>
          <View style={styles.kickerWrap}>
            <ThemedText style={styles.kicker}>Relatorio</ThemedText>
          </View>
          <ThemedText type="title" style={styles.title}>
            Resumo por periodo, pronto para compartilhar.
          </ThemedText>
          <ThemedText style={styles.description}>
            Consolide leituras, adesao e alertas do SigmaMed em uma visao unica e exporte em PDF.
          </ThemedText>
        </View>
      </View>

      <Card muted style={styles.periodCard}>
        <SectionHeader title="Periodo" hint={data ? `Gerado em ${formatDateTime(data.generatedAt)}` : undefined} />
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
        <AuthButton
          label={isExporting ? 'Gerando PDF...' : 'Exportar PDF'}
          onPress={handleExport}
          disabled={!data || isExporting}
        />
      </Card>

      {error ? (
        <Card style={styles.errorCard}>
          <ThemedText style={styles.errorTitle}>Nao foi possivel carregar o relatorio.</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </Card>
      ) : null}

      {data ? (
        <>
          <View style={styles.summaryGrid}>
            <Card style={styles.summaryCard}>
              <ThemedText style={styles.summaryLabel}>Registros no periodo</ThemedText>
              <ThemedText style={styles.summaryValue}>{data.summary.totalReadings}</ThemedText>
              <ThemedText style={styles.summaryHint}>
                Pressao {data.pressure.summary.count} | Glicose {data.glicose.summary.count} | Peso {data.weight.summary.count}
              </ThemedText>
            </Card>
            <Card style={styles.summaryCard}>
              <ThemedText style={styles.summaryLabel}>Medicacao</ThemedText>
              <ThemedText style={styles.summaryValue}>{data.medications.summary.activeCount}</ThemedText>
              <ThemedText style={styles.summaryHint}>
                ativas | adesao {data.medications.summary.adherenceRate}% no periodo
              </ThemedText>
            </Card>
          </View>

          <Card style={styles.summaryCardSingle}>
            <ThemedText style={styles.summaryLabel}>Ultimas leituras</ThemedText>
            <ThemedText style={styles.latestRow}>Pressao: {data.pressure.summary.latestLabel}</ThemedText>
            <ThemedText style={styles.latestRow}>Glicose: {data.glicose.summary.latestLabel}</ThemedText>
            <ThemedText style={styles.latestRow}>Peso: {data.weight.summary.latestLabel}</ThemedText>
          </Card>

          <View style={styles.section}>
            <SectionHeader title="Tendencias" hint={`Ultimos ${periodDays} dias`} />
            <TrendCard metric={data.trends.pressure} />
            <TrendCard metric={data.trends.glicose} />
            <TrendCard metric={data.trends.weight} />
          </View>

          <View style={styles.section}>
            <SectionHeader title="Alertas" hint={`${data.alerts.length} item(ns)`} />
            {data.alerts.length > 0 ? (
              data.alerts.map((alert) => (
                <Card key={alert.id} muted>
                  <ThemedText style={styles.alertTitle}>{alert.title}</ThemedText>
                  <ThemedText style={styles.alertText}>{alert.description}</ThemedText>
                </Card>
              ))
            ) : (
              <Card muted>
                <ThemedText style={styles.emptyText}>Sem alertas para este periodo.</ThemedText>
              </Card>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader title="Detalhamento" hint="Leituras recentes do periodo" />
            <Card>
              <ThemedText style={styles.blockTitle}>Pressao</ThemedText>
              {data.pressure.readings.length > 0 ? (
                data.pressure.readings.map((item) => (
                  <View key={`pressure-${item.id}`} style={styles.listRow}>
                    <ThemedText style={styles.listTitle}>{item.systolic}/{item.diastolic} mmHg</ThemedText>
                    <ThemedText style={styles.listMeta}>{formatDateTime(item.measuredAt)}</ThemedText>
                  </View>
                ))
              ) : (
                <ThemedText style={styles.emptyText}>Sem leituras de pressao.</ThemedText>
              )}
            </Card>

            <Card>
              <ThemedText style={styles.blockTitle}>Glicose</ThemedText>
              {data.glicose.readings.length > 0 ? (
                data.glicose.readings.map((item) => (
                  <View key={`glicose-${item.id}`} style={styles.listRow}>
                    <ThemedText style={styles.listTitle}>{item.glicoseValue} {item.unit} ({item.context})</ThemedText>
                    <ThemedText style={styles.listMeta}>{formatDateTime(item.measuredAt)}</ThemedText>
                  </View>
                ))
              ) : (
                <ThemedText style={styles.emptyText}>Sem leituras de glicose.</ThemedText>
              )}
            </Card>

            <Card>
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
            </Card>
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
  periodButton: {
    flex: 1,
    minHeight: 48,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    gap: 6,
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
    fontWeight: '800',
  },
  summaryHint: {
    color: Colors.light.textSoft,
    lineHeight: 20,
  },
  latestRow: {
    color: Colors.light.text,
    lineHeight: 22,
    fontWeight: '600',
  },
  section: {
    gap: 14,
  },
  alertTitle: {
    color: Colors.light.text,
    fontWeight: '800',
    lineHeight: 22,
  },
  alertText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
    marginTop: 4,
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
