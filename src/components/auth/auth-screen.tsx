import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandPalette, Colors, Radius, Surface } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';

type AuthScreenProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthScreen({ title, subtitle, children }: AuthScreenProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[colorScheme].background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View
              style={[
                styles.kickerWrap,
                { backgroundColor: isDark ? 'rgba(14, 159, 140, 0.18)' : '#D8F1EC' },
              ]}>
              <ThemedText style={[styles.kicker, { color: isDark ? '#D9FFF7' : BrandPalette.navy }]}>
                SigmaMed
              </ThemedText>
            </View>
            <ThemedText type="title" style={[styles.title, { color: Colors[colorScheme].text }]}>
              {title}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: Colors[colorScheme].textMuted }]}>
              {subtitle}
            </ThemedText>
          </View>
          <View
            style={[
              styles.card,
              {
                backgroundColor: Colors[colorScheme].surface,
                borderColor: Colors[colorScheme].border,
              },
            ]}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 22,
  },
  hero: {
    gap: 10,
    paddingHorizontal: 4,
  },
  kickerWrap: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  kicker: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    lineHeight: 38,
  },
  subtitle: {
    lineHeight: 22,
  },
  card: {
    borderRadius: 30,
    padding: 22,
    gap: 14,
    borderWidth: 1,
    borderColor: Surface.cardBorder,
    shadowColor: BrandPalette.navy,
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 3,
  },
});
