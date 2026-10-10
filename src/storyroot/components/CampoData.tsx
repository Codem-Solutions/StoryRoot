import { CalendarDays } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { formatarDataBR } from '../utils/format';
import { DatePickerSheet } from './DatePickerSheet';

/** Campo com rótulo que abre o seletor de data do app. Mantém o horário do valor atual. */
export function CampoData({
  label,
  value,
  onChange,
  placeholder = 'Selecionar data',
}: {
  label: string;
  value?: string;
  onChange: (iso: string) => void;
  placeholder?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const data = value ? new Date(value) : new Date();

  return (
    <View style={styles.campo}>
      <Text style={typography.label}>{label}</Text>
      <TouchableOpacity
        style={styles.botao}
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatarDataBR(value) : placeholder}`}>
        <Text style={[typography.body, !value && styles.placeholder]}>
          {value ? formatarDataBR(value) : placeholder}
        </Text>
        <CalendarDays size={18} color={colors.textMuted} />
      </TouchableOpacity>
      <DatePickerSheet
        visible={aberto}
        value={data}
        onCancel={() => setAberto(false)}
        onConfirm={escolhida => {
          setAberto(false);
          const resultado = new Date(data);
          resultado.setFullYear(escolhida.getFullYear(), escolhida.getMonth(), escolhida.getDate());
          onChange(resultado.toISOString());
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    gap: spacing.sm,
  },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  placeholder: {
    color: colors.placeholder,
  },
});
