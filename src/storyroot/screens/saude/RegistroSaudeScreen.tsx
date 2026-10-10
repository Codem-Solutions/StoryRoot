import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  BellOff,
  BellRing,
  ClipboardList,
  Pencil,
  Pill,
  Trash2,
  X,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { buscarSintoma, rotulosSintomas } from '../../constants/sintomas';
import { useCriancasDaConta } from '../../store/childStore';
import { useRecordsStore } from '../../store/recordsStore';
import { colors, radius, spacing, typography } from '../../theme';
import type { SaudeDados, StatusSaude } from '../../types';
import { formatarDataBR, formatarHora } from '../../utils/format';
import { cancelarLembretes } from '../../utils/notifications';
import { encodeJsonParam, stringParam } from '../../utils/routerParams';
import {
  STATUS_SAUDE,
  dadosSaude,
  metaStatusSaude,
  resumoSintomas,
  sincronizarLembretesSaude,
  statusEmAcompanhamento,
} from '../../utils/saude';
import { showSaveErrorToast, showSaveSuccessToast } from '../../utils/toast';

export function RegistroSaudeScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ registroId?: string }>();
  const registroId = stringParam(params.registroId);
  const registro = useRecordsStore(s => s.registros.find(r => r.id === registroId));
  const atualizarRegistro = useRecordsStore(s => s.atualizarRegistro);
  const removerRegistro = useRecordsStore(s => s.removerRegistro);
  const crianca = useCriancasDaConta().find(c => c.id === registro?.criancaId);

  const [novoStatus, setNovoStatus] = useState<StatusSaude | null>(null);
  const [nota, setNota] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [fotoAberta, setFotoAberta] = useState<string | null>(null);

  if (!registro) {
    return (
      <View style={[styles.container, styles.conteudo, { paddingTop: insets.top + spacing.md }]}>
        <Cabecalho />
        <EmptyState
          icon={ClipboardList}
          title="Registro não encontrado"
          description="Esse registro de saúde pode ter sido excluído."
        />
      </View>
    );
  }

  const dados = dadosSaude(registro);
  const meta = metaStatusSaude(dados.status);
  const finalizado = dados.status === 'finalizado';
  const emAcompanhamento = statusEmAcompanhamento(dados.status);
  const sintomas = rotulosSintomas(dados.sintomas, dados.sintomaOutro);
  const sinaisAlerta = dados.sintomas.filter(id => buscarSintoma(id)?.alerta);
  const lembretesAtivos = !!registro.notificacaoIds?.length;

  async function registrarAtualizacao() {
    if (!registro || !novoStatus) return;
    setSalvando(true);
    try {
      const novosDados: SaudeDados = {
        ...dados,
        status: novoStatus,
        statusHistorico: [
          ...dados.statusHistorico,
          { status: novoStatus, data: new Date().toISOString(), observacao: nota.trim() || undefined },
        ],
      };
      const notificacaoIds = await sincronizarLembretesSaude(
        registro.id,
        novosDados,
        crianca?.nome ?? 'a criança',
        registro.notificacaoIds,
      );
      atualizarRegistro(registro.id, {
        dados: novosDados,
        valor: resumoSintomas(novosDados),
        notificacaoIds,
      });
      setNovoStatus(null);
      setNota('');
      showSaveSuccessToast(
        statusEmAcompanhamento(novoStatus)
          ? 'Quadro atualizado. Próximo lembrete em 8 horas.'
          : 'Quadro atualizado. Lembretes encerrados.',
      );
    } catch {
      showSaveErrorToast('Não foi possível atualizar o quadro.');
    } finally {
      setSalvando(false);
    }
  }

  function editar() {
    if (!registro) return;
    router.push({
      pathname: '/(app)/storyroot-main/registrar',
      params: {
        editarRegistroId: registro.id,
        tipoInicial: 'saude',
        formDataInicial: encodeJsonParam(dados),
        notificacaoIdsIniciais: encodeJsonParam(registro.notificacaoIds ?? []),
      },
    });
  }

  function excluir() {
    if (!registro) return;
    Alert.alert('Excluir registro?', 'O histórico e os lembretes deste registro serão apagados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await cancelarLembretes(registro.notificacaoIds);
          removerRegistro(registro.id);
          showSaveSuccessToast('Registro excluído');
          router.back();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.conteudo,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        enableOnAndroid
        extraScrollHeight={spacing.xxl}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Cabecalho onEditar={editar} onExcluir={excluir} />

        <View style={styles.cartao}>
          <View style={[styles.statusBadge, { backgroundColor: `${meta.cor}1F` }]}>
            <View style={[styles.statusPonto, { backgroundColor: meta.cor }]} />
            <Text style={[styles.statusTexto, { color: meta.cor }]}>{meta.label}</Text>
          </View>
          <Text style={typography.h3}>{sintomas.join(', ') || dados.detalhes || 'Registro de saúde'}</Text>
          <Text style={typography.bodySmall}>
            {crianca ? `${crianca.nome} · ` : ''}Início em {formatarDataBR(dados.dataInicio)} às{' '}
            {formatarHora(dados.dataInicio)} (
            {formatDistanceToNowStrict(new Date(dados.dataInicio), { locale: ptBR, addSuffix: true })})
          </Text>
          <View style={styles.lembrete}>
            {lembretesAtivos ? (
              <BellRing size={14} color={colors.primary} />
            ) : (
              <BellOff size={14} color={colors.textMuted} />
            )}
            <Text style={[styles.lembreteTexto, lembretesAtivos && { color: colors.primary }]}>
              {lembretesAtivos
                ? 'Lembrete de acompanhamento a cada 8 horas'
                : emAcompanhamento
                  ? 'Lembretes desativados — permita as notificações no Perfil'
                  : 'Sem lembretes: acompanhamento encerrado'}
            </Text>
          </View>
        </View>

        {!!sinaisAlerta.length && emAcompanhamento && (
          <View style={styles.alertaBox}>
            <AlertTriangle size={18} color={colors.red} />
            <Text style={styles.alertaTexto}>
              Há sinais de alerta neste quadro. Procure atendimento médico — em emergência, ligue
              192 (SAMU).
            </Text>
          </View>
        )}

        {!!dados.medicacao && (
          <View style={styles.cartao}>
            <View style={styles.tituloLinha}>
              <Pill size={16} color={colors.violet} />
              <Text style={typography.h4}>Medicação</Text>
            </View>
            <Text style={typography.body}>{dados.medicacao}</Text>
          </View>
        )}

        {!!dados.fotos?.length && (
          <View style={styles.cartao}>
            <Text style={typography.h4}>Fotos</Text>
            <View style={styles.fotos}>
              {dados.fotos.map((uri, index) => (
                <TouchableOpacity
                  key={uri}
                  onPress={() => setFotoAberta(uri)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`Abrir foto ${index + 1}`}>
                  <Image source={{ uri }} style={styles.foto} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!finalizado && (
          <View style={styles.cartao}>
            <Text style={typography.h4}>Como está agora?</Text>
            <View style={styles.chips}>
              {STATUS_SAUDE.map(opcao => {
                const ativo = novoStatus === opcao.status;
                return (
                  <TouchableOpacity
                    key={opcao.status}
                    style={[styles.chip, ativo && { backgroundColor: opcao.cor, borderColor: opcao.cor }]}
                    onPress={() => setNovoStatus(opcao.status)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: ativo }}>
                    <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{opcao.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Observação (opcional) — ex: febre baixou para 37,5 °C"
              placeholderTextColor={colors.placeholder}
              value={nota}
              onChangeText={setNota}
              multiline
            />
            <PrimaryButton
              label="Registrar atualização"
              variant="solid"
              onPress={registrarAtualizacao}
              disabled={!novoStatus}
              loading={salvando}
            />
          </View>
        )}

        <View style={styles.cartao}>
          <Text style={typography.h4}>Histórico do quadro</Text>
          {dados.statusHistorico.length ? (
            [...dados.statusHistorico].reverse().map((atualizacao, index, lista) => {
              const metaItem = metaStatusSaude(atualizacao.status);
              return (
                <View key={`${atualizacao.data}-${index}`} style={styles.historicoItem}>
                  <View style={styles.historicoTrilho}>
                    <View style={[styles.historicoPonto, { backgroundColor: metaItem.cor }]} />
                    {index < lista.length - 1 && <View style={styles.historicoLinha} />}
                  </View>
                  <View style={styles.historicoConteudo}>
                    <Text style={[typography.label, { color: metaItem.cor }]}>{metaItem.label}</Text>
                    <Text style={styles.historicoData}>
                      {formatarDataBR(atualizacao.data)} às {formatarHora(atualizacao.data)}
                    </Text>
                    {!!atualizacao.observacao && (
                      <Text style={typography.body}>{atualizacao.observacao}</Text>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={typography.bodySmall}>Este registro é anterior ao acompanhamento por status.</Text>
          )}
        </View>
      </KeyboardAwareScrollView>

      <Modal
        visible={!!fotoAberta}
        transparent
        animationType="fade"
        onRequestClose={() => setFotoAberta(null)}
        statusBarTranslucent>
        <View style={styles.visualizador}>
          {!!fotoAberta && (
            <Image source={{ uri: fotoAberta }} style={styles.fotoCheia} resizeMode="contain" />
          )}
          <TouchableOpacity
            style={[styles.fecharVisualizador, { top: insets.top + spacing.md }]}
            onPress={() => setFotoAberta(null)}
            accessibilityRole="button"
            accessibilityLabel="Fechar foto">
            <X size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

function Cabecalho({ onEditar, onExcluir }: { onEditar?: () => void; onExcluir?: () => void }) {
  return (
    <View style={styles.cabecalho}>
      <TouchableOpacity
        style={styles.botaoRedondo}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Voltar">
        <ArrowLeft size={20} color={colors.text} />
      </TouchableOpacity>
      <Text style={[typography.h3, styles.flex]}>Registro de saúde</Text>
      {!!onEditar && (
        <TouchableOpacity
          style={styles.botaoRedondo}
          onPress={onEditar}
          accessibilityRole="button"
          accessibilityLabel="Editar registro">
          <Pencil size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}
      {!!onExcluir && (
        <TouchableOpacity
          style={styles.botaoRedondo}
          onPress={onExcluir}
          accessibilityRole="button"
          accessibilityLabel="Excluir registro">
          <Trash2 size={16} color={colors.red} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  conteudo: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  botaoRedondo: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartao: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusPonto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTexto: {
    ...typography.label,
    fontSize: 12,
  },
  lembrete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  lembreteTexto: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  alertaBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.red}14`,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  alertaTexto: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.red,
  },
  tituloLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fotos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  foto: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipTexto: {
    ...typography.label,
    fontSize: 13,
    color: colors.textMuted,
  },
  chipTextoAtivo: {
    color: '#fff',
  },
  input: {
    ...typography.body,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  historicoItem: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  historicoTrilho: {
    width: 12,
    alignItems: 'center',
  },
  historicoPonto: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
  },
  historicoLinha: {
    flex: 1,
    width: 2,
    backgroundColor: colors.divider,
    marginTop: 2,
  },
  historicoConteudo: {
    flex: 1,
    gap: 2,
    paddingBottom: spacing.lg,
  },
  historicoData: {
    ...typography.caption,
    color: colors.textMuted,
  },
  visualizador: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
  },
  fotoCheia: {
    width: '100%',
    height: '80%',
  },
  fecharVisualizador: {
    position: 'absolute',
    right: spacing.xxl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
