import { Pressable, StyleSheet, View } from 'react-native';

import { BrandPalette, Colors } from '@/constants/theme';
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
    gap: 8,
  },
  label: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.light.surfaceMuted,
  },
  optionSelected: {
    backgroundColor: BrandPalette.navy,
  },
  textDefault: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  textSelected: {
    color: BrandPalette.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
});
