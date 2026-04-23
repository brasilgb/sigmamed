import { getDatabase } from '@/database/client';
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
        (systolic, diastolic, pulse, measured_at, source, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      128,
      82,
      71,
      daysAgoIso(0),
      'manual',
      'Após café da manhã'
    );
    await database.runAsync(
      `INSERT INTO blood_pressure_readings
        (systolic, diastolic, pulse, measured_at, source, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      124,
      80,
      69,
      daysAgoIso(2),
      'manual',
      'Medição noturna'
    );

    await database.runAsync(
      `INSERT INTO glicose_readings
        (glicose_value, unit, context, measured_at, source, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      102,
      'mg/dL',
      'fasting',
      daysAgoIso(0),
      'manual',
      'Antes do café'
    );
    await database.runAsync(
      `INSERT INTO glicose_readings
        (glicose_value, unit, context, measured_at, source, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      138,
      'mg/dL',
      'post_meal',
      daysAgoIso(1),
      'manual',
      '2h após almoço'
    );

    await database.runAsync(
      `INSERT INTO weight_readings
        (weight, unit, measured_at, notes)
       VALUES (?, ?, ?, ?)`,
      78.4,
      'kg',
      daysAgoIso(1),
      'Pesagem matinal'
    );

    const medication = await database.runAsync(
      `INSERT INTO medications
        (name, dosage, instructions, active)
       VALUES (?, ?, ?, ?)`,
      'Losartana',
      '50 mg',
      'Tomar após o café',
      1
    );

    await database.runAsync(
      `INSERT INTO medication_logs
        (medication_id, scheduled_at, taken_at, status)
       VALUES (?, ?, ?, ?)`,
      medication.lastInsertRowId,
      startOfTodayIso(),
      new Date().toISOString(),
      'taken'
    );
  });
}
