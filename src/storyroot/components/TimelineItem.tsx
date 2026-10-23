import { Camera, Mic, MoreVertical, Sparkles, Video, type LucideIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RECORD_TYPES } from '../constants/recordTypes';
import { useMemoriesStore } from '../store/memoriesStore';
import { colors, radius, spacing, typography } from '../theme';
import type { Memoria, Registro, TipoMidiaMemoria } from '../types';
import { ROTULOS_TIPO_MIDIA } from '../utils/buscaMemorias';
import { formatarDataBR, formatarHora, formatarValorExibicao } from '../utils/format';
import { apagarMidiaPermanente } from '../utils/midia';
import { showSaveSuccessToast } from '../utils/toast';
import { AudioPlayer } from './AudioPlayer';
import { EditarMemoriaSheet } from './EditarMemoriaSheet';
import { VideoMemoria } from './VideoMemoria';

const META_MIDIA: Record<TipoMidiaMemoria, { icon: LucideIcon; cor: string }> = {
  foto: { icon: Camera, cor: colors.accent },
  video: { icon: Video, cor: colors.violet },
  audio: { icon: Mic, cor: colors.primary },
  texto: { icon: Sparkles, cor: colors.amber },
};

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

  return <MemoriaItem memoria={entry.data} isLast={isLast} />;
}

function MemoriaItem({ memoria, isLast }: { memoria: Memoria; isLast: boolean }) {
  const removerMemoria = useMemoriesStore(s => s.removerMemoria);
  const [editando, setEditando] = useState(false);
  const meta = META_MIDIA[memoria.tipoMidia];
  const IconeMidia = meta.icon;
  const rotulo = ROTULOS_TIPO_MIDIA[memoria.tipoMidia].toLowerCase();
  const compartilhada = !!memoria.criancaIdsCompartilhado?.length;

  function confirmarExclusao() {
    Alert.alert(
      `Apagar ${rotulo}?`,
      `"${memoria.titulo}" será apagado da linha do tempo${
        compartilhada ? ' de todas as crianças com quem foi compartilhado' : ''
      }. Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => {
            removerMemoria(memoria.id);
            apagarMidiaPermanente(memoria.midiaUri);
            showSaveSuccessToast('Memória apagada');
          },
        },
      ],
    );
  }

  function abrirOpcoes() {
    Alert.alert(memoria.titulo, undefined, [
      { text: 'Editar', onPress: () => setEditando(true) },
      { text: 'Apagar', style: 'destructive', onPress: confirmarExclusao },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.row}>
      <View style={styles.leftBar}>
        <View style={[styles.iconNode, { backgroundColor: meta.cor }]}>
          <IconeMidia size={14} color="#fff" />
        </View>
        {!isLast && <View style={styles.verticalLine} />}
      </View>
      <View style={styles.cardWrapper}>
        <View style={styles.memoryCard}>
          {memoria.tipoMidia === 'foto' && !!memoria.midiaUri && (
            <Image source={{ uri: memoria.midiaUri }} style={styles.memoryPhoto} />
          )}
          {memoria.tipoMidia === 'video' && !!memoria.midiaUri && (
            <VideoMemoria
              uri={memoria.midiaUri}
              titulo={memoria.titulo}
              trimStartMs={memoria.trimStartMs}
              trimEndMs={memoria.trimEndMs}
            />
          )}
          <View style={styles.memoryBody}>
            <View style={styles.cardHeader}>
              <View style={styles.tag}>
                <IconeMidia size={12} color={colors.primary} />
                <Text style={styles.tagText}>{ROTULOS_TIPO_MIDIA[memoria.tipoMidia]}</Text>
              </View>
              <View style={styles.cabecalhoDireita}>
                <Text style={styles.ageText}>{formatarDataBR(memoria.data)}</Text>
                <TouchableOpacity
                  style={styles.botaoOpcoes}
                  onPress={abrirOpcoes}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Opções de ${memoria.titulo}: editar ou apagar`}>
                  <MoreVertical size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
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
      {editando && <EditarMemoriaSheet memoria={memoria} onClose={() => setEditando(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalhoDireita: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  botaoOpcoes: {
    width: 28,
    height: 28,
    marginRight: -spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
