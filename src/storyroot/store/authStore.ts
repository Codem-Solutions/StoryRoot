import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Conta {
  id: string;
  nome: string;
  email: string;
  /** Hash simples local — não é criptografia real; não há backend por enquanto. */
  senhaHash: string;
  criadoEm: string;
}

interface ResultadoAuth {
  sucesso: boolean;
  erro?: string;
}

interface AuthState {
  contas: Conta[];
  usuarioAtualId: string | null;
  /**
   * true quando a identidade foi confirmada nesta execução do app (senha ou biometria).
   * Não é persistido: ao reabrir o app, quem tem biometria ativa precisa desbloquear.
   */
  sessaoVerificada: boolean;
  hasHydrated: boolean;

  cadastrar: (input: { nome: string; email: string; senha: string }) => ResultadoAuth;
  entrar: (input: { email: string; senha: string }) => ResultadoAuth;
  /** Entra numa conta já existente depois de a biometria do aparelho ser confirmada. */
  entrarComBiometria: (contaId: string) => ResultadoAuth;
  confirmarIdentidade: () => void;
  bloquearSessao: () => void;
  sair: () => void;
  redefinirSenha: (input: { email: string; novaSenha: string }) => ResultadoAuth;

  /** @internal usado pelo onRehydrateStorage */
  _setHasHydrated: (valor: boolean) => void;
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Hash simples e determinístico, só para não guardar a senha em texto puro localmente. */
function hashSenha(senha: string): string {
  let hash = 0;
  for (let i = 0; i < senha.length; i += 1) {
    hash = (hash << 5) - hash + senha.charCodeAt(i);
    hash |= 0;
  }
  return `h${hash}`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      contas: [],
      usuarioAtualId: null,
      sessaoVerificada: false,
      hasHydrated: false,

      cadastrar: ({ nome, email, senha }) => {
        const emailNormalizado = normalizarEmail(email);
        if (get().contas.some(c => c.email === emailNormalizado)) {
          return { sucesso: false, erro: 'Já existe uma conta com esse e-mail.' };
        }
        const novaConta: Conta = {
          id: String(Date.now()),
          nome: nome.trim(),
          email: emailNormalizado,
          senhaHash: hashSenha(senha),
          criadoEm: new Date().toISOString(),
        };
        set(state => ({
          contas: [...state.contas, novaConta],
          usuarioAtualId: novaConta.id,
          sessaoVerificada: true,
        }));
        return { sucesso: true };
      },

      entrar: ({ email, senha }) => {
        const emailNormalizado = normalizarEmail(email);
        const conta = get().contas.find(c => c.email === emailNormalizado);
        if (!conta || conta.senhaHash !== hashSenha(senha)) {
          return { sucesso: false, erro: 'E-mail ou senha incorretos.' };
        }
        set({ usuarioAtualId: conta.id, sessaoVerificada: true });
        return { sucesso: true };
      },

      entrarComBiometria: contaId => {
        if (!get().contas.some(c => c.id === contaId)) {
          return { sucesso: false, erro: 'Essa conta não está mais neste aparelho. Entre com sua senha.' };
        }
        set({ usuarioAtualId: contaId, sessaoVerificada: true });
        return { sucesso: true };
      },

      confirmarIdentidade: () => set({ sessaoVerificada: true }),

      bloquearSessao: () => set({ sessaoVerificada: false }),

      sair: () => set({ usuarioAtualId: null, sessaoVerificada: false }),

      redefinirSenha: ({ email, novaSenha }) => {
        const emailNormalizado = normalizarEmail(email);
        const existe = get().contas.some(c => c.email === emailNormalizado);
        if (!existe) {
          return { sucesso: false, erro: 'Não encontramos uma conta com esse e-mail.' };
        }
        set(state => ({
          contas: state.contas.map(c =>
            c.email === emailNormalizado ? { ...c, senhaHash: hashSenha(novaSenha) } : c,
          ),
        }));
        return { sucesso: true };
      },

      _setHasHydrated: valor => set({ hasHydrated: valor }),
    }),
    {
      name: 'storyroot-auth',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => state => {
        state?._setHasHydrated(true);
      },
      partialize: state => ({ contas: state.contas, usuarioAtualId: state.usuarioAtualId }),
    },
  ),
);
