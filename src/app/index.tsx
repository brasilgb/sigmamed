import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/use-auth';

export default function IndexScreen() {
  const { hasAccount, isLoading, isUnlocked, user } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!hasAccount || !user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!isUnlocked) {
    return <Redirect href="/unlock" />;
  }

  return <Redirect href="/(tabs)" />;
}
