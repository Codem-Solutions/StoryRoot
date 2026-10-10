import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="storyroot-auth" />
      <Stack.Screen name="storyroot-onboarding" />
      <Stack.Screen name="storyroot-main" />
    </Stack>
  );
}
