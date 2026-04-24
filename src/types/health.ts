export type EntrySource = 'manual';

export type ReportPeriodDays = 7 | 30 | 90;

export type GlicoseContext = 'fasting' | 'post_meal' | 'random';

export type MedicationLogStatus = 'pending' | 'taken' | 'skipped';

export type BloodPressureReading = {
  id: number;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  measuredAt: string;
  source: EntrySource;
  notes: string | null;
  createdAt: string;
};

export type NewBloodPressureReading = Omit<BloodPressureReading, 'id' | 'createdAt'>;

export type GlicoseReading = {
  id: number;
  glicoseValue: number;
  unit: 'mg/dL';
  context: GlicoseContext;
  measuredAt: string;
  source: EntrySource;
  notes: string | null;
  createdAt: string;
};

export type NewGlicoseReading = Omit<GlicoseReading, 'id' | 'createdAt'>;

export type WeightReading = {
  id: number;
  weight: number;
  height: number | null;
  unit: 'kg';
  measuredAt: string;
  notes: string | null;
  createdAt: string;
};

export type NewWeightReading = Omit<WeightReading, 'id' | 'createdAt'>;

export type Medication = {
  id: number;
  name: string;
  dosage: string;
  instructions: string | null;
  active: boolean;
  scheduledTime: string | null;
  reminderEnabled: boolean;
  repeatReminderEveryFiveMinutes: boolean;
  reminderMinutesBefore: number;
  todayStatus?: MedicationLogStatus | null;
  todayLoggedAt?: string | null;
  createdAt: string;
};

export type NewMedication = Omit<Medication, 'id' | 'createdAt' | 'todayStatus' | 'todayLoggedAt'>;

export type MedicationLog = {
  id: number;
  medicationId: number;
  scheduledAt: string;
  takenAt: string | null;
  status: MedicationLogStatus;
  createdAt: string;
};

export type NewMedicationLog = Omit<MedicationLog, 'id' | 'createdAt'>;

export type HistoryItem = {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  category: 'pressure' | 'glicose' | 'weight' | 'medication';
};

export type DashboardSummary = {
  totalReadings: number;
  pressureLastSevenDays: number;
  glicoseLastSevenDays: number;
  weightLastSevenDays: number;
  activeMedications: number;
  adherenceToday: number;
  latestPressure: BloodPressureReading | null;
  latestGlicose: GlicoseReading | null;
  latestWeight: WeightReading | null;
};

export type TrendDirection = 'up' | 'down' | 'stable';

export type TrendPoint = {
  label: string;
  date: string;
  value: number | null;
};

export type MetricTrend = {
  key: 'pressure' | 'glicose' | 'weight';
  label: string;
  unit: string;
  points: TrendPoint[];
  latestValue: number | null;
  previousValue: number | null;
  delta: number | null;
  direction: TrendDirection;
  detail: string;
};

export type DashboardTrends = {
  periodDays: ReportPeriodDays;
  pressure: MetricTrend;
  glicose: MetricTrend;
  weight: MetricTrend;
};

export type DashboardAlertTone = 'warning' | 'danger' | 'info';

export type DashboardAlert = {
  id: string;
  title: string;
  description: string;
  tone: DashboardAlertTone;
  metric: 'pressure' | 'glicose' | 'weight' | 'medication';
  actionLabel: string;
};

export type ReportMetricSummary = {
  label: string;
  count: number;
  latestLabel: string;
  latestMeasuredAt: string | null;
};

export type ReportMedicationSummary = {
  activeCount: number;
  adherenceRate: number;
  logsCount: number;
  takenCount: number;
  skippedCount: number;
  pendingCount: number;
};

export type ReportData = {
  periodDays: ReportPeriodDays;
  generatedAt: string;
  patient: {
    name: string;
    email: string;
    birthDate: string | null;
    sex: string | null;
    height: number | null;
    targetWeight: number | null;
    hasDiabetes: boolean;
    hasHypertension: boolean;
    notes: string | null;
  } | null;
  summary: DashboardSummary;
  trends: DashboardTrends;
  alerts: DashboardAlert[];
  history: HistoryItem[];
  pressure: {
    summary: ReportMetricSummary;
    readings: BloodPressureReading[];
  };
  glicose: {
    summary: ReportMetricSummary;
    readings: GlicoseReading[];
  };
  weight: {
    summary: ReportMetricSummary;
    readings: WeightReading[];
  };
  medications: {
    summary: ReportMedicationSummary;
    items: Medication[];
  };
};
