import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Memoria, TipoMidiaMemoria } from '../types';

export type FiltroTipoMidia = 'todos' | TipoMidiaMemoria;

export const ROTULOS_TIPO_MIDIA: Record<TipoMidiaMemoria, string> = {
  foto: 'Foto',
  video: 'Vídeo',
  audio: 'Áudio',
  texto: 'Momento especial',
};

/** Palavras extras para o tipo, para a busca entender "imagem", "gravação", "filme"... */
const SINONIMOS_TIPO: Record<TipoMidiaMemoria, string> = {
  foto: 'foto fotos imagem fotografia',
  video: 'video videos filme filmagem',
  audio: 'audio audios gravacao voz som fala',
  texto: 'texto nota momento',
};

/** Minúsculas e sem acentos: "Vídeo" e "video" são a mesma coisa na busca. */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Todo o texto pelo qual uma memória pode ser encontrada. */
function textoBuscavel(memoria: Memoria): string {
  const data = new Date(memoria.data);
  return normalizarBusca(
    [
      memoria.titulo,
      memoria.descricao,
      SINONIMOS_TIPO[memoria.tipoMidia],
      format(data, 'dd/MM/yyyy'),
      format(data, 'd/M/yyyy'),
      format(data, "MMMM 'de' yyyy", { locale: ptBR }),
      format(data, 'EEEE', { locale: ptBR }),
    ]
      .filter(Boolean)
      .join(' '),
  );
}

export interface MemoriaIndexada {
  memoria: Memoria;
  texto: string;
}

/** Pré-calcula o texto de busca de cada memória (uma vez por lista, não a cada tecla). */
export function indexarMemorias(memorias: Memoria[]): MemoriaIndexada[] {
  return memorias.map(memoria => ({ memoria, texto: textoBuscavel(memoria) }));
}

export interface CriteriosBusca {
  texto: string;
  tipo: FiltroTipoMidia;
  ano: number | null;
}

/** Cada palavra digitada precisa aparecer em algum lugar da memória. */
export function filtrarMemorias(indice: MemoriaIndexada[], criterios: CriteriosBusca): Memoria[] {
  const termos = normalizarBusca(criterios.texto).split(/\s+/).filter(Boolean);
  return indice
    .filter(({ memoria, texto }) => {
      if (criterios.tipo !== 'todos' && memoria.tipoMidia !== criterios.tipo) return false;
      if (criterios.ano !== null && new Date(memoria.data).getFullYear() !== criterios.ano) {
        return false;
      }
      return termos.every(termo => texto.includes(termo));
    })
    .map(({ memoria }) => memoria);
}

export function anosDasMemorias(memorias: Memoria[]): number[] {
  return Array.from(new Set(memorias.map(m => new Date(m.data).getFullYear()))).sort((a, b) => b - a);
}

/** "Outubro de 2026" — título dos grupos mensais da linha do tempo. */
export function rotuloMes(dataIso: string): string {
  const texto = format(new Date(dataIso), "MMMM 'de' yyyy", { locale: ptBR });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
