import { useFocusEffect } from 'expo-router';
import { Bell, Fingerprint, ScanFace } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking, StyleSheet, Switch, Text, View } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useBiometriaAtiva, useSegurancaStore } from '../../store/segurancaStore';
import { colors, radius, spacing, typography } from '../../theme';
import {
  autenticarComBiometria,
  obterCapacidadeBiometria,
  type CapacidadeBiometria,
} from '../../utils/biometria';
import {
  obterStatusNotificacao,
  solicitarPermissaoNotificacao,
  type StatusNotificacao,
} from '../../utils/notifications';
import { showSaveSuccessToast } from '../../utils/toast';

const DESCRICAO_NOTIFICACAO: Record<StatusNotificacao, string> = {
  ativa: 'Lembretes de remédio e avisos do app',
  pendente: 'Ative para receber lembretes de remédio',
  bloqueada: 'Bloqueadas nas configurações do aparelho',
  indisponivel: 'Indisponível no Expo Go',
};

export function SegurancaSection() {
  const usuarioAtualId = useAuthStore(state => state.usuarioAtualId);
  const biometriaAtiva = useBiometriaAtiva();
  const setBiometriaAtiva = useSegurancaStore(state => state.setBiometriaAtiva);

  const [capacidade, setCapacidade] = useState<CapacidadeBiometria | null>(null);
  const [notificacao, setNotificacao] = useState<StatusNotificacao | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const atualizar = useCallback(() => {
    void obterCapacidadeBiometria().then(setCapacidade);
    void obterStatusNotificacao().then(setNotificacao);
  }, []);

  useFocusEffect(atualizar);

  // Ao voltar das configurações do aparelho, o status pode ter mudado.
  useEffect(() => {
    const assinatura = AppState.addEventListener('change', estado => {
      if (estado === 'active') atualizar();
    });
    return () => assinatura.remove();
  }, [atualizar]);

  const rotulo = capacidade?.rotulo ?? 'biometria';
  const biometriaDisponivel = !!capacidade?.temHardware && !!capacidade.cadastrada;

  function descricaoBiometria() {
    if (!capacidade) return 'Verificando o aparelho...';
    if (!capacidade.temHardware) return 'Este aparelho não tem leitor biométrico';
    if (!capacidade.cadastrada) return 'Cadastre uma digital ou rosto nas configurações do aparelho';
    return biometriaAtiva
      ? `O app pede sua ${rotulo} ao ser aberto`
      : 'Entre sem precisar digitar a senha';
  }

  async function alternarBiometria(ativar: boolean) {
    if (!usuarioAtualId) return;
    if (!ativar) {
      setBiometriaAtiva(usuarioAtualId, false);
      return;
    }
    setOcupado(true);
    const confirmou = await autenticarComBiometria(`Ativar entrada com ${rotulo}`);
    setOcupado(false);
    if (confirmou) {
      setBiometriaAtiva(usuarioAtualId, true);
      showSaveSuccessToast(`Entrada com ${rotulo} ativada`);
    }
  }

  function abrirConfiguracoes(titulo: string, mensagem: string) {
    Alert.alert(titulo, mensagem, [
      { text: 'Agora não', style: 'cancel' },
      { text: 'Abrir configurações', onPress: () => void Linking.openSettings() },
    ]);
  }

  async function alternarNotificacoes(ativar: boolean) {
    if (!ativar) {
      abrirConfiguracoes(
        'Desativar notificações',
        'Para parar de receber notificações, desative-as nas configurações do aparelho.',
      );
      return;
    }
    if (notificacao === 'bloqueada') {
      abrirConfiguracoes(
        'Notificações bloqueadas',
        'Você negou as notificações antes. Para ativá-las, permita nas configurações do aparelho.',
      );
      return;
    }
    setOcupado(true);
    await solicitarPermissaoNotificacao().catch(() => false);
    setOcupado(false);
    atualizar();
  }

  const IconeBiometria = capacidade?.facial ? ScanFace : Fingerprint;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrapper}>
          <IconeBiometria size={20} color={colors.primary} />
        </View>
        <View style={styles.rowContent}>
          <Text style={typography.h4}>Entrar com {rotulo}</Text>
          <Text style={typography.caption}>{descricaoBiometria()}</Text>
        </View>
        <Switch
          value={biometriaAtiva}
          onValueChange={alternarBiometria}
          disabled={ocupado || (!biometriaDisponivel && !biometriaAtiva)}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
          accessibilityLabel={`Entrar com ${rotulo}`}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.iconWrapper}>
          <Bell size={20} color={colors.primary} />
        </View>
        <View style={styles.rowContent}>
          <Text style={typography.h4}>Notificações</Text>
          <Text style={typography.caption}>
            {notificacao ? DESCRICAO_NOTIFICACAO[notificacao] : 'Verificando o aparelho...'}
          </Text>
        </View>
        <Switch
          value={notificacao === 'ativa'}
          onValueChange={alternarNotificacoes}
          disabled={ocupado || !notificacao || notificacao === 'indisponivel'}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
          accessibilityLabel="Notificações"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
});
