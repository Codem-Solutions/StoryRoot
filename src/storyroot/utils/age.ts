import { differenceInMonths, differenceInYears } from 'date-fns';

/** Idade em meses completos na data de referência (usada para consultar as curvas de crescimento). */
export function idadeEmMeses(dataNascimentoIso: string, emIso?: string): number {
  const nascimento = new Date(dataNascimentoIso);
  const referencia = emIso ? new Date(emIso) : new Date();
  return differenceInMonths(referencia, nascimento);
}

export function formatarIdade(dataNascimentoIso: string, emIso?: string): string {
  const nascimento = new Date(dataNascimentoIso);
  const referencia = emIso ? new Date(emIso) : new Date();

  const anos = differenceInYears(referencia, nascimento);
  const meses = differenceInMonths(referencia, nascimento) % 12;

  if (anos <= 0 && meses <= 0) {
    return 'recém-nascido(a)';
  }
  if (anos <= 0) {
    return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  }
  if (meses === 0) {
    return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  }
  return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${meses} ${
    meses === 1 ? 'mês' : 'meses'
  }`;
}
