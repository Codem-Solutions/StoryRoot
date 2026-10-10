import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { BottomSheet } from './BottomSheet';

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i);

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

interface DatePickerSheetProps {
  visible: boolean;
  value: Date;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
}

export function DatePickerSheet({ visible, value, onCancel, onConfirm }: DatePickerSheetProps) {
  const [cursor, setCursor] = useState(startOfMonth(value));
  const [selecionado, setSelecionado] = useState(value);
  const [showMesModal, setShowMesModal] = useState(false);
  const [showAnoModal, setShowAnoModal] = useState(false);
  const [visibleAnterior, setVisibleAnterior] = useState(visible);

  if (visible !== visibleAnterior) {
    setVisibleAnterior(visible);
    if (visible) {
      setCursor(startOfMonth(value));
      setSelecionado(value);
    }
  }

  if (!visible) return null;

  const inicioGrade = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const fimGrade = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const dias = eachDayOfInterval({ start: inicioGrade, end: fimGrade });
  const semanas: Date[][] = [];
  for (let i = 0; i < dias.length; i += 7) {
    semanas.push(dias.slice(i, i + 7));
  }

  function confirmar() {
    onConfirm(selecionado);
  }

  return (
    <>
      <BottomSheet onClose={onCancel} fillHeight={false}>
        <Text style={[typography.h3, styles.title]}>Selecionar data</Text>

        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.navArrow}
            onPress={() => setCursor(subMonths(cursor, 1))}>
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.navChips}>
            <TouchableOpacity style={styles.chip} onPress={() => setShowMesModal(true)}>
              <Text style={styles.chipText}>{capitalizar(format(cursor, 'MMMM', { locale: ptBR }))}</Text>
              <ChevronDown size={14} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => setShowAnoModal(true)}>
              <Text style={styles.chipText}>{format(cursor, 'yyyy')}</Text>
              <ChevronDown size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.navArrow}
            onPress={() => setCursor(addMonths(cursor, 1))}>
            <ChevronRight size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayRow}>
          {DIAS_SEMANA.map(dia => (
            <Text key={dia} style={styles.weekdayText}>
              {dia}
            </Text>
          ))}
        </View>

        {semanas.map((semana, i) => (
          <View key={i} style={styles.weekRow}>
            {semana.map(dia => {
              const doMes = isSameMonth(dia, cursor);
              const ativo = isSameDay(dia, selecionado);
              return (
                <TouchableOpacity
                  key={dia.toISOString()}
                  style={styles.dayCell}
                  onPress={() => setSelecionado(dia)}>
                  <View style={[styles.dayCircle, ativo && styles.dayCircleAtivo]}>
                    <Text
                      style={[
                        styles.dayText,
                        !doMes && styles.dayTextMuted,
                        ativo && styles.dayTextAtivo,
                      ]}>
                      {dia.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmButton} onPress={confirmar}>
            <Text style={styles.confirmText}>OK</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      <Modal
        visible={showMesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMesModal(false)}
        statusBarTranslucent
        navigationBarTranslucent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMesModal(false)}>
          <View style={styles.modalContent}>
            {MONTHS.map(mes => (
              <TouchableOpacity
                key={mes}
                style={styles.modalOption}
                onPress={() => {
                  setCursor(new Date(cursor.getFullYear(), mes, 1));
                  setShowMesModal(false);
                }}>
                <Text style={typography.body}>
                  {capitalizar(format(new Date(2000, mes, 1), 'MMMM', { locale: ptBR }))}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showAnoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAnoModal(false)}
        statusBarTranslucent
        navigationBarTranslucent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAnoModal(false)}>
          <View style={[styles.modalContent, styles.modalContentScroll]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {YEARS.map(ano => (
                <TouchableOpacity
                  key={ano}
                  style={styles.modalOption}
                  onPress={() => {
                    setCursor(new Date(ano, cursor.getMonth(), 1));
                    setShowAnoModal(false);
                  }}>
                  <Text style={typography.body}>{ano}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    ...typography.label,
    fontSize: 14,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekdayText: {
    ...typography.caption,
    flex: 1,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: '78%',
    height: '78%',
    maxWidth: 36,
    maxHeight: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleAtivo: {
    backgroundColor: colors.primary,
  },
  dayText: {
    ...typography.body,
    fontSize: 14,
  },
  dayTextMuted: {
    color: colors.placeholder,
  },
  dayTextAtivo: {
    color: '#fff',
    fontFamily: typography.label.fontFamily,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,23,15,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  modalContentScroll: {
    maxHeight: 400,
  },
  modalOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
