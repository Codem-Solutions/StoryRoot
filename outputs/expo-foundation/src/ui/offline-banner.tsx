import NetInfo from '@react-native-community/netinfo';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import type { ColorPalette } from '@/theme/tokens';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        setOffline(state.isConnected === false);
      }),
    [],
  );

  if (!offline) return null;
  return (
    <View accessibilityLiveRegion="polite" style={styles.banner}>
      <Text style={styles.text}>Sem conexão. Algumas informações podem estar desatualizadas.</Text>
    </View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    banner: {
      backgroundColor: colors.ink,
      paddingHorizontal: 16,
      paddingVertical: 9,
    },
    text: {
      color: colors.canvas,
      fontFamily: 'DMSans_500Medium',
      fontSize: 12,
      textAlign: 'center',
    },
  });
}

