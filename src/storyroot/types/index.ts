export interface ResponsavelLocal {
  id: string;
  criadoEm: string; // ISO datetime
}

export type SexoCrianca = 'menino' | 'menina';

export interface Crianca {
  id: string;
  responsavelId: string;
  nome: string;
  dataNascimento: string; // ISO date
  sexo: SexoCrianca;
  fotoUri?: string;
  irmaosIds: string[];
  criadoEm: string; // ISO datetime
}

export type TipoRegistro =
  | 'sono'
  | 'amamentacao'
  | 'mamadeira'
  | 'comida'
  | 'fralda'
  | 'saude'
  | 'medidas'
  | 'remedio'
  | 'vacina'
  | 'outros';

export interface Registro {
  id: string;
  criancaId: string;
  tipo: TipoRegistro;
  data: string; // ISO datetime
  observacao?: string;
  valor?: string; // ex: "3h20", "6.2kg", "Paracetamol 5ml"
  /** Raw form data behind `valor`, kept for records that support editing (e.g. remédio). */
  dados?: Record<string, any>;
  /** IDs of scheduled local notifications tied to this record, if any. */
  notificacaoIds?: string[];
}

/** Shape of `Registro.dados` quando `tipo === 'medidas'`. */
export interface MedidasDados {
  alturaM?: string;
  alturaCm?: string;
  pesoKg?: string;
  pesoG?: string;
  pc?: string;
  observacao?: string;
  data?: string; // ISO — data real da medição
  /** @deprecated legado — mantido só para leitura de registros antigos */
  periodoMes?: number;
  /** @deprecated legado — mantido só para leitura de registros antigos */
  periodoAno?: number;
}

// ---------------------------------------------------------------------------
// Alimentação
// ---------------------------------------------------------------------------

export type CategoriaAlimento =
  | 'cereal_tuberculo'
  | 'proteina_animal'
  | 'leguminosa'
  | 'fruta'
  | 'verdura_legume'
  | 'laticinio'
  | 'oleaginosa_semente'
  | 'gordura_oleo'
  | 'acucar_doce'
  | 'bebida'
  | 'outro';

export type UnidadeQuantidade =
  | 'g'
  | 'ml'
  | 'unidade'
  | 'colher_cha'
  | 'colher_sopa'
  | 'xicara'
  | 'copo'
  | 'porcao';

/** Valores por 100g do alimento (padrão das tabelas de composição de alimentos). */
export interface InformacaoNutricional {
  energiaKcal?: number;
  proteinaG?: number;
  carboidratoG?: number;
  gordurasTotaisG?: number;
  gordurasSaturadasG?: number;
  gordurasTransG?: number;
  fibraG?: number;
  acucaresG?: number;
  acucaresAdicionadosG?: number;
  sodioMg?: number;
  calcioMg?: number;
  ferroMg?: number;
}

export interface Alimento {
  id: string;
  nome: string;
  nomeExibicao: string;
  categoria: CategoriaAlimento;
  subcategoria?: string;
  unidadePadrao: UnidadeQuantidade;
  /** Estimativa de gramas por unidade padrão, quando conhecida (ex.: 1 banana ≈ 90g). */
  gramasPorUnidadePadrao?: number;
  nutrientes?: InformacaoNutricional;
  /** Fonte dos dados nutricionais, ex.: "TACO 4ª ed. (NEPA/UNICAMP)". */
  fonteNutricional?: string;
  ativo: boolean;
  /** true = alimento da base padrão do app (não criado pelo usuário). */
  sistema: boolean;
  criadoEm: string; // ISO datetime
}

export type NivelAceitacao = 'adorou' | 'aceitou_bem' | 'aceitou' | 'experimentou' | 'recusou';

export type TexturaAlimento = 'liquido' | 'pure' | 'amassado' | 'picado' | 'desfiado' | 'solido';

export type ComportamentoAlimentar =
  | 'tranquilo'
  | 'precisou_ajuda'
  | 'sozinho'
  | 'distraido'
  | 'irritado'
  | 'sonolento'
  | 'chorou'
  | 'recusou_alimentos';

export type TipoRefeicao =
  | 'cafe_manha'
  | 'lanche_manha'
  | 'almoco'
  | 'lanche_tarde'
  | 'jantar'
  | 'lanche_noite'
  | 'ceia'
  | 'alimentacao_complementar'
  | 'refeicao_escolar'
  | 'refeicao_fora'
  | 'refeicao_especial';

export interface ItemRefeicao {
  alimentoId: string;
  quantidadeOferecida?: number;
  quantidadeConsumida?: number;
  unidade: UnidadeQuantidade;
  consumo: 'total' | 'parcial' | 'recusado';
  aceitacao?: NivelAceitacao;
  observacao?: string;
  /** Presente quando esse alimento é a primeira vez registrado para a criança. */
  introducao?: { textura?: TexturaAlimento; formaPreparo?: string };
}

/** Shape de `Registro.dados` quando `tipo === 'comida'`. */
export interface ComidaDados {
  tipoRefeicao: TipoRefeicao;
  itens: ItemRefeicao[];
  data?: string; // ISO — data/horário da refeição
  local?: string;
  quemOfereceu?: string;
  apetite?: 'muita_fome' | 'fome_normal' | 'pouca_fome' | 'sem_fome';
  aceitacaoGeral?: NivelAceitacao;
  comportamento?: ComportamentoAlimentar[];
  observacao?: string;
}

/** Shape de `Registro.dados` quando `tipo === 'mamadeira'`. */
export interface MamadeiraDados {
  tipoLeite: 'materno_ordenhado' | 'formula' | 'outro';
  volumeOferecidoMl?: string;
  volumeConsumidoMl?: string;
  horario?: string; // ISO
  aceitouTudo?: boolean;
  observacao?: string;
}

// ---------------------------------------------------------------------------
// Registro Saúde (episódio de sintomas)
// ---------------------------------------------------------------------------

export type StatusSaude = 'inicio' | 'evolucao' | 'melhora' | 'fim_sintomas' | 'finalizado';

export interface AtualizacaoStatusSaude {
  status: StatusSaude;
  data: string; // ISO datetime — quando o status foi registrado
  observacao?: string;
}

/** Shape de `Registro.dados` quando `tipo === 'saude'`. */
export interface SaudeDados {
  /** IDs de `SINTOMAS` (constants/sintomas.ts); `outro` indica sintoma livre. */
  sintomas: string[];
  sintomaOutro?: string;
  dataInicio: string; // ISO datetime
  medicacao?: string;
  fotos?: string[];
  /** Status atual — sempre igual ao último item de `statusHistorico`. */
  status: StatusSaude;
  statusHistorico: AtualizacaoStatusSaude[];
  /** @deprecated legado — registros antigos tinham só um texto livre */
  detalhes?: string;
}

// ---------------------------------------------------------------------------
// Caderneta de vacinas
// ---------------------------------------------------------------------------

export interface AcompanhamentoVacina {
  id: string;
  data: string; // ISO datetime
  texto: string;
}

/**
 * O que foi registrado para uma vacina de uma criança. Vacinas do calendário
 * oficial usam `vacinaId`; vacinas extras (particular, campanha) usam `nome`.
 */
export interface RegistroVacina {
  id: string;
  criancaId: string;
  vacinaId?: string;
  nome?: string;
  dose?: string;
  /** Data agendada. Para vacinas do calendário, substitui a data calculada pela idade. */
  dataPrevista?: string;
  aplicada: boolean;
  dataAplicacao?: string;
  lote?: string;
  unidade?: string;
  profissional?: string;
  reacoes: string[];
  acompanhamentos: AcompanhamentoVacina[];
  observacao?: string;
  atualizadoEm: string;
}

export type TipoMidiaMemoria = 'foto' | 'video' | 'audio' | 'texto';

export interface Memoria {
  id: string;
  criancaId: string;
  /** IDs de outras crianças (irmãos) nas quais esta memória também deve aparecer. */
  criancaIdsCompartilhado?: string[];
  titulo: string;
  descricao?: string;
  data: string; // ISO date
  tipoMidia: TipoMidiaMemoria;
  midiaUri?: string;
  duracaoMs?: number; // duração de um áudio, em ms
  trimStartMs?: number; // ponto de início do trecho escolhido de um vídeo
  trimEndMs?: number; // ponto de fim do trecho escolhido de um vídeo
}

export type PlanoAssinatura = 'gratuito' | 'premium';
