import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';

type SectionHeaderProps = {
  title: string;
  hint?: string;
};

export function SectionHeader({ title, hint }: SectionHeaderProps) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <View style={styles.header}>
      <ThemedText type="subtitle" style={[styles.title, { color: Colors[colorScheme].text }]}>
        {title}
      </ThemedText>
      {hint ? (
        <ThemedText style={[styles.hint, { color: Colors[colorScheme].textMuted }]}>{hint}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontWeight: '800',
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});
