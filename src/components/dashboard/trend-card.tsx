import { Pressable, StyleSheet, View } from 'react-native';

import { BrandPalette, Colors, ModulePalette, Radius, Space, Surface } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import type { MetricTrend } from '@/types/health';

type TrendCardProps = {
  metric: MetricTrend;
  onPress?: (metric: MetricTrend) => void;
  actionLabel?: string;
};

const palette = {
  pressure: {
    background: Colors.light.surface,
    accent: ModulePalette.pressure.base,
    soft: ModulePalette.pressure.soft,
  },
  glicose: {
    background: Colors.light.surface,
    accent: ModulePalette.glicose.base,
    soft: ModulePalette.glicose.soft,
  },
  weight: {
    background: Colors.light.surface,
    accent: ModulePalette.weight.base,
    soft: ModulePalette.weight.soft,
  },
};

export function TrendCard({ metric, onPress, actionLabel = 'Abrir detalhes' }: TrendCardProps) {
  const colors = palette[metric.key];
  const numericValues = metric.points.flatMap((point) => (point.value === null ? [] : [point.value]));
  const max = numericValues.length > 0 ? Math.max(...numericValues) : 1;
  const min = numericValues.length > 0 ? Math.min(...numericValues) : 0;
  const range = Math.max(max - min, 1);
  const deltaPrefix = metric.delta && metric.delta > 0 ? '+' : '';

  return (
    <Pressable style={styles.card} onPress={onPress ? () => onPress(metric) : undefined}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <ThemedText style={styles.label}>{metric.label}</ThemedText>
          <ThemedText style={[styles.value, { color: colors.accent }]}>
            {metric.latestValue !== null ? `${metric.latestValue.toFixed(metric.key === 'weight' ? 1 : 0)} ${metric.unit}` : 'Sem dado'}
          </ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.soft }]}>
          <ThemedText style={[styles.badgeText, { color: colors.accent }]}>
            {metric.delta !== null ? `${deltaPrefix}${metric.delta.toFixed(metric.key === 'weight' ? 1 : 0)}` : '0'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.chart}>
        {metric.points.map((point) => {
          const height = point.value === null ? 8 : 18 + ((point.value - min) / range) * 44;

          return (
            <View key={`${metric.key}-${point.date}`} style={styles.column}>
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: point.value === null ? Colors.light.border : colors.accent,
                    opacity: point.value === null ? 0.5 : 1,
                  },
                ]}
              />
              <ThemedText style={styles.axisLabel}>{point.label}</ThemedText>
            </View>
          );
        })}
      </View>

      <ThemedText style={styles.detail}>{metric.detail}</ThemedText>
      {onPress ? <ThemedText style={[styles.action, { color: colors.accent }]}>{actionLabel}</ThemedText> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Space.lg,
    gap: 14,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Surface.cardBorder,
    shadowColor: BrandPalette.navy,
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: Colors.light.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
  },
  badge: {
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  badgeText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 78,
    paddingTop: 8,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  bar: {
    width: '100%',
    borderRadius: 999,
    minWidth: 8,
  },
  axisLabel: {
    color: Colors.light.textSoft,
    fontSize: 10,
    lineHeight: 14,
  },
  detail: {
    color: Colors.light.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  action: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
});
