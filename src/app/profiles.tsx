import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { BrandPalette, Colors, Radius, Space } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  getAccountProfiles,
  getActiveAccountProfileId,
} from '@/features/auth/services/auth.service';
import type { AuthProfile } from '@/features/auth/types/auth';

export default function ProfilesScreen() {
  const { user } = useAuth();
  const canCreateProfiles = user?.accountUsage !== 'personal';
  const [profiles, setProfiles] = useState<AuthProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const visibleProfiles =
    user?.accountUsage === 'personal'
      ? profiles
      : profiles.filter((profile) => (profile.fullName ?? '').trim() !== user?.name.trim());

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

  return (
    <Screen isRefreshing={isLoading} onRefresh={loadProfiles}>
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
            Gerencie as pessoas acompanhadas nesta conta e mantenha cada histórico de saúde separado.
          </ThemedText>
        </View>
      </View>

      {canCreateProfiles ? (
        <Pressable style={styles.addCard} onPress={() => router.push('/profile-form' as never)}>
          <View style={styles.addIcon}>
            <IconSymbol name="person.crop.circle.fill.badge.plus" size={24} color={BrandPalette.primary} />
          </View>
          <View style={styles.addCopy}>
            <ThemedText style={styles.addTitle}>Adicionar acompanhado</ThemedText>
            <ThemedText style={styles.addText}>Cadastre uma pessoa para selecionar nas próximas leituras.</ThemedText>
          </View>
        </Pressable>
      ) : (
        <View style={styles.sectionCard}>
          <ThemedText style={styles.sectionEyebrow}>Perfil pessoal</ThemedText>
          <ThemedText style={styles.sectionTitle}>Uso individual</ThemedText>
          <ThemedText style={styles.readOnlyText}>
            Contas pessoais usam somente o perfil da própria conta.
          </ThemedText>
        </View>
      )}

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Perfis cadastrados</ThemedText>
        {visibleProfiles.map((profile) => (
          <View key={profile.id} style={styles.profileCard}>
            <View style={styles.profileIcon}>
              <IconSymbol name="person.crop.circle.fill.badge.plus" size={22} color={BrandPalette.primary} />
            </View>
            <View style={styles.profileCopy}>
              <View style={styles.profileTitleRow}>
                <ThemedText style={styles.profileName}>{profile.fullName ?? 'Sem nome'}</ThemedText>
                {activeProfileId === profile.id ? (
                  <View style={styles.activeBadge}>
                    <ThemedText style={styles.activeBadgeText}>Ativo</ThemedText>
                  </View>
                ) : null}
              </View>
              <ThemedText style={styles.profileMeta}>
                {[
                  profile.age ? `${profile.age} anos` : null,
                  profile.sex,
                  profile.height ? `${profile.height} cm` : null,
                ].filter(Boolean).join(' · ') || 'Dados não informados'}
              </ThemedText>
              {profile.notes ? <ThemedText style={styles.profileNotes}>{profile.notes}</ThemedText> : null}
            </View>
            {canCreateProfiles ? (
              <AuthButton
                label="Editar"
                variant="secondary"
                onPress={() =>
                  router.push({ pathname: '/profile-form', params: { id: String(profile.id) } } as never)
                }
                style={styles.profileAction}
              />
            ) : null}
          </View>
        ))}
        {visibleProfiles.length === 0 && !isLoading ? (
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
  addCard: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: '#DDEBED',
    padding: Space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: '#DDF1EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCopy: {
    flex: 1,
    gap: 4,
  },
  addTitle: {
    color: Colors.light.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  addText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
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
  profileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  profileName: {
    color: Colors.light.text,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },
  activeBadge: {
    borderRadius: Radius.pill,
    backgroundColor: '#E6F6EF',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  activeBadgeText: {
    color: Colors.light.success,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
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
  readOnlyText: {
    color: Colors.light.textMuted,
    lineHeight: 21,
  },
});
