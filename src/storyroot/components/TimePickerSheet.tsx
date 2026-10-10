import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { BottomSheet } from './BottomSheet';
import { WheelColumn } from './WheelColumn';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

interface TimePickerSheetProps {
  visible: boolean;
  value: Date;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
}

function apenasDigitos(texto: string): string {
  return texto.replace(/\D/g, '');
}

function validarCampo(texto: string, max: number): number | null {
  if (!texto.trim()) return null;
  const numero = Number(texto);
  if (Number.isNaN(numero) || numero < 0 || numero > max) return null;
  return numero;
}

export function TimePickerSheet({ visible, value, onCancel, onConfirm }: TimePickerSheetProps) {
  const [hour, setHour] = useState(value.getHours());
  const [minute, setMinute] = useState(value.getMinutes());
  const [inputHora, setInputHora] = useState('');
  const [inputMinuto, setInputMinuto] = useState('');
  const [visibleAnterior, setVisibleAnterior] = useState(visible);

  if (visible !== visibleAnterior) {
    setVisibleAnterior(visible);
    if (visible) {
      setHour(value.getHours());
      setMinute(value.getMinutes());
      setInputHora(String(value.getHours()).padStart(2, '0'));
      setInputMinuto(String(value.getMinutes()).padStart(2, '0'));
    }
  }

  if (!visible) return null;

  function confirmar() {
    const horaManual = validarCampo(inputHora, 23);
    const minutoManual = validarCampo(inputMinuto, 59);

    if (inputHora.trim().length > 0 && horaManual === null) {
      Alert.alert('Hora inválida', 'Digite uma hora entre 00 e 23.');
      return;
    }
    if (inputMinuto.trim().length > 0 && minutoManual === null) {
      Alert.alert('Minuto inválido', 'Digite minutos entre 00 e 59.');
      return;
    }

    const horaFinal = horaManual ?? hour;
    const minutoFinal = minutoManual ?? minute;
    const resultado = new Date(value);
    resultado.setHours(horaFinal, minutoFinal, 0, 0);
    onConfirm(resultado);
  }

  function aoDigitarHora(texto: string) {
    const digitos = apenasDigitos(texto).slice(0, 2);
    setInputHora(digitos);
    const horaManual = validarCampo(digitos, 23);
    if (horaManual !== null) {
      setHour(horaManual);
    }
  }

  function aoDigitarMinuto(texto: string) {
    const digitos = apenasDigitos(texto).slice(0, 2);
    setInputMinuto(digitos);
    const minutoManual = validarCampo(digitos, 59);
    if (minutoManual !== null) {
      setMinute(minutoManual);
    }
  }

  return (
    <BottomSheet onClose={onCancel} fillHeight={false}>
      <Text style={[typography.h3, styles.title]}>Selecionar horário</Text>
      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>Digite rápido</Text>
        <View style={styles.manualInputsRow}>
          <TextInput
            style={styles.timeInput}
            value={inputHora}
            onChangeText={aoDigitarHora}
            keyboardType="number-pad"
            placeholder="HH"
            placeholderTextColor={colors.placeholder}
            maxLength={2}
            selectionColor={colors.primary}
          />
          <Text style={styles.manualColon}>:</Text>
          <TextInput
            style={styles.timeInput}
            value={inputMinuto}
            onChangeText={aoDigitarMinuto}
            keyboardType="number-pad"
            placeholder="MM"
            placeholderTextColor={colors.placeholder}
            maxLength={2}
            selectionColor={colors.primary}
          />
        </View>
      </View>
      <View style={styles.wheelsRow}>
        <WheelColumn
          values={HOURS}
          selectedIndex={hour}
          onChange={(index) => {
            setHour(index);
            setInputHora(String(index).padStart(2, '0'));
          }}
        />
        <Text style={styles.colon}>:</Text>
        <WheelColumn
          values={MINUTES}
          selectedIndex={minute}
          onChange={(index) => {
            setMinute(index);
            setInputMinuto(String(index).padStart(2, '0'));
          }}
        />
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmButton} onPress={confirmar}>
          <Text style={styles.confirmText}>OK</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  manualInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  timeInput: {
    ...typography.h4,
    minWidth: 92,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.primary,
  },
  manualColon: {
    ...typography.h4,
    color: colors.primary,
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  colon: {
    ...typography.h2,
    color: colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...typography.label,
    color: colors.textMuted,
  },
  confirmButton: {
    flex: 1,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    ...typography.label,
    color: '#fff',
  },
});
