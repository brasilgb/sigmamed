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
  async listActive() {
    const database = await getDatabase();
    const rows = await database.getAllAsync<MedicationRow>(
      `SELECT * FROM medications
       WHERE active = 1
       ORDER BY name ASC`
    );

    return rows.map(mapMedication);
  }

  async createMedication(input: NewMedication) {
    const database = await getDatabase();
    const result = await database.runAsync(
      `INSERT INTO medications
        (name, dosage, instructions, active)
       VALUES (?, ?, ?, ?)`,
      input.name,
      input.dosage,
      input.instructions,
      input.active ? 1 : 0
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
}
