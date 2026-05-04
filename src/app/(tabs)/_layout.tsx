import { Redirect, Tabs } from 'expo-router';
import React from 'react';
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
          tabBarStyle: {
            backgroundColor: Colors[colorScheme].surface,
            borderTopColor: 'transparent',
            borderTopWidth: 0,
            height: 58 + insets.bottom,
            marginHorizontal: 14,
            marginBottom: Math.max(insets.bottom, 8),
            paddingTop: 4,
            paddingBottom: Math.max(insets.bottom, 4),
            borderRadius: 24,
            position: 'absolute',
            shadowColor: BrandPalette.deepNavy,
            shadowOpacity: 0.14,
            shadowRadius: 18,
            shadowOffset: {
              width: 0,
              height: 8,
            },
            elevation: 14,
          },
          tabBarItemStyle: {
            height: 48,
            borderRadius: 20,
            marginHorizontal: 2,
            paddingVertical: 2,
            alignItems: 'center',
            justifyContent: 'center',
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '800',
            marginTop: -2,
            marginBottom: 2,
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
