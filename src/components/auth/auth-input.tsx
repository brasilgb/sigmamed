import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { BrandPalette, Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

type AuthInputProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
};

export const AuthInput = forwardRef<TextInput, AuthInputProps>(function AuthInput(
  { label, error, hint, style, ...props },
  ref
) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <View style={styles.wrapper}>
      <ThemedText style={[styles.label, { color: palette.text }]}>{label}</ThemedText>
      <TextInput
        ref={ref}
        placeholderTextColor={palette.textSoft}
        style={[
          styles.input,
          {
            backgroundColor: palette.surfaceMuted,
            borderColor: palette.border,
            color: palette.text,
          },
          error ? styles.inputError : null,
          style,
        ]}
        {...props}
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      {hint ? <ThemedText style={[styles.hint, { color: palette.textSoft }]}>{hint}</ThemedText> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    lineHeight: 22,
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
  hint: {
    color: Colors.light.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
});
