import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type SearchInputProps = TextInputProps & {
  label: string;
};

export function SearchInput({ label, style, ...props }: SearchInputProps) {
  return (
    <View style={styles.wrapper}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        placeholderTextColor="#8aa0a8"
        style={[styles.input, style]}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
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
});
