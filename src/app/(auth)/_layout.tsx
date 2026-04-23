import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';

export default function AuthLayout() {
  const { hasAccount, isLoading, isUnlocked, user } = useAuth();

  if (isLoading) {
    return null;
  }

  if (hasAccount && user && isUnlocked) {
    return <Redirect href="/(tabs)" />;
  }

  if (hasAccount && user && !isUnlocked) {
    return <Redirect href="/unlock" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="register" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
