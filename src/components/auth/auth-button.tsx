import { Pressable, StyleSheet, ViewStyle } from 'react-native';

import { BrandPalette, Colors, Surface } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

type AuthButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  selected?: boolean;
  selectedBackgroundColor?: string;
  selectedBorderColor?: string;
  selectedTextColor?: string;
};

export function AuthButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
  selected = false,
  selectedBackgroundColor,
  selectedBorderColor,
  selectedTextColor,
}: AuthButtonProps) {
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isSecondary ? styles.secondary : styles.primary,
        isSecondary && selected
          ? {
              backgroundColor: selectedBackgroundColor ?? BrandPalette.navy,
              borderColor: selectedBorderColor ?? selectedBackgroundColor ?? BrandPalette.navy,
            }
          : null,
        pressed && !disabled ? styles.pressed : null,
        disabled ? (selected ? styles.disabledSelected : styles.disabled) : null,
        style,
      ]}>
      <ThemedText
        style={[
          isSecondary ? styles.secondaryText : styles.primaryText,
          isSecondary && selected ? { color: selectedTextColor ?? BrandPalette.white } : null,
        ]}>
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
    paddingHorizontal: 14,
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
  disabledSelected: {
    opacity: 1,
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  secondaryText: {
    color: Colors.light.text,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
