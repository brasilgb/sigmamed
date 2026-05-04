import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { AuthButton } from '@/components/auth/auth-button';
import { RecordInput } from '@/components/forms/record-input';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { BrandPalette, Colors, ModulePalette } from '@/constants/theme';
import {
  isManagedProfilePhotoUri,
  persistProfilePhoto,
  removeManagedProfilePhoto,
} from '@/features/auth/services/profile-photo.service';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  getActiveAccountProfile,
  updateActiveAccountProfile,
} from '@/features/auth/services/auth.service';
import { useBillingSyncAccess } from '@/hooks/use-billing-sync-access';
import {
  getBillingCycleLabel,
  getBillingPlanLabel,
  isBillingSyncEnabled,
} from '@/services/billing.service';

const sexOptions = [
  { label: 'Feminino', value: 'Feminino' },
  { label: 'Masculino', value: 'Masculino' },
  { label: 'Outro', value: 'Outro' },
];

function formatDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function parseOptionalNumber(value: string) {
  const normalized = value.replace(',', '.').trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export default function SettingsScreen() {
  const {
    biometricAvailable,
    deleteAccount,
    lock,
    logout,
    updateAccount,
    updateBiometric,
    user,
  } = useAuth();
  const emailRef = useRef<TextInput>(null);
  const profileHeightRef = useRef<TextInput>(null);
  const currentPasswordRef = useRef<TextInput>(null);
  const newPasswordRef = useRef<TextInput>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [activeProfileName, setActiveProfileName] = useState('');
  const [profileHeight, setProfileHeight] = useState('');
  const [profileSex, setProfileSex] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { isLoading: isLoadingPlan, syncAccess } = useBillingSyncAccess({ enabled: Boolean(user) });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name);
    setEmail(user.email);
    setPhotoUri(user.photoUri);
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfileData() {
      if (!user) {
        return;
      }

      const profile = await getActiveAccountProfile();

      if (!isMounted) {
        return;
      }

      setActiveProfileName(profile?.fullName ?? user.name);
      setProfileHeight(profile?.height ? String(profile.height) : '');
      setProfileSex(profile?.sex ?? '');
    }

    void loadProfileData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'MC';
  const planCycle = getBillingCycleLabel(syncAccess?.cycle ?? null);
  const planExpiresAt = formatDate(syncAccess?.expires_at);
  const isCloudActive = isBillingSyncEnabled(syncAccess);
  const planStatusText = isCloudActive
    ? `${syncAccess?.plan ? getBillingPlanLabel(syncAccess.plan) : 'Nuvem ativa'}${planCycle ? ` - ${planCycle}` : ''}`
    : isLoadingPlan
      ? 'Carregando plano...'
      : 'Nuvem não ativada';
  const planBadgeText = isCloudActive
    ? syncAccess?.plan?.startsWith('family')
      ? 'Familiar/Cuidador'
      : 'Pessoal'
    : 'Inativo';
  const planSummaryText = isCloudActive
    ? planExpiresAt
      ? `Vigente até ${planExpiresAt}.`
      : 'Backup e sincronização estão liberados para esta conta.'
    : 'Seus dados ainda não estão sincronizados na nuvem. Escolha um plano para liberar backup e sincronização.';
  const showPersonalProfileCard = user?.accountUsage === 'personal';

  async function handleTakePhoto() {
    if (!user) {
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError('Permita o uso da camera para atualizar a foto de perfil.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const nextUri = result.assets[0]?.uri;

      if (!nextUri) {
        return;
      }

      const persistedUri = await persistProfilePhoto(nextUri, user.id);

      if (isManagedProfilePhotoUri(photoUri)) {
        await removeManagedProfilePhoto(photoUri);
      }

      setPhotoUri(persistedUri);
      setError(null);
    }
  }

  async function handleChooseFromLibrary() {
    if (!user) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError('Permita acesso a galeria para escolher a foto de perfil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const nextUri = result.assets[0]?.uri;

      if (!nextUri) {
        return;
      }

      const persistedUri = await persistProfilePhoto(nextUri, user.id);

      if (isManagedProfilePhotoUri(photoUri)) {
        await removeManagedProfilePhoto(photoUri);
      }

      setPhotoUri(persistedUri);
      setError(null);
    }
  }

  async function handleSave() {
    if (!user) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      const numericHeight = parseOptionalNumber(profileHeight);

      if (Number.isNaN(numericHeight)) {
        throw new Error('Informe uma altura válida em centímetros.');
      }

      await updateAccount({
        name,
        email,
        photoUri,
        currentPassword,
        newPassword,
      });
      await updateActiveAccountProfile({
        sex: profileSex || null,
        height: numericHeight,
      });

      setCurrentPassword('');
      setNewPassword('');
      setSuccessMessage('Configurações atualizadas com sucesso.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao atualizar configurações.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeleteAccount() {
    if (!user || isDeleting) {
      return;
    }

    Alert.alert(
      'Excluir conta definitivamente',
      'Isso exclui a conta e os dados no banco da nuvem e neste aparelho. Não há como recuperar depois.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir definitivamente',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                setIsDeleting(true);
                setError(null);
                setSuccessMessage(null);

                if (isManagedProfilePhotoUri(photoUri)) {
                  await removeManagedProfilePhoto(photoUri);
                }

                await deleteAccount();
                router.replace('/(auth)/welcome');
              } catch (deleteError) {
                setError(deleteError instanceof Error ? deleteError.message : 'Falha ao excluir conta.');
              } finally {
                setIsDeleting(false);
              }
            })();
          },
        },
      ]
    );
  }

  return (
    <Screen keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backText}>Voltar</ThemedText>
        </Pressable>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerBadge}>
              <IconSymbol name="gearshape.fill" size={18} color={ModulePalette.medication.base} />
            </View>
            <ThemedText style={styles.headerEyebrow}>Configurações</ThemedText>
          </View>
          <ThemedText type="title" style={styles.title}>
            Conta, segurança e sessão no mesmo lugar.
          </ThemedText>
          <ThemedText style={styles.description}>
            Atualize seus dados, ajuste a biometria e controle a sessão do app com menos atrito.
          </ThemedText>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <ThemedText style={styles.sectionEyebrow}>Conta</ThemedText>
        <ThemedText style={styles.sectionTitle}>Dados principais</ThemedText>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <ThemedText style={styles.avatarInitials}>{initials}</ThemedText>
              </View>
            )}
          </View>
          <View style={styles.profileActions}>
            <AuthButton label="Tirar foto" variant="secondary" onPress={() => void handleTakePhoto()} />
            <AuthButton label="Escolher da galeria" variant="secondary" onPress={() => void handleChooseFromLibrary()} />
            {photoUri ? (
              <AuthButton
                label="Remover foto"
                onPress={() => {
                  void removeManagedProfilePhoto(photoUri);
                  setPhotoUri(null);
                }}
              />
            ) : null}
          </View>
        </View>
        <RecordInput
          label="Nome"
          value={name}
          onChangeText={setName}
          placeholder="Seu nome"
          returnKeyType="next"
          textContentType="name"
          autoComplete="name"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <RecordInput
          ref={emailRef}
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="voce@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          textContentType="emailAddress"
          autoComplete="email"
          onSubmitEditing={() => {
            if (showPersonalProfileCard) {
              profileHeightRef.current?.focus();
              return;
            }

            currentPasswordRef.current?.focus();
          }}
        />
      </View>

      {showPersonalProfileCard ? <View style={styles.sectionCard}>
        <ThemedText style={styles.sectionEyebrow}>Perfil ativo</ThemedText>
        <ThemedText style={styles.sectionTitle}>
          {activeProfileName ? `Dados de ${activeProfileName}` : 'Dados do acompanhado'}
        </ThemedText>
        <View style={styles.optionGroup}>
          <ThemedText style={styles.optionLabel}>Sexo</ThemedText>
          <View style={styles.optionRow}>
            {sexOptions.map((option) => (
              <AuthButton
                key={option.value}
                label={option.label}
                variant="secondary"
                selected={profileSex === option.value}
                selectedBackgroundColor={BrandPalette.navy}
                selectedTextColor={BrandPalette.white}
                style={styles.optionButton}
                onPress={() => setProfileSex((currentSex) => currentSex === option.value ? '' : option.value)}
              />
            ))}
          </View>
        </View>
        <RecordInput
          ref={profileHeightRef}
          label="Altura em cm"
          value={profileHeight}
          onChangeText={(value) => setProfileHeight(value.replace(/\D/g, ''))}
          placeholder="Ex.: 170"
          keyboardType="number-pad"
          maxLength={3}
          returnKeyType="done"
          onSubmitEditing={() => currentPasswordRef.current?.focus()}
        />
      </View> : null}

      <View style={styles.sectionCard}>
        <ThemedText style={styles.sectionEyebrow}>Seguranca</ThemedText>
        <ThemedText style={styles.sectionTitle}>Senha e biometria</ThemedText>
        <RecordInput
          ref={currentPasswordRef}
          label="Senha atual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Obrigatoria para trocar e-mail ou senha"
          secureTextEntry
          returnKeyType="next"
          textContentType="password"
          autoComplete="current-password"
          onSubmitEditing={() => newPasswordRef.current?.focus()}
        />
        <RecordInput
          ref={newPasswordRef}
          label="Nova senha"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Minimo de 6 caracteres"
          secureTextEntry
          returnKeyType="done"
          textContentType="newPassword"
          autoComplete="password-new"
          onSubmitEditing={() => void handleSave()}
          hint="Deixe em branco se quiser manter a senha atual."
        />

        <View style={styles.biometricCard}>
          <View style={styles.biometricCopy}>
            <ThemedText style={styles.biometricTitle}>Biometria</ThemedText>
            <ThemedText style={styles.biometricText}>
              {biometricAvailable
                ? user?.useBiometric
                  ? 'Ativa para desbloqueio rápido.'
                  : 'Desativada no momento.'
                : 'Biometria indisponível neste dispositivo.'}
            </ThemedText>
          </View>
          <AuthButton
            label={user?.useBiometric ? 'Desativar' : 'Ativar'}
            variant="secondary"
            disabled={!biometricAvailable || !user}
            onPress={() => {
              if (!user) {
                return;
              }

              void updateBiometric(!user.useBiometric);
            }}
          />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <ThemedText style={styles.sectionEyebrow}>Nuvem</ThemedText>
        <ThemedText style={styles.sectionTitle}>Backup e sincronização</ThemedText>
        <View style={styles.cloudCard}>
          <View style={styles.cloudIcon}>
            <IconSymbol name="cloud.fill" size={22} color={BrandPalette.primary} />
          </View>
          <View style={styles.cloudCopy}>
            <ThemedText style={styles.cloudTitle}>Salvar meus dados na nuvem</ThemedText>
            <ThemedText style={styles.cloudText}>
              Veja por que ativar backup, Pix e sincronização mantendo o app funcionando offline.
            </ThemedText>
          </View>
        </View>
        <View style={styles.planSummaryCard}>
          <View style={styles.planSummaryHeader}>
            <ThemedText style={styles.planSummaryLabel}>Plano atual</ThemedText>
            <ThemedText
              style={[
                styles.planStatusBadge,
                isCloudActive ? styles.planStatusBadgeActive : null,
              ]}>
              {planBadgeText}
            </ThemedText>
          </View>
          <ThemedText style={styles.planSummaryTitle}>{planStatusText}</ThemedText>
          <ThemedText style={styles.planSummaryText}>{planSummaryText}</ThemedText>
        </View>
        <AuthButton label="Entender nuvem" variant="secondary" onPress={() => router.push('/cloud-sync' as never)} />
      </View>

      <View style={styles.sectionCard}>
        <ThemedText style={styles.sectionEyebrow}>Sessão</ThemedText>
        <ThemedText style={styles.sectionTitle}>Ações rápidas</ThemedText>
        <View style={styles.sessionRow}>
          <AuthButton label="Bloquear app" variant="secondary" onPress={lock} style={styles.sessionButton} />
          <AuthButton label="Sair da conta" onPress={() => void logout()} style={styles.sessionButton} />
        </View>
      </View>

      <View style={[styles.sectionCard, styles.dangerSection]}>
        <ThemedText style={styles.dangerEyebrow}>Conta</ThemedText>
        <ThemedText style={styles.dangerTitle}>Excluir conta definitivamente</ThemedText>
        <ThemedText style={styles.dangerText}>
          Remove a conta principal, perfis acompanhados e registros no banco da nuvem e neste aparelho.
          Não há retorno depois da confirmação.
        </ThemedText>
        <AuthButton
          label={isDeleting ? 'Excluindo...' : 'Excluir conta'}
          variant="secondary"
          selected
          selectedBackgroundColor="#FFF1F1"
          selectedBorderColor="#F2B8B8"
          selectedTextColor={Colors.light.danger}
          disabled={isDeleting}
          onPress={handleDeleteAccount}
        />
      </View>

      <View style={styles.sectionCard}>
        <ThemedText style={styles.sectionEyebrow}>Privacidade</ThemedText>
        <ThemedText style={styles.sectionTitle}>Uso pessoal dos dados</ThemedText>
        <ThemedText style={styles.privacyText}>
          O Meu Controle guarda registros para acompanhamento pessoal no aparelho e, se contratado,
          também pode sincronizar uma cópia na nuvem. Ele serve para armazenar informações para
          uso posterior e não realiza atendimento médico, diagnóstico, prescrição, orientação
          clínica ou indicação de medicação.
        </ThemedText>
        <AuthButton label="Ver política de privacidade" variant="secondary" onPress={() => router.push('/privacy')} />
      </View>

      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
      {successMessage ? <ThemedText style={styles.successText}>{successMessage}</ThemedText> : null}

      <AuthButton
        label={isSubmitting ? 'Salvando...' : 'Salvar configurações'}
        disabled={isSubmitting}
        onPress={handleSave}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
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
  headerCard: {
    borderRadius: 30,
    backgroundColor: ModulePalette.medication.soft,
    padding: 22,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E3D8F6',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEyebrow: {
    color: ModulePalette.medication.base,
    fontSize: 12,
    fontWeight: '700',
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
    borderRadius: 28,
    backgroundColor: Colors.light.surface,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2ECEF',
    shadowColor: BrandPalette.navy,
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 2,
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
    fontWeight: '800',
  },
  profileCard: {
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceMuted,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  avatarWrap: {
    alignItems: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: ModulePalette.medication.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: Colors.light.surface,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
  },
  profileActions: {
    gap: 10,
  },
  optionGroup: {
    gap: 8,
  },
  optionLabel: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    minHeight: 44,
    minWidth: '30%',
    flexGrow: 1,
  },
  biometricCard: {
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceMuted,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  biometricCopy: {
    gap: 4,
  },
  biometricTitle: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  biometricText: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  peopleCard: {
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceMuted,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  peopleIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#DDF1EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  peopleCopy: {
    flex: 1,
    gap: 4,
  },
  peopleTitle: {
    color: Colors.light.text,
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 22,
  },
  peopleText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
  },
  cloudCard: {
    borderRadius: 20,
    backgroundColor: '#F0F8F6',
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: '#CFE5DF',
  },
  cloudIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#DDF1EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudCopy: {
    flex: 1,
    gap: 4,
  },
  cloudTitle: {
    color: Colors.light.text,
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 22,
  },
  cloudText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
  },
  planSummaryCard: {
    borderRadius: 20,
    backgroundColor: '#F7FAFB',
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  planSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  planSummaryLabel: {
    color: Colors.light.textSoft,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  planStatusBadge: {
    borderRadius: 999,
    backgroundColor: '#F1F4F6',
    color: Colors.light.textSoft,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planStatusBadgeActive: {
    backgroundColor: '#DDF1EC',
    color: BrandPalette.primary,
  },
  planSummaryTitle: {
    color: Colors.light.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  planSummaryText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
  },
  sessionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionButton: {
    flex: 1,
  },
  dangerSection: {
    borderColor: '#F2B8B8',
    backgroundColor: '#FFF8F8',
  },
  dangerEyebrow: {
    color: Colors.light.danger,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dangerTitle: {
    color: Colors.light.danger,
    fontSize: 20,
    fontWeight: '800',
  },
  dangerText: {
    color: Colors.light.textMuted,
    lineHeight: 21,
  },
  errorText: {
    color: Colors.light.danger,
    lineHeight: 20,
  },
  successText: {
    color: '#0F8A6A',
    lineHeight: 20,
    fontWeight: '700',
  },
  privacyText: {
    color: Colors.light.textMuted,
    lineHeight: 21,
  },
});
