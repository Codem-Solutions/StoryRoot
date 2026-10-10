import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Memoria } from '../types';

interface MemoriesState {
  memorias: Memoria[];
  hasHydrated: boolean;
  adicionarMemoria: (memoria: Memoria) => void;
  removerMemoria: (id: string) => void;
  /** Ao remover uma criança: apaga as memórias das quais ela era dona, e apenas desvincula das compartilhadas. */
  removerOuDesvincularMemoriasDaCrianca: (criancaId: string) => void;
  /** Atribui `criancaId` a memórias antigas que ainda não têm (migração única no startup). */
  backfillCriancaId: (criancaId: string) => void;
  /** @internal usado pelo onRehydrateStorage */
  _setHasHydrated: (valor: boolean) => void;
}

export const useMemoriesStore = create<MemoriesState>()(
  persist(
    (set, get) => ({
      memorias: [],
      hasHydrated: false,
      adicionarMemoria: memoria =>
        set({ memorias: [memoria, ...get().memorias] }),
      removerMemoria: id =>
        set({ memorias: get().memorias.filter(m => m.id !== id) }),
      removerOuDesvincularMemoriasDaCrianca: criancaId =>
        set({
          memorias: get()
            .memorias.filter(m => m.criancaId !== criancaId)
            .map(m =>
              m.criancaIdsCompartilhado?.includes(criancaId)
                ? {
                    ...m,
                    criancaIdsCompartilhado: m.criancaIdsCompartilhado.filter(
                      id => id !== criancaId,
                    ),
                  }
                : m,
            ),
        }),
      backfillCriancaId: criancaId =>
        set({
          memorias: get().memorias.map(m => (m.criancaId ? m : { ...m, criancaId })),
        }),
      _setHasHydrated: valor => set({ hasHydrated: valor }),
    }),
    {
      name: 'storyroot-memorias',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => state => {
        state?._setHasHydrated(true);
      },
      partialize: state => ({ memorias: state.memorias }),
    },
  ),
);
