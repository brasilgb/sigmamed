import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
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
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText style={styles.description}>{description}</ThemedText>
      </View>

      <View style={styles.card}>{children}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backText: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  title: {
    color: Colors.light.text,
    lineHeight: 38,
  },
  description: {
    color: Colors.light.textMuted,
  },
  card: {
    borderRadius: 28,
    backgroundColor: Colors.light.surface,
    padding: 20,
    gap: 14,
  },
});
