import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ALIMENTOS_SEED } from '../constants/alimentos';
import type { Alimento } from '../types';

interface AlimentosState {
  alimentos: Alimento[];
  /** Nº de vezes que cada alimento foi usado em um registro, por criança. */
  usoContagem: Record<string, Record<string, number>>;
  favoritos: string[];
  hasHydrated: boolean;

  registrarUso: (criancaId: string, alimentoId: string) => void;
  toggleFavorito: (alimentoId: string) => void;

  /** @internal usado pelo onRehydrateStorage */
  _setHasHydrated: (valor: boolean) => void;
}

export const useAlimentosStore = create<AlimentosState>()(
  persist(
    (set, get) => ({
      alimentos: ALIMENTOS_SEED,
      usoContagem: {},
      favoritos: [],
      hasHydrated: false,

      registrarUso: (criancaId, alimentoId) =>
        set(state => {
          const doCrianca = { ...(state.usoContagem[criancaId] ?? {}) };
          doCrianca[alimentoId] = (doCrianca[alimentoId] ?? 0) + 1;
          return { usoContagem: { ...state.usoContagem, [criancaId]: doCrianca } };
        }),

      toggleFavorito: alimentoId =>
        set(state => ({
          favoritos: state.favoritos.includes(alimentoId)
            ? state.favoritos.filter(id => id !== alimentoId)
            : [...state.favoritos, alimentoId],
        })),

      _setHasHydrated: valor => set({ hasHydrated: valor }),
    }),
    {
      name: 'storyroot-alimentos',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      /**
       * Faz merge append-only da base padrão: alimentos novos adicionados em
       * versões futuras do app entram automaticamente, sem apagar o uso/favoritos
       * já registrados pelo usuário nem alimentos que ele desativou.
       */
      migrate: (persistedState: any) => {
        const existentes: Alimento[] = persistedState?.alimentos ?? [];
        const idsExistentes = new Set(existentes.map(a => a.id));
        const novos = ALIMENTOS_SEED.filter(a => !idsExistentes.has(a.id));
        return {
          ...persistedState,
          alimentos: [...existentes, ...novos],
        };
      },
      onRehydrateStorage: () => state => {
        state?._setHasHydrated(true);
      },
      partialize: state => ({
        alimentos: state.alimentos,
        usoContagem: state.usoContagem,
        favoritos: state.favoritos,
      }),
    },
  ),
);

export function alimentosAtivos(): Alimento[] {
  return useAlimentosStore.getState().alimentos.filter(a => a.ativo);
}

export function buscarAlimentoPorId(alimentoId: string): Alimento | undefined {
  return useAlimentosStore.getState().alimentos.find(a => a.id === alimentoId);
}
