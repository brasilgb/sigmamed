import type { DashboardAlert, DashboardSummary, DashboardTrends } from '@/types/health';

function hasEnoughPoints(values: (number | null)[], minimum = 2) {
  return values.filter((value) => value !== null).length >= minimum;
}

export function getDashboardAlerts(
  summary: DashboardSummary | null,
  trends: DashboardTrends | null
): DashboardAlert[] {
  if (!summary || !trends) {
    return [];
  }

  const alerts: DashboardAlert[] = [];
  const pressureValues = trends.pressure.points.map((point) => point.value);
  const glicoseValues = trends.glicose.points.map((point) => point.value);
  const weightValues = trends.weight.points.map((point) => point.value);

  if (
    hasEnoughPoints(pressureValues) &&
    trends.pressure.latestValue !== null &&
    (trends.pressure.latestValue >= 140 || (trends.pressure.delta ?? 0) >= 10)
  ) {
    alerts.push({
      id: 'pressure-rise',
      metric: 'pressure',
      tone: trends.pressure.latestValue >= 150 ? 'danger' : 'warning',
      title: 'Pressao em alta recente',
      actionLabel: 'Revisar pressao',
      description:
        trends.pressure.latestValue >= 140
          ? `A media sistolica recente chegou a ${trends.pressure.latestValue.toFixed(0)} mmHg. Vale revisar as ultimas leituras.`
          : `A sistolica media subiu ${Math.abs(trends.pressure.delta ?? 0).toFixed(0)} mmHg no periodo recente.`,
    });
  }

  if (
    hasEnoughPoints(glicoseValues) &&
    trends.glicose.latestValue !== null &&
    (trends.glicose.latestValue >= 180 || (trends.glicose.delta ?? 0) >= 20)
  ) {
    alerts.push({
      id: 'glicose-high',
      metric: 'glicose',
      tone: trends.glicose.latestValue >= 200 ? 'danger' : 'warning',
      title: 'Glicose acima do padrao recente',
      actionLabel: 'Revisar glicose',
      description:
        trends.glicose.latestValue >= 180
          ? `A media recente ficou em ${trends.glicose.latestValue.toFixed(0)} mg/dL. Confirme o contexto das medicoes.`
          : `A glicose media subiu ${Math.abs(trends.glicose.delta ?? 0).toFixed(0)} mg/dL frente ao valor anterior.`,
    });
  }

  if (
    hasEnoughPoints(weightValues, 3) &&
    trends.weight.latestValue !== null &&
    Math.abs(trends.weight.delta ?? 0) >= 1.5
  ) {
    alerts.push({
      id: 'weight-shift',
      metric: 'weight',
      tone: 'info',
      title: 'Peso variando rapido',
      actionLabel: 'Revisar peso',
      description: `A ultima variacao diaria foi de ${Math.abs(trends.weight.delta ?? 0).toFixed(1)} kg. Verifique se houve mudanca real ou erro de medicao.`,
    });
  }

  if (summary.activeMedications > 0 && summary.adherenceToday < 80) {
    alerts.push({
      id: 'medication-adherence',
      metric: 'medication',
      tone: summary.adherenceToday < 50 ? 'danger' : 'warning',
      title: 'Aderencia de hoje abaixo do ideal',
      actionLabel: 'Ver medicacoes',
      description: `Aderencia registrada em ${summary.adherenceToday}%. Confira as medicacoes pendentes ou esquecidas hoje.`,
    });
  }

  if (alerts.length === 0 && summary.totalReadings > 0) {
    alerts.push({
      id: 'stable-overview',
      metric: 'pressure',
      tone: 'info',
      title: 'Sem alerta critico no momento',
      actionLabel: 'Abrir historico',
      description: 'As tendencias recentes nao dispararam sinais simples de atencao. Continue registrando para melhorar a leitura do historico.',
    });
  }

  return alerts.slice(0, 4);
}
