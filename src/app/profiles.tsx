import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { RecordInput } from '@/components/forms/record-input';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { BrandPalette, Colors, Radius, Space } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  createAccountProfile,
  getAccountProfiles,
  getActiveAccountProfileId,
  setActiveAccountProfile,
} from '@/features/auth/services/auth.service';
import type { AuthProfile } from '@/features/auth/types/auth';

export default function ProfilesScreen() {
  const { user } = useAuth();
  const canCreateProfiles = user?.accountUsage !== 'professional';
  const heightRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);
  const [profiles, setProfiles] = useState<AuthProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [fullName, setFullName] = useState('');
  const [height, setHeight] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProfiles = useCallback(async () => {
    if (!user) {
      return;
    }

    setIsLoading(true);

    try {
      const [profileRows, currentProfileId] = await Promise.all([
        getAccountProfiles(user.id),
        getActiveAccountProfileId(),
      ]);
      setProfiles(profileRows);
      setActiveProfileId(currentProfileId);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  async function handleCreateProfile() {
    if (!user) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      await createAccountProfile({
        userId: user.id,
        fullName,
        height: height.trim() ? Number(height) : null,
        notes,
      });
      setFullName('');
      setHeight('');
      setNotes('');
      setSuccessMessage('Acompanhado cadastrado.');
      await loadProfiles();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao cadastrar acompanhado.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSelectProfile(profileId: number) {
    await setActiveAccountProfile(profileId);
    setActiveProfileId(profileId);
    setSuccessMessage('Perfil ativo atualizado.');
    setError(null);
  }

  return (
    <Screen isRefreshing={isLoading} onRefresh={loadProfiles} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backText}>Voltar</ThemedText>
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <IconSymbol name="person.2.fill" size={26} color={BrandPalette.white} />
          </View>
          <ThemedText type="title" style={styles.title}>
            Acompanhados
          </ThemedText>
          <ThemedText style={styles.description}>
            Esta conta principal organiza os perfis de cuidado do aparelho. Depois, os registros de saude
            podem ser vinculados ao perfil selecionado.
          </ThemedText>
        </View>
      </View>

      {canCreateProfiles ? (
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionEyebrow}>Novo perfil</ThemedText>
          <ThemedText style={styles.sectionTitle}>Pessoa acompanhada</ThemedText>
          <RecordInput
            label="Nome"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nome completo"
            returnKeyType="next"
            textContentType="name"
            autoComplete="name"
            onSubmitEditing={() => heightRef.current?.focus()}
          />
          <RecordInput
            ref={heightRef}
            label="Altura em cm"
            value={height}
            onChangeText={(value) => setHeight(value.replace(/\D/g, ''))}
            placeholder="Opcional"
            keyboardType="number-pad"
            maxLength={3}
            returnKeyType="next"
            onSubmitEditing={() => notesRef.current?.focus()}
          />
          <RecordInput
            ref={notesRef}
            label="Observações"
            value={notes}
            onChangeText={setNotes}
            placeholder="Opcional"
            multiline
            returnKeyType="done"
            onSubmitEditing={() => void handleCreateProfile()}
          />
          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
          {successMessage ? <ThemedText style={styles.successText}>{successMessage}</ThemedText> : null}
          <AuthButton
            label={isSubmitting ? 'Cadastrando...' : 'Cadastrar acompanhado'}
            disabled={isSubmitting}
            onPress={handleCreateProfile}
          />
        </View>
      ) : (
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionEyebrow}>Perfil principal</ThemedText>
          <ThemedText style={styles.sectionTitle}>Cuidador</ThemedText>
          <ThemedText style={styles.readOnlyText}>
            Contas de cuidador usam somente o paciente principal cadastrado na criacao da conta.
          </ThemedText>
        </View>
      )}

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Perfis cadastrados</ThemedText>
        {profiles.map((profile) => (
          <View key={profile.id} style={styles.profileCard}>
            <View style={styles.profileIcon}>
              <IconSymbol name="person.crop.circle.fill.badge.plus" size={22} color={BrandPalette.primary} />
            </View>
            <View style={styles.profileCopy}>
              <ThemedText style={styles.profileName}>{profile.fullName ?? 'Sem nome'}</ThemedText>
              <ThemedText style={styles.profileMeta}>
                {profile.height ? `${profile.height} cm` : 'Altura nao informada'}
              </ThemedText>
              {profile.notes ? <ThemedText style={styles.profileNotes}>{profile.notes}</ThemedText> : null}
            </View>
            <AuthButton
              label={activeProfileId === profile.id ? 'Ativo' : 'Usar'}
              variant="secondary"
              disabled={activeProfileId === profile.id}
              onPress={() => void handleSelectProfile(profile.id)}
              style={styles.profileAction}
            />
          </View>
        ))}
        {profiles.length === 0 && !isLoading ? (
          <View style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>Nenhum acompanhado cadastrado ainda.</ThemedText>
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
    backgroundColor: '#EAF2F4',
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Space.xl,
    gap: 14,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: Radius.lg,
    backgroundColor: BrandPalette.navy,
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
  section: {
    gap: 12,
  },
  sectionCard: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: '#E2ECEF',
    padding: Space.lg,
    gap: 14,
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
  profileCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: '#E2ECEF',
    padding: Space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: '#DDF1EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCopy: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    color: Colors.light.text,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },
  profileMeta: {
    color: Colors.light.textMuted,
    lineHeight: 20,
  },
  profileNotes: {
    color: Colors.light.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  profileAction: {
    minWidth: 84,
  },
  emptyCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Space.lg,
  },
  emptyText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.light.danger,
    lineHeight: 20,
  },
  successText: {
    color: Colors.light.success,
    lineHeight: 20,
    fontWeight: '700',
  },
  readOnlyText: {
    color: Colors.light.textMuted,
    lineHeight: 21,
  },
});
