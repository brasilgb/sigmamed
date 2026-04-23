import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type MetricPreviewProps = {
  label: string;
  value: string;
  detail: string;
};

export function MetricPreview({ label, value, detail }: MetricPreviewProps) {
  return (
    <View style={styles.card}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.value}>{value}</ThemedText>
      <ThemedText style={styles.detail}>{detail}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: '#0f2b34',
    padding: 20,
    gap: 8,
  },
  label: {
    color: '#b9d6dd',
    fontSize: 14,
    lineHeight: 20,
  },
  value: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
  },
  detail: {
    color: '#c7d9de',
    fontSize: 14,
    lineHeight: 20,
  },
});
