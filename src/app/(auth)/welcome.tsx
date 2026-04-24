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
      title="Acompanhe seus registros de saude com mais clareza."
      subtitle="Crie sua conta para acessar pressao, glicose, peso e medicacoes em um unico lugar.">
      <View style={styles.featureList}>
        <ThemedText style={styles.feature}>Registros organizados por modulo para facilitar o acompanhamento</ThemedText>
        <ThemedText style={styles.feature}>Acesso protegido com senha, PIN e biometria opcional</ThemedText>
        <ThemedText style={styles.feature}>Foto de perfil, historico recente e atalhos na home</ThemedText>
      </View>

      <AuthButton label="Criar conta" onPress={() => router.push('/(auth)/register')} />
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
    lineHeight: 20,
  },
});
