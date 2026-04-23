import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

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
        placeholderTextColor="#8aa0a8"
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
    color: '#35515a',
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d7e1e5',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#17303a',
    backgroundColor: '#fbfdfe',
  },
  inputError: {
    borderColor: '#c85c5c',
  },
  hint: {
    color: '#6f858d',
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    color: '#b14646',
    fontSize: 13,
    lineHeight: 18,
  },
});
