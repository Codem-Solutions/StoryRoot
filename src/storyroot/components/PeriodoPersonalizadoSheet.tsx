import { format } from 'date-fns';
import { Calendar } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { BottomSheet } from './BottomSheet';
import { DatePickerSheet } from './DatePickerSheet';
import { PrimaryButton } from './PrimaryButton';

interface Periodo {
  inicio: Date;
  fim: Date;
}

interface PeriodoPersonalizadoSheetProps {
  visible: boolean;
  valorInicial?: Periodo | null;
  onCancel: () => void;
  onConfirm: (periodo: Periodo) => void;
}

export function PeriodoPersonalizadoSheet({
  visible,
  valorInicial,
  onCancel,
  onConfirm,
}: PeriodoPersonalizadoSheetProps) {
  const [inicio, setInicio] = useState<Date | undefined>(valorInicial?.inicio);
  const [fim, setFim] = useState<Date | undefined>(valorInicial?.fim);
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFim, setShowPickerFim] = useState(false);
  const [visibleAnterior, setVisibleAnterior] = useState(visible);

  if (visible !== visibleAnterior) {
    setVisibleAnterior(visible);
    if (visible) {
      setInicio(valorInicial?.inicio);
      setFim(valorInicial?.fim);
    }
  }

  if (!visible) return null;

  const periodoValido = !!inicio && !!fim && inicio <= fim;

  return (
    <BottomSheet onClose={onCancel} fillHeight={false}>
      <Text style={[typography.h3, styles.title]}>Período personalizado</Text>

      <View style={styles.field}>
        <Text style={typography.label}>Data inicial</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowPickerInicio(true)}>
          <Text style={typography.body}>
            {inicio ? format(inicio, 'dd/MM/yyyy') : 'Selecionar data'}
          </Text>
          <Calendar size={20} color={colors.placeholder} />
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <Text style={typography.label}>Data final</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowPickerFim(true)}>
          <Text style={typography.body}>
            {fim ? format(fim, 'dd/MM/yyyy') : 'Selecionar data'}
          </Text>
          <Calendar size={20} color={colors.placeholder} />
        </TouchableOpacity>
      </View>

      {!!inicio && !!fim && inicio > fim && (
        <Text style={styles.error}>A data inicial deve ser anterior à data final.</Text>
      )}

      <PrimaryButton
        label="Aplicar filtro"
        disabled={!periodoValido}
        onPress={() => periodoValido && onConfirm({ inicio: inicio!, fim: fim! })}
        style={styles.confirmButton}
      />

      <DatePickerSheet
        visible={showPickerInicio}
        value={inicio ?? new Date()}
        onCancel={() => setShowPickerInicio(false)}
        onConfirm={date => {
          setShowPickerInicio(false);
          setInicio(date);
        }}
      />
      <DatePickerSheet
        visible={showPickerFim}
        value={fim ?? new Date()}
        onCancel={() => setShowPickerFim(false)}
        onConfirm={date => {
          setShowPickerFim(false);
          setFim(date);
        }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.lg,
  },
  field: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  error: {
    ...typography.caption,
    color: colors.red,
    marginBottom: spacing.md,
  },
  confirmButton: {
    marginTop: spacing.xs,
  },
});
