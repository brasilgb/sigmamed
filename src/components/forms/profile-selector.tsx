import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { BrandPalette, Colors, Radius, Space } from '@/constants/theme';
import type { AuthProfile } from '@/features/auth/types/auth';

type ProfileSelectorProps = {
  profiles: AuthProfile[];
  selectedProfileId: number | null;
  onChange: (profileId: number) => void;
};

export function ProfileSelector({ profiles, selectedProfileId, onChange }: ProfileSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId);

  function handleSelect(profileId: number) {
    onChange(profileId);
    setIsOpen(false);
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <ThemedText style={styles.label}>Acompanhado</ThemedText>
        <ThemedText style={styles.hint}>Escolha para quem este registro será salvo.</ThemedText>
      </View>
      {profiles.length > 0 ? (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsOpen(true)}
            style={styles.selectButton}>
            <View style={styles.selectIcon}>
              <IconSymbol name="person.2.fill" size={20} color={BrandPalette.primary} />
            </View>
            <View style={styles.selectCopy}>
              <ThemedText style={styles.selectLabel}>{selectedProfile ? 'Selecionado' : 'Selecione'}</ThemedText>
              <ThemedText style={styles.selectValue}>{selectedProfile?.fullName ?? 'Acompanhado'}</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={24} color={Colors.light.textSoft} />
          </Pressable>

          <Modal transparent visible={isOpen} animationType="fade" onRequestClose={() => setIsOpen(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>Selecionar acompanhado</ThemedText>
                  <Pressable onPress={() => setIsOpen(false)} style={styles.closeButton}>
                    <ThemedText style={styles.closeText}>Fechar</ThemedText>
                  </Pressable>
                </View>
                <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
                  {profiles.map((profile) => {
                    const isSelected = selectedProfileId === profile.id;

                    return (
                      <Pressable
                        key={profile.id}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                        onPress={() => handleSelect(profile.id)}
                        style={[styles.modalOption, isSelected ? styles.modalOptionSelected : null]}>
                        <View style={[styles.radio, isSelected ? styles.radioSelected : null]} />
                        <View style={styles.modalOptionCopy}>
                          <ThemedText style={styles.modalOptionTitle}>{profile.fullName ?? 'Sem nome'}</ThemedText>
                          <ThemedText style={styles.modalOptionMeta}>
                            {[profile.age ? `${profile.age} anos` : null, profile.sex].filter(Boolean).join(' · ') || 'Dados básicos'}
                          </ThemedText>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <ThemedText style={styles.emptyText}>
            Cadastre um acompanhado na tela inicial antes de salvar registros.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  header: {
    gap: 3,
  },
  label: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  hint: {
    color: Colors.light.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    padding: Space.md,
  },
  selectIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: '#DDF1EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCopy: {
    flex: 1,
    gap: 2,
  },
  selectLabel: {
    color: Colors.light.textSoft,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  selectValue: {
    color: Colors.light.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
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
  closeButton: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeText: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  modalList: {
    maxHeight: 420,
  },
  modalListContent: {
    gap: 10,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surfaceMuted,
    padding: Space.md,
  },
  modalOptionSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: '#EAF7F4',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  radioSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: Colors.light.tint,
  },
  modalOptionCopy: {
    flex: 1,
    gap: 2,
  },
  modalOptionTitle: {
    color: Colors.light.text,
    fontWeight: '800',
    lineHeight: 22,
  },
  modalOptionMeta: {
    color: Colors.light.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 18,
    backgroundColor: Colors.light.surfaceMuted,
    padding: 14,
  },
  emptyText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
  },
});
