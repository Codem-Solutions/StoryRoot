export interface Sintoma {
  id: string;
  label: string;
  /** Sinal de alerta: o app sugere procurar atendimento médico. */
  alerta?: boolean;
}

export interface GrupoSintomas {
  titulo: string;
  sintomas: Sintoma[];
}

export const SINTOMA_OUTRO = 'outro';

export const GRUPOS_SINTOMAS: GrupoSintomas[] = [
  {
    titulo: 'Gerais',
    sintomas: [
      { id: 'febre', label: 'Febre' },
      { id: 'febre-alta', label: 'Febre alta (39 °C ou mais)', alerta: true },
      { id: 'calafrios', label: 'Calafrios' },
      { id: 'moleza', label: 'Cansaço / moleza' },
      { id: 'irritabilidade', label: 'Irritabilidade' },
      { id: 'choro', label: 'Choro excessivo' },
      { id: 'sonolencia', label: 'Sonolência excessiva', alerta: true },
      { id: 'falta-apetite', label: 'Falta de apetite' },
      { id: 'recusa-mamada', label: 'Recusa de mamadas' },
      { id: 'desidratacao', label: 'Sinais de desidratação (boca seca, pouco xixi)', alerta: true },
      { id: 'suor', label: 'Suor excessivo' },
    ],
  },
  {
    titulo: 'Respiratórios',
    sintomas: [
      { id: 'tosse-seca', label: 'Tosse seca' },
      { id: 'tosse-catarro', label: 'Tosse com catarro' },
      { id: 'coriza', label: 'Coriza (nariz escorrendo)' },
      { id: 'nariz-entupido', label: 'Nariz entupido' },
      { id: 'espirros', label: 'Espirros' },
      { id: 'dor-garganta', label: 'Dor de garganta' },
      { id: 'rouquidao', label: 'Rouquidão' },
      { id: 'chiado', label: 'Chiado no peito' },
      { id: 'falta-ar', label: 'Falta de ar / respiração rápida', alerta: true },
    ],
  },
  {
    titulo: 'Digestivos',
    sintomas: [
      { id: 'vomito', label: 'Vômito' },
      { id: 'nausea', label: 'Enjoo' },
      { id: 'diarreia', label: 'Diarreia' },
      { id: 'prisao-ventre', label: 'Prisão de ventre' },
      { id: 'colica', label: 'Cólica' },
      { id: 'dor-barriga', label: 'Dor de barriga' },
      { id: 'gases', label: 'Gases' },
      { id: 'refluxo', label: 'Refluxo / regurgitação' },
      { id: 'sangue-fezes', label: 'Sangue nas fezes', alerta: true },
    ],
  },
  {
    titulo: 'Pele',
    sintomas: [
      { id: 'manchas', label: 'Manchas vermelhas' },
      { id: 'brotoejas', label: 'Brotoejas' },
      { id: 'coceira', label: 'Coceira' },
      { id: 'assadura', label: 'Assadura' },
      { id: 'urticaria', label: 'Urticária (placas na pele)' },
      { id: 'bolhas', label: 'Bolhas' },
      { id: 'picada', label: 'Picada de inseto' },
      { id: 'inchaco', label: 'Inchaço' },
      { id: 'ictericia', label: 'Pele ou olhos amarelados', alerta: true },
      { id: 'manchas-roxas', label: 'Manchas roxas que não somem ao apertar', alerta: true },
    ],
  },
  {
    titulo: 'Olhos, ouvidos e boca',
    sintomas: [
      { id: 'olhos-vermelhos', label: 'Olhos vermelhos' },
      { id: 'secrecao-olhos', label: 'Secreção nos olhos' },
      { id: 'lacrimejamento', label: 'Lacrimejamento' },
      { id: 'dor-ouvido', label: 'Dor de ouvido' },
      { id: 'secrecao-ouvido', label: 'Secreção no ouvido' },
      { id: 'aftas', label: 'Aftas' },
      { id: 'sapinho', label: 'Sapinho' },
      { id: 'dentes', label: 'Desconforto com nascimento dos dentes' },
      { id: 'salivacao', label: 'Salivação excessiva' },
    ],
  },
  {
    titulo: 'Dores e outros',
    sintomas: [
      { id: 'dor-cabeca', label: 'Dor de cabeça' },
      { id: 'dor-corpo', label: 'Dor no corpo' },
      { id: 'dor-articulacoes', label: 'Dor nas pernas ou articulações' },
      { id: 'dor-urinar', label: 'Dor ou ardência ao urinar' },
      { id: 'xixi-cheiro', label: 'Xixi com cheiro forte' },
      { id: 'alergia', label: 'Reação alérgica' },
      { id: 'queda', label: 'Queda / pancada' },
      { id: 'rigidez-nuca', label: 'Rigidez na nuca', alerta: true },
      { id: 'convulsao', label: 'Convulsão', alerta: true },
      { id: 'desmaio', label: 'Desmaio', alerta: true },
    ],
  },
];

const SINTOMAS_POR_ID = new Map(
  GRUPOS_SINTOMAS.flatMap(grupo => grupo.sintomas).map(sintoma => [sintoma.id, sintoma]),
);

export function buscarSintoma(id: string): Sintoma | undefined {
  return SINTOMAS_POR_ID.get(id);
}

/** Nomes legíveis dos sintomas, com o texto livre no lugar de "Outros". */
export function rotulosSintomas(ids: string[], outro?: string): string[] {
  return ids
    .map(id => (id === SINTOMA_OUTRO ? outro?.trim() || 'Outro sintoma' : buscarSintoma(id)?.label))
    .filter((rotulo): rotulo is string => !!rotulo);
}
