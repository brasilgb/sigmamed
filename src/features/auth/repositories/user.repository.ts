import { getDatabase } from '@/database/client';
import type { AuthProfile, AuthUser } from '@/features/auth/types/auth';

type UserRow = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  pin_hash: string;
  use_biometric: number;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: number;
  user_id: number;
  full_name: string | null;
  birth_date: string | null;
  sex: string | null;
  height: number | null;
  target_weight: number | null;
  has_diabetes: number;
  has_hypertension: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
  pinHash: string;
  useBiometric: boolean;
};

function mapUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    useBiometric: Boolean(row.use_biometric),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProfile(row: ProfileRow): AuthProfile {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    birthDate: row.birth_date,
    sex: row.sex,
    height: row.height,
    targetWeight: row.target_weight,
    hasDiabetes: Boolean(row.has_diabetes),
    hasHypertension: Boolean(row.has_hypertension),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class UserRepository {
  async getCount(): Promise<number> {
    const database = await getDatabase();
    const row = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM users');
    return row?.count ?? 0;
  }

  async getByEmail(email: string): Promise<AuthUser | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync<UserRow>('SELECT * FROM users WHERE lower(email) = lower(?)', email);
    return row ? mapUser(row) : null;
  }

  async getCredentialRecordByEmail(email: string): Promise<UserRow | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync<UserRow>('SELECT * FROM users WHERE lower(email) = lower(?)', email);
    return row;
  }

  async getCredentialRecordById(id: number): Promise<UserRow | null> {
    const database = await getDatabase();
    return database.getFirstAsync<UserRow>('SELECT * FROM users WHERE id = ?', id);
  }

  async getById(id: number): Promise<AuthUser | null> {
    const row = await this.getCredentialRecordById(id);
    return row ? mapUser(row) : null;
  }

  async createUserWithProfile(input: CreateUserInput): Promise<AuthUser> {
    const database = await getDatabase();
    let createdUser: AuthUser | null = null;

    await database.withTransactionAsync(async () => {
      const existingUser = await database.getFirstAsync<UserRow>(
        'SELECT * FROM users WHERE lower(email) = lower(?)',
        input.email
      );

      if (existingUser) {
        throw new Error('Ja existe uma conta com este e-mail.');
      }

      const userResult = await database.runAsync(
        `INSERT INTO users
          (name, email, password_hash, pin_hash, use_biometric, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        input.name,
        input.email,
        input.passwordHash,
        input.pinHash,
        input.useBiometric ? 1 : 0
      );

      await database.runAsync(
        `INSERT INTO profiles
          (user_id, full_name, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)`,
        userResult.lastInsertRowId,
        input.name
      );

      const createdRow = await database.getFirstAsync<UserRow>(
        'SELECT * FROM users WHERE id = ?',
        userResult.lastInsertRowId
      );

      if (!createdRow) {
        throw new Error('Falha ao criar conta local.');
      }

      createdUser = mapUser(createdRow);
    });

    if (!createdUser) {
      throw new Error('Falha ao criar conta local.');
    }

    return createdUser;
  }

  async updateBiometricPreference(userId: number, enabled: boolean) {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE users
       SET use_biometric = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      enabled ? 1 : 0,
      userId
    );
  }

  async getProfileByUserId(userId: number): Promise<AuthProfile | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync<ProfileRow>(
      'SELECT * FROM profiles WHERE user_id = ?',
      userId
    );
    return row ? mapProfile(row) : null;
  }
}
