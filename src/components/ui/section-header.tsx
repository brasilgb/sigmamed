import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

type SectionHeaderProps = {
  title: string;
  hint?: string;
};

export function SectionHeader({ title, hint }: SectionHeaderProps) {
  return (
    <View style={styles.header}>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      {hint ? <ThemedText style={styles.hint}>{hint}</ThemedText> : null}
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
    color: Colors.light.text,
  },
  hint: {
    color: Colors.light.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
