import { Redirect, Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoryRootBoot } from '@/storyroot/StoryRootBoot';
import { useAuthStore } from '@/storyroot/store/authStore';
import { useOnboardingConcluido } from '@/storyroot/store/childStore';

export default function StoryRootOnboardingLayout() {
  const usuarioAtualId = useAuthStore(state => state.usuarioAtualId);
  const onboardingConcluido = useOnboardingConcluido();

  if (!usuarioAtualId) {
    return <Redirect href="/(app)/storyroot-auth/login" />;
  }

  if (onboardingConcluido) {
    return <Redirect href="/(app)/storyroot-main/(tabs)/home" />;
  }

  return (
    <StoryRootBoot>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="cadastro-crianca" />
        </Stack>
      </SafeAreaProvider>
    </StoryRootBoot>
  );
}
