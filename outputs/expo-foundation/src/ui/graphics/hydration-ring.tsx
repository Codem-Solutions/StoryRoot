import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import {
  Easing,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { colors, typography } from '@/theme/tokens';

type Props = {
  progress: number;
  current?: number;
  goal?: number;
  size?: number;
};

export function HydrationRing({
  progress,
  current = 1750,
  goal = 2500,
  size = 150,
}: Props) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const center = size / 2;
  const animatedProgress = useSharedValue(0);
  const ring = useMemo(() => {
    const path = Skia.Path.Make();
    path.addCircle(center, center, radius);
    return path;
  }, [center, radius]);

  useEffect(() => {
    animatedProgress.value = withDelay(
      180,
      withTiming(Math.min(Math.max(progress, 0), 1), {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [animatedProgress, progress]);

  return (
    <View
      accessibilityLabel={`${current} de ${goal} mililitros consumidos`}
      accessibilityRole="progressbar"
      style={[styles.container, { width: size, height: size }]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group transform={[{ rotate: -Math.PI / 2 }]} origin={vec(center, center)}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            color="rgba(255,255,255,0.14)"
            style="stroke"
            strokeWidth={stroke}
          />
          <Path
            path={ring}
            color="#8BE4FF"
            end={animatedProgress}
            strokeCap="round"
            strokeWidth={stroke}
            style="stroke">
            <LinearGradient
              colors={['#B8F4FF', '#39BFE8', '#087DAA']}
              end={vec(size, size)}
              start={vec(0, 0)}
            />
          </Path>
        </Group>
        <Circle
          cx={center}
          cy={center}
          r={radius - 18}
          color="rgba(255,255,255,0.06)">
          <LinearGradient
            colors={['rgba(184,244,255,0.18)', 'rgba(0,91,128,0.04)']}
            end={vec(size, size)}
            start={vec(0, 0)}
          />
        </Circle>
      </Canvas>
      <View pointerEvents="none" style={styles.copy}>
        <Text style={styles.value}>{Math.round(progress * 100)}%</Text>
        <Text style={styles.label}>DA META</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  copy: { alignItems: 'center', justifyContent: 'center' },
  value: {
    color: colors.white,
    fontFamily: typography.display,
    fontSize: 32,
    letterSpacing: -1,
  },
  label: {
    color: '#A9C8D4',
    fontFamily: typography.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
});
