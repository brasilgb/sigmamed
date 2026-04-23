import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type MetricPreviewProps = {
  label: string;
  value: string;
  detail: string;
  onPress?: () => void;
  actionLabel?: string;
};

export function MetricPreview({ label, value, detail, onPress, actionLabel }: MetricPreviewProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.value}>{value}</ThemedText>
      <ThemedText style={styles.detail}>{detail}</ThemedText>
      {actionLabel ? <ThemedText style={styles.action}>{actionLabel}</ThemedText> : null}
    </Pressable>
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
  action: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
});
