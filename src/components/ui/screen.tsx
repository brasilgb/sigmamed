import { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
    backgroundColor: '#f4f7f8',
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
