import { estagioVidaDRI, referenciaDriPorEstagio, type ReferenciaDRI } from '../constants/dri';
import type {
  Alimento,
  CategoriaAlimento,
  ComidaDados,
  ComportamentoAlimentar,
  InformacaoNutricional,
  ItemRefeicao,
  NivelAceitacao,
  Registro,
  SexoCrianca,
  TexturaAlimento,
  TipoRefeicao,
} from '../types';

export const ROTULOS_CONSUMO: Record<ItemRefeicao['consumo'], string> = {
  total: 'Comeu tudo',
  parcial: 'Comeu parte',
  recusado: 'Recusou',
};

export const ROTULOS_TEXTURA: Record<TexturaAlimento, string> = {
  liquido: 'Líquido',
  pure: 'Purê',
  amassado: 'Amassado',
  picado: 'Picado',
  desfiado: 'Desfiado',
  solido: 'Sólido',
};

export const ROTULOS_APETITE: Record<'muita_fome' | 'fome_normal' | 'pouca_fome' | 'sem_fome', string> = {
  muita_fome: 'Muita fome',
  fome_normal: 'Fome normal',
  pouca_fome: 'Pouca fome',
  sem_fome: 'Sem fome',
};

export const ROTULOS_COMPORTAMENTO: Record<ComportamentoAlimentar, string> = {
  tranquilo: 'Comeu tranquilamente',
  precisou_ajuda: 'Precisou de ajuda',
  sozinho: 'Comeu sozinho',
  distraido: 'Estava distraído',
  irritado: 'Estava irritado',
  sonolento: 'Estava sonolento',
  chorou: 'Chorou',
  recusou_alimentos: 'Recusou alimentos',
};

export const ROTULOS_UNIDADE: Record<string, string> = {
  g: 'g',
  ml: 'ml',
  unidade: 'unidade',
  colher_cha: 'colher de chá',
  colher_sopa: 'colher de sopa',
  xicara: 'xícara',
  copo: 'copo',
  porcao: 'porção',
};

export const ROTULOS_TIPO_REFEICAO: Record<TipoRefeicao, string> = {
  cafe_manha: 'Café da manhã',
  lanche_manha: 'Lanche da manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da tarde',
  jantar: 'Jantar',
  lanche_noite: 'Lanche da noite',
  ceia: 'Ceia',
  alimentacao_complementar: 'Alimentação complementar',
  refeicao_escolar: 'Refeição escolar',
  refeicao_fora: 'Refeição fora de casa',
  refeicao_especial: 'Refeição especial',
};

export const ROTULOS_ACEITACAO: Record<NivelAceitacao, string> = {
  adorou: 'Adorou',
  aceitou_bem: 'Aceitou bem',
  aceitou: 'Aceitou',
  experimentou: 'Experimentou',
  recusou: 'Recusou',
};

export const ROTULOS_CATEGORIA: Record<CategoriaAlimento, string> = {
  cereal_tuberculo: 'Cereais e tubérculos',
  proteina_animal: 'Proteínas',
  leguminosa: 'Leguminosas',
  fruta: 'Frutas',
  verdura_legume: 'Verduras e legumes',
  laticinio: 'Laticínios',
  oleaginosa_semente: 'Oleaginosas e sementes',
  gordura_oleo: 'Gorduras e óleos',
  acucar_doce: 'Açúcares e doces',
  bebida: 'Bebidas',
  outro: 'Outros',
};

export function rotuloTipoRefeicao(tipo?: TipoRefeicao): string {
  return tipo ? (ROTULOS_TIPO_REFEICAO[tipo] ?? tipo) : '';
}

export function rotuloAceitacao(nivel?: NivelAceitacao): string {
  return nivel ? (ROTULOS_ACEITACAO[nivel] ?? nivel) : '';
}

export function rotuloCategoria(categoria?: CategoriaAlimento): string {
  return categoria ? (ROTULOS_CATEGORIA[categoria] ?? categoria) : '';
}

/** Registros de comida de uma criança, ordenados do mais recente para o mais antigo. */
export function registrosComidaDaCrianca(registros: Registro[], criancaId: string): Registro[] {
  return registros
    .filter(r => r.criancaId === criancaId && r.tipo === 'comida')
    .slice()
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

/** true quando esse alimento nunca apareceu em nenhum registro anterior da criança. */
export function alimentoENovoParaCrianca(
  registrosComida: Registro[],
  alimentoId: string,
  ignorarRegistroId?: string,
): boolean {
  return !registrosComida.some(r => {
    if (r.id === ignorarRegistroId) return false;
    const dados = r.dados as ComidaDados | undefined;
    return (dados?.itens ?? []).some(item => item.alimentoId === alimentoId);
  });
}

const GRAMAS_POR_UNIDADE_FIXA: Partial<Record<string, number>> = {
  g: 1,
  ml: 1,
};

/**
 * Converte uma quantidade (na unidade do item) para gramas, quando possível.
 * A quantidade é opcional no registro rápido (o usuário normalmente só marca
 * "comeu tudo/parte/recusou" sem digitar gramas) — nesse caso assume-se 1 porção
 * padrão do alimento para "comeu tudo", metade disso para "comeu parte", e nada
 * para "recusou".
 */
function converterParaGramas(item: ItemRefeicao, alimento: Alimento | undefined): number | null {
  if (!alimento) return null;
  let quantidade = item.quantidadeConsumida ?? item.quantidadeOferecida;
  if (quantidade == null) {
    if (item.consumo === 'recusado') return null;
    quantidade = item.consumo === 'parcial' ? 0.5 : 1;
  }
  if (!quantidade) return null;
  const fatorFixo = GRAMAS_POR_UNIDADE_FIXA[item.unidade];
  if (fatorFixo) return quantidade * fatorFixo;
  if (item.unidade === alimento.unidadePadrao && alimento.gramasPorUnidadePadrao) {
    return quantidade * alimento.gramasPorUnidadePadrao;
  }
  return null;
}

/**
 * Estimativa de nutrientes de uma refeição, a partir dos alimentos e quantidades
 * registradas. Itens sem conversão confiável para gramas (unidade não reconhecida ou
 * alimento sem `gramasPorUnidadePadrao`) são simplesmente ignorados na soma — nunca
 * estimados por aproximação livre.
 */
export function estimarNutrientesRefeicao(
  itens: ItemRefeicao[],
  alimentos: Alimento[],
): { nutrientes: InformacaoNutricional; itensConsiderados: number; itensIgnorados: number } {
  const porId = new Map(alimentos.map(a => [a.id, a]));
  const total: InformacaoNutricional = {};
  let itensConsiderados = 0;
  let itensIgnorados = 0;

  for (const item of itens) {
    const alimento = porId.get(item.alimentoId);
    const gramas = converterParaGramas(item, alimento);
    if (gramas === null || !alimento?.nutrientes) {
      itensIgnorados += 1;
      continue;
    }
    itensConsiderados += 1;
    const fator = gramas / 100;
    const n = alimento.nutrientes;
    if (n.energiaKcal != null) total.energiaKcal = (total.energiaKcal ?? 0) + n.energiaKcal * fator;
    if (n.proteinaG != null) total.proteinaG = (total.proteinaG ?? 0) + n.proteinaG * fator;
    if (n.carboidratoG != null) total.carboidratoG = (total.carboidratoG ?? 0) + n.carboidratoG * fator;
    if (n.gordurasTotaisG != null)
      total.gordurasTotaisG = (total.gordurasTotaisG ?? 0) + n.gordurasTotaisG * fator;
    if (n.fibraG != null) total.fibraG = (total.fibraG ?? 0) + n.fibraG * fator;
    if (n.acucaresG != null) total.acucaresG = (total.acucaresG ?? 0) + n.acucaresG * fator;
    if (n.sodioMg != null) total.sodioMg = (total.sodioMg ?? 0) + n.sodioMg * fator;
    if (n.calcioMg != null) total.calcioMg = (total.calcioMg ?? 0) + n.calcioMg * fator;
    if (n.ferroMg != null) total.ferroMg = (total.ferroMg ?? 0) + n.ferroMg * fator;
  }

  return { nutrientes: total, itensConsiderados, itensIgnorados };
}

interface IndicadoresAlimentacao {
  totalRefeicoes: number;
  mediaRefeicoesPorDia: number;
  alimentosDiferentes: number;
  novosAlimentos: number;
  taxaAceitacaoMedia: number | null;
  maisConsumidos: { alimento: Alimento; vezes: number; ultimoConsumo: string }[];
  maisAceitos: { alimento: Alimento; vezes: number }[];
  maisRecusados: { alimento: Alimento; vezes: number }[];
  frequenciaPorCategoria: { categoria: CategoriaAlimento; vezes: number }[];
}

const NIVEL_ACEITACAO_PESO: Record<NivelAceitacao, number> = {
  adorou: 1,
  aceitou_bem: 0.85,
  aceitou: 0.65,
  experimentou: 0.4,
  recusou: 0,
};

/** Calcula os indicadores do dashboard a partir dos registros de comida já filtrados por período. */
export function indicadoresAlimentacao(
  registrosFiltrados: Registro[],
  alimentos: Alimento[],
  diasNoPeriodo: number,
): IndicadoresAlimentacao {
  const porId = new Map(alimentos.map(a => [a.id, a]));
  const contagem = new Map<string, { vezes: number; ultimoConsumo: string; aceitacoes: number[] }>();
  const categoriaContagem = new Map<CategoriaAlimento, number>();
  const alimentosUnicos = new Set<string>();
  let somaAceitacao = 0;
  let qtdAceitacao = 0;

  for (const registro of registrosFiltrados) {
    const dados = registro.dados as ComidaDados | undefined;
    for (const item of dados?.itens ?? []) {
      const alimento = porId.get(item.alimentoId);
      alimentosUnicos.add(item.alimentoId);
      const atual = contagem.get(item.alimentoId) ?? {
        vezes: 0,
        ultimoConsumo: registro.data,
        aceitacoes: [],
      };
      atual.vezes += 1;
      if (new Date(registro.data).getTime() > new Date(atual.ultimoConsumo).getTime()) {
        atual.ultimoConsumo = registro.data;
      }
      if (item.aceitacao) {
        atual.aceitacoes.push(NIVEL_ACEITACAO_PESO[item.aceitacao]);
        somaAceitacao += NIVEL_ACEITACAO_PESO[item.aceitacao];
        qtdAceitacao += 1;
      }
      contagem.set(item.alimentoId, atual);
      if (alimento) {
        categoriaContagem.set(alimento.categoria, (categoriaContagem.get(alimento.categoria) ?? 0) + 1);
      }
    }
  }

  const ranking = Array.from(contagem.entries())
    .map(([alimentoId, dados]) => ({ alimento: porId.get(alimentoId), ...dados }))
    .filter((r): r is { alimento: Alimento; vezes: number; ultimoConsumo: string; aceitacoes: number[] } => !!r.alimento);

  const maisConsumidos = ranking
    .slice()
    .sort((a, b) => b.vezes - a.vezes)
    .slice(0, 5)
    .map(r => ({ alimento: r.alimento, vezes: r.vezes, ultimoConsumo: r.ultimoConsumo }));

  const comAceitacao = ranking.filter(r => r.aceitacoes.length > 0);
  const maisAceitos = comAceitacao
    .slice()
    .sort(
      (a, b) =>
        b.aceitacoes.reduce((s, v) => s + v, 0) / b.aceitacoes.length -
        a.aceitacoes.reduce((s, v) => s + v, 0) / a.aceitacoes.length,
    )
    .slice(0, 5)
    .map(r => ({ alimento: r.alimento, vezes: r.vezes }));

  const maisRecusados = comAceitacao
    .slice()
    .sort(
      (a, b) =>
        a.aceitacoes.reduce((s, v) => s + v, 0) / a.aceitacoes.length -
        b.aceitacoes.reduce((s, v) => s + v, 0) / b.aceitacoes.length,
    )
    .slice(0, 5)
    .map(r => ({ alimento: r.alimento, vezes: r.vezes }));

  const frequenciaPorCategoria = Array.from(categoriaContagem.entries())
    .map(([categoria, vezes]) => ({ categoria, vezes }))
    .sort((a, b) => b.vezes - a.vezes);

  return {
    totalRefeicoes: registrosFiltrados.length,
    mediaRefeicoesPorDia: diasNoPeriodo > 0 ? registrosFiltrados.length / diasNoPeriodo : 0,
    alimentosDiferentes: alimentosUnicos.size,
    novosAlimentos: 0, // calculado no dashboard, que tem acesso ao histórico completo
    taxaAceitacaoMedia: qtdAceitacao > 0 ? somaAceitacao / qtdAceitacao : null,
    maisConsumidos,
    maisAceitos,
    maisRecusados,
    frequenciaPorCategoria,
  };
}

export type NivelReferencia = 'abaixo' | 'dentro' | 'acima';

/** Classifica um valor estimado dentro de uma faixa-alvo [min, max]. */
export function classificarNivel(valor: number, min: number, max: number): NivelReferencia {
  if (valor < min) return 'abaixo';
  if (valor > max) return 'acima';
  return 'dentro';
}

/**
 * Referência DRI (Institute of Medicine) para a idade/sexo da criança, quando
 * coberta pela tabela curada em `src/constants/dri.ts`. `null` quando fora de faixa
 * — nunca extrapolado.
 */
export function referenciaDRI(idadeMeses: number, sexo: SexoCrianca): ReferenciaDRI | null {
  const estagio = estagioVidaDRI(idadeMeses);
  if (!estagio) return null;
  return referenciaDriPorEstagio(estagio, sexo);
}
