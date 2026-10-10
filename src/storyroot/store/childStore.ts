import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Crianca, ResponsavelLocal, SexoCrianca } from '../types';

interface ChildState {
  responsavel: ResponsavelLocal;
  criancas: Crianca[];
  contaAtivaId: string | null;
  criancaAtivaId: string | null;
  /** IDs de conta que já passaram pela lista "cadastrar mais uma criança / continuar" do onboarding. */
  contasOnboardingConcluido: string[];
  hasHydrated: boolean;

  adicionarCrianca: (input: {
    nome: string;
    dataNascimento: string;
    sexo: SexoCrianca;
    fotoUri?: string;
  }) => Crianca;
  atualizarCrianca: (
    id: string,
    patch: Partial<Pick<Crianca, 'nome' | 'dataNascimento' | 'sexo' | 'fotoUri'>>,
  ) => void;
  removerCrianca: (id: string) => void;
  setContaAtiva: (contaId: string | null) => void;
  selecionarCriancaAtiva: (id: string) => void;
  vincularIrmaos: (idA: string, idB: string) => void;
  desvincularIrmaos: (idA: string, idB: string) => void;
  concluirOnboarding: () => void;

  /** @internal usado pelo onRehydrateStorage */
  _setHasHydrated: (valor: boolean) => void;
}

function criarResponsavelLocal(): ResponsavelLocal {
  return { id: `local-${Date.now()}`, criadoEm: new Date().toISOString() };
}

export const useChildStore = create<ChildState>()(
  persist(
    (set, get) => ({
      responsavel: criarResponsavelLocal(),
      criancas: [],
      contaAtivaId: null,
      criancaAtivaId: null,
      contasOnboardingConcluido: [],
      hasHydrated: false,

      adicionarCrianca: ({ nome, dataNascimento, sexo, fotoUri }) => {
        const contaAtivaId = get().contaAtivaId ?? get().responsavel.id;
        const criancasDaConta = get().criancas.filter(c => c.responsavelId === contaAtivaId);
        const eraPrimeira = criancasDaConta.length === 0;
        const nova: Crianca = {
          id: String(Date.now()),
          responsavelId: contaAtivaId,
          nome,
          dataNascimento,
          sexo,
          fotoUri,
          irmaosIds: [],
          criadoEm: new Date().toISOString(),
        };
        set(state => ({
          criancas: [...state.criancas, nova],
          criancaAtivaId:
            eraPrimeira || !state.criancaAtivaId ? nova.id : state.criancaAtivaId,
        }));
        return nova;
      },

      atualizarCrianca: (id, patch) =>
        set(state => ({
          criancas: state.criancas.map(c => {
            if (c.id !== id) return c;
            if (state.contaAtivaId && c.responsavelId !== state.contaAtivaId) return c;
            return { ...c, ...patch };
          }),
        })),

      removerCrianca: id =>
        set(state => {
          const alvo = state.criancas.find(c => c.id === id);
          if (!alvo) return state;
          if (state.contaAtivaId && alvo.responsavelId !== state.contaAtivaId) return state;

          const criancas = state.criancas
            .filter(c => c.id !== id)
            .map(c =>
              c.irmaosIds.includes(id)
                ? { ...c, irmaosIds: c.irmaosIds.filter(irmaoId => irmaoId !== id) }
                : c,
            );
          const criancaAtivaId =
            state.criancaAtivaId === id ? (criancas[0]?.id ?? null) : state.criancaAtivaId;
          return { criancas, criancaAtivaId };
        }),

      setContaAtiva: contaId =>
        set(state => {
          if (!contaId) {
            return { contaAtivaId: null, criancaAtivaId: null };
          }

          const criancasDaConta = state.criancas.filter(c => c.responsavelId === contaId);
          const ativaPertenceConta = criancasDaConta.some(c => c.id === state.criancaAtivaId);
          return {
            contaAtivaId: contaId,
            criancaAtivaId: ativaPertenceConta
              ? state.criancaAtivaId
              : (criancasDaConta[0]?.id ?? null),
          };
        }),

      selecionarCriancaAtiva: id =>
        set(state => {
          const encontrada = state.criancas.find(c => c.id === id);
          if (!encontrada) return state;
          if (state.contaAtivaId && encontrada.responsavelId !== state.contaAtivaId) return state;
          return { criancaAtivaId: id };
        }),

      vincularIrmaos: (idA, idB) => {
        if (idA === idB) return;
        set(state => {
          if (!state.criancas.some(c => c.id === idA) || !state.criancas.some(c => c.id === idB)) {
            return state;
          }
          return {
            criancas: state.criancas.map(c => {
              if (c.id === idA && !c.irmaosIds.includes(idB)) {
                return { ...c, irmaosIds: [...c.irmaosIds, idB] };
              }
              if (c.id === idB && !c.irmaosIds.includes(idA)) {
                return { ...c, irmaosIds: [...c.irmaosIds, idA] };
              }
              return c;
            }),
          };
        });
      },

      desvincularIrmaos: (idA, idB) =>
        set(state => ({
          criancas: state.criancas.map(c => {
            if (c.id === idA) return { ...c, irmaosIds: c.irmaosIds.filter(x => x !== idB) };
            if (c.id === idB) return { ...c, irmaosIds: c.irmaosIds.filter(x => x !== idA) };
            return c;
          }),
        })),

      concluirOnboarding: () =>
        set(state => {
          const contaId = state.contaAtivaId ?? state.responsavel.id;
          if (state.contasOnboardingConcluido.includes(contaId)) return state;
          return { contasOnboardingConcluido: [...state.contasOnboardingConcluido, contaId] };
        }),

      _setHasHydrated: valor => set({ hasHydrated: valor }),
    }),
    {
      name: 'storyroot-crianca',
      storage: createJSONStorage(() => AsyncStorage),
      version: 4,
      migrate: (persistedState: any, version) => {
        let state = persistedState;
        if (version < 2) {
          const antiga = state as {
            crianca?: {
              id: string;
              nome: string;
              dataNascimento: string;
              fotoUri?: string;
            } | null;
          };
          const responsavel = criarResponsavelLocal();
          const criancas: Omit<Crianca, 'sexo'>[] = antiga?.crianca
            ? [
                {
                  ...antiga.crianca,
                  responsavelId: responsavel.id,
                  irmaosIds: [],
                  criadoEm: new Date().toISOString(),
                },
              ]
            : [];
          state = {
            responsavel,
            criancas,
            criancaAtivaId: criancas[0]?.id ?? null,
            hasHydrated: false,
          };
        }
        if (version < 3) {
          // `sexo` passou a ser obrigatório para as curvas de crescimento; crianças
          // já cadastradas ficam com um valor padrão até o responsável corrigir na edição.
          state = {
            ...state,
            criancas: (state.criancas ?? []).map((c: any) => (c.sexo ? c : { ...c, sexo: 'menino' })),
          };
        }
        if (version < 4) {
          // A lista "cadastrar mais uma criança / continuar" do onboarding é nova; quem já
          // tinha crianças cadastradas antes dela existir já passou pelo cadastro, então marca
          // a conta como onboarding concluído para não mandar esses usuários de volta pra tela
          // de cadastro no próximo login.
          const responsavelIdsComCrianca: string[] = Array.from(
            new Set((state.criancas ?? []).map((c: any) => c.responsavelId)),
          );
          state = {
            ...state,
            contasOnboardingConcluido: responsavelIdsComCrianca,
          };
        }
        return state;
      },
      onRehydrateStorage: () => state => {
        state?._setHasHydrated(true);
      },
      partialize: state => ({
        responsavel: state.responsavel,
        criancas: state.criancas,
        contaAtivaId: state.contaAtivaId,
        criancaAtivaId: state.criancaAtivaId,
        contasOnboardingConcluido: state.contasOnboardingConcluido,
      }),
    },
  ),
);

export function useCriancasDaConta(): Crianca[] {
  const criancas = useChildStore(s => s.criancas);
  const contaAtivaId = useChildStore(s => s.contaAtivaId);
  return useMemo(
    () => (contaAtivaId ? criancas.filter(c => c.responsavelId === contaAtivaId) : []),
    [criancas, contaAtivaId],
  );
}

export function useOnboardingConcluido(): boolean {
  return useChildStore(s => !!s.contaAtivaId && s.contasOnboardingConcluido.includes(s.contaAtivaId));
}

export function useCriancaAtiva(): Crianca | undefined {
  return useChildStore(s => {
    const criancasDaConta = s.contaAtivaId
      ? s.criancas.filter(c => c.responsavelId === s.contaAtivaId)
      : [];
    return criancasDaConta.find(c => c.id === s.criancaAtivaId);
  });
}
