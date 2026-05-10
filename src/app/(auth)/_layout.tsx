import { Redirect, Stack, useSegments } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';

export default function AuthLayout() {
  const { hasAccount, isLoading, isUnlocked, user } = useAuth();
  const segments = useSegments();
  const isRegisterRoute = segments[segments.length - 1] === 'register';
  const isLoginRoute = segments[segments.length - 1] === 'login';
  const isSetupPinRoute = segments[segments.length - 1] === 'setup-pin';
  const isPasswordRecoveryRoute =
    segments[segments.length - 1] === 'forgot-password' ||
    segments[segments.length - 1] === 'reset-password';

  if (isLoading) {
    return null;
  }

  if (hasAccount && user && !user.hasPin && !isSetupPinRoute) {
    return <Redirect href="/(auth)/setup-pin" />;
  }

  if (hasAccount && user && isUnlocked && !isRegisterRoute && !isSetupPinRoute && !isPasswordRecoveryRoute) {
    return <Redirect href="/(tabs)" />;
  }

  if (hasAccount && user && user.hasPin && !isUnlocked && !isLoginRoute && !isPasswordRecoveryRoute) {
    return <Redirect href="/unlock" />;
  }

  return (
    <Stack screenOptions={{ animation: 'fade_from_bottom', headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="register" />
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="setup-pin" />
    </Stack>
  );
}
