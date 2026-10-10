/**
 * Calendário Nacional de Vacinação da criança (PNI / Ministério da Saúde),
 * na ordem em que aparece na Caderneta da Criança. As datas previstas são
 * calculadas a partir do nascimento; o esquema pode variar por estado, campanha
 * ou indicação médica — por isso o app deixa reagendar cada dose.
 */
export interface VacinaCalendario {
  id: string;
  nome: string;
  dose: string;
  /** Idade recomendada, em meses (0 = ao nascer). */
  idadeMeses: number;
  protegeContra: string;
  nota?: string;
}

export const CALENDARIO_VACINAL: VacinaCalendario[] = [
  // Ao nascer
  { id: 'bcg', nome: 'BCG', dose: 'Dose única', idadeMeses: 0, protegeContra: 'Formas graves de tuberculose' },
  { id: 'hepb', nome: 'Hepatite B', dose: 'Dose ao nascer', idadeMeses: 0, protegeContra: 'Hepatite B', nota: 'De preferência nas primeiras 24 horas de vida.' },

  // 2 meses
  { id: 'penta-1', nome: 'Pentavalente', dose: '1ª dose', idadeMeses: 2, protegeContra: 'Difteria, tétano, coqueluche, Haemophilus influenzae b e hepatite B' },
  { id: 'vip-1', nome: 'VIP (Poliomielite inativada)', dose: '1ª dose', idadeMeses: 2, protegeContra: 'Poliomielite (paralisia infantil)' },
  { id: 'pneumo-1', nome: 'Pneumocócica 10-valente', dose: '1ª dose', idadeMeses: 2, protegeContra: 'Pneumonia, meningite e otite por pneumococo' },
  { id: 'rota-1', nome: 'Rotavírus humano', dose: '1ª dose', idadeMeses: 2, protegeContra: 'Diarreia grave por rotavírus' },

  // 3 meses
  { id: 'menc-1', nome: 'Meningocócica C', dose: '1ª dose', idadeMeses: 3, protegeContra: 'Meningite e infecções pelo meningococo C' },

  // 4 meses
  { id: 'penta-2', nome: 'Pentavalente', dose: '2ª dose', idadeMeses: 4, protegeContra: 'Difteria, tétano, coqueluche, Haemophilus influenzae b e hepatite B' },
  { id: 'vip-2', nome: 'VIP (Poliomielite inativada)', dose: '2ª dose', idadeMeses: 4, protegeContra: 'Poliomielite (paralisia infantil)' },
  { id: 'pneumo-2', nome: 'Pneumocócica 10-valente', dose: '2ª dose', idadeMeses: 4, protegeContra: 'Pneumonia, meningite e otite por pneumococo' },
  { id: 'rota-2', nome: 'Rotavírus humano', dose: '2ª dose', idadeMeses: 4, protegeContra: 'Diarreia grave por rotavírus' },

  // 5 meses
  { id: 'menc-2', nome: 'Meningocócica C', dose: '2ª dose', idadeMeses: 5, protegeContra: 'Meningite e infecções pelo meningococo C' },

  // 6 meses
  { id: 'penta-3', nome: 'Pentavalente', dose: '3ª dose', idadeMeses: 6, protegeContra: 'Difteria, tétano, coqueluche, Haemophilus influenzae b e hepatite B' },
  { id: 'vip-3', nome: 'VIP (Poliomielite inativada)', dose: '3ª dose', idadeMeses: 6, protegeContra: 'Poliomielite (paralisia infantil)' },
  { id: 'covid-1', nome: 'Covid-19', dose: '1ª dose', idadeMeses: 6, protegeContra: 'Formas graves de Covid-19', nota: 'O número de doses depende do imunizante disponível no posto.' },
  { id: 'influenza-1', nome: 'Influenza (gripe)', dose: '1ª dose', idadeMeses: 6, protegeContra: 'Gripe e suas complicações', nota: 'Depois do esquema inicial, uma dose por ano até os 5 anos.' },

  // 7 meses
  { id: 'covid-2', nome: 'Covid-19', dose: '2ª dose', idadeMeses: 7, protegeContra: 'Formas graves de Covid-19' },
  { id: 'influenza-2', nome: 'Influenza (gripe)', dose: '2ª dose', idadeMeses: 7, protegeContra: 'Gripe e suas complicações', nota: '30 dias após a 1ª dose.' },

  // 9 meses
  { id: 'covid-3', nome: 'Covid-19', dose: '3ª dose', idadeMeses: 9, protegeContra: 'Formas graves de Covid-19', nota: 'Apenas para o imunizante de 3 doses.' },
  { id: 'fa-1', nome: 'Febre amarela', dose: 'Dose inicial', idadeMeses: 9, protegeContra: 'Febre amarela' },

  // 12 meses
  { id: 'pneumo-ref', nome: 'Pneumocócica 10-valente', dose: 'Reforço', idadeMeses: 12, protegeContra: 'Pneumonia, meningite e otite por pneumococo' },
  { id: 'menin-ref', nome: 'Meningocócica', dose: 'Reforço', idadeMeses: 12, protegeContra: 'Meningite meningocócica', nota: 'Meningocócica C ou ACWY, conforme o esquema vigente no posto.' },
  { id: 'scr-1', nome: 'Tríplice viral (SCR)', dose: '1ª dose', idadeMeses: 12, protegeContra: 'Sarampo, caxumba e rubéola' },

  // 15 meses
  { id: 'dtp-ref1', nome: 'DTP (Tríplice bacteriana)', dose: '1º reforço', idadeMeses: 15, protegeContra: 'Difteria, tétano e coqueluche' },
  { id: 'vip-ref', nome: 'VIP (Poliomielite inativada)', dose: 'Reforço', idadeMeses: 15, protegeContra: 'Poliomielite (paralisia infantil)' },
  { id: 'hepa', nome: 'Hepatite A', dose: 'Dose única', idadeMeses: 15, protegeContra: 'Hepatite A' },
  { id: 'tetraviral', nome: 'Tetra viral (SCRV)', dose: 'Dose única', idadeMeses: 15, protegeContra: 'Sarampo, caxumba, rubéola e varicela', nota: 'Pode ser substituída por Tríplice viral (2ª dose) + Varicela.' },

  // 4 anos
  { id: 'dtp-ref2', nome: 'DTP (Tríplice bacteriana)', dose: '2º reforço', idadeMeses: 48, protegeContra: 'Difteria, tétano e coqueluche' },
  { id: 'fa-ref', nome: 'Febre amarela', dose: 'Reforço', idadeMeses: 48, protegeContra: 'Febre amarela' },
  { id: 'varicela-2', nome: 'Varicela', dose: '2ª dose', idadeMeses: 48, protegeContra: 'Catapora (varicela)' },

  // 9 anos
  { id: 'hpv', nome: 'HPV', dose: 'Dose única', idadeMeses: 108, protegeContra: 'HPV e cânceres associados', nota: 'Para meninas e meninos de 9 a 14 anos.' },

  // 11 anos
  { id: 'acwy', nome: 'Meningocócica ACWY', dose: 'Dose única', idadeMeses: 132, protegeContra: 'Meningite pelos meningococos A, C, W e Y', nota: 'Para adolescentes de 11 a 14 anos.' },
];

export function rotuloIdadeVacina(idadeMeses: number): string {
  if (idadeMeses === 0) return 'Ao nascer';
  if (idadeMeses < 24) return `${idadeMeses} ${idadeMeses === 1 ? 'mês' : 'meses'}`;
  const anos = Math.floor(idadeMeses / 12);
  return `${anos} anos`;
}

/** Reações mais comuns após a vacinação, para registrar com um toque. */
export const REACOES_VACINA = [
  'Nenhuma reação',
  'Febre',
  'Dor no local',
  'Vermelhidão no local',
  'Inchaço no local',
  'Caroço no local',
  'Irritabilidade',
  'Choro persistente',
  'Sonolência',
  'Perda de apetite',
  'Vômito',
  'Diarreia',
  'Manchas na pele',
];
