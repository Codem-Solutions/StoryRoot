import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  BarChart3,
  Calendar,
  ChartNetwork,
  CirclePlay,
  Search,
  Sparkles,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { TimelineEntry, TimelineItem } from '../../components/TimelineItem';
import { useCriancaAtiva } from '../../store/childStore';
import { useMemoriesStore } from '../../store/memoriesStore';
import { useRecordsStore } from '../../store/recordsStore';
import { colors, radius, spacing, typography } from '../../theme';

const CHIPS = [
  { label: 'Resumo do mês', icon: Calendar },
  { label: 'Primeiros passos', icon: null },
  { label: 'Vacinas pendentes', icon: null },
];

export function AssistenteIAScreen() {
  const insets = useSafeAreaInsets();
  const [termo, setTermo] = useState('');
  const criancaAtiva = useCriancaAtiva();
  const todosRegistros = useRecordsStore(state => state.registros);
  const todasMemorias = useMemoriesStore(state => state.memorias);
  const registros = useMemo(
    () => todosRegistros.filter(r => r.criancaId === criancaAtiva?.id),
    [todosRegistros, criancaAtiva],
  );
  const memorias = useMemo(
    () =>
      todasMemorias.filter(
        m => m.criancaId === criancaAtiva?.id || m.criancaIdsCompartilhado?.includes(criancaAtiva?.id ?? ''),
      ),
    [todasMemorias, criancaAtiva],
  );

  const resultados = useMemo<TimelineEntry[]>(() => {
    const query = termo.trim().toLowerCase();
    if (!query) return [];

    const doRegistros: TimelineEntry[] = registros
      .filter(
        r =>
          r.tipo.includes(query) ||
          r.observacao?.toLowerCase().includes(query) ||
          r.valor?.toLowerCase().includes(query),
      )
      .map(data => ({ kind: 'registro' as const, data }));

    const doMemorias: TimelineEntry[] = memorias
      .filter(
        m =>
          m.titulo.toLowerCase().includes(query) ||
          m.descricao?.toLowerCase().includes(query),
      )
      .map(data => ({ kind: 'memoria' as const, data }));

    return [...doRegistros, ...doMemorias].sort(
      (a, b) => new Date(b.data.data).getTime() - new Date(a.data.data).getTime(),
    );
  }, [termo, registros, memorias]);

  const buscando = termo.trim().length > 0;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={buscando ? resultados : []}
      keyExtractor={item => `${item.kind}-${item.data.id}`}
      renderItem={({ item, index }) => (
        <View style={styles.timelineItemWrapper}>
          <TimelineItem entry={item} isLast={index === resultados.length - 1} />
        </View>
      )}
      ListHeaderComponent={
        <>
          <View style={[styles.headerBlock, { paddingTop: insets.top + spacing.md }]}>
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiGradientBox}>
              <Sparkles size={24} color="#fff" />
            </LinearGradient>
            <View style={styles.textColumn}>
              <Text style={typography.h2}>Assistente IA</Text>
              <Text style={styles.subtitle}>
                Eu ajudo você a redescobrir os momentos preciosos.
              </Text>
            </View>
          </View>

          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color={colors.primary} />
              <TextInput
                style={styles.searchInput}
                placeholder='Quando ele falou "papai"?'
                placeholderTextColor={colors.textMuted}
                value={termo}
                onChangeText={setTermo}
              />
            </View>
          </View>

          {!buscando && (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}>
                {CHIPS.map(chip => (
                  <TouchableOpacity key={chip.label} style={styles.chip}>
                    {chip.icon ? <chip.icon size={14} color={colors.textMuted} /> : null}
                    <Text style={styles.chipText}>{chip.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.retroSection}>
                <View style={styles.sectionHeader}>
                  <Text style={typography.h3}>Retrospectivas</Text>
                  <TouchableOpacity
                    style={styles.premiumBadge}
                    onPress={() => router.push('/(app)/storyroot-main/premium')}>
                    <Text style={styles.premiumBadgeText}>Premium</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.videoCard}
                  activeOpacity={0.9}
                  onPress={() => router.push('/(app)/storyroot-main/premium')}>
                  <LinearGradient
                    colors={['rgba(30,27,36,0)', 'rgba(30,27,36,0.85)']}
                    style={styles.videoCardGradient}
                  />
                  <View style={styles.playButton}>
                    <CirclePlay size={24} color={colors.primary} />
                  </View>
                  <View style={styles.videoCardMeta}>
                    <Text style={styles.videoCardTag}>Video Memory</Text>
                    <Text style={styles.videoCardTitle}>
                      O Primeiro Ano de Gael
                    </Text>
                    <Text style={styles.videoCardSubtitle}>
                      Capítulo 1: De recém-nascido aos primeiros passos.
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.statsSection}>
                <View style={styles.statsCard}>
                  <View style={styles.statsCardHeader}>
                    <View style={styles.statsCardHeaderLeft}>
                      <BarChart3 size={20} color={colors.primary} />
                      <Text style={typography.h4}>Resumo de Março 2024</Text>
                    </View>
                    <ChartNetwork size={20} color={colors.placeholder} />
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.statsGrid}>
                    <View style={[styles.statCol, { backgroundColor: colors.surfaceTint }]}>
                      <Text style={[styles.statColLabel, { color: colors.primary }]}>
                        Novas Palavras
                      </Text>
                      <Text style={styles.statColValue}>+12</Text>
                    </View>
                    <View style={[styles.statCol, { backgroundColor: colors.badgeBg }]}>
                      <Text style={[styles.statColLabel, { color: colors.accent }]}>
                        Horas de Sono
                      </Text>
                      <Text style={[styles.statColValue, { color: colors.accentText }]}>
                        312h
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.reportButton}
                    onPress={() => router.push('/(app)/storyroot-main/premium')}>
                    <Text style={styles.reportButtonText}>
                      Ver Relatório Completo
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </>
      }
      ListEmptyComponent={
        buscando ? (
          <EmptyState
            icon={Search}
            title="Nada encontrado"
            description="Tente outro termo, tipo de registro ou palavra da memória."
          />
        ) : null
      }
    />
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
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  aiGradientBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  subtitle: {
    ...typography.bodySmall,
  },
  searchBarContainer: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    ...typography.label,
    fontSize: 13,
  },
  retroSection: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  premiumBadgeText: {
    ...typography.label,
    color: '#fff',
    fontSize: 10,
  },
  videoCard: {
    height: 220,
    borderRadius: radius.xxl,
    backgroundColor: colors.primaryDark,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoCardGradient: {
    ...StyleSheet.absoluteFill,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoCardMeta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  videoCardTag: {
    ...typography.label,
    fontSize: 11,
    color: colors.accent,
  },
  videoCardTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    color: '#fff',
  },
  videoCardSubtitle: {
    ...typography.caption,
    color: '#fff',
    opacity: 0.85,
  },
  statsSection: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },
  statsCard: {
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
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statCol: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md + 4,
  },
  statColLabel: {
    ...typography.label,
    fontSize: 11,
  },
  statColValue: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 22,
    lineHeight: 27,
    color: colors.primaryDark,
  },
  reportButton: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportButtonText: {
    ...typography.label,
    color: colors.primary,
    fontSize: 13,
  },
});
