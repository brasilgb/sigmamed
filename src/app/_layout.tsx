import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/features/auth/hooks/use-auth';
import { configureMedicationNotifications } from '@/features/medications/services/medication-reminder.service';
import { useAppBootstrap } from '@/hooks/use-app-bootstrap';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isReady, error } = useAppBootstrap();
  configureMedicationNotifications();
  const activeTheme = colorScheme ?? 'light';

  if (error) {
    return (
      <View style={[styles.stateScreen, { backgroundColor: Colors[activeTheme].background }]}>
        <ThemedText type="title" style={[styles.stateTitle, { color: Colors[activeTheme].text }]}>
          SigmaMed
        </ThemedText>
        <ThemedText style={[styles.stateMessage, { color: Colors[activeTheme].textMuted }]}>
          Falha ao preparar o banco local.
        </ThemedText>
        <ThemedText style={[styles.stateDetail, { color: Colors[activeTheme].textSoft }]}>{error}</ThemedText>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={[styles.stateScreen, { backgroundColor: Colors[activeTheme].background }]}>
        <ActivityIndicator size="large" color={Colors[activeTheme].tint} />
        <ThemedText style={[styles.stateMessage, { color: Colors[activeTheme].textMuted }]}>
          Preparando seu historico local...
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="unlock" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  stateScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  stateTitle: {},
  stateMessage: {
    textAlign: 'center',
  },
  stateDetail: {
    textAlign: 'center',
  },
});
