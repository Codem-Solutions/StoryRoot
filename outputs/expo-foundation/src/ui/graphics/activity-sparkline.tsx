import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
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

type Props = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
};

export function ActivitySparkline({
  data,
  width = 170,
  height = 64,
  color = '#D6FF4B',
}: Props) {
  const reveal = useSharedValue(0);
  const safeData = data.length > 1 ? data : [0, 0];
  const max = Math.max(...safeData);
  const min = Math.min(...safeData);
  const range = Math.max(max - min, 1);

  const points = safeData.map((value, index) => ({
    x: (index / (safeData.length - 1)) * width,
    y: height - 8 - ((value - min) / range) * (height - 16),
  }));

  const path = useMemo(() => {
    const next = Skia.Path.Make();
    const first = points[0];
    if (!first) return next;
    next.moveTo(first.x, first.y);
    for (let index = 1; index < points.length; index += 1) {
      const current = points[index];
      const previous = points[index - 1];
      if (!current || !previous) continue;
      const midpoint = (previous.x + current.x) / 2;
      next.cubicTo(midpoint, previous.y, midpoint, current.y, current.x, current.y);
    }
    return next;
  }, [points]);

  const lastPoint = points.at(-1) ?? { x: width, y: height / 2 };

  useEffect(() => {
    reveal.value = withDelay(
      320,
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }),
    );
  }, [reveal]);

  return (
    <View
      accessibilityLabel={`Gráfico com ${safeData.length} pontos de atividade`}
      style={{ width, height }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Path
          path={path}
          color={color}
          end={reveal}
          strokeCap="round"
          strokeJoin="round"
          strokeWidth={3}
          style="stroke">
          <LinearGradient
            colors={['#D6FF4B', '#67E8B2']}
            end={vec(width, height)}
            start={vec(0, 0)}
          />
        </Path>
        <Circle cx={lastPoint.x} cy={lastPoint.y} r={5} color={color} />
        <Circle cx={lastPoint.x} cy={lastPoint.y} r={2} color="#173C2A" />
      </Canvas>
    </View>
  );
}
