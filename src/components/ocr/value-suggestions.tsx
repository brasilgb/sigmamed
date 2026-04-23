import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type ValueSuggestionsProps = {
  label: string;
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
};

export function ValueSuggestions({
  label,
  values,
  selected,
  onSelect,
}: ValueSuggestionsProps) {
  if (values.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.row}>
        {values.map((value) => {
          const isSelected = selected === value;

          return (
            <Pressable
              key={value}
              onPress={() => onSelect(value)}
              style={[styles.chip, isSelected ? styles.chipSelected : null]}>
              <ThemedText style={isSelected ? styles.textSelected : styles.textDefault}>
                {value}
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
    color: '#35515a',
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: '#ecf4f6',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipSelected: {
    backgroundColor: '#17303a',
  },
  textDefault: {
    color: '#17303a',
    fontWeight: '700',
  },
  textSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
