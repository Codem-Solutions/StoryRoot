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
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MAX_MARCADORES = 3;

/** Chave de dia usada em `marcadores`: yyyy-MM-dd no fuso local. */
export function chaveDia(data: Date | string): string {
  return format(typeof data === 'string' ? new Date(data) : data, 'yyyy-MM-dd');
}

interface CalendarioMensalProps {
  mes: Date;
  onMudarMes: (mes: Date) => void;
  diaSelecionado: Date;
  onSelecionarDia: (dia: Date) => void;
  /** Cores dos pontos exibidos em cada dia, indexadas por `chaveDia`. */
  marcadores: Map<string, string[]>;
}

/** Calendário de mês inteiro com pontos coloridos nos dias que têm eventos. */
export function CalendarioMensal({
  mes,
  onMudarMes,
  diaSelecionado,
  onSelecionarDia,
  marcadores,
}: CalendarioMensalProps) {
  const hoje = new Date();
  const dias = eachDayOfInterval({
    start: startOfWeek(startOfMonth(mes), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(mes), { weekStartsOn: 1 }),
  });
  const semanas: Date[][] = [];
  for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));

  const titulo = format(mes, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <TouchableOpacity
          style={styles.seta}
          onPress={() => onMudarMes(subMonths(mes, 1))}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior">
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.titulo}>{titulo.charAt(0).toUpperCase() + titulo.slice(1)}</Text>
        <TouchableOpacity
          style={styles.seta}
          onPress={() => onMudarMes(addMonths(mes, 1))}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês">
          <ChevronRight size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.linha}>
        {DIAS_SEMANA.map(dia => (
          <Text key={dia} style={styles.diaSemana}>
            {dia}
          </Text>
        ))}
      </View>

      {semanas.map(semana => (
        <View key={semana[0].toISOString()} style={styles.linha}>
          {semana.map(dia => {
            const doMes = isSameMonth(dia, mes);
            const selecionado = isSameDay(dia, diaSelecionado);
            const ehHoje = isSameDay(dia, hoje);
            const cores = marcadores.get(chaveDia(dia)) ?? [];
            return (
              <TouchableOpacity
                key={dia.toISOString()}
                style={styles.celula}
                onPress={() => onSelecionarDia(dia)}
                accessibilityRole="button"
                accessibilityState={{ selected: selecionado }}
                accessibilityLabel={`${format(dia, "d 'de' MMMM", { locale: ptBR })}${
                  cores.length ? `, ${cores.length} vacina${cores.length > 1 ? 's' : ''}` : ''
                }`}>
                <View
                  style={[
                    styles.numeroFundo,
                    ehHoje && styles.numeroHoje,
                    selecionado && styles.numeroSelecionado,
                  ]}>
                  <Text
                    style={[
                      styles.numero,
                      !doMes && styles.numeroForaDoMes,
                      ehHoje && styles.numeroHojeTexto,
                      selecionado && styles.numeroSelecionadoTexto,
                    ]}>
                    {format(dia, 'd')}
                  </Text>
                </View>
                <View style={styles.pontos}>
                  {cores.slice(0, MAX_MARCADORES).map((cor, i) => (
                    <View
                      key={`${cor}-${i}`}
                      style={[styles.ponto, { backgroundColor: cor }, !doMes && styles.pontoForaDoMes]}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  seta: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    ...typography.h4,
  },
  linha: {
    flexDirection: 'row',
  },
  diaSemana: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    color: colors.textMuted,
    paddingVertical: spacing.xs,
  },
  celula: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 3,
    minHeight: 46,
  },
  numeroFundo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroHoje: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  numeroSelecionado: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  numero: {
    ...typography.label,
    fontSize: 13,
  },
  numeroForaDoMes: {
    color: colors.placeholder,
  },
  numeroHojeTexto: {
    color: colors.primary,
  },
  numeroSelecionadoTexto: {
    color: '#fff',
  },
  pontos: {
    flexDirection: 'row',
    gap: 2,
    height: 6,
    marginTop: 2,
  },
  ponto: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pontoForaDoMes: {
    opacity: 0.4,
  },
});
