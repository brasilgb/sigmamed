import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function TabLayout() {
  const selectedColorScheme = useColorScheme();
  const colorScheme = selectedColorScheme === 'dark' ? 'dark' : 'light';
  const insets = useSafeAreaInsets();
  const { isLoading, isUnlocked, user } = useAuth();

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
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].surface,
          borderTopColor: Colors[colorScheme].border,
          height: 68 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
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
  );
}
