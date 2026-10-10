import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { BottomSheet } from '../../components/BottomSheet';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SiblingShareToggle } from '../../components/SiblingShareToggle';
import { useCriancaAtiva } from '../../store/childStore';
import { useMemoriesStore } from '../../store/memoriesStore';
import { colors, radius, spacing, typography } from '../../theme';
import { showSaveErrorToast, showSaveSuccessToast } from '../../utils/toast';
import { stringParam } from '../../utils/routerParams';

export function PhotoPreviewSheet() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri?: string | string[] }>();
  const imageUri = stringParam(params.imageUri) ?? '';
  const adicionarMemoria = useMemoriesStore(state => state.adicionarMemoria);
  const criancaAtiva = useCriancaAtiva();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [irmaosSelecionados, setIrmaosSelecionados] = useState<string[]>([]);

  function fechar() {
    router.back();
  }

  function salvar() {
    if (!criancaAtiva) return;
    try {
      adicionarMemoria({
        id: String(Date.now()),
        criancaId: criancaAtiva.id,
        criancaIdsCompartilhado: irmaosSelecionados.length ? irmaosSelecionados : undefined,
        titulo: titulo.trim() || 'Novo momento',
        descricao: descricao.trim() || undefined,
        data: new Date().toISOString(),
        tipoMidia: 'foto',
        midiaUri: imageUri,
      });
      showSaveSuccessToast('Foto salva com sucesso');
      router.dismissAll();
    } catch {
      showSaveErrorToast();
    }
  }

  return (
    <BottomSheet onClose={fechar}>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={spacing.xxl}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={typography.h3}>Nova foto</Text>
          <TouchableOpacity style={styles.closeCircle} onPress={fechar}>
            <X size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Image source={{ uri: imageUri }} style={styles.preview} />

        <View style={styles.field}>
          <Text style={typography.label}>Título (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Primeiro sorriso do dia"
            placeholderTextColor={colors.placeholder}
            value={titulo}
            onChangeText={setTitulo}
          />
        </View>

        <View style={styles.field}>
          <Text style={typography.label}>Descrição (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Primeiro sorriso do dia"
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

        <PrimaryButton label="Salvar foto" onPress={salvar} style={styles.saveButton} />
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
  preview: {
    width: '100%',
    height: 260,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.surfaceTint,
  },
  field: {
    gap: spacing.sm,
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
