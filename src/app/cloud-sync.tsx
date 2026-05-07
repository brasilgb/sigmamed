import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

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
import { formatDate } from '@/utils/date';

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
  const {
    isLoading: isLoadingPlan,
    refreshSyncAccess,
    syncAccess,
  } = useBillingSyncAccess({ enabled: Boolean(user) });
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [checkout, setCheckout] = useState<BillingCheckout | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [didCopyPixCode, setDidCopyPixCode] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  const accountPlanType = user?.accountUsage === 'personal' ? 'personal' : 'family';
  const visiblePlans = useMemo(
    () => planOptions.filter((option) => option.account === accountPlanType),
    [accountPlanType]
  );
  const isCloudActive = isBillingSyncEnabled(syncAccess);
  const activePlanLabel = syncAccess?.plan ? getBillingPlanLabel(syncAccess.plan) : 'Plano na nuvem';
  const activeCycleLabel = getBillingCycleLabel(syncAccess?.cycle ?? null);
  const activePlanSummary = `${activePlanLabel}${activeCycleLabel ? ` - ${activeCycleLabel}` : ''}`;
  const activePlanExpiresAt = syncAccess?.expires_at ? formatDate(syncAccess.expires_at) : null;
  const isCheckoutUnavailable = checkout
    ? ['expired', 'rejected', 'cancelled', 'canceled', 'inactive'].includes(checkout.status)
    : false;

  useEffect(() => {
    setSelectedPlan(visiblePlans[0]?.plan ?? null);
  }, [visiblePlans]);

  const verifyPaymentStatus = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) {
      setIsVerifyingPayment(true);
    }

    const access = await refreshSyncAccess();

    if (isBillingSyncEnabled(access)) {
      setIsPaymentConfirmed(true);
    }

    if (!options.silent) {
      setIsVerifyingPayment(false);
    }
  }, [refreshSyncAccess]);

  useEffect(() => {
    if (!checkout || isCheckoutUnavailable || !isCheckoutModalOpen || isPaymentConfirmed) {
      return;
    }

    const intervalId = setInterval(() => {
      void verifyPaymentStatus({ silent: true });
    }, 6000);

    return () => {
      clearInterval(intervalId);
    };
  }, [checkout, isCheckoutUnavailable, isCheckoutModalOpen, isPaymentConfirmed, verifyPaymentStatus]);

  async function handleCheckout() {
    if (!selectedPlan) {
      return;
    }

    try {
      setIsCheckingOut(true);
      setError(null);
      const nextCheckout = await createBillingCheckout(selectedPlan);
      setCheckout(nextCheckout);
      setDidCopyPixCode(false);
      setIsPaymentConfirmed(isBillingSyncEnabled(syncAccess) || nextCheckout.status === 'approved' || nextCheckout.status === 'active');
      setIsCheckoutModalOpen(true);
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
            <ThemedText style={styles.paymentTitle}>
              {isCloudActive ? 'Plano ativo' : 'Planos com Pix'}
            </ThemedText>
            <ThemedText style={styles.paymentText}>
              {isCloudActive
                ? 'Sua conta já está com backup e sincronização liberados. A cobrança só aparece novamente quando o plano vencer.'
                : 'A conta principal fica cadastrada no SaaS mesmo sem plano ativo. Ao escolher um plano, o backend gera o Pix e libera a sincronização depois da confirmação do pagamento.'}
            </ThemedText>
          </View>
        </View>
        <View style={styles.statusCard}>
          <ThemedText style={styles.statusLabel}>Status</ThemedText>
          <ThemedText style={styles.statusValue}>
            {isCloudActive ? 'Sincronizando na nuvem' : isLoadingPlan ? 'Carregando...' : 'Nuvem não ativada'}
          </ThemedText>
          {isCloudActive ? (
            <>
              <ThemedText style={styles.statusDetail}>{activePlanSummary}</ThemedText>
              <ThemedText style={styles.statusDetail}>
                {activePlanExpiresAt ? `Válido até ${activePlanExpiresAt}` : 'Plano ativo sem data de vencimento informada.'}
              </ThemedText>
            </>
          ) : null}
        </View>
        {!isCloudActive ? (
          <>
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
                      setIsCheckoutModalOpen(false);
                      setDidCopyPixCode(false);
                      setIsPaymentConfirmed(false);
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
              label={isCheckingOut ? 'Gerando Pix...' : checkout && !isCheckoutUnavailable ? 'Ver Pix gerado' : 'Gerar Pix'}
              disabled={isCheckingOut || !selectedPlan}
              onPress={() => {
                if (checkout && !isCheckoutUnavailable) {
                  setIsCheckoutModalOpen(true);
                  return;
                }

                void handleCheckout();
              }}
            />
          </>
        ) : null}
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={Boolean(checkout && isCheckoutModalOpen)}
        onRequestClose={() => setIsCheckoutModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.pixModalCard}>
            <View style={styles.pixModalHeader}>
              <View>
                <ThemedText style={styles.checkoutTitle}>
                  {checkout ? getBillingPlanLabel(checkout.plan) : 'Pix'}
                </ThemedText>
                <ThemedText style={styles.checkoutAmount}>
                  {checkout ? formatAmount(checkout.amount) : ''}
                </ThemedText>
              </View>
              <Pressable style={styles.modalCloseButton} onPress={() => setIsCheckoutModalOpen(false)}>
                <ThemedText style={styles.modalCloseText}>Fechar</ThemedText>
              </Pressable>
            </View>

            {checkout ? (
              <ScrollView contentContainerStyle={styles.pixModalContent} showsVerticalScrollIndicator={false}>
                {isPaymentConfirmed ? (
                  <View style={styles.paymentConfirmedCard}>
                    <View style={styles.paymentConfirmedIcon}>
                      <IconSymbol name="checkmark.circle.fill" size={34} color={BrandPalette.wellness} />
                    </View>
                    <ThemedText style={styles.paymentConfirmedTitle}>Pagamento confirmado</ThemedText>
                    <ThemedText style={styles.paymentConfirmedText}>
                      Sua sincronização foi liberada. Os registros pendentes serão enviados para a nuvem quando houver internet.
                    </ThemedText>
                    <AuthButton label="Entendi" onPress={() => setIsCheckoutModalOpen(false)} />
                  </View>
                ) : isCheckoutUnavailable ? (
                  <View style={styles.paymentConfirmedCard}>
                    <View style={styles.paymentExpiredIcon}>
                      <IconSymbol name="qrcode" size={32} color={Colors.light.warning} />
                    </View>
                    <ThemedText style={styles.paymentConfirmedTitle}>
                      {checkout.status === 'expired' ? 'Pix expirado' : 'Pix indisponível'}
                    </ThemedText>
                    <ThemedText style={styles.paymentConfirmedText}>
                      Este código Pix não está disponível para pagamento. Gere um novo Pix para liberar a sincronização.
                    </ThemedText>
                    {checkout.raw_status ? (
                      <ThemedText style={styles.paymentRawStatus}>Status do provedor: {checkout.raw_status}</ThemedText>
                    ) : null}
                    <AuthButton
                      label={isCheckingOut ? 'Gerando...' : 'Gerar novo Pix'}
                      disabled={isCheckingOut}
                      onPress={() => {
                        void handleCheckout();
                      }}
                    />
                  </View>
                ) : (
                  <>
                    {checkout.qr_code_base64 ? (
                      <Image
                        source={{ uri: `data:image/png;base64,${checkout.qr_code_base64}` }}
                        style={styles.qrImage}
                      />
                    ) : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Copiar código Pix"
                      style={styles.pixCodeButton}
                      onPress={() => {
                        void Clipboard.setStringAsync(checkout.qr_code).then(() => setDidCopyPixCode(true));
                      }}>
                      <ThemedText selectable style={styles.pixCode}>
                        {checkout.qr_code}
                      </ThemedText>
                    </Pressable>
                    <ThemedText style={styles.copyHint}>
                      {didCopyPixCode ? 'Código Pix copiado.' : 'Toque no código para copiar.'}
                    </ThemedText>
                    <AuthButton
                      label={isVerifyingPayment ? 'Verificando...' : 'Já paguei, verificar status'}
                      disabled={isVerifyingPayment}
                      onPress={() => {
                        void verifyPaymentStatus();
                      }}
                    />
                    <ThemedText style={styles.paymentHint}>
                      Após a aprovação do Mercado Pago, a nuvem é liberada automaticamente.
                    </ThemedText>
                  </>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
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
  statusDetail: {
    color: Colors.light.textMuted,
    lineHeight: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 27, 58, 0.58)',
    justifyContent: 'center',
    padding: 20,
  },
  pixModalCard: {
    maxHeight: '86%',
    borderRadius: Radius.xl,
    backgroundColor: Colors.light.surface,
    padding: Space.lg,
    gap: 16,
  },
  pixModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  pixModalContent: {
    gap: 14,
    paddingBottom: 4,
  },
  checkoutTitle: {
    color: Colors.light.text,
    fontWeight: '800',
    fontSize: 18,
    lineHeight: 24,
  },
  checkoutAmount: {
    color: BrandPalette.primary,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  modalCloseButton: {
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCloseText: {
    color: Colors.light.text,
    fontWeight: '800',
    fontSize: 13,
  },
  qrImage: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    borderRadius: Radius.sm,
  },
  pixCodeButton: {
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pixCode: {
    color: Colors.light.text,
    fontSize: 12,
    lineHeight: 18,
    padding: 10,
  },
  copyHint: {
    color: BrandPalette.primary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  paymentConfirmedCard: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  paymentConfirmedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F6EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentExpiredIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF7E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentConfirmedTitle: {
    color: Colors.light.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  paymentConfirmedText: {
    color: Colors.light.textMuted,
    lineHeight: 21,
    textAlign: 'center',
  },
  paymentRawStatus: {
    color: Colors.light.textSoft,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'center',
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
