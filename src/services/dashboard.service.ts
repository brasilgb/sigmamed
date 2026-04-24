import { getDatabase } from '@/database/client';
import type { DashboardSummary, DashboardTrends, HistoryItem, MetricTrend, TrendDirection, TrendPoint } from '@/types/health';
import { formatDateTime, formatDayLabel } from '@/utils/date';

type CountRow = { count: number };

type AdherenceRow = { adherence: number };

type MetricRow = {
  measuredAt: string;
  value: number;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const database = await getDatabase();

  const [
    totalPressure,
    totalGlicose,
    totalWeight,
    latestPressure,
    latestGlicose,
    latestWeight,
    activeMedications,
    pressureLastSevenDays,
    glicoseLastSevenDays,
    weightLastSevenDays,
    adherenceToday,
  ] = await Promise.all([
    database.getFirstAsync<CountRow>('SELECT COUNT(*) as count FROM blood_pressure_readings'),
    database.getFirstAsync<CountRow>('SELECT COUNT(*) as count FROM glicose_readings'),
    database.getFirstAsync<CountRow>('SELECT COUNT(*) as count FROM weight_readings'),
    database.getFirstAsync<DashboardSummary['latestPressure']>(
      `SELECT
        id,
        systolic,
        diastolic,
        pulse,
        measured_at as measuredAt,
        source,
        notes,
        created_at as createdAt
       FROM blood_pressure_readings
       ORDER BY datetime(measured_at) DESC
       LIMIT 1`
    ),
    database.getFirstAsync<DashboardSummary['latestGlicose']>(
      `SELECT
        id,
        glicose_value as glicoseValue,
        unit,
        context,
        measured_at as measuredAt,
        source,
        notes,
        created_at as createdAt
       FROM glicose_readings
       ORDER BY datetime(measured_at) DESC
       LIMIT 1`
    ),
    database.getFirstAsync<DashboardSummary['latestWeight']>(
      `SELECT
        id,
        weight,
        height,
        unit,
        measured_at as measuredAt,
        notes,
        created_at as createdAt
       FROM weight_readings
       ORDER BY datetime(measured_at) DESC
       LIMIT 1`
    ),
    database.getFirstAsync<CountRow>('SELECT COUNT(*) as count FROM medications WHERE active = 1'),
    database.getFirstAsync<CountRow>(
      `SELECT COUNT(*) as count
       FROM blood_pressure_readings
       WHERE datetime(measured_at) >= datetime('now', '-7 day')`
    ),
    database.getFirstAsync<CountRow>(
      `SELECT COUNT(*) as count
       FROM glicose_readings
       WHERE datetime(measured_at) >= datetime('now', '-7 day')`
    ),
    database.getFirstAsync<CountRow>(
      `SELECT COUNT(*) as count
       FROM weight_readings
       WHERE datetime(measured_at) >= datetime('now', '-7 day')`
    ),
    database.getFirstAsync<AdherenceRow>(
      `SELECT
        COALESCE(
          ROUND(
            100.0 * SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
            0
          ),
          0
        ) as adherence
       FROM medication_logs
       WHERE date(scheduled_at) = date('now')`
    ),
  ]);

  return {
    totalReadings: (totalPressure?.count ?? 0) + (totalGlicose?.count ?? 0) + (totalWeight?.count ?? 0),
    pressureLastSevenDays: pressureLastSevenDays?.count ?? 0,
    glicoseLastSevenDays: glicoseLastSevenDays?.count ?? 0,
    weightLastSevenDays: weightLastSevenDays?.count ?? 0,
    activeMedications: activeMedications?.count ?? 0,
    adherenceToday: adherenceToday?.adherence ?? 0,
    latestPressure: latestPressure ?? null,
    latestGlicose: latestGlicose ?? null,
    latestWeight: latestWeight ?? null,
  };
}

function buildDaySeries(periodDays: 7 | 30) {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = periodDays - 1; offset >= 0; offset -= 1) {
    const current = new Date(today);
    current.setDate(today.getDate() - offset);
    dates.push(current.toISOString());
  }

  return dates;
}

function getTrendDirection(delta: number | null): TrendDirection {
  if (delta === null || Math.abs(delta) < 0.01) {
    return 'stable';
  }

  return delta > 0 ? 'up' : 'down';
}

function buildTrendDetail(label: string, unit: string, latestValue: number | null, delta: number | null) {
  if (latestValue === null) {
    return `Sem leituras de ${label.toLowerCase()} no periodo.`;
  }

  if (delta === null || Math.abs(delta) < 0.01) {
    return `Estavel no periodo em ${latestValue.toFixed(0)} ${unit}.`;
  }

  const signal = delta > 0 ? 'Alta' : 'Queda';
  return `${signal} de ${Math.abs(delta).toFixed(0)} ${unit} frente ao valor anterior.`;
}

function buildMetricTrend(
  key: MetricTrend['key'],
  label: string,
  unit: string,
  periodDays: 7 | 30,
  rows: MetricRow[]
): MetricTrend {
  const grouped = new Map<string, number[]>();

  rows.forEach((row) => {
    const dayKey = row.measuredAt.slice(0, 10);
    const values = grouped.get(dayKey) ?? [];
    values.push(row.value);
    grouped.set(dayKey, values);
  });

  const points: TrendPoint[] = buildDaySeries(periodDays).map((date) => {
    const dayKey = date.slice(0, 10);
    const values = grouped.get(dayKey);
    const value = values && values.length > 0
      ? values.reduce((total, current) => total + current, 0) / values.length
      : null;

    return {
      date,
      label: formatDayLabel(date),
      value,
    };
  });

  const numericPoints = points.filter((point) => point.value !== null);
  const latestValue = numericPoints.at(-1)?.value ?? null;
  const previousValue = numericPoints.length > 1 ? numericPoints.at(-2)?.value ?? null : null;
  const delta = latestValue !== null && previousValue !== null ? latestValue - previousValue : null;

  return {
    key,
    label,
    unit,
    points,
    latestValue,
    previousValue,
    delta,
    direction: getTrendDirection(delta),
    detail: buildTrendDetail(label, unit, latestValue, delta),
  };
}

export async function getDashboardTrends(periodDays: 7 | 30 = 7): Promise<DashboardTrends> {
  const database = await getDatabase();
  const periodModifier = `-${periodDays} day`;

  const [pressureRows, glicoseRows, weightRows] = await Promise.all([
    database.getAllAsync<MetricRow>(
      `SELECT measured_at as measuredAt, systolic as value
       FROM blood_pressure_readings
       WHERE datetime(measured_at) >= datetime('now', ?)
       ORDER BY datetime(measured_at) ASC`,
      periodModifier
    ),
    database.getAllAsync<MetricRow>(
      `SELECT measured_at as measuredAt, glicose_value as value
       FROM glicose_readings
       WHERE datetime(measured_at) >= datetime('now', ?)
       ORDER BY datetime(measured_at) ASC`,
      periodModifier
    ),
    database.getAllAsync<MetricRow>(
      `SELECT measured_at as measuredAt, weight as value
       FROM weight_readings
       WHERE datetime(measured_at) >= datetime('now', ?)
       ORDER BY datetime(measured_at) ASC`,
      periodModifier
    ),
  ]);

  return {
    periodDays,
    pressure: buildMetricTrend('pressure', 'Sistolica media', 'mmHg', periodDays, pressureRows),
    glicose: buildMetricTrend('glicose', 'Glicose media', 'mg/dL', periodDays, glicoseRows),
    weight: buildMetricTrend('weight', 'Peso medio', 'kg', periodDays, weightRows),
  };
}

type UnifiedHistoryRow = {
  id: number;
  category: HistoryItem['category'];
  title: string;
  subtitle: string;
  measured_at: string;
};

export async function getRecentHistory(limit = 12): Promise<HistoryItem[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<UnifiedHistoryRow>(
    `
      SELECT id, category, title, subtitle, measured_at
      FROM (
        SELECT
          id,
          'pressure' as category,
          systolic || '/' || diastolic || ' mmHg' as title,
          COALESCE('Pulso ' || pulse || ' bpm', 'Sem pulso informado') as subtitle,
          measured_at
        FROM blood_pressure_readings
        UNION ALL
        SELECT
          id,
          'glicose' as category,
          glicose_value || ' ' || unit as title,
          CASE context
            WHEN 'fasting' THEN 'Jejum'
            WHEN 'post_meal' THEN 'Pós-refeição'
            ELSE 'Aleatória'
          END as subtitle,
          measured_at
        FROM glicose_readings
        UNION ALL
        SELECT
          id,
          'weight' as category,
          weight || ' ' || unit as title,
          COALESCE(notes, 'Peso registrado') as subtitle,
          measured_at
        FROM weight_readings
        UNION ALL
        SELECT
          medication_logs.id as id,
          'medication' as category,
          medications.name || ' ' || medications.dosage as title,
          CASE medication_logs.status
            WHEN 'taken' THEN 'Dose tomada'
            WHEN 'skipped' THEN 'Dose ignorada'
            ELSE 'Dose pendente'
          END as subtitle,
          medication_logs.scheduled_at as measured_at
        FROM medication_logs
        INNER JOIN medications ON medications.id = medication_logs.medication_id
      )
      ORDER BY measured_at DESC
      LIMIT ?
    `,
    limit
  );

  return rows.map((row) => ({
    id: `${row.category}-${row.id}`,
    category: row.category,
    title: row.title,
    subtitle: row.subtitle,
    timestamp: formatDateTime(row.measured_at),
  }));
}
