import { idadeEmMeses } from './age';
import type { Registro } from '../types';

interface DadosMedidasParciais {
  data?: string;
  periodoAno?: number;
  periodoMes?: number;
}

/**
 * Deriva a data efetiva de uma medição a partir do `dados` bruto do formulário/registro.
 * Registros antigos só têm `periodoMes`/`periodoAno` (sem dia); nesse caso assume-se o
 * dia 15 do mês/ano salvo como aproximação.
 */
export function dataEfetivaDeDados(dados: DadosMedidasParciais | undefined, fallback: string): string {
  if (dados?.periodoAno && dados?.periodoMes) {
    return new Date(dados.periodoAno, dados.periodoMes - 1, 15).toISOString();
  }
  return dados?.data ?? fallback;
}

export function dataEfetivaMedidas(registro: Pick<Registro, 'data' | 'dados'>): string {
  return dataEfetivaDeDados(registro.dados, registro.data);
}

/** Idade da criança em meses na data efetiva de um registro de medidas. */
export function idadeMesesMedidas(
  registro: Pick<Registro, 'data' | 'dados'>,
  dataNascimentoIso: string,
): number {
  return idadeEmMeses(dataNascimentoIso, dataEfetivaMedidas(registro));
}
