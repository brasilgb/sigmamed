import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { authenticateWithBiometrics, isBiometricSupported } from '@/features/auth/services/biometric.service';
import {
  hasRegisteredUser,
  loginUser,
  logoutUser,
  registerUser,
  restoreSessionUser,
  setBiometricPreference,
  unlockWithPin,
} from '@/features/auth/services/auth.service';
import type { AuthUser, LoginInput, RegisterInput } from '@/features/auth/types/auth';

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
  lock: () => void;
  updateBiometric: (enabled: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

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
      if (nextState !== 'active' && user) {
        setIsUnlocked(false);
      }
    });

    return () => {
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
        setHasAccount(true);
        setUser(createdUser);
        setIsUnlocked(true);
      },
      login: async (input) => {
        const loggedUser = await loginUser(input);
        setHasAccount(true);
        setUser(loggedUser);
        setIsUnlocked(true);
      },
      unlockByPin: async (pin) => {
        if (!user) {
          throw new Error('Nenhuma conta ativa no dispositivo.');
        }

        const unlockedUser = await unlockWithPin(user.id, pin);
        setUser(unlockedUser);
        setIsUnlocked(true);
      },
      unlockByBiometric: async () => {
        if (!user?.useBiometric) {
          return false;
        }

        const success = await authenticateWithBiometrics().catch(() => false);

        if (success) {
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
      lock: () => {
        if (user) {
          setIsUnlocked(false);
        }
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
