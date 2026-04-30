import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { authenticateWithBiometrics, isBiometricSupported } from '@/features/auth/services/biometric.service';
import {
  deleteLocalAccount,
  hasRegisteredUser,
  loginUser,
  logoutUser,
  registerUser,
  restoreSessionUser,
  setBiometricPreference,
  updateAccount,
  unlockWithPin,
} from '@/features/auth/services/auth.service';
import { setCloudReminderPending } from '@/features/auth/services/session-storage.service';
import type { AuthUser, LoginInput, RegisterInput, UpdateAccountInput } from '@/features/auth/types/auth';

type AuthContextValue = {
  isLoading: boolean;
  hasAccount: boolean;
  isUnlocked: boolean;
  user: AuthUser | null;
  biometricAvailable: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  unlockByPin: (pin: string) => Promise<void>;
  unlockByBiometric: () => Promise<boolean>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  lock: () => void;
  suspendAutoLock: () => void;
  resumeAutoLock: () => void;
  updateBiometric: (enabled: boolean) => Promise<void>;
  updateAccount: (input: UpdateAccountInput) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
let autoLockSuspended = false;
const AUTO_LOCK_BACKGROUND_DELAY_MS = 5000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const autoLockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        const [registered, restoredUser, biometricSupport] = await Promise.all([
          hasRegisteredUser(),
          restoreSessionUser(),
          isBiometricSupported().catch(() => false),
        ]);

        if (!isMounted) {
          return;
        }

        setHasAccount(registered);
        setUser(restoredUser);
        setBiometricAvailable(biometricSupport);
        setIsUnlocked(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        if (autoLockTimeoutRef.current) {
          clearTimeout(autoLockTimeoutRef.current);
          autoLockTimeoutRef.current = null;
        }

        return;
      }

      if (nextState === 'background' && user && !autoLockSuspended) {
        if (autoLockTimeoutRef.current) {
          clearTimeout(autoLockTimeoutRef.current);
        }

        autoLockTimeoutRef.current = setTimeout(() => {
          if (!autoLockSuspended) {
            setIsUnlocked(false);
          }

          autoLockTimeoutRef.current = null;
        }, AUTO_LOCK_BACKGROUND_DELAY_MS);
      }
    });

    return () => {
      if (autoLockTimeoutRef.current) {
        clearTimeout(autoLockTimeoutRef.current);
      }

      subscription.remove();
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      hasAccount,
      isUnlocked,
      user,
      biometricAvailable,
      register: async (input) => {
        const createdUser = await registerUser(input);
        await setCloudReminderPending(true);
        setHasAccount(true);
        setUser(createdUser);
        setIsUnlocked(true);
      },
      login: async (input) => {
        const loggedUser = await loginUser(input);
        await setCloudReminderPending(true);
        setHasAccount(true);
        setUser(loggedUser);
        setIsUnlocked(true);
      },
      unlockByPin: async (pin) => {
        if (!user) {
          throw new Error('Nenhuma conta ativa no dispositivo.');
        }

        const unlockedUser = await unlockWithPin(user.id, pin);
        await setCloudReminderPending(true);
        setUser(unlockedUser);
        setIsUnlocked(true);
      },
      unlockByBiometric: async () => {
        if (!user?.useBiometric) {
          return false;
        }

        const success = await authenticateWithBiometrics().catch(() => false);

        if (success) {
          await setCloudReminderPending(true);
          setIsUnlocked(true);
        }

        return success;
      },
      logout: async () => {
        await logoutUser();
        setUser(null);
        setHasAccount(await hasRegisteredUser());
        setIsUnlocked(false);
      },
      deleteAccount: async () => {
        if (!user) {
          return;
        }

        await deleteLocalAccount(user.id);
        setUser(null);
        setHasAccount(false);
        setIsUnlocked(false);
      },
      lock: () => {
        if (user) {
          setIsUnlocked(false);
        }
      },
      suspendAutoLock: () => {
        autoLockSuspended = true;
      },
      resumeAutoLock: () => {
        autoLockSuspended = false;
      },
      updateBiometric: async (enabled) => {
        if (!user) {
          return;
        }

        await setBiometricPreference(user.id, enabled);
        setUser({
          ...user,
          useBiometric: enabled,
        });
      },
      updateAccount: async (input) => {
        if (!user) {
          return;
        }

        const updatedUser = await updateAccount(user.id, input);
        setUser(updatedUser);
      },
    }),
    [biometricAvailable, hasAccount, isLoading, isUnlocked, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
