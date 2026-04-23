import { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ScreenProps = ScrollViewProps & {
  children: ReactNode;
  isRefreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
};

export function Screen({
  children,
  isRefreshing = false,
  onRefresh,
  contentContainerStyle,
  ...props
}: ScreenProps) {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: Colors[colorScheme].background }]}
      edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, contentContainerStyle]}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} /> : undefined
        }
        {...props}>
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  inner: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 20,
  },
});
