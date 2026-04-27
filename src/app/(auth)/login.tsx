import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreen } from '@/components/auth/auth-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function LoginScreen() {
  const { login } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const pinRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setError(null);
      await login({ email, password, pin });
      router.replace('/(tabs)');
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
        secureTextEntry
        returnKeyType="done"
        textContentType="password"
        autoComplete="current-password"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={() => pinRef.current?.focus()}
      />
      <AuthInput
        ref={pinRef}
        label="PIN deste aparelho"
        keyboardType="number-pad"
        maxLength={6}
        returnKeyType="done"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        value={pin}
        onChangeText={setPin}
        onSubmitEditing={() => void handleSubmit()}
        hint="Obrigatório no primeiro acesso neste celular. Depois ele desbloqueia o app offline."
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Entrando...' : 'Entrar'}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
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
});
