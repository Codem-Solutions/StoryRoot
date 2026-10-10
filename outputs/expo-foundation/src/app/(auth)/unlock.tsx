import { useMemo } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/features/auth/auth-provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, spacing, typography, type ColorPalette } from '@/theme/tokens';
import { BrandMark } from '@/ui/brand-mark';
import { Button } from '@/ui/button';
import { Screen } from '@/ui/screen';

export default function UnlockScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { biometrics, session, unlock, signOut } = useAuth();

  const handleUnlock = async () => {
    if (await unlock()) router.replace('/(app)/(tabs)');
  };

  return (
    <Screen contentStyle={styles.content}>
      <BrandMark />
      <View style={styles.center}>
        <View style={styles.icon}>
          <Ionicons name="scan-outline" size={38} color={colors.brandStrong} />
        </View>
        <Text style={styles.title}>Olá, {session?.user.name.split(' ')[0]}.</Text>
        <Text style={styles.subtitle}>
          Sua sessão está protegida. Confirme com {biometrics.label} para continuar.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button
          icon="scan-outline"
          label={`Entrar com ${biometrics.label}`}
          onPress={handleUnlock}
        />
        <Button
          label="Usar outra conta"
          onPress={() => void signOut()}
          variant="ghost"
        />
      </View>
    </Screen>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
  content: { paddingTop: spacing.xl, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  icon: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.display,
    fontSize: 42,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: { gap: spacing.sm },
  });
}
