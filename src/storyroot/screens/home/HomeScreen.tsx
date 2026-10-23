import { router } from 'expo-router';
import { format, isToday } from 'date-fns';
import {
  Baby,
  Bell,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Droplet,
  Mic,
  Moon,
  Search,
  SearchX,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { PeriodoPersonalizadoSheet } from '../../components/PeriodoPersonalizadoSheet';
import { StoryRootLogo, StoryRootLogoIcon } from '../../components/StoryRootLogo';
import { TimelineEntry, TimelineItem } from '../../components/TimelineItem';
import { useCriancaAtiva, useCriancasDaConta } from '../../store/childStore';
import { useMemoriesStore } from '../../store/memoriesStore';
import { useRecordsStore } from '../../store/recordsStore';
import { colors, radius, spacing, typography } from '../../theme';
import { formatarIdade } from '../../utils/age';
import {
  anosDasMemorias,
  filtrarMemorias,
  indexarMemorias,
  rotuloMes,
  type FiltroTipoMidia,
} from '../../utils/buscaMemorias';

type FiltroPeriodo = 'tudo' | 'hoje' | '15dias' | '30dias' | 'personalizado';

const FILTRO_OPCOES: { valor: FiltroPeriodo; label: string }[] = [
  { valor: 'tudo', label: 'Todo o período' },
  { valor: 'hoje', label: 'Hoje' },
  { valor: '15dias', label: 'Últimos 15 dias' },
  { valor: '30dias', label: 'Últimos 30 dias' },
  { valor: 'personalizado', label: 'Personalizado' },
];

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const crianca = useCriancaAtiva();
  const criancas = useCriancasDaConta();
  const todosRegistros = useRecordsStore(state => state.registros);
  const todasMemorias = useMemoriesStore(state => state.memorias);

  const [filtro, setFiltro] = useState<FiltroPeriodo>('tudo');
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<FiltroTipoMidia>('todos');
  const [ano, setAno] = useState<number | null>(null);
  const campoBusca = useRef<TextInput>(null);
  const [periodoPersonalizado, setPeriodoPersonalizado] = useState<{
    inicio: Date;
    fim: Date;
  } | null>(null);
  const [showFiltroModal, setShowFiltroModal] = useState(false);
  const [showPeriodoSheet, setShowPeriodoSheet] = useState(false);

  const registros = useMemo(
    () => todosRegistros.filter(r => r.criancaId === crianca?.id),
    [todosRegistros, crianca],
  );
  const memorias = useMemo(
    () =>
      todasMemorias.filter(
        m => m.criancaId === crianca?.id || m.criancaIdsCompartilhado?.includes(crianca?.id ?? ''),
      ),
    [todasMemorias, crianca],
  );

  // "Nossa História" mostra só memórias (fotos/vídeos/áudios/textos) — registros de
  // rotina e de saúde ficam concentrados nas telas Rotina e Saúde, respectivamente.
  const indice = useMemo(() => indexarMemorias(memorias), [memorias]);
  const anos = useMemo(() => anosDasMemorias(memorias), [memorias]);
  const contagemPorTipo = useMemo(() => {
    const contagem: Partial<Record<FiltroTipoMidia, number>> = { todos: memorias.length };
    for (const m of memorias) contagem[m.tipoMidia] = (contagem[m.tipoMidia] ?? 0) + 1;
    return contagem;
  }, [memorias]);

  const filtrosAtivos = !!busca.trim() || tipo !== 'todos' || ano !== null || filtro !== 'tudo';

  function limparFiltros() {
    setBusca('');
    setTipo('todos');
    setAno(null);
    setFiltro('tudo');
  }

  const entradasFiltradas = useMemo(() => {
    const agora = new Date();
    function dentroDoPeriodo(dataIso: string) {
      const data = new Date(dataIso);
      if (filtro === 'tudo') return true;
      if (filtro === 'hoje') return isToday(data);
      if (filtro === '15dias' || filtro === '30dias') {
        const dias = filtro === '15dias' ? 15 : 30;
        const limite = new Date(agora);
        limite.setDate(limite.getDate() - dias);
        return data >= limite && data <= agora;
      }
      if (filtro === 'personalizado' && periodoPersonalizado) {
        const fimDoDia = new Date(periodoPersonalizado.fim);
        fimDoDia.setHours(23, 59, 59, 999);
        return data >= periodoPersonalizado.inicio && data <= fimDoDia;
      }
      return true;
    }
    return filtrarMemorias(indice, { texto: busca, tipo, ano })
      .filter(m => dentroDoPeriodo(m.data))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [indice, busca, tipo, ano, filtro, periodoPersonalizado]);

  // Lista com um cabeçalho por mês ("Outubro de 2026") antes das memórias daquele mês.
  const itensLista = useMemo<ItemLista[]>(() => {
    const itens: ItemLista[] = [];
    let mesAtual = '';
    entradasFiltradas.forEach((memoria, index) => {
      const mes = rotuloMes(memoria.data);
      if (mes !== mesAtual) {
        mesAtual = mes;
        itens.push({ tipo: 'mes', chave: `mes-${mes}`, titulo: mes });
      }
      const proxima = entradasFiltradas[index + 1];
      itens.push({
        tipo: 'memoria',
        chave: `memoria-${memoria.id}`,
        entrada: { kind: 'memoria', data: memoria },
        ultimaDoMes: !proxima || rotuloMes(proxima.data) !== mes,
      });
    });
    return itens;
  }, [entradasFiltradas]);

  const filtroLabel = useMemo(() => {
    if (filtro === 'personalizado' && periodoPersonalizado) {
      return `${format(periodoPersonalizado.inicio, 'dd/MM')} - ${format(periodoPersonalizado.fim, 'dd/MM')}`;
    }
    return FILTRO_OPCOES.find(o => o.valor === filtro)?.label ?? 'Todo o período';
  }, [filtro, periodoPersonalizado]);

  function selecionarFiltro(valor: FiltroPeriodo) {
    setShowFiltroModal(false);
    if (valor === 'personalizado') {
      setShowPeriodoSheet(true);
      return;
    }
    setFiltro(valor);
  }

  const statsHoje = useMemo(() => {
    const hoje = registros.filter(r => isToday(new Date(r.data)));
    return {
      sono: hoje.filter(r => r.tipo === 'sono').length,
      amamentacao: hoje.filter(r => r.tipo === 'amamentacao').length,
      fralda: hoje.filter(r => r.tipo === 'fralda').length,
    };
  }, [registros]);

  return (
    <View style={styles.container}>
      <FlatList
        data={itensLista}
        keyExtractor={item => item.chave}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <>
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
              <View style={styles.headerLeft}>
                <View style={styles.logoSmall}>
                  <StoryRootLogo size={26} />
                </View>
                <Text style={styles.brandName}>Story Root</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.iconCircle}
                  onPress={() => campoBusca.current?.focus()}
                  accessibilityRole="button"
                  accessibilityLabel="Buscar na linha do tempo">
                  <Search size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconCircle}
                  onPress={() => router.push('/(app)/storyroot-main/notificacoes')}>
                  <Bell size={20} color={colors.text} />
                  <View style={styles.notificationDot} />
                </TouchableOpacity>
              </View>
            </View>

            {!!crianca && (
              <View style={styles.profileCardWrapper}>
                <View style={styles.profileCard}>
                  <TouchableOpacity
                    style={styles.profileHeader}
                    activeOpacity={0.85}
                    onPress={() => router.push('/(app)/storyroot-main/selecionar-crianca')}>
                    {crianca.fotoUri ? (
                      <Image
                        source={{ uri: crianca.fotoUri }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Baby size={28} color={colors.primary} />
                      </View>
                    )}
                    <View style={styles.nameAge}>
                      <Text style={typography.h2}>{crianca.nome}</Text>
                      <View style={styles.ageBadge}>
                        <Text style={styles.ageBadgeText}>
                          {formatarIdade(crianca.dataNascimento)}
                        </Text>
                      </View>
                      {criancas.length > 1 && (
                        <Text style={styles.switcherHint}>
                          {criancas.findIndex(c => c.id === crianca.id) + 1} de {criancas.length}{' '}
                          · Trocar perfil
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Moon size={18} color={colors.primary} />
                      <Text style={styles.statText}>Sono {statsHoje.sono}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Baby size={18} color={colors.accent} />
                      <Text style={styles.statText}>Amamentação {statsHoje.amamentacao}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Droplet size={18} color={colors.blue} />
                      <Text style={styles.statText}>Fraldas {statsHoje.fralda}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.sectionTitleRow}>
              <Text style={typography.h3}>Nossa História</Text>
              <TouchableOpacity
                style={styles.dateFilter}
                onPress={() => setShowFiltroModal(true)}>
                <Text style={styles.dateFilterText}>{filtroLabel}</Text>
                <ChevronDown size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {memorias.length > 0 && (
              <View style={styles.buscaSecao}>
                <View style={styles.buscaCampo}>
                  <Search size={18} color={colors.placeholder} />
                  <TextInput
                    ref={campoBusca}
                    style={styles.buscaInput}
                    placeholder="Buscar por título, descrição, data, mês…"
                    placeholderTextColor={colors.placeholder}
                    value={busca}
                    onChangeText={setBusca}
                    returnKeyType="search"
                    autoCorrect={false}
                    accessibilityLabel="Buscar na linha do tempo"
                  />
                  {!!busca && (
                    <TouchableOpacity
                      onPress={() => setBusca('')}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Limpar busca">
                      <X size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsLinha}
                  keyboardShouldPersistTaps="handled">
                  {FILTROS_TIPO.map(opcao => (
                    <ChipFiltro
                      key={opcao.valor}
                      label={opcao.label}
                      quantidade={contagemPorTipo[opcao.valor] ?? 0}
                      icone={opcao.icone}
                      ativo={tipo === opcao.valor}
                      onPress={() => setTipo(opcao.valor)}
                    />
                  ))}
                </ScrollView>

                {anos.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsLinha}
                    keyboardShouldPersistTaps="handled">
                    <ChipFiltro label="Todos os anos" ativo={ano === null} onPress={() => setAno(null)} />
                    {anos.map(valor => (
                      <ChipFiltro
                        key={valor}
                        label={String(valor)}
                        ativo={ano === valor}
                        onPress={() => setAno(ano === valor ? null : valor)}
                      />
                    ))}
                  </ScrollView>
                )}

                {filtrosAtivos && (
                  <View style={styles.resultadoLinha}>
                    <Text style={styles.resultadoTexto}>
                      {entradasFiltradas.length === 1
                        ? '1 memória encontrada'
                        : `${entradasFiltradas.length} memórias encontradas`}
                    </Text>
                    <TouchableOpacity onPress={limparFiltros} accessibilityRole="button">
                      <Text style={styles.limparTexto}>Limpar filtros</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </>
        }
        renderItem={({ item }) =>
          item.tipo === 'mes' ? (
            <Text style={styles.mesTitulo} accessibilityRole="header">
              {item.titulo}
            </Text>
          ) : (
            <View style={styles.timelineItemWrapper}>
              <TimelineItem entry={item.entrada} isLast={item.ultimaDoMes} />
            </View>
          )
        }
        ListEmptyComponent={
          memorias.length > 0 ? (
            <View style={styles.vazioBusca}>
              <EmptyState
                icon={SearchX}
                title="Nada encontrado"
                description="Tente outra palavra, outro tipo ou outro período."
              />
              <TouchableOpacity
                style={styles.vazioBotao}
                onPress={limparFiltros}
                accessibilityRole="button">
                <Text style={styles.limparTexto}>Limpar filtros</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <EmptyState
              icon={StoryRootLogoIcon}
              title="A história ainda vai começar"
              description="Toque no + para registrar cuidados diários e memórias."
            />
          )
        }
      />

      <Modal
        visible={showFiltroModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFiltroModal(false)}
        statusBarTranslucent
        navigationBarTranslucent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFiltroModal(false)}>
          <View style={styles.modalContent}>
            <Text style={[typography.h3, styles.modalTitle]}>Filtrar por período</Text>
            {FILTRO_OPCOES.map(opcao => {
              const ativo = opcao.valor === filtro;
              return (
                <TouchableOpacity
                  key={opcao.valor}
                  style={styles.modalOption}
                  onPress={() => selecionarFiltro(opcao.valor)}>
                  <Text style={[typography.body, ativo && styles.modalOptionTextAtivo]}>
                    {opcao.label}
                  </Text>
                  {ativo && <Check size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <PeriodoPersonalizadoSheet
        visible={showPeriodoSheet}
        valorInicial={periodoPersonalizado}
        onCancel={() => setShowPeriodoSheet(false)}
        onConfirm={periodo => {
          setPeriodoPersonalizado(periodo);
          setFiltro('personalizado');
          setShowPeriodoSheet(false);
        }}
      />
    </View>
  );
}

type ItemLista =
  | { tipo: 'mes'; chave: string; titulo: string }
  | { tipo: 'memoria'; chave: string; entrada: TimelineEntry; ultimaDoMes: boolean };

const FILTROS_TIPO: { valor: FiltroTipoMidia; label: string; icone?: LucideIcon }[] = [
  { valor: 'todos', label: 'Tudo' },
  { valor: 'foto', label: 'Fotos', icone: Camera },
  { valor: 'video', label: 'Vídeos', icone: Video },
  { valor: 'audio', label: 'Áudios', icone: Mic },
];

function ChipFiltro({
  label,
  ativo,
  onPress,
  quantidade,
  icone: Icone,
}: {
  label: string;
  ativo: boolean;
  onPress: () => void;
  quantidade?: number;
  icone?: LucideIcon;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, ativo && styles.chipAtivo]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}>
      {!!Icone && <Icone size={14} color={ativo ? '#fff' : colors.primary} />}
      <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
        {label}
        {quantidade !== undefined ? ` · ${quantidade}` : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  buscaSecao: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  buscaCampo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  buscaInput: {
    ...typography.body,
    flex: 1,
    paddingVertical: spacing.md,
  },
  chipsLinha: {
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
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
    ...typography.label,
    fontSize: 13,
    color: colors.text,
  },
  chipTextoAtivo: {
    color: '#fff',
  },
  resultadoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultadoTexto: {
    ...typography.caption,
    color: colors.textMuted,
  },
  limparTexto: {
    ...typography.label,
    fontSize: 13,
    color: colors.primary,
  },
  mesTitulo: {
    ...typography.label,
    color: colors.textMuted,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  vazioBusca: {
    alignItems: 'center',
  },
  vazioBotao: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingBottom: 140,
  },
  timelineItemWrapper: {
    paddingHorizontal: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoSmall: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
  profileCardWrapper: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.lg,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameAge: {
    flex: 1,
    gap: spacing.xs,
  },
  switcherHint: {
    ...typography.caption,
    color: colors.primary,
  },
  ageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.badgeBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  ageBadgeText: {
    ...typography.label,
    fontSize: 12,
    color: colors.badgeText,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  statText: {
    ...typography.bodySmall,
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    color: colors.textMuted,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  dateFilterText: {
    ...typography.label,
    fontSize: 13,
    color: colors.primary,
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
  },
  modalTitle: {
    marginBottom: spacing.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionTextAtivo: {
    color: colors.primary,
    fontFamily: typography.label.fontFamily,
  },
});
