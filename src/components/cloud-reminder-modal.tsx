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
import { getBillingSyncAccess, isBillingSyncEnabled, type BillingSyncAccess } from '@/services/billing.service';

type CloudReminderModalProps = {
  enabled: boolean;
};

type ReminderKind = 'initial' | 'expired';

function isExpiredAccess(access: BillingSyncAccess | null) {
  return access?.status === 'expired' || access?.status === 'canceled';
}

export function CloudReminderModal({ enabled }: CloudReminderModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [reminderKind, setReminderKind] = useState<ReminderKind>('initial');
  const didCheckRef = useRef(false);
  const isClosingRef = useRef(false);
  const didDismissRef = useRef(false);
  const didDismissExpiredRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      didCheckRef.current = false;
      isClosingRef.current = false;
      didDismissRef.current = false;
      didDismissExpiredRef.current = false;
      setIsVisible(false);
      return;
    }

    if (didCheckRef.current || didDismissRef.current) {
      return;
    }

    let isMounted = true;
    didCheckRef.current = true;

    async function checkCloudAccess() {
      if (isClosingRef.current) {
        return;
      }

      const access = await getBillingSyncAccess().catch(() => null);

      if (isMounted && isExpiredAccess(access) && !didDismissExpiredRef.current && !isClosingRef.current) {
        setReminderKind('expired');
        setIsVisible(true);
        return;
      }

      const isPending = await getCloudReminderPending();

      if (!isPending || didDismissRef.current || isClosingRef.current) {
        return;
      }

      if (isMounted && !isBillingSyncEnabled(access) && !didDismissRef.current && !isClosingRef.current) {
        setReminderKind('initial');
        setIsVisible(true);
        return;
      }

      if (isMounted) {
        await setCloudReminderPending(false);
      }
    }

    void checkCloudAccess();

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  async function close() {
    if (reminderKind === 'expired') {
      didDismissExpiredRef.current = true;
    } else {
      didDismissRef.current = true;
    }

    isClosingRef.current = true;
    setIsVisible(false);

    if (reminderKind === 'initial') {
      await setCloudReminderPending(false);
    }
  }

  function openCloudSync() {
    if (reminderKind === 'expired') {
      didDismissExpiredRef.current = true;
    } else {
      didDismissRef.current = true;
    }

    isClosingRef.current = true;
    setIsVisible(false);
    if (reminderKind === 'initial') {
      void setCloudReminderPending(false);
    }
    router.push('/cloud-sync' as never);
  }

  return (
    <Modal transparent visible={isVisible} animationType="fade" onRequestClose={() => void close()}>
      <View style={styles.modalOverlay}>
        <View style={styles.cloudReminderCard}>
          <View style={styles.cloudReminderIcon}>
            <IconSymbol name="cloud.fill" size={28} color={BrandPalette.primary} />
          </View>
          <ThemedText style={styles.cloudReminderTitle}>
            {reminderKind === 'expired' ? 'Seu plano expirou' : 'Salvar seus dados na nuvem'}
          </ThemedText>
          <ThemedText style={styles.cloudReminderText}>
            {reminderKind === 'expired'
              ? 'Renove o plano para reativar backup e sincronização dos seus registros na nuvem.'
              : 'Ative backup e sincronização para recuperar seus registros ao trocar de aparelho ou reinstalar o app.'}
          </ThemedText>
          <View style={styles.cloudReminderActions}>
            <Pressable style={styles.cloudReminderSecondary} onPress={() => void close()}>
              <ThemedText style={styles.cloudReminderSecondaryText}>Fechar</ThemedText>
            </Pressable>
            <Pressable style={styles.cloudReminderPrimary} onPress={openCloudSync}>
              <ThemedText style={styles.cloudReminderPrimaryText}>
                {reminderKind === 'expired' ? 'Renovar' : 'Veja como'}
              </ThemedText>
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
