import { getDatabase } from '@/database/client';
import type { NewWeightReading, WeightReading } from '@/types/health';

type WeightRow = {
  id: number;
  weight: number;
  unit: 'kg';
  measured_at: string;
  notes: string | null;
  created_at: string;
};

function mapRow(row: WeightRow): WeightReading {
  return {
    id: row.id,
    weight: row.weight,
    unit: row.unit,
    measuredAt: row.measured_at,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export class WeightRepository {
  async listRecent(limit = 10) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<WeightRow>(
      `SELECT * FROM weight_readings
       ORDER BY datetime(measured_at) DESC
       LIMIT ?`,
      limit
    );

    return rows.map(mapRow);
  }

  async create(input: NewWeightReading) {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO weight_readings
        (weight, unit, measured_at, notes)
       VALUES (?, ?, ?, ?)`,
      input.weight,
      input.unit,
      input.measuredAt,
      input.notes
    );

    const row = await database.getFirstAsync<WeightRow>(
      'SELECT * FROM weight_readings WHERE id = ?',
      result.lastInsertRowId
    );

    if (!row) {
      throw new Error('Failed to create weight reading');
    }

    return mapRow(row);
  }
}
