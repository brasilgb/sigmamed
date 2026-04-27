import * as Print from 'expo-print';

import { getDatabase } from '@/database/client';
import { MedicationRepository } from '@/features/medications/medication.repository';
import { UserRepository } from '@/features/auth/repositories/user.repository';
import { getSessionUserId } from '@/features/auth/services/session-storage.service';
import { getDashboardSummary, getDashboardTrends, getRecentHistory } from '@/services/dashboard.service';
import { formatDate, formatDateTime } from '@/utils/date';
import type {
  BloodPressureReading,
  DashboardSummary,
  GlicoseReading,
  ReportData,
  ReportKind,
  ReportMetricSummary,
  ReportPeriodDays,
  WeightReading,
} from '@/types/health';

const userRepository = new UserRepository();
const medicationRepository = new MedicationRepository();

type CountRow = { count: number };

type AdherenceRow = {
  adherence: number;
  taken_count: number;
  skipped_count: number;
  pending_count: number;
  total_count: number;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function describePressure(reading: BloodPressureReading | null) {
  if (!reading) {
    return 'Sem leituras no período';
  }

  return `${reading.systolic}/${reading.diastolic} mmHg`;
}

function describeGlicose(reading: GlicoseReading | null) {
  if (!reading) {
    return 'Sem leituras no período';
  }

  return `${reading.glicoseValue} ${reading.unit}`;
}

function describeWeight(reading: WeightReading | null) {
  if (!reading) {
    return 'Sem leituras no período';
  }

  return `${reading.weight.toFixed(1)} ${reading.unit}`;
}

function buildMetricSummary(
  label: string,
  count: number,
  latestLabel: string,
  latestMeasuredAt: string | null
): ReportMetricSummary {
  return {
    label,
    count,
    latestLabel,
    latestMeasuredAt,
  };
}

export async function getReportData(periodDays: ReportPeriodDays): Promise<ReportData> {
  const database = await getDatabase();
  const periodModifier = `-${periodDays} day`;
  const sessionUserId = await getSessionUserId().catch(() => null);

  const [
    summary,
    trends,
    history,
    pressureReadings,
    glicoseReadings,
    weightReadings,
    medications,
    pressureCount,
    glicoseCount,
    weightCount,
    activeMedications,
    medicationStats,
  ] = await Promise.all([
    getDashboardSummary(),
    getDashboardTrends(periodDays),
    getRecentHistory(18),
    database.getAllAsync<BloodPressureReading>(
      `SELECT
        id,
        systolic,
        diastolic,
        pulse,
        measured_at as measuredAt,
        'manual' as source,
        notes,
        created_at as createdAt
       FROM blood_pressure_readings
       WHERE datetime(measured_at) >= datetime('now', ?)
       ORDER BY datetime(measured_at) DESC
       LIMIT 8`,
      periodModifier
    ),
    database.getAllAsync<GlicoseReading>(
      `SELECT
        id,
        glicose_value as glicoseValue,
        unit,
        context,
        measured_at as measuredAt,
        'manual' as source,
        notes,
        created_at as createdAt
       FROM glicose_readings
       WHERE datetime(measured_at) >= datetime('now', ?)
       ORDER BY datetime(measured_at) DESC
       LIMIT 8`,
      periodModifier
    ),
    database.getAllAsync<WeightReading>(
      `SELECT
        id,
        weight,
        height,
        unit,
        measured_at as measuredAt,
        notes,
        created_at as createdAt
       FROM weight_readings
       WHERE datetime(measured_at) >= datetime('now', ?)
       ORDER BY datetime(measured_at) DESC
       LIMIT 8`,
      periodModifier
    ),
    medicationRepository.listAll(),
    database.getFirstAsync<CountRow>(
      `SELECT COUNT(*) as count
       FROM blood_pressure_readings
       WHERE datetime(measured_at) >= datetime('now', ?)`,
      periodModifier
    ),
    database.getFirstAsync<CountRow>(
      `SELECT COUNT(*) as count
       FROM glicose_readings
       WHERE datetime(measured_at) >= datetime('now', ?)`,
      periodModifier
    ),
    database.getFirstAsync<CountRow>(
      `SELECT COUNT(*) as count
       FROM weight_readings
       WHERE datetime(measured_at) >= datetime('now', ?)`,
      periodModifier
    ),
    database.getFirstAsync<CountRow>('SELECT COUNT(*) as count FROM medications WHERE active = 1'),
    database.getFirstAsync<AdherenceRow>(
      `SELECT
        COALESCE(
          ROUND(
            100.0 * SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
            0
          ),
          0
        ) as adherence,
        SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken_count,
        SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        COUNT(*) as total_count
       FROM medication_logs
       WHERE datetime(scheduled_at) >= datetime('now', ?)`,
      periodModifier
    ),
  ]);

  let patient: ReportData['patient'] = null;

  if (sessionUserId) {
    try {
      const [currentUser, profile] = await Promise.all([
        userRepository.getById(sessionUserId),
        userRepository.getProfileByUserId(sessionUserId),
      ]);

      if (currentUser) {
        patient = {
          name: profile?.fullName ?? currentUser.name,
          email: currentUser.email,
          age: currentUser.age,
          birthDate: profile?.birthDate ?? null,
          sex: profile?.sex ?? null,
          height: profile?.height ?? null,
          targetWeight: profile?.targetWeight ?? null,
          hasDiabetes: profile?.hasDiabetes ?? false,
          hasHypertension: profile?.hasHypertension ?? false,
          notes: profile?.notes ?? null,
        };
      }
    } catch {
      patient = null;
    }
  }

  const reportSummary: DashboardSummary = {
    ...summary,
    totalReadings: (pressureCount?.count ?? 0) + (glicoseCount?.count ?? 0) + (weightCount?.count ?? 0),
    pressureLastSevenDays: pressureCount?.count ?? 0,
    glicoseLastSevenDays: glicoseCount?.count ?? 0,
    weightLastSevenDays: weightCount?.count ?? 0,
    activeMedications: activeMedications?.count ?? 0,
    adherenceToday: medicationStats?.adherence ?? 0,
    latestPressure: pressureReadings[0] ?? null,
    latestGlicose: glicoseReadings[0] ?? null,
    latestWeight: weightReadings[0] ?? null,
  };

  return {
    periodDays,
    generatedAt: new Date().toISOString(),
    patient,
    summary: reportSummary,
    trends,
    history,
    pressure: {
      summary: buildMetricSummary(
        'Pressão',
        pressureCount?.count ?? 0,
        describePressure(pressureReadings[0] ?? null),
        pressureReadings[0]?.measuredAt ?? null
      ),
      readings: pressureReadings,
    },
    glicose: {
      summary: buildMetricSummary(
        'Glicose',
        glicoseCount?.count ?? 0,
        describeGlicose(glicoseReadings[0] ?? null),
        glicoseReadings[0]?.measuredAt ?? null
      ),
      readings: glicoseReadings,
    },
    weight: {
      summary: buildMetricSummary(
        'Peso',
        weightCount?.count ?? 0,
        describeWeight(weightReadings[0] ?? null),
        weightReadings[0]?.measuredAt ?? null
      ),
      readings: weightReadings,
    },
    medications: {
      summary: {
        activeCount: activeMedications?.count ?? 0,
        adherenceRate: medicationStats?.adherence ?? 0,
        logsCount: medicationStats?.total_count ?? 0,
        takenCount: medicationStats?.taken_count ?? 0,
        skippedCount: medicationStats?.skipped_count ?? 0,
        pendingCount: medicationStats?.pending_count ?? 0,
      },
      items: medications.map((item) => ({
        ...item,
        active: Boolean(item.active),
        reminderEnabled: Boolean(item.reminderEnabled),
        repeatReminderEveryFiveMinutes: Boolean(item.repeatReminderEveryFiveMinutes),
      })),
    },
  };
}

function renderTableSection(title: string, headers: string[], rows: string[][]) {
  if (rows.length === 0) {
    return `
      <section class="section">
        <h2>${escapeHtml(title)}</h2>
        <p class="empty">Sem registros no período.</p>
      </section>
    `;
  }

  return `
    <section class="section">
      <h2>${escapeHtml(title)}</h2>
      <table>
        <thead>
          <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`
            )
            .join('')}
        </tbody>
      </table>
    </section>
  `;
}

export function buildReportHtml(report: ReportData) {
  return buildScopedReportHtml(report, 'complete');
}

function getReportTitle(kind: ReportKind) {
  switch (kind) {
    case 'pressure':
      return 'Relatório de pressão arterial';
    case 'glicose':
      return 'Relatório de glicose';
    case 'weight':
      return 'Relatório de peso';
    case 'medications':
      return 'Relatório de medicação';
    default:
      return 'Relatório de acompanhamento';
  }
}

function includesReportKind(current: ReportKind, target: Exclude<ReportKind, 'complete'>) {
  return current === 'complete' || current === target;
}

export function buildScopedReportHtml(report: ReportData, kind: ReportKind = 'complete') {
  const pressureRows = report.pressure.readings.map((item) => [
    escapeHtml(formatDateTime(item.measuredAt)),
    `${item.systolic}/${item.diastolic} mmHg`,
    item.pulse ? `${item.pulse} bpm` : '-',
    item.notes ? escapeHtml(item.notes) : '-',
  ]);
  const glicoseRows = report.glicose.readings.map((item) => [
    escapeHtml(formatDateTime(item.measuredAt)),
    `${item.glicoseValue} ${item.unit}`,
    escapeHtml(item.context),
    item.notes ? escapeHtml(item.notes) : '-',
  ]);
  const weightRows = report.weight.readings.map((item) => [
    escapeHtml(formatDateTime(item.measuredAt)),
    `${item.weight.toFixed(1)} ${item.unit}`,
    item.height ? `${Math.round(item.height * 100)} cm` : '-',
    item.notes ? escapeHtml(item.notes) : '-',
  ]);
  const medicationRows = report.medications.items.map((item) => [
    escapeHtml(item.name),
    escapeHtml(item.dosage),
    item.scheduledTime ? escapeHtml(item.scheduledTime) : '-',
    item.active ? 'Ativa' : 'Inativa',
  ]);
  const patientBadges = report.patient
    ? [
        report.patient.hasHypertension ? 'Hipertensão' : null,
        report.patient.hasDiabetes ? 'Diabetes' : null,
      ].filter(Boolean) as string[]
    : [];
  const showPressure = includesReportKind(kind, 'pressure');
  const showGlicose = includesReportKind(kind, 'glicose');
  const showWeight = includesReportKind(kind, 'weight');
  const showMedications = includesReportKind(kind, 'medications');
  const reportTitle = getReportTitle(kind);
  const totalScopedReadings =
    (showPressure ? report.pressure.summary.count : 0) +
    (showGlicose ? report.glicose.summary.count : 0) +
    (showWeight ? report.weight.summary.count : 0);
  const scopedSummary =
    kind === 'complete'
      ? `
        <div class="grid">
          <div class="cell">
            <div class="kicker">Registros</div>
            <div class="value">${report.summary.totalReadings}</div>
            <p>Pressão: ${report.pressure.summary.count}</p>
            <p>Glicose: ${report.glicose.summary.count}</p>
            <p>Peso: ${report.weight.summary.count}</p>
          </div>
          <div class="cell">
            <div class="kicker">Medicação</div>
            <div class="value">${report.medications.summary.activeCount}</div>
            <p>ativas no momento</p>
            <p>Aderência no período: ${report.medications.summary.adherenceRate}%</p>
          </div>
          <div class="cell">
            <div class="kicker">Últimas leituras</div>
            <p>Pressão: ${escapeHtml(report.pressure.summary.latestLabel)}</p>
            <p>Glicose: ${escapeHtml(report.glicose.summary.latestLabel)}</p>
            <p>Peso: ${escapeHtml(report.weight.summary.latestLabel)}</p>
          </div>
        </div>
      `
      : `
        <div class="grid">
          <div class="cell">
            <div class="kicker">${kind === 'medications' ? 'Medicações ativas' : 'Registros'}</div>
            <div class="value">${kind === 'medications' ? report.medications.summary.activeCount : totalScopedReadings}</div>
            <p>${kind === 'medications' ? 'tratamentos ativos no momento' : 'leituras no período selecionado'}</p>
          </div>
          <div class="cell">
            <div class="kicker">${kind === 'medications' ? 'Aderência' : 'Última leitura'}</div>
            <div class="value">${kind === 'medications' ? `${report.medications.summary.adherenceRate}%` : ''}</div>
            ${showPressure ? `<p>${escapeHtml(report.pressure.summary.latestLabel)}</p>` : ''}
            ${showGlicose ? `<p>${escapeHtml(report.glicose.summary.latestLabel)}</p>` : ''}
            ${showWeight ? `<p>${escapeHtml(report.weight.summary.latestLabel)}</p>` : ''}
            ${showMedications ? `<p>Registros no período: ${report.medications.summary.logsCount}</p>` : ''}
          </div>
          <div class="cell">
            <div class="kicker">Período</div>
            <div class="value">${report.periodDays}</div>
            <p>últimos dias</p>
          </div>
        </div>
      `;
  const trendsSection =
    showPressure || showGlicose || showWeight
      ? `
        <section class="section">
          <h2>Tendências</h2>
          ${showPressure ? `<p><span class="badge">${escapeHtml(report.trends.pressure.label)}</span>${escapeHtml(report.trends.pressure.detail)}</p>` : ''}
          ${showGlicose ? `<p><span class="badge">${escapeHtml(report.trends.glicose.label)}</span>${escapeHtml(report.trends.glicose.detail)}</p>` : ''}
          ${showWeight ? `<p><span class="badge">${escapeHtml(report.trends.weight.label)}</span>${escapeHtml(report.trends.weight.detail)}</p>` : ''}
        </section>
      `
      : '';

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; color: #102532; }
          h1 { margin: 0 0 6px; font-size: 30px; }
          h2 { margin: 0 0 12px; font-size: 18px; color: #0E9F8C; }
          p { margin: 0 0 8px; line-height: 1.5; }
          .meta { color: #4E6671; margin-bottom: 20px; }
          .header { border: 1px solid #CBDADF; border-radius: 18px; padding: 18px; background: #F7FBFC; }
          .header-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
          .brand { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #102532; color: #fff; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 10px; }
          .subtle { color: #4E6671; font-size: 13px; }
          .patient { margin-top: 16px; border-top: 1px solid #DCE7EA; padding-top: 16px; }
          .grid { display: table; width: 100%; border-spacing: 12px; margin: 18px 0; }
          .cell { display: table-cell; width: 33.33%; border: 1px solid #CBDADF; border-radius: 16px; padding: 14px; vertical-align: top; }
          .kicker { font-size: 12px; text-transform: uppercase; color: #4E6671; font-weight: 700; margin-bottom: 6px; }
          .value { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
          .section { margin-top: 26px; }
          .list { padding-left: 18px; margin: 0; }
          .list li { margin-bottom: 8px; line-height: 1.5; }
          .badge { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #D8F1EC; color: #102532; font-size: 12px; font-weight: 700; margin: 0 8px 8px 0; }
          .empty { color: #4E6671; font-style: italic; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #D7E2E6; border-radius: 12px; overflow: hidden; }
          th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #E3ECEF; font-size: 13px; vertical-align: top; }
          th { background: #F2F7F8; color: #29404C; font-size: 12px; text-transform: uppercase; letter-spacing: .4px; }
          tr:last-child td { border-bottom: none; }
        </style>
      </head>
      <body>
        <section class="header">
          <div class="header-top">
            <div>
              <div class="brand">SigmaMed</div>
              <h1>${escapeHtml(reportTitle)}</h1>
              <p class="meta">Período: últimos ${report.periodDays} dias | Gerado em ${escapeHtml(
                formatDateTime(report.generatedAt)
              )}</p>
            </div>
            <div class="subtle">Uso pessoal e compartilhamento clínico</div>
          </div>
          ${
            report.patient
              ? `
              <div class="patient">
                <h2>Identificação do paciente</h2>
                <p><strong>Nome:</strong> ${escapeHtml(report.patient.name)}</p>
                <p><strong>E-mail:</strong> ${escapeHtml(report.patient.email)}</p>
                <p><strong>Idade:</strong> ${report.patient.age ? `${report.patient.age} anos` : '-'}</p>
                <p><strong>Nascimento:</strong> ${report.patient.birthDate ? escapeHtml(formatDate(report.patient.birthDate)) : '-'}</p>
                <p><strong>Sexo:</strong> ${report.patient.sex ? escapeHtml(report.patient.sex) : '-'}</p>
                <p><strong>Altura:</strong> ${report.patient.height ? `${Math.round(report.patient.height * 100)} cm` : '-'}</p>
                <p><strong>Peso-alvo:</strong> ${report.patient.targetWeight ? `${report.patient.targetWeight.toFixed(1)} kg` : '-'}</p>
                <p>${patientBadges.length > 0 ? patientBadges.map((item) => `<span class="badge">${escapeHtml(item)}</span>`).join('') : '<span class="subtle">Sem marcadores clínicos adicionais</span>'}</p>
                ${report.patient.notes ? `<p><strong>Observações:</strong> ${escapeHtml(report.patient.notes)}</p>` : ''}
              </div>
            `
              : ''
          }
        </section>

        ${scopedSummary}
        ${trendsSection}

        ${showPressure ? renderTableSection('Pressão arterial', ['Data e hora', 'Leitura', 'Pulso', 'Observações'], pressureRows) : ''}
        ${showGlicose ? renderTableSection('Glicose', ['Data e hora', 'Valor', 'Contexto', 'Observações'], glicoseRows) : ''}
        ${showWeight ? renderTableSection('Peso', ['Data e hora', 'Peso', 'Altura', 'Observações'], weightRows) : ''}
        ${showMedications ? renderTableSection('Medicações', ['Medicação', 'Dosagem', 'Horário', 'Status'], medicationRows) : ''}

        ${kind === 'complete' ? `<section class="section">
          <h2>Atividade recente</h2>
          ${
            report.history.length > 0
              ? `<ul class="list">${report.history
                  .slice(0, 10)
                  .map(
                    (item) =>
                      `<li><strong>${escapeHtml(item.title)}</strong> - ${escapeHtml(
                        item.subtitle
                      )} em ${escapeHtml(item.timestamp)}</li>`
                  )
                  .join('')}</ul>`
              : '<p class="empty">Sem atividade recente.</p>'
          }
        </section>` : ''}
      </body>
    </html>
  `;
}

export async function exportReportPdf(report: ReportData, kind: ReportKind = 'complete') {
  const html = buildScopedReportHtml(report, kind);
  return Print.printToFileAsync({
    html,
    base64: false,
  });
}
