import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { BrandPalette, Colors, ModulePalette, Radius, Space } from '@/constants/theme';

const quickGuides = [
  {
    title: 'Escolha o acompanhado',
    text: 'Em contas familiares, selecione o acompanhado na Home antes de lançar medições. Assim pressão, glicose, peso, medicações e relatórios ficam no perfil correto.',
    icon: 'person.2.fill' as const,
    color: BrandPalette.primary,
  },
  {
    title: 'Registre medições',
    text: 'Use os cards de Pressão, Glicose ou Peso. Informe o valor, revise a data e toque em salvar. As observações são opcionais e ajudam na consulta médica.',
    icon: 'waveform.path.ecg' as const,
    color: ModulePalette.pressure.base,
  },
  {
    title: 'Cadastre medicações',
    text: 'No módulo Medicação, adicione nome, dose, horário e intervalo. Se ativar lembrete, o app avisa no horário e abre a tela de medicação ao tocar na notificação.',
    icon: 'pills.fill' as const,
    color: ModulePalette.medication.base,
  },
  {
    title: 'Marque tomadas',
    text: 'Na tela de Medicação, toque em marcar como tomado para registrar a dose do dia. Se precisar corrigir, toque novamente para desfazer.',
    icon: 'checkmark.circle.fill' as const,
    color: BrandPalette.wellness,
  },
  {
    title: 'Gere relatório',
    text: 'Abra Relatório do período, escolha 7, 30 ou 90 dias e selecione os módulos. O PDF traz apenas as marcações cadastradas para imprimir ou enviar ao médico.',
    icon: 'list.bullet.rectangle.fill' as const,
    color: BrandPalette.navy,
  },
  {
    title: 'Use a nuvem',
    text: 'Com plano ativo, os dados sincronizados podem ser restaurados após reinstalar o app. PIN e biometria continuam sendo configurações locais do aparelho.',
    icon: 'cloud.fill' as const,
    color: BrandPalette.primary,
  },
];

const careNotes = [
  'O Meu Controle organiza registros informados por você.',
  'O app não gera diagnóstico, prescrição ou orientação clínica.',
  'Em caso de sintomas, valores fora do esperado ou dúvidas sobre tratamento, procure um profissional de saúde.',
];

export default function HelpScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backText}>Voltar</ThemedText>
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <IconSymbol name="questionmark.circle.fill" size={28} color={BrandPalette.white} />
          </View>
          <ThemedText style={styles.eyebrow}>Ajuda</ThemedText>
          <ThemedText type="title" style={styles.title}>
            Como usar o Meu Controle.
          </ThemedText>
          <ThemedText style={styles.description}>
            Um guia rápido para cadastrar acompanhados, inserir dados, configurar lembretes e gerar relatórios.
          </ThemedText>
        </View>
      </View>

      {quickGuides.map((guide) => (
        <Card key={guide.title} style={styles.guideCard}>
          <View style={[styles.guideIcon, { backgroundColor: `${guide.color}18` }]}>
            <IconSymbol name={guide.icon} size={22} color={guide.color} />
          </View>
          <View style={styles.guideCopy}>
            <ThemedText style={styles.guideTitle}>{guide.title}</ThemedText>
            <ThemedText style={styles.guideText}>{guide.text}</ThemedText>
          </View>
        </Card>
      ))}

      <Card muted style={styles.noticeCard}>
        <ThemedText style={styles.noticeTitle}>Importante</ThemedText>
        {careNotes.map((note) => (
          <View key={note} style={styles.noteRow}>
            <IconSymbol name="checkmark.circle.fill" size={18} color={BrandPalette.primary} />
            <ThemedText style={styles.noticeText}>{note}</ThemedText>
          </View>
        ))}
      </Card>

      <Card style={styles.supportCard}>
        <ThemedText style={styles.noticeTitle}>Suporte</ThemedText>
        <ThemedText style={styles.noticeText}>
          Para dúvidas sobre acesso, nuvem ou uso do app, fale com o suporte.
        </ThemedText>
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            void Linking.openURL('mailto:contato@sigmaos.com.br');
          }}>
          <ThemedText style={styles.supportLink}>contato@sigmaos.com.br</ThemedText>
        </Pressable>
      </Card>

      <Card muted style={styles.copyrightCard}>
        <ThemedText style={styles.copyrightText}>
          Meu Controle é um produto SigmaOS.
        </ThemedText>
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            void Linking.openURL('https://sigmaos.com.br');
          }}>
          <ThemedText style={styles.supportLink}>sigmaos.com.br</ThemedText>
        </Pressable>
        <ThemedText style={styles.copyrightMuted}>
          Copyright © SigmaOS. Todos os direitos reservados.
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
    backgroundColor: '#EAF5F2',
    padding: Space.xl,
    gap: 10,
    borderWidth: 1,
    borderColor: '#CFE5DF',
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: Radius.lg,
    backgroundColor: BrandPalette.navy,
    alignItems: 'center',
    justifyContent: 'center',
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
  guideCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  guideIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideCopy: {
    flex: 1,
    gap: 5,
  },
  guideTitle: {
    color: Colors.light.text,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },
  guideText: {
    color: Colors.light.textMuted,
    lineHeight: 21,
  },
  noticeCard: {
    gap: 10,
  },
  noticeTitle: {
    color: Colors.light.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noticeText: {
    flex: 1,
    color: Colors.light.textMuted,
    lineHeight: 21,
  },
  supportCard: {
    gap: 10,
    borderColor: '#CFE5DF',
    backgroundColor: '#F7FBFC',
  },
  supportLink: {
    color: BrandPalette.primary,
    fontWeight: '900',
    lineHeight: 21,
  },
  copyrightCard: {
    alignItems: 'center',
    gap: 6,
  },
  copyrightText: {
    color: Colors.light.text,
    fontWeight: '800',
    textAlign: 'center',
  },
  copyrightMuted: {
    color: Colors.light.textSoft,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
});
