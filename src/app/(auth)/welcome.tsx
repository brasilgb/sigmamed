import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthScreen } from '@/components/auth/auth-screen';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function WelcomeScreen() {
  const { hasAccount } = useAuth();

  return (
    <AuthScreen
      title="Acompanhe seus registros pessoais de saúde com mais clareza."
      subtitle="Crie sua conta para registrar pressão, glicose, peso e medicações em um único lugar. O SigmaMed não substitui avaliação, diagnóstico ou acompanhamento profissional.">
      <View style={styles.featureList}>
        <ThemedText style={styles.feature}>Registros organizados por módulo para facilitar o acompanhamento</ThemedText>
        <ThemedText style={styles.feature}>Acesso protegido com senha, PIN e biometria opcional</ThemedText>
        <ThemedText style={styles.feature}>Dados mantidos no dispositivo para uso pessoal e controle do histórico</ThemedText>
      </View>

      <AuthButton label="Criar conta" onPress={() => router.push('/(auth)/register')} />
      <AuthButton
        label={hasAccount ? 'Entrar com e-mail e senha' : 'Ja tenho conta na nuvem'}
        variant="secondary"
        onPress={() => router.push('/(auth)/login')}
      />
      <AuthButton label="Privacidade e uso" variant="secondary" onPress={() => router.push('/privacy')} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  featureList: {
    gap: 10,
    paddingBottom: 8,
  },
  feature: {
    color: Colors.light.textMuted,
    lineHeight: 20,
  },
});
