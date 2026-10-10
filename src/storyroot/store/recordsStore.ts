import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Registro } from '../types';

interface RecordsState {
  registros: Registro[];
  hasHydrated: boolean;
  adicionarRegistro: (registro: Registro) => void;
  atualizarRegistro: (id: string, patch: Partial<Registro>) => void;
  removerRegistro: (id: string) => void;
  removerRegistrosDaCrianca: (criancaId: string) => void;
  /** Atribui `criancaId` a registros antigos que ainda não têm (migração única no startup). */
  backfillCriancaId: (criancaId: string) => void;
  /** @internal usado pelo onRehydrateStorage */
  _setHasHydrated: (valor: boolean) => void;
}

export const useRecordsStore = create<RecordsState>()(
  persist(
    (set, get) => ({
      registros: [],
      hasHydrated: false,
      adicionarRegistro: registro =>
        set({ registros: [registro, ...get().registros] }),
      atualizarRegistro: (id, patch) =>
        set({
          registros: get().registros.map(r => (r.id === id ? { ...r, ...patch } : r)),
        }),
      removerRegistro: id =>
        set({ registros: get().registros.filter(r => r.id !== id) }),
      removerRegistrosDaCrianca: criancaId =>
        set({ registros: get().registros.filter(r => r.criancaId !== criancaId) }),
      backfillCriancaId: criancaId =>
        set({
          registros: get().registros.map(r => (r.criancaId ? r : { ...r, criancaId })),
        }),
      _setHasHydrated: valor => set({ hasHydrated: valor }),
    }),
    {
      name: 'storyroot-registros',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => state => {
        state?._setHasHydrated(true);
      },
      partialize: state => ({ registros: state.registros }),
    },
  ),
);
