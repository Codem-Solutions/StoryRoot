import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioPlayer as ExpoAudioPlayer,
} from 'expo-audio';
import { Pause, Play } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

/** Só um áudio toca por vez: ao dar play em outro, o anterior pausa. */
let playerTocando: ExpoAudioPlayer | null = null;

function formatarTempo(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const minutos = Math.floor(total / 60);
  const resto = total % 60;
  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

/**
 * Player compacto de áudio local (play/pause, barra de progresso com toque para
 * avançar e tempo). O arquivo só é carregado no primeiro play, para não abrir um
 * player nativo para cada áudio da timeline.
 */
export function AudioPlayer({ uri, duracaoMs }: { uri: string; duracaoMs?: number }) {
  const player = useAudioPlayer(null, { updateInterval: 200 });
  const status = useAudioPlayerStatus(player);
  const fonteCarregada = useRef<string | null>(null);
  const [larguraBarra, setLarguraBarra] = useState(0);

  const duracaoS = status.duration > 0 ? status.duration : (duracaoMs ?? 0) / 1000;
  const posicaoS = Math.min(status.currentTime, duracaoS);
  const progresso = duracaoS > 0 ? posicaoS / duracaoS : 0;

  useEffect(() => {
    if (status.didJustFinish) {
      player.pause();
      void player.seekTo(0).catch(() => {});
    }
  }, [status.didJustFinish, player]);

  useEffect(() => {
    return () => {
      if (playerTocando === player) playerTocando = null;
    };
  }, [player]);

  function garantirFonte() {
    if (fonteCarregada.current === uri) return;
    player.replace({ uri });
    fonteCarregada.current = uri;
  }

  async function alternar() {
    if (status.playing) {
      player.pause();
      return;
    }
    garantirFonte();
    if (playerTocando && playerTocando !== player) {
      try {
        playerTocando.pause();
      } catch {
        // o player anterior pode já ter sido liberado
      }
    }
    playerTocando = player;
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
    player.play();
  }

  function buscar(evento: GestureResponderEvent) {
    if (!larguraBarra || !duracaoS) return;
    garantirFonte();
    const alvo = (evento.nativeEvent.locationX / larguraBarra) * duracaoS;
    void player.seekTo(Math.max(0, Math.min(alvo, duracaoS))).catch(() => {});
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.botao}
        onPress={alternar}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? 'Pausar áudio' : 'Ouvir áudio'}>
        {status.playing ? (
          <Pause size={18} color="#fff" fill="#fff" />
        ) : (
          <Play size={18} color="#fff" fill="#fff" style={styles.iconePlay} />
        )}
      </TouchableOpacity>

      <View style={styles.conteudo}>
        <Pressable
          onPress={buscar}
          onLayout={e => setLarguraBarra(e.nativeEvent.layout.width)}
          hitSlop={{ top: 10, bottom: 10 }}
          accessibilityRole="adjustable"
          accessibilityLabel="Posição do áudio"
          accessibilityValue={{ min: 0, max: Math.round(duracaoS), now: Math.round(posicaoS) }}>
          <View style={styles.trilha}>
            <View style={[styles.preenchimento, { width: `${progresso * 100}%` }]} />
          </View>
        </Pressable>
        <View style={styles.tempos}>
          <Text style={styles.tempo}>{formatarTempo(posicaoS)}</Text>
          <Text style={styles.tempo}>{formatarTempo(duracaoS)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  botao: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconePlay: {
    marginLeft: 2,
  },
  conteudo: {
    flex: 1,
    gap: spacing.xs,
  },
  trilha: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  preenchimento: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  tempos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tempo: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
