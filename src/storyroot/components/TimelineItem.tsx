import { Sparkles } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { RECORD_TYPES } from '../constants/recordTypes';
import { colors, radius, spacing, typography } from '../theme';
import type { Memoria, Registro } from '../types';
import { formatarDataBR, formatarHora, formatarValorExibicao } from '../utils/format';
import { AudioPlayer } from './AudioPlayer';

export type TimelineEntry =
  | { kind: 'registro'; data: Registro }
  | { kind: 'memoria'; data: Memoria };

export function TimelineItem({
  entry,
  isLast = false,
}: {
  entry: TimelineEntry;
  isLast?: boolean;
}) {
  if (entry.kind === 'registro') {
    const meta = RECORD_TYPES[entry.data.tipo];
  

    const Icon = meta.icon;
    const valorExibicao = formatarValorExibicao(entry.data.tipo, entry.data.valor);
    return (
      <View style={styles.row}>
        <View style={styles.leftBar}>
          <View style={[styles.iconNode, { backgroundColor: meta.color }]}>
            <Icon size={14} color="#fff" />
          </View>
          {!isLast && <View style={styles.verticalLine} />}
        </View>
        <View style={styles.cardWrapper}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={typography.h4} numberOfLines={1}>
                {meta.label}
                {valorExibicao ? ` · ${valorExibicao}` : ''}
              </Text>
              <Text style={styles.timestamp}>{formatarHora(entry.data.data)}</Text>
            </View>
            {!!entry.data.observacao && (
              <Text style={typography.bodySmall}>{entry.data.observacao}</Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  const memoria = entry.data;
  return (
    <View style={styles.row}>
      <View style={styles.leftBar}>
        <View style={[styles.iconNode, { backgroundColor: colors.accent }]}>
          <Sparkles size={14} color="#fff" />
        </View>
        {!isLast && <View style={styles.verticalLine} />}
      </View>
      <View style={styles.cardWrapper}>
        <View style={styles.memoryCard}>
          {memoria.midiaUri && memoria.tipoMidia !== 'audio' ? (
            <Image source={{ uri: memoria.midiaUri }} style={styles.memoryPhoto} />
          ) : null}
          <View style={styles.memoryBody}>
            <View style={styles.cardHeader}>
              <View style={styles.tag}>
                <Sparkles size={12} color={colors.primary} />
                <Text style={styles.tagText}>Momento especial</Text>
              </View>
              <Text style={styles.ageText}>{formatarDataBR(memoria.data)}</Text>
            </View>
            {!!memoria.titulo && <Text style={typography.h4}>{memoria.titulo}</Text>}
            {!!memoria.descricao && (
              <Text style={typography.body}>{memoria.descricao}</Text>
            )}
            {memoria.tipoMidia === 'audio' && !!memoria.midiaUri && (
              <AudioPlayer uri={memoria.midiaUri} duracaoMs={memoria.duracaoMs} />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  leftBar: {
    width: 24,
    alignItems: 'center',
  },
  iconNode: {
    width: 24,
    height: 24,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
  cardWrapper: {
    flex: 1,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timestamp: {
    ...typography.caption,
  },
  memoryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  memoryPhoto: {
    width: '100%',
    height: 180,
  },
  memoryBody: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceTint,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  tagText: {
    ...typography.bodySmall,
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    color: colors.primary,
  },
  ageText: {
    ...typography.bodySmall,
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    color: colors.accentText,
  },
});
