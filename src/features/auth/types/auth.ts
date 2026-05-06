export type AuthUser = {
  id: number;
  accountUsage: AccountUsage;
  name: string;
  email: string;
  age: number | null;
  photoUri: string | null;
  useBiometric: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AccountUsage = 'personal' | 'family' | 'professional';

export type AuthProfile = {
  id: number;
  remoteProfileId: number | null;
  userId: number;
  fullName: string | null;
  age: number | null;
  birthDate: string | null;
  sex: string | null;
  height: number | null;
  targetWeight: number | null;
  hasDiabetes: boolean;
  hasHypertension: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RegisterInput = {
  accountUsage: AccountUsage;
  name: string;
  email: string;
  age: number | null;
  sex: string | null;
  height: number | null;
  password: string;
  pin: string;
  useBiometric: boolean;
};

export type LoginInput = {
  email: string;
  password: string;
  pin?: string;
};

export type UpdateAccountInput = {
  name: string;
  email: string;
  photoUri?: string | null;
  currentPassword?: string;
  newPassword?: string;
};

export type UnlockMethod = 'pin' | 'biometric';
