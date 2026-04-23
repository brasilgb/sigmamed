import { Pressable, StyleSheet, View } from 'react-native';

import { BrandPalette, ModulePalette, Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

type SummaryCardProps = {
  label: string;
  value: string;
  tone?: 'default' | 'accent' | 'success';
  onPress?: () => void;
  actionLabel?: string;
};

const tones = {
  default: {
    backgroundColor: Colors.light.surface,
    valueColor: BrandPalette.navy,
  },
  accent: {
    backgroundColor: ModulePalette.weight.soft,
    valueColor: ModulePalette.weight.base,
  },
  success: {
    backgroundColor: ModulePalette.glicose.soft,
    valueColor: ModulePalette.glicose.base,
  },
};

export function SummaryCard({ label, value, tone = 'default', onPress, actionLabel }: SummaryCardProps) {
  const colors = tones[tone];

  return (
    <Pressable style={[styles.card, { backgroundColor: colors.backgroundColor }]} onPress={onPress}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.content}>
        <ThemedText style={[styles.value, { color: colors.valueColor }]}>{value}</ThemedText>
        {actionLabel ? <ThemedText style={[styles.action, { color: colors.valueColor }]}>{actionLabel}</ThemedText> : null}
      </View>
    </Pressable>
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
  content: {
    gap: 8,
  },
  label: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  value: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
  },
  action: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
});
