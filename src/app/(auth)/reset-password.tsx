import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreen } from '@/components/auth/auth-screen';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { resetRemotePassword } from '@/features/auth/services/auth-api.service';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const codeRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState(String(params.email ?? ''));
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    if (!normalizedEmail || !normalizedCode) {
      setError('Informe e-mail e código.');
      return;
    }

    if (password.length < 6) {
      setError('A nova senha precisa ter ao menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas precisam ser iguais.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);
      await resetRemotePassword({
        email: normalizedEmail,
        code: normalizedCode,
        password,
      });
      setMessage('Senha alterada com sucesso. Entre novamente.');
      setTimeout(() => router.replace('/(auth)/login'), 700);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao redefinir senha.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Nova senha"
      subtitle="Digite o código recebido por e-mail e escolha uma nova senha.">
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
        onSubmitEditing={() => codeRef.current?.focus()}
      />
      <AuthInput
        ref={codeRef}
        label="Código"
        autoCapitalize="none"
        keyboardType="number-pad"
        returnKeyType="next"
        value={code}
        onChangeText={setCode}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <AuthInput
        ref={passwordRef}
        label="Nova senha"
        autoCapitalize="none"
        secureTextEntry
        returnKeyType="next"
        textContentType="newPassword"
        autoComplete="password-new"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
      />
      <AuthInput
        ref={confirmPasswordRef}
        label="Confirmar nova senha"
        autoCapitalize="none"
        secureTextEntry
        returnKeyType="done"
        textContentType="newPassword"
        autoComplete="password-new"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        onSubmitEditing={() => void handleSubmit()}
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      {message ? <ThemedText style={styles.success}>{message}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Alterando...' : 'Alterar senha'}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
      <Pressable onPress={() => router.replace('/(auth)/login')}>
        <ThemedText style={styles.link}>Voltar para login</ThemedText>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: Colors.light.danger,
  },
  success: {
    color: Colors.light.success,
    fontWeight: '700',
  },
  link: {
    textAlign: 'center',
    color: Colors.light.tint,
    fontWeight: '700',
  },
});
