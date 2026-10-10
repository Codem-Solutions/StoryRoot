import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/auth-provider';

export default function AuthIndex() {
  const { status } = useAuth();
  return <Redirect href={status === 'locked' ? '/(auth)/unlock' : '/(auth)/sign-in'} />;
}
