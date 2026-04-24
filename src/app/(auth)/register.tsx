import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Colors, Radius } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreen } from '@/components/auth/auth-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function RegisterScreen() {
  const { biometricAvailable, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [useBiometric, setUseBiometric] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (password !== confirmPassword) {
      setError('As senhas precisam ser iguais.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await register({
        name,
        email,
        password,
        pin,
        useBiometric: biometricAvailable && useBiometric,
      });
      router.replace('/(tabs)');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao criar conta.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Criar conta"
      subtitle="Preencha seus dados para começar a registrar e acompanhar sua rotina de saude.">
      <AuthInput label="Nome" autoCapitalize="words" value={name} onChangeText={setName} />
      <AuthInput
        label="E-mail"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <AuthInput
        label="Senha"
        autoCapitalize="none"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <AuthInput
        label="Confirmar senha"
        autoCapitalize="none"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <AuthInput
        label="PIN de acesso"
        keyboardType="number-pad"
        maxLength={6}
        value={pin}
        onChangeText={setPin}
        hint="Use 4 ou 6 digitos para desbloquear o app com mais rapidez."
      />

      {biometricAvailable ? (
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceText}>
            <ThemedText style={styles.preferenceTitle}>Ativar biometria</ThemedText>
            <ThemedText style={styles.preferenceDescription}>
              Use impressao digital ou reconhecimento facial quando disponivel.
            </ThemedText>
          </View>
          <Switch value={useBiometric} onValueChange={setUseBiometric} />
        </View>
      ) : null}

      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

      <AuthButton
        label={isSubmitting ? 'Criando conta...' : 'Criar conta'}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />

      <Pressable onPress={() => router.replace('/(auth)/login')}>
        <ThemedText style={styles.link}>Ja tenho conta</ThemedText>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  preferenceRow: {
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceMuted,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  preferenceText: {
    flex: 1,
    gap: 4,
  },
  preferenceTitle: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  preferenceDescription: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: Colors.light.danger,
  },
  link: {
    textAlign: 'center',
    color: Colors.light.tint,
    fontWeight: '700',
  },
});
