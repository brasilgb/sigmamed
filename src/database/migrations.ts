export const migrations = [
  `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS blood_pressure_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      systolic INTEGER NOT NULL,
      diastolic INTEGER NOT NULL,
      pulse INTEGER,
      measured_at TEXT NOT NULL,
      source TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS glicose_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      glicose_value REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'mg/dL',
      context TEXT NOT NULL,
      measured_at TEXT NOT NULL,
      source TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS weight_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weight REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'kg',
      measured_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      instructions TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS medication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medication_id INTEGER NOT NULL,
      scheduled_at TEXT NOT NULL,
      taken_at TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medication_id) REFERENCES medications(id)
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      pin_hash TEXT,
      use_biometric INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      full_name TEXT,
      birth_date TEXT,
      sex TEXT,
      height REAL,
      target_weight REAL,
      has_diabetes INTEGER NOT NULL DEFAULT 0,
      has_hypertension INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `,
  `
    ALTER TABLE medications ADD COLUMN scheduled_time TEXT;
  `,
  `
    ALTER TABLE medications ADD COLUMN reminder_enabled INTEGER NOT NULL DEFAULT 0;
  `,
  `
    ALTER TABLE medications ADD COLUMN reminder_minutes_before INTEGER NOT NULL DEFAULT 5;
  `,
  `
    ALTER TABLE weight_readings ADD COLUMN height REAL;
  `,
  `
    ALTER TABLE users ADD COLUMN photo_uri TEXT;
  `,
  `
    ALTER TABLE medications ADD COLUMN repeat_reminder_every_five_minutes INTEGER NOT NULL DEFAULT 0;
  `,
  `
    UPDATE blood_pressure_readings
    SET source = 'manual'
    WHERE source = 'photo';
  `,
  `
    UPDATE glicose_readings
    SET source = 'manual'
    WHERE source = 'photo';
  `,
  `
    ALTER TABLE blood_pressure_readings ADD COLUMN uuid TEXT;
    ALTER TABLE blood_pressure_readings ADD COLUMN updated_at TEXT;
    ALTER TABLE blood_pressure_readings ADD COLUMN synced_at TEXT;
    UPDATE blood_pressure_readings
    SET
      uuid = lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
      updated_at = created_at
    WHERE uuid IS NULL;
  `,
  `
    ALTER TABLE glicose_readings ADD COLUMN uuid TEXT;
    ALTER TABLE glicose_readings ADD COLUMN updated_at TEXT;
    ALTER TABLE glicose_readings ADD COLUMN synced_at TEXT;
    UPDATE glicose_readings
    SET
      uuid = lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
      updated_at = created_at
    WHERE uuid IS NULL;
  `,
  `
    ALTER TABLE weight_readings ADD COLUMN uuid TEXT;
    ALTER TABLE weight_readings ADD COLUMN updated_at TEXT;
    ALTER TABLE weight_readings ADD COLUMN synced_at TEXT;
    UPDATE weight_readings
    SET
      uuid = lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
      updated_at = created_at
    WHERE uuid IS NULL;
  `,
  `
    ALTER TABLE medications ADD COLUMN uuid TEXT;
    ALTER TABLE medications ADD COLUMN updated_at TEXT;
    ALTER TABLE medications ADD COLUMN synced_at TEXT;
    UPDATE medications
    SET
      uuid = lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
      updated_at = created_at
    WHERE uuid IS NULL;
  `,
  `
    ALTER TABLE medication_logs ADD COLUMN uuid TEXT;
    ALTER TABLE medication_logs ADD COLUMN updated_at TEXT;
    ALTER TABLE medication_logs ADD COLUMN synced_at TEXT;
    UPDATE medication_logs
    SET
      uuid = lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
      updated_at = created_at
    WHERE uuid IS NULL;
  `,
  `
    ALTER TABLE blood_pressure_readings ADD COLUMN deleted_at TEXT;
  `,
  `
    ALTER TABLE glicose_readings ADD COLUMN deleted_at TEXT;
  `,
  `
    ALTER TABLE weight_readings ADD COLUMN deleted_at TEXT;
  `,
  `
    ALTER TABLE medications ADD COLUMN deleted_at TEXT;
  `,
  `
    ALTER TABLE medication_logs ADD COLUMN deleted_at TEXT;
  `,
  `
    ALTER TABLE users ADD COLUMN age INTEGER;
  `,
  `
    ALTER TABLE users ADD COLUMN account_usage TEXT NOT NULL DEFAULT 'personal';
  `,
  `
    ALTER TABLE blood_pressure_readings ADD COLUMN profile_id INTEGER;
    ALTER TABLE glicose_readings ADD COLUMN profile_id INTEGER;
    ALTER TABLE weight_readings ADD COLUMN profile_id INTEGER;
    ALTER TABLE medications ADD COLUMN profile_id INTEGER;
    ALTER TABLE medication_logs ADD COLUMN profile_id INTEGER;

    UPDATE blood_pressure_readings
    SET profile_id = (
      SELECT profiles.id
      FROM profiles
      ORDER BY profiles.id ASC
      LIMIT 1
    )
    WHERE profile_id IS NULL;

    UPDATE glicose_readings
    SET profile_id = (
      SELECT profiles.id
      FROM profiles
      ORDER BY profiles.id ASC
      LIMIT 1
    )
    WHERE profile_id IS NULL;

    UPDATE weight_readings
    SET profile_id = (
      SELECT profiles.id
      FROM profiles
      ORDER BY profiles.id ASC
      LIMIT 1
    )
    WHERE profile_id IS NULL;

    UPDATE medications
    SET profile_id = (
      SELECT profiles.id
      FROM profiles
      ORDER BY profiles.id ASC
      LIMIT 1
    )
    WHERE profile_id IS NULL;

    UPDATE medication_logs
    SET profile_id = (
      SELECT medications.profile_id
      FROM medications
      WHERE medications.id = medication_logs.medication_id
    )
    WHERE profile_id IS NULL;
  `,
  `
    ALTER TABLE profiles ADD COLUMN remote_profile_id INTEGER;
  `,
  `
    ALTER TABLE profiles ADD COLUMN age INTEGER;
  `,
  `
    ALTER TABLE medications ADD COLUMN dose_interval TEXT DEFAULT '24:00';
  `,
  `
    UPDATE medications
    SET dose_interval = '24:00'
    WHERE dose_interval IS NULL OR trim(dose_interval) = '';
  `,
];
