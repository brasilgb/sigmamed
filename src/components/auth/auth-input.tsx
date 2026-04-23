import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

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
        placeholderTextColor="#8aa0a8"
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
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
  error: {
    color: '#b14646',
    fontSize: 13,
    lineHeight: 18,
  },
});
