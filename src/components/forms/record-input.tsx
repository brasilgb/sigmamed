import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

type RecordInputProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string | null;
};

export function RecordInput({ label, hint, error, style, ...props }: RecordInputProps) {
  return (
    <View style={styles.wrapper}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        placeholderTextColor={Colors.light.textSoft}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {hint ? <ThemedText style={styles.hint}>{hint}</ThemedText> : null}
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.surface,
  },
  inputError: {
    borderColor: Colors.light.danger,
  },
  hint: {
    color: Colors.light.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    color: Colors.light.danger,
    fontSize: 13,
    lineHeight: 18,
  },
});
