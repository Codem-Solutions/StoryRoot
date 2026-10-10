import React from 'react';
import { Image } from 'react-native';

/** Logo oficial (gerada a partir de assets/logo_imagem_app.png, recortada sem margens). */
export const LOGO_OFICIAL = require('../../../assets/images/logo.png');

export function StoryRootLogo({ size = 40 }: { size?: number }) {
  return (
    <Image
      source={LOGO_OFICIAL}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Logo Story Root"
    />
  );
}

/** Wrapper compatível com a prop `icon: LucideIcon` do `EmptyState`. */
export function StoryRootLogoIcon({ size }: { size?: number; color?: string }) {
  return <StoryRootLogo size={size} />;
}
