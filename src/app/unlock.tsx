import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreen } from '@/components/auth/auth-screen';
import { ProfileAvatar } from '@/components/profile-avatar';
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
      subtitle="Use seu PIN para continuar. Se a biometria estiver ativa, voce tambem pode entrar por ela.">
      <View style={styles.accountCard}>
        <ProfileAvatar name={user.name} photoUri={user.photoUri} size={72} />
        <View style={styles.accountCopy}>
          <ThemedText style={styles.accountLabel}>Conta ativa</ThemedText>
          <ThemedText style={styles.accountName}>{user.name}</ThemedText>
          <ThemedText style={styles.accountValue}>{user.email}</ThemedText>
        </View>
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
    borderRadius: 22,
    backgroundColor: '#F5F9FB',
    padding: 18,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#DDE8EC',
  },
  accountCopy: {
    alignItems: 'center',
    gap: 4,
  },
  accountLabel: {
    color: '#5b7279',
    fontSize: 13,
    lineHeight: 18,
  },
  accountName: {
    color: '#17303a',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },
  accountValue: {
    color: '#17303a',
    fontWeight: '700',
    lineHeight: 20,
  },
  error: {
    color: '#b14646',
  },
});
