import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { StoryRootLogo } from './StoryRootLogo';

export function AppLoadingScreen() {
  const [pulso] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulso, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulso]);

  const scale = pulso.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.04] });
  const opacity = pulso.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <StoryRootLogo size={96} variant="mark" />
      </Animated.View>
      <Text style={styles.appName}>Story Root</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  appName: {
    ...typography.h3,
    color: colors.text,
  },
});
