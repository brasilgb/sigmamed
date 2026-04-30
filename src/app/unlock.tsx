import { Redirect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreen } from '@/components/auth/auth-screen';
import { ProfileAvatar } from '@/components/profile-avatar';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  getBillingCycleLabel,
  getBillingPlanLabel,
  getBillingSyncAccess,
  type BillingSyncAccess,
} from '@/services/billing.service';

export default function UnlockScreen() {
  const { biometricAvailable, isUnlocked, unlockByBiometric, unlockByPin, user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [syncAccess, setSyncAccess] = useState<BillingSyncAccess | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [isPinBusy, setIsPinBusy] = useState(false);
  const [isBiometricBusy, setIsBiometricBusy] = useState(false);
  const autoBiometricAttemptedRef = useRef(false);
  const biometricInFlightRef = useRef(false);
  const isBusy = isPinBusy || isBiometricBusy;

  const handleBiometricUnlock = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (biometricInFlightRef.current) {
        return;
      }

      biometricInFlightRef.current = true;
      setIsBiometricBusy(true);
      setError(null);

      try {
        const success = await unlockByBiometric().catch(() => false);

        if (!success && !options.silent) {
          setError('Biometria indisponível ou não validada. Use seu PIN.');
        }
      } finally {
        biometricInFlightRef.current = false;
        setIsBiometricBusy(false);
      }
    },
    [unlockByBiometric]
  );

  useEffect(() => {
    if (!user?.useBiometric || !biometricAvailable || autoBiometricAttemptedRef.current) {
      return;
    }

    autoBiometricAttemptedRef.current = true;
    void handleBiometricUnlock({ silent: true });
  }, [biometricAvailable, handleBiometricUnlock, user?.useBiometric]);

  useEffect(() => {
    let isMounted = true;

    async function loadPlan() {
      if (!user) {
        setSyncAccess(null);
        return;
      }

      setIsLoadingPlan(true);

      try {
        const access = await getBillingSyncAccess();

        if (isMounted) {
          setSyncAccess(access);
        }
      } catch {
        if (isMounted) {
          setSyncAccess(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlan(false);
        }
      }
    }

    void loadPlan();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (isUnlocked) {
    return <Redirect href="/(tabs)" />;
  }

  async function handlePinUnlock() {
    if (isBiometricBusy) {
      return;
    }

    if (!pin.trim()) {
      setError('Informe seu PIN.');
      return;
    }

    try {
      setIsPinBusy(true);
      setError(null);
      await unlockByPin(pin);
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : 'Não foi possível desbloquear.');
    } finally {
      setIsPinBusy(false);
    }
  }

  function getPinButtonLabel() {
    if (isPinBusy) {
      return 'Validando PIN...';
    }

    if (isBiometricBusy) {
      return 'Aguardando biometria...';
    }

    return 'Desbloquear com PIN';
  }

  function getBiometricButtonLabel() {
    return isBiometricBusy ? 'Validando biometria...' : 'Tentar biometria';
  }

  const biometricUnavailableMessage =
    user.useBiometric && !biometricAvailable
      ? 'Biometria não disponível ou não cadastrada neste aparelho.'
      : null;
  const planCycle = getBillingCycleLabel(syncAccess?.cycle ?? null);
  const planText = syncAccess?.sync_enabled
    ? `${getBillingPlanLabel(syncAccess.plan)}${planCycle ? ` - ${planCycle}` : ''}`
    : isLoadingPlan
      ? 'Carregando plano...'
      : 'Nuvem não ativada';

  return (
    <AuthScreen
      title={`Olá, ${user.name.split(' ')[0]}`}
      subtitle="Use seu PIN para continuar. Se a biometria estiver ativa, você também pode entrar por ela.">
      <View
        style={[
          styles.accountCard,
          {
            backgroundColor: Colors[colorScheme].surfaceMuted,
            borderColor: Colors[colorScheme].border,
          },
        ]}>
        <ProfileAvatar name={user.name} photoUri={user.photoUri} size={72} />
        <View style={styles.accountCopy}>
          <ThemedText style={[styles.accountLabel, { color: Colors[colorScheme].textMuted }]}>
            Conta ativa
          </ThemedText>
          <ThemedText
            style={[
              styles.planBadge,
              {
                backgroundColor: syncAccess?.sync_enabled ? '#DDF1EC' : Colors[colorScheme].surface,
                borderColor: Colors[colorScheme].border,
                color: syncAccess?.sync_enabled ? '#0E9F8C' : Colors[colorScheme].textMuted,
              },
            ]}>
            {planText}
          </ThemedText>
          <ThemedText style={[styles.accountName, { color: Colors[colorScheme].text }]}>
            {user.name}
          </ThemedText>
          <ThemedText style={[styles.accountValue, { color: Colors[colorScheme].text }]}>
            {user.email}
          </ThemedText>
        </View>
      </View>

      <AuthInput
        label="PIN"
        keyboardType="number-pad"
        maxLength={6}
        placeholder="4 ou 6 dígitos"
        secureTextEntry
        value={pin}
        onChangeText={setPin}
        onSubmitEditing={() => void handlePinUnlock()}
      />

      {biometricUnavailableMessage ? (
        <ThemedText style={styles.error}>{biometricUnavailableMessage}</ThemedText>
      ) : null}
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      <AuthButton
        label={getPinButtonLabel()}
        disabled={isBusy}
        onPress={handlePinUnlock}
      />

      {user.useBiometric && biometricAvailable ? (
        <AuthButton
          label={getBiometricButtonLabel()}
          variant="secondary"
          disabled={isBusy}
          onPress={() => void handleBiometricUnlock()}
        />
      ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  accountCopy: {
    alignItems: 'center',
    gap: 4,
  },
  accountLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  planBadge: {
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  accountName: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },
  accountValue: {
    fontWeight: '700',
    lineHeight: 20,
  },
  error: {
    color: Colors.light.danger,
  },
});
