import { Redirect, Stack } from 'expo-router';

import { StoryRootBoot } from '@/storyroot/StoryRootBoot';
import { useAuthStore } from '@/storyroot/store/authStore';
import { useOnboardingConcluido } from '@/storyroot/store/childStore';

export default function StoryRootMainLayout() {
  const usuarioAtualId = useAuthStore(state => state.usuarioAtualId);
  const onboardingConcluido = useOnboardingConcluido();

  if (!usuarioAtualId) {
    return <Redirect href="/(app)/storyroot-auth/login" />;
  }

  if (!onboardingConcluido) {
    return (
      <Redirect
        href={{
          pathname: '/(app)/storyroot-onboarding/cadastro-crianca',
          params: { mode: 'onboarding' },
        }}
      />
    );
  }

  return (
    <StoryRootBoot>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="registrar" options={{ presentation: 'transparentModal' }} />
        <Stack.Screen name="audio-recorder" options={{ presentation: 'transparentModal' }} />
        <Stack.Screen name="video-trim" options={{ presentation: 'transparentModal' }} />
        <Stack.Screen name="photo-preview" options={{ presentation: 'transparentModal' }} />
        <Stack.Screen name="selecionar-crianca" options={{ presentation: 'transparentModal' }} />
        <Stack.Screen name="adicionar-crianca" options={{ presentation: 'modal' }} />
        <Stack.Screen name="editar-crianca" options={{ presentation: 'modal' }} />
        <Stack.Screen name="premium" options={{ presentation: 'modal' }} />
        <Stack.Screen name="notificacoes" />
        <Stack.Screen name="caderneta-vacinas" />
        <Stack.Screen name="registro-saude" />
      </Stack>
    </StoryRootBoot>
  );
}
