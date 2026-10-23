import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useCriancaAtiva } from '../store/childStore';
import { useMemoriesStore } from '../store/memoriesStore';
import { colors, radius, spacing, typography } from '../theme';
import type { Memoria } from '../types';
import { ROTULOS_TIPO_MIDIA } from '../utils/buscaMemorias';
import { showSaveSuccessToast } from '../utils/toast';
import { BottomSheet } from './BottomSheet';
import { CampoData } from './CampoData';
import { PrimaryButton } from './PrimaryButton';
import { SiblingShareToggle } from './SiblingShareToggle';

/** Edita título, descrição, data e compartilhamento de uma memória da linha do tempo. */
export function EditarMemoriaSheet({ memoria, onClose }: { memoria: Memoria; onClose: () => void }) {
  const atualizarMemoria = useMemoriesStore(s => s.atualizarMemoria);
  const criancaAtiva = useCriancaAtiva();
  const [titulo, setTitulo] = useState(memoria.titulo);
  const [descricao, setDescricao] = useState(memoria.descricao ?? '');
  const [data, setData] = useState(memoria.data);
  const [irmaos, setIrmaos] = useState<string[]>(memoria.criancaIdsCompartilhado ?? []);

  // Só a criança "dona" da memória decide com quais irmãos ela é compartilhada.
  const podeCompartilhar = criancaAtiva?.id === memoria.criancaId;

  function salvar() {
    if (!titulo.trim()) return;
    atualizarMemoria(memoria.id, {
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      data,
      ...(podeCompartilhar && { criancaIdsCompartilhado: irmaos.length ? irmaos : undefined }),
    });
    showSaveSuccessToast('Memória atualizada');
    onClose();
  }

  return (
    <BottomSheet onClose={onClose} fillHeight={false}>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={spacing.xxl}
        keyboardShouldPersistTaps="handled">
        <View style={styles.cabecalho}>
          <Text style={typography.h3}>Editar {ROTULOS_TIPO_MIDIA[memoria.tipoMidia].toLowerCase()}</Text>
          <TouchableOpacity
            style={styles.fechar}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar">
            <X size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.campo}>
          <Text style={typography.label}>Título *</Text>
          <TextInput
            style={styles.input}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Dê um título para encontrar na busca"
            placeholderTextColor={colors.placeholder}
            accessibilityLabel="Título, obrigatório"
          />
          {!titulo.trim() && <Text style={styles.erro}>O título é obrigatório.</Text>}
        </View>

        <View style={styles.campo}>
          <Text style={typography.label}>Descrição (opcional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultilinha]}
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Conte mais sobre este momento"
            placeholderTextColor={colors.placeholder}
            multiline
            accessibilityLabel="Descrição"
          />
        </View>

        <View style={styles.campo}>
          <CampoData label="Data" value={data} onChange={setData} />
        </View>

        {podeCompartilhar && <SiblingShareToggle selecionados={irmaos} onChange={setIrmaos} />}

        <PrimaryButton
          label="Salvar alterações"
          onPress={salvar}
          disabled={!titulo.trim()}
          style={styles.salvar}
        />
      </KeyboardAwareScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  fechar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campo: {
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
  },
  inputMultilinha: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  erro: {
    ...typography.caption,
    color: colors.red,
  },
  salvar: {
    marginTop: spacing.md,
  },
});
