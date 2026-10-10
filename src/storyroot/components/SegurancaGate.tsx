import { Fingerprint, ScanFace } from 'lucide-react-native';
import React, { useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useBiometriaAtiva, useSegurancaStore } from '../store/segurancaStore';
import { colors, radius, spacing, typography } from '../theme';
import {
  autenticarComBiometria,
  obterCapacidadeBiometria,
  type CapacidadeBiometria,
} from '../utils/biometria';
import { solicitarPermissaoNotificacao } from '../utils/notifications';
import { showSaveSuccessToast } from '../utils/toast';
import { PrimaryButton } from './PrimaryButton';
import { StoryRootLogo } from './StoryRootLogo';

/** Tempo em segundo plano depois do qual o app volta a pedir a biometria. */
const TEMPO_PARA_BLOQUEAR_MS = 2 * 60 * 1000;
/** Pequena espera para a tela inicial aparecer antes dos pedidos nativos. */
const ATRASO_PRIMEIRO_ACESSO_MS = 800;

/**
 * Protege a área logada:
 * - com biometria ativa, pede digital/rosto ao abrir o app e ao voltar dele
 *   depois de {@link TEMPO_PARA_BLOQUEAR_MS};
 * - no primeiro acesso de cada conta, aciona os pedidos nativos de biometria e
 *   de notificações.
 */
export function SegurancaGate({ children }: PropsWithChildren) {
  const sessaoVerificada = useAuthStore(state => state.sessaoVerificada);
  const biometriaAtiva = useBiometriaAtiva();
  const bloqueado = biometriaAtiva && !sessaoVerificada;

  useBloqueioAoVoltar(biometriaAtiva);
  usePermissoesPrimeiroAcesso(!bloqueado);

  return (
    <>
      <View
        style={styles.flex}
        importantForAccessibility={bloqueado ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={bloqueado}>
        {children}
      </View>
      <Modal visible={bloqueado} animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
        <TelaBloqueio />
      </Modal>
    </>
  );
}

function useBloqueioAoVoltar(biometriaAtiva: boolean) {
  useEffect(() => {
    if (!biometriaAtiva) return;
    let saiuEm: number | null = null;
    const assinatura = AppState.addEventListener('change', estado => {
      if (estado === 'background') {
        saiuEm = Date.now();
      } else if (estado === 'active' && saiuEm !== null) {
        if (Date.now() - saiuEm >= TEMPO_PARA_BLOQUEAR_MS) {
          useAuthStore.getState().bloquearSessao();
        }
        saiuEm = null;
      }
    });
    return () => assinatura.remove();
  }, [biometriaAtiva]);
}

function usePermissoesPrimeiroAcesso(liberado: boolean) {
  const usuarioAtualId = useAuthStore(state => state.usuarioAtualId);
  const jaOferecido = useSegurancaStore(
    state => !!usuarioAtualId && !!state.permissoesOferecidasPorConta[usuarioAtualId],
  );

  useEffect(() => {
    if (!usuarioAtualId || !liberado || jaOferecido) return;
    const contaId = usuarioAtualId;
    const timer = setTimeout(() => {
      useSegurancaStore.getState().marcarPermissoesOferecidas(contaId);
      void (async () => {
        await oferecerBiometria(contaId);
        await solicitarPermissaoNotificacao().catch(() => false);
      })();
    }, ATRASO_PRIMEIRO_ACESSO_MS);
    return () => clearTimeout(timer);
  }, [usuarioAtualId, liberado, jaOferecido]);
}

async function oferecerBiometria(contaId: string) {
  const { biometriaPorConta, setBiometriaAtiva } = useSegurancaStore.getState();
  if (biometriaPorConta[contaId]) return;
  const capacidade = await obterCapacidadeBiometria();
  if (!capacidade.temHardware || !capacidade.cadastrada) return;

  const confirmou = await autenticarComBiometria(`Entrar com ${capacidade.rotulo}?`, {
    subtitulo: 'Confirme agora para entrar no Story Root sem digitar a senha.',
    cancelar: 'Agora não',
  });
  if (confirmou) {
    setBiometriaAtiva(contaId, true);
    showSaveSuccessToast(`Entrada com ${capacidade.rotulo} ativada`);
  }
}

/** Montada só enquanto o Modal está visível, então cada bloqueio começa do zero. */
function TelaBloqueio() {
  const insets = useSafeAreaInsets();
  const confirmarIdentidade = useAuthStore(state => state.confirmarIdentidade);
  const sair = useAuthStore(state => state.sair);
  const [rotulo, setRotulo] = useState('biometria');
  const [facial, setFacial] = useState(false);
  // Começa verificando: o pedido de biometria abre assim que a tela monta.
  const [verificando, setVerificando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);

  const desbloquear = useCallback(async (capacidade: CapacidadeBiometria) => {
    setRotulo(capacidade.rotulo);
    setFacial(capacidade.facial);
    if (!capacidade.temHardware || !capacidade.cadastrada) {
      setVerificando(false);
      setAviso('Nenhuma digital ou rosto cadastrado no aparelho. Entre com sua senha.');
      return;
    }
    const confirmou = await autenticarComBiometria('Desbloquear o Story Root');
    setVerificando(false);
    if (confirmou) {
      confirmarIdentidade();
    } else {
      setAviso('Não foi possível confirmar sua identidade.');
    }
  }, [confirmarIdentidade]);

  useEffect(() => {
    void obterCapacidadeBiometria().then(desbloquear);
  }, [desbloquear]);

  function tentarNovamente() {
    setVerificando(true);
    setAviso(null);
    void obterCapacidadeBiometria().then(desbloquear);
  }

  const Icone = facial ? ScanFace : Fingerprint;

  return (
    <View
      style={[
        styles.bloqueio,
        { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom + spacing.xxl },
      ]}>
      <View style={styles.bloqueioTopo}>
        <View style={styles.logoIcon}>
          <StoryRootLogo size={32} variant="markOnPrimary" />
        </View>
        <Text style={[typography.h2, styles.centro]}>Story Root bloqueado</Text>
        <Text style={[typography.body, styles.textoSecundario]}>
          Use sua {rotulo} para continuar.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.iconeBotao}
        onPress={tentarNovamente}
        disabled={verificando}
        accessibilityRole="button"
        accessibilityLabel={`Desbloquear com ${rotulo}`}>
        <Icone size={48} color={colors.primary} />
      </TouchableOpacity>

      <View style={styles.bloqueioRodape}>
        {!!aviso && <Text style={styles.aviso}>{aviso}</Text>}
        <PrimaryButton
          label={`Desbloquear com ${rotulo}`}
          variant="solid"
          onPress={tentarNovamente}
          loading={verificando}
          style={styles.botaoLargo}
        />
        <TouchableOpacity onPress={sair} style={styles.linkSenha} accessibilityRole="button">
          <Text style={styles.linkSenhaTexto}>Entrar com e-mail e senha</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bloqueio: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bloqueioTopo: {
    alignItems: 'center',
    gap: spacing.md,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  centro: {
    textAlign: 'center',
  },
  textoSecundario: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  iconeBotao: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloqueioRodape: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'center',
  },
  aviso: {
    ...typography.bodySmall,
    color: colors.red,
    textAlign: 'center',
  },
  botaoLargo: {
    width: '100%',
  },
  linkSenha: {
    paddingVertical: spacing.sm,
  },
  linkSenhaTexto: {
    ...typography.label,
    color: colors.primary,
  },
});
