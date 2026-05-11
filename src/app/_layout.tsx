import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
  useFonts,
} from '@expo-google-fonts/poppins';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BrandPalette, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/features/auth/hooks/use-auth';
import { MedicationService } from '@/features/medications/services/medication.service';
import {
  configureMedicationNotifications,
  MEDICATION_REMINDER_NOTIFICATION_KIND,
} from '@/features/medications/services/medication-reminder.service';
import { useAppBootstrap } from '@/hooks/use-app-bootstrap';

const medicationService = new MedicationService();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isReady, error } = useAppBootstrap();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });
  const activeTheme = colorScheme ?? 'light';
  const lastHandledNotificationIdRef = useRef<string | null>(null);

  useEffect(() => {
    configureMedicationNotifications();
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    medicationService.syncReminders().catch(() => null);
  }, [isReady]);

  useEffect(() => {
    if (!isReady || !fontsLoaded) {
      return;
    }

    function openMedicationReminder(response: Notifications.NotificationResponse | null | undefined) {
      const notification = response?.notification;

      if (!notification) {
        return;
      }

      const notificationId = notification.request.identifier;

      if (lastHandledNotificationIdRef.current === notificationId) {
        return;
      }

      if (notification.request.content.data?.kind !== MEDICATION_REMINDER_NOTIFICATION_KIND) {
        return;
      }

      lastHandledNotificationIdRef.current = notificationId;
      router.push('/(tabs)/medications');
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(openMedicationReminder);

    Notifications.getLastNotificationResponseAsync()
      .then(openMedicationReminder)
      .catch(() => null);

    return () => {
      subscription.remove();
    };
  }, [fontsLoaded, isReady]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    NavigationBar.setStyle(activeTheme === 'dark' ? 'light' : 'dark');
  }, [activeTheme]);

  if (error) {
    return (
      <View style={[styles.stateScreen, { backgroundColor: Colors[activeTheme].background }]}>
        <ThemedText type="title" style={[styles.stateTitle, { color: Colors[activeTheme].text }]}>
          Meu Controle
        </ThemedText>
        <ThemedText style={[styles.stateMessage, { color: Colors[activeTheme].textMuted }]}>
          Falha ao preparar o banco local.
        </ThemedText>
        <ThemedText style={[styles.stateDetail, { color: Colors[activeTheme].textSoft }]}>{error}</ThemedText>
      </View>
    );
  }

  if (!isReady || !fontsLoaded) {
    return (
      <View style={[styles.stateScreen, { backgroundColor: Colors[activeTheme].background }]}>
        <View style={[styles.loadingCard, { backgroundColor: Colors[activeTheme].surface }]}>
          <ActivityIndicator size="large" color={Colors[activeTheme].tint} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <Stack screenOptions={{ animation: 'fade_from_bottom', headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="unlock" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="profiles" />
            <Stack.Screen name="profile-form" />
            <Stack.Screen name="cloud-sync" />
            <Stack.Screen name="help" />
            <Stack.Screen name="privacy" />
          </Stack>
        </AuthProvider>
        <StatusBar
          style={activeTheme === 'dark' ? 'light' : 'dark'}
          backgroundColor={Colors[activeTheme].background}
        />
      </ThemeProvider>
    </SafeAreaProvider>
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
  loadingCard: {
    width: 104,
    height: 104,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BrandPalette.deepNavy,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 4,
  },
  stateMessage: {
    textAlign: 'center',
  },
  stateDetail: {
    textAlign: 'center',
  },
});
