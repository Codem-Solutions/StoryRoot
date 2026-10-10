import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';

interface StoryRootLogoProps {
  size?: number;
  /** 'mark' = traço colorido para fundos claros. 'markOnPrimary' = traço claro para uso sobre o verde primário. */
  variant?: 'mark' | 'markOnPrimary';
}

export function StoryRootLogo({ size = 40, variant = 'mark' }: StoryRootLogoProps) {
  const onPrimary = variant === 'markOnPrimary';
  const strokeAdulto = onPrimary ? 'rgba(255,255,255,0.95)' : colors.primary;
  const strokeCrianca = onPrimary ? 'rgba(255,255,255,0.85)' : colors.primary;
  const strokeLivro = onPrimary ? 'rgba(255,255,255,0.7)' : colors.primaryDark;
  const heartFill = onPrimary ? '#ffd7c2' : colors.accent;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* livro aberto */}
      <Path
        d="M12 78 C 28 68, 42 68, 50 76 C 58 68, 72 68, 88 78"
        stroke={strokeLivro}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M50 76 L50 82"
        stroke={strokeLivro}
        strokeWidth={4}
        strokeLinecap="round"
      />

      {/* figura adulto: cabeça + curva do corpo formando metade esquerda do coração */}
      <Circle cx="38" cy="26" r="10" stroke={strokeAdulto} strokeWidth={4.5} />
      <Path
        d="M38 36 C 20 44, 20 60, 46 70"
        stroke={strokeAdulto}
        strokeWidth={4.5}
        strokeLinecap="round"
        fill="none"
      />

      {/* figura criança: cabeça menor + curva respondendo, formando metade direita do coração */}
      <Circle cx="60" cy="46" r="6.5" stroke={strokeCrianca} strokeWidth={4} />
      <Path
        d="M60 53 C 72 58, 70 65, 46 70"
        stroke={strokeCrianca}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />

      {/* coração de destaque */}
      <Path
        d="M58 24 C 58 21, 62 20, 63.5 22.5 C 65 20, 69 21, 69 24 C 69 27.5, 63.5 31, 63.5 31 C 63.5 31, 58 27.5, 58 24 Z"
        fill={heartFill}
      />
    </Svg>
  );
}

/** Wrapper compatível com a prop `icon: LucideIcon` do `EmptyState`. */
export function StoryRootLogoIcon({ size, color }: { size?: number; color?: string }) {
  return (
    <StoryRootLogo size={size} variant={color === '#fff' ? 'markOnPrimary' : 'mark'} />
  );
}
