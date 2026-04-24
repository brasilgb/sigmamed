import { Pressable, StyleSheet, View } from 'react-native';

import { ModulePalette, Colors, Radius } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import type { DashboardAlert } from '@/types/health';

type AlertsCardProps = {
  alerts: DashboardAlert[];
  onPressAlert?: (alert: DashboardAlert) => void;
};

const tones = {
  warning: {
    backgroundColor: '#FFF6E4',
    borderColor: Colors.light.warning,
    titleColor: '#8A5A00',
    textColor: '#835F14',
  },
  danger: {
    backgroundColor: '#FDE8E6',
    borderColor: Colors.light.danger,
    titleColor: '#99352F',
    textColor: '#7B403D',
  },
  info: {
    backgroundColor: ModulePalette.glicose.soft,
    borderColor: ModulePalette.glicose.base,
    titleColor: ModulePalette.glicose.base,
    textColor: '#425F9D',
  },
};

export function AlertsCard({ alerts, onPressAlert }: AlertsCardProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      {alerts.map((alert) => {
        const tone = tones[alert.tone];

        return (
          <Pressable
            key={alert.id}
            onPress={onPressAlert ? () => onPressAlert(alert) : undefined}
            style={[
              styles.card,
              {
                backgroundColor: tone.backgroundColor,
                borderColor: tone.borderColor,
              },
            ]}>
            <ThemedText style={[styles.title, { color: tone.titleColor }]}>{alert.title}</ThemedText>
            <ThemedText style={[styles.description, { color: tone.textColor }]}>
              {alert.description}
            </ThemedText>
            <ThemedText style={[styles.action, { color: tone.titleColor }]}>{alert.actionLabel}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  card: {
    borderRadius: Radius.lg,
    padding: 18,
    gap: 8,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  action: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
});
