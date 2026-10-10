import { router } from 'expo-router';
import { format, isToday } from 'date-fns';
import {
  Baby,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Droplet,
  Moon,
  Search,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
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

type FiltroPeriodo = 'hoje' | '15dias' | '30dias' | 'personalizado';

const FILTRO_OPCOES: { valor: FiltroPeriodo; label: string }[] = [
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

  const [filtro, setFiltro] = useState<FiltroPeriodo>('hoje');
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
  const entradas = useMemo<TimelineEntry[]>(() => {
    const doMemorias: TimelineEntry[] = memorias.map(data => ({
      kind: 'memoria',
      data,
    }));
    return doMemorias.sort(
      (a, b) => new Date(b.data.data).getTime() - new Date(a.data.data).getTime(),
    );
  }, [memorias]);

  const entradasFiltradas = useMemo(() => {
    const agora = new Date();
    function dentroDoPeriodo(dataIso: string) {
      const data = new Date(dataIso);
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
    return entradas.filter(e => dentroDoPeriodo(e.data.data));
  }, [entradas, filtro, periodoPersonalizado]);

  const filtroLabel = useMemo(() => {
    if (filtro === 'personalizado' && periodoPersonalizado) {
      return `${format(periodoPersonalizado.inicio, 'dd/MM')} - ${format(periodoPersonalizado.fim, 'dd/MM')}`;
    }
    return FILTRO_OPCOES.find(o => o.valor === filtro)?.label ?? 'Hoje';
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
        data={entradasFiltradas}
        keyExtractor={item => `${item.kind}-${item.data.id}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
              <View style={styles.headerLeft}>
                <View style={styles.logoSmall}>
                  <StoryRootLogo size={18} variant="markOnPrimary" />
                </View>
                <Text style={styles.brandName}>Story Root</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.iconCircle}>
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
          </>
        }
        renderItem={({ item, index }) => (
          <View style={styles.timelineItemWrapper}>
            <TimelineItem entry={item} isLast={index === entradasFiltradas.length - 1} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={StoryRootLogoIcon}
            title="A história ainda vai começar"
            description="Toque no + para registrar cuidados diários e memórias."
          />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.primary,
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
