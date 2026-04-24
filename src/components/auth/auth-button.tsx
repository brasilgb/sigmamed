import { Pressable, StyleSheet, ViewStyle } from 'react-native';

import { BrandPalette, Colors, Surface } from '@/constants/theme';
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
    minHeight: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: BrandPalette.navy,
    borderWidth: 1,
    borderColor: '#0A1724',
    shadowColor: Surface.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 3,
  },
  secondary: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pressed: {
    opacity: 0.94,
  },
  disabled: {
    opacity: 0.55,
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryText: {
    color: Colors.light.text,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
