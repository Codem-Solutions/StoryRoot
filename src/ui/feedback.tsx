import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import type { ColorPalette } from '@/theme/tokens';
import { Button } from '@/ui/button';

type StateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
};

export function LoadingState({
  title = 'Carregando…',
  description,
  style,
}: Partial<StateProps>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View accessibilityLiveRegion="polite" style={[styles.state, style]}>
      <ActivityIndicator color={colors.brand} size="large" />
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

export function EmptyState(props: StateProps) {
  return <FeedbackState icon="albums-outline" {...props} />;
}

export function ErrorState(props: StateProps) {
  return <FeedbackState icon="alert-circle-outline" {...props} />;
}

function FeedbackState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: StateProps & { icon: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View accessibilityRole="summary" style={[styles.state, style]}>
      <View style={styles.icon}>
        <Ionicons color={colors.brandStrong} name={icon} size={28} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

export function Skeleton({ height = 18, width = '100%', style }: {
  height?: number;
  width?: number | `${number}%`;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.38));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.72, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.38, duration: 650, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      style={[{ height, width, borderRadius: 999, backgroundColor: colors.line, opacity }, style]}
    />
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    state: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 32,
    },
    icon: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
    },
    title: {
      color: colors.ink,
      fontFamily: 'DMSans_700Bold',
      fontSize: 18,
      textAlign: 'center',
    },
    description: {
      color: colors.muted,
      fontFamily: 'DMSans_400Regular',
      lineHeight: 21,
      textAlign: 'center',
    },
    action: { marginTop: 8, minWidth: 180 },
  });
}
