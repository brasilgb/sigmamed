import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandPalette, Colors, Radius, Space, Surface } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';

type FormShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function FormShell({ title, description, children }: FormShellProps) {
  return (
    <Screen keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backText}>Voltar</ThemedText>
        </Pressable>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <IconSymbol name="plus.circle.fill" size={18} color={BrandPalette.primary} />
            </View>
            <ThemedText style={styles.heroEyebrow}>Formulario</ThemedText>
          </View>
          <ThemedText type="title" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText style={styles.description}>{description}</ThemedText>
        </View>
      </View>

      <View style={styles.card}>{children}</View>
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
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backText: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.light.surfaceMuted,
    padding: Space.xl,
    gap: 10,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    color: BrandPalette.navy,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: Colors.light.text,
    lineHeight: 36,
  },
  description: {
    color: Colors.light.textMuted,
  },
  card: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.light.surface,
    padding: Space.lg,
    gap: Space.md,
    borderWidth: 1,
    borderColor: Surface.cardBorder,
  },
});
