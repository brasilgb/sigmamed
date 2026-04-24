import * as Print from 'expo-print';

import { getDatabase } from '@/database/client';
import { getDashboardSummary, getDashboardTrends, getRecentHistory } from '@/services/dashboard.service';
import { getDashboardAlerts } from '@/services/dashboard-alerts.service';
import { formatDateTime } from '@/utils/date';
import type {
  BloodPressureReading,
  DashboardSummary,
  GlicoseReading,
  Medication,
  ReportData,
  ReportMetricSummary,
  ReportPeriodDays,
  WeightReading,
} from '@/types/health';

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
    return 'Sem leituras no periodo';
  }

  return `${reading.systolic}/${reading.diastolic} mmHg`;
}

function describeGlicose(reading: GlicoseReading | null) {
  if (!reading) {
    return 'Sem leituras no periodo';
  }

  return `${reading.glicoseValue} ${reading.unit}`;
}

function describeWeight(reading: WeightReading | null) {
  if (!reading) {
    return 'Sem leituras no periodo';
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
    database.getAllAsync<Medication>(
      `SELECT
          medications.id,
          medications.name,
          medications.dosage,
          medications.instructions,
          medications.active,
          medications.scheduled_time as scheduledTime,
          medications.reminder_enabled as reminderEnabled,
          medications.repeat_reminder_every_five_minutes as repeatReminderEveryFiveMinutes,
          medications.reminder_minutes_before as reminderMinutesBefore,
          (
            SELECT medication_logs.status
            FROM medication_logs
            WHERE medication_logs.medication_id = medications.id
              AND datetime(medication_logs.scheduled_at) >= datetime('now', ?)
            ORDER BY datetime(medication_logs.scheduled_at) DESC, medication_logs.id DESC
            LIMIT 1
          ) as todayStatus,
          (
            SELECT COALESCE(medication_logs.taken_at, medication_logs.scheduled_at)
            FROM medication_logs
            WHERE medication_logs.medication_id = medications.id
              AND datetime(medication_logs.scheduled_at) >= datetime('now', ?)
            ORDER BY datetime(medication_logs.scheduled_at) DESC, medication_logs.id DESC
            LIMIT 1
          ) as todayLoggedAt,
          medications.created_at as createdAt
        FROM medications
       ORDER BY medications.active DESC, medications.name ASC`,
      periodModifier,
      periodModifier
    ),
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

  const alerts = getDashboardAlerts(reportSummary, trends);

  return {
    periodDays,
    generatedAt: new Date().toISOString(),
    summary: reportSummary,
    trends,
    alerts,
    history,
    pressure: {
      summary: buildMetricSummary(
        'Pressao',
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

function renderListSection(title: string, items: string[]) {
  if (items.length === 0) {
    return `
      <section class="section">
        <h2>${escapeHtml(title)}</h2>
        <p class="empty">Sem registros no periodo.</p>
      </section>
    `;
  }

  return `
    <section class="section">
      <h2>${escapeHtml(title)}</h2>
      <ul class="list">
        ${items.map((item) => `<li>${item}</li>`).join('')}
      </ul>
    </section>
  `;
}

export function buildReportHtml(report: ReportData) {
  const pressureItems = report.pressure.readings.map(
    (item) =>
      `<strong>${item.systolic}/${item.diastolic} mmHg</strong> em ${escapeHtml(formatDateTime(item.measuredAt))}${
        item.pulse ? `, pulso ${item.pulse} bpm` : ''
      }${item.notes ? `, obs.: ${escapeHtml(item.notes)}` : ''}`
  );
  const glicoseItems = report.glicose.readings.map(
    (item) =>
      `<strong>${item.glicoseValue} ${item.unit}</strong> (${escapeHtml(item.context)}) em ${escapeHtml(
        formatDateTime(item.measuredAt)
      )}${item.notes ? `, obs.: ${escapeHtml(item.notes)}` : ''}`
  );
  const weightItems = report.weight.readings.map(
    (item) =>
      `<strong>${item.weight.toFixed(1)} ${item.unit}</strong> em ${escapeHtml(formatDateTime(item.measuredAt))}${
        item.height ? `, altura ${Math.round(item.height * 100)} cm` : ''
      }${item.notes ? `, obs.: ${escapeHtml(item.notes)}` : ''}`
  );
  const medicationItems = report.medications.items.map(
    (item) =>
      `<strong>${escapeHtml(item.name)}</strong> - ${escapeHtml(item.dosage)}${
        item.scheduledTime ? `, horario ${escapeHtml(item.scheduledTime)}` : ''
      }${item.active ? '' : ', inativa'}`
  );

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 28px; color: #102532; }
          h1 { margin: 0 0 8px; font-size: 28px; }
          h2 { margin: 0 0 12px; font-size: 18px; color: #0E9F8C; }
          p { margin: 0 0 8px; line-height: 1.5; }
          .meta { color: #4E6671; margin-bottom: 20px; }
          .grid { display: table; width: 100%; border-spacing: 12px; margin: 18px 0; }
          .cell { display: table-cell; width: 33.33%; border: 1px solid #CBDADF; border-radius: 16px; padding: 14px; vertical-align: top; }
          .kicker { font-size: 12px; text-transform: uppercase; color: #4E6671; font-weight: 700; margin-bottom: 6px; }
          .value { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
          .section { margin-top: 26px; }
          .list { padding-left: 18px; margin: 0; }
          .list li { margin-bottom: 8px; line-height: 1.5; }
          .badge { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #D8F1EC; color: #102532; font-size: 12px; font-weight: 700; margin: 0 8px 8px 0; }
          .empty { color: #4E6671; font-style: italic; }
        </style>
      </head>
      <body>
        <h1>Relatorio SigmaMed</h1>
        <p class="meta">Periodo: ultimos ${report.periodDays} dias | Gerado em ${escapeHtml(
          formatDateTime(report.generatedAt)
        )}</p>
        <div class="grid">
          <div class="cell">
            <div class="kicker">Registros</div>
            <div class="value">${report.summary.totalReadings}</div>
            <p>Pressao: ${report.pressure.summary.count}</p>
            <p>Glicose: ${report.glicose.summary.count}</p>
            <p>Peso: ${report.weight.summary.count}</p>
          </div>
          <div class="cell">
            <div class="kicker">Medicacao</div>
            <div class="value">${report.medications.summary.activeCount}</div>
            <p>ativas no momento</p>
            <p>Aderencia no periodo: ${report.medications.summary.adherenceRate}%</p>
          </div>
          <div class="cell">
            <div class="kicker">Ultimas leituras</div>
            <p>Pressao: ${escapeHtml(report.pressure.summary.latestLabel)}</p>
            <p>Glicose: ${escapeHtml(report.glicose.summary.latestLabel)}</p>
            <p>Peso: ${escapeHtml(report.weight.summary.latestLabel)}</p>
          </div>
        </div>

        <section class="section">
          <h2>Tendencias</h2>
          <p><span class="badge">${escapeHtml(report.trends.pressure.label)}</span>${escapeHtml(report.trends.pressure.detail)}</p>
          <p><span class="badge">${escapeHtml(report.trends.glicose.label)}</span>${escapeHtml(report.trends.glicose.detail)}</p>
          <p><span class="badge">${escapeHtml(report.trends.weight.label)}</span>${escapeHtml(report.trends.weight.detail)}</p>
        </section>

        <section class="section">
          <h2>Alertas</h2>
          ${
            report.alerts.length > 0
              ? report.alerts.map((alert) => `<p><strong>${escapeHtml(alert.title)}:</strong> ${escapeHtml(alert.description)}</p>`).join('')
              : '<p class="empty">Sem alertas no periodo.</p>'
          }
        </section>

        ${renderListSection('Pressao', pressureItems)}
        ${renderListSection('Glicose', glicoseItems)}
        ${renderListSection('Peso', weightItems)}
        ${renderListSection('Medicacoes', medicationItems)}

        <section class="section">
          <h2>Atividade recente</h2>
          ${
            report.history.length > 0
              ? `<ul class="list">${report.history
                  .slice(0, 10)
                  .map(
                    (item) =>
                      `<li><strong>${escapeHtml(item.title)}</strong> - ${escapeHtml(
                        item.subtitle
                      )} em ${escapeHtml(formatDateTime(item.timestamp))}</li>`
                  )
                  .join('')}</ul>`
              : '<p class="empty">Sem atividade recente.</p>'
          }
        </section>
      </body>
    </html>
  `;
}

export async function exportReportPdf(report: ReportData) {
  const html = buildReportHtml(report);
  return Print.printToFileAsync({
    html,
    base64: false,
  });
}
