import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors, Radius, Space, Surface } from '@/constants/theme';

type CardProps = {
  children: ReactNode;
  style?: ViewStyle;
  muted?: boolean;
};

export function Card({ children, style, muted = false }: CardProps) {
  return <View style={[styles.base, muted ? styles.muted : styles.surface, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Surface.cardBorder,
  },
  surface: {
    backgroundColor: Colors.light.surface,
  },
  muted: {
    backgroundColor: Colors.light.surfaceMuted,
    borderColor: Colors.light.border,
  },
});
