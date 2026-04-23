import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { HistoryItem } from '@/types/health';

const categoryStyles: Record<HistoryItem['category'], { dot: string; label: string }> = {
  pressure: { dot: '#d14d72', label: 'Pressao' },
  glicose: { dot: '#d88828', label: 'Glicose' },
  weight: { dot: '#2f7d8c', label: 'Peso' },
  medication: { dot: '#56825d', label: 'Medicacao' },
};

type HistoryListProps = {
  items: HistoryItem[];
};

export function HistoryList({ items }: HistoryListProps) {
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
    borderRadius: 22,
    backgroundColor: '#ffffff',
    padding: 16,
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
    color: '#17303a',
  },
  badge: {
    fontSize: 12,
    lineHeight: 18,
    color: '#5b6f77',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4e626b',
  },
  timestamp: {
    fontSize: 13,
    lineHeight: 18,
    color: '#748991',
  },
});
