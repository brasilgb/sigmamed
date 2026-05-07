import { getDatabase } from '@/database/client';
import type { AccountUsage, AuthProfile, AuthUser } from '@/features/auth/types/auth';

type UserRow = {
  id: number;
  account_usage: AccountUsage | null;
  name: string;
  email: string;
  age: number | null;
  photo_uri: string | null;
  password_hash: string;
  pin_hash: string;
  use_biometric: number;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: number;
  remote_profile_id: number | null;
  user_id: number;
  full_name: string | null;
  age: number | null;
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
  accountUsage: AccountUsage;
  name: string;
  email: string;
  passwordHash: string;
  pinHash: string;
  useBiometric: boolean;
  photoUri?: string | null;
  age?: number | null;
  profileFullName?: string | null;
  profileSex?: string | null;
  profileHeight?: number | null;
  remoteProfileId?: number | string | null;
  createInitialProfile?: boolean;
};

type CreateProfileInput = {
  userId: number;
  fullName: string;
  age?: number | null;
  sex?: string | null;
  height?: number | null;
  notes?: string | null;
  remoteProfileId?: number | string | null;
};

type UpsertRemoteProfileInput = {
  userId: number;
  remoteProfileId: number | string;
  fullName?: string | null;
  age?: number | string | null;
  sex?: string | null;
  height?: number | string | null;
  notes?: string | null;
};

type UpdateUserInput = {
  name: string;
  email: string;
  photoUri?: string | null;
  age?: number | null;
  passwordHash?: string;
};

type UpdateProfileInput = {
  fullName?: string | null;
  age?: number | null;
  sex?: string | null;
  height?: number | null;
  notes?: string | null;
};

function mapUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    accountUsage: row.account_usage ?? 'personal',
    name: row.name,
    email: row.email,
    age: row.age,
    photoUri: row.photo_uri,
    useBiometric: Boolean(row.use_biometric),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProfile(row: ProfileRow): AuthProfile {
  return {
    id: row.id,
    remoteProfileId: row.remote_profile_id,
    userId: row.user_id,
    fullName: row.full_name,
    age: row.age,
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
          (name, email, age, account_usage, password_hash, pin_hash, use_biometric, photo_uri, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        input.name,
        input.email,
        input.age ?? null,
        input.accountUsage,
        input.passwordHash,
        input.pinHash,
        input.useBiometric ? 1 : 0,
        input.photoUri ?? null
      );

      if (input.createInitialProfile !== false) {
        await database.runAsync(
          `INSERT INTO profiles
            (user_id, remote_profile_id, full_name, sex, height, updated_at)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          userResult.lastInsertRowId,
          input.remoteProfileId ? Number(input.remoteProfileId) : null,
          input.profileFullName ?? input.name,
          input.profileSex?.trim() || null,
          input.profileHeight ?? null
        );
      }

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

  async updateUserAccount(userId: number, input: UpdateUserInput): Promise<AuthUser> {
    const database = await getDatabase();
    let updatedUser: AuthUser | null = null;

    await database.withTransactionAsync(async () => {
      const existingUser = await database.getFirstAsync<UserRow>(
        'SELECT * FROM users WHERE lower(email) = lower(?) AND id != ?',
        input.email,
        userId
      );

      if (existingUser) {
        throw new Error('Ja existe uma conta com este e-mail.');
      }

      if (input.passwordHash) {
        await database.runAsync(
          `UPDATE users
           SET name = ?, email = ?, age = ?, photo_uri = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          input.name,
          input.email,
          input.age ?? null,
          input.photoUri ?? null,
          input.passwordHash,
          userId
        );
      } else {
        await database.runAsync(
          `UPDATE users
           SET name = ?, email = ?, age = ?, photo_uri = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          input.name,
          input.email,
          input.age ?? null,
          input.photoUri ?? null,
          userId
        );
      }

      const userRecord = await database.getFirstAsync<UserRow>('SELECT * FROM users WHERE id = ?', userId);

      if ((userRecord?.account_usage ?? 'personal') === 'personal') {
        await database.runAsync(
          `UPDATE profiles
           SET full_name = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ?`,
          input.name,
          userId
        );
      }

      const row = await database.getFirstAsync<UserRow>('SELECT * FROM users WHERE id = ?', userId);

      if (!row) {
        throw new Error('Falha ao atualizar conta.');
      }

      updatedUser = mapUser(row);
    });

    if (!updatedUser) {
      throw new Error('Falha ao atualizar conta.');
    }

    return updatedUser;
  }

  async deleteAccount(userId: number): Promise<void> {
    const database = await getDatabase();

    await database.withTransactionAsync(async () => {
      const profiles = await database.getAllAsync<{ id: number }>(
        'SELECT id FROM profiles WHERE user_id = ?',
        userId
      );
      const profileIds = profiles.map((profile) => profile.id);

      if (profileIds.length > 0) {
        const placeholders = profileIds.map(() => '?').join(', ');

        await database.runAsync(
          `DELETE FROM medication_logs
           WHERE profile_id IN (${placeholders})
              OR medication_id IN (
                SELECT id FROM medications WHERE profile_id IN (${placeholders})
              )`,
          ...profileIds,
          ...profileIds
        );
        await database.runAsync(`DELETE FROM medications WHERE profile_id IN (${placeholders})`, ...profileIds);
        await database.runAsync(`DELETE FROM blood_pressure_readings WHERE profile_id IN (${placeholders})`, ...profileIds);
        await database.runAsync(`DELETE FROM glicose_readings WHERE profile_id IN (${placeholders})`, ...profileIds);
        await database.runAsync(`DELETE FROM weight_readings WHERE profile_id IN (${placeholders})`, ...profileIds);
      }

      await database.runAsync('DELETE FROM profiles WHERE user_id = ?', userId);
      await database.runAsync('DELETE FROM users WHERE id = ?', userId);
    });
  }

  async getProfileByUserId(userId: number): Promise<AuthProfile | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync<ProfileRow>(
      'SELECT * FROM profiles WHERE user_id = ?',
      userId
    );
    return row ? mapProfile(row) : null;
  }

  async getProfileById(id: number): Promise<AuthProfile | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync<ProfileRow>('SELECT * FROM profiles WHERE id = ?', id);
    return row ? mapProfile(row) : null;
  }

  async getProfileByRemoteId(remoteProfileId: number): Promise<AuthProfile | null> {
    const database = await getDatabase();
    const row = await database.getFirstAsync<ProfileRow>(
      'SELECT * FROM profiles WHERE remote_profile_id = ?',
      remoteProfileId
    );
    return row ? mapProfile(row) : null;
  }

  async updateProfileRemoteId(profileId: number, remoteProfileId: number | string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE profiles
       SET remote_profile_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      Number(remoteProfileId),
      profileId
    );
  }

  async updateFirstProfileRemoteId(userId: number, remoteProfileId: number | string): Promise<void> {
    const database = await getDatabase();
    const profile = await database.getFirstAsync<ProfileRow>(
      `SELECT *
       FROM profiles
       WHERE user_id = ?
       ORDER BY id ASC
       LIMIT 1`,
      userId
    );

    if (!profile || profile.remote_profile_id) {
      return;
    }

    await this.updateProfileRemoteId(profile.id, remoteProfileId);
  }

  async getProfilesByUserId(userId: number): Promise<AuthProfile[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<ProfileRow>(
      `SELECT *
       FROM profiles
       WHERE user_id = ?
       ORDER BY updated_at DESC, id DESC`,
      userId
    );

    return rows.map(mapProfile);
  }

  async updateProfile(profileId: number, input: UpdateProfileInput): Promise<AuthProfile> {
    const database = await getDatabase();
    const existing = await database.getFirstAsync<ProfileRow>('SELECT * FROM profiles WHERE id = ?', profileId);

    if (!existing) {
      throw new Error('Perfil não encontrado.');
    }

    const nextFullName = input.fullName === undefined ? existing.full_name : input.fullName?.trim() || existing.full_name;
    const nextAge = input.age === undefined ? existing.age : input.age;
    const nextSex = input.sex === undefined ? existing.sex : input.sex?.trim() || null;
    const nextHeight = input.height === undefined ? existing.height : input.height;
    const nextNotes = input.notes === undefined ? existing.notes : input.notes?.trim() || null;

    await database.runAsync(
      `UPDATE profiles
       SET full_name = ?, age = ?, sex = ?, height = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      nextFullName,
      nextAge,
      nextSex,
      nextHeight,
      nextNotes,
      profileId
    );

    const row = await database.getFirstAsync<ProfileRow>('SELECT * FROM profiles WHERE id = ?', profileId);

    if (!row) {
      throw new Error('Perfil não encontrado.');
    }

    return mapProfile(row);
  }

  async deleteProfile(profileId: number, userId: number): Promise<void> {
    const database = await getDatabase();

    await database.withTransactionAsync(async () => {
      const existing = await database.getFirstAsync<ProfileRow>(
        'SELECT * FROM profiles WHERE id = ? AND user_id = ?',
        profileId,
        userId
      );

      if (!existing) {
        throw new Error('Acompanhado não encontrado.');
      }

      await database.runAsync(
        `DELETE FROM medication_logs
         WHERE profile_id = ?
            OR medication_id IN (
              SELECT id FROM medications WHERE profile_id = ?
            )`,
        profileId,
        profileId
      );
      await database.runAsync('DELETE FROM medications WHERE profile_id = ?', profileId);
      await database.runAsync('DELETE FROM blood_pressure_readings WHERE profile_id = ?', profileId);
      await database.runAsync('DELETE FROM glicose_readings WHERE profile_id = ?', profileId);
      await database.runAsync('DELETE FROM weight_readings WHERE profile_id = ?', profileId);
      await database.runAsync('DELETE FROM profiles WHERE id = ? AND user_id = ?', profileId, userId);
    });
  }

  async createProfile(input: CreateProfileInput): Promise<AuthProfile> {
    const database = await getDatabase();
    const fullName = input.fullName.trim();

    if (!fullName) {
      throw new Error('Informe o nome da pessoa acompanhada.');
    }

    const result = await database.runAsync(
      `INSERT INTO profiles
        (user_id, remote_profile_id, full_name, age, sex, height, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      input.userId,
      input.remoteProfileId ? Number(input.remoteProfileId) : null,
      fullName,
      input.age ?? null,
      input.sex?.trim() || null,
      input.height ?? null,
      input.notes?.trim() || null
    );

    const row = await database.getFirstAsync<ProfileRow>(
      'SELECT * FROM profiles WHERE id = ?',
      result.lastInsertRowId
    );

    if (!row) {
      throw new Error('Falha ao cadastrar acompanhado.');
    }

    return mapProfile(row);
  }

  async upsertRemoteProfile(input: UpsertRemoteProfileInput): Promise<AuthProfile> {
    const database = await getDatabase();
    const remoteProfileId = Number(input.remoteProfileId);
    const existing = await database.getFirstAsync<ProfileRow>(
      'SELECT * FROM profiles WHERE remote_profile_id = ?',
      remoteProfileId
    );
    const height =
      input.height === null || input.height === undefined || input.height === ''
        ? null
        : Number(input.height);
    const age =
      input.age === null || input.age === undefined || input.age === ''
        ? null
        : Number(input.age);

    if (existing) {
      await database.runAsync(
        `UPDATE profiles
         SET full_name = COALESCE(?, full_name),
             age = ?,
             sex = COALESCE(?, sex),
             height = ?,
             notes = COALESCE(?, notes),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        input.fullName?.trim() || null,
        Number.isFinite(age) ? age : null,
        input.sex?.trim() || null,
        Number.isFinite(height) ? height : null,
        input.notes?.trim() || null,
        existing.id
      );

      const row = await database.getFirstAsync<ProfileRow>('SELECT * FROM profiles WHERE id = ?', existing.id);

      if (!row) {
        throw new Error('Falha ao atualizar perfil remoto.');
      }

      return mapProfile(row);
    }

    return this.createProfile({
      userId: input.userId,
      remoteProfileId,
      fullName: input.fullName?.trim() || 'Perfil remoto',
      age: Number.isFinite(age) ? age : null,
      sex: input.sex ?? null,
      height: Number.isFinite(height) ? height : null,
      notes: input.notes ?? null,
    });
  }
}
