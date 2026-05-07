import { Redirect, Stack, useSegments } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';

export default function AuthLayout() {
  const { hasAccount, isLoading, isUnlocked, user } = useAuth();
  const segments = useSegments();
  const isRegisterRoute = segments[segments.length - 1] === 'register';

  if (isLoading) {
    return null;
  }

  if (hasAccount && user && isUnlocked && !isRegisterRoute) {
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
