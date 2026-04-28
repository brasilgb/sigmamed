import { getDatabase } from '@/database/client';
import {
  createSyncUuid,
  getActiveLocalProfileId,
  getRemoteProfileIdForLocalProfile,
} from '@/services/sync-metadata.service';
import { pushSyncItems } from '@/services/sync-api.service';
import type { BloodPressureReading, NewBloodPressureReading } from '@/types/health';

type BloodPressureRow = {
  id: number;
  uuid: string;
  profile_id: number | null;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  measured_at: string;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  deleted_at: string | null;
};

function mapRow(row: BloodPressureRow): BloodPressureReading {
  return {
    id: row.id,
    uuid: row.uuid,
    profileId: row.profile_id,
    systolic: row.systolic,
    diastolic: row.diastolic,
    pulse: row.pulse,
    measuredAt: row.measured_at,
    source: 'manual',
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
    deletedAt: row.deleted_at,
  };
}

export class PressureRepository {
  async getById(id: number) {
    const database = await getDatabase();
    const profileId = await getActiveLocalProfileId();

    if (!profileId) {
      return null;
    }

    const row = await database.getFirstAsync<BloodPressureRow>(
      'SELECT * FROM blood_pressure_readings WHERE id = ? AND profile_id = ? AND deleted_at IS NULL',
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

    const rows = await database.getAllAsync<BloodPressureRow>(
      `SELECT * FROM blood_pressure_readings
       WHERE profile_id = ?
         AND deleted_at IS NULL
       ORDER BY datetime(measured_at) DESC
       LIMIT ?`,
      profileId,
      limit
    );

    return rows.map(mapRow);
  }

  async create(input: NewBloodPressureReading) {
    const database = await getDatabase();
    const uuid = createSyncUuid();
    const profileId = await getActiveLocalProfileId();

    if (!profileId) {
      throw new Error('Selecione um perfil acompanhado antes de registrar.');
    }

    const result = await database.runAsync(
      `INSERT INTO blood_pressure_readings
        (uuid, profile_id, systolic, diastolic, pulse, measured_at, source, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      uuid,
      profileId,
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

    const reading = mapRow(row);
    void this.syncReading(reading);
    return reading;
  }

  async update(id: number, input: NewBloodPressureReading) {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE blood_pressure_readings
       SET systolic = ?, diastolic = ?, pulse = ?, measured_at = ?, source = ?, notes = ?, updated_at = CURRENT_TIMESTAMP, synced_at = NULL
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

    void this.syncReading(row);
    return row;
  }

  async delete(id: number) {
    const database = await getDatabase();
    const row = await database.getFirstAsync<BloodPressureRow>(
      'SELECT * FROM blood_pressure_readings WHERE id = ?',
      id
    );

    if (!row) {
      return;
    }

    await database.runAsync(
      `UPDATE blood_pressure_readings
       SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, synced_at = NULL
       WHERE id = ?`,
      id
    );

    const deletedRow = await database.getFirstAsync<BloodPressureRow>(
      'SELECT * FROM blood_pressure_readings WHERE id = ?',
      id
    );

    if (deletedRow) {
      void this.syncReading(mapRow(deletedRow));
    }
  }

  async syncPending(limit = 50) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<BloodPressureRow>(
      `SELECT * FROM blood_pressure_readings
       WHERE synced_at IS NULL
       ORDER BY datetime(updated_at) ASC
       LIMIT ?`,
      limit
    );

    await Promise.all(rows.map((row) => this.syncReading(mapRow(row))));
  }

  private async syncReading(reading: BloodPressureReading) {
    try {
      const remoteProfileId = await getRemoteProfileIdForLocalProfile(reading.profileId);

      if (!remoteProfileId) {
        return;
      }

      await pushSyncItems({
        resource: 'blood-pressure',
        items: [
          {
            uuid: reading.uuid,
            profile_id: remoteProfileId,
            systolic: reading.systolic,
            diastolic: reading.diastolic,
            pulse: reading.pulse,
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
        'UPDATE blood_pressure_readings SET synced_at = CURRENT_TIMESTAMP WHERE id = ?',
        reading.id
      );
    } catch (error) {
      console.warn('Pressure sync failed', error);
    }
  }
}
