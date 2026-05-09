import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BrandPalette, Colors } from '@/constants/theme';
import {
  getCloudReminderPending,
  setCloudReminderPending,
} from '@/features/auth/services/session-storage.service';
import { getBillingSyncAccess, isBillingSyncEnabled } from '@/services/billing.service';

type CloudReminderModalProps = {
  enabled: boolean;
};

let didDismissCloudReminderInMemory = false;
let isCloudReminderCheckInFlight = false;
let isCloudReminderVisibleInMemory = false;

export function CloudReminderModal({ enabled }: CloudReminderModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const didCheckRef = useRef(false);
  const isClosingRef = useRef(false);
  const didDismissRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      didCheckRef.current = false;
      isClosingRef.current = false;
      setIsVisible(false);
      return;
    }

    if (
      didCheckRef.current ||
      didDismissRef.current ||
      didDismissCloudReminderInMemory ||
      isCloudReminderCheckInFlight ||
      isCloudReminderVisibleInMemory
    ) {
      return;
    }

    let isMounted = true;
    didCheckRef.current = true;
    isCloudReminderCheckInFlight = true;

    async function checkCloudAccess() {
      try {
        if (isClosingRef.current) {
          return;
        }

        const access = await getBillingSyncAccess().catch(() => null);

        const isPending = await getCloudReminderPending();

        if (!isPending || didDismissRef.current || didDismissCloudReminderInMemory || isClosingRef.current) {
          return;
        }

        if (isMounted && !isBillingSyncEnabled(access) && !didDismissRef.current && !didDismissCloudReminderInMemory && !isClosingRef.current) {
          await setCloudReminderPending(false);
          isCloudReminderVisibleInMemory = true;
          setIsVisible(true);
          return;
        }

        if (isMounted) {
          await setCloudReminderPending(false);
        }
      } finally {
        isCloudReminderCheckInFlight = false;
      }
    }

    void checkCloudAccess();

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  async function close() {
    didDismissRef.current = true;
    didDismissCloudReminderInMemory = true;
    isClosingRef.current = true;
    isCloudReminderVisibleInMemory = false;
    setIsVisible(false);
    await setCloudReminderPending(false);
  }

  function openCloudSync() {
    didDismissRef.current = true;
    didDismissCloudReminderInMemory = true;
    isClosingRef.current = true;
    isCloudReminderVisibleInMemory = false;
    setIsVisible(false);
    void setCloudReminderPending(false);
    router.push('/cloud-sync' as never);
  }

  return (
    <Modal transparent visible={isVisible} animationType="fade" onRequestClose={() => void close()}>
      <View style={styles.modalOverlay}>
        <View style={styles.cloudReminderCard}>
          <View style={styles.cloudReminderIcon}>
            <IconSymbol name="cloud.fill" size={28} color={BrandPalette.primary} />
          </View>
          <ThemedText style={styles.cloudReminderTitle}>Salvar seus dados na nuvem</ThemedText>
          <ThemedText style={styles.cloudReminderText}>
            Ative backup e sincronização para recuperar seus registros ao trocar de aparelho ou reinstalar o app.
          </ThemedText>
          <View style={styles.cloudReminderActions}>
            <Pressable style={styles.cloudReminderSecondary} onPress={() => void close()}>
              <ThemedText style={styles.cloudReminderSecondaryText}>Fechar</ThemedText>
            </Pressable>
            <Pressable style={styles.cloudReminderPrimary} onPress={openCloudSync}>
              <ThemedText style={styles.cloudReminderPrimaryText}>Veja como</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 29, 36, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cloudReminderCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 26,
    backgroundColor: Colors.light.surface,
    padding: 22,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cloudReminderIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.light.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudReminderTitle: {
    color: Colors.light.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    textAlign: 'center',
  },
  cloudReminderText: {
    color: Colors.light.textMuted,
    lineHeight: 21,
    textAlign: 'center',
  },
  cloudReminderActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    paddingTop: 4,
  },
  cloudReminderSecondary: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cloudReminderPrimary: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: BrandPalette.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cloudReminderSecondaryText: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  cloudReminderPrimaryText: {
    color: BrandPalette.white,
    fontWeight: '800',
  },
});
