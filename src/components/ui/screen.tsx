import { ReactNode, useCallback, useContext } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
} from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext);
  const tabBarClearance = Platform.select({
    android: Math.max(insets.bottom + 48, 56),
    default: Math.max(insets.bottom + 28, 42),
  });
  const bottomPadding = tabBarHeight ? tabBarHeight + tabBarClearance : insets.bottom + 24;
  const enterProgress = useSharedValue(1);

  useFocusEffect(
    useCallback(() => {
      enterProgress.value = 0;
      enterProgress.value = withTiming(1, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });
    }, [enterProgress])
  );

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: 0.92 + enterProgress.value * 0.08,
    transform: [{ translateY: (1 - enterProgress.value) * 8 }],
  }));

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: Colors[colorScheme].background }]}
      edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }, contentContainerStyle]}
          refreshControl={
            onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} /> : undefined
          }
          keyboardDismissMode="on-drag"
          {...props}>
          <Animated.View style={[styles.inner, animatedContentStyle]}>{children}</Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  inner: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 20,
  },
});
