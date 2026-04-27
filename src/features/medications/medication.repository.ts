import { getDatabase } from '@/database/client';
import { pushSyncItems } from '@/services/sync-api.service';
import { createSyncUuid, getActiveProfileId } from '@/services/sync-metadata.service';
import type {
    Medication,
    MedicationLog,
    NewMedication,
    NewMedicationLog,
} from '@/types/health';

type MedicationRow = {
  id: number;
  uuid: string;
  name: string;
  dosage: string;
  instructions: string | null;
  active: number;
  scheduled_time: string | null;
  reminder_enabled: number;
  repeat_reminder_every_five_minutes: number;
  reminder_minutes_before: number;
  today_status: MedicationLog['status'] | null;
  today_logged_at: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  deleted_at: string | null;
};

type MedicationLogRow = {
  id: number;
  uuid: string;
  medication_uuid: string | null;
  medication_id: number;
  scheduled_at: string;
  taken_at: string | null;
  status: MedicationLog['status'];
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  deleted_at: string | null;
};

function mapMedication(row: MedicationRow): Medication {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    dosage: row.dosage,
    instructions: row.instructions,
    active: Boolean(row.active),
    scheduledTime: row.scheduled_time,
    reminderEnabled: Boolean(row.reminder_enabled),
    repeatReminderEveryFiveMinutes: Boolean(row.repeat_reminder_every_five_minutes),
    reminderMinutesBefore: row.reminder_minutes_before,
    todayStatus: row.today_status,
    todayLoggedAt: row.today_logged_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
    deletedAt: row.deleted_at,
  };
}

function mapLog(row: MedicationLogRow): MedicationLog {
  return {
    id: row.id,
    uuid: row.uuid,
    medicationId: row.medication_id,
    scheduledAt: row.scheduled_at,
    takenAt: row.taken_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
    deletedAt: row.deleted_at,
  };
}

function toRemoteScheduledTime(value: string | null, referenceDate?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const timeMatch = value.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);

  if (!timeMatch) {
    return value;
  }

  const [, hours, minutes, seconds = '00'] = timeMatch;
  const parsedReference = referenceDate ? new Date(referenceDate) : new Date();
  const baseDate = Number.isNaN(parsedReference.getTime()) ? new Date() : parsedReference;
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export class MedicationRepository {
  async getById(id: number) {
    const database = await getDatabase();
    const row = await database.getFirstAsync<MedicationRow>(
      'SELECT * FROM medications WHERE id = ? AND deleted_at IS NULL',
      id
    );

    return row ? mapMedication(row) : null;
  }

  async listActive() {
    const database = await getDatabase();
    const rows = await database.getAllAsync<MedicationRow>(
      `SELECT
          medications.*,
          (
            SELECT medication_logs.status
            FROM medication_logs
            WHERE medication_logs.medication_id = medications.id
              AND medication_logs.deleted_at IS NULL
              AND date(medication_logs.scheduled_at) = date('now', 'localtime')
            ORDER BY datetime(medication_logs.scheduled_at) DESC, medication_logs.id DESC
            LIMIT 1
          ) as today_status,
          (
            SELECT COALESCE(medication_logs.taken_at, medication_logs.scheduled_at)
            FROM medication_logs
            WHERE medication_logs.medication_id = medications.id
              AND medication_logs.deleted_at IS NULL
              AND date(medication_logs.scheduled_at) = date('now', 'localtime')
            ORDER BY datetime(medication_logs.scheduled_at) DESC, medication_logs.id DESC
            LIMIT 1
          ) as today_logged_at
        FROM medications
       WHERE active = 1
         AND deleted_at IS NULL
       ORDER BY name ASC`
    );

    return rows.map(mapMedication);
  }

  async listAll() {
    const database = await getDatabase();
    const rows = await database.getAllAsync<MedicationRow>(
      `SELECT
          medications.*,
          (
            SELECT medication_logs.status
            FROM medication_logs
            WHERE medication_logs.medication_id = medications.id
              AND medication_logs.deleted_at IS NULL
              AND date(medication_logs.scheduled_at) = date('now', 'localtime')
            ORDER BY datetime(medication_logs.scheduled_at) DESC, medication_logs.id DESC
            LIMIT 1
          ) as today_status,
          (
            SELECT COALESCE(medication_logs.taken_at, medication_logs.scheduled_at)
            FROM medication_logs
            WHERE medication_logs.medication_id = medications.id
              AND medication_logs.deleted_at IS NULL
              AND date(medication_logs.scheduled_at) = date('now', 'localtime')
            ORDER BY datetime(medication_logs.scheduled_at) DESC, medication_logs.id DESC
            LIMIT 1
          ) as today_logged_at
        FROM medications
       WHERE deleted_at IS NULL
       ORDER BY active DESC, name ASC`
    );

    return rows.map(mapMedication);
  }

  async createMedication(input: NewMedication) {
    const database = await getDatabase();
    const uuid = createSyncUuid();
    const result = await database.runAsync(
      `INSERT INTO medications
        (uuid, name, dosage, instructions, active, scheduled_time, reminder_enabled, repeat_reminder_every_five_minutes, reminder_minutes_before, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      uuid,
      input.name,
      input.dosage,
      input.instructions,
      input.active ? 1 : 0,
      input.scheduledTime,
      input.reminderEnabled ? 1 : 0,
      input.repeatReminderEveryFiveMinutes ? 1 : 0,
      input.reminderMinutesBefore
    );

    const row = await database.getFirstAsync<MedicationRow>(
      'SELECT * FROM medications WHERE id = ?',
      result.lastInsertRowId
    );

    if (!row) {
      throw new Error('Failed to create medication');
    }

    const medication = mapMedication(row);
    void this.syncMedication(medication);
    return medication;
  }

  async updateMedication(id: number, input: NewMedication) {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE medications
       SET name = ?, dosage = ?, instructions = ?, active = ?, scheduled_time = ?, reminder_enabled = ?, repeat_reminder_every_five_minutes = ?, reminder_minutes_before = ?, updated_at = CURRENT_TIMESTAMP, synced_at = NULL
       WHERE id = ?`,
      input.name,
      input.dosage,
      input.instructions,
      input.active ? 1 : 0,
      input.scheduledTime,
      input.reminderEnabled ? 1 : 0,
      input.repeatReminderEveryFiveMinutes ? 1 : 0,
      input.reminderMinutesBefore,
      id
    );

    const row = await this.getById(id);

    if (!row) {
      throw new Error('Failed to update medication');
    }

    void this.syncMedication(row);
    return row;
  }

  async createLog(input: NewMedicationLog) {
    const database = await getDatabase();
    const uuid = createSyncUuid();
    const result = await database.runAsync(
      `INSERT INTO medication_logs
        (uuid, medication_id, scheduled_at, taken_at, status, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      uuid,
      input.medicationId,
      input.scheduledAt,
      input.takenAt,
      input.status
    );

    const row = await database.getFirstAsync<MedicationLogRow>(
      `SELECT medication_logs.*, medications.uuid as medication_uuid
       FROM medication_logs
       LEFT JOIN medications ON medications.id = medication_logs.medication_id
       WHERE medication_logs.id = ?`,
      result.lastInsertRowId
    );

    if (!row) {
      throw new Error('Failed to create medication log');
    }

    const log = mapLog(row);
    void this.syncMedicationLog(log);
    return log;
  }

  async clearTodayLogs(medicationId: number) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<MedicationLogRow>(
      `SELECT medication_logs.*, medications.uuid as medication_uuid
       FROM medication_logs
       LEFT JOIN medications ON medications.id = medication_logs.medication_id
       WHERE medication_id = ?
         AND deleted_at IS NULL
         AND date(scheduled_at) = date('now', 'localtime')`,
      medicationId
    );

    await database.runAsync(
      `UPDATE medication_logs
       SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, synced_at = NULL
       WHERE medication_id = ?
         AND deleted_at IS NULL
         AND date(scheduled_at) = date('now', 'localtime')`,
      medicationId
    );

    rows.forEach((row) => {
      void this.syncMedicationLog({
        ...mapLog(row),
        deletedAt: new Date().toISOString(),
      });
    });
  }

  async deleteMedication(id: number) {
    const database = await getDatabase();
    const row = await database.getFirstAsync<MedicationRow>(
      'SELECT * FROM medications WHERE id = ?',
      id
    );

    if (!row) {
      return;
    }

    await database.runAsync(
      `UPDATE medications
       SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, synced_at = NULL
       WHERE id = ?`,
      id
    );

    const deletedRow = await database.getFirstAsync<MedicationRow>(
      'SELECT * FROM medications WHERE id = ?',
      id
    );

    if (deletedRow) {
      void this.syncMedication(mapMedication(deletedRow));
    }
  }

  async syncPending(limit = 50) {
    const database = await getDatabase();
    const medicationRows = await database.getAllAsync<MedicationRow>(
      `SELECT * FROM medications
       WHERE synced_at IS NULL
       ORDER BY datetime(medications.updated_at) ASC
       LIMIT ?`,
      limit
    );

    await Promise.all(medicationRows.map((row) => this.syncMedication(mapMedication(row))));

    const logRows = await database.getAllAsync<MedicationLogRow>(
      `SELECT medication_logs.*, medications.uuid as medication_uuid
       FROM medication_logs
       LEFT JOIN medications ON medications.id = medication_logs.medication_id
       WHERE medication_logs.synced_at IS NULL
       ORDER BY datetime(medication_logs.updated_at) ASC
       LIMIT ?`,
      limit
    );

    await Promise.all(logRows.map((row) => this.syncMedicationLog(mapLog(row))));
  }

  private async syncMedication(medication: Medication) {
    try {
      const profileId = await getActiveProfileId();

      if (!profileId) {
        return;
      }

      await pushSyncItems({
        resource: 'medications',
        items: [
          {
            uuid: medication.uuid,
            profile_id: profileId,
            name: medication.name,
            dosage: medication.dosage,
            instructions: medication.instructions,
            active: medication.active,
            scheduled_time: toRemoteScheduledTime(medication.scheduledTime, medication.updatedAt),
            reminder_enabled: medication.reminderEnabled,
            reminder_minutes_before: medication.reminderMinutesBefore,
            repeat_reminder_every_five_minutes: medication.repeatReminderEveryFiveMinutes,
            updated_at: medication.updatedAt,
            deleted_at: medication.deletedAt,
          },
        ],
      });

      const database = await getDatabase();
      await database.runAsync(
        'UPDATE medications SET synced_at = CURRENT_TIMESTAMP WHERE id = ?',
        medication.id
      );
    } catch (error) {
      console.warn('Medication sync failed', error);
    }
  }

  private async syncMedicationLog(log: MedicationLog) {
    try {
      const profileId = await getActiveProfileId();

      if (!profileId) {
        return;
      }

      await pushSyncItems({
        resource: 'medication-logs',
        items: [
          {
            uuid: log.uuid,
            profile_id: profileId,
            medication_id: log.medicationId,
            medication_uuid: await this.getMedicationUuid(log.medicationId),
            taken_at: log.takenAt ?? log.scheduledAt,
            notes: log.status === 'skipped' ? 'Dose marcada como pulada.' : null,
            updated_at: log.updatedAt,
            deleted_at: log.deletedAt,
          },
        ],
      });

      const database = await getDatabase();
      await database.runAsync(
        'UPDATE medication_logs SET synced_at = CURRENT_TIMESTAMP WHERE id = ?',
        log.id
      );
    } catch (error) {
      console.warn('Medication log sync failed', error);
    }
  }

  private async getMedicationUuid(medicationId: number) {
    const database = await getDatabase();
    const row = await database.getFirstAsync<{ uuid: string }>(
      'SELECT uuid FROM medications WHERE id = ?',
      medicationId
    );
    return row?.uuid ?? null;
  }
}
