import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { BrandPalette, Colors, Radius, Space } from '@/constants/theme';

const privacySections = [
  {
    title: 'Finalidade do app',
    text: 'O SigmaMed é uma ferramenta de acompanhamento pessoal para registrar pressão, glicose, peso, medicamentos e lembretes. Ele não realiza diagnóstico, prescrição, triagem, interpretação médica automatizada ou substituição de acompanhamento profissional.',
  },
  {
    title: 'Dados tratados',
    text: 'Podem ser armazenados nome, e-mail, senha protegida, PIN, preferência de biometria, foto de perfil e registros de saúde informados por você. Esses dados existem para permitir o uso da conta local, proteger o acesso e organizar seu histórico.',
  },
  {
    title: 'Armazenamento',
    text: 'Os registros do app são mantidos no dispositivo usado. Ao desinstalar o app, limpar os dados do aplicativo ou trocar de aparelho sem exportação prévia, o histórico pode ser perdido.',
  },
  {
    title: 'Biometria',
    text: 'Quando ativada, a biometria é usada somente para desbloqueio do app. A verificação ocorre pelos recursos de segurança do próprio sistema operacional; o SigmaMed não recebe nem armazena sua impressão digital ou face.',
  },
  {
    title: 'Compartilhamento',
    text: 'O SigmaMed não compartilha seus registros de saúde automaticamente. Quando você gerar ou compartilhar relatórios, a decisão de envio é responsabilidade sua.',
  },
  {
    title: 'Cuidados importantes',
    text: 'Em caso de sintomas, valores fora do esperado ou dúvidas sobre tratamento, procure um profissional de saúde. Use os registros como apoio para conversar com seu médico ou equipe de cuidado.',
  },
];

export default function PrivacyScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backText}>Voltar</ThemedText>
        </Pressable>

        <View style={styles.hero}>
          <ThemedText style={styles.eyebrow}>Privacidade e uso</ThemedText>
          <ThemedText type="title" style={styles.title}>
            Acompanhamento pessoal, com limites claros.
          </ThemedText>
          <ThemedText style={styles.description}>
            Esta política resume como o SigmaMed trata seus dados no app e reforça que ele não substitui avaliação médica.
          </ThemedText>
        </View>
      </View>

      {privacySections.map((section) => (
        <Card key={section.title} style={styles.sectionCard}>
          <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
          <ThemedText style={styles.sectionText}>{section.text}</ThemedText>
        </Card>
      ))}

      <Card muted style={styles.noticeCard}>
        <ThemedText style={styles.noticeTitle}>Resumo pratico</ThemedText>
        <ThemedText style={styles.noticeText}>
          Use o SigmaMed para organizar informações pessoais de saúde. Para decisões clínicas,
          diagnósticos, ajustes de dose ou condutas, procure atendimento profissional.
        </ThemedText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backText: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  hero: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.light.surfaceMuted,
    padding: Space.xl,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  eyebrow: {
    color: BrandPalette.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    color: Colors.light.text,
    lineHeight: 36,
  },
  description: {
    color: Colors.light.textMuted,
    lineHeight: 22,
  },
  sectionCard: {
    gap: 8,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  sectionText: {
    color: Colors.light.textMuted,
    lineHeight: 21,
  },
  noticeCard: {
    gap: 8,
    marginBottom: 6,
  },
  noticeTitle: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  noticeText: {
    color: Colors.light.textMuted,
    lineHeight: 21,
  },
});
