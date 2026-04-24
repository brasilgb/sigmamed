import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { BrandPalette, Colors, Radius, Surface } from '@/constants/theme';
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
    borderRadius: Radius.md,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.light.text,
    backgroundColor: Surface.cardSubtle,
    shadowColor: BrandPalette.navy,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
});
