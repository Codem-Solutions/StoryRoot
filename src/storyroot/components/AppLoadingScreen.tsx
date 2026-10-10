import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, spacing, typography } from '../theme';
import { LogoAnimada } from './LogoAnimada';

/**
 * Tela de carregamento logo após o splash nativo: mesmo fundo creme e a logo
 * oficial animada, para a passagem splash → app ser contínua.
 */
export function AppLoadingScreen() {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel="Carregando o Story Root">
      <LogoAnimada tamanho={160} />
      <Animated.View entering={FadeIn.delay(500).duration(600)} style={styles.textos}>
        <Text style={styles.appName}>Story Root</Text>
        <Text style={styles.slogan}>A história da sua família</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    backgroundColor: colors.background,
  },
  textos: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  appName: {
    ...typography.h2,
    color: colors.primaryDark,
  },
  slogan: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
