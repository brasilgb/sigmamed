import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreen } from '@/components/auth/auth-screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function LoginScreen() {
  const { biometricAvailable, hasLocalBiometricLogin, isUnlocked, login, loginByBiometric } = useAuth();
  const params = useLocalSearchParams<{ resetPin?: string }>();
  const passwordRef = useRef<TextInput>(null);
  const autoBiometricAttemptedRef = useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBiometricBusy, setIsBiometricBusy] = useState(false);

  const canUnlockWithBiometrics = Boolean(hasLocalBiometricLogin && biometricAvailable && !params.resetPin);

  const handleBiometricUnlock = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!canUnlockWithBiometrics || isBiometricBusy) {
        return;
      }

      try {
        setIsBiometricBusy(true);
        setError(null);
        const success = await loginByBiometric().catch(() => false);

        if (success) {
          router.replace('/(tabs)');
          return;
        }

        if (!options.silent) {
          setError('Biometria cancelada. Entre com e-mail e senha.');
        }
      } finally {
        setIsBiometricBusy(false);
      }
    },
    [canUnlockWithBiometrics, isBiometricBusy, loginByBiometric]
  );

  useEffect(() => {
    if (!canUnlockWithBiometrics || autoBiometricAttemptedRef.current) {
      return;
    }

    autoBiometricAttemptedRef.current = true;
    void handleBiometricUnlock({ silent: true });
  }, [canUnlockWithBiometrics, handleBiometricUnlock]);

  useEffect(() => {
    if (isUnlocked) {
      router.replace('/(tabs)');
    }
  }, [isUnlocked]);

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setError(null);
      const loggedUser = await login({ email, password, resetLocalPin: params.resetPin === '1' });
      router.replace(loggedUser.hasPin ? '/(tabs)' : '/(auth)/setup-pin');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao entrar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Entrar com e-mail e senha"
      subtitle="Acesse sua conta para visualizar seus registros e continuar seu acompanhamento.">
      <AuthInput
        label="E-mail"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        returnKeyType="next"
        textContentType="emailAddress"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <AuthInput
        ref={passwordRef}
        label="Senha"
        autoCapitalize="none"
        secureTextEntry={!showPassword}
        returnKeyType="done"
        textContentType="password"
        autoComplete="current-password"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={() => void handleSubmit()}
        rightElement={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            onPress={() => setShowPassword((current) => !current)}
            style={styles.passwordVisibilityButton}>
            <IconSymbol name={showPassword ? 'eye.slash.fill' : 'eye.fill'} size={22} color={Colors.light.textMuted} />
          </Pressable>
        }
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      {canUnlockWithBiometrics ? (
        <AuthButton
          label={isBiometricBusy ? 'Validando biometria...' : 'Entrar com biometria'}
          variant="secondary"
          disabled={isSubmitting || isBiometricBusy}
          onPress={() => void handleBiometricUnlock()}
        />
      ) : null}
      <AuthButton
        label={isSubmitting ? 'Entrando...' : 'Entrar'}
        disabled={isSubmitting || isBiometricBusy}
        onPress={handleSubmit}
      />
      <Pressable onPress={() => router.push({ pathname: '/(auth)/forgot-password', params: { email } })}>
        <ThemedText style={styles.link}>Esqueci minha senha</ThemedText>
      </Pressable>
      <Pressable onPress={() => router.replace('/(auth)/register')}>
        <ThemedText style={styles.link}>Criar conta</ThemedText>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: Colors.light.danger,
  },
  link: {
    textAlign: 'center',
    color: Colors.light.tint,
    fontWeight: '700',
  },
  passwordVisibilityButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
