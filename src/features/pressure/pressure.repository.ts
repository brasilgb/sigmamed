import { getDatabase } from '@/database/client';
import type { BloodPressureReading, NewBloodPressureReading } from '@/types/health';

type BloodPressureRow = {
  id: number;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  measured_at: string;
  source: string;
  notes: string | null;
  created_at: string;
};

function mapRow(row: BloodPressureRow): BloodPressureReading {
  return {
    id: row.id,
    systolic: row.systolic,
    diastolic: row.diastolic,
    pulse: row.pulse,
    measuredAt: row.measured_at,
    source: 'manual',
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export class PressureRepository {
  async getById(id: number) {
    const database = await getDatabase();
    const row = await database.getFirstAsync<BloodPressureRow>(
      'SELECT * FROM blood_pressure_readings WHERE id = ?',
      id
    );

    return row ? mapRow(row) : null;
  }

  async listRecent(limit = 10) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<BloodPressureRow>(
      `SELECT * FROM blood_pressure_readings
       ORDER BY datetime(measured_at) DESC
       LIMIT ?`,
      limit
    );

    return rows.map(mapRow);
  }

  async create(input: NewBloodPressureReading) {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO blood_pressure_readings
        (systolic, diastolic, pulse, measured_at, source, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      input.systolic,
      input.diastolic,
      input.pulse,
      input.measuredAt,
      input.source,
      input.notes
    );

    const row = await database.getFirstAsync<BloodPressureRow>(
      'SELECT * FROM blood_pressure_readings WHERE id = ?',
      result.lastInsertRowId
    );

    if (!row) {
      throw new Error('Failed to create blood pressure reading');
    }

    return mapRow(row);
  }

  async update(id: number, input: NewBloodPressureReading) {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE blood_pressure_readings
       SET systolic = ?, diastolic = ?, pulse = ?, measured_at = ?, source = ?, notes = ?
       WHERE id = ?`,
      input.systolic,
      input.diastolic,
      input.pulse,
      input.measuredAt,
      input.source,
      input.notes,
      id
    );

    const row = await this.getById(id);

    if (!row) {
      throw new Error('Failed to update blood pressure reading');
    }

    return row;
  }

  async delete(id: number) {
    const database = await getDatabase();
    await database.runAsync('DELETE FROM blood_pressure_readings WHERE id = ?', id);
  }
}
