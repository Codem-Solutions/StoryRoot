import { useMemo, type PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';

import { useTheme } from '@/theme/theme-provider';
import type { ColorPalette } from '@/theme/tokens';

type Props = PropsWithChildren<{
  style?: ViewStyle;
  interactive?: boolean;
  tintColor?: string;
}>;

export function PremiumSurface({
  children,
  style,
  interactive = false,
  tintColor,
}: Props) {
  const { colors, resolved } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const canUseLiquidGlass =
    Platform.OS === 'ios' &&
    isGlassEffectAPIAvailable() &&
    isLiquidGlassAvailable();

  if (canUseLiquidGlass) {
    return (
      <GlassView
        glassEffectStyle="regular"
        isInteractive={interactive}
        style={[styles.base, style]}
        tintColor={
          tintColor ??
          (resolved === 'dark'
            ? 'rgba(114, 201, 150, 0.16)'
            : 'rgba(20, 64, 44, 0.22)')
        }>
        {children}
      </GlassView>
    );
  }

  return <View style={[styles.base, styles.fallback, style]}>{children}</View>;
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
  base: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 34,
    elevation: 8,
  },
  });
}
