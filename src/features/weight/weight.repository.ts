import { getDatabase } from '@/database/client';
import {
  createSyncUuid,
  getActiveLocalProfileId,
  getRemoteProfileIdForLocalProfile,
} from '@/services/sync-metadata.service';
import { pushSyncItems } from '@/services/sync-api.service';
import type { NewWeightReading, WeightReading } from '@/types/health';

type WeightRow = {
  id: number;
  uuid: string;
  profile_id: number | null;
  weight: number;
  height: number | null;
  unit: 'kg';
  measured_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  deleted_at: string | null;
};

function mapRow(row: WeightRow): WeightReading {
  return {
    id: row.id,
    uuid: row.uuid,
    profileId: row.profile_id,
    weight: row.weight,
    height: row.height,
    unit: row.unit,
    measuredAt: row.measured_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
    deletedAt: row.deleted_at,
  };
}

export class WeightRepository {
  async getById(id: number) {
    const database = await getDatabase();
    const profileId = await getActiveLocalProfileId();

    if (!profileId) {
      return null;
    }

    const row = await database.getFirstAsync<WeightRow>(
      'SELECT * FROM weight_readings WHERE id = ? AND profile_id = ? AND deleted_at IS NULL',
      id,
      profileId
    );

    return row ? mapRow(row) : null;
  }

  async listRecent(limit = 10) {
    const database = await getDatabase();
    const profileId = await getActiveLocalProfileId();

    if (!profileId) {
      return [];
    }

    const rows = await database.getAllAsync<WeightRow>(
      `SELECT * FROM weight_readings
       WHERE profile_id = ?
         AND deleted_at IS NULL
       ORDER BY datetime(measured_at) DESC
       LIMIT ?`,
      profileId,
      limit
    );

    return rows.map(mapRow);
  }

  async create(input: NewWeightReading) {
    const database = await getDatabase();
    const uuid = createSyncUuid();
    const profileId = await getActiveLocalProfileId();

    if (!profileId) {
      throw new Error('Selecione um perfil acompanhado antes de registrar.');
    }

    const result = await database.runAsync(
      `INSERT INTO weight_readings
        (uuid, profile_id, weight, height, unit, measured_at, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      uuid,
      profileId,
      input.weight,
      input.height,
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

    const reading = mapRow(row);
    void this.syncReading(reading);
    return reading;
  }

  async update(id: number, input: NewWeightReading) {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE weight_readings
       SET weight = ?, height = ?, unit = ?, measured_at = ?, notes = ?, updated_at = CURRENT_TIMESTAMP, synced_at = NULL
       WHERE id = ?`,
      input.weight,
      input.height,
      input.unit,
      input.measuredAt,
      input.notes,
      id
    );

    const row = await this.getById(id);

    if (!row) {
      throw new Error('Failed to update weight reading');
    }

    void this.syncReading(row);
    return row;
  }

  async delete(id: number) {
    const database = await getDatabase();
    const row = await database.getFirstAsync<WeightRow>(
      'SELECT * FROM weight_readings WHERE id = ?',
      id
    );

    if (!row) {
      return;
    }

    await database.runAsync(
      `UPDATE weight_readings
       SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, synced_at = NULL
       WHERE id = ?`,
      id
    );

    const deletedRow = await database.getFirstAsync<WeightRow>(
      'SELECT * FROM weight_readings WHERE id = ?',
      id
    );

    if (deletedRow) {
      void this.syncReading(mapRow(deletedRow));
    }
  }

  async syncPending(limit = 50) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<WeightRow>(
      `SELECT * FROM weight_readings
       WHERE synced_at IS NULL
       ORDER BY datetime(updated_at) ASC
       LIMIT ?`,
      limit
    );

    await Promise.all(rows.map((row) => this.syncReading(mapRow(row))));
  }

  private async syncReading(reading: WeightReading) {
    try {
      const remoteProfileId = await getRemoteProfileIdForLocalProfile(reading.profileId);

      if (!remoteProfileId) {
        return;
      }

      await pushSyncItems({
        resource: 'weight',
        items: [
          {
            uuid: reading.uuid,
            profile_id: remoteProfileId,
            weight: reading.weight,
            height: reading.height,
            unit: reading.unit,
            measured_at: reading.measuredAt,
            notes: reading.notes,
            updated_at: reading.updatedAt,
            deleted_at: reading.deletedAt,
          },
        ],
      });

      const database = await getDatabase();
      await database.runAsync(
        'UPDATE weight_readings SET synced_at = CURRENT_TIMESTAMP WHERE id = ?',
        reading.id
      );
    } catch {
      // The app remains offline-first; unsynced rows can be retried later.
    }
  }
}
