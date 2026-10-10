import type { SexoCrianca } from '../types';

/**
 * Referência nutricional curada a partir das Dietary Reference Intakes (DRI),
 * Institute of Medicine (EUA) / Health Canada — tabelas de EAR/RDA/AI/AMDR
 * publicadas entre 1997 e 2005 (conforme compilação fornecida pelo usuário).
 *
 * Subconjunto pequeno e deliberado: só os nutrientes que o app já estima a partir
 * dos alimentos registrados (proteína, carboidrato, gordura, fibra, sódio, cálcio,
 * ferro). Não inclui energia (kcal) — a necessidade energética (EER) depende de
 * peso e nível de atividade física, fora do escopo desta comparação simplificada.
 * Sem faixa etária coberta → sem comparação (nunca extrapolar/inventar).
 */

export type EstagioVidaDRI = '0-6m' | '7-12m' | '1-3a' | '4-8a' | '9-13a' | '14-18a';

export interface ReferenciaDRI {
  proteinaRdaG: number;
  proteinaAmdrPercent: [number, number];
  carboidratoAmdrPercent: [number, number];
  gorduraAmdrPercent: [number, number];
  fibraAiG: number;
  sodioAiG: number;
  calcioRdaMg: number;
  ferroRdaMg: number;
}

/** Estágios em que a RDA de proteína e a RDA de ferro diferem por sexo. */
const ESTAGIOS_COM_DIFERENCA_POR_SEXO: EstagioVidaDRI[] = ['9-13a', '14-18a'];

const REFERENCIA_UNISSEX: Record<Exclude<EstagioVidaDRI, '9-13a' | '14-18a'>, ReferenciaDRI> = {
  '0-6m': {
    proteinaRdaG: 9.1,
    proteinaAmdrPercent: [5, 20],
    carboidratoAmdrPercent: [45, 65],
    gorduraAmdrPercent: [30, 40],
    fibraAiG: 0,
    sodioAiG: 0.12,
    calcioRdaMg: 210,
    ferroRdaMg: 0.27,
  },
  '7-12m': {
    proteinaRdaG: 11,
    proteinaAmdrPercent: [5, 20],
    carboidratoAmdrPercent: [45, 65],
    gorduraAmdrPercent: [30, 40],
    fibraAiG: 0,
    sodioAiG: 0.37,
    calcioRdaMg: 270,
    ferroRdaMg: 11,
  },
  '1-3a': {
    proteinaRdaG: 13,
    proteinaAmdrPercent: [5, 20],
    carboidratoAmdrPercent: [45, 65],
    gorduraAmdrPercent: [30, 40],
    fibraAiG: 19,
    sodioAiG: 1.0,
    calcioRdaMg: 700,
    ferroRdaMg: 7,
  },
  '4-8a': {
    proteinaRdaG: 19,
    proteinaAmdrPercent: [10, 30],
    carboidratoAmdrPercent: [45, 65],
    gorduraAmdrPercent: [25, 35],
    fibraAiG: 25,
    sodioAiG: 1.2,
    calcioRdaMg: 1000,
    ferroRdaMg: 10,
  },
};

const REFERENCIA_POR_SEXO: Record<'9-13a' | '14-18a', Record<SexoCrianca, ReferenciaDRI>> = {
  '9-13a': {
    menino: {
      proteinaRdaG: 34,
      proteinaAmdrPercent: [10, 30],
      carboidratoAmdrPercent: [45, 65],
      gorduraAmdrPercent: [25, 35],
      fibraAiG: 31,
      sodioAiG: 1.5,
      calcioRdaMg: 1300,
      ferroRdaMg: 8,
    },
    menina: {
      proteinaRdaG: 34,
      proteinaAmdrPercent: [10, 30],
      carboidratoAmdrPercent: [45, 65],
      gorduraAmdrPercent: [25, 35],
      fibraAiG: 26,
      sodioAiG: 1.5,
      calcioRdaMg: 1300,
      ferroRdaMg: 8,
    },
  },
  '14-18a': {
    menino: {
      proteinaRdaG: 52,
      proteinaAmdrPercent: [10, 30],
      carboidratoAmdrPercent: [45, 65],
      gorduraAmdrPercent: [25, 35],
      fibraAiG: 38,
      sodioAiG: 1.5,
      calcioRdaMg: 1300,
      ferroRdaMg: 11,
    },
    menina: {
      proteinaRdaG: 46,
      proteinaAmdrPercent: [10, 30],
      carboidratoAmdrPercent: [45, 65],
      gorduraAmdrPercent: [25, 35],
      fibraAiG: 26,
      sodioAiG: 1.5,
      calcioRdaMg: 1300,
      ferroRdaMg: 15,
    },
  },
};

export function estagioVidaDRI(idadeMeses: number): EstagioVidaDRI | null {
  if (idadeMeses < 0) return null;
  if (idadeMeses < 6) return '0-6m';
  if (idadeMeses < 12) return '7-12m';
  if (idadeMeses < 48) return '1-3a';
  if (idadeMeses < 108) return '4-8a';
  if (idadeMeses < 168) return '9-13a';
  if (idadeMeses <= 216) return '14-18a';
  return null; // fora da faixa coberta (>18 anos)
}

export function referenciaDriPorEstagio(
  estagio: EstagioVidaDRI,
  sexo: SexoCrianca,
): ReferenciaDRI {
  if (ESTAGIOS_COM_DIFERENCA_POR_SEXO.includes(estagio)) {
    return REFERENCIA_POR_SEXO[estagio as '9-13a' | '14-18a'][sexo];
  }
  return REFERENCIA_UNISSEX[estagio as Exclude<EstagioVidaDRI, '9-13a' | '14-18a'>];
}
