import { getDatabase } from '@/database/client';
import type {
  Medication,
  MedicationLog,
  NewMedication,
  NewMedicationLog,
} from '@/types/health';

type MedicationRow = {
  id: number;
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
};

type MedicationLogRow = {
  id: number;
  medication_id: number;
  scheduled_at: string;
  taken_at: string | null;
  status: MedicationLog['status'];
  created_at: string;
};

function mapMedication(row: MedicationRow): Medication {
  return {
    id: row.id,
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
  };
}

function mapLog(row: MedicationLogRow): MedicationLog {
  return {
    id: row.id,
    medicationId: row.medication_id,
    scheduledAt: row.scheduled_at,
    takenAt: row.taken_at,
    status: row.status,
    createdAt: row.created_at,
  };
}

export class MedicationRepository {
  async getById(id: number) {
    const database = await getDatabase();
    const row = await database.getFirstAsync<MedicationRow>(
      'SELECT * FROM medications WHERE id = ?',
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
              AND date(medication_logs.scheduled_at) = date('now', 'localtime')
            ORDER BY datetime(medication_logs.scheduled_at) DESC, medication_logs.id DESC
            LIMIT 1
          ) as today_status,
          (
            SELECT COALESCE(medication_logs.taken_at, medication_logs.scheduled_at)
            FROM medication_logs
            WHERE medication_logs.medication_id = medications.id
              AND date(medication_logs.scheduled_at) = date('now', 'localtime')
            ORDER BY datetime(medication_logs.scheduled_at) DESC, medication_logs.id DESC
            LIMIT 1
          ) as today_logged_at
        FROM medications
       WHERE active = 1
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
              AND date(medication_logs.scheduled_at) = date('now', 'localtime')
            ORDER BY datetime(medication_logs.scheduled_at) DESC, medication_logs.id DESC
            LIMIT 1
          ) as today_status,
          (
            SELECT COALESCE(medication_logs.taken_at, medication_logs.scheduled_at)
            FROM medication_logs
            WHERE medication_logs.medication_id = medications.id
              AND date(medication_logs.scheduled_at) = date('now', 'localtime')
            ORDER BY datetime(medication_logs.scheduled_at) DESC, medication_logs.id DESC
            LIMIT 1
          ) as today_logged_at
        FROM medications
       ORDER BY active DESC, name ASC`
    );

    return rows.map(mapMedication);
  }

  async createMedication(input: NewMedication) {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO medications
        (name, dosage, instructions, active, scheduled_time, reminder_enabled, repeat_reminder_every_five_minutes, reminder_minutes_before)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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

    return mapMedication(row);
  }

  async updateMedication(id: number, input: NewMedication) {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE medications
       SET name = ?, dosage = ?, instructions = ?, active = ?, scheduled_time = ?, reminder_enabled = ?, repeat_reminder_every_five_minutes = ?, reminder_minutes_before = ?
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

    return row;
  }

  async createLog(input: NewMedicationLog) {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO medication_logs
        (medication_id, scheduled_at, taken_at, status)
       VALUES (?, ?, ?, ?)`,
      input.medicationId,
      input.scheduledAt,
      input.takenAt,
      input.status
    );

    const row = await database.getFirstAsync<MedicationLogRow>(
      'SELECT * FROM medication_logs WHERE id = ?',
      result.lastInsertRowId
    );

    if (!row) {
      throw new Error('Failed to create medication log');
    }

    return mapLog(row);
  }

  async clearTodayLogs(medicationId: number) {
    const database = await getDatabase();
    await database.runAsync(
      `DELETE FROM medication_logs
       WHERE medication_id = ?
         AND date(scheduled_at) = date('now', 'localtime')`,
      medicationId
    );
  }

  async deleteMedication(id: number) {
    const database = await getDatabase();
    await database.withTransactionAsync(async () => {
      await database.runAsync('DELETE FROM medication_logs WHERE medication_id = ?', id);
      await database.runAsync('DELETE FROM medications WHERE id = ?', id);
    });
  }
}
