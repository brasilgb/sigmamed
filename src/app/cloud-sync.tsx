import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { BrandPalette, Colors, Radius, Space } from '@/constants/theme';

const benefits = [
  {
    title: 'Backup dos registros',
    text: 'Se trocar de celular ou reinstalar o app, seus dados podem voltar depois do login.',
    icon: 'cloud.fill' as const,
  },
  {
    title: 'Uso sem internet',
    text: 'O app continua salvando no banco local quando não houver conexão.',
    icon: 'wifi.slash' as const,
  },
  {
    title: 'Sincronização automática',
    text: 'Quando a internet voltar, os registros pendentes são enviados para a nuvem.',
    icon: 'arrow.triangle.2.circlepath' as const,
  },
];

export default function CloudSyncScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backText}>Voltar</ThemedText>
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <IconSymbol name="cloud.fill" size={28} color={BrandPalette.white} />
          </View>
          <ThemedText type="title" style={styles.title}>
            Salvar meus dados na nuvem
          </ThemedText>
          <ThemedText style={styles.description}>
            A nuvem protege seu histórico fora do aparelho e mantém o SigmaMed funcionando em dois modos:
            local primeiro, sincronização depois.
          </ThemedText>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <ThemedText style={styles.sectionEyebrow}>Como funciona</ThemedText>
        <ThemedText style={styles.sectionTitle}>O app nunca depende só da internet</ThemedText>
        <ThemedText style={styles.paragraph}>
          Seus registros continuam sendo criados no banco local do celular. Com a sincronização liberada,
          o app envia uma cópia segura para a nuvem quando houver conexão disponível.
        </ThemedText>
      </View>

      <View style={styles.benefitList}>
        {benefits.map((benefit) => (
          <View key={benefit.title} style={styles.benefitCard}>
            <View style={styles.benefitIcon}>
              <IconSymbol name={benefit.icon} size={22} color={BrandPalette.primary} />
            </View>
            <View style={styles.benefitCopy}>
              <ThemedText style={styles.benefitTitle}>{benefit.title}</ThemedText>
              <ThemedText style={styles.benefitText}>{benefit.text}</ThemedText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentIcon}>
            <IconSymbol name="qrcode" size={22} color={BrandPalette.navy} />
          </View>
          <View style={styles.paymentCopy}>
            <ThemedText style={styles.paymentTitle}>Liberação por Pix</ThemedText>
            <ThemedText style={styles.paymentText}>
              Em breve, o backend vai gerar QR code ou Pix copia e cola. Depois da confirmação do pagamento,
              a sincronização na nuvem ficará ativa para esta conta.
            </ThemedText>
          </View>
        </View>
        <AuthButton label="Quero salvar na nuvem" disabled onPress={() => undefined} />
        <ThemedText style={styles.paymentHint}>
          Esta etapa depende da integração de pagamento no backend.
        </ThemedText>
      </View>
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
    backgroundColor: '#E9F7F4',
    borderWidth: 1,
    borderColor: '#CBE8E1',
    padding: Space.xl,
    gap: 14,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: BrandPalette.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Space.lg,
    gap: 10,
  },
  sectionEyebrow: {
    color: Colors.light.textSoft,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  paragraph: {
    color: Colors.light.textMuted,
    lineHeight: 21,
  },
  benefitList: {
    gap: 12,
  },
  benefitCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: '#E2ECEF',
    padding: Space.md,
    flexDirection: 'row',
    gap: 14,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: '#DDF1EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitCopy: {
    flex: 1,
    gap: 4,
  },
  benefitTitle: {
    color: Colors.light.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  benefitText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
  },
  paymentCard: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: '#D6E2E6',
    padding: Space.lg,
    gap: 14,
  },
  paymentHeader: {
    flexDirection: 'row',
    gap: 14,
  },
  paymentIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: '#F4E8C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCopy: {
    flex: 1,
    gap: 4,
  },
  paymentTitle: {
    color: Colors.light.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  paymentText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
  },
  paymentHint: {
    color: Colors.light.textSoft,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
