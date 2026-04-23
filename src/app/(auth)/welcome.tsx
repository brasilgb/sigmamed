import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthScreen } from '@/components/auth/auth-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function WelcomeScreen() {
  const { hasAccount } = useAuth();

  return (
    <AuthScreen
      title="Seu historico de saude, protegido no dispositivo."
      subtitle="Cadastro local, login com e-mail e desbloqueio rapido por PIN.">
      <View style={styles.featureList}>
        <ThemedText style={styles.feature}>Offline first para o MVP</ThemedText>
        <ThemedText style={styles.feature}>Sessao local protegida com Secure Store</ThemedText>
        <ThemedText style={styles.feature}>Biometria opcional com fallback por PIN</ThemedText>
      </View>

      <AuthButton label="Criar conta local" onPress={() => router.push('/(auth)/register')} />
      {hasAccount ? (
        <AuthButton
          label="Entrar com e-mail e senha"
          variant="secondary"
          onPress={() => router.push('/(auth)/login')}
        />
      ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  featureList: {
    gap: 10,
    paddingBottom: 8,
  },
  feature: {
    color: '#4d656d',
  },
});
