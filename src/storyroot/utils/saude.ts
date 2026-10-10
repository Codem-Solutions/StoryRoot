import { rotulosSintomas } from '../constants/sintomas';
import { colors } from '../theme/colors';
import type { Registro, SaudeDados, StatusSaude } from '../types';
import { agendarAcompanhamentoSaude, cancelarLembretes } from './notifications';

export const STATUS_SAUDE: { status: StatusSaude; label: string; cor: string }[] = [
  { status: 'inicio', label: 'Início', cor: colors.red },
  { status: 'evolucao', label: 'Evolução', cor: colors.amber },
  { status: 'melhora', label: 'Melhora', cor: colors.green },
  { status: 'fim_sintomas', label: 'Fim dos sintomas', cor: colors.primary },
  { status: 'finalizado', label: 'Registro finalizado', cor: colors.textMuted },
];

export function metaStatusSaude(status: StatusSaude | undefined) {
  return STATUS_SAUDE.find(s => s.status === status) ?? STATUS_SAUDE[0];
}

/** Enquanto o quadro está em acompanhamento, o app lembra de atualizar a cada 8 horas. */
export function statusEmAcompanhamento(status: StatusSaude | undefined): boolean {
  return status !== 'fim_sintomas' && status !== 'finalizado';
}

/** Lê `dados` de um registro de saúde, tolerando registros antigos (só texto). */
export function dadosSaude(registro: Registro): SaudeDados {
  const dados = (registro.dados ?? {}) as Partial<SaudeDados>;
  const historico = dados.statusHistorico ?? [];
  return {
    sintomas: dados.sintomas ?? [],
    sintomaOutro: dados.sintomaOutro,
    dataInicio: dados.dataInicio ?? registro.data,
    medicacao: dados.medicacao,
    fotos: dados.fotos ?? [],
    status: dados.status ?? historico[historico.length - 1]?.status ?? 'finalizado',
    statusHistorico: historico,
    detalhes: dados.detalhes,
  };
}

export function resumoSintomas(dados: Pick<SaudeDados, 'sintomas' | 'sintomaOutro' | 'detalhes'>) {
  const rotulos = rotulosSintomas(dados.sintomas, dados.sintomaOutro);
  return rotulos.length ? rotulos.join(', ') : dados.detalhes || 'Registro de saúde';
}

/**
 * Cancela os lembretes anteriores do registro e, se o quadro ainda está em
 * acompanhamento, agenda o lembrete de 8 em 8 horas a partir de agora.
 * Retorna os novos ids de notificação (vazio quando não há lembrete).
 */
export async function sincronizarLembretesSaude(
  registroId: string,
  dados: SaudeDados,
  nomeCrianca: string,
  idsAnteriores?: string[],
): Promise<string[]> {
  await cancelarLembretes(idsAnteriores);
  if (!statusEmAcompanhamento(dados.status)) return [];
  return agendarAcompanhamentoSaude(registroId, nomeCrianca, resumoSintomas(dados)).catch(() => []);
}
