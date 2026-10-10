import { AlertTriangle, Search, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { GRUPOS_SINTOMAS, SINTOMA_OUTRO } from '../constants/sintomas';
import { colors, radius, spacing, typography } from '../theme';
import { BottomSheet } from './BottomSheet';
import { PrimaryButton } from './PrimaryButton';

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Seleção múltipla de sintomas, agrupados e com busca. "Outros" libera texto livre no formulário. */
export function SintomasPickerSheet({
  selecionados,
  onConfirmar,
  onFechar,
}: {
  selecionados: string[];
  onConfirmar: (ids: string[]) => void;
  onFechar: () => void;
}) {
  const [escolhidos, setEscolhidos] = useState<string[]>(selecionados);
  const [busca, setBusca] = useState('');

  const grupos = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!termo) return GRUPOS_SINTOMAS;
    return GRUPOS_SINTOMAS.map(grupo => ({
      ...grupo,
      sintomas: grupo.sintomas.filter(s => normalizar(s.label).includes(termo)),
    })).filter(grupo => grupo.sintomas.length);
  }, [busca]);

  function alternar(id: string) {
    setEscolhidos(atual => (atual.includes(id) ? atual.filter(s => s !== id) : [...atual, id]));
  }

  const outroAtivo = escolhidos.includes(SINTOMA_OUTRO);

  return (
    <BottomSheet onClose={onFechar}>
      <View style={styles.cabecalho}>
        <Text style={typography.h3}>Sintomas</Text>
        <TouchableOpacity
          style={styles.fechar}
          onPress={onFechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar">
          <X size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.busca}>
        <Search size={18} color={colors.placeholder} />
        <TextInput
          style={styles.buscaInput}
          placeholder="Buscar sintoma"
          placeholderTextColor={colors.placeholder}
          value={busca}
          onChangeText={setBusca}
          accessibilityLabel="Buscar sintoma"
        />
      </View>

      <ScrollView
        style={styles.lista}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {grupos.map(grupo => (
          <View key={grupo.titulo} style={styles.grupo}>
            <Text style={styles.grupoTitulo}>{grupo.titulo}</Text>
            <View style={styles.chips}>
              {grupo.sintomas.map(sintoma => {
                const ativo = escolhidos.includes(sintoma.id);
                return (
                  <TouchableOpacity
                    key={sintoma.id}
                    style={[styles.chip, ativo && styles.chipAtivo]}
                    onPress={() => alternar(sintoma.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: ativo }}>
                    {sintoma.alerta && (
                      <AlertTriangle size={12} color={ativo ? '#fff' : colors.red} />
                    )}
                    <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                      {sintoma.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.grupo}>
          <Text style={styles.grupoTitulo}>Não encontrou?</Text>
          <TouchableOpacity
            style={[styles.chip, styles.chipOutro, outroAtivo && styles.chipAtivo]}
            onPress={() => alternar(SINTOMA_OUTRO)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: outroAtivo }}>
            <Text style={[styles.chipTexto, outroAtivo && styles.chipTextoAtivo]}>
              Outros (descrever)
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PrimaryButton
        label={escolhidos.length ? `Confirmar (${escolhidos.length})` : 'Confirmar'}
        onPress={() => onConfirmar(escolhidos)}
        style={styles.confirmar}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  fechar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  buscaInput: {
    ...typography.body,
    flex: 1,
    paddingVertical: spacing.md,
  },
  lista: {
    flex: 1,
  },
  grupo: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  grupoTitulo: {
    ...typography.label,
    color: colors.textMuted,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOutro: {
    alignSelf: 'flex-start',
    borderStyle: 'dashed',
  },
  chipAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTexto: {
    ...typography.caption,
    fontSize: 13,
    color: colors.text,
  },
  chipTextoAtivo: {
    color: '#fff',
  },
  confirmar: {
    marginTop: spacing.md,
  },
});
