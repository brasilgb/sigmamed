import { getDatabase } from '@/database/client';
import { pullSyncItems } from '@/services/sync-api.service';

type RemoteBaseItem = {
  uuid: string;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

type RemoteBloodPressure = RemoteBaseItem & {
  systolic: number;
  diastolic: number;
  pulse: number | null;
  measured_at: string;
  source: string;
  notes?: string | null;
};

type RemoteGlicose = RemoteBaseItem & {
  glicose_value: number;
  unit: 'mg/dL';
  context?: string | null;
  measured_at: string;
  source: string;
  notes?: string | null;
};

type RemoteWeight = RemoteBaseItem & {
  weight: number;
  height?: number | null;
  unit: 'kg';
  measured_at: string;
  notes?: string | null;
};

type RemoteMedication = RemoteBaseItem & {
  name: string;
  dosage?: string | null;
  instructions?: string | null;
  active: boolean | number;
  scheduled_time?: string | null;
  reminder_enabled: boolean | number;
  reminder_minutes_before?: number | null;
  repeat_reminder_every_five_minutes: boolean | number;
};

type RemoteMedicationLog = RemoteBaseItem & {
  medication_id?: number | null;
  medication_uuid?: string | null;
  taken_at: string;
  notes?: string | null;
};

function nowIso() {
  return new Date().toISOString();
}

function asTimestamp(value: string | null | undefined) {
  return value ?? nowIso();
}

function asTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const timeMatch = value.match(/\b(\d{2}):(\d{2})(?::\d{2})?\b/);
  return timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : value;
}

async function upsertBloodPressure(items: RemoteBloodPressure[]) {
  const database = await getDatabase();

  for (const item of items) {
    const existing = await database.getFirstAsync<{ id: number }>(
      'SELECT id FROM blood_pressure_readings WHERE uuid = ?',
      item.uuid
    );

    if (existing) {
      await database.runAsync(
        `UPDATE blood_pressure_readings
         SET systolic = ?, diastolic = ?, pulse = ?, measured_at = ?, source = ?, notes = ?,
             updated_at = ?, deleted_at = ?, synced_at = CURRENT_TIMESTAMP
         WHERE uuid = ?`,
        item.systolic,
        item.diastolic,
        item.pulse,
        item.measured_at,
        item.source,
        item.notes ?? null,
        asTimestamp(item.updated_at),
        item.deleted_at ?? null,
        item.uuid
      );
    } else {
      await database.runAsync(
        `INSERT INTO blood_pressure_readings
          (uuid, systolic, diastolic, pulse, measured_at, source, notes, created_at, updated_at, deleted_at, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        item.uuid,
        item.systolic,
        item.diastolic,
        item.pulse,
        item.measured_at,
        item.source,
        item.notes ?? null,
        asTimestamp(item.created_at),
        asTimestamp(item.updated_at),
        item.deleted_at ?? null
      );
    }
  }
}

async function upsertGlicose(items: RemoteGlicose[]) {
  const database = await getDatabase();

  for (const item of items) {
    const existing = await database.getFirstAsync<{ id: number }>(
      'SELECT id FROM glicose_readings WHERE uuid = ?',
      item.uuid
    );

    if (existing) {
      await database.runAsync(
        `UPDATE glicose_readings
         SET glicose_value = ?, unit = ?, context = ?, measured_at = ?, source = ?, notes = ?,
             updated_at = ?, deleted_at = ?, synced_at = CURRENT_TIMESTAMP
         WHERE uuid = ?`,
        item.glicose_value,
        item.unit,
        item.context ?? 'random',
        item.measured_at,
        item.source,
        item.notes ?? null,
        asTimestamp(item.updated_at),
        item.deleted_at ?? null,
        item.uuid
      );
    } else {
      await database.runAsync(
        `INSERT INTO glicose_readings
          (uuid, glicose_value, unit, context, measured_at, source, notes, created_at, updated_at, deleted_at, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        item.uuid,
        item.glicose_value,
        item.unit,
        item.context ?? 'random',
        item.measured_at,
        item.source,
        item.notes ?? null,
        asTimestamp(item.created_at),
        asTimestamp(item.updated_at),
        item.deleted_at ?? null
      );
    }
  }
}

async function upsertWeight(items: RemoteWeight[]) {
  const database = await getDatabase();

  for (const item of items) {
    const existing = await database.getFirstAsync<{ id: number }>(
      'SELECT id FROM weight_readings WHERE uuid = ?',
      item.uuid
    );

    if (existing) {
      await database.runAsync(
        `UPDATE weight_readings
         SET weight = ?, height = ?, unit = ?, measured_at = ?, notes = ?,
             updated_at = ?, deleted_at = ?, synced_at = CURRENT_TIMESTAMP
         WHERE uuid = ?`,
        item.weight,
        item.height ?? null,
        item.unit,
        item.measured_at,
        item.notes ?? null,
        asTimestamp(item.updated_at),
        item.deleted_at ?? null,
        item.uuid
      );
    } else {
      await database.runAsync(
        `INSERT INTO weight_readings
          (uuid, weight, height, unit, measured_at, notes, created_at, updated_at, deleted_at, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        item.uuid,
        item.weight,
        item.height ?? null,
        item.unit,
        item.measured_at,
        item.notes ?? null,
        asTimestamp(item.created_at),
        asTimestamp(item.updated_at),
        item.deleted_at ?? null
      );
    }
  }
}

async function upsertMedications(items: RemoteMedication[]) {
  const database = await getDatabase();

  for (const item of items) {
    const existing = await database.getFirstAsync<{ id: number }>(
      'SELECT id FROM medications WHERE uuid = ?',
      item.uuid
    );

    const active = item.active ? 1 : 0;
    const reminderEnabled = item.reminder_enabled ? 1 : 0;
    const repeatReminder = item.repeat_reminder_every_five_minutes ? 1 : 0;

    if (existing) {
      await database.runAsync(
        `UPDATE medications
         SET name = ?, dosage = ?, instructions = ?, active = ?, scheduled_time = ?,
             reminder_enabled = ?, reminder_minutes_before = ?, repeat_reminder_every_five_minutes = ?,
             updated_at = ?, deleted_at = ?, synced_at = CURRENT_TIMESTAMP
         WHERE uuid = ?`,
        item.name,
        item.dosage ?? '',
        item.instructions ?? null,
        active,
        asTime(item.scheduled_time),
        reminderEnabled,
        item.reminder_minutes_before ?? 5,
        repeatReminder,
        asTimestamp(item.updated_at),
        item.deleted_at ?? null,
        item.uuid
      );
    } else {
      await database.runAsync(
        `INSERT INTO medications
          (uuid, name, dosage, instructions, active, scheduled_time, reminder_enabled,
           reminder_minutes_before, repeat_reminder_every_five_minutes, created_at, updated_at, deleted_at, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        item.uuid,
        item.name,
        item.dosage ?? '',
        item.instructions ?? null,
        active,
        asTime(item.scheduled_time),
        reminderEnabled,
        item.reminder_minutes_before ?? 5,
        repeatReminder,
        asTimestamp(item.created_at),
        asTimestamp(item.updated_at),
        item.deleted_at ?? null
      );
    }
  }
}

async function upsertMedicationLogs(items: RemoteMedicationLog[]) {
  const database = await getDatabase();

  for (const item of items) {
    const medication = item.medication_uuid
      ? await database.getFirstAsync<{ id: number }>(
          'SELECT id FROM medications WHERE uuid = ?',
          item.medication_uuid
        )
      : null;
    const medicationId = medication?.id ?? item.medication_id;

    if (!medicationId) {
      continue;
    }

    const existing = await database.getFirstAsync<{ id: number }>(
      'SELECT id FROM medication_logs WHERE uuid = ?',
      item.uuid
    );

    const status = item.deleted_at ? 'skipped' : 'taken';

    if (existing) {
      await database.runAsync(
        `UPDATE medication_logs
         SET medication_id = ?, scheduled_at = ?, taken_at = ?, status = ?,
             updated_at = ?, deleted_at = ?, synced_at = CURRENT_TIMESTAMP
         WHERE uuid = ?`,
        medicationId,
        item.taken_at,
        item.deleted_at ? null : item.taken_at,
        status,
        asTimestamp(item.updated_at),
        item.deleted_at ?? null,
        item.uuid
      );
    } else {
      await database.runAsync(
        `INSERT INTO medication_logs
          (uuid, medication_id, scheduled_at, taken_at, status, created_at, updated_at, deleted_at, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        item.uuid,
        medicationId,
        item.taken_at,
        item.deleted_at ? null : item.taken_at,
        status,
        asTimestamp(item.created_at),
        asTimestamp(item.updated_at),
        item.deleted_at ?? null
      );
    }
  }
}

export async function pullRemoteRecords() {
  const [pressure, glicose, weight, medications] = await Promise.all([
    pullSyncItems<RemoteBloodPressure>({ resource: 'blood-pressure' }),
    pullSyncItems<RemoteGlicose>({ resource: 'glicose' }),
    pullSyncItems<RemoteWeight>({ resource: 'weight' }),
    pullSyncItems<RemoteMedication>({ resource: 'medications' }),
  ]);

  await upsertBloodPressure(pressure.data);
  await upsertGlicose(glicose.data);
  await upsertWeight(weight.data);
  await upsertMedications(medications.data);

  const logs = await pullSyncItems<RemoteMedicationLog>({ resource: 'medication-logs' });
  await upsertMedicationLogs(logs.data);
}
