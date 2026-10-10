export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const MESES_ABREV = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

/** `periodoMes` é 1–12; os arrays acima são 0-indexados. */
export function nomeMes(periodoMes: number): string {
  return MESES[periodoMes - 1] ?? '';
}

export function nomeMesAbrev(periodoMes: number): string {
  return MESES_ABREV[periodoMes - 1] ?? '';
}
