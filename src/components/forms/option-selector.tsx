import { Pressable, StyleSheet, View } from 'react-native';

import { BrandPalette, Colors, Radius } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

type Option<T extends string> = {
  label: string;
  value: T;
};

type OptionSelectorProps<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function OptionSelector<T extends string>({
  label,
  options,
  value,
  onChange,
}: OptionSelectorProps<T>) {
  return (
    <View style={styles.wrapper}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.option, selected ? styles.optionSelected : null]}>
              <ThemedText style={selected ? styles.textSelected : styles.textDefault}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  label: {
    color: Colors.light.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F1F7F8',
    borderWidth: 1,
    borderColor: '#DBE7EA',
  },
  optionSelected: {
    backgroundColor: BrandPalette.navy,
    borderColor: BrandPalette.navy,
  },
  textDefault: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  textSelected: {
    color: BrandPalette.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
});
