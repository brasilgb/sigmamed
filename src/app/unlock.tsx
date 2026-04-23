import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreen } from '@/components/auth/auth-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function UnlockScreen() {
  const { biometricAvailable, isUnlocked, unlockByBiometric, unlockByPin, user } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!user?.useBiometric || !biometricAvailable) {
      return;
    }

    unlockByBiometric().catch(() => null);
  }, [biometricAvailable, unlockByBiometric, user?.useBiometric]);

  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (isUnlocked) {
    return <Redirect href="/(tabs)" />;
  }

  async function handlePinUnlock() {
    try {
      setIsBusy(true);
      setError(null);
      await unlockByPin(pin);
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : 'Nao foi possivel desbloquear.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleBiometricUnlock() {
    setIsBusy(true);
    setError(null);
    const success = await unlockByBiometric().catch(() => false);

    if (!success) {
      setError('Biometria indisponivel ou nao validada. Use seu PIN.');
    }

    setIsBusy(false);
  }

  return (
    <AuthScreen
      title={`Olá, ${user.name.split(' ')[0]}`}
      subtitle="Desbloqueie o app com seu PIN. Se a biometria estiver ativa, voce pode usar os dois modos.">
      <View style={styles.accountCard}>
        <ThemedText style={styles.accountLabel}>Conta ativa</ThemedText>
        <ThemedText style={styles.accountValue}>{user.email}</ThemedText>
      </View>

      <AuthInput
        label="PIN"
        keyboardType="number-pad"
        maxLength={6}
        secureTextEntry
        value={pin}
        onChangeText={setPin}
      />

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      <AuthButton
        label={isBusy ? 'Validando...' : 'Desbloquear com PIN'}
        disabled={isBusy}
        onPress={handlePinUnlock}
      />

      {user.useBiometric && biometricAvailable ? (
        <AuthButton
          label="Tentar biometria"
          variant="secondary"
          disabled={isBusy}
          onPress={handleBiometricUnlock}
        />
      ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    borderRadius: 18,
    backgroundColor: '#f4f8f9',
    padding: 16,
    gap: 4,
  },
  accountLabel: {
    color: '#5b7279',
    fontSize: 13,
    lineHeight: 18,
  },
  accountValue: {
    color: '#17303a',
    fontWeight: '700',
  },
  error: {
    color: '#b14646',
  },
});
