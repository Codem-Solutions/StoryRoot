import { router } from 'expo-router';
import {
  BarChart3,
  Baby,
  ClipboardList,
  ExternalLink,
  Milk,
  Moon,
  Pencil,
  Trash2,
  Utensils,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { AlimentacaoIndicadores } from '../../components/AlimentacaoIndicadores';
import { BottomSheet } from '../../components/BottomSheet';
import { DatePickerSheet } from '../../components/DatePickerSheet';
import { EmptyState } from '../../components/EmptyState';
import { RECORD_TYPES, TIPOS_ROTINA } from '../../constants/recordTypes';
import { useAlimentosStore } from '../../store/alimentosStore';
import { useCriancaAtiva } from '../../store/childStore';
import { useRecordsStore } from '../../store/recordsStore';
import { colors, radius, spacing, typography } from '../../theme';
import { idadeEmMeses } from '../../utils/age';
import { rotuloTipoRefeicao } from '../../utils/alimentacao';
import {
  duracaoSonoHoras,
  formatarDataBR,
  formatarHora,
  formatarValorExibicao,
} from '../../utils/format';
import { encodeJsonParam } from '../../utils/routerParams';
import { showSaveSuccessToast } from '../../utils/toast';

type AbaRotina = 'sono' | 'amamentacao' | 'alimentacao' | 'registros';
type PeriodoSono = 'Manhã' | 'Tarde' | 'Noite';
type JanelaSono = '7' | '15' | '30' | 'custom';
type Registro = ReturnType<typeof useRecordsStore.getState>['registros'][number];
type IlustracaoAmpliada = 'pega' | 'ordenha' | null;

interface DiaSonoResumo {
  dia: string;
  totalHoras: number;
  porPeriodo: Record<PeriodoSono, number>;
  registros: Registro[];
}

const PERIODOS_SONO: PeriodoSono[] = ['Manhã', 'Tarde', 'Noite'];
const URL_ARTIGO_SONO =
  'https://www.nationalgeographicbrasil.com/ciencia/2023/04/quantas-horas-de-sono-por-dia-sao-ideais-para-cada-idade';
const CORES_PERIODO: Record<PeriodoSono, string> = {
  Manhã: colors.amber,
  Tarde: colors.accent,
  Noite: colors.primary,
};

const URL_OMS_AMAMENTACAO = 'https://www.who.int/health-topics/breastfeeding#tab=tab_1';
const ILUSTRACAO_PEGA_CORRETA = require('../../assets/ilustra_pega_correta.jpg');
const ILUSTRACAO_ORDENHA_ESTIMULO = require('../../assets/ilustra_estimulo_producao.jpg');

const CORES_INTENSIDADE: Record<string, string> = {
  Muito: colors.primary,
  Médio: colors.amber,
  Pouco: colors.accent,
};

const DICAS_REFLUXO = [
  'Mantenha o bebê na vertical, em pé no colo, por 20 a 30 minutos após cada mamada antes de deitá-lo.',
  'Não interrompa a amamentação: o leite materno é digerido mais rápido que fórmula e ajuda a reduzir o refluxo.',
  'Evite pressão no abdômen — não aperte demais a fralda ou roupas na barriga e evite dobrar as perninhas contra o peito logo após mamar.',
  'Na hora de dormir, o bebê deve sempre ficar de barriga para cima em superfície plana; elevar a cabeceira do berço não é mais recomendado (risco de sufocamento), salvo orientação médica específica.',
];

const DICAS_PRODUCAO_LEITE = [
  'Amamente em livre demanda: ofereça o peito sempre que o bebê der sinais de fome, sem horários fixos.',
  'Garanta a pega correta — a boca do bebê deve cobrir a maior parte da aréola, com os lábios virados para fora.',
  'Faça ordenha de estímulo: extrair o leite logo após as mamadas sinaliza ao corpo que é preciso produzir mais.',
  'Hidrate-se bem — deixe sempre água por perto na hora de amamentar.',
  'Descanse e peça apoio: estresse e cansaço extremo podem bloquear a descida do leite.',
];

const PASSOS_PEGA_CORRETA = [
  'Aproxime o bebê com o corpo todo virado para você, barriga com barriga.',
  'Alinhe o nariz do bebê com o mamilo, deixando espaço livre para respirar.',
  'Espere a boca abrir bem e leve o bebê ao peito (não o peito até o bebê).',
  'O queixo deve tocar o peito primeiro, com os lábios virados para fora.',
  'A boca deve cobrir a maior parte da aréola, não só o mamilo.',
];

const PASSOS_ORDENHA_ESTIMULO = [
  'Lave bem as mãos antes de começar.',
  'Posicione o polegar acima e os outros dedos abaixo da aréola, formando um "C".',
  'Pressione suavemente em direção ao peito, sem deslizar os dedos pela pele.',
  'Comprima e solte em um ritmo constante, como o bebê faria ao mamar.',
  'Faça logo após as mamadas para sinalizar ao corpo que é preciso produzir mais leite.',
];

function inicioDoDia(data: Date): Date {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fimDoDia(data: Date): Date {
  const d = new Date(data);
  d.setHours(23, 59, 59, 999);
  return d;
}

function adicionarDias(data: Date, dias: number): Date {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}

function listarDias(inicio: Date, fim: Date): string[] {
  const dias: string[] = [];
  let cursor = inicioDoDia(inicio);
  const fimNormalizado = fimDoDia(fim);
  while (cursor.getTime() <= fimNormalizado.getTime()) {
    dias.push(cursor.toISOString().slice(0, 10));
    cursor = adicionarDias(cursor, 1);
  }
  return dias;
}

function ordenarPorData(a: Registro, b: Registro): number {
  return new Date(b.data).getTime() - new Date(a.data).getTime();
}

function diaRegistroIso(registro: Registro): string {
  const base = registro.dados?.horaInicio || registro.data;
  return diaIso(base);
}

function faixaSonoRecomendada(idadeMeses: number) {
  // Diretriz OMS 2019 para sono infantil (faixas principais até 5 anos).
  if (idadeMeses <= 3) return { min: 14, max: 17, faixa: '0-3 meses' };
  if (idadeMeses <= 11) return { min: 12, max: 16, faixa: '4-11 meses' };
  if (idadeMeses <= 23) return { min: 11, max: 14, faixa: '1-2 anos' };
  if (idadeMeses <= 59) return { min: 10, max: 13, faixa: '3-5 anos' };
  return { min: 9, max: 11, faixa: '6+ anos' };
}

function diaIso(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function formatarHorasCurtas(valor: number): string {
  const minutos = Math.round(valor * 60);
  const horasInteiras = Math.floor(minutos / 60);
  const min = minutos % 60;
  if (horasInteiras === 0) return `${min}min`;
  if (min === 0) return `${horasInteiras}h`;
  return `${horasInteiras}h${String(min).padStart(2, '0')}`;
}

function inferirPeriodoRegistro(registro: any): PeriodoSono {
  const periodo = registro.dados?.periodo;
  if (periodo === 'Manhã' || periodo === 'Tarde' || periodo === 'Noite') return periodo;
  const baseIso = registro.dados?.horaInicio || registro.data;
  const hora = new Date(baseIso).getHours();
  if (hora < 12) return 'Manhã';
  if (hora < 18) return 'Tarde';
  return 'Noite';
}

function SleepDonutChart({
  media7d,
  recomendadoMin,
  recomendadoMax,
}: {
  media7d: number;
  recomendadoMin: number;
  recomendadoMax: number;
}) {
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, media7d, recomendadoMax, recomendadoMin]);

  const recomendado = Math.max(recomendadoMax, 1);
  const dentro = Math.min(media7d, recomendado);
  const faltante = Math.max(recomendado - media7d, 0);
  const excesso = Math.max(media7d - recomendado, 0);
  const total = media7d > recomendado ? media7d : recomendado;

  const segmentos = [
    { valor: dentro, cor: colors.primary },
    { valor: faltante, cor: colors.surfaceTint },
    { valor: excesso, cor: colors.accent },
  ].filter(s => s.valor > 0);

  const size = 168;
  const stroke = 22;
  const raio = (size - stroke) / 2;
  const c = 2 * Math.PI * raio;
  let offset = 0;

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            scale: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            }),
          },
        ],
      }}>
      <View style={styles.pizzaWrap}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={raio}
              stroke={colors.border}
              strokeWidth={stroke}
              fill="none"
            />
            {segmentos.map((segmento, index) => {
              const frac = segmento.valor / total;
              const comprimento = c * frac;
              const dashArray = `${comprimento} ${c - comprimento}`;
              const dashOffset = -offset;
              offset += comprimento;
              return (
                <Circle
                  key={`${segmento.cor}-${index}`}
                  cx={size / 2}
                  cy={size / 2}
                  r={raio}
                  stroke={segmento.cor}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.pizzaCenterLabel}>
          <Text style={styles.pizzaCenterValue}>{formatarHorasCurtas(media7d)}</Text>
          <Text style={styles.pizzaCenterCaption}>média/dia</Text>
        </View>
      </View>

      <View style={styles.pizzaLegendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Dormiu</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotOutline]} />
          <Text style={styles.legendText}>Faltante</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendText}>Excesso</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function SleepCandleChart({
  dados,
  recomendadoMin,
  recomendadoMax,
  onPressDia,
  larguraDisponivel,
}: {
  dados: DiaSonoResumo[];
  recomendadoMin: number;
  recomendadoMax: number;
  onPressDia: (item: DiaSonoResumo) => void;
  larguraDisponivel: number;
}) {
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, dados, recomendadoMax, recomendadoMin]);

  const chartHeight = 176;
  const chartTop = 12;
  const chartBottom = chartTop + chartHeight;
  const candleWidth = 16;
  const leftPad = 34;
  const rightPad = 12;
  const minStepX = 24;
  const innerWidthBase = Math.max(220, larguraDisponivel - leftPad - rightPad);
  const stepX = dados.length ? Math.max(minStepX, innerWidthBase / dados.length) : minStepX;
  const innerWidth = Math.max(innerWidthBase, dados.length * stepX);
  const largura = leftPad + innerWidth + rightPad;
  const maxValor = Math.max(recomendadoMax + 2, ...dados.map(d => d.totalHoras), 1);
  const y = (valor: number) => chartTop + chartHeight - (valor / maxValor) * chartHeight;
  const ticks = Array.from({ length: 5 }, (_, i) => (maxValor / 4) * i).reverse();

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={largura} height={chartHeight + 40}>
          <Rect
            x={leftPad}
            y={chartTop}
            width={innerWidth}
            height={chartHeight}
            rx={10}
            fill="#f9fbf8"
          />
          <Rect
            x={leftPad}
            y={y(recomendadoMax)}
            width={innerWidth}
            height={Math.max(3, y(recomendadoMin) - y(recomendadoMax))}
            fill="#e3f1e7"
            opacity={0.9}
          />

          {ticks.map((tick, index) => {
            const yTick = y(tick);
            return (
              <G key={`h-${index}`}>
                <Line
                  x1={leftPad}
                  y1={yTick}
                  x2={leftPad + innerWidth}
                  y2={yTick}
                  stroke={colors.border}
                  strokeOpacity={0.85}
                />
                <SvgText
                  x={leftPad - 6}
                  y={yTick + 4}
                  fontSize={10}
                  fill={colors.textMuted}
                  textAnchor="end">
                  {Math.round(tick)}h
                </SvgText>
              </G>
            );
          })}

          {dados.map((item, index) => {
            const centroX = leftPad + index * stepX + stepX / 2;
            const candleX = centroX - candleWidth / 2;
            const total = item.totalHoras;
            const bodyTop = y(total);
            const bodyBottom = y(0);
            let acumulado = 0;

            return (
              <G key={item.dia}>
                <Line
                  x1={centroX}
                  y1={chartTop}
                  x2={centroX}
                  y2={chartBottom}
                  stroke={colors.border}
                  strokeOpacity={0.5}
                />
                {total > 0 ? (
                  <>
                    {PERIODOS_SONO.map(periodo => {
                      const valor = item.porPeriodo[periodo];
                      if (valor <= 0) return null;
                      const yInicio = y(acumulado + valor);
                      const yFim = y(acumulado);
                      acumulado += valor;
                      return (
                        <Rect
                          key={`${item.dia}-${periodo}`}
                          x={candleX}
                          y={yInicio}
                          width={candleWidth}
                          height={Math.max(2, yFim - yInicio)}
                          rx={2}
                          fill={CORES_PERIODO[periodo]}
                        />
                      );
                    })}
                    <Rect
                      x={candleX}
                      y={bodyTop}
                      width={candleWidth}
                      height={Math.max(2, bodyBottom - bodyTop)}
                      rx={3}
                      fill="none"
                      stroke={colors.text}
                      strokeOpacity={0.18}
                    />
                  </>
                ) : (
                  <Rect
                    x={candleX}
                    y={bodyBottom - 4}
                    width={candleWidth}
                    height={4}
                    rx={2}
                    fill={colors.border}
                  />
                )}

                <Rect
                  x={centroX - stepX / 2}
                  y={chartTop}
                  width={stepX}
                  height={chartHeight + 20}
                  fill="transparent"
                  onPress={() => onPressDia(item)}
                />
              </G>
            );
          })}
        </Svg>
      </ScrollView>
    </Animated.View>
  );
}

export function RegistrosScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const criancaAtiva = useCriancaAtiva();
  const todosRegistros = useRecordsStore(state => state.registros);
  const removerRegistro = useRecordsStore(state => state.removerRegistro);
  const [aba, setAba] = useState<AbaRotina>('sono');
  const [registroSelecionado, setRegistroSelecionado] = useState<Registro | null>(null);
  const [amamentacaoSelecionada, setAmamentacaoSelecionada] = useState<Registro | null>(null);
  const [alimentacaoSelecionada, setAlimentacaoSelecionada] = useState<Registro | null>(null);
  const [ilustracaoAmpliada, setIlustracaoAmpliada] = useState<IlustracaoAmpliada>(null);
  const [diaSelecionado, setDiaSelecionado] = useState<DiaSonoResumo | null>(null);
  const [janelaSono, setJanelaSono] = useState<JanelaSono>('7');
  const [customInicio, setCustomInicio] = useState<Date>(() => inicioDoDia(adicionarDias(new Date(), -6)));
  const [customFim, setCustomFim] = useState<Date>(() => fimDoDia(new Date()));
  const [showCustomInicioPicker, setShowCustomInicioPicker] = useState(false);
  const [showCustomFimPicker, setShowCustomFimPicker] = useState(false);

  const registrosRotina = useMemo(
    () =>
      todosRegistros.filter(
        r => r.criancaId === criancaAtiva?.id && TIPOS_ROTINA.includes(r.tipo),
      ),
    [todosRegistros, criancaAtiva],
  );

  const registros = useMemo(
    () => registrosRotina.slice().sort(ordenarPorData),
    [registrosRotina],
  );

  const registrosSono = useMemo(
    () =>
      registrosRotina
        .filter(r => r.tipo === 'sono')
        .slice()
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()),
    [registrosRotina],
  );

  const registrosAmamentacao = useMemo(
    () =>
      registrosRotina
        .filter(r => r.tipo === 'amamentacao')
        .slice()
        .sort(ordenarPorData),
    [registrosRotina],
  );

  const registrosComida = useMemo(
    () => registrosRotina.filter(r => r.tipo === 'comida').slice().sort(ordenarPorData),
    [registrosRotina],
  );

  const registrosMamadeira = useMemo(
    () => registrosRotina.filter(r => r.tipo === 'mamadeira').slice().sort(ordenarPorData),
    [registrosRotina],
  );

  const registrosAlimentacao = useMemo(
    () => [...registrosComida, ...registrosMamadeira].sort(ordenarPorData),
    [registrosComida, registrosMamadeira],
  );


  const intervaloSono = useMemo(() => {
    if (janelaSono === 'custom') {
      return {
        inicio: inicioDoDia(customInicio),
        fim: fimDoDia(customFim),
      };
    }
    const dias = Number(janelaSono);
    const fim = fimDoDia(new Date());
    const inicio = inicioDoDia(adicionarDias(fim, -(dias - 1)));
    return { inicio, fim };
  }, [customFim, customInicio, janelaSono]);

  const registrosSonoFiltrados = useMemo(() => {
    const inicioTs = intervaloSono.inicio.getTime();
    const fimTs = intervaloSono.fim.getTime();
    return registrosSono.filter(registro => {
      const base = registro.dados?.horaInicio || registro.data;
      const ts = new Date(base).getTime();
      return ts >= inicioTs && ts <= fimTs;
    });
  }, [intervaloSono.fim, intervaloSono.inicio, registrosSono]);

  const idadeMeses = criancaAtiva ? idadeEmMeses(criancaAtiva.dataNascimento) : 0;
  const recomendacao = faixaSonoRecomendada(idadeMeses);

  const resumoSono = useMemo(() => {
    const diasPeriodo = listarDias(intervaloSono.inicio, intervaloSono.fim);
    const porPeriodoTotal: Record<PeriodoSono, number> = { Manhã: 0, Tarde: 0, Noite: 0 };
    const porPeriodoContagem: Record<PeriodoSono, number> = { Manhã: 0, Tarde: 0, Noite: 0 };
    const mapa = new Map<string, DiaSonoResumo>(
      diasPeriodo.map(dia => [
        dia,
        {
          dia,
          totalHoras: 0,
          porPeriodo: { Manhã: 0, Tarde: 0, Noite: 0 },
          registros: [],
        },
      ]),
    );

    registrosSonoFiltrados.forEach(registro => {
      const inicio = registro.dados?.horaInicio;
      const fim = registro.dados?.horaFim;
      const duracao = duracaoSonoHoras(inicio, fim);
      const dia = diaRegistroIso(registro);
      const resumoDia = mapa.get(dia);
      if (!resumoDia) return;
      resumoDia.registros.push(registro);
      if (duracao <= 0) return;
      resumoDia.totalHoras += duracao;
      const periodo = inferirPeriodoRegistro(registro);
      resumoDia.porPeriodo[periodo] += duracao;
      porPeriodoTotal[periodo] += duracao;
      porPeriodoContagem[periodo] += 1;
    });

    const dias = diasPeriodo.map(dia => {
      const item = mapa.get(dia)!;
      return {
        ...item,
        registros: item.registros.slice().sort(ordenarPorData),
      };
    });

    const mediaJanela = dias.length
      ? dias.reduce((acc, item) => acc + item.totalHoras, 0) / dias.length
      : 0;
    const dentroMeta = dias.filter(
      item => item.totalHoras >= recomendacao.min && item.totalHoras <= recomendacao.max,
    ).length;

    const mediaPeriodo = PERIODOS_SONO.map(periodo => {
      const total = porPeriodoContagem[periodo];
      const media = total ? porPeriodoTotal[periodo] / total : 0;
      return { periodo, media, total };
    });

    return {
      dias,
      mediaJanela,
      diasComMeta: dentroMeta,
      totalDiasJanela: dias.length,
      totalRegistros: registrosSonoFiltrados.length,
      mediaPeriodo,
    };
  }, [intervaloSono.fim, intervaloSono.inicio, recomendacao.max, recomendacao.min, registrosSonoFiltrados]);

  const registrosSonoLista = useMemo(
    () => registrosSonoFiltrados.slice().sort(ordenarPorData),
    [registrosSonoFiltrados],
  );

  const dadosGraficoSono = useMemo(() => {
    const comRegistro = resumoSono.dias.filter(item => item.registros.length > 0);
    const base = comRegistro.length ? comRegistro : resumoSono.dias;
    return base.slice().sort((a, b) => a.dia.localeCompare(b.dia));
  }, [resumoSono.dias]);

  const larguraGraficoSono = Math.max(screenWidth - spacing.xxl * 2 - spacing.lg * 2, 220);

  const janelaLabel = janelaSono === 'custom' ? 'período personalizado' : `${janelaSono} dias`;

  async function abrirReferenciaSono() {
    try {
      await Linking.openURL(URL_ARTIGO_SONO);
    } catch {
      Alert.alert('Não foi possível abrir o link', 'Tente novamente em alguns instantes.');
    }
  }

  function selecionarJanela(janela: JanelaSono) {
    setJanelaSono(janela);
  }

  function atualizarInicioCustom(date: Date) {
    const inicio = inicioDoDia(date);
    setCustomInicio(inicio);
    if (inicio.getTime() > customFim.getTime()) {
      setCustomFim(fimDoDia(inicio));
    }
  }

  function atualizarFimCustom(date: Date) {
    const fim = fimDoDia(date);
    setCustomFim(fim);
    if (fim.getTime() < customInicio.getTime()) {
      setCustomInicio(inicioDoDia(fim));
    }
  }

  function limparFiltroPersonalizado() {
    setCustomInicio(inicioDoDia(adicionarDias(new Date(), -6)));
    setCustomFim(fimDoDia(new Date()));
    setJanelaSono('7');
  }

  function editarSono(registro: Registro) {
    router.push({
      pathname: '/(app)/storyroot-main/registrar',
      params: {
        editarRegistroId: registro.id,
        tipoInicial: 'sono',
        formDataInicial: encodeJsonParam(registro.dados ?? {}),
      },
    });
  }

  function excluirSono(registro: Registro) {
    Alert.alert('Excluir registro de sono', 'Deseja excluir este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          removerRegistro(registro.id);
          if (registroSelecionado?.id === registro.id) setRegistroSelecionado(null);
          showSaveSuccessToast('Registro excluído');
        },
      },
    ]);
  }

  async function abrirReferenciaAmamentacao() {
    try {
      await Linking.openURL(URL_OMS_AMAMENTACAO);
    } catch {
      Alert.alert('Não foi possível abrir o link', 'Tente novamente em alguns instantes.');
    }
  }

  function editarAmamentacao(registro: Registro) {
    router.push({
      pathname: '/(app)/storyroot-main/registrar',
      params: {
        editarRegistroId: registro.id,
        tipoInicial: 'amamentacao',
        formDataInicial: encodeJsonParam(registro.dados ?? {}),
      },
    });
  }

  function excluirAmamentacao(registro: Registro) {
    Alert.alert('Excluir registro de amamentação', 'Deseja excluir este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          removerRegistro(registro.id);
          if (amamentacaoSelecionada?.id === registro.id) setAmamentacaoSelecionada(null);
          showSaveSuccessToast('Registro excluído');
        },
      },
    ]);
  }

  function editarAlimentacao(registro: Registro) {
    router.push({
      pathname: '/(app)/storyroot-main/registrar',
      params: {
        editarRegistroId: registro.id,
        tipoInicial: registro.tipo,
        formDataInicial: encodeJsonParam(registro.dados ?? {}),
      },
    });
  }

  function excluirAlimentacao(registro: Registro) {
    const rotulo = registro.tipo === 'mamadeira' ? 'mamadeira' : 'alimentação';
    Alert.alert(`Excluir registro de ${rotulo}`, 'Deseja excluir este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          removerRegistro(registro.id);
          if (alimentacaoSelecionada?.id === registro.id) setAlimentacaoSelecionada(null);
          showSaveSuccessToast('Registro excluído');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}> 
        <Text style={typography.h2}>Rotina</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.abaSelector}>
            <TouchableOpacity
              style={[styles.abaOption, aba === 'sono' && styles.abaOptionAtiva]}
              onPress={() => setAba('sono')}>
              <Text style={[styles.abaText, aba === 'sono' && styles.abaTextAtiva]}>Sono</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.abaOption, aba === 'amamentacao' && styles.abaOptionAtiva]}
              onPress={() => setAba('amamentacao')}>
              <Text style={[styles.abaText, aba === 'amamentacao' && styles.abaTextAtiva]}>
                Amamentação
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.abaOption, aba === 'alimentacao' && styles.abaOptionAtiva]}
              onPress={() => setAba('alimentacao')}>
              <Text style={[styles.abaText, aba === 'alimentacao' && styles.abaTextAtiva]}>
                Alimentação
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.abaOption, aba === 'registros' && styles.abaOptionAtiva]}
              onPress={() => setAba('registros')}>
              <Text style={[styles.abaText, aba === 'registros' && styles.abaTextAtiva]}>Todos</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {aba === 'sono' ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {registrosSono.length ? (
            <>
              <View style={styles.section}>
                <Text style={typography.h4}>Filtro de período</Text>
                <View style={styles.filterRow}>
                  {([
                    { key: '7', label: '7 dias' },
                    { key: '15', label: '15 dias' },
                    { key: '30', label: '30 dias' },
                    { key: 'custom', label: 'Personalizado' },
                  ] as { key: JanelaSono; label: string }[]).map(opcao => (
                    <TouchableOpacity
                      key={opcao.key}
                      style={[styles.filterChip, janelaSono === opcao.key && styles.filterChipActive]}
                      onPress={() => selecionarJanela(opcao.key)}>
                      <Text style={[styles.filterChipText, janelaSono === opcao.key && styles.filterChipTextActive]}>
                        {opcao.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {janelaSono === 'custom' && (
                  <>
                    <View style={styles.customRangeHeader}>
                      <Text style={styles.customRangeTitle}>Período personalizado ativo</Text>
                      <TouchableOpacity onPress={limparFiltroPersonalizado}>
                        <Text style={styles.customRangeClear}>Limpar filtro</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.customRangeRow}>
                      <TouchableOpacity
                        style={styles.customDateButton}
                        onPress={() => setShowCustomInicioPicker(true)}>
                        <Text style={styles.customDateLabel}>Início</Text>
                        <Text style={styles.customDateValue}>{formatarDataBR(customInicio.toISOString())}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.customDateButton}
                        onPress={() => setShowCustomFimPicker(true)}>
                        <Text style={styles.customDateLabel}>Fim</Text>
                        <Text style={styles.customDateValue}>{formatarDataBR(customFim.toISOString())}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.kpiRow}>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>Média ({janelaLabel})</Text>
                  <Text style={styles.kpiValue}>{formatarHorasCurtas(resumoSono.mediaJanela)}</Text>
                </View>
                <View style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>Registros</Text>
                  <Text style={styles.kpiValue}>{resumoSono.totalRegistros}</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Moon size={18} color={colors.primary} />
                  <Text style={styles.infoTitle}>Meta recomendada de sono</Text>
                </View>
                <Text style={styles.infoText}>
                  Faixa etária: {recomendacao.faixa} · recomendado: {recomendacao.min}h a {recomendacao.max}h por 24h
                </Text>
                <Text style={styles.infoText}>
                  {resumoSono.totalDiasJanela
                    ? `${resumoSono.diasComMeta}/${resumoSono.totalDiasJanela} dias dentro da meta (${janelaLabel})`
                    : 'Ainda não há dias suficientes para calcular aderência'}
                </Text>
                <Text style={styles.infoSubtext}>Referência: Organização Mundial da Saúde (OMS), diretriz 2019.</Text>
                <TouchableOpacity style={styles.linkButton} onPress={abrirReferenciaSono}>
                  <Text style={styles.linkButtonText}>Ler artigo de referência</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <BarChart3 size={18} color={colors.primary} />
                  <Text style={typography.h4}>Mapa diário</Text>
                </View>
                <Text style={styles.chartHint}>Toque em uma vela para ver os registros do dia.</Text>
                <SleepCandleChart
                  dados={dadosGraficoSono}
                  recomendadoMin={recomendacao.min}
                  recomendadoMax={recomendacao.max}
                  onPressDia={setDiaSelecionado}
                  larguraDisponivel={larguraGraficoSono}
                />
                <View style={styles.periodLegendRow}>
                  {PERIODOS_SONO.map(periodo => (
                    <View key={periodo} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: CORES_PERIODO[periodo] }]} />
                      <Text style={styles.legendText}>{periodo}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={typography.h4}>Comparativo: Média x Recomendado</Text>
                <SleepDonutChart
                  media7d={resumoSono.mediaJanela}
                  recomendadoMin={recomendacao.min}
                  recomendadoMax={recomendacao.max}
                />
              </View>

              <View style={styles.section}>
                <Text style={typography.h4}>Média por período</Text>
                {resumoSono.mediaPeriodo.map(item => {
                  const larguraPct = Math.min(100, (item.media / Math.max(recomendacao.max, 1)) * 100);
                  const largura = `${larguraPct}%` as `${number}%`;
                  return (
                    <View key={item.periodo} style={styles.barRow}>
                      <Text style={styles.barLabel}>{item.periodo}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, styles.barFillMuted, { width: largura }]} />
                      </View>
                      <Text style={styles.barValue}>
                        {item.total ? formatarHorasCurtas(item.media) : '--'}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.section}>
                <Text style={typography.h4}>Registros de sono</Text>
                {registrosSonoLista.map(item => {
                    const periodo = inferirPeriodoRegistro(item);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.card}
                        activeOpacity={0.75}
                        onPress={() => setRegistroSelecionado(item)}>
                        <View style={styles.cardTop}>
                          <View style={[styles.iconWrapper, { backgroundColor: colors.primary }]}> 
                            <Moon size={18} color="#fff" />
                          </View>
                          <View style={styles.cardContent}>
                            <Text style={typography.h4}>
                              {periodo} · {formatarValorExibicao(item.tipo, item.valor)}
                            </Text>
                            <Text style={typography.caption}>
                              {formatarDataBR(item.data)} · {formatarHora(item.data)}
                            </Text>
                          </View>
                          <View style={styles.actionsRow}>
                            <TouchableOpacity style={styles.actionButton} onPress={() => editarSono(item)}>
                              <Pencil size={16} color={colors.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton} onPress={() => excluirSono(item)}>
                              <Trash2 size={16} color={colors.red} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </>
          ) : (
            <EmptyState
              icon={Moon}
              title="Nenhum registro de sono"
              description="Toque em + e registre os períodos de sono para liberar o dashboard completo."
            />
          )}
        </ScrollView>
      ) : aba === 'amamentacao' ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Baby size={18} color={colors.accent} />
              <Text style={styles.infoTitle}>Bebês que golfam muito</Text>
            </View>
            <Text style={styles.infoText}>
              A maioria dos bebês apresenta o chamado refluxo fisiológico (ou &quot;regurgitador
              feliz&quot;), que atinge o pico entre os 2 e 4 meses e melhora sozinho. Se o bebê
              golfa, mas continua ganhando peso e sorrindo, não há motivo para pânico.
            </Text>
            {DICAS_REFLUXO.map((dica, index) => (
              <Text key={index} style={styles.bulletText}>
                • {dica}
              </Text>
            ))}
            <Text style={styles.infoSubtext}>
              Referência: Sociedade Brasileira de Pediatria (SBP) e Organização Mundial da Saúde
              (OMS).
            </Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Baby size={18} color={colors.primary} />
              <Text style={styles.infoTitle}>Como aumentar a produção de leite</Text>
            </View>
            <Text style={styles.infoText}>
              A produção de leite segue a lei da oferta e da procura: quanto mais o peito é
              esvaziado, mais leite o corpo produz.
            </Text>
            {DICAS_PRODUCAO_LEITE.map((dica, index) => (
              <Text key={index} style={styles.bulletText}>
                • {dica}
              </Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={typography.h4}>Passo a passo: pega correta</Text>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.illustrationPressable}
              onPress={() => setIlustracaoAmpliada('pega')}>
              <Image
                source={ILUSTRACAO_PEGA_CORRETA}
                style={styles.illustrationImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
            {PASSOS_PEGA_CORRETA.map((passo, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{passo}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={typography.h4}>Passo a passo: ordenha de estímulo</Text>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.illustrationPressable}
              onPress={() => setIlustracaoAmpliada('ordenha')}>
              <Image
                source={ILUSTRACAO_ORDENHA_ESTIMULO}
                style={styles.illustrationImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
            {PASSOS_ORDENHA_ESTIMULO.map((passo, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{passo}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoSubtext}>
              A OMS e a UNICEF recomendam que as crianças iniciem a amamentação na primeira hora após o nascimento.
            </Text>
            <TouchableOpacity style={styles.linkButton} onPress={abrirReferenciaAmamentacao}>
              <ExternalLink size={14} color={colors.primary} />
              <Text style={styles.linkButtonText}>Ver página da OMS sobre amamentação</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={typography.h4}>Registros de amamentação</Text>
            {registrosAmamentacao.length ? (
              registrosAmamentacao.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.75}
                  onPress={() => setAmamentacaoSelecionada(item)}>
                  <View style={styles.cardTop}>
                    <View
                      style={[
                        styles.iconWrapper,
                        {
                          backgroundColor: item.dados?.intensidade
                            ? CORES_INTENSIDADE[item.dados.intensidade]
                            : colors.accent,
                        },
                      ]}>
                      <Baby size={18} color="#fff" />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={typography.h4}>
                        {item.dados?.periodo || 'Amamentação'}
                        {item.dados?.intensidade ? ` · ${item.dados.intensidade}` : ''}
                      </Text>
                      <Text style={typography.caption}>
                        {formatarDataBR(item.data)} · {formatarHora(item.data)}
                      </Text>
                    </View>
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => editarAmamentacao(item)}>
                        <Pencil size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => excluirAmamentacao(item)}>
                        <Trash2 size={16} color={colors.red} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <EmptyState
                icon={Baby}
                title="Nenhum registro de amamentação"
                description="Toque em + e registre as mamadas para acompanhar a rotina do bebê."
              />
            )}
          </View>
        </ScrollView>
      ) : aba === 'alimentacao' ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={typography.h4}>Últimos registros</Text>
            {registrosAlimentacao.length ? (
              registrosAlimentacao.map(item => {
                const isMamadeira = item.tipo === 'mamadeira';
                const Icon = isMamadeira ? Milk : Utensils;
                const titulo = isMamadeira
                  ? formatarValorExibicao(item.tipo, item.valor) || 'Mamadeira'
                  : item.dados?.tipoRefeicao
                    ? rotuloTipoRefeicao(item.dados.tipoRefeicao)
                    : formatarValorExibicao(item.tipo, item.valor) || 'Alimentação';
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.card}
                    activeOpacity={0.75}
                    onPress={() => setAlimentacaoSelecionada(item)}>
                    <View style={styles.cardTop}>
                      <View
                        style={[
                          styles.iconWrapper,
                          { backgroundColor: isMamadeira ? colors.indigo : colors.tan },
                        ]}>
                        <Icon size={18} color="#fff" />
                      </View>
                      <View style={styles.cardContent}>
                        <Text style={typography.h4}>{titulo}</Text>
                        <Text style={typography.caption}>
                          {formatarDataBR(item.data)} · {formatarHora(item.data)}
                        </Text>
                      </View>
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => editarAlimentacao(item)}>
                          <Pencil size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => excluirAlimentacao(item)}>
                          <Trash2 size={16} color={colors.red} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <EmptyState
                icon={Utensils}
                title="Nenhum registro de alimentação"
                description="Toque em + e registre as refeições para acompanhar a rotina alimentar."
              />
            )}
          </View>

          <AlimentacaoIndicadores />
        </ScrollView>
      ) : (
        <FlatList
          data={registros}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const meta = RECORD_TYPES[item.tipo];
            const Icon = meta.icon;
            const valorExibicao = formatarValorExibicao(item.tipo, item.valor);
            return (
              <View style={styles.card}>
                <View style={[styles.iconWrapper, { backgroundColor: meta.color }]}> 
                  <Icon size={18} color="#fff" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={typography.h4}>
                    {meta.label}
                    {valorExibicao ? ` · ${valorExibicao}` : ''}
                  </Text>
                  <Text style={typography.caption}>
                    {formatarDataBR(item.data)} · {formatarHora(item.data)}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon={ClipboardList}
              title="Nenhum registro ainda"
              description="Toque em + para registrar sono, amamentação, fralda e mais."
            />
          }
        />
      )}

      {!!diaSelecionado && (
        <BottomSheet onClose={() => setDiaSelecionado(null)} fillHeight={false}>
          <Text style={typography.h3}>Sono em {formatarDataBR(diaSelecionado.dia)}</Text>
          <Text style={styles.popupData}>Total no dia: {formatarHorasCurtas(diaSelecionado.totalHoras)}</Text>

          {diaSelecionado.registros.length ? (
            <View style={styles.dayRecordsList}>
              {diaSelecionado.registros.map(registro => {
                const periodo = inferirPeriodoRegistro(registro);
                return (
                  <TouchableOpacity
                    key={registro.id}
                    style={styles.dayRecordItem}
                    onPress={() => {
                      setDiaSelecionado(null);
                      setRegistroSelecionado(registro);
                    }}>
                    <View style={styles.dayRecordMain}>
                      <View style={[styles.legendDot, { backgroundColor: CORES_PERIODO[periodo] }]} />
                      <Text style={styles.dayRecordTitle}>
                        {periodo} · {formatarValorExibicao(registro.tipo, registro.valor)}
                      </Text>
                    </View>
                    <Text style={styles.dayRecordTime}>
                      {registro.dados?.horaInicio
                        ? `${formatarHora(registro.dados.horaInicio)} → ${formatarHora(registro.dados?.horaFim || registro.data)}`
                        : formatarHora(registro.data)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.infoSubtext}>Nenhum sono registrado neste dia.</Text>
          )}
        </BottomSheet>
      )}

      {!!registroSelecionado && (
        <BottomSheet onClose={() => setRegistroSelecionado(null)} fillHeight={false}>
          <Text style={typography.h3}>Detalhes do sono</Text>
          <Text style={styles.popupData}>
            {formatarDataBR(registroSelecionado.data)} · {formatarHora(registroSelecionado.data)}
          </Text>

          <View style={styles.popupLinhas}>
            <View style={styles.popupLinha}>
              <Text style={styles.popupLabel}>Período</Text>
              <Text style={styles.popupValor}>{inferirPeriodoRegistro(registroSelecionado)}</Text>
            </View>
            <View style={styles.popupLinha}>
              <Text style={styles.popupLabel}>Hora inicial</Text>
              <Text style={styles.popupValor}>
                {registroSelecionado.dados?.horaInicio
                  ? formatarHora(registroSelecionado.dados.horaInicio)
                  : '--'}
              </Text>
            </View>
            <View style={styles.popupLinha}>
              <Text style={styles.popupLabel}>Hora final</Text>
              <Text style={styles.popupValor}>
                {registroSelecionado.dados?.horaFim ? formatarHora(registroSelecionado.dados.horaFim) : '--'}
              </Text>
            </View>
            <View style={styles.popupLinha}>
              <Text style={styles.popupLabel}>Duração</Text>
              <Text style={styles.popupValor}>
                {formatarHorasCurtas(
                  duracaoSonoHoras(
                    registroSelecionado.dados?.horaInicio,
                    registroSelecionado.dados?.horaFim,
                  ),
                )}
              </Text>
            </View>
          </View>

          <View style={styles.popupActions}>
            <TouchableOpacity
              style={[styles.popupActionButton, styles.popupActionEdit]}
              onPress={() => {
                const alvo = registroSelecionado;
                setRegistroSelecionado(null);
                editarSono(alvo);
              }}>
              <Pencil size={16} color={colors.primary} />
              <Text style={styles.popupActionText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.popupActionButton, styles.popupActionDelete]}
              onPress={() => excluirSono(registroSelecionado)}>
              <Trash2 size={16} color={colors.red} />
              <Text style={[styles.popupActionText, { color: colors.red }]}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      )}

      {!!amamentacaoSelecionada && (
        <BottomSheet onClose={() => setAmamentacaoSelecionada(null)} fillHeight={false}>
          <Text style={typography.h3}>Detalhes da mamada</Text>
          <Text style={styles.popupData}>
            {formatarDataBR(amamentacaoSelecionada.data)} · {formatarHora(amamentacaoSelecionada.data)}
          </Text>

          <View style={styles.popupLinhas}>
            <View style={styles.popupLinha}>
              <Text style={styles.popupLabel}>Período</Text>
              <Text style={styles.popupValor}>{amamentacaoSelecionada.dados?.periodo || '--'}</Text>
            </View>
            <View style={styles.popupLinha}>
              <Text style={styles.popupLabel}>Intensidade</Text>
              <Text style={styles.popupValor}>
                {amamentacaoSelecionada.dados?.intensidade || '--'}
              </Text>
            </View>
            {!!amamentacaoSelecionada.dados?.detalhes && (
              <View style={styles.popupLinha}>
                <Text style={styles.popupLabel}>Detalhes</Text>
                <Text style={styles.popupValor}>{amamentacaoSelecionada.dados.detalhes}</Text>
              </View>
            )}
          </View>

          <View style={styles.popupActions}>
            <TouchableOpacity
              style={[styles.popupActionButton, styles.popupActionEdit]}
              onPress={() => {
                const alvo = amamentacaoSelecionada;
                setAmamentacaoSelecionada(null);
                editarAmamentacao(alvo);
              }}>
              <Pencil size={16} color={colors.primary} />
              <Text style={styles.popupActionText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.popupActionButton, styles.popupActionDelete]}
              onPress={() => excluirAmamentacao(amamentacaoSelecionada)}>
              <Trash2 size={16} color={colors.red} />
              <Text style={[styles.popupActionText, { color: colors.red }]}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      )}

      {!!alimentacaoSelecionada && (
        <BottomSheet onClose={() => setAlimentacaoSelecionada(null)} fillHeight={false}>
          <Text style={typography.h3}>
            {alimentacaoSelecionada.tipo === 'mamadeira' ? 'Detalhes da mamadeira' : 'Detalhes da refeição'}
          </Text>
          <Text style={styles.popupData}>
            {formatarDataBR(alimentacaoSelecionada.data)} · {formatarHora(alimentacaoSelecionada.data)}
          </Text>

          <View style={styles.popupLinhas}>
            {alimentacaoSelecionada.tipo === 'mamadeira' ? (
              <>
                <View style={styles.popupLinha}>
                  <Text style={styles.popupLabel}>Tipo de leite</Text>
                  <Text style={styles.popupValor}>
                    {formatarValorExibicao(alimentacaoSelecionada.tipo, alimentacaoSelecionada.valor)}
                  </Text>
                </View>
                {!!alimentacaoSelecionada.dados?.observacao && (
                  <View style={styles.popupLinha}>
                    <Text style={styles.popupLabel}>Observação</Text>
                    <Text style={styles.popupValor}>{alimentacaoSelecionada.dados.observacao}</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <View style={styles.popupLinha}>
                  <Text style={styles.popupLabel}>Tipo de refeição</Text>
                  <Text style={styles.popupValor}>
                    {rotuloTipoRefeicao(alimentacaoSelecionada.dados?.tipoRefeicao)}
                  </Text>
                </View>
                {(alimentacaoSelecionada.dados?.itens ?? []).map((item: any, index: number) => {
                  const alimento = useAlimentosStore
                    .getState()
                    .alimentos.find(a => a.id === item.alimentoId);
                  return (
                    <View key={index} style={styles.popupLinha}>
                      <Text style={styles.popupLabel}>{alimento?.nomeExibicao ?? item.alimentoId}</Text>
                      <Text style={styles.popupValor}>
                        {item.consumo === 'total'
                          ? 'Comeu tudo'
                          : item.consumo === 'parcial'
                            ? 'Comeu parte'
                            : 'Recusou'}
                      </Text>
                    </View>
                  );
                })}
                {!!alimentacaoSelecionada.dados?.observacao && (
                  <View style={styles.popupLinha}>
                    <Text style={styles.popupLabel}>Observação</Text>
                    <Text style={styles.popupValor}>{alimentacaoSelecionada.dados.observacao}</Text>
                  </View>
                )}
              </>
            )}
          </View>

          <View style={styles.popupActions}>
            <TouchableOpacity
              style={[styles.popupActionButton, styles.popupActionEdit]}
              onPress={() => {
                const alvo = alimentacaoSelecionada;
                setAlimentacaoSelecionada(null);
                editarAlimentacao(alvo);
              }}>
              <Pencil size={16} color={colors.primary} />
              <Text style={styles.popupActionText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.popupActionButton, styles.popupActionDelete]}
              onPress={() => excluirAlimentacao(alimentacaoSelecionada)}>
              <Trash2 size={16} color={colors.red} />
              <Text style={[styles.popupActionText, { color: colors.red }]}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      )}

      <Modal
        visible={ilustracaoAmpliada !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setIlustracaoAmpliada(null)}>
        <View style={styles.illustrationZoomOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.illustrationZoomBackdrop}
            onPress={() => setIlustracaoAmpliada(null)}
          />
          <View style={styles.illustrationZoomCard}>
            <Text style={styles.illustrationZoomTitle}>
              {ilustracaoAmpliada === 'pega' ? 'Pega correta (ampliada)' : 'Ordenha de estímulo (ampliada)'}
            </Text>
            <Image
              source={
                ilustracaoAmpliada === 'pega'
                  ? ILUSTRACAO_PEGA_CORRETA
                  : ILUSTRACAO_ORDENHA_ESTIMULO
              }
              style={styles.illustrationZoomImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>

      <DatePickerSheet
        visible={showCustomInicioPicker}
        value={customInicio}
        onCancel={() => setShowCustomInicioPicker(false)}
        onConfirm={date => {
          setShowCustomInicioPicker(false);
          atualizarInicioCustom(date);
        }}
      />
      <DatePickerSheet
        visible={showCustomFimPicker}
        value={customFim}
        onCancel={() => setShowCustomFimPicker(false)}
        onConfirm={date => {
          setShowCustomFimPicker(false);
          atualizarFimCustom(date);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  abaSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.pill,
    padding: 3,
    alignSelf: 'flex-start',
  },
  abaOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  abaOptionAtiva: {
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  abaText: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 13,
  },
  abaTextAtiva: {
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: 140,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 12,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  customRangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  customRangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  customRangeTitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  customRangeClear: {
    ...typography.label,
    color: colors.primary,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  customDateButton: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  customDateLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  customDateValue: {
    ...typography.label,
    color: colors.text,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
  infoCard: {
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
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoTitle: {
    ...typography.h4,
  },
  infoText: {
    ...typography.body,
    color: colors.text,
  },
  infoSubtext: {
    ...typography.caption,
    color: colors.textMuted,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingVertical: 2,
  },
  linkButtonText: {
    ...typography.label,
    color: colors.primary,
    textDecorationLine: 'underline',
    fontSize: 13,
  },
  illustrationPressable: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  illustrationImage: {
    width: '100%',
    height: 210,
  },
  illustrationZoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  illustrationZoomBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  illustrationZoomCard: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  illustrationZoomImage: {
    width: '100%',
    height: 360,
    borderRadius: radius.lg,
  },
  illustrationZoomTitle: {
    ...typography.label,
    color: colors.text,
    textAlign: 'center',
  },
  bulletText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepBadgeText: {
    ...typography.label,
    color: '#fff',
    fontSize: 12,
  },
  stepText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  pizzaWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  pizzaCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pizzaCenterValue: {
    ...typography.h3,
    color: colors.primary,
  },
  pizzaCenterCaption: {
    ...typography.caption,
    color: colors.textMuted,
  },
  pizzaLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  legendDotOutline: {
    backgroundColor: colors.surfaceTint,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  periodLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chartHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barLabel: {
    ...typography.caption,
    color: colors.textMuted,
    width: 68,
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  barFillMuted: {
    backgroundColor: colors.indigo,
  },
  barValue: {
    ...typography.caption,
    color: colors.text,
    width: 46,
    textAlign: 'right',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupData: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  popupLinhas: {
    gap: spacing.md,
  },
  dayRecordsList: {
    gap: spacing.sm,
  },
  dayRecordItem: {
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  dayRecordMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayRecordTitle: {
    ...typography.label,
    color: colors.text,
    flex: 1,
  },
  dayRecordTime: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: 18,
  },
  popupLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  popupLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 13,
  },
  popupValor: {
    ...typography.h4,
  },
  popupActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  popupActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  popupActionEdit: {
    backgroundColor: colors.surfaceTint,
  },
  popupActionDelete: {
    backgroundColor: '#fdecec',
  },
  popupActionText: {
    ...typography.label,
    color: colors.primary,
  },
});
