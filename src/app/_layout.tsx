import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/features/auth/hooks/use-auth';
import { useAppBootstrap } from '@/hooks/use-app-bootstrap';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isReady, error } = useAppBootstrap();

  if (error) {
    return (
      <View style={styles.stateScreen}>
        <ThemedText type="title" style={styles.stateTitle}>
          SigmaMed
        </ThemedText>
        <ThemedText style={styles.stateMessage}>
          Falha ao preparar o banco local.
        </ThemedText>
        <ThemedText style={styles.stateDetail}>{error}</ThemedText>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.stateScreen}>
        <ActivityIndicator size="large" color="#0f6c73" />
        <ThemedText style={styles.stateMessage}>Preparando seu historico local...</ThemedText>
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
    backgroundColor: '#f4f7f8',
    paddingHorizontal: 24,
  },
  stateTitle: {
    color: '#17303a',
  },
  stateMessage: {
    textAlign: 'center',
    color: '#35515a',
  },
  stateDetail: {
    textAlign: 'center',
    color: '#6f858d',
  },
});
