import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Colors, Radius } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthScreen } from '@/components/auth/auth-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function RegisterScreen() {
  const { biometricAvailable, register } = useAuth();
  const emailRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const pinRef = useRef<TextInput>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [useBiometric, setUseBiometric] = useState(false);
  const [acceptedPersonalUse, setAcceptedPersonalUse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!acceptedPersonalUse) {
      setError('Confirme que entendeu a finalidade pessoal do app antes de criar a conta.');
      return;
    }

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
        age: age.trim() ? Number(age) : null,
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
      subtitle="Preencha seus dados para acompanhar sua rotina de saúde de forma pessoal e organizada.">
      <AuthInput
        label="Nome completo"
        autoCapitalize="words"
        returnKeyType="next"
        textContentType="name"
        autoComplete="name"
        placeholder="Seu nome completo"
        value={name}
        onChangeText={setName}
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <AuthInput
        ref={emailRef}
        label="E-mail de acesso"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        returnKeyType="next"
        textContentType="emailAddress"
        autoComplete="email"
        placeholder="voce@email.com"
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={() => ageRef.current?.focus()}
      />
      <AuthInput
        ref={ageRef}
        label="Idade em anos"
        keyboardType="number-pad"
        maxLength={3}
        returnKeyType="next"
        textContentType="none"
        placeholder="Ex.: 35"
        value={age}
        onChangeText={(value) => setAge(value.replace(/\D/g, ''))}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <AuthInput
        ref={passwordRef}
        label="Senha da conta"
        autoCapitalize="none"
        secureTextEntry
        returnKeyType="next"
        textContentType="newPassword"
        autoComplete="password-new"
        placeholder="Mínimo de 6 caracteres"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
      />
      <AuthInput
        ref={confirmPasswordRef}
        label="Confirmação da senha"
        autoCapitalize="none"
        secureTextEntry
        returnKeyType="next"
        textContentType="password"
        placeholder="Repita sua senha"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        onSubmitEditing={() => pinRef.current?.focus()}
      />
      <AuthInput
        ref={pinRef}
        label="PIN de desbloqueio"
        keyboardType="number-pad"
        maxLength={6}
        returnKeyType="done"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        placeholder="4 ou 6 dígitos"
        value={pin}
        onChangeText={setPin}
        onSubmitEditing={() => void handleSubmit()}
      />

      {biometricAvailable ? (
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceText}>
            <ThemedText style={styles.preferenceTitle}>Ativar biometria</ThemedText>
            <ThemedText style={styles.preferenceDescription}>
              Use impressão digital ou reconhecimento facial quando disponível.
            </ThemedText>
          </View>
          <Switch value={useBiometric} onValueChange={setUseBiometric} />
        </View>
      ) : null}

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acceptedPersonalUse }}
        onPress={() => setAcceptedPersonalUse((current) => !current)}
        style={styles.consentCard}>
        <View style={[styles.checkbox, acceptedPersonalUse ? styles.checkboxChecked : null]}>
          {acceptedPersonalUse ? <ThemedText style={styles.checkboxMark}>✓</ThemedText> : null}
        </View>
        <View style={styles.consentText}>
          <ThemedText style={styles.consentTitle}>Uso pessoal e privacidade</ThemedText>
          <ThemedText style={styles.consentDescription}>
            Entendo que o SigmaMed é um apoio para registro pessoal e não substitui consulta,
            diagnóstico, prescrição ou acompanhamento por profissional de saúde.
          </ThemedText>
          <Pressable onPress={() => router.push('/privacy')}>
            <ThemedText style={styles.privacyLink}>Ler política de privacidade</ThemedText>
          </Pressable>
        </View>
      </Pressable>

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
  consentCard: {
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  checkboxMark: {
    color: Colors.light.surface,
    fontWeight: '800',
    lineHeight: 20,
  },
  consentText: {
    flex: 1,
    gap: 6,
  },
  consentTitle: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  consentDescription: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  privacyLink: {
    color: Colors.light.tint,
    fontWeight: '800',
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
