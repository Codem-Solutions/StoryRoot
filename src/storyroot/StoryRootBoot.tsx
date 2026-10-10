import {
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts as useInterFonts,
} from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts as usePlusJakartaSansFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useEffect, useRef, type PropsWithChildren } from 'react';

import { StoryRootToast } from './StoryRootToast';

import { AppLoadingScreen } from './components/AppLoadingScreen';
import { SegurancaGate } from './components/SegurancaGate';
import { useAlimentosStore } from './store/alimentosStore';
import { useAuthStore } from './store/authStore';
import { useChildStore } from './store/childStore';
import { useMemoriesStore } from './store/memoriesStore';
import { useRecordsStore } from './store/recordsStore';
import { useSegurancaStore } from './store/segurancaStore';
import { useVacinasStore } from './store/vacinasStore';
import { useAberturaPorNotificacao } from './utils/aberturaPorNotificacao';

export function StoryRootBoot({ children }: PropsWithChildren) {
  const [interLoaded] = useInterFonts({
    Inter_800ExtraBold,
    Inter_900Black,
  });
  const [jakartaLoaded] = usePlusJakartaSansFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const usuarioAtualId = useAuthStore(state => state.usuarioAtualId);
  const authHydrated = useAuthStore(state => state.hasHydrated);
  const criancaHydrated = useChildStore(state => state.hasHydrated);
  const memoriasHydrated = useMemoriesStore(state => state.hasHydrated);
  const registrosHydrated = useRecordsStore(state => state.hasHydrated);
  const alimentosHydrated = useAlimentosStore(state => state.hasHydrated);
  const segurancaHydrated = useSegurancaStore(state => state.hasHydrated);
  const vacinasHydrated = useVacinasStore(state => state.hasHydrated);
  const setContaAtiva = useChildStore(state => state.setContaAtiva);

  useAberturaPorNotificacao();

  const fontsReady = interLoaded && jakartaLoaded;
  const storesReady =
    authHydrated &&
    criancaHydrated &&
    memoriasHydrated &&
    registrosHydrated &&
    alimentosHydrated &&
    segurancaHydrated &&
    vacinasHydrated;

  const migracaoFeita = useRef(false);

  useEffect(() => {
    setContaAtiva(usuarioAtualId);
  }, [setContaAtiva, usuarioAtualId]);

  useEffect(() => {
    if (!storesReady || migracaoFeita.current) return;
    migracaoFeita.current = true;
    const { criancas } = useChildStore.getState();
    if (criancas.length === 1) {
      useRecordsStore.getState().backfillCriancaId(criancas[0].id);
      useMemoriesStore.getState().backfillCriancaId(criancas[0].id);
    }
  }, [storesReady]);

  if (!fontsReady || !storesReady) {
    return <AppLoadingScreen />;
  }

  return (
    <>
      <SegurancaGate>{children}</SegurancaGate>
      <StoryRootToast />
    </>
  );
}
