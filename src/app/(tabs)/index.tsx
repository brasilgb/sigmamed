import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { HistoryList } from '@/components/dashboard/history-list';
import { TrendCard } from '@/components/dashboard/trend-card';
import { ProfileAvatar } from '@/components/profile-avatar';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SectionHeader } from '@/components/ui/section-header';
import { Screen } from '@/components/ui/screen';
import { BrandPalette, Colors, ModulePalette, Radius, Space } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useBillingSyncAccess } from '@/hooks/use-billing-sync-access';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useProfileNames } from '@/hooks/use-profile-names';
import {
  getBillingCycleLabel,
  getBillingPlanLabel,
  isBillingSyncEnabled,
} from '@/services/billing.service';
import { sendFeedback } from '@/services/feedback.service';
import type { DashboardSummary } from '@/types/health';

const logoAzul = require('../../../assets/images/logo_azul.png');

const modules = [
  {
    key: 'pressure',
    title: 'Pressão',
    description: 'Leituras e último registro em um fluxo único.',
    route: '/(tabs)/pressure' as const,
    color: ModulePalette.pressure.base,
    icon: 'waveform.path.ecg' as const,
  },
  {
    key: 'glicose',
    title: 'Glicose',
    description: 'Contexto da medição e histórico rápido no mesmo módulo.',
    route: '/(tabs)/glicose' as const,
    color: ModulePalette.glicose.base,
    icon: 'drop.fill' as const,
  },
  {
    key: 'weight',
    title: 'Peso',
    description: 'Pesagens e IMC em um acompanhamento mais simples da rotina.',
    route: '/(tabs)/weight' as const,
    color: ModulePalette.weight.base,
    icon: 'scalemass.fill' as const,
  },
  {
    key: 'medications',
    title: 'Medicação',
    description: 'Tratamentos ativos, registro diário e ajustes no mesmo lugar.',
    route: '/(tabs)/medications' as const,
    color: ModulePalette.medication.base,
    icon: 'pills.fill' as const,
  },
];

const cloudBenefits = [
  'Backup automático dos registros',
  'Recuperação ao trocar de celular',
  'Sincronização quando a internet voltar',
  'Histórico protegido fora do aparelho',
  'Perfis da família no plano familiar',
];

const activeCloudBenefits = [
  'Backup e sincronização liberados',
  'Registros enviados quando houver internet',
  'Acesso mantido pela assinatura ativa',
];

function formatPressure(summary: DashboardSummary | null) {
  return summary?.latestPressure
    ? `${summary.latestPressure.systolic}/${summary.latestPressure.diastolic}`
    : '--';
}

function formatGlicose(summary: DashboardSummary | null) {
  return summary?.latestGlicose ? String(summary.latestGlicose.glicoseValue) : '--';
}

function formatWeight(summary: DashboardSummary | null) {
  return summary?.latestWeight ? summary.latestWeight.weight.toFixed(1).replace('.', ',') : '--';
}

export default function HomeTabScreen() {
  const { lock, logout, user } = useAuth();
  const { isLoading: isLoadingPlan, syncAccess } = useBillingSyncAccess({ enabled: Boolean(user) });
  const { history, isLoading, refresh, summary, trends } = useDashboardData(7);
  const {
    activeProfileId,
    activeProfileName,
    profiles,
    refreshProfileNames,
    selectActiveProfile,
  } = useProfileNames();
  const [isProfilePickerOpen, setIsProfilePickerOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const firstName = user?.name.split(' ')[0] ?? 'Paciente';
  const accountMeta = user?.age ? `${user.email} · ${user.age} anos` : user?.email;
  const canManageProfiles = user?.accountUsage !== 'personal';
  const selectableProfiles = useMemo(() => {
    if (!user || !canManageProfiles) {
      return [];
    }

    return profiles.filter((profile) => (profile.fullName ?? '').trim() !== user.name.trim());
  }, [canManageProfiles, profiles, user]);
  const selectedProfile = selectableProfiles.find((profile) => profile.id === activeProfileId) ?? null;
  const isCloudActive = isBillingSyncEnabled(syncAccess);
  const cloudPlanLabel = syncAccess?.plan ? getBillingPlanLabel(syncAccess.plan) : 'Plano na nuvem';
  const cloudPlanCycle = getBillingCycleLabel(syncAccess?.cycle ?? null);
  const shouldShowTrends = Boolean(trends && (!canManageProfiles || selectedProfile));
  const trendsHint = 'Últimos 7 dias';
  const canShowOverview = Boolean(summary);
  const overviewCards = [
    {
      title: 'Pressão arterial',
      value: formatPressure(summary),
      unit: 'mmHg',
      route: '/(tabs)/pressure' as const,
      color: ModulePalette.pressure.base,
      icon: 'waveform.path.ecg' as const,
    },
    {
      title: 'Glicose',
      value: formatGlicose(summary),
      unit: 'mg/dL',
      route: '/(tabs)/glicose' as const,
      color: ModulePalette.glicose.base,
      icon: 'drop.fill' as const,
    },
    {
      title: 'Peso',
      value: formatWeight(summary),
      unit: 'kg',
      route: '/(tabs)/weight' as const,
      color: ModulePalette.weight.base,
      icon: 'scalemass.fill' as const,
    },
    {
      title: 'Medicação',
      value: summary ? `${summary.adherenceToday}%` : '--',
      unit: `${summary?.activeMedications ?? 0} ativas`,
      route: '/(tabs)/medications' as const,
      color: ModulePalette.medication.base,
      icon: 'pills.fill' as const,
    },
  ];

  async function handleProfileSelect(profileId: number) {
    await selectActiveProfile(profileId);
    setIsProfilePickerOpen(false);
    await refresh();
  }

  async function handleOpenProfilePicker() {
    setIsProfilePickerOpen(true);
    await refreshProfileNames();
  }

  useEffect(() => {
    if (!canManageProfiles || activeProfileId || selectableProfiles.length === 0) {
      return;
    }

    const defaultProfile = selectableProfiles[0];

    if (!defaultProfile) {
      return;
    }

    void selectActiveProfile(defaultProfile.id);
  }, [activeProfileId, canManageProfiles, selectableProfiles, selectActiveProfile]);

  async function handleFeedbackSubmit() {
    const normalizedComment = feedbackText.trim();

    if (feedbackRating === 0 && normalizedComment.length === 0) {
      setFeedbackError('Informe uma nota ou escreva uma sugestão.');
      return;
    }

    try {
      setIsSendingFeedback(true);
      setFeedbackError(null);
      await sendFeedback({
        rating: feedbackRating > 0 ? feedbackRating : null,
        comment: normalizedComment.length > 0 ? normalizedComment : null,
        source: 'home',
      });
      setFeedbackSent(true);
      setFeedbackRating(0);
      setFeedbackText('');
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : 'Não foi possível enviar sua opinião agora.');
    } finally {
      setIsSendingFeedback(false);
    }
  }

  const profileSelectorCard = canManageProfiles ? (
    <Card style={styles.profilesCard}>
      <Pressable
        style={styles.profilesPressable}
        onPress={() => {
          void handleOpenProfilePicker();
        }}>
        <View style={styles.profilesCopy}>
          <View style={styles.profilesIconWrap}>
            <IconSymbol name="person.2.fill" size={22} color={BrandPalette.primary} />
          </View>
          <View style={styles.profilesTextWrap}>
            <ThemedText style={styles.profilesTitle}>
              {selectedProfile?.fullName ?? 'Filtrar por acompanhado'}
            </ThemedText>
            <ThemedText style={styles.profilesText}>
              {selectedProfile
                ? 'Toque aqui para selecionar outro nome e atualizar a visão geral e os gráficos.'
                : 'Toque aqui para escolher um nome e filtrar a visão geral e os gráficos.'}
            </ThemedText>
          </View>
        </View>
        <IconSymbol name="chevron.right" size={24} color={Colors.light.textSoft} />
      </Pressable>
      <View style={styles.profilesFooter}>
        <Pressable style={styles.manageProfilesButton} onPress={() => router.push('/profiles' as never)}>
          <ThemedText style={styles.manageProfilesText}>Gerenciar acompanhados</ThemedText>
        </Pressable>
      </View>
    </Card>
  ) : null;

  return (
    <Screen
      isRefreshing={isLoading}
      onRefresh={async () => {
        await Promise.all([refresh(), refreshProfileNames()]);
      }}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroActionsRow}>
            <View style={styles.heroActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Abrir nuvem"
                style={styles.iconButton}
                onPress={() => router.push('/cloud-sync' as never)}>
                <IconSymbol name="cloud.fill" size={18} color={BrandPalette.white} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Abrir ajuda"
                style={styles.iconButton}
                onPress={() => router.push('/help' as never)}>
                <IconSymbol name="questionmark.circle.fill" size={19} color={BrandPalette.white} />
              </Pressable>
              {canManageProfiles ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Abrir acompanhados"
                  style={styles.iconButton}
                  onPress={() => router.push('/profiles' as never)}>
                  <IconSymbol name="person.2.fill" size={19} color={BrandPalette.white} />
                </Pressable>
              ) : null}
              <Pressable style={styles.iconButton} onPress={() => router.push('/settings')}>
                <IconSymbol name="gearshape.fill" size={18} color={BrandPalette.white} />
              </Pressable>
              <Pressable style={styles.iconButton} onPress={lock}>
                <IconSymbol name="lock.fill" size={18} color={BrandPalette.white} />
              </Pressable>
              <Pressable style={styles.iconButton} onPress={() => void logout()}>
                <IconSymbol name="rectangle.portrait.and.arrow.right.fill" size={18} color={BrandPalette.white} />
              </Pressable>
            </View>
          </View>
          <View style={styles.brandBlock}>
            <Image source={logoAzul} style={styles.brandLogo} resizeMode="contain" />
            <View style={styles.brandTextBlock}>
              <ThemedText style={styles.brandBadgeText}>Meu Controle</ThemedText>
              <ThemedText style={styles.brandTagline}>Sua saúde em dia</ThemedText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isCloudActive ? 'Nuvem ativa, abrir detalhes' : 'Nuvem inativa, abrir planos'}
              style={[styles.cloudStatusBadge, isCloudActive ? styles.cloudStatusBadgeActive : null]}
              onPress={() => router.push('/cloud-sync' as never)}>
              <IconSymbol
                name={isCloudActive ? 'checkmark.circle.fill' : 'cloud.fill'}
                size={16}
                color={isCloudActive ? BrandPalette.wellness : '#D9E7F7'}
              />
              <ThemedText style={[styles.cloudStatusText, isCloudActive ? styles.cloudStatusTextActive : null]}>
                {isCloudActive ? 'Nuvem ativa' : 'Nuvem inativa'}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.heroCopy}>
          <ThemedText style={styles.heroGreeting}>
            Olá, {firstName}.
          </ThemedText>
          <ThemedText style={styles.heroDescription}>
            Que bom te ver por aqui. Acompanhe seus registros e cuide de quem importa.
          </ThemedText>
        </View>

        {user ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir configurações do perfil"
            style={styles.accountCard}
            onPress={() => router.push('/settings')}>
            <ProfileAvatar name={user.name} photoUri={user.photoUri} size={58} />
            <View style={styles.accountCopy}>
              <ThemedText style={styles.accountTitle}>{user.name}</ThemedText>
              <ThemedText style={styles.accountMeta}>{accountMeta}</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={22} color="#BCD1E8" />
          </Pressable>
        ) : null}
      </View>

      {profileSelectorCard ? (
        <View style={styles.section}>
          <SectionHeader title="Acompanhado" hint="Filtro ativo" />
          {profileSelectorCard}
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Visão geral" hint="Hoje" />
        {canShowOverview ? (
          <View style={styles.overviewGrid}>
            {overviewCards.map((item) => (
              <Pressable
                key={item.title}
                style={styles.overviewCard}
                onPress={() => router.push(item.route)}>
                <View style={[styles.overviewIcon, { backgroundColor: `${item.color}16` }]}>
                  <IconSymbol name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.overviewCopy}>
                  <ThemedText style={styles.overviewTitle}>{item.title}</ThemedText>
                  <ThemedText style={styles.overviewValue}>{item.value}</ThemedText>
                  <ThemedText style={styles.overviewUnit}>{item.unit}</ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Registros" hint="Acesso rápido" />
        <View style={styles.moduleGrid}>
          {modules.map((module) => (
            <Card key={module.key} style={styles.moduleCard}>
              <Pressable style={styles.moduleCardPressable} onPress={() => router.push(module.route)}>
                <View style={styles.moduleHeader}>
                  <View style={[styles.moduleIcon, { backgroundColor: `${module.color}18` }]}>
                    <IconSymbol name={module.icon} size={20} color={module.color} />
                  </View>
                  <ThemedText style={styles.moduleTitle}>{module.title}</ThemedText>
                </View>
                <ThemedText style={styles.moduleText}>{module.description}</ThemedText>
              </Pressable>
            </Card>
          ))}
        </View>
      </View>

      <Card style={styles.reportCard}>
        <Pressable style={styles.reportPressable} onPress={() => router.push('/report')}>
          <View style={styles.reportCopy}>
            <View style={styles.reportIconWrap}>
              <IconSymbol name="list.bullet.rectangle.fill" size={20} color={BrandPalette.navy} />
            </View>
            <View style={styles.reportTextWrap}>
              <ThemedText style={styles.reportTitle}>Relatório do período</ThemedText>
              <ThemedText style={styles.reportText}>
                Organize leituras, tendências e medicações em um resumo pronto para compartilhar.
              </ThemedText>
            </View>
          </View>
          <View style={styles.reportAction}>
            <ThemedText style={styles.reportActionText}>Abrir relatório</ThemedText>
          </View>
        </Pressable>
      </Card>

      {canManageProfiles || shouldShowTrends ? (
        <View style={styles.section}>
          <SectionHeader title="Resumo e tendências" hint={trendsHint} />

          {canManageProfiles && !selectedProfile ? (
            <Card style={styles.emptyTrendCard}>
              <View style={styles.emptyTrendIcon}>
                <IconSymbol name="chart.line.uptrend.xyaxis" size={22} color={BrandPalette.primary} />
              </View>
              <View style={styles.emptyTrendCopy}>
                <ThemedText style={styles.emptyTrendTitle}>Tendências por acompanhado</ThemedText>
                <ThemedText style={styles.emptyTrendText}>
                  Selecione um acompanhado para ver os gráficos do histórico individual.
                </ThemedText>
              </View>
            </Card>
          ) : null}

          {shouldShowTrends && trends ? (
            <>
              <TrendCard metric={trends.pressure} onPress={() => router.push('/(tabs)/pressure')} actionLabel="Abrir módulo" />
              <TrendCard metric={trends.glicose} onPress={() => router.push('/(tabs)/glicose')} actionLabel="Abrir módulo" />
              <TrendCard metric={trends.weight} onPress={() => router.push('/(tabs)/weight')} actionLabel="Abrir módulo" />
            </>
          ) : null}
        </View>
      ) : null}

      <Card style={styles.cloudCard}>
        <Pressable style={styles.cloudPressable} onPress={() => router.push('/cloud-sync' as never)}>
          <View style={styles.cloudHeader}>
            <View style={styles.cloudIconWrap}>
              <IconSymbol
                name={isCloudActive ? 'checkmark.circle.fill' : 'cloud.fill'}
                size={24}
                color={BrandPalette.wellness}
              />
            </View>
            <View style={styles.cloudTextWrap}>
              <View style={styles.cloudTitleRow}>
                <ThemedText style={styles.cloudEyebrow}>
                  {isCloudActive ? 'Plano na nuvem ativo' : 'Assine o Premium Nuvem'}
                </ThemedText>
                {isCloudActive ? (
                  <View style={styles.cloudActiveBadge}>
                    <ThemedText style={styles.cloudActiveBadgeText}>Ativo</ThemedText>
                  </View>
                ) : null}
              </View>
              <ThemedText style={styles.cloudTitle}>
                {isCloudActive
                  ? `${cloudPlanLabel}${cloudPlanCycle ? ` - ${cloudPlanCycle}` : ''}`
                  : isLoadingPlan
                    ? 'Verificando status do plano...'
                    : 'Backup, recuperação e sincronização dos seus registros de saúde.'}
              </ThemedText>
            </View>
          </View>
          {isCloudActive ? (
            <View style={styles.cloudActiveSummary}>
              <ThemedText style={styles.cloudActiveSummaryTitle}>Sua sincronização está liberada.</ThemedText>
              <ThemedText style={styles.cloudActiveSummaryText}>
                Você pode continuar usando o app offline; os registros são sincronizados com a nuvem quando a conexão estiver disponível.
              </ThemedText>
            </View>
          ) : null}
          <View style={styles.cloudBenefits}>
            {(isCloudActive ? activeCloudBenefits : cloudBenefits).map((benefit) => (
              <View key={benefit} style={styles.cloudBenefitRow}>
                <IconSymbol name="checkmark.circle.fill" size={18} color={BrandPalette.wellness} />
                <ThemedText style={styles.cloudBenefitText}>{benefit}</ThemedText>
              </View>
            ))}
          </View>
          <View style={styles.cloudFooter}>
            <View style={styles.cloudFooterCopy}>
              <ThemedText style={styles.cloudText}>
                {isCloudActive
                  ? 'Ver detalhes do plano e como a sincronização funciona.'
                  : 'Escolha um plano, gere Pix e libere a nuvem para sua conta.'}
              </ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={24} color={BrandPalette.white} />
          </View>
        </Pressable>
      </Card>

      <Card style={styles.feedbackCard}>
        <Pressable
          accessibilityRole="button"
          style={styles.feedbackPressable}
          onPress={() => {
            setFeedbackSent(false);
            setFeedbackError(null);
            setIsFeedbackOpen(true);
          }}>
          <View style={styles.feedbackCopy}>
            <View style={styles.feedbackIconWrap}>
              <IconSymbol name="star.fill" size={22} color={BrandPalette.primary} />
            </View>
            <View style={styles.feedbackTextWrap}>
              <ThemedText style={styles.feedbackTitle}>Ajude a melhorar o Meu Controle</ThemedText>
              <ThemedText style={styles.feedbackText}>
                Envie uma nota, comentário ou sugestão para os próximos ajustes.
              </ThemedText>
            </View>
          </View>
          <IconSymbol name="chevron.right" size={24} color={Colors.light.textSoft} />
        </Pressable>
      </Card>

      {history.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Atividade recente" hint="Ultimos registros" />
          <HistoryList items={history.slice(0, 6)} profileName={activeProfileName} />
        </View>
      ) : null}

      <Modal
        transparent
        visible={isProfilePickerOpen}
        animationType="fade"
        onRequestClose={() => setIsProfilePickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Selecionar acompanhado</ThemedText>
              <Pressable onPress={() => setIsProfilePickerOpen(false)} style={styles.modalCloseButton}>
                <ThemedText style={styles.modalCloseText}>Fechar</ThemedText>
              </Pressable>
            </View>
            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {selectableProfiles.map((profile) => {
                const isSelected = activeProfileId === profile.id;

                return (
                  <Pressable
                    key={profile.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    onPress={() => {
                      void handleProfileSelect(profile.id);
                    }}
                    style={[styles.profileOption, isSelected ? styles.profileOptionSelected : null]}>
                    <View style={[styles.profileRadio, isSelected ? styles.profileRadioSelected : null]} />
                    <View style={styles.profileOptionCopy}>
                      <ThemedText style={styles.profileOptionTitle}>{profile.fullName ?? 'Sem nome'}</ThemedText>
                      <ThemedText style={styles.profileOptionMeta}>
                        {[
                          profile.age ? `${profile.age} anos` : null,
                          profile.sex,
                          profile.height ? `${profile.height} cm` : null,
                        ].filter(Boolean).join(' · ') || 'Dados básicos'}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
              {selectableProfiles.length === 0 ? (
                <View style={styles.profileOptionEmpty}>
                  <ThemedText style={styles.profileOptionEmptyText}>
                    Cadastre um acompanhado para visualizar dados separados.
                  </ThemedText>
                </View>
              ) : null}
            </ScrollView>
            <Pressable style={styles.modalManageButton} onPress={() => router.push('/profiles' as never)}>
              <ThemedText style={styles.modalManageText}>Gerenciar acompanhados</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={isFeedbackOpen}
        animationType="fade"
        onRequestClose={() => setIsFeedbackOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Sua opinião</ThemedText>
              <Pressable onPress={() => setIsFeedbackOpen(false)} style={styles.modalCloseButton}>
                <ThemedText style={styles.modalCloseText}>Fechar</ThemedText>
              </Pressable>
            </View>

            {feedbackSent ? (
              <View style={styles.feedbackThanks}>
                <View style={styles.feedbackThanksIcon}>
                  <IconSymbol name="star.fill" size={26} color={BrandPalette.primary} />
                </View>
                <ThemedText style={styles.feedbackThanksTitle}>Obrigado pela ajuda</ThemedText>
                <ThemedText style={styles.feedbackThanksText}>
                  Sua sugestão ajuda a priorizar os próximos ajustes do Meu Controle.
                </ThemedText>
              </View>
            ) : (
              <>
                <View style={styles.ratingBlock}>
                  <ThemedText style={styles.ratingLabel}>Nota</ThemedText>
                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((value) => {
                      const isSelected = feedbackRating >= value;

                      return (
                        <Pressable
                          key={value}
                          accessibilityRole="button"
                          accessibilityLabel={`${value} estrela${value > 1 ? 's' : ''}`}
                          onPress={() => setFeedbackRating(value)}
                          style={styles.starButton}>
                          <IconSymbol
                            name={isSelected ? 'star.fill' : 'star'}
                            size={32}
                            color={isSelected ? '#D79A14' : Colors.light.textSoft}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.feedbackInputBlock}>
                  <ThemedText style={styles.ratingLabel}>Comentário ou sugestão</ThemedText>
                  <TextInput
                    editable={!isSendingFeedback}
                    multiline
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                    placeholder="Conte o que pode melhorar ou o que você gostaria de ver no app."
                    placeholderTextColor={Colors.light.textSoft}
                    textAlignVertical="top"
                    style={styles.feedbackInput}
                  />
                </View>

                {feedbackError ? <ThemedText style={styles.feedbackErrorText}>{feedbackError}</ThemedText> : null}

                <Pressable
                  accessibilityRole="button"
                  disabled={isSendingFeedback || (feedbackRating === 0 && feedbackText.trim().length === 0)}
                  style={[
                    styles.feedbackSubmitButton,
                    isSendingFeedback || (feedbackRating === 0 && feedbackText.trim().length === 0)
                      ? styles.feedbackSubmitDisabled
                      : null,
                  ]}
                  onPress={() => {
                    void handleFeedbackSubmit();
                  }}>
                  <ThemedText style={styles.feedbackSubmitText}>
                    {isSendingFeedback ? 'Enviando...' : 'Enviar opinião'}
                  </ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.xl,
    backgroundColor: BrandPalette.deepNavy,
    padding: Space.lg,
    gap: 16,
    borderWidth: 1,
    borderColor: '#103A73',
  },
  heroTop: {
    gap: 12,
    alignItems: 'stretch',
  },
  heroActionsRow: {
    alignItems: 'flex-end',
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  brandLogo: {
    width: 46,
    height: 46,
    borderRadius: 14,
  },
  brandTextBlock: {
    flex: 1,
    gap: 2,
  },
  brandBadgeText: {
    color: BrandPalette.white,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  brandTagline: {
    color: BrandPalette.wellness,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  cloudStatusBadge: {
    minHeight: 34,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cloudStatusBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: 'rgba(16, 185, 129, 0.42)',
  },
  cloudStatusText: {
    color: '#D9E7F7',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  cloudStatusTextActive: {
    color: BrandPalette.wellness,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    gap: 8,
  },
  heroGreeting: {
    color: BrandPalette.white,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  heroDescription: {
    color: '#D4E4F6',
    lineHeight: 22,
  },
  accountCard: {
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  accountCopy: {
    flex: 1,
    gap: 2,
  },
  accountTitle: {
    color: BrandPalette.white,
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 22,
  },
  accountMeta: {
    color: '#BCD1E8',
    fontSize: 14,
    lineHeight: 20,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewCard: {
    width: '48%',
    minHeight: 118,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: '#E6ECF3',
    padding: Space.md,
    gap: 10,
    shadowColor: BrandPalette.navy,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 2,
  },
  overviewIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewCopy: {
    gap: 2,
  },
  overviewTitle: {
    color: Colors.light.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  overviewValue: {
    color: Colors.light.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  overviewUnit: {
    color: Colors.light.textSoft,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  profilesCard: {
    padding: 0,
    backgroundColor: '#F0F8F6',
    borderColor: '#9FD8CC',
  },
  profilesPressable: {
    padding: Space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilesCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profilesIconWrap: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: '#CFEDE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilesTextWrap: {
    flex: 1,
    gap: 4,
  },
  profilesTitle: {
    color: BrandPalette.deepNavy,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
  },
  profilesText: {
    color: '#3F6670',
    lineHeight: 20,
    fontWeight: '600',
  },
  profilesFooter: {
    borderTopWidth: 1,
    borderTopColor: '#CFE5DF',
    paddingHorizontal: Space.lg,
    paddingTop: Space.md,
    paddingBottom: Space.md,
  },
  manageProfilesButton: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    backgroundColor: '#EAF7F4',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  manageProfilesText: {
    color: BrandPalette.primary,
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 18,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moduleCard: {
    width: '48%',
    padding: 0,
  },
  moduleCardPressable: {
    minHeight: 124,
    padding: Space.md,
    gap: 10,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moduleIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle: {
    flex: 1,
    color: Colors.light.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  moduleText: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  reportCard: {
    padding: 0,
    backgroundColor: '#F5FAFF',
    borderColor: '#DCE8FF',
  },
  reportPressable: {
    padding: Space.md,
    gap: 14,
  },
  reportCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  reportIconWrap: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTextWrap: {
    flex: 1,
    gap: 4,
  },
  reportTitle: {
    color: Colors.light.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  reportText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
  },
  reportAction: {
    minHeight: 46,
    borderRadius: Radius.md,
    backgroundColor: BrandPalette.navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  reportActionText: {
    color: BrandPalette.white,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cloudCard: {
    padding: 0,
    backgroundColor: BrandPalette.deepNavy,
    borderColor: '#123A6B',
  },
  cloudPressable: {
    padding: Space.md,
    gap: 14,
  },
  cloudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cloudIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudTextWrap: {
    flex: 1,
    gap: 4,
  },
  cloudTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  cloudEyebrow: {
    color: BrandPalette.white,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
  },
  cloudActiveBadge: {
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.42)',
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  cloudActiveBadgeText: {
    color: BrandPalette.wellness,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  cloudTitle: {
    color: '#D9E7F7',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  cloudText: {
    color: '#AFC4DB',
    lineHeight: 20,
  },
  cloudBenefits: {
    gap: 8,
  },
  cloudActiveSummary: {
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    padding: 12,
    gap: 4,
  },
  cloudActiveSummaryTitle: {
    color: BrandPalette.white,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
  },
  cloudActiveSummaryText: {
    color: '#D9E7F7',
    lineHeight: 20,
  },
  cloudBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cloudBenefitText: {
    color: BrandPalette.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  cloudFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cloudFooterCopy: {
    flex: 1,
  },
  feedbackCard: {
    padding: 0,
    backgroundColor: Colors.light.surface,
    borderColor: '#E7D7A8',
  },
  feedbackPressable: {
    padding: Space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedbackCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  feedbackIconWrap: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: '#F8EBC6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTextWrap: {
    flex: 1,
    gap: 4,
  },
  feedbackTitle: {
    color: Colors.light.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  feedbackText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
  },
  section: {
    gap: 14,
  },
  emptyTrendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.light.surface,
    borderColor: '#DDEBED',
  },
  emptyTrendIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: '#DDF1EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTrendCopy: {
    flex: 1,
    gap: 4,
  },
  emptyTrendTitle: {
    color: Colors.light.text,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },
  emptyTrendText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 29, 36, 0.42)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    maxHeight: '78%',
    borderRadius: Radius.xl,
    backgroundColor: Colors.light.surface,
    padding: Space.lg,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitle: {
    flex: 1,
    color: Colors.light.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  modalCloseButton: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCloseText: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  modalList: {
    maxHeight: 420,
  },
  modalListContent: {
    gap: 10,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surfaceMuted,
    padding: Space.md,
  },
  profileOptionSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: '#EAF7F4',
  },
  profileRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  profileRadioSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tint,
  },
  profileOptionCopy: {
    flex: 1,
    gap: 2,
  },
  profileOptionTitle: {
    color: Colors.light.text,
    fontWeight: '800',
    lineHeight: 22,
  },
  profileOptionMeta: {
    color: Colors.light.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  profileOptionEmpty: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surfaceMuted,
    padding: Space.lg,
  },
  profileOptionEmptyText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
  modalManageButton: {
    minHeight: 50,
    borderRadius: Radius.lg,
    backgroundColor: BrandPalette.deepNavy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalManageText: {
    color: BrandPalette.white,
    fontWeight: '800',
  },
  ratingBlock: {
    gap: 10,
  },
  ratingLabel: {
    color: Colors.light.text,
    fontWeight: '800',
    lineHeight: 20,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackInputBlock: {
    gap: 10,
  },
  feedbackInput: {
    minHeight: 120,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surfaceMuted,
    color: Colors.light.text,
    fontSize: 15,
    lineHeight: 21,
    padding: 14,
  },
  feedbackErrorText: {
    color: Colors.light.danger,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  feedbackSubmitButton: {
    minHeight: 52,
    borderRadius: Radius.lg,
    backgroundColor: BrandPalette.navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  feedbackSubmitDisabled: {
    opacity: 0.5,
  },
  feedbackSubmitText: {
    color: BrandPalette.white,
    fontWeight: '800',
  },
  feedbackThanks: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: Space.lg,
  },
  feedbackThanksIcon: {
    width: 58,
    height: 58,
    borderRadius: Radius.lg,
    backgroundColor: '#F8EBC6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackThanksTitle: {
    color: Colors.light.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  feedbackThanksText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
});
