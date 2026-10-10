import type { PontoReferencia } from '../constants/growthReference';

/** Interpola linearmente os percentis de referência para uma idade (em meses) qualquer. */
export function interpolarPercentis(
  tabela: PontoReferencia[],
  meses: number,
): Omit<PontoReferencia, 'meses'> | null {
  if (meses < tabela[0].meses || meses > tabela[tabela.length - 1].meses) {
    return null;
  }

  const proximo = tabela.findIndex(p => p.meses >= meses);
  const pontoDireita = tabela[proximo];
  if (pontoDireita.meses === meses || proximo === 0) {
    return {
      p3: pontoDireita.p3,
      p15: pontoDireita.p15,
      p50: pontoDireita.p50,
      p85: pontoDireita.p85,
      p97: pontoDireita.p97,
    };
  }

  const pontoEsquerda = tabela[proximo - 1];
  const fração =
    (meses - pontoEsquerda.meses) / (pontoDireita.meses - pontoEsquerda.meses);

  const interpolar = (a: number, b: number) => a + (b - a) * fração;

  return {
    p3: interpolar(pontoEsquerda.p3, pontoDireita.p3),
    p15: interpolar(pontoEsquerda.p15, pontoDireita.p15),
    p50: interpolar(pontoEsquerda.p50, pontoDireita.p50),
    p85: interpolar(pontoEsquerda.p85, pontoDireita.p85),
    p97: interpolar(pontoEsquerda.p97, pontoDireita.p97),
  };
}
