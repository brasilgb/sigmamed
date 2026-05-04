import { StyleSheet, View } from 'react-native';

import { BrandPalette, ModulePalette, Colors, Radius, Surface } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import type { HistoryItem } from '@/types/health';

const categoryStyles: Record<HistoryItem['category'], { dot: string; label: string }> = {
  pressure: { dot: ModulePalette.pressure.base, label: 'Pressão' },
  glicose: { dot: ModulePalette.glicose.base, label: 'Glicose' },
  weight: { dot: ModulePalette.weight.base, label: 'Peso' },
  medication: { dot: ModulePalette.medication.base, label: 'Medicação' },
};

type HistoryListProps = {
  items: HistoryItem[];
  profileName?: string | null;
};

export function HistoryList({ items, profileName }: HistoryListProps) {
  return (
    <View style={styles.list}>
      {items.map((item) => {
        const category = categoryStyles[item.category];

        return (
          <View key={item.id} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: category.dot }]} />
            <View style={styles.content}>
              <View style={styles.header}>
                <ThemedText style={styles.title}>{item.title}</ThemedText>
                <ThemedText style={styles.badge}>{category.label}</ThemedText>
              </View>
              <ThemedText style={styles.subtitle}>{item.subtitle}</ThemedText>
              {profileName ? (
                <ThemedText style={styles.profileName}>Acompanhado: {profileName}</ThemedText>
              ) : null}
              <ThemedText style={styles.timestamp}>{item.timestamp}</ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    padding: 18,
    borderWidth: 1,
    borderColor: Surface.cardBorder,
  },
  dot: {
    width: 12,
    borderRadius: 999,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.light.text,
  },
  badge: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.textSoft,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.textMuted,
  },
  profileName: {
    fontSize: 13,
    lineHeight: 18,
    color: BrandPalette.primary,
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textSoft,
  },
});
