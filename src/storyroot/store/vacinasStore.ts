import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { RegistroVacina } from '../types';

interface VacinasState {
  registros: RegistroVacina[];
  hasHydrated: boolean;
  /** Cria ou substitui o registro com o mesmo `id`. */
  salvarRegistro: (registro: RegistroVacina) => void;
  /** Salva vários registros de uma vez (ex.: marcar um grupo de idade como aplicado). */
  salvarRegistros: (registros: RegistroVacina[]) => void;
  removerRegistro: (id: string) => void;
  removerVacinasDaCrianca: (criancaId: string) => void;
  /** @internal usado pelo onRehydrateStorage */
  _setHasHydrated: (valor: boolean) => void;
}

/** Id estável do registro de uma vacina do calendário oficial para uma criança. */
export function idRegistroCalendario(criancaId: string, vacinaId: string): string {
  return `${criancaId}:${vacinaId}`;
}

export const useVacinasStore = create<VacinasState>()(
  persist(
    (set, get) => ({
      registros: [],
      hasHydrated: false,
      salvarRegistro: registro => get().salvarRegistros([registro]),
      salvarRegistros: novos => {
        const ids = new Set(novos.map(r => r.id));
        set({ registros: [...get().registros.filter(r => !ids.has(r.id)), ...novos] });
      },
      removerRegistro: id => set({ registros: get().registros.filter(r => r.id !== id) }),
      removerVacinasDaCrianca: criancaId =>
        set({ registros: get().registros.filter(r => r.criancaId !== criancaId) }),
      _setHasHydrated: valor => set({ hasHydrated: valor }),
    }),
    {
      name: 'storyroot-vacinas',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => state => {
        state?._setHasHydrated(true);
      },
      partialize: state => ({ registros: state.registros }),
    },
  ),
);
