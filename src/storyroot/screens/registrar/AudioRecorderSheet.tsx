import { router } from 'expo-router';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type AudioRecorder,
} from 'expo-audio';
import { Mic, RotateCcw, Square, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { AudioPlayer } from '../../components/AudioPlayer';
import { BottomSheet } from '../../components/BottomSheet';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SiblingShareToggle } from '../../components/SiblingShareToggle';
import { useCriancaAtiva } from '../../store/childStore';
import { useMemoriesStore } from '../../store/memoriesStore';
import { colors, radius, spacing, typography } from '../../theme';
import { salvarMidiaPermanente } from '../../utils/midia';
import { showSaveErrorToast, showSaveSuccessToast } from '../../utils/toast';

const MAX_DURATION_MS = 5 * 60 * 1000;

function formatarDuracao(ms: number): string {
  const totalSegundos = Math.floor(ms / 1000);
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

interface Gravacao {
  uri: string;
  duracaoMs: number;
}

/** Para o gravador e devolve o arquivo gerado, para a pré-escuta. */
async function pararGravacao(recorder: AudioRecorder): Promise<Gravacao | null> {
  const duracaoMs = recorder.currentTime * 1000;
  await recorder.stop();
  await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
  return recorder.uri ? { uri: recorder.uri, duracaoMs } : null;
}

export function AudioRecorderSheet() {
  const adicionarMemoria = useMemoriesStore(state => state.adicionarMemoria);
  const criancaAtiva = useCriancaAtiva();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const [permissaoNegada, setPermissaoNegada] = useState(false);
  const [preparando, setPreparando] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [irmaosSelecionados, setIrmaosSelecionados] = useState<string[]>([]);
  /** Gravação concluída, pronta para ouvir antes de salvar. */
  const [gravacao, setGravacao] = useState<Gravacao | null>(null);
  const [salvando, setSalvando] = useState(false);

  const duracaoMs = recorderState.durationMillis || 0;
  const atingiuLimite = duracaoMs >= MAX_DURATION_MS;
  const gravando = recorderState.isRecording;

  useEffect(() => {
    if (atingiuLimite && recorder.isRecording) {
      void pararGravacao(recorder)
        .then(setGravacao)
        .catch(() => {});
    }
  }, [atingiuLimite, recorder]);

  useEffect(() => {
    return () => {
      try {
        if (recorder.isRecording) recorder.stop().catch(() => {});
      } catch {
        // recorder may already be released on unmount, safe to ignore
      }
    };
  }, [recorder]);

  function fechar() {
    router.back();
  }

  async function alternarGravacao() {
    if (preparando) return;
    if (recorder.isRecording) {
      try {
        setGravacao(await pararGravacao(recorder));
      } catch {
        showSaveErrorToast('Não foi possível finalizar a gravação.');
      }
      return;
    }
    const permissao = await requestRecordingPermissionsAsync();
    if (!permissao.granted) {
      setPermissaoNegada(true);
      return;
    }
    setPermissaoNegada(false);
    setPreparando(true);
    try {
      // Descarta a pré-escuta anterior (desmonta o player) antes de regravar.
      setGravacao(null);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      showSaveErrorToast('Não foi possível iniciar a gravação.');
    } finally {
      setPreparando(false);
    }
  }

  async function salvar() {
    if (!criancaAtiva || salvando) return;
    setSalvando(true);
    try {
      const final = recorder.isRecording ? await pararGravacao(recorder) : gravacao;
      if (!final) {
        fechar();
        return;
      }
      const midiaUri = await salvarMidiaPermanente(final.uri, 'audios');
      adicionarMemoria({
        id: String(Date.now()),
        criancaId: criancaAtiva.id,
        criancaIdsCompartilhado: irmaosSelecionados.length ? irmaosSelecionados : undefined,
        titulo: titulo.trim() || 'Nova gravação',
        data: new Date().toISOString(),
        tipoMidia: 'audio',
        midiaUri,
        duracaoMs: final.duracaoMs,
      });
      showSaveSuccessToast('Áudio salvo com sucesso');
      router.dismissAll();
    } catch {
      showSaveErrorToast();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <BottomSheet onClose={fechar} fillHeight={false}>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={spacing.xxl}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={typography.h3}>Áudio / Fala</Text>
          <TouchableOpacity style={styles.closeCircle} onPress={fechar}>
            <X size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {permissaoNegada ? (
          <Text style={styles.permissionText}>
            Não foi possível acessar o microfone. Permita o acesso nas configurações do
            aparelho para gravar áudios.
          </Text>
        ) : (
          <>
            {gravacao && !gravando ? (
              <View style={styles.preview}>
                <Text style={styles.previewHint}>Ouça antes de salvar</Text>
                <AudioPlayer
                  key={gravacao.uri}
                  uri={gravacao.uri}
                  duracaoMs={gravacao.duracaoMs}
                />
                <TouchableOpacity
                  style={styles.rerecordButton}
                  onPress={alternarGravacao}
                  disabled={preparando}
                  accessibilityRole="button">
                  <RotateCcw size={16} color={colors.primary} />
                  <Text style={styles.rerecordText}>Gravar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.timer}>{formatarDuracao(duracaoMs)}</Text>
                <Text style={styles.hint}>
                  {gravando
                    ? 'Gravando… máximo de 5 minutos'
                    : 'Toque no microfone para começar a gravar'}
                </Text>

                <TouchableOpacity
                  style={[styles.recordButton, gravando && styles.recordButtonActive]}
                  onPress={alternarGravacao}
                  disabled={preparando}
                  accessibilityRole="button"
                  accessibilityLabel={gravando ? 'Parar gravação' : 'Começar a gravar'}>
                  {gravando ? (
                    <Square size={26} color="#fff" />
                  ) : (
                    <Mic size={30} color="#fff" />
                  )}
                </TouchableOpacity>
              </>
            )}

            <View style={styles.field}>
              <Text style={typography.label}>Título (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Primeira palavra"
                placeholderTextColor={colors.placeholder}
                value={titulo}
                onChangeText={setTitulo}
              />
            </View>

            <SiblingShareToggle
              selecionados={irmaosSelecionados}
              onChange={setIrmaosSelecionados}
            />

            <PrimaryButton
              label="Salvar gravação"
              onPress={salvar}
              disabled={!gravacao && !gravando}
              loading={salvando}
              style={styles.saveButton}
            />
          </>
        )}
      </KeyboardAwareScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    ...typography.h1,
    textAlign: 'center',
    color: colors.primary,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  recordButton: {
    alignSelf: 'center',
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  recordButtonActive: {
    backgroundColor: colors.accent,
  },
  preview: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  previewHint: {
    ...typography.label,
    color: colors.textMuted,
  },
  rerecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  rerecordText: {
    ...typography.label,
    color: colors.primary,
  },
  field: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  saveButton: {
    marginTop: spacing.md,
  },
  permissionText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
});
