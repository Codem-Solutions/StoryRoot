import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play, Video, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../theme';

function formatarSegundos(segundos: number): string {
  const total = Math.max(0, Math.round(segundos));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Capa de um vídeo da linha do tempo. O player só é criado ao tocar, para a
 * lista não abrir um player nativo por vídeo.
 */
export function VideoMemoria({
  uri,
  titulo,
  trimStartMs,
  trimEndMs,
}: {
  uri: string;
  titulo: string;
  trimStartMs?: number;
  trimEndMs?: number;
}) {
  const [aberto, setAberto] = useState(false);
  const duracao =
    trimStartMs !== undefined && trimEndMs !== undefined ? (trimEndMs - trimStartMs) / 1000 : null;

  return (
    <>
      <TouchableOpacity
        style={styles.capa}
        activeOpacity={0.85}
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={`Assistir vídeo: ${titulo}`}>
        <Video size={28} color="rgba(255,255,255,0.35)" style={styles.iconeFundo} />
        <View style={styles.play}>
          <Play size={24} color={colors.primary} fill={colors.primary} style={styles.iconePlay} />
        </View>
        {duracao !== null && (
          <View style={styles.duracao}>
            <Text style={styles.duracaoTexto}>{formatarSegundos(duracao)}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={aberto}
        animationType="fade"
        onRequestClose={() => setAberto(false)}
        statusBarTranslucent
        supportedOrientations={['portrait', 'landscape']}>
        {aberto && (
          <PlayerTelaCheia
            uri={uri}
            titulo={titulo}
            inicioS={(trimStartMs ?? 0) / 1000}
            fimS={trimEndMs !== undefined ? trimEndMs / 1000 : null}
            onFechar={() => setAberto(false)}
          />
        )}
      </Modal>
    </>
  );
}

function PlayerTelaCheia({
  uri,
  titulo,
  inicioS,
  fimS,
  onFechar,
}: {
  uri: string;
  titulo: string;
  inicioS: number;
  fimS: number | null;
  onFechar: () => void;
}) {
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(uri, p => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
    p.currentTime = inicioS;
    p.play();
  });

  // Respeita o trecho escolhido ao salvar: para no fim e volta ao início.
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (fimS !== null && currentTime >= fimS) {
      player.pause();
      // expo-video's player is an imperative controller, not React state.
      // eslint-disable-next-line react-hooks/immutability
      player.currentTime = inicioS;
    }
  });

  return (
    <View style={styles.telaCheia}>
      <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />
      <View style={[styles.barraTopo, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.tituloTelaCheia} numberOfLines={1}>
          {titulo}
        </Text>
        <TouchableOpacity
          style={styles.fechar}
          onPress={onFechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar vídeo">
          <X size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  capa: {
    width: '100%',
    height: 180,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeFundo: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  play: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconePlay: {
    marginLeft: 3,
  },
  duracao: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  duracaoTexto: {
    ...typography.caption,
    color: '#fff',
  },
  telaCheia: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  barraTopo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  tituloTelaCheia: {
    ...typography.h4,
    color: '#fff',
    flex: 1,
  },
  fechar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
