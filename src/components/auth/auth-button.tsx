import { Pressable, StyleSheet, ViewStyle } from 'react-native';

import { BrandPalette, Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

type AuthButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
};

export function AuthButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
}: AuthButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}>
      <ThemedText style={variant === 'primary' ? styles.primaryText : styles.secondaryText}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: BrandPalette.primary,
  },
  secondary: {
    backgroundColor: Colors.light.surfaceMuted,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.55,
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryText: {
    color: Colors.light.text,
    fontWeight: '700',
  },
});
