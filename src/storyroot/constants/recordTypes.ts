import {
  Baby,
  Droplet,
  Ellipsis,
  LucideIcon,
  Milk,
  Moon,
  Pill,
  Ruler,
  Syringe,
  ThermometerSun,
  Utensils,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import type { TipoRegistro } from '../types';

interface RecordTypeMeta {
  label: string;
  icon: LucideIcon;
  color: string;
  placeholder: string;
}

/** Tipos que aparecem na aba "Rotina" (alimentação, fraldas, amamentação, sono). */
export const TIPOS_ROTINA: TipoRegistro[] = ['sono', 'amamentacao', 'mamadeira', 'comida', 'fralda'];

/** Tipos que aparecem na tela "Saúde" (remédios, medidas, vacina e notas gerais). */
export const TIPOS_SAUDE: TipoRegistro[] = ['remedio', 'medidas', 'vacina', 'saude'];

export const RECORD_TYPES: Record<TipoRegistro, RecordTypeMeta> = {
  sono: {
    label: 'Sono',
    icon: Moon,
    color: colors.primary,
    placeholder: 'Ex: dormiu das 20h às 6h30',
  },
  amamentacao: {
    label: 'Amamentação',
    icon: Baby,
    color: colors.accent,
    placeholder: 'Ex: 120ml de fórmula',
  },
  mamadeira: {
    label: 'Mamadeira',
    icon: Milk,
    color: colors.indigo,
    placeholder: 'Ex: 120ml de fórmula',
  },
  comida: {
    label: 'Alimentação',
    icon: Utensils,
    color: colors.tan,
    placeholder: 'Ex: arroz, feijão, frango e cenoura',
  },
  fralda: {
    label: 'Fralda',
    icon: Droplet,
    color: colors.blue,
    placeholder: 'Ex: troca às 14h, xixi',
  },
  saude: {
    label: 'Registro Saúde',
    icon: ThermometerSun,
    color: colors.red,
    placeholder: 'Ex: febre 37.8°C',
  },
  medidas: {
    label: 'Medidas',
    icon: Ruler,
    color: colors.green,
    placeholder: 'Ex: 6.2kg, 58cm',
  },
  remedio: {
    label: 'Remédio',
    icon: Pill,
    color: colors.violet,
    placeholder: 'Ex: Paracetamol 5ml',
  },
  vacina: {
    label: 'Caderneta',
    icon: Syringe,
    color: colors.blue,
    placeholder: 'Ex: Pentavalente aplicada em 20/08',
  },
  /** Mantido apenas para exibição de registros legados. */
  outros: {
    label: 'Outros',
    icon: Ellipsis,
    color: colors.textMuted,
    placeholder: 'Descreva o que aconteceu',
  },
};
