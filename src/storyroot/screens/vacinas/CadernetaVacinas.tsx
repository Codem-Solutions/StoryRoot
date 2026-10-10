import { isSameDay, startOfMonth } from 'date-fns';
import { CheckCircle2, ChevronRight, Plus, Syringe } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarioMensal, chaveDia } from '../../components/CalendarioMensal';
import { useVacinasStore } from '../../store/vacinasStore';
import { colors, radius, spacing, typography } from '../../theme';
import type { Crianca } from '../../types';
import { formatarDataBR } from '../../utils/format';
import { showSaveSuccessToast } from '../../utils/toast';
import {
  GRUPO_EXTRAS,
  META_STATUS_VACINA,
  agruparPorIdade,
  montarCaderneta,
  registroBase,
  type ItemCaderneta,
  type StatusVacina,
} from '../../utils/vacinas';
import { VacinaDetalheSheet } from './VacinaDetalheSheet';

type Visao = 'idade' | 'calendario';

/**
 * Conteúdo da caderneta de vacinas (sem rolagem própria): usado na tela cheia
 * da caderneta e na aba Vacinas da tela Saúde.
 */
export function CadernetaVacinas({ crianca }: { crianca: Crianca }) {
  const registros = useVacinasStore(s => s.registros);
  const salvarRegistros = useVacinasStore(s => s.salvarRegistros);
  const [visao, setVisao] = useState<Visao>('idade');
  const [mes, setMes] = useState(() => startOfMonth(new Date()));
  const [diaSelecionado, setDiaSelecionado] = useState(() => new Date());
  const [itemAberto, setItemAberto] = useState<ItemCaderneta | null>(null);
  const [novaExtra, setNovaExtra] = useState(false);

  const itens = useMemo(() => montarCaderneta(crianca, registros), [crianca, registros]);
  const grupos = useMemo(() => agruparPorIdade(itens), [itens]);

  const aplicadas = itens.filter(i => i.status === 'aplicada').length;
  const atrasadas = itens.filter(i => i.status === 'atrasada');
  const proxima = itens
    .filter(i => i.status === 'proxima' || i.status === 'agendada')
    .sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista))[0];

  const marcadores = useMemo(() => {
    const mapa = new Map<string, string[]>();
    for (const item of itens) {
      const chave = chaveDia(item.dataReferencia);
      mapa.set(chave, [...(mapa.get(chave) ?? []), META_STATUS_VACINA[item.status].cor]);
    }
    return mapa;
  }, [itens]);

  const itensDoDia = itens.filter(item => isSameDay(new Date(item.dataReferencia), diaSelecionado));

  function marcarGrupoAplicado(titulo: string, pendentes: ItemCaderneta[]) {
    Alert.alert(
      `Marcar "${titulo}" como aplicadas?`,
      `${pendentes.length} vacina(s) serão marcadas como aplicadas na data prevista. Depois você pode abrir cada uma para informar lote e reações.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Marcar',
          onPress: () => {
            const agora = new Date().toISOString();
            salvarRegistros(
              pendentes.map(item => ({
                ...registroBase(item, crianca.id),
                aplicada: true,
                dataAplicacao: item.dataPrevista,
                atualizadoEm: agora,
              })),
            );
            showSaveSuccessToast('Vacinas marcadas como aplicadas');
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.resumo}>
        <View style={styles.resumoTopo}>
          <View style={styles.resumoIcone}>
            <Syringe size={20} color="#fff" />
          </View>
          <View style={styles.flex}>
            <Text style={typography.h4}>Caderneta de {crianca.nome}</Text>
            <Text style={typography.caption}>
              {aplicadas} de {itens.length} vacinas aplicadas
            </Text>
          </View>
        </View>
        <View style={styles.progressoTrilha}>
          <View
            style={[
              styles.progressoBarra,
              { width: `${itens.length ? (aplicadas / itens.length) * 100 : 0}%` },
            ]}
          />
        </View>
        <View style={styles.resumoLinha}>
          {atrasadas.length > 0 && (
            <View style={[styles.pilula, { backgroundColor: `${colors.red}1A` }]}>
              <Text style={[styles.pilulaTexto, { color: colors.red }]}>
                {atrasadas.length} atrasada{atrasadas.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {!!proxima && (
            <View style={[styles.pilula, { backgroundColor: colors.surfaceTint }]}>
              <Text style={[styles.pilulaTexto, { color: colors.primary }]}>
                Próxima: {proxima.nome} · {formatarDataBR(proxima.dataPrevista)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.seletor}>
        {(
          [
            { chave: 'idade', label: 'Por idade' },
            { chave: 'calendario', label: 'Calendário' },
          ] as const
        ).map(opcao => (
          <TouchableOpacity
            key={opcao.chave}
            style={[styles.seletorOpcao, visao === opcao.chave && styles.seletorOpcaoAtiva]}
            onPress={() => setVisao(opcao.chave)}
            accessibilityRole="tab"
            accessibilityState={{ selected: visao === opcao.chave }}>
            <Text style={[styles.seletorTexto, visao === opcao.chave && styles.seletorTextoAtivo]}>
              {opcao.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {visao === 'idade' ? (
        grupos.map(grupo => {
          const pendentes = grupo.itens.filter(i => i.status === 'atrasada');
          const dataGrupo = grupo.titulo !== GRUPO_EXTRAS ? grupo.itens[0]?.dataPrevista : undefined;
          return (
            <View key={grupo.titulo} style={styles.grupo}>
              <View style={styles.grupoCabecalho}>
                <View style={styles.flex}>
                  <Text style={typography.h4}>{grupo.titulo}</Text>
                  {!!dataGrupo && (
                    <Text style={typography.caption}>Prevista para {formatarDataBR(dataGrupo)}</Text>
                  )}
                </View>
                {pendentes.length > 1 && (
                  <TouchableOpacity
                    onPress={() => marcarGrupoAplicado(grupo.titulo, pendentes)}
                    accessibilityRole="button">
                    <Text style={styles.acaoGrupo}>Marcar todas</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.cartao}>
                {grupo.itens.map((item, index) => (
                  <LinhaVacina
                    key={item.id}
                    item={item}
                    ultimo={index === grupo.itens.length - 1}
                    onPress={() => setItemAberto(item)}
                  />
                ))}
              </View>
            </View>
          );
        })
      ) : (
        <>
          <CalendarioMensal
            mes={mes}
            onMudarMes={setMes}
            diaSelecionado={diaSelecionado}
            onSelecionarDia={dia => {
              setDiaSelecionado(dia);
              setMes(startOfMonth(dia));
            }}
            marcadores={marcadores}
          />
          <View style={styles.legenda}>
            {(Object.keys(META_STATUS_VACINA) as StatusVacina[]).map(status => (
              <View key={status} style={styles.legendaItem}>
                <View style={[styles.legendaPonto, { backgroundColor: META_STATUS_VACINA[status].cor }]} />
                <Text style={styles.legendaTexto}>{META_STATUS_VACINA[status].label}</Text>
              </View>
            ))}
          </View>
          <Text style={typography.h4}>{formatarDataBR(diaSelecionado.toISOString())}</Text>
          {itensDoDia.length ? (
            <View style={styles.cartao}>
              {itensDoDia.map((item, index) => (
                <LinhaVacina
                  key={item.id}
                  item={item}
                  ultimo={index === itensDoDia.length - 1}
                  onPress={() => setItemAberto(item)}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.vazio}>Nenhuma vacina neste dia.</Text>
          )}
        </>
      )}

      <TouchableOpacity
        style={styles.botaoExtra}
        onPress={() => setNovaExtra(true)}
        accessibilityRole="button">
        <Plus size={16} color={colors.primary} />
        <Text style={styles.botaoExtraTexto}>Adicionar outra vacina</Text>
      </TouchableOpacity>

      <Text style={styles.aviso}>
        Baseado no Calendário Nacional de Vacinação (PNI / Ministério da Saúde). Os esquemas podem
        mudar por campanha, estado ou indicação médica — confirme sempre com o pediatra ou a
        unidade de saúde.
      </Text>

      {(!!itemAberto || novaExtra) && (
        <VacinaDetalheSheet
          item={itemAberto ?? undefined}
          crianca={crianca}
          onClose={() => {
            setItemAberto(null);
            setNovaExtra(false);
          }}
        />
      )}
    </View>
  );
}

function LinhaVacina({
  item,
  ultimo,
  onPress,
}: {
  item: ItemCaderneta;
  ultimo: boolean;
  onPress: () => void;
}) {
  const meta = META_STATUS_VACINA[item.status];
  const aplicada = item.status === 'aplicada';
  const detalhe = aplicada
    ? [
        item.registro?.dataAplicacao && `Aplicada em ${formatarDataBR(item.registro.dataAplicacao)}`,
        item.registro?.lote && `Lote ${item.registro.lote}`,
      ]
        .filter(Boolean)
        .join(' · ')
    : `${meta.label} · ${formatarDataBR(item.dataPrevista)}`;
  const reacoes = item.registro?.reacoes.filter(r => r !== 'Nenhuma reação') ?? [];

  return (
    <TouchableOpacity
      style={[styles.linha, !ultimo && styles.linhaDivisor]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${item.nome}, ${item.dose}, ${meta.label}`}>
      {aplicada ? (
        <CheckCircle2 size={22} color={meta.cor} />
      ) : (
        <View style={[styles.marcador, { borderColor: meta.cor }]} />
      )}
      <View style={styles.flex}>
        <Text style={typography.label}>
          {item.nome}
          {item.dose ? <Text style={styles.dose}> · {item.dose}</Text> : null}
        </Text>
        <Text style={[styles.detalhe, !aplicada && { color: meta.cor }]}>{detalhe}</Text>
        {reacoes.length > 0 && (
          <Text style={styles.reacoes} numberOfLines={1}>
            Reações: {reacoes.join(', ')}
          </Text>
        )}
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  flex: {
    flex: 1,
  },
  resumo: {
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
  resumoTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resumoIcone: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressoTrilha: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceTint,
    overflow: 'hidden',
  },
  progressoBarra: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  resumoLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pilula: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pilulaTexto: {
    ...typography.label,
    fontSize: 12,
  },
  seletor: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.pill,
    padding: 3,
  },
  seletorOpcao: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  seletorOpcaoAtiva: {
    backgroundColor: colors.surface,
    elevation: 1,
  },
  seletorTexto: {
    ...typography.label,
    fontSize: 13,
    color: colors.textMuted,
  },
  seletorTextoAtivo: {
    color: colors.primary,
  },
  grupo: {
    gap: spacing.sm,
  },
  grupoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  acaoGrupo: {
    ...typography.label,
    fontSize: 12,
    color: colors.primary,
  },
  cartao: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    shadowColor: colors.text,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  linhaDivisor: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  marcador: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginHorizontal: 1,
  },
  dose: {
    ...typography.bodySmall,
  },
  detalhe: {
    ...typography.caption,
    color: colors.textMuted,
  },
  reacoes: {
    ...typography.caption,
    color: colors.accentText,
  },
  legenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendaPonto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendaTexto: {
    ...typography.caption,
    color: colors.textMuted,
  },
  vazio: {
    ...typography.bodySmall,
  },
  botaoExtra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
  },
  botaoExtraTexto: {
    ...typography.label,
    color: colors.primary,
  },
  aviso: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
