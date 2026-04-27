import { getDatabase } from '@/database/client';
import { getActiveProfileId, createSyncUuid } from '@/services/sync-metadata.service';
import { pushSyncItems } from '@/services/sync-api.service';
import type { GlicoseReading, NewGlicoseReading } from '@/types/health';

type GlicoseRow = {
  id: number;
  uuid: string;
  glicose_value: number;
  unit: 'mg/dL';
  context: GlicoseReading['context'];
  measured_at: string;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  deleted_at: string | null;
};

function mapRow(row: GlicoseRow): GlicoseReading {
  return {
    id: row.id,
    uuid: row.uuid,
    glicoseValue: row.glicose_value,
    unit: row.unit,
    context: row.context,
    measuredAt: row.measured_at,
    source: 'manual',
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
    deletedAt: row.deleted_at,
  };
}

export class GlicoseRepository {
  async getById(id: number) {
    const database = await getDatabase();
    const row = await database.getFirstAsync<GlicoseRow>(
      'SELECT * FROM glicose_readings WHERE id = ? AND deleted_at IS NULL',
      id
    );

    return row ? mapRow(row) : null;
  }

  async listRecent(limit = 10) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<GlicoseRow>(
      `SELECT * FROM glicose_readings
       WHERE deleted_at IS NULL
       ORDER BY datetime(measured_at) DESC
       LIMIT ?`,
      limit
    );

    return rows.map(mapRow);
  }

  async create(input: NewGlicoseReading) {
    const database = await getDatabase();
    const uuid = createSyncUuid();
    const result = await database.runAsync(
      `INSERT INTO glicose_readings
        (uuid, glicose_value, unit, context, measured_at, source, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      uuid,
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

    const reading = mapRow(row);
    void this.syncReading(reading);
    return reading;
  }

  async update(id: number, input: NewGlicoseReading) {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE glicose_readings
       SET glicose_value = ?, unit = ?, context = ?, measured_at = ?, source = ?, notes = ?, updated_at = CURRENT_TIMESTAMP, synced_at = NULL
       WHERE id = ?`,
      input.glicoseValue,
      input.unit,
      input.context,
      input.measuredAt,
      input.source,
      input.notes,
      id
    );

    const row = await this.getById(id);

    if (!row) {
      throw new Error('Failed to update glicose reading');
    }

    void this.syncReading(row);
    return row;
  }

  async delete(id: number) {
    const database = await getDatabase();
    const row = await database.getFirstAsync<GlicoseRow>(
      'SELECT * FROM glicose_readings WHERE id = ?',
      id
    );

    if (!row) {
      return;
    }

    await database.runAsync(
      `UPDATE glicose_readings
       SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, synced_at = NULL
       WHERE id = ?`,
      id
    );

    const deletedRow = await database.getFirstAsync<GlicoseRow>(
      'SELECT * FROM glicose_readings WHERE id = ?',
      id
    );

    if (deletedRow) {
      void this.syncReading(mapRow(deletedRow));
    }
  }

  async syncPending(limit = 50) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<GlicoseRow>(
      `SELECT * FROM glicose_readings
       WHERE synced_at IS NULL
       ORDER BY datetime(updated_at) ASC
       LIMIT ?`,
      limit
    );

    await Promise.all(rows.map((row) => this.syncReading(mapRow(row))));
  }

  private async syncReading(reading: GlicoseReading) {
    try {
      const profileId = await getActiveProfileId();

      if (!profileId) {
        return;
      }

      await pushSyncItems({
        resource: 'glicose',
        items: [
          {
            uuid: reading.uuid,
            profile_id: profileId,
            glicose_value: reading.glicoseValue,
            unit: reading.unit,
            context: reading.context,
            measured_at: reading.measuredAt,
            source: reading.source,
            notes: reading.notes,
            updated_at: reading.updatedAt,
            deleted_at: reading.deletedAt,
          },
        ],
      });

      const database = await getDatabase();
      await database.runAsync(
        'UPDATE glicose_readings SET synced_at = CURRENT_TIMESTAMP WHERE id = ?',
        reading.id
      );
    } catch {
      // The app remains offline-first; unsynced rows can be retried later.
    }
  }
}
