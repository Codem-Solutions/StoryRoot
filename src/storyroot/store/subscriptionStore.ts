import { create } from 'zustand';
import { useCriancasDaConta } from './childStore';
import type { PlanoAssinatura } from '../types';

interface SubscriptionState {
  plano: PlanoAssinatura;
  definirPlano: (plano: PlanoAssinatura) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(set => ({
  plano: 'gratuito',
  definirPlano: plano => set({ plano }),
}));

/** Limite de crianças cadastradas por conta no plano gratuito; ilimitado no Premium. */
export const LIMITE_CRIANCAS_GRATUITO = 2;

export function usePodeAdicionarCrianca(): boolean {
  const plano = useSubscriptionStore(state => state.plano);
  const totalCriancas = useCriancasDaConta().length;
  return plano === 'premium' || totalCriancas < LIMITE_CRIANCAS_GRATUITO;
}
