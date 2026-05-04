import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { CloudReminderModal } from '@/components/cloud-reminder-modal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BrandPalette, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useBillingSyncAccess } from '@/hooks/use-billing-sync-access';

export default function TabLayout() {
  const selectedColorScheme = useColorScheme();
  const colorScheme = selectedColorScheme === 'dark' ? 'dark' : 'light';
  const insets = useSafeAreaInsets();
  const tabBarHorizontalInset = 22;
  const tabBarBottomOffset = Math.max(insets.bottom - 16, 10);
  const { isLoading, isUnlocked, user } = useAuth();

  useBillingSyncAccess({ enabled: Boolean(user && isUnlocked) });

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!isUnlocked) {
    return <Redirect href="/unlock" />;
  }

  return (
    <>
      <CloudReminderModal enabled={Boolean(user && isUnlocked)} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: BrandPalette.primary,
          tabBarInactiveTintColor: Colors[colorScheme].textSoft,
          tabBarInactiveBackgroundColor: 'transparent',
          tabBarStyle: {
            backgroundColor: Colors[colorScheme].surface,
            borderColor: Colors[colorScheme].border,
            borderTopWidth: 1,
            borderWidth: 1,
            bottom: tabBarBottomOffset,
            height: 68,
            left: tabBarHorizontalInset,
            paddingHorizontal: 8,
            paddingTop: 7,
            paddingBottom: 7,
            position: 'absolute',
            right: tabBarHorizontalInset,
            borderRadius: 28,
            shadowColor: BrandPalette.deepNavy,
            shadowOpacity: colorScheme === 'dark' ? 0.28 : 0.12,
            shadowRadius: 24,
            shadowOffset: {
              width: 0,
              height: 12,
            },
            elevation: 10,
            ...Platform.select({
              android: {
                overflow: 'hidden',
              },
            }),
          },
          tabBarItemStyle: {
            height: 54,
            borderRadius: 20,
            marginHorizontal: 1,
            paddingVertical: 4,
            alignItems: 'center',
            justifyContent: 'center',
          },
          tabBarIconStyle: {
            marginTop: 1,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '800',
            marginTop: -2,
            marginBottom: 0,
          },
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="pressure"
          options={{
            title: 'Pressão',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="waveform.path.ecg" color={color} />,
          }}
        />
        <Tabs.Screen
          name="glicose"
          options={{
            title: 'Glicose',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="drop.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="weight"
          options={{
            title: 'Peso',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="scalemass.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="medications"
          options={{
            title: 'Medicação',
            tabBarIcon: ({ color }) => <IconSymbol size={24} name="pills.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}
