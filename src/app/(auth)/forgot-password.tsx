import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreen } from '@/components/auth/auth-screen';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { requestPasswordReset } from '@/features/auth/services/auth-api.service';

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(String(params.email ?? ''));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Informe seu e-mail.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await requestPasswordReset({ email: normalizedEmail });
      router.push({ pathname: '/(auth)/reset-password', params: { email: normalizedEmail } });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao solicitar recuperação.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Recuperar senha"
      subtitle="Informe o e-mail da conta para receber o código de recuperação.">
      <AuthInput
        label="E-mail"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        returnKeyType="done"
        textContentType="emailAddress"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={() => void handleSubmit()}
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <AuthButton
        label={isSubmitting ? 'Enviando...' : 'Enviar código'}
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
  link: {
    textAlign: 'center',
    color: Colors.light.tint,
    fontWeight: '700',
  },
});
