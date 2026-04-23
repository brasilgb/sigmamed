import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type SummaryCardProps = {
  label: string;
  value: string;
  tone?: 'default' | 'accent' | 'success';
};

const tones = {
  default: {
    backgroundColor: '#ffffff',
    valueColor: '#16343f',
  },
  accent: {
    backgroundColor: '#dff4ec',
    valueColor: '#0f6c4d',
  },
  success: {
    backgroundColor: '#e7eefc',
    valueColor: '#21438f',
  },
};

export function SummaryCard({ label, value, tone = 'default' }: SummaryCardProps) {
  const colors = tones[tone];

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundColor }]}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={[styles.value, { color: colors.valueColor }]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 112,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
  },
  label: {
    color: '#52707a',
    fontSize: 14,
    lineHeight: 20,
  },
  value: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
  },
});
