import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { BrandPalette, Colors, Surface } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

type AuthInputProps = TextInputProps & {
  label: string;
  error?: string | null;
};

export function AuthInput({ label, error, style, ...props }: AuthInputProps) {
  return (
    <View style={styles.wrapper}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        placeholderTextColor={Colors.light.textSoft}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    color: Colors.light.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.light.text,
    backgroundColor: Surface.cardSubtle,
    shadowColor: BrandPalette.navy,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
  inputError: {
    borderColor: Colors.light.danger,
  },
  error: {
    color: Colors.light.danger,
    fontSize: 13,
    lineHeight: 18,
  },
});
