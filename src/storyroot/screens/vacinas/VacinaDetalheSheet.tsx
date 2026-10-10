import { CheckCircle2, Circle, Plus, Syringe, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { BottomSheet } from '../../components/BottomSheet';
import { CampoData } from '../../components/CampoData';
import { PrimaryButton } from '../../components/PrimaryButton';
import { REACOES_VACINA, rotuloIdadeVacina } from '../../constants/calendarioVacinal';
import { useVacinasStore } from '../../store/vacinasStore';
import { colors, radius, spacing, typography } from '../../theme';
import type { Crianca, RegistroVacina } from '../../types';
import { formatarDataBR, formatarHora } from '../../utils/format';
import { showSaveSuccessToast } from '../../utils/toast';
import { META_STATUS_VACINA, registroBase, statusVacina, type ItemCaderneta } from '../../utils/vacinas';

const NENHUMA_REACAO = REACOES_VACINA[0];

function novaVacinaExtra(criancaId: string): RegistroVacina {
  const agora = new Date().toISOString();
  return {
    id: `extra-${Date.now()}`,
    criancaId,
    nome: '',
    dose: '',
    dataPrevista: agora,
    aplicada: false,
    reacoes: [],
    acompanhamentos: [],
    atualizadoEm: agora,
  };
}

/**
 * Ficha de uma vacina, nos moldes da caderneta: aplicação (data, lote, unidade,
 * vacinador), reações e acompanhamento pós-vacina. Sem `item`, cadastra uma
 * vacina extra (particular, campanha...).
 */
export function VacinaDetalheSheet({
  item,
  crianca,
  onClose,
}: {
  item?: ItemCaderneta;
  crianca: Crianca;
  onClose: () => void;
}) {
  const salvarRegistro = useVacinasStore(s => s.salvarRegistro);
  const removerRegistro = useVacinasStore(s => s.removerRegistro);
  const [rascunho, setRascunho] = useState<RegistroVacina>(() =>
    item ? registroBase(item, crianca.id) : novaVacinaExtra(crianca.id),
  );
  const [novoAcompanhamento, setNovoAcompanhamento] = useState('');

  const extra = !item?.vacina;
  const jaSalvo = !!item?.registro;
  const dataPrevista = rascunho.dataPrevista ?? item?.dataPrevista ?? new Date().toISOString();
  const status = statusVacina(rascunho.aplicada, dataPrevista);
  const metaStatus = META_STATUS_VACINA[status];

  function atualizar(patch: Partial<RegistroVacina>) {
    setRascunho(atual => ({ ...atual, ...patch }));
  }

  function alternarReacao(reacao: string) {
    const atuais = rascunho.reacoes;
    if (reacao === NENHUMA_REACAO) {
      atualizar({ reacoes: atuais.includes(reacao) ? [] : [reacao] });
      return;
    }
    const semNenhuma = atuais.filter(r => r !== NENHUMA_REACAO);
    atualizar({
      reacoes: semNenhuma.includes(reacao)
        ? semNenhuma.filter(r => r !== reacao)
        : [...semNenhuma, reacao],
    });
  }

  function adicionarAcompanhamento() {
    const texto = novoAcompanhamento.trim();
    if (!texto) return;
    atualizar({
      acompanhamentos: [
        ...rascunho.acompanhamentos,
        { id: String(Date.now()), data: new Date().toISOString(), texto },
      ],
    });
    setNovoAcompanhamento('');
  }

  function removerAcompanhamento(id: string) {
    atualizar({ acompanhamentos: rascunho.acompanhamentos.filter(a => a.id !== id) });
  }

  function salvar() {
    if (extra && !rascunho.nome?.trim()) {
      Alert.alert('Nome da vacina', 'Informe o nome da vacina para salvar.');
      return;
    }
    // Texto digitado e não adicionado ainda também vale como acompanhamento.
    const pendente = novoAcompanhamento.trim();
    const acompanhamentos = pendente
      ? [
          ...rascunho.acompanhamentos,
          { id: String(Date.now()), data: new Date().toISOString(), texto: pendente },
        ]
      : rascunho.acompanhamentos;

    salvarRegistro({
      ...rascunho,
      nome: rascunho.nome?.trim(),
      dose: rascunho.dose?.trim(),
      dataAplicacao: rascunho.aplicada
        ? (rascunho.dataAplicacao ?? new Date().toISOString())
        : rascunho.dataAplicacao,
      acompanhamentos,
      atualizadoEm: new Date().toISOString(),
    });
    showSaveSuccessToast(rascunho.aplicada ? 'Vacina registrada na caderneta' : 'Caderneta atualizada');
    onClose();
  }

  function remover() {
    Alert.alert(
      extra ? 'Excluir vacina?' : 'Limpar registro?',
      extra
        ? 'Essa vacina extra e todas as anotações dela serão apagadas.'
        : 'A vacina volta a ficar pendente e as anotações (lote, reações, acompanhamento) serão apagadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: extra ? 'Excluir' : 'Limpar',
          style: 'destructive',
          onPress: () => {
            removerRegistro(rascunho.id);
            onClose();
          },
        },
      ],
    );
  }

  return (
    <BottomSheet onClose={onClose}>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={spacing.xxl}
        keyboardShouldPersistTaps="handled">
        <View style={styles.cabecalho}>
          <View style={styles.icone}>
            <Syringe size={20} color="#fff" />
          </View>
          <View style={styles.cabecalhoTexto}>
            <Text style={typography.h3}>
              {extra ? rascunho.nome?.trim() || 'Nova vacina' : item?.nome}
            </Text>
            {!extra && <Text style={styles.subtitulo}>{item?.dose}</Text>}
          </View>
          <TouchableOpacity
            style={styles.fechar}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar">
            <X size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${metaStatus.cor}1F` }]}>
          <View style={[styles.statusPonto, { backgroundColor: metaStatus.cor }]} />
          <Text style={[styles.statusTexto, { color: metaStatus.cor }]}>{metaStatus.label}</Text>
        </View>

        {!!item?.vacina && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Protege contra</Text>
            <Text style={typography.body}>{item.vacina.protegeContra}</Text>
            <Text style={styles.infoLabel}>
              Idade recomendada: {rotuloIdadeVacina(item.vacina.idadeMeses).toLowerCase()}
            </Text>
            {!!item.vacina.nota && <Text style={styles.nota}>{item.vacina.nota}</Text>}
          </View>
        )}

        <View style={styles.secao}>
          {extra && (
            <>
              <Campo
                label="Nome da vacina"
                value={rascunho.nome}
                onChange={nome => atualizar({ nome })}
                placeholder="Ex: Meningocócica B"
              />
              <Campo
                label="Dose (opcional)"
                value={rascunho.dose}
                onChange={dose => atualizar({ dose })}
                placeholder="Ex: 1ª dose, reforço"
              />
            </>
          )}
          <CampoData
            label={extra ? 'Data prevista' : 'Data prevista (pode reagendar)'}
            value={dataPrevista}
            onChange={iso => atualizar({ dataPrevista: iso })}
          />
        </View>

        <Text style={styles.tituloSecao}>A vacina foi aplicada?</Text>
        <View style={styles.opcoesLinha}>
          {[
            { valor: true, label: 'Sim, foi aplicada' },
            { valor: false, label: 'Ainda não' },
          ].map(opcao => {
            const ativo = rascunho.aplicada === opcao.valor;
            return (
              <TouchableOpacity
                key={opcao.label}
                style={[styles.opcao, ativo && styles.opcaoAtiva]}
                onPress={() =>
                  atualizar({
                    aplicada: opcao.valor,
                    dataAplicacao:
                      opcao.valor && !rascunho.dataAplicacao
                        ? new Date().toISOString()
                        : rascunho.dataAplicacao,
                  })
                }
                accessibilityRole="radio"
                accessibilityState={{ selected: ativo }}>
                {ativo ? (
                  <CheckCircle2 size={18} color="#fff" />
                ) : (
                  <Circle size={18} color={colors.textMuted} />
                )}
                <Text style={[styles.opcaoTexto, ativo && styles.opcaoTextoAtivo]}>
                  {opcao.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {rascunho.aplicada && (
          <>
            <View style={styles.secao}>
              <CampoData
                label="Data da aplicação"
                value={rascunho.dataAplicacao}
                onChange={iso => atualizar({ dataAplicacao: iso })}
              />
              <Campo
                label="Lote"
                value={rascunho.lote}
                onChange={lote => atualizar({ lote })}
                placeholder="Ex: 214VZA015Z"
                autoCapitalize="characters"
              />
              <Campo
                label="Unidade de saúde"
                value={rascunho.unidade}
                onChange={unidade => atualizar({ unidade })}
                placeholder="Ex: UBS Centro"
              />
              <Campo
                label="Profissional (vacinador)"
                value={rascunho.profissional}
                onChange={profissional => atualizar({ profissional })}
                placeholder="Nome ou registro (opcional)"
              />
            </View>

            <Text style={styles.tituloSecao}>Reações após a vacina</Text>
            <View style={styles.chips}>
              {REACOES_VACINA.map(reacao => {
                const ativo = rascunho.reacoes.includes(reacao);
                return (
                  <TouchableOpacity
                    key={reacao}
                    style={[styles.chip, ativo && styles.chipAtivo]}
                    onPress={() => alternarReacao(reacao)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: ativo }}>
                    <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{reacao}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.tituloSecao}>Acompanhamento pós-vacina</Text>
            <Text style={styles.ajuda}>
              Anote como a criança ficou nas horas e dias seguintes. Cada anotação fica com data e
              hora.
            </Text>
            {rascunho.acompanhamentos.map(acompanhamento => (
              <View key={acompanhamento.id} style={styles.acompanhamento}>
                <View style={styles.acompanhamentoTexto}>
                  <Text style={styles.acompanhamentoData}>
                    {formatarDataBR(acompanhamento.data)} · {formatarHora(acompanhamento.data)}
                  </Text>
                  <Text style={typography.body}>{acompanhamento.texto}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removerAcompanhamento(acompanhamento.id)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Remover anotação">
                  <X size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.novoAcompanhamento}>
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="Ex: febre de 37,8 °C à noite"
                placeholderTextColor={colors.placeholder}
                value={novoAcompanhamento}
                onChangeText={setNovoAcompanhamento}
                multiline
              />
              <TouchableOpacity
                style={styles.botaoAdicionar}
                onPress={adicionarAcompanhamento}
                accessibilityRole="button"
                accessibilityLabel="Adicionar anotação">
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.secao}>
          <Campo
            label="Observações (opcional)"
            value={rascunho.observacao}
            onChange={observacao => atualizar({ observacao })}
            placeholder="Ex: pediatra recomendou antitérmico se tiver febre"
            multiline
          />
        </View>

        <PrimaryButton label="Salvar na caderneta" onPress={salvar} style={styles.salvar} />
        {jaSalvo && (
          <TouchableOpacity style={styles.remover} onPress={remover} accessibilityRole="button">
            <Text style={styles.removerTexto}>{extra ? 'Excluir vacina' : 'Limpar registro'}</Text>
          </TouchableOpacity>
        )}
      </KeyboardAwareScrollView>
    </BottomSheet>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  autoCapitalize,
}: {
  label: string;
  value?: string;
  onChange: (texto: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.campo}>
      <Text style={typography.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value ?? ''}
        onChangeText={onChange}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  icone: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cabecalhoTexto: {
    flex: 1,
    gap: 2,
  },
  subtitulo: {
    ...typography.bodySmall,
  },
  fechar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
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
  infoBox: {
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  nota: {
    ...typography.bodySmall,
    fontStyle: 'italic',
  },
  secao: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  tituloSecao: {
    ...typography.h4,
    marginBottom: spacing.sm,
  },
  ajuda: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  opcoesLinha: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  opcao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  opcaoAtiva: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  opcaoTexto: {
    ...typography.label,
    fontSize: 13,
    color: colors.textMuted,
  },
  opcaoTextoAtivo: {
    color: '#fff',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTexto: {
    ...typography.caption,
    color: colors.textMuted,
  },
  chipTextoAtivo: {
    color: '#fff',
  },
  acompanhamento: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.blue,
  },
  acompanhamentoTexto: {
    flex: 1,
    gap: 2,
  },
  acompanhamentoData: {
    ...typography.caption,
    color: colors.textMuted,
  },
  novoAcompanhamento: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  campo: {
    gap: spacing.sm,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  inputFlex: {
    flex: 1,
  },
  botaoAdicionar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salvar: {
    marginTop: spacing.sm,
  },
  remover: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  removerTexto: {
    ...typography.label,
    color: colors.red,
  },
});
