import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { BrandPalette, Colors, Radius, Space } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useBillingSyncAccess } from '@/hooks/use-billing-sync-access';
import {
  createBillingCheckout,
  getBillingCycleLabel,
  getBillingPlanLabel,
  getBillingPlanPriceLabel,
  isBillingSyncEnabled,
  type BillingCheckout,
  type BillingPlan,
} from '@/services/billing.service';

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

const planOptions: {
  plan: BillingPlan;
  account: 'personal' | 'family';
  title: string;
  cycle: string;
  description: string;
}[] = [
  {
    plan: 'personal_monthly',
    account: 'personal',
    title: 'Pessoal mensal',
    cycle: 'Mensal',
    description: 'Para uso individual com backup e sincronização em nuvem.',
  },
  {
    plan: 'personal_annual',
    account: 'personal',
    title: 'Pessoal anual',
    cycle: 'Anual',
    description: 'Mesmo acesso pessoal com ciclo anual.',
  },
  {
    plan: 'family_caregiver_monthly',
    account: 'family',
    title: 'Familiar/acompanhante mensal',
    cycle: 'Mensal',
    description: 'Para conta que acompanha outra pessoa ou perfis de cuidado.',
  },
  {
    plan: 'family_caregiver_annual',
    account: 'family',
    title: 'Familiar/acompanhante anual',
    cycle: 'Anual',
    description: 'Mesmo acesso familiar/cuidador com ciclo anual.',
  },
];

function formatAmount(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function CloudSyncScreen() {
  const { user } = useAuth();
  const { isLoading: isLoadingPlan, syncAccess } = useBillingSyncAccess({ enabled: Boolean(user) });
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [checkout, setCheckout] = useState<BillingCheckout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const accountPlanType = user?.accountUsage === 'personal' ? 'personal' : 'family';
  const visiblePlans = useMemo(
    () => planOptions.filter((option) => option.account === accountPlanType),
    [accountPlanType]
  );
  const isCloudActive = isBillingSyncEnabled(syncAccess);

  useEffect(() => {
    setSelectedPlan(visiblePlans[0]?.plan ?? null);
  }, [visiblePlans]);

  async function handleCheckout() {
    if (!selectedPlan) {
      return;
    }

    try {
      setIsCheckingOut(true);
      setError(null);
      setCheckout(await createBillingCheckout(selectedPlan));
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Falha ao gerar Pix.');
    } finally {
      setIsCheckingOut(false);
    }
  }

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
            A nuvem protege seu histórico fora do aparelho e mantém o Meu Controle funcionando em dois modos:
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
            <ThemedText style={styles.paymentTitle}>Planos com Pix</ThemedText>
            <ThemedText style={styles.paymentText}>
              A conta principal fica cadastrada no SaaS mesmo sem plano ativo. Ao escolher um plano, o
              backend gera o Pix e libera a sincronização depois da confirmação do pagamento.
            </ThemedText>
          </View>
        </View>
        <View style={styles.statusCard}>
          <ThemedText style={styles.statusLabel}>Status</ThemedText>
          <ThemedText style={styles.statusValue}>
            {isCloudActive ? 'Sincronizando na nuvem' : isLoadingPlan ? 'Carregando...' : 'Nuvem não ativada'}
          </ThemedText>
        </View>
        <View style={styles.planList}>
          {visiblePlans.map((option) => {
            const isSelected = selectedPlan === option.plan;

            return (
              <Pressable
                key={option.plan}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                onPress={() => {
                  setSelectedPlan(option.plan);
                  setCheckout(null);
                  setError(null);
                }}
                style={[styles.planCard, isSelected ? styles.planCardSelected : null]}>
                <View style={styles.planHeader}>
                  <ThemedText style={styles.planTitle}>{option.title}</ThemedText>
                  <View style={styles.planBadges}>
                    <ThemedText style={[styles.planPrice, isSelected ? styles.planPriceSelected : null]}>
                      {getBillingPlanPriceLabel(option.plan)}
                    </ThemedText>
                    <ThemedText style={[styles.planCycle, isSelected ? styles.planCycleSelected : null]}>
                      {getBillingCycleLabel(option.plan.endsWith('_annual') ? 'annual' : 'monthly')}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.planDescription}>{option.description}</ThemedText>
              </Pressable>
            );
          })}
        </View>
        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
        <AuthButton
          label={isCheckingOut ? 'Gerando Pix...' : 'Gerar Pix'}
          disabled={isCheckingOut || !selectedPlan}
          onPress={handleCheckout}
        />
        {checkout ? (
          <View style={styles.checkoutCard}>
            <ThemedText style={styles.checkoutTitle}>
              {getBillingPlanLabel(checkout.plan)}: {formatAmount(checkout.amount)}
            </ThemedText>
            {checkout.qr_code_base64 ? (
              <Image
                source={{ uri: `data:image/png;base64,${checkout.qr_code_base64}` }}
                style={styles.qrImage}
              />
            ) : null}
            <ThemedText selectable style={styles.pixCode}>
              {checkout.qr_code}
            </ThemedText>
            <ThemedText style={styles.paymentHint}>
              Depois da aprovação do pagamento, o backend deve marcar a sincronização como ativa.
            </ThemedText>
          </View>
        ) : null}
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
  statusCard: {
    borderRadius: Radius.md,
    backgroundColor: '#F3F8F9',
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Space.md,
    gap: 4,
  },
  statusLabel: {
    color: Colors.light.textSoft,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusValue: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  planList: {
    gap: 10,
  },
  planCard: {
    borderRadius: Radius.md,
    backgroundColor: '#F7FAFB',
    borderWidth: 1,
    borderColor: '#D6E2E6',
    padding: Space.md,
    gap: 8,
  },
  planCardSelected: {
    backgroundColor: '#E9F7F4',
    borderColor: BrandPalette.primary,
  },
  planHeader: {
    gap: 8,
  },
  planTitle: {
    color: Colors.light.text,
    fontWeight: '800',
    lineHeight: 22,
  },
  planBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'flex-start',
  },
  planPrice: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    backgroundColor: '#F4E8C8',
    borderWidth: 1,
    borderColor: '#E8D49C',
    color: BrandPalette.navy,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planPriceSelected: {
    backgroundColor: Colors.light.surface,
    borderColor: '#B7DDD6',
    color: BrandPalette.primary,
  },
  planCycle: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: Colors.light.textSoft,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planCycleSelected: {
    color: BrandPalette.primary,
    borderColor: '#B7DDD6',
  },
  planDescription: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: Colors.light.danger,
    fontWeight: '700',
  },
  checkoutCard: {
    borderRadius: Radius.md,
    backgroundColor: '#F7FAFB',
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Space.md,
    gap: 12,
  },
  checkoutTitle: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  qrImage: {
    width: 180,
    height: 180,
    alignSelf: 'center',
    borderRadius: Radius.sm,
  },
  pixCode: {
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: Colors.light.text,
    fontSize: 12,
    lineHeight: 18,
    padding: 10,
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
