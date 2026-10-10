import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';

interface SegurancaState {
  /** Contas (por id) que ativaram a entrada por biometria neste aparelho. */
  biometriaPorConta: Record<string, boolean>;
  /** Contas que já receberam o pedido automático de biometria e notificações. */
  permissoesOferecidasPorConta: Record<string, boolean>;
  /** Última conta que ativou a biometria — usada pelo botão de biometria no login. */
  contaBiometriaId: string | null;
  hasHydrated: boolean;

  setBiometriaAtiva: (contaId: string, ativa: boolean) => void;
  marcarPermissoesOferecidas: (contaId: string) => void;

  /** @internal usado pelo onRehydrateStorage */
  _setHasHydrated: (valor: boolean) => void;
}

export const useSegurancaStore = create<SegurancaState>()(
  persist(
    set => ({
      biometriaPorConta: {},
      permissoesOferecidasPorConta: {},
      contaBiometriaId: null,
      hasHydrated: false,

      setBiometriaAtiva: (contaId, ativa) =>
        set(state => ({
          biometriaPorConta: { ...state.biometriaPorConta, [contaId]: ativa },
          contaBiometriaId: ativa
            ? contaId
            : state.contaBiometriaId === contaId
              ? null
              : state.contaBiometriaId,
        })),

      marcarPermissoesOferecidas: contaId =>
        set(state => ({
          permissoesOferecidasPorConta: { ...state.permissoesOferecidasPorConta, [contaId]: true },
        })),

      _setHasHydrated: valor => set({ hasHydrated: valor }),
    }),
    {
      name: 'storyroot-seguranca',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => state => {
        state?._setHasHydrated(true);
      },
      partialize: state => ({
        biometriaPorConta: state.biometriaPorConta,
        permissoesOferecidasPorConta: state.permissoesOferecidasPorConta,
        contaBiometriaId: state.contaBiometriaId,
      }),
    },
  ),
);

/** Biometria ativa para a conta logada. */
export function useBiometriaAtiva(): boolean {
  const usuarioAtualId = useAuthStore(state => state.usuarioAtualId);
  return useSegurancaStore(state => !!usuarioAtualId && !!state.biometriaPorConta[usuarioAtualId]);
}
