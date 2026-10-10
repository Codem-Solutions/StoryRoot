import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing, typography } from '../theme';

const CAMADA_FIGURAS = require('../../../assets/images/logo-sem-coracao.png');
const CAMADA_CORACAO = require('../../../assets/images/logo-coracao.png');

/** Centro do coração dentro da imagem (calculado ao gerar as camadas). */
const ORIGEM_CORACAO = '69.2% 22.7%';

/**
 * A logo oficial animada, em camadas: as figuras surgem e "respiram", e o
 * coração aparece com um pulo e segue batendo. Com "reduzir movimento"
 * ativado no aparelho, a logo fica parada.
 */
export function LogoAnimada({ tamanho = 120 }: { tamanho?: number }) {
  const reduzirMovimento = useReducedMotion();
  const entrada = useSharedValue(reduzirMovimento ? 1 : 0);
  const respiracao = useSharedValue(1);
  const coracao = useSharedValue(reduzirMovimento ? 1 : 0);
  const flutuacao = useSharedValue(0);

  useEffect(() => {
    if (reduzirMovimento) return;
    entrada.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.back(1.4)) });
    respiracao.value = withDelay(
      650,
      withRepeat(
        withSequence(
          withTiming(1.025, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
    // Pulo de entrada, depois batimento "tum-tum" com pausa.
    coracao.value = withDelay(
      450,
      withSequence(
        withSpring(1, { damping: 7, stiffness: 180 }),
        withRepeat(
          withSequence(
            withTiming(1.18, { duration: 140, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: 140, easing: Easing.in(Easing.quad) }),
            withTiming(1.12, { duration: 130, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: 170, easing: Easing.in(Easing.quad) }),
            withTiming(1, { duration: 900 }),
          ),
          -1,
        ),
      ),
    );
    flutuacao.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(-tamanho * 0.025, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [reduzirMovimento, entrada, respiracao, coracao, flutuacao, tamanho]);

  const estiloFiguras = useAnimatedStyle(() => ({
    opacity: entrada.value,
    transform: [{ scale: (0.85 + 0.15 * entrada.value) * respiracao.value }],
  }));

  const estiloFlutuacao = useAnimatedStyle(() => ({
    transform: [{ translateY: flutuacao.value }],
  }));

  const estiloCoracao = useAnimatedStyle(() => ({
    opacity: Math.min(1, coracao.value * 1.5),
    transform: [{ scale: coracao.value }],
  }));

  const dimensao = { width: tamanho, height: tamanho };

  return (
    <View style={dimensao} accessibilityRole="image" accessibilityLabel="Logo Story Root">
      <Animated.View style={[styles.camada, dimensao, estiloFiguras]}>
        <Image source={CAMADA_FIGURAS} style={dimensao} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={[styles.camada, dimensao, estiloFlutuacao]}>
        <Animated.View style={[dimensao, { transformOrigin: ORIGEM_CORACAO }, estiloCoracao]}>
          <Image source={CAMADA_CORACAO} style={dimensao} resizeMode="contain" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/**
 * Indicador de carregamento da marca, para listas e componentes que ainda
 * estão buscando dados.
 */
export function CarregandoLogo({
  tamanho = 56,
  mensagem = 'Carregando…',
}: {
  tamanho?: number;
  mensagem?: string | null;
}) {
  return (
    <View
      style={styles.carregando}
      accessibilityRole="progressbar"
      accessibilityLabel={mensagem ?? 'Carregando'}>
      <LogoAnimada tamanho={tamanho} />
      {!!mensagem && <Text style={styles.mensagem}>{mensagem}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  camada: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  carregando: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  mensagem: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
