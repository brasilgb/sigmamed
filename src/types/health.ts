export type EntrySource = 'manual' | 'photo' | 'bluetooth';

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
  reminderMinutesBefore: number;
  createdAt: string;
};

export type NewMedication = Omit<Medication, 'id' | 'createdAt'>;

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
  periodDays: 7 | 30;
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
