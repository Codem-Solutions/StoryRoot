import { ChevronDown, ClipboardList, Search, SlidersHorizontal, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAlimentosStore } from '../store/alimentosStore';
import { useCriancaAtiva } from '../store/childStore';
import { useRecordsStore } from '../store/recordsStore';
import { colors, radius, spacing, typography } from '../theme';
import { idadeEmMeses } from '../utils/age';
import {
  ROTULOS_CATEGORIA,
  classificarNivel,
  estimarNutrientesRefeicao,
  indicadoresAlimentacao,
  referenciaDRI,
  rotuloAceitacao,
  rotuloCategoria,
  rotuloTipoRefeicao,
  type NivelReferencia,
} from '../utils/alimentacao';
import { formatarDataBR, formatarHora } from '../utils/format';
import type { CategoriaAlimento, ComidaDados, NivelAceitacao, TipoRefeicao } from '../types';
import { BottomSheet } from './BottomSheet';
import { EmptyState } from './EmptyState';

type JanelaFiltro = '7' | '15' | '30' | '90' | 'tudo';

const OPCOES_JANELA: { chave: JanelaFiltro; label: string }[] = [
  { chave: '7', label: '7 dias' },
  { chave: '15', label: '15 dias' },
  { chave: '30', label: '30 dias' },
  { chave: '90', label: '90 dias' },
  { chave: 'tudo', label: 'Tudo' },
];

const OPCOES_TIPO_REFEICAO: TipoRefeicao[] = [
  'cafe_manha',
  'lanche_manha',
  'almoco',
  'lanche_tarde',
  'jantar',
  'lanche_noite',
  'ceia',
  'alimentacao_complementar',
  'refeicao_escolar',
  'refeicao_fora',
  'refeicao_especial',
];

const OPCOES_ACEITACAO: NivelAceitacao[] = ['adorou', 'aceitou_bem', 'aceitou', 'experimentou', 'recusou'];

const OPCOES_CATEGORIA: CategoriaAlimento[] = Object.keys(ROTULOS_CATEGORIA) as CategoriaAlimento[];

const CORES_NIVEL: Record<NivelReferencia, string> = {
  abaixo: colors.amber,
  dentro: colors.primary,
  acima: colors.red,
};

const ROTULOS_NIVEL: Record<NivelReferencia, string> = {
  abaixo: 'Abaixo da referência',
  dentro: 'Dentro da referência',
  acima: 'Acima da referência',
};

function BarraFrequencia({ label, valor, maximo }: { label: string; valor: number; maximo: number }) {
  const largura = maximo > 0 ? `${Math.max(4, (valor / maximo) * 100)}%` : '0%';
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: largura as `${number}%` }]} />
      </View>
      <Text style={styles.barValue}>{valor}</Text>
    </View>
  );
}

/** Barra comparativa "registrado x referência DRI" — faixa (AMDR) ou alvo único (RDA/AI). */
function BarraDRI({
  label,
  valorTexto,
  valorNumero,
  faixaMin,
  faixaMax,
  faixaTexto,
  nivel,
}: {
  label: string;
  valorTexto: string;
  valorNumero: number;
  faixaMin: number;
  faixaMax: number;
  faixaTexto: string;
  nivel: NivelReferencia;
}) {
  const escala = Math.max(valorNumero, faixaMax, 1) * 1.15;
  const larguraValor = Math.min(100, (valorNumero / escala) * 100);
  const zonaEsquerda = (faixaMin / escala) * 100;
  const zonaLargura = ((faixaMax - faixaMin) / escala) * 100;
  const cor = CORES_NIVEL[nivel];

  return (
    <View style={styles.driItem}>
      <View style={styles.driHeader}>
        <Text style={styles.driLabel}>{label}</Text>
        <View style={[styles.driBadge, { backgroundColor: `${cor}1F` }]}>
          <Text style={[styles.driBadgeText, { color: cor }]}>{ROTULOS_NIVEL[nivel]}</Text>
        </View>
      </View>
      <View style={styles.driTrack}>
        <View
          style={[
            styles.driZonaAlvo,
            { left: `${Math.max(0, zonaEsquerda)}%`, width: `${Math.max(2, zonaLargura)}%` },
          ]}
        />
        <View style={[styles.driFill, { width: `${larguraValor}%`, backgroundColor: cor }]} />
      </View>
      <Text style={styles.driRodape}>
        Registrado: {valorTexto} · Referência: {faixaTexto}
      </Text>
    </View>
  );
}

interface OpcaoSelecao<T extends string> {
  valor: T;
  label: string;
}

/** Modal de seleção única (mesmo padrão do `DropdownModal` usado no registro). */
function SelecaoModal<T extends string>({
  visible,
  titulo,
  opcoes,
  valorSelecionado,
  onSelecionar,
  onFechar,
}: {
  visible: boolean;
  titulo: string;
  opcoes: OpcaoSelecao<T>[];
  valorSelecionado: T | null;
  onSelecionar: (valor: T | null) => void;
  onFechar: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onFechar} statusBarTranslucent navigationBarTranslucent>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onFechar}>
        <View style={styles.modalContent}>
          <Text style={[typography.h3, styles.modalTitulo]}>{titulo}</Text>
          <ScrollView style={styles.modalScroll}>
            <TouchableOpacity
              style={styles.modalOpcao}
              onPress={() => {
                onSelecionar(null);
                onFechar();
              }}>
              <Text style={[typography.body, !valorSelecionado && styles.modalOpcaoAtiva]}>Todos</Text>
            </TouchableOpacity>
            {opcoes.map(o => (
              <TouchableOpacity
                key={o.valor}
                style={styles.modalOpcao}
                onPress={() => {
                  onSelecionar(o.valor);
                  onFechar();
                }}>
                <Text style={[typography.body, valorSelecionado === o.valor && styles.modalOpcaoAtiva]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function CampoDropdown({ label, valor, onPress }: { label: string; valor: string; onPress: () => void }) {
  return (
    <View style={styles.campoDropdownWrapper}>
      <Text style={styles.sectionTitulo}>{label}</Text>
      <TouchableOpacity style={styles.dropdownButton} onPress={onPress}>
        <Text style={typography.body}>{valor}</Text>
        <ChevronDown size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

/**
 * Painel de indicadores/histórico de alimentação (comida) — filtros, resumo, ranking de
 * alimentos, diversidade, categorias, aceitação x rejeição, comparativo nutricional (DRI)
 * e histórico completo. Não tem `ScrollView`/container próprio: deve ser embutido dentro do
 * scroll do local que o usa (ex. aba "Alimentação" em Rotina), aparecendo direto na tela.
 */
export function AlimentacaoIndicadores() {
  const criancaAtiva = useCriancaAtiva();
  const todosRegistros = useRecordsStore(s => s.registros);
  const alimentosBase = useAlimentosStore(s => s.alimentos);

  const [janela, setJanela] = useState<JanelaFiltro>('30');
  const [tipoFiltro, setTipoFiltro] = useState<TipoRefeicao | null>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaAlimento | null>(null);
  const [aceitacaoFiltro, setAceitacaoFiltro] = useState<NivelAceitacao | null>(null);
  const [buscaAlimento, setBuscaAlimento] = useState('');

  const [showFiltros, setShowFiltros] = useState(false);
  const [modalAberto, setModalAberto] = useState<'janela' | 'tipo' | 'categoria' | 'aceitacao' | null>(null);

  const registrosComida = useMemo(
    () =>
      todosRegistros
        .filter(r => r.criancaId === criancaAtiva?.id && r.tipo === 'comida')
        .slice()
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [todosRegistros, criancaAtiva],
  );

  const limiteData = useMemo(() => {
    if (janela === 'tudo') return null;
    const d = new Date();
    d.setDate(d.getDate() - (Number(janela) - 1));
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [janela]);

  const alimentosPorId = useMemo(() => new Map(alimentosBase.map(a => [a.id, a])), [alimentosBase]);
  const termoBusca = buscaAlimento.trim().toLowerCase();

  const registrosFiltrados = useMemo(() => {
    return registrosComida.filter(r => {
      if (limiteData !== null && new Date(r.data).getTime() < limiteData) return false;
      const dados = r.dados as ComidaDados | undefined;
      if (tipoFiltro && dados?.tipoRefeicao !== tipoFiltro) return false;
      const itens = dados?.itens ?? [];
      if (categoriaFiltro) {
        const temCategoria = itens.some(i => alimentosPorId.get(i.alimentoId)?.categoria === categoriaFiltro);
        if (!temCategoria) return false;
      }
      if (aceitacaoFiltro) {
        const temAceitacao = itens.some(i => i.aceitacao === aceitacaoFiltro);
        if (!temAceitacao) return false;
      }
      if (termoBusca) {
        const temAlimento = itens.some(i =>
          (alimentosPorId.get(i.alimentoId)?.nomeExibicao ?? '').toLowerCase().includes(termoBusca),
        );
        if (!temAlimento) return false;
      }
      return true;
    });
  }, [registrosComida, limiteData, tipoFiltro, categoriaFiltro, aceitacaoFiltro, termoBusca, alimentosPorId]);

  const diasNoPeriodo = janela === 'tudo' ? Math.max(1, registrosFiltrados.length ? 90 : 1) : Number(janela);

  const indicadores = useMemo(
    () => indicadoresAlimentacao(registrosFiltrados, alimentosBase, diasNoPeriodo),
    [registrosFiltrados, alimentosBase, diasNoPeriodo],
  );

  const novosAlimentosNoPeriodo = useMemo(() => {
    if (!limiteData) {
      const vistos = new Set<string>();
      let novos = 0;
      registrosComida
        .slice()
        .reverse()
        .forEach(r => {
          const itens = (r.dados as ComidaDados | undefined)?.itens ?? [];
          itens.forEach(i => {
            if (!vistos.has(i.alimentoId)) {
              vistos.add(i.alimentoId);
              novos += 1;
            }
          });
        });
      return novos;
    }
    const antesDoPeriodo = new Set<string>();
    registrosComida
      .filter(r => new Date(r.data).getTime() < limiteData)
      .forEach(r => {
        const itens = (r.dados as ComidaDados | undefined)?.itens ?? [];
        itens.forEach(i => antesDoPeriodo.add(i.alimentoId));
      });
    const novosNoPeriodo = new Set<string>();
    registrosFiltrados.forEach(r => {
      const itens = (r.dados as ComidaDados | undefined)?.itens ?? [];
      itens.forEach(i => {
        if (!antesDoPeriodo.has(i.alimentoId)) novosNoPeriodo.add(i.alimentoId);
      });
    });
    return novosNoPeriodo.size;
  }, [registrosComida, registrosFiltrados, limiteData]);

  const categoriasDiferentes = useMemo(() => {
    const set = new Set<CategoriaAlimento>();
    registrosFiltrados.forEach(r => {
      const itens = (r.dados as ComidaDados | undefined)?.itens ?? [];
      itens.forEach(i => {
        const cat = alimentosPorId.get(i.alimentoId)?.categoria;
        if (cat) set.add(cat);
      });
    });
    return set.size;
  }, [registrosFiltrados, alimentosPorId]);

  const aceitacaoVsRejeicao = useMemo(() => {
    let aceitos = 0;
    let recusados = 0;
    registrosFiltrados.forEach(r => {
      const itens = (r.dados as ComidaDados | undefined)?.itens ?? [];
      itens.forEach(i => {
        if (i.consumo === 'recusado' || i.aceitacao === 'recusou') recusados += 1;
        else if (i.consumo === 'total' || i.consumo === 'parcial') aceitos += 1;
      });
    });
    return { aceitos, recusados };
  }, [registrosFiltrados]);

  const nutricaoEstimada = useMemo(() => {
    let considerados = 0;
    let ignorados = 0;
    const total = {
      energiaKcal: 0,
      proteinaG: 0,
      carboidratoG: 0,
      gordurasTotaisG: 0,
      fibraG: 0,
      sodioMg: 0,
      calcioMg: 0,
      ferroMg: 0,
    };
    registrosFiltrados.forEach(r => {
      const itens = (r.dados as ComidaDados | undefined)?.itens ?? [];
      const resultado = estimarNutrientesRefeicao(itens, alimentosBase);
      considerados += resultado.itensConsiderados;
      ignorados += resultado.itensIgnorados;
      total.energiaKcal += resultado.nutrientes.energiaKcal ?? 0;
      total.proteinaG += resultado.nutrientes.proteinaG ?? 0;
      total.carboidratoG += resultado.nutrientes.carboidratoG ?? 0;
      total.gordurasTotaisG += resultado.nutrientes.gordurasTotaisG ?? 0;
      total.fibraG += resultado.nutrientes.fibraG ?? 0;
      total.sodioMg += resultado.nutrientes.sodioMg ?? 0;
      total.calcioMg += resultado.nutrientes.calcioMg ?? 0;
      total.ferroMg += resultado.nutrientes.ferroMg ?? 0;
    });
    return { total, considerados, ignorados, temDados: considerados > 0 };
  }, [registrosFiltrados, alimentosBase]);

  const mediaDiaria = useMemo(() => {
    const dias = Math.max(1, diasNoPeriodo);
    const t = nutricaoEstimada.total;
    return {
      energiaKcal: t.energiaKcal / dias,
      proteinaG: t.proteinaG / dias,
      carboidratoG: t.carboidratoG / dias,
      gordurasTotaisG: t.gordurasTotaisG / dias,
      fibraG: t.fibraG / dias,
      sodioMg: t.sodioMg / dias,
      calcioMg: t.calcioMg / dias,
      ferroMg: t.ferroMg / dias,
    };
  }, [nutricaoEstimada, diasNoPeriodo]);

  const referenciaDri = useMemo(() => {
    if (!criancaAtiva) return null;
    return referenciaDRI(idadeEmMeses(criancaAtiva.dataNascimento), criancaAtiva.sexo);
  }, [criancaAtiva]);

  const maiorFrequencia = Math.max(1, ...indicadores.maisConsumidos.map(r => r.vezes));
  const maiorCategoria = Math.max(1, ...indicadores.frequenciaPorCategoria.map(c => c.vezes));

  const filtrosAtivos = [tipoFiltro, categoriaFiltro, aceitacaoFiltro, termoBusca || null].filter(Boolean).length;
  const resumoFiltros = [
    OPCOES_JANELA.find(o => o.chave === janela)?.label,
    tipoFiltro ? rotuloTipoRefeicao(tipoFiltro) : null,
    categoriaFiltro ? rotuloCategoria(categoriaFiltro) : null,
    aceitacaoFiltro ? rotuloAceitacao(aceitacaoFiltro) : null,
    buscaAlimento ? `"${buscaAlimento}"` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  function limparFiltros() {
    setJanela('30');
    setTipoFiltro(null);
    setCategoriaFiltro(null);
    setAceitacaoFiltro(null);
    setBuscaAlimento('');
  }

  if (!criancaAtiva) return null;

  const percentualCarboidrato =
    mediaDiaria.energiaKcal > 0 ? ((mediaDiaria.carboidratoG * 4) / mediaDiaria.energiaKcal) * 100 : 0;
  const percentualProteina =
    mediaDiaria.energiaKcal > 0 ? ((mediaDiaria.proteinaG * 4) / mediaDiaria.energiaKcal) * 100 : 0;
  const percentualGordura =
    mediaDiaria.energiaKcal > 0 ? ((mediaDiaria.gordurasTotaisG * 9) / mediaDiaria.energiaKcal) * 100 : 0;

  return (
    <View>
      <TouchableOpacity style={styles.filtrosButton} onPress={() => setShowFiltros(true)}>
        <SlidersHorizontal size={16} color={colors.primary} />
        <Text style={styles.filtrosButtonText}>Filtros</Text>
        {filtrosAtivos > 0 && (
          <View style={styles.filtrosBadge}>
            <Text style={styles.filtrosBadgeText}>{filtrosAtivos}</Text>
          </View>
        )}
      </TouchableOpacity>
      {!!resumoFiltros && <Text style={styles.filtrosResumo}>{resumoFiltros}</Text>}

      <View style={styles.section}>
        <Text style={typography.h4}>Resumo</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Refeições registradas</Text>
            <Text style={styles.kpiValue}>{indicadores.totalRefeicoes}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Média por dia</Text>
            <Text style={styles.kpiValue}>{indicadores.mediaRefeicoesPorDia.toFixed(1)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Alimentos diferentes</Text>
            <Text style={styles.kpiValue}>{indicadores.alimentosDiferentes}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Novos alimentos</Text>
            <Text style={styles.kpiValue}>{novosAlimentosNoPeriodo}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Taxa de aceitação</Text>
            <Text style={styles.kpiValue}>
              {indicadores.taxaAceitacaoMedia != null
                ? `${Math.round(indicadores.taxaAceitacaoMedia * 100)}%`
                : '--'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={typography.h4}>Alimentos</Text>
        {indicadores.maisConsumidos.length ? (
          <>
            <Text style={styles.subTitulo}>Mais consumidos</Text>
            {indicadores.maisConsumidos.map(r => (
              <BarraFrequencia
                key={r.alimento.id}
                label={r.alimento.nomeExibicao}
                valor={r.vezes}
                maximo={maiorFrequencia}
              />
            ))}
            {!!indicadores.maisAceitos.length && (
              <>
                <Text style={styles.subTitulo}>Mais aceitos</Text>
                <Text style={styles.listaTexto}>
                  {indicadores.maisAceitos.map(r => r.alimento.nomeExibicao).join(', ')}
                </Text>
              </>
            )}
            {!!indicadores.maisRecusados.length && (
              <>
                <Text style={styles.subTitulo}>Mais recusados</Text>
                <Text style={styles.listaTexto}>
                  {indicadores.maisRecusados.map(r => r.alimento.nomeExibicao).join(', ')}
                </Text>
              </>
            )}
            <Text style={styles.subTitulo}>Último consumo</Text>
            {indicadores.maisConsumidos.slice(0, 5).map(r => (
              <View key={`ultimo-${r.alimento.id}`} style={styles.popupLinha}>
                <Text style={styles.popupLabel}>{r.alimento.nomeExibicao}</Text>
                <Text style={styles.popupValor}>{formatarDataBR(r.ultimoConsumo)}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.vazioTexto}>Nenhum alimento registrado neste período/filtro.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={typography.h4}>Diversidade</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Alimentos diferentes</Text>
            <Text style={styles.kpiValue}>{indicadores.alimentosDiferentes}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Categorias diferentes</Text>
            <Text style={styles.kpiValue}>{categoriasDiferentes}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={typography.h4}>Categorias mais presentes</Text>
        {indicadores.frequenciaPorCategoria.length ? (
          indicadores.frequenciaPorCategoria.map(c => (
            <BarraFrequencia
              key={c.categoria}
              label={rotuloCategoria(c.categoria)}
              valor={c.vezes}
              maximo={maiorCategoria}
            />
          ))
        ) : (
          <Text style={styles.vazioTexto}>Sem dados suficientes ainda.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={typography.h4}>Aceitação x Rejeição</Text>
        {aceitacaoVsRejeicao.aceitos + aceitacaoVsRejeicao.recusados > 0 ? (
          <>
            <View style={styles.stackedBarTrack}>
              <View style={[styles.stackedBarAceito, { flex: aceitacaoVsRejeicao.aceitos || 0.001 }]} />
              <View style={[styles.stackedBarRecusado, { flex: aceitacaoVsRejeicao.recusados || 0.001 }]} />
            </View>
            <View style={styles.itemAceitacaoRow}>
              <Text style={styles.legendaTexto}>🟢 Aceitos: {aceitacaoVsRejeicao.aceitos}</Text>
              <Text style={styles.legendaTexto}>🔴 Recusados: {aceitacaoVsRejeicao.recusados}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.vazioTexto}>Sem dados suficientes ainda.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={typography.h4}>Nutrição — comparativo com a referência</Text>
        {nutricaoEstimada.temDados ? (
          <>
            <View style={styles.popupLinha}>
              <Text style={styles.popupLabel}>Energia (média/dia)</Text>
              <Text style={styles.popupValor}>{Math.round(mediaDiaria.energiaKcal)} kcal</Text>
            </View>

            {referenciaDri ? (
              <>
                <BarraDRI
                  label="Carboidrato (% das calorias)"
                  valorTexto={`${percentualCarboidrato.toFixed(0)}%`}
                  valorNumero={percentualCarboidrato}
                  faixaMin={referenciaDri.carboidratoAmdrPercent[0]}
                  faixaMax={referenciaDri.carboidratoAmdrPercent[1]}
                  faixaTexto={`${referenciaDri.carboidratoAmdrPercent[0]}–${referenciaDri.carboidratoAmdrPercent[1]}%`}
                  nivel={classificarNivel(
                    percentualCarboidrato,
                    referenciaDri.carboidratoAmdrPercent[0],
                    referenciaDri.carboidratoAmdrPercent[1],
                  )}
                />
                <BarraDRI
                  label="Proteína (% das calorias)"
                  valorTexto={`${percentualProteina.toFixed(0)}%`}
                  valorNumero={percentualProteina}
                  faixaMin={referenciaDri.proteinaAmdrPercent[0]}
                  faixaMax={referenciaDri.proteinaAmdrPercent[1]}
                  faixaTexto={`${referenciaDri.proteinaAmdrPercent[0]}–${referenciaDri.proteinaAmdrPercent[1]}%`}
                  nivel={classificarNivel(
                    percentualProteina,
                    referenciaDri.proteinaAmdrPercent[0],
                    referenciaDri.proteinaAmdrPercent[1],
                  )}
                />
                <BarraDRI
                  label="Gordura (% das calorias)"
                  valorTexto={`${percentualGordura.toFixed(0)}%`}
                  valorNumero={percentualGordura}
                  faixaMin={referenciaDri.gorduraAmdrPercent[0]}
                  faixaMax={referenciaDri.gorduraAmdrPercent[1]}
                  faixaTexto={`${referenciaDri.gorduraAmdrPercent[0]}–${referenciaDri.gorduraAmdrPercent[1]}%`}
                  nivel={classificarNivel(
                    percentualGordura,
                    referenciaDri.gorduraAmdrPercent[0],
                    referenciaDri.gorduraAmdrPercent[1],
                  )}
                />
                <BarraDRI
                  label="Proteína (g/dia)"
                  valorTexto={`${mediaDiaria.proteinaG.toFixed(1)}g`}
                  valorNumero={mediaDiaria.proteinaG}
                  faixaMin={0}
                  faixaMax={referenciaDri.proteinaRdaG}
                  faixaTexto={`RDA ${referenciaDri.proteinaRdaG}g`}
                  nivel={classificarNivel(mediaDiaria.proteinaG, referenciaDri.proteinaRdaG * 0.9, Infinity)}
                />
                <BarraDRI
                  label="Fibras (g/dia)"
                  valorTexto={`${mediaDiaria.fibraG.toFixed(1)}g`}
                  valorNumero={mediaDiaria.fibraG}
                  faixaMin={0}
                  faixaMax={referenciaDri.fibraAiG}
                  faixaTexto={`AI ${referenciaDri.fibraAiG}g`}
                  nivel={classificarNivel(mediaDiaria.fibraG, referenciaDri.fibraAiG * 0.9, Infinity)}
                />
                {mediaDiaria.sodioMg > 0 && (
                  <BarraDRI
                    label="Sódio (mg/dia)"
                    valorTexto={`${Math.round(mediaDiaria.sodioMg)}mg`}
                    valorNumero={mediaDiaria.sodioMg}
                    faixaMin={0}
                    faixaMax={referenciaDri.sodioAiG * 1000}
                    faixaTexto={`teto prático ${(referenciaDri.sodioAiG * 1000).toFixed(0)}mg`}
                    nivel={classificarNivel(mediaDiaria.sodioMg, 0, referenciaDri.sodioAiG * 1000)}
                  />
                )}
                {mediaDiaria.calcioMg > 0 && (
                  <BarraDRI
                    label="Cálcio (mg/dia)"
                    valorTexto={`${Math.round(mediaDiaria.calcioMg)}mg`}
                    valorNumero={mediaDiaria.calcioMg}
                    faixaMin={0}
                    faixaMax={referenciaDri.calcioRdaMg}
                    faixaTexto={`RDA ${referenciaDri.calcioRdaMg}mg`}
                    nivel={classificarNivel(mediaDiaria.calcioMg, referenciaDri.calcioRdaMg * 0.9, Infinity)}
                  />
                )}
                {mediaDiaria.ferroMg > 0 && (
                  <BarraDRI
                    label="Ferro (mg/dia)"
                    valorTexto={`${mediaDiaria.ferroMg.toFixed(1)}mg`}
                    valorNumero={mediaDiaria.ferroMg}
                    faixaMin={0}
                    faixaMax={referenciaDri.ferroRdaMg}
                    faixaTexto={`RDA ${referenciaDri.ferroRdaMg}mg`}
                    nivel={classificarNivel(mediaDiaria.ferroMg, referenciaDri.ferroRdaMg * 0.9, Infinity)}
                  />
                )}
              </>
            ) : (
              <Text style={styles.vazioTexto}>Sem referência DRI disponível para a idade atual da criança.</Text>
            )}

            <Text style={styles.avisoTexto}>
              Estimativa a partir dos alimentos registrados (fonte: Tabela TACO) comparada às
              Dietary Reference Intakes (Institute of Medicine) — é um acompanhamento, não um
              diagnóstico médico. Não considera peso nem nível de atividade física.{' '}
              {nutricaoEstimada.ignorados > 0 &&
                `${nutricaoEstimada.ignorados} item(ns) sem dado nutricional foram ignorados.`}
            </Text>
          </>
        ) : (
          <Text style={styles.vazioTexto}>
            Dados nutricionais ainda não disponíveis para os alimentos registrados neste período.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={typography.h4}>Histórico completo</Text>
        {registrosFiltrados.length ? (
          registrosFiltrados.map(r => {
            const dados = r.dados as ComidaDados | undefined;
            const nomes = (dados?.itens ?? [])
              .map(i => alimentosPorId.get(i.alimentoId)?.nomeExibicao ?? i.alimentoId)
              .join(', ');
            return (
              <View key={r.id} style={styles.historicoCard}>
                <Text style={typography.label}>{rotuloTipoRefeicao(dados?.tipoRefeicao)}</Text>
                <Text style={styles.listaTexto}>{nomes || 'Sem alimentos registrados'}</Text>
                <Text style={styles.historicoData}>
                  {formatarDataBR(r.data)} · {formatarHora(r.data)}
                </Text>
              </View>
            );
          })
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="Nenhum registro encontrado"
            description="Ajuste os filtros acima ou registre uma nova refeição."
          />
        )}
      </View>

      {showFiltros && (
        <BottomSheet onClose={() => setShowFiltros(false)} fillHeight={false}>
          <View style={styles.filtrosSheetHeader}>
            <Text style={typography.h3}>Filtros</Text>
            <TouchableOpacity onPress={() => setShowFiltros(false)}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <CampoDropdown
              label="Período"
              valor={OPCOES_JANELA.find(o => o.chave === janela)?.label ?? 'Selecionar'}
              onPress={() => setModalAberto('janela')}
            />
            <CampoDropdown
              label="Tipo de refeição"
              valor={tipoFiltro ? rotuloTipoRefeicao(tipoFiltro) : 'Todos'}
              onPress={() => setModalAberto('tipo')}
            />
            <CampoDropdown
              label="Categoria"
              valor={categoriaFiltro ? rotuloCategoria(categoriaFiltro) : 'Todas'}
              onPress={() => setModalAberto('categoria')}
            />
            <CampoDropdown
              label="Aceitação"
              valor={aceitacaoFiltro ? rotuloAceitacao(aceitacaoFiltro) : 'Todas'}
              onPress={() => setModalAberto('aceitacao')}
            />

            <View style={styles.campoDropdownWrapper}>
              <Text style={styles.sectionTitulo}>Alimento</Text>
              <View style={styles.buscaWrapper}>
                <Search size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.buscaInput}
                  placeholder="Filtrar por alimento..."
                  placeholderTextColor={colors.placeholder}
                  value={buscaAlimento}
                  onChangeText={setBuscaAlimento}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.limparFiltrosButton} onPress={limparFiltros}>
              <Text style={styles.limparFiltrosText}>Limpar filtros</Text>
            </TouchableOpacity>
          </ScrollView>
        </BottomSheet>
      )}

      <SelecaoModal
        visible={modalAberto === 'janela'}
        titulo="Período"
        opcoes={OPCOES_JANELA.map(o => ({ valor: o.chave, label: o.label }))}
        valorSelecionado={janela}
        onSelecionar={v => setJanela((v ?? '30') as JanelaFiltro)}
        onFechar={() => setModalAberto(null)}
      />
      <SelecaoModal
        visible={modalAberto === 'tipo'}
        titulo="Tipo de refeição"
        opcoes={OPCOES_TIPO_REFEICAO.map(t => ({ valor: t, label: rotuloTipoRefeicao(t) }))}
        valorSelecionado={tipoFiltro}
        onSelecionar={valor => setTipoFiltro((valor as TipoRefeicao) ?? null)}
        onFechar={() => setModalAberto(null)}
      />
      <SelecaoModal
        visible={modalAberto === 'categoria'}
        titulo="Categoria"
        opcoes={OPCOES_CATEGORIA.map(c => ({ valor: c, label: rotuloCategoria(c) }))}
        valorSelecionado={categoriaFiltro}
        onSelecionar={valor => setCategoriaFiltro((valor as CategoriaAlimento) ?? null)}
        onFechar={() => setModalAberto(null)}
      />
      <SelecaoModal
        visible={modalAberto === 'aceitacao'}
        titulo="Aceitação"
        opcoes={OPCOES_ACEITACAO.map(a => ({ valor: a, label: rotuloAceitacao(a) }))}
        valorSelecionado={aceitacaoFiltro}
        onSelecionar={valor => setAceitacaoFiltro((valor as NivelAceitacao) ?? null)}
        onFechar={() => setModalAberto(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filtrosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  filtrosButtonText: {
    ...typography.label,
    color: colors.primary,
    fontSize: 13,
  },
  filtrosBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filtrosBadgeText: {
    ...typography.caption,
    color: '#fff',
    fontSize: 10,
  },
  filtrosResumo: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitulo: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  subTitulo: {
    ...typography.label,
    fontSize: 13,
    color: colors.text,
    marginTop: spacing.sm,
  },
  buscaWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  buscaInput: {
    ...typography.body,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiCard: {
    flexGrow: 1,
    minWidth: '30%',
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  kpiLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  kpiValue: {
    ...typography.h3,
    color: colors.primary,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  barLabel: {
    ...typography.caption,
    color: colors.textMuted,
    width: 100,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.tan,
  },
  barValue: {
    ...typography.caption,
    color: colors.text,
    width: 24,
    textAlign: 'right',
  },
  listaTexto: {
    ...typography.body,
    color: colors.text,
  },
  vazioTexto: {
    ...typography.caption,
    color: colors.textMuted,
  },
  popupLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  popupLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 13,
  },
  popupValor: {
    ...typography.label,
    fontSize: 14,
  },
  stackedBarTrack: {
    flexDirection: 'row',
    height: 16,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.surfaceTint,
  },
  stackedBarAceito: {
    backgroundColor: colors.primary,
  },
  stackedBarRecusado: {
    backgroundColor: colors.red,
  },
  itemAceitacaoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  legendaTexto: {
    ...typography.caption,
    color: colors.textMuted,
  },
  avisoTexto: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  historicoCard: {
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
    marginTop: spacing.xs,
  },
  historicoData: {
    ...typography.caption,
    color: colors.textMuted,
  },
  driItem: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  driHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driLabel: {
    ...typography.label,
    fontSize: 13,
  },
  driBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  driBadgeText: {
    ...typography.caption,
    fontSize: 10,
  },
  driTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    overflow: 'hidden',
    position: 'relative',
  },
  driZonaAlvo: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  driFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  driRodape: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  campoDropdownWrapper: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  filtrosSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  limparFiltrosButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  limparFiltrosText: {
    ...typography.label,
    color: colors.red,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,23,15,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalTitulo: {
    marginBottom: spacing.lg,
  },
  modalScroll: {
    maxHeight: 360,
  },
  modalOpcao: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOpcaoAtiva: {
    color: colors.primary,
    fontFamily: typography.label.fontFamily,
  },
});
