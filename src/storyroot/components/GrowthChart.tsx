import { Maximize2, ZoomOut } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { BottomSheet } from './BottomSheet';
import { colors, radius, spacing, typography } from '../theme';

interface GrowthPoint {
  idadeMeses: number;
  valor: number;
  /** ISO da data efetiva da medição — usada só na lista do gráfico ampliado. */
  dataIso?: string;
}

interface ReferenciaPonto {
  idadeMeses: number;
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

interface GrowthChartProps {
  titulo: string;
  unidade: string;
  color: string;
  /** Pontos da criança, ordenados por idade crescente. */
  pontos: GrowthPoint[];
  /** Curva de referência (padrão OMS), uma entrada por idade (em meses) amostrada. */
  referencia?: ReferenciaPonto[];
}

const CHART_HEIGHT_COMPACTO = 210;
const CHART_HEIGHT_EXPANDIDO = 300;
const PADDING_Y = 18;
const PADDING_X = 14;
const EIXO_Y_LARGURA = 38;
/** Eixo mostra pelo menos 0–24 meses; se houver dados além disso, se estende para caber tudo. */
const IDADE_MINIMA_EIXO = 24;
const LISTA_ALTURA_MAXIMA = 220;

const PERCENTIL_COR = {
  p97: colors.accent,
  p85: colors.amber,
  p50: colors.primary,
  p15: colors.amber,
  p3: colors.accent,
} as const;

const LEGENDA_REFERENCIA: { chave: keyof typeof PERCENTIL_COR; label: string }[] = [
  { chave: 'p97', label: 'P97 · máximo' },
  { chave: 'p85', label: 'P85' },
  { chave: 'p50', label: 'P50 · mediana' },
  { chave: 'p15', label: 'P15' },
  { chave: 'p3', label: 'P3 · mínimo' },
];

/** Formata número no padrão BR (vírgula decimal), sem casas desnecessárias. */
function formatarNumeroPtBR(valor: number, casas = 1): string {
  const fixo = Number(valor.toFixed(casas));
  return fixo.toString().replace('.', ',');
}

function formatarDataCurta(iso: string): string {
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${d.getFullYear()}`;
}

/** Gera marcações "redondas" (ex.: 5, 10, 15) cobrindo [min, max] em ~`qtd` passos. */
function ticksAgradaveis(min: number, max: number, qtd = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return [min];
  }
  const bruto = (max - min) / qtd;
  const potencia = Math.pow(10, Math.floor(Math.log10(bruto)));
  const normalizado = bruto / potencia;
  let passo: number;
  if (normalizado < 1.5) passo = 1;
  else if (normalizado < 3) passo = 2;
  else if (normalizado < 7) passo = 5;
  else passo = 10;
  passo *= potencia;

  const inicio = Math.floor(min / passo) * passo;
  const fim = Math.ceil(max / passo) * passo;
  const valores: number[] = [];
  for (let v = inicio; v <= fim + passo * 0.5; v += passo) {
    valores.push(Number(v.toFixed(6)));
  }
  return valores;
}

function marcacoesIdade(idadeMaxima: number): number[] {
  const passo = idadeMaxima <= 12 ? 3 : 6;
  const quantidade = Math.floor(idadeMaxima / passo) + 1;
  return Array.from({ length: quantidade }, (_, i) => i * passo);
}

function criarCaminhoSuave(pontos: { x: number; y: number }[]): string {
  if (pontos.length === 0) return '';
  if (pontos.length === 1) return `M ${pontos[0].x} ${pontos[0].y}`;
  if (pontos.length === 2) {
    return `M ${pontos[0].x} ${pontos[0].y} L ${pontos[1].x} ${pontos[1].y}`;
  }

  let caminho = `M ${pontos[0].x} ${pontos[0].y}`;
  for (let i = 1; i < pontos.length - 1; i += 1) {
    const meioX = (pontos[i].x + pontos[i + 1].x) / 2;
    const meioY = (pontos[i].y + pontos[i + 1].y) / 2;
    caminho += ` Q ${pontos[i].x} ${pontos[i].y} ${meioX} ${meioY}`;
  }
  const penultimo = pontos[pontos.length - 2];
  const ultimo = pontos[pontos.length - 1];
  caminho += ` Q ${penultimo.x} ${penultimo.y} ${ultimo.x} ${ultimo.y}`;
  return caminho;
}

const ZOOM_MAXIMO = 3;

function limitar(valor: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, valor));
}

function limiteTranslacao(dimensao: number, escala: number): number {
  return Math.max(0, ((dimensao * escala) - dimensao) / 2);
}

/** Envolve o gráfico ampliado em um gesto de pinça (zoom por aproximação dos dedos). */
function GraficoAmpliavel({ children }: { children: React.ReactNode }) {
  const [escalaAnim] = useState(() => new Animated.Value(1));
  const escalaAtual = useRef(1);
  const [translacaoXAnim] = useState(() => new Animated.Value(0));
  const [translacaoYAnim] = useState(() => new Animated.Value(0));
  const translacaoXAtual = useRef(0);
  const translacaoYAtual = useRef(0);
  const translacaoXInicio = useRef(0);
  const translacaoYInicio = useRef(0);
  const dimensoesArea = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const [zoomAtivo, setZoomAtivo] = useState(false);

  // react-native-gesture-handler's builder API (`.onUpdate`/`.onEnd`/...) only ever
  // invokes these callbacks from native gesture events, never during render — the
  // `react-hooks/refs` rule doesn't recognize this pattern and flags it as unsafe.
  /* eslint-disable react-hooks/refs */
  const pinca = Gesture.Pinch()
    .runOnJS(true)
    .onUpdate(evento => {
      const bruta = escalaAtual.current * evento.scale;
      escalaAnim.setValue(Math.min(ZOOM_MAXIMO, Math.max(1, bruta)));
    })
    .onEnd(evento => {
      escalaAtual.current = Math.min(ZOOM_MAXIMO, Math.max(1, escalaAtual.current * evento.scale));
      setZoomAtivo(escalaAtual.current > 1.02);

      const limiteX = limiteTranslacao(dimensoesArea.current.width, escalaAtual.current);
      const limiteY = limiteTranslacao(dimensoesArea.current.height, escalaAtual.current);
      const xAjustado = limitar(translacaoXAtual.current, -limiteX, limiteX);
      const yAjustado = limitar(translacaoYAtual.current, -limiteY, limiteY);

      translacaoXAtual.current = xAjustado;
      translacaoYAtual.current = yAjustado;

      Animated.parallel([
        Animated.timing(translacaoXAnim, { toValue: xAjustado, duration: 120, useNativeDriver: true }),
        Animated.timing(translacaoYAnim, { toValue: yAjustado, duration: 120, useNativeDriver: true }),
      ]).start();
    });

  const arrasto = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      translacaoXInicio.current = translacaoXAtual.current;
      translacaoYInicio.current = translacaoYAtual.current;
    })
    .onUpdate(evento => {
      if (escalaAtual.current <= 1.01) return;

      const limiteX = limiteTranslacao(dimensoesArea.current.width, escalaAtual.current);
      const limiteY = limiteTranslacao(dimensoesArea.current.height, escalaAtual.current);
      const proximoX = limitar(translacaoXInicio.current + evento.translationX, -limiteX, limiteX);
      const proximoY = limitar(translacaoYInicio.current + evento.translationY, -limiteY, limiteY);

      translacaoXAnim.setValue(proximoX);
      translacaoYAnim.setValue(proximoY);
    })
    .onEnd(evento => {
      if (escalaAtual.current <= 1.01) return;

      const limiteX = limiteTranslacao(dimensoesArea.current.width, escalaAtual.current);
      const limiteY = limiteTranslacao(dimensoesArea.current.height, escalaAtual.current);
      translacaoXAtual.current = limitar(translacaoXInicio.current + evento.translationX, -limiteX, limiteX);
      translacaoYAtual.current = limitar(translacaoYInicio.current + evento.translationY, -limiteY, limiteY);

      translacaoXAnim.setValue(translacaoXAtual.current);
      translacaoYAnim.setValue(translacaoYAtual.current);
    }) as any;
  /* eslint-enable react-hooks/refs */

  function restaurarZoom() {
    escalaAtual.current = 1;
    translacaoXAtual.current = 0;
    translacaoYAtual.current = 0;
    setZoomAtivo(false);
    Animated.parallel([
      Animated.timing(escalaAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translacaoXAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translacaoYAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  }

  const gestoCombinado = Gesture.Simultaneous(pinca, arrasto);

  return (
    <View
      style={styles.zoomWrapper}
      onLayout={evento => {
        dimensoesArea.current = {
          width: evento.nativeEvent.layout.width,
          height: evento.nativeEvent.layout.height,
        };
      }}>
      <GestureDetector gesture={gestoCombinado}>
        <Animated.View
          style={[
            styles.zoomContent,
            {
              transform: [
                { translateX: translacaoXAnim },
                { translateY: translacaoYAnim },
                { scale: escalaAnim },
              ],
            },
          ]}>
          {children}
        </Animated.View>
      </GestureDetector>
      {zoomAtivo && (
        <TouchableOpacity style={styles.zoomResetButton} onPress={restaurarZoom}>
          <ZoomOut size={14} color={colors.surface} />
          <Text style={styles.zoomResetText}>Restaurar zoom</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function Legenda({ color }: { color: string }) {
  return (
    <View style={styles.legendGrid}>
      <View style={[styles.legendItem, styles.legendItemGrid]}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={styles.legendText}>Criança</Text>
      </View>
      {LEGENDA_REFERENCIA.map(({ chave, label }) => (
        <View key={chave} style={[styles.legendItem, styles.legendItemGrid]}>
          <View style={[styles.legendDot, { backgroundColor: PERCENTIL_COR[chave] }]} />
          <Text style={styles.legendText}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function ListaMedidas({ pontos, unidade }: { pontos: GrowthPoint[]; unidade: string }) {
  if (!pontos.length) return null;
  return (
    <View style={styles.listaWrapper}>
      <Text style={styles.listaTitulo}>Medidas registradas</Text>
      <ScrollView
        style={styles.listaScroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled>
        {pontos.map((p, i) => (
          <View key={`${p.idadeMeses}-${i}`} style={styles.listaLinha}>
            <Text style={styles.listaValor}>
              {formatarNumeroPtBR(p.valor)} {unidade}
            </Text>
            <Text style={styles.listaData}>
              {p.dataIso ? formatarDataCurta(p.dataIso) : '—'} · {Math.round(p.idadeMeses)} m
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function ChartBody({
  pontos,
  referencia,
  color,
  altura,
  expandido,
  unidade,
}: {
  pontos: GrowthPoint[];
  referencia: ReferenciaPonto[];
  color: string;
  altura: number;
  expandido: boolean;
  unidade: string;
}) {
  const [width, setWidth] = useState(0);
  const [gradId] = useState(() => `growthGrad${Math.random().toString(36).slice(2, 9)}`);

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  const valoresBrutos = [
    ...pontos.map(p => p.valor),
    ...referencia.flatMap(r => [r.p3, r.p97]),
  ];
  const minBruto = valoresBrutos.length ? Math.min(...valoresBrutos) : 0;
  const maxBruto = valoresBrutos.length ? Math.max(...valoresBrutos) : 1;
  const ticksY = ticksAgradaveis(minBruto, maxBruto, 4);
  const min = ticksY[0];
  const max = ticksY[ticksY.length - 1];
  const range = max - min || 1;

  const idadeMaxima = Math.max(
    IDADE_MINIMA_EIXO,
    ...pontos.map(p => p.idadeMeses),
    ...referencia.map(r => r.idadeMeses),
  );

  function x(idadeMeses: number, usableWidth: number) {
    return PADDING_X + (usableWidth * idadeMeses) / idadeMaxima;
  }

  function y(valor: number, usableHeight: number) {
    return PADDING_Y + usableHeight - ((valor - min) / range) * usableHeight;
  }

  const usableWidth = Math.max(0, width - PADDING_X * 2);
  const usableHeight = altura - PADDING_Y * 2;

  const pontosComCoordenadas = pontos
    .slice()
    .sort((a, b) => a.idadeMeses - b.idadeMeses)
    .map(p => ({ ...p, x: x(p.idadeMeses, usableWidth), y: y(p.valor, usableHeight) }));
  const linha = criarCaminhoSuave(pontosComCoordenadas.map(p => ({ x: p.x, y: p.y })));
  const areaSobLinha =
    pontosComCoordenadas.length > 1
      ? `${linha} L ${pontosComCoordenadas[pontosComCoordenadas.length - 1].x} ${PADDING_Y + usableHeight} L ${pontosComCoordenadas[0].x} ${PADDING_Y + usableHeight} Z`
      : '';

  const referenciaOrdenada = referencia.slice().sort((a, b) => a.idadeMeses - b.idadeMeses);
  const bandaSuperior = referenciaOrdenada.map(
    r => `${x(r.idadeMeses, usableWidth)} ${y(r.p97, usableHeight)}`,
  );
  const bandaInferior = referenciaOrdenada
    .slice()
    .reverse()
    .map(r => `${x(r.idadeMeses, usableWidth)} ${y(r.p3, usableHeight)}`);
  const banda =
    referenciaOrdenada.length > 1
      ? `M ${bandaSuperior.join(' L ')} L ${bandaInferior.join(' L ')} Z`
      : '';

  function linhaPercentil(chave: keyof typeof PERCENTIL_COR) {
    const pontosPercentil = referenciaOrdenada.map(r => ({
      x: x(r.idadeMeses, usableWidth),
      y: y(r[chave], usableHeight),
    }));
    return criarCaminhoSuave(pontosPercentil);
  }

  const ticksX = marcacoesIdade(idadeMaxima);
  const ticksYIntermediarios = ticksY.flatMap((valor, index) => {
    if (index === ticksY.length - 1) return [];
    const proximo = ticksY[index + 1];
    const passo = (proximo - valor) / 4;
    return [valor + passo, valor + passo * 2, valor + passo * 3];
  });
  const ultimoIndex = pontosComCoordenadas.length - 1;

  return (
    <View style={styles.chartPanel}>
      <View style={styles.chartRow}>
        <View style={[styles.eixoYColuna, { height: altura }]}>
          <View style={styles.eixoYUnidadeWrap}>
            <Text style={styles.eixoYUnidadeTexto} numberOfLines={1}>
              ({unidade})
            </Text>
          </View>
          {ticksY.map(v => (
            <View key={`major-${v}`} style={[styles.eixoYTracoMaior, { top: y(v, usableHeight) }]} />
          ))}
          {ticksYIntermediarios.map((v, i) => (
            <View
              key={`minor-${i}-${v.toFixed(3)}`}
              style={[styles.eixoYTracoMenor, { top: y(v, usableHeight) }]}
            />
          ))}
          {ticksY.map(v => (
            <Text key={v} style={[styles.eixoYLabel, { top: y(v, usableHeight) - 6 }]}>
              {formatarNumeroPtBR(v)}
            </Text>
          ))}
        </View>

        <View style={styles.chartWrapper} onLayout={onLayout}>
          {width > 0 && (
            <Svg width={width} height={altura}>
            <Defs>
              <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.36} />
                <Stop offset="1" stopColor={color} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {ticksY.map(v => (
              <Line
                key={v}
                x1={0}
                x2={width}
                y1={y(v, usableHeight)}
                y2={y(v, usableHeight)}
                stroke={colors.indigo}
                strokeWidth={1}
                strokeOpacity={0.12}
              />
            ))}

            {ticksX.map(tick => (
              <Line
                key={tick}
                x1={x(tick, usableWidth)}
                x2={x(tick, usableWidth)}
                y1={PADDING_Y - 4}
                y2={PADDING_Y + usableHeight + 4}
                stroke={colors.indigo}
                strokeWidth={1}
                strokeOpacity={0.1}
              />
            ))}

            {!!banda && <Path d={banda} fill={PERCENTIL_COR.p50} fillOpacity={0.1} />}
            {referenciaOrdenada.length > 1 &&
              LEGENDA_REFERENCIA.map(({ chave }) => (
                <Path
                  key={chave}
                  d={linhaPercentil(chave)}
                  stroke={PERCENTIL_COR[chave]}
                  strokeWidth={chave === 'p50' ? 2 : 1.1}
                  strokeDasharray={chave === 'p50' ? '5,4' : undefined}
                  strokeOpacity={chave === 'p50' ? 0.95 : 0.62}
                  fill="none"
                />
              ))}

            {!!areaSobLinha && <Path d={areaSobLinha} fill={`url(#${gradId})`} />}
            {pontosComCoordenadas.length > 1 && (
              <Path
                d={linha}
                stroke={color}
                strokeWidth={expandido ? 4.5 : 4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
            {pontosComCoordenadas.map((p, i) => {
              const destaque = i === ultimoIndex;
              return (
                <React.Fragment key={p.idadeMeses}>
                  {destaque && <Circle cx={p.x} cy={p.y} r={12} fill={color} fillOpacity={0.22} />}
                  <Circle cx={p.x} cy={p.y} r={destaque ? 6.8 : 4.2} fill={color} />
                  <Circle cx={p.x} cy={p.y} r={destaque ? 2.8 : 1.8} fill={colors.surface} />
                </React.Fragment>
              );
            })}
            </Svg>
          )}
          {width > 0 && (
            <View style={styles.labelsRow}>
              {ticksX.map(tick => (
                <Text
                  key={tick}
                  style={[styles.labelText, { left: x(tick, usableWidth) - 16 }]}>
                  {tick}m
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export function GrowthChart({ titulo, unidade, color, pontos, referencia }: GrowthChartProps) {
  const [expandido, setExpandido] = useState(false);
  const [entradaOpacity] = useState(() => new Animated.Value(0));
  const [entradaTranslateY] = useState(() => new Animated.Value(16));
  const [expandidoOpacity] = useState(() => new Animated.Value(0));
  const [expandidoTranslateY] = useState(() => new Animated.Value(14));

  const referenciaSegura = referencia ?? [];
  const pontosOrdenados = pontos.slice().sort((a, b) => a.idadeMeses - b.idadeMeses);
  const ultimo = pontosOrdenados[pontosOrdenados.length - 1];
  const temReferencia = referenciaSegura.length > 0;
  const semDados = pontos.length === 0;
  const temConteudo = !semDados || temReferencia;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entradaOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(entradaTranslateY, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [entradaOpacity, entradaTranslateY]);

  useEffect(() => {
    if (!expandido) return;
    expandidoOpacity.setValue(0);
    expandidoTranslateY.setValue(14);
    Animated.parallel([
      Animated.timing(expandidoOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(expandidoTranslateY, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [expandido, expandidoOpacity, expandidoTranslateY]);

  return (
    <Animated.View
      style={[
        styles.card,
        { borderColor: `${color}24` },
        { opacity: entradaOpacity, transform: [{ translateY: entradaTranslateY }] },
      ]}>
      <TouchableOpacity
        style={styles.cardTouchable}
        activeOpacity={temConteudo ? 0.7 : 1}
        disabled={!temConteudo}
        onPress={() => setExpandido(true)}>
        <View style={styles.header}>
          <Text style={styles.titulo}>{titulo}</Text>
          <View style={styles.headerRight}>
            {!!ultimo && (
              <View style={[styles.valorPill, { backgroundColor: `${color}1A` }]}> 
                <Text style={[styles.latestValue, { color }]}> 
                  {formatarNumeroPtBR(ultimo.valor)} {unidade}
                </Text>
              </View>
            )}
            {temConteudo && (
              <View style={styles.expandHint}>
                <Maximize2 size={13} color={colors.textMuted} />
              </View>
            )}
          </View>
        </View>

        {!temConteudo ? (
          <Text style={styles.emptyText}>Nenhum registro ainda.</Text>
        ) : (
          <>
            <ChartBody
              pontos={pontosOrdenados}
              referencia={referenciaSegura}
              color={color}
              altura={CHART_HEIGHT_COMPACTO}
              expandido={false}
              unidade={unidade}
            />
            {semDados && (
              <Text style={styles.emptyText}>
                Nenhum registro ainda. As linhas mostram a faixa de referência (OMS).
              </Text>
            )}
          </>
        )}
      </TouchableOpacity>

      {expandido && (
        <BottomSheet onClose={() => setExpandido(false)}>
          <Animated.View
            style={[
              styles.expandedContent,
              { opacity: expandidoOpacity, transform: [{ translateY: expandidoTranslateY }] },
            ]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[typography.h3, styles.expandedTitle]}>{titulo}</Text>
              <GraficoAmpliavel>
                <ChartBody
                  pontos={pontosOrdenados}
                  referencia={referenciaSegura}
                  color={color}
                  altura={CHART_HEIGHT_EXPANDIDO}
                  expandido
                  unidade={unidade}
                />
              </GraficoAmpliavel>
              <Text style={styles.zoomDica}>Aproxime e arraste para explorar cada ponto.</Text>
              {temReferencia && <Legenda color={color} />}
              <ListaMedidas pontos={pontosOrdenados} unidade={unidade} />
            </ScrollView>
          </Animated.View>
        </BottomSheet>
      )}
    </Animated.View>
  );
}

interface GrowthChartStyles {
  card: ViewStyle;
  cardTouchable: ViewStyle;
  titulo: TextStyle;
  header: ViewStyle;
  headerRight: ViewStyle;
  valorPill: ViewStyle;
  latestValue: TextStyle;
  expandHint: ViewStyle;
  emptyText: TextStyle;
  expandedTitle: TextStyle;
  expandedContent: ViewStyle;
  chartPanel: ViewStyle;
  chartRow: ViewStyle;
  eixoYColuna: ViewStyle;
  eixoYUnidadeWrap: ViewStyle;
  eixoYUnidadeTexto: TextStyle;
  eixoYTracoMaior: ViewStyle;
  eixoYTracoMenor: ViewStyle;
  eixoYLabel: TextStyle;
  chartWrapper: ViewStyle;
  labelsRow: ViewStyle;
  labelText: TextStyle;
  legendGrid: ViewStyle;
  legendItem: ViewStyle;
  legendItemGrid: ViewStyle;
  legendDot: ViewStyle;
  legendText: TextStyle;
  listaWrapper: ViewStyle;
  listaTitulo: TextStyle;
  listaScroll: ViewStyle;
  listaLinha: ViewStyle;
  listaValor: TextStyle;
  listaData: TextStyle;
  zoomWrapper: ViewStyle;
  zoomContent: ViewStyle;
  zoomResetButton: ViewStyle;
  zoomResetText: TextStyle;
  zoomDica: TextStyle;
}

const styles = StyleSheet.create<GrowthChartStyles>({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.md,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardTouchable: {
    gap: spacing.md,
  },
  titulo: {
    ...typography.h4,
    fontSize: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  valorPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: 5,
  },
  latestValue: {
    ...typography.label,
    fontSize: 13,
  },
  expandHint: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  expandedTitle: {
    marginBottom: spacing.lg,
  },
  expandedContent: {
    flex: 1,
  },
  chartPanel: {
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingRight: spacing.sm,
    paddingLeft: spacing.xs,
  },
  chartRow: {
    flexDirection: 'row',
  },
  eixoYColuna: {
    width: EIXO_Y_LARGURA,
    position: 'relative',
  },
  eixoYUnidadeWrap: {
    position: 'absolute',
    top: '50%',
    left: -20,
    width: 64,
    alignItems: 'center',
    transform: [{ translateY: -22 }, { rotate: '-90deg' }],
  },
  eixoYUnidadeTexto: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 9,
  },
  eixoYTracoMaior: {
    position: 'absolute',
    right: 0,
    width: 10,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: colors.textMuted,
    opacity: 0.55,
  },
  eixoYTracoMenor: {
    position: 'absolute',
    right: 0,
    width: 6,
    height: 1,
    borderRadius: 1,
    backgroundColor: colors.textMuted,
    opacity: 0.32,
  },
  eixoYLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    position: 'absolute',
    right: spacing.xs,
    width: EIXO_Y_LARGURA - spacing.xs,
    textAlign: 'right',
  },
  chartWrapper: {
    flex: 1,
    gap: spacing.xs,
  },
  labelsRow: {
    height: 16,
    position: 'relative',
  },
  labelText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    position: 'absolute',
    width: 32,
    textAlign: 'center',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingTop: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendItemGrid: {
    flexBasis: '48%',
    minWidth: 126,
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  listaWrapper: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  listaTitulo: {
    ...typography.label,
    fontSize: 13,
  },
  listaScroll: {
    maxHeight: LISTA_ALTURA_MAXIMA,
  },
  listaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  listaValor: {
    ...typography.label,
    fontSize: 14,
  },
  listaData: {
    ...typography.caption,
    color: colors.textMuted,
  },
  zoomWrapper: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceTint,
  },
  zoomContent: {
    width: '100%',
  },
  zoomResetButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.text,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  zoomResetText: {
    ...typography.label,
    color: colors.surface,
    fontSize: 12,
  },
  zoomDica: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
