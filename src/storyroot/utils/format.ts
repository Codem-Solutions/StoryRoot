import { format } from 'date-fns';
import { useAlimentosStore } from '../store/alimentosStore';
import type { ComidaDados, TipoRegistro } from '../types';
import { rotuloTipoRefeicao } from './alimentacao';

export function formatarHora(iso: string): string {
  return format(new Date(iso), 'HH:mm');
}

export function formatarDataBR(iso: string): string {
  return format(new Date(iso), 'dd/MM/yyyy');
}

/** Calcula duração de sono em horas (suporta virada de dia). */
export function duracaoSonoHoras(horaInicio?: string, horaFim?: string): number {
  if (!horaInicio || !horaFim) return 0;
  const inicio = new Date(horaInicio).getTime();
  let fim = new Date(horaFim).getTime();
  if (Number.isNaN(inicio) || Number.isNaN(fim)) return 0;
  if (fim <= inicio) {
    fim += 24 * 60 * 60 * 1000;
  }
  return Math.max(0, (fim - inicio) / (1000 * 60 * 60));
}

function formatarDuracaoHoras(valorHoras: number): string {
  const minutos = Math.round(valorHoras * 60);
  const horasInteiras = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  if (horasInteiras === 0) return `${minutosRestantes}min`;
  if (minutosRestantes === 0) return `${horasInteiras}h`;
  return `${horasInteiras}h${String(minutosRestantes).padStart(2, '0')}`;
}

/** Remove zeros decimais desnecessários (6.200 → 6.2, 58.0 → 58). */
function formatarNumeroLimpo(valor: number): string {
  return String(Number(valor.toFixed(3)));
}

/** Combina os campos `alturaM`/`alturaCm` do formulário de Medidas num total em cm. */
export function alturaTotalCm(formData: any): number {
  return (Number(formData.alturaM) || 0) * 100 + (Number(formData.alturaCm) || 0);
}

/** Combina os campos `pesoKg`/`pesoG` do formulário de Medidas num total em kg. */
export function pesoTotalKg(formData: any): number {
  return (Number(formData.pesoKg) || 0) + (Number(formData.pesoG) || 0) / 1000;
}

export function formatarValorRegistro(tipo: TipoRegistro, formData: any): string {
  switch (tipo) {
    case 'sono': {
      const partes: string[] = [];
      if (formData.periodo) partes.push(formData.periodo);
      if (formData.horaInicio) partes.push(formatarHora(formData.horaInicio));
      if (formData.horaFim) partes.push(formatarHora(formData.horaFim));
      const janelaSono = partes.filter((_, index) => index > (formData.periodo ? 0 : -1));
      const linhaHorario = janelaSono.join(' → ');
      const duracao = duracaoSonoHoras(formData.horaInicio, formData.horaFim);
      const extras: string[] = [];
      if (linhaHorario) extras.push(linhaHorario);
      if (duracao > 0) extras.push(formatarDuracaoHoras(duracao));
      if (formData.periodo) {
        return [formData.periodo, extras.join(' · ')].filter(Boolean).join(' · ');
      }
      return extras.join(' · ');
    }
    case 'comida': {
      const dados = formData as ComidaDados;
      const partes: string[] = [];
      if (dados.tipoRefeicao) partes.push(rotuloTipoRefeicao(dados.tipoRefeicao));
      const itens = dados.itens ?? [];
      if (itens.length) {
        const alimentos = useAlimentosStore.getState().alimentos;
        const nomes = itens
          .slice(0, 3)
          .map(item => alimentos.find(a => a.id === item.alimentoId)?.nomeExibicao ?? item.alimentoId);
        const resto = itens.length > 3 ? ` +${itens.length - 3}` : '';
        partes.push(`${nomes.join(', ')}${resto}`);
      }
      return partes.join(' · ');
    }
    case 'mamadeira': {
      const partes: string[] = [];
      if (formData.tipoLeite === 'materno_ordenhado') partes.push('Leite materno ordenhado');
      else if (formData.tipoLeite === 'formula') partes.push('Fórmula');
      else if (formData.tipoLeite === 'outro') partes.push('Outro leite');
      if (formData.volumeConsumidoMl) partes.push(`${formData.volumeConsumidoMl}ml`);
      else if (formData.volumeOferecidoMl) partes.push(`${formData.volumeOferecidoMl}ml`);
      return partes.join(' · ');
    }
    case 'amamentacao': {
      const partes: string[] = [];
      if (formData.periodo) partes.push(formData.periodo);
      if (formData.intensidade) partes.push(`Intensidade: ${formData.intensidade}`);
      if (formData.detalhes) partes.push(formData.detalhes);
      return partes.join(' · ');
    }
    case 'remedio': {
      const partes: string[] = [];
      if (formData.nome) partes.push(formData.nome);
      if (formData.formaAdministracao) partes.push(formData.formaAdministracao);
      if (formData.dosagem) partes.push(formData.dosagem);
      const horarios = (formData.horarios || []).filter(Boolean).map(formatarHora);
      const linha = [partes.join(' ')].filter(Boolean);
      if (horarios.length) linha.push(horarios.join(', '));
      linha.push(formData.recorrencia === 'recorrente' ? 'Lembrete ativo' : 'Dose única');
      return linha.join(' · ');
    }
    case 'fralda': {
      const partes: string[] = [];
      if (formData.tipoFralda) partes.push(formData.tipoFralda);
      if (formData.horario) partes.push(formatarHora(formData.horario));
      if (formData.detalhes) partes.push(formData.detalhes);
      return partes.join(' · ');
    }
    case 'medidas': {
      const partes: string[] = [];
      const altura = alturaTotalCm(formData);
      if (altura) partes.push(`Altura: ${formatarNumeroLimpo(altura)}cm`);
      const peso = pesoTotalKg(formData);
      if (peso) partes.push(`Peso: ${formatarNumeroLimpo(peso)}kg`);
      if (formData.pc) partes.push(`PC: ${formData.pc}cm`);
      return partes.join(' · ');
    }
    default:
      return formData.detalhes || '';
  }
}

/**
 * Records saved before formatarValorRegistro existed have `valor` set to a raw
 * JSON.stringify dump (e.g. {"horarios":[...]}). Detect that shape and re-render
 * it through the proper formatter so old data displays correctly too.
 */
export function formatarValorExibicao(tipo: TipoRegistro, valor?: string): string {
  if (!valor) return '';
  const pareceJson = valor.trim().startsWith('{');
  if (!pareceJson) return valor;
  try {
    const dados = JSON.parse(valor);
    return formatarValorRegistro(tipo, dados) || valor;
  } catch {
    return valor;
  }
}
