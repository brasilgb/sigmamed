export type EntrySource = 'manual';

export type ReportPeriodDays = 7 | 30 | 90;

export type ReportKind = 'complete' | 'pressure' | 'glicose' | 'weight' | 'medications';
export type ReportModule = Exclude<ReportKind, 'complete'>;

export type GlicoseContext = 'fasting' | 'post_meal' | 'random';

export type MedicationLogStatus = 'pending' | 'taken' | 'skipped';

export type BloodPressureReading = {
  id: number;
  uuid: string;
  profileId: number | null;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  measuredAt: string;
  source: EntrySource;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  deletedAt: string | null;
};

export type NewBloodPressureReading = Omit<BloodPressureReading, 'id' | 'uuid' | 'profileId' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'deletedAt'>;

export type GlicoseReading = {
  id: number;
  uuid: string;
  profileId: number | null;
  glicoseValue: number;
  unit: 'mg/dL';
  context: GlicoseContext;
  measuredAt: string;
  source: EntrySource;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  deletedAt: string | null;
};

export type NewGlicoseReading = Omit<GlicoseReading, 'id' | 'uuid' | 'profileId' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'deletedAt'>;

export type WeightReading = {
  id: number;
  uuid: string;
  profileId: number | null;
  weight: number;
  height: number | null;
  unit: 'kg';
  measuredAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  deletedAt: string | null;
};

export type NewWeightReading = Omit<WeightReading, 'id' | 'uuid' | 'profileId' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'deletedAt'>;

export type Medication = {
  id: number;
  uuid: string;
  profileId: number | null;
  name: string;
  dosage: string;
  instructions: string | null;
  active: boolean;
  scheduledTime: string | null;
  doseInterval: string | null;
  reminderEnabled: boolean;
  repeatReminderEveryFiveMinutes: boolean;
  reminderMinutesBefore: number;
  todayStatus?: MedicationLogStatus | null;
  todayLoggedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  deletedAt: string | null;
};

export type NewMedication = Omit<Medication, 'id' | 'uuid' | 'profileId' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'deletedAt' | 'todayStatus' | 'todayLoggedAt'>;

export type MedicationLog = {
  id: number;
  uuid: string;
  profileId: number | null;
  medicationId: number;
  scheduledAt: string;
  takenAt: string | null;
  status: MedicationLogStatus;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  deletedAt: string | null;
};

export type NewMedicationLog = Omit<MedicationLog, 'id' | 'uuid' | 'profileId' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'deletedAt'>;

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
    age: number | null;
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
