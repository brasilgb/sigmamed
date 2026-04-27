export type AuthUser = {
  id: number;
  name: string;
  email: string;
  age: number | null;
  photoUri: string | null;
  useBiometric: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthProfile = {
  id: number;
  userId: number;
  fullName: string | null;
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
  name: string;
  email: string;
  age: number | null;
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
