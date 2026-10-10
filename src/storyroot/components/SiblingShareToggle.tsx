import { CheckCircle2, Circle } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useChildStore, useCriancaAtiva } from '../store/childStore';
import { colors, radius, spacing, typography } from '../theme';

interface SiblingShareToggleProps {
  selecionados: string[];
  onChange: (ids: string[]) => void;
}

/** Linha "Também é sobre {irmão}" mostrada ao criar uma memória, quando a criança ativa tem irmãos vinculados. */
export function SiblingShareToggle({ selecionados, onChange }: SiblingShareToggleProps) {
  const criancaAtiva = useCriancaAtiva();
  const criancas = useChildStore(s => s.criancas);
  const irmaos = criancas.filter(c => criancaAtiva?.irmaosIds.includes(c.id));

  if (!irmaos.length) return null;

  function alternar(id: string) {
    onChange(
      selecionados.includes(id)
        ? selecionados.filter(x => x !== id)
        : [...selecionados, id],
    );
  }

  return (
    <View style={styles.container}>
      <Text style={typography.label}>Também é sobre</Text>
      {irmaos.map(irmao => {
        const marcado = selecionados.includes(irmao.id);
        return (
          <TouchableOpacity
            key={irmao.id}
            style={[styles.row, marcado && styles.rowAtivo]}
            activeOpacity={0.85}
            onPress={() => alternar(irmao.id)}>
            <Text style={typography.body}>{irmao.nome}</Text>
            {marcado ? (
              <CheckCircle2 size={20} color={colors.primary} />
            ) : (
              <Circle size={20} color={colors.border} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowAtivo: {
    borderColor: colors.primary,
    backgroundColor: colors.badgeBg,
  },
});
