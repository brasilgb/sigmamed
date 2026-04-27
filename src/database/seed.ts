import { getDatabase } from '@/database/client';
import { createSyncUuid } from '@/services/sync-metadata.service';
import { daysAgoIso, startOfTodayIso } from '@/utils/date';

export async function seedDatabaseIfEmpty() {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM blood_pressure_readings'
  );

  if ((result?.count ?? 0) > 0) {
    return;
  }

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO blood_pressure_readings
        (uuid, systolic, diastolic, pulse, measured_at, source, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      createSyncUuid(),
      128,
      82,
      71,
      daysAgoIso(0),
      'manual',
      'Após café da manhã'
    );
    await database.runAsync(
      `INSERT INTO blood_pressure_readings
        (uuid, systolic, diastolic, pulse, measured_at, source, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      createSyncUuid(),
      124,
      80,
      69,
      daysAgoIso(2),
      'manual',
      'Medição noturna'
    );

    await database.runAsync(
      `INSERT INTO glicose_readings
        (uuid, glicose_value, unit, context, measured_at, source, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      createSyncUuid(),
      102,
      'mg/dL',
      'fasting',
      daysAgoIso(0),
      'manual',
      'Antes do café'
    );
    await database.runAsync(
      `INSERT INTO glicose_readings
        (uuid, glicose_value, unit, context, measured_at, source, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      createSyncUuid(),
      138,
      'mg/dL',
      'post_meal',
      daysAgoIso(1),
      'manual',
      '2h após almoço'
    );

    await database.runAsync(
      `INSERT INTO weight_readings
        (uuid, weight, height, unit, measured_at, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      createSyncUuid(),
      78.4,
      1.72,
      'kg',
      daysAgoIso(1),
      'Pesagem matinal'
    );

    const medication = await database.runAsync(
      `INSERT INTO medications
        (uuid, name, dosage, instructions, active, scheduled_time, reminder_enabled, reminder_minutes_before, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      createSyncUuid(),
      'Losartana',
      '50 mg',
      'Tomar após o café',
      1,
      '08:00',
      1,
      5
    );

    await database.runAsync(
      `INSERT INTO medication_logs
        (uuid, medication_id, scheduled_at, taken_at, status, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      createSyncUuid(),
      medication.lastInsertRowId,
      startOfTodayIso(),
      new Date().toISOString(),
      'taken'
    );
  });
}
