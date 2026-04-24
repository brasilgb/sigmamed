import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { BrandPalette, Colors, Radius } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

type RecordInputProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string | null;
};

export const RecordInput = forwardRef<TextInput, RecordInputProps>(function RecordInput(
  { label, hint, error, style, ...props },
  ref
) {
  return (
    <View style={styles.wrapper}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={[styles.inputShell, error ? styles.inputShellError : null]}>
        <TextInput
          ref={ref}
          placeholderTextColor={Colors.light.textSoft}
          style={[styles.input, style]}
          {...props}
        />
      </View>
      {hint ? <ThemedText style={styles.hint}>{hint}</ThemedText> : null}
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    color: Colors.light.text,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputShell: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 4,
    paddingVertical: 2,
    shadowColor: BrandPalette.navy,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.light.text,
    backgroundColor: 'transparent',
  },
  inputShellError: {
    borderColor: Colors.light.danger,
    backgroundColor: '#FFF7F7',
  },
  hint: {
    color: Colors.light.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    color: Colors.light.danger,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});
