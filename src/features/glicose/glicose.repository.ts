import { getDatabase } from '@/database/client';
import type { GlicoseReading, NewGlicoseReading } from '@/types/health';

type GlicoseRow = {
  id: number;
  glicose_value: number;
  unit: 'mg/dL';
  context: GlicoseReading['context'];
  measured_at: string;
  source: GlicoseReading['source'];
  notes: string | null;
  created_at: string;
};

function mapRow(row: GlicoseRow): GlicoseReading {
  return {
    id: row.id,
    glicoseValue: row.glicose_value,
    unit: row.unit,
    context: row.context,
    measuredAt: row.measured_at,
    source: row.source,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export class GlicoseRepository {
  async listRecent(limit = 10) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<GlicoseRow>(
      `SELECT * FROM glicose_readings
       ORDER BY datetime(measured_at) DESC
       LIMIT ?`,
      limit
    );

    return rows.map(mapRow);
  }

  async create(input: NewGlicoseReading) {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO glicose_readings
        (glicose_value, unit, context, measured_at, source, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      input.glicoseValue,
      input.unit,
      input.context,
      input.measuredAt,
      input.source,
      input.notes
    );

    const row = await database.getFirstAsync<GlicoseRow>(
      'SELECT * FROM glicose_readings WHERE id = ?',
      result.lastInsertRowId
    );

    if (!row) {
      throw new Error('Failed to create glicose reading');
    }

    return mapRow(row);
  }
}
