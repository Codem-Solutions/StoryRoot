import { addDays, addMonths, isBefore, startOfDay } from 'date-fns';
import {
  CALENDARIO_VACINAL,
  rotuloIdadeVacina,
  type VacinaCalendario,
} from '../constants/calendarioVacinal';
import { idRegistroCalendario } from '../store/vacinasStore';
import { colors } from '../theme/colors';
import type { Crianca, RegistroVacina } from '../types';

/** Janela em que uma vacina pendente aparece como "próxima". */
const DIAS_PROXIMA = 30;

export type StatusVacina = 'aplicada' | 'atrasada' | 'proxima' | 'agendada';

export const META_STATUS_VACINA: Record<StatusVacina, { label: string; cor: string }> = {
  aplicada: { label: 'Aplicada', cor: colors.green },
  atrasada: { label: 'Atrasada', cor: colors.red },
  proxima: { label: 'Próxima', cor: colors.amber },
  agendada: { label: 'Agendada', cor: colors.blue },
};

export interface ItemCaderneta {
  /** Id do registro (existente ou o que será criado ao salvar). */
  id: string;
  vacina?: VacinaCalendario;
  nome: string;
  dose: string;
  protegeContra?: string;
  /** Título do grupo, como na caderneta de papel: "Ao nascer", "2 meses"... */
  grupo: string;
  ordemGrupo: number;
  dataPrevista: string;
  /** Data que vale no calendário: aplicação, se houver; senão, a prevista. */
  dataReferencia: string;
  status: StatusVacina;
  registro?: RegistroVacina;
}

export const GRUPO_EXTRAS = 'Outras vacinas';

export function statusVacina(
  aplicada: boolean,
  dataPrevista: string,
  hoje = new Date(),
): StatusVacina {
  if (aplicada) return 'aplicada';
  const prevista = new Date(dataPrevista);
  const inicioHoje = startOfDay(hoje);
  if (isBefore(prevista, inicioHoje)) return 'atrasada';
  if (isBefore(prevista, addDays(inicioHoje, DIAS_PROXIMA))) return 'proxima';
  return 'agendada';
}

export function dataPrevistaCalendario(crianca: Crianca, vacina: VacinaCalendario): string {
  return addMonths(new Date(crianca.dataNascimento), vacina.idadeMeses).toISOString();
}

function criarItem(
  registro: RegistroVacina | undefined,
  base: Omit<ItemCaderneta, 'status' | 'registro' | 'dataReferencia'>,
  hoje: Date,
): ItemCaderneta {
  const aplicada = !!registro?.aplicada;
  return {
    ...base,
    registro,
    status: statusVacina(aplicada, base.dataPrevista, hoje),
    dataReferencia: aplicada && registro?.dataAplicacao ? registro.dataAplicacao : base.dataPrevista,
  };
}

/** Junta o calendário oficial com o que foi registrado para a criança. */
export function montarCaderneta(
  crianca: Crianca,
  registros: RegistroVacina[],
  hoje = new Date(),
): ItemCaderneta[] {
  const daCrianca = registros.filter(r => r.criancaId === crianca.id);
  const porId = new Map(daCrianca.map(r => [r.id, r]));

  const oficiais = CALENDARIO_VACINAL.map(vacina => {
    const id = idRegistroCalendario(crianca.id, vacina.id);
    const registro = porId.get(id);
    return criarItem(
      registro,
      {
        id,
        vacina,
        nome: vacina.nome,
        dose: vacina.dose,
        protegeContra: vacina.protegeContra,
        grupo: rotuloIdadeVacina(vacina.idadeMeses),
        ordemGrupo: vacina.idadeMeses,
        dataPrevista: registro?.dataPrevista ?? dataPrevistaCalendario(crianca, vacina),
      },
      hoje,
    );
  });

  const extras = daCrianca
    .filter(r => !r.vacinaId)
    .map(registro =>
      criarItem(
        registro,
        {
          id: registro.id,
          nome: registro.nome || 'Vacina',
          dose: registro.dose || '',
          grupo: GRUPO_EXTRAS,
          ordemGrupo: Number.MAX_SAFE_INTEGER,
          dataPrevista: registro.dataPrevista ?? registro.dataAplicacao ?? registro.atualizadoEm,
        },
        hoje,
      ),
    )
    .sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista));

  return [...oficiais, ...extras];
}

export function agruparPorIdade(itens: ItemCaderneta[]) {
  const grupos = new Map<string, ItemCaderneta[]>();
  for (const item of [...itens].sort((a, b) => a.ordemGrupo - b.ordemGrupo)) {
    grupos.set(item.grupo, [...(grupos.get(item.grupo) ?? []), item]);
  }
  return Array.from(grupos, ([titulo, lista]) => ({ titulo, itens: lista }));
}

/** Registro novo (em branco) para um item da caderneta que ainda não tem registro. */
export function registroBase(item: ItemCaderneta, criancaId: string): RegistroVacina {
  return (
    item.registro ?? {
      id: item.id,
      criancaId,
      vacinaId: item.vacina?.id,
      aplicada: false,
      reacoes: [],
      acompanhamentos: [],
      atualizadoEm: new Date().toISOString(),
    }
  );
}
