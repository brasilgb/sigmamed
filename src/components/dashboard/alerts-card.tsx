import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { DashboardAlert } from '@/types/health';

type AlertsCardProps = {
  alerts: DashboardAlert[];
  onPressAlert?: (alert: DashboardAlert) => void;
};

const tones = {
  warning: {
    backgroundColor: '#fff4df',
    borderColor: '#f0be5a',
    titleColor: '#8a5a00',
    textColor: '#835f14',
  },
  danger: {
    backgroundColor: '#fde8e6',
    borderColor: '#dd7b72',
    titleColor: '#99352f',
    textColor: '#7b403d',
  },
  info: {
    backgroundColor: '#e7eefc',
    borderColor: '#96addf',
    titleColor: '#21438f',
    textColor: '#425f9d',
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
    borderRadius: 22,
    padding: 16,
    gap: 6,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  action: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
});
