import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

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
    backgroundColor: '#e6eef1',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backText: {
    color: '#17303a',
    fontWeight: '700',
  },
  title: {
    color: '#17303a',
    lineHeight: 38,
  },
  description: {
    color: '#58717a',
  },
  card: {
    borderRadius: 28,
    backgroundColor: '#ffffff',
    padding: 20,
    gap: 14,
  },
});
