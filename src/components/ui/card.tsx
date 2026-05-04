import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { BrandPalette, Colors, Radius, Space, Surface } from '@/constants/theme';

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
    shadowColor: BrandPalette.deepNavy,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
  },
  surface: {
    backgroundColor: Colors.light.surface,
  },
  muted: {
    backgroundColor: Colors.light.surfaceMuted,
    borderColor: Colors.light.border,
  },
});
