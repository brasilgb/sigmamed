import { Pressable, StyleSheet, View } from 'react-native';

import { BrandPalette, ModulePalette, Colors, Radius, Space, Surface } from '@/constants/theme';
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
    minHeight: 124,
    borderRadius: Radius.xl,
    padding: Space.lg,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Surface.cardBorder,
    shadowColor: BrandPalette.navy,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 2,
  },
  content: {
    gap: 8,
  },
  label: {
    color: Colors.light.text,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  action: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
});
