import { router, useLocalSearchParams } from 'expo-router';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Pause, Play, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { BottomSheet } from '../../components/BottomSheet';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SiblingShareToggle } from '../../components/SiblingShareToggle';
import { useCriancaAtiva } from '../../store/childStore';
import { useMemoriesStore } from '../../store/memoriesStore';
import { colors, radius, spacing, typography } from '../../theme';
import { stringParam } from '../../utils/routerParams';
import { showSaveErrorToast, showSaveSuccessToast } from '../../utils/toast';

const DURACOES = [10, 20, 30, 40];

export function VideoTrimSheet() {
  const params = useLocalSearchParams<{ videoUri?: string }>();
  const videoUri = stringParam(params.videoUri) ?? '';
  const adicionarMemoria = useMemoriesStore(state => state.adicionarMemoria);
  const criancaAtiva = useCriancaAtiva();

  const player = useVideoPlayer(videoUri, p => {
    p.loop = false;
  });

  const [duracaoTotal, setDuracaoTotal] = useState(0);
  const [posicaoAtual, setPosicaoAtual] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [duracaoSelecionada, setDuracaoSelecionada] = useState(DURACOES[0]);
  const [inicioTrecho, setInicioTrecho] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [irmaosSelecionados, setIrmaosSelecionados] = useState<string[]>([]);
  const previewTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEventListener(player, 'sourceLoad', ({ duration }) => {
    if (duration) setDuracaoTotal(duration);
  });
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    setPosicaoAtual(currentTime);
    if (player.duration && player.duration !== duracaoTotal) {
      setDuracaoTotal(player.duration);
    }
  });
  useEventListener(player, 'playingChange', ({ isPlaying }) => setTocando(isPlaying));

  // Fallback: some platforms only report duration once metadata is polled directly.
  useEffect(() => {
    if (duracaoTotal > 0) return;
    const interval = setInterval(() => {
      if (player.duration > 0) {
        setDuracaoTotal(player.duration);
        clearInterval(interval);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [duracaoTotal, player]);

  const fimTrecho = Math.min(duracaoTotal, inicioTrecho + duracaoSelecionada);

  function limitarInicio(valor: number, duracao = duracaoSelecionada) {
    const max = Math.max(0, duracaoTotal - duracao);
    return Math.min(max, Math.max(0, valor));
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (!trackWidth || !duracaoTotal) return;
        const ratio = evt.nativeEvent.locationX / trackWidth;
        setInicioTrecho(limitarInicio(ratio * duracaoTotal - duracaoSelecionada / 2));
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        if (!trackWidth || !duracaoTotal) return;
        const ratio = evt.nativeEvent.locationX / trackWidth;
        setInicioTrecho(limitarInicio(ratio * duracaoTotal - duracaoSelecionada / 2));
      },
    }),
  ).current;

  // expo-video's player is an intentionally imperative, mutable controller object,
  // not render state — the `react-hooks/immutability` rule doesn't recognize this.
  /* eslint-disable react-hooks/immutability */
  function alternarPlayback() {
    if (tocando) {
      player.pause();
    } else {
      player.play();
    }
  }

  function pararPreview() {
    if (previewTimer.current) {
      clearInterval(previewTimer.current);
      previewTimer.current = null;
    }
  }

  function visualizarTrecho() {
    if (!duracaoTotal) return;
    pararPreview();
    player.currentTime = inicioTrecho;
    player.play();
    previewTimer.current = setInterval(() => {
      if (player.currentTime >= fimTrecho) {
        player.pause();
        player.currentTime = inicioTrecho;
        pararPreview();
      }
    }, 100);
  }

  function fechar() {
    pararPreview();
    router.back();
  }

  function salvar() {
    if (!criancaAtiva) return;
    try {
      pararPreview();
      player.pause();
      adicionarMemoria({
        id: String(Date.now()),
        criancaId: criancaAtiva.id,
        criancaIdsCompartilhado: irmaosSelecionados.length ? irmaosSelecionados : undefined,
        titulo: titulo.trim() || 'Novo momento',
        descricao: descricao.trim() || undefined,
        data: new Date().toISOString(),
        tipoMidia: 'video',
        midiaUri: videoUri,
        trimStartMs: Math.round(inicioTrecho * 1000),
        trimEndMs: Math.round(fimTrecho * 1000),
      });
      showSaveSuccessToast('Vídeo salvo com sucesso');
      router.dismissAll();
    } catch {
      showSaveErrorToast();
    }
  }
  /* eslint-enable react-hooks/immutability */

  const playheadRatio = duracaoTotal > 0 ? Math.min(1, posicaoAtual / duracaoTotal) : 0;

  return (
    <BottomSheet onClose={fechar}>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={spacing.xxl}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={typography.h3}>Cortar vídeo</Text>
          <TouchableOpacity style={styles.closeCircle} onPress={fechar}>
            <X size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.videoWrapper}>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls={false}
          />
          <TouchableOpacity style={styles.playOverlay} onPress={alternarPlayback}>
            {tocando ? <Pause size={28} color="#fff" /> : <Play size={28} color="#fff" />}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Duração do trecho</Text>
        <View style={styles.chipsRow}>
          {DURACOES.map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.chip, duracaoSelecionada === d && styles.chipActive]}
              onPress={() => {
                setDuracaoSelecionada(d);
                setInicioTrecho(prev => limitarInicio(prev, d));
              }}>
              <Text
                style={[styles.chipText, duracaoSelecionada === d && styles.chipTextActive]}>
                {d}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Arraste para escolher o trecho</Text>
        <View
          style={styles.track}
          onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
          // PanResponder's handlers object is a plain object read once per render, not a live ref access.
          // eslint-disable-next-line react-hooks/refs
          {...panResponder.panHandlers}>
          {duracaoTotal > 0 ? (
            <>
              <View
                style={[
                  styles.trackHighlight,
                  {
                    left: `${(inicioTrecho / duracaoTotal) * 100}%`,
                    width: `${(duracaoSelecionada / duracaoTotal) * 100}%`,
                  },
                ]}
              />
              <View style={[styles.playhead, { left: `${playheadRatio * 100}%` }]} />
            </>
          ) : (
            <Text style={styles.trackLoadingText}>Carregando vídeo…</Text>
          )}
        </View>
        <Text style={styles.trimLabel}>
          {inicioTrecho.toFixed(1)}s — {fimTrecho.toFixed(1)}s
        </Text>

        <TouchableOpacity
          style={styles.previewButton}
          // visualizarTrecho mutates the expo-video player, an intentionally imperative controller.
          // eslint-disable-next-line react-hooks/immutability
          onPress={visualizarTrecho}
          disabled={!duracaoTotal}>
          <Text style={styles.previewButtonText}>Visualizar trecho</Text>
        </TouchableOpacity>

        <View style={styles.field}>
          <Text style={typography.label}>Título (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Primeiros passos"
            placeholderTextColor={colors.placeholder}
            value={titulo}
            onChangeText={setTitulo}
          />
        </View>

        <View style={styles.field}>
          <Text style={typography.label}>Descrição (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Primeiros passos no quintal"
            placeholderTextColor={colors.placeholder}
            value={descricao}
            onChangeText={setDescricao}
            multiline
          />
        </View>

        <SiblingShareToggle
          selecionados={irmaosSelecionados}
          onChange={setIrmaosSelecionados}
        />

        <PrimaryButton label="Salvar vídeo" onPress={salvar} style={styles.saveButton} />
      </KeyboardAwareScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoWrapper: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: spacing.lg,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.label,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: '#fff',
  },
  track: {
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackLoadingText: {
    ...typography.caption,
  },
  trackHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    opacity: 0.45,
    borderRadius: radius.md,
  },
  playhead: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    width: 3,
    backgroundColor: colors.accent,
    borderRadius: 1.5,
  },
  trimLabel: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  previewButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  previewButtonText: {
    ...typography.label,
    color: colors.primary,
  },
  field: {
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: spacing.xs,
  },
});
