import { useMemo } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/features/auth/auth-provider';
import { useNotifications } from '@/features/notifications/notifications-provider';
import { usePurchases } from '@/features/purchases/purchases-provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, spacing, typography, type ColorPalette } from '@/theme/tokens';
import { Button } from '@/ui/button';
import { Screen } from '@/ui/screen';

export default function ProfileScreen() {
  const { colors, preference, setPreference } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    session,
    biometrics,
    biometricsEnabled,
    setBiometricsEnabled,
    signOut,
  } = useAuth();
  const { isPremium, restore } = usePurchases();
  const {
    enabled: notificationsEnabled,
    status: notificationStatus,
    statusMessage: notificationStatusMessage,
    enable: enableNotifications,
    disable: disableNotifications,
    sendTest: sendTestNotification,
  } = useNotifications();

  const toggleBiometrics = async (enabled: boolean) => {
    const changed = await setBiometricsEnabled(enabled);
    if (!changed && enabled) {
      Alert.alert(
        'Biometria indisponível',
        'Cadastre Face ID ou impressão digital nos ajustes do aparelho.',
      );
    }
  };

  const handleRestore = async () => {
    const active = await restore();
    Alert.alert(
      active ? 'Compra restaurada' : 'Nenhuma compra encontrada',
      active ? 'Seu acesso Premium foi reativado.' : 'Não encontramos uma assinatura ativa.',
    );
  };

  const toggleNotifications = async (enabled: boolean) => {
    if (!enabled) {
      await disableNotifications();
      return;
    }
    const registered = await enableNotifications();
    if (!registered) {
      Alert.alert(
        'Não foi possível ativar',
        'Confira a permissão do aparelho e a configuração do EAS Project ID.',
      );
    }
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text style={styles.title}>Sua conta.</Text>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{session?.user.name.slice(0, 1)}</Text>
        </View>
        <View>
          <Text style={styles.name}>{session?.user.name}</Text>
          <Text style={styles.email}>{session?.user.email}</Text>
        </View>
      </View>

      <Text style={styles.section}>SEGURANÇA</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <Ionicons name="scan-outline" size={22} color={colors.brandStrong} />
          </View>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Entrar com {biometrics.label}</Text>
            <Text style={styles.settingDescription}>Protege o acesso neste aparelho.</Text>
          </View>
          <Switch
            disabled={!biometrics.available}
            onValueChange={(value) => void toggleBiometrics(value)}
            trackColor={{ false: colors.line, true: colors.brand }}
            value={biometricsEnabled}
          />
        </View>
      </View>

      <Text style={styles.section}>NOTIFICAÇÕES</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingIcon}>
            <Ionicons name="notifications-outline" size={22} color={colors.brandStrong} />
          </View>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Push notifications</Text>
            <Text style={styles.settingDescription}>{notificationStatusMessage}</Text>
          </View>
          <Switch
            disabled={notificationStatus === 'registering'}
            onValueChange={(value) => void toggleNotifications(value)}
            trackColor={{ false: colors.line, true: colors.brand }}
            value={notificationsEnabled}
          />
        </View>
        {notificationsEnabled ? (
          <>
            <View style={styles.divider} />
            <Button
              label="Enviar notificação de teste"
              onPress={() => void sendTestNotification()}
              variant="ghost"
            />
          </>
        ) : null}
      </View>

      <Text style={styles.section}>ASSINATURA</Text>
      <View style={styles.card}>
        <View style={styles.planRow}>
          <View>
            <Text style={styles.settingTitle}>Plano atual</Text>
            <Text style={styles.plan}>{isPremium ? 'Foundation Pro' : 'Gratuito'}</Text>
          </View>
          <View style={[styles.badge, isPremium && styles.badgeActive]}>
            <Text style={styles.badgeText}>{isPremium ? 'ATIVO' : 'BÁSICO'}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <Button label="Restaurar compras" onPress={handleRestore} variant="ghost" />
      </View>

      <Text style={styles.section}>APARÊNCIA</Text>
      <View accessibilityRole="radiogroup" style={styles.themeOptions}>
        {([
          ['system', 'Automático'],
          ['light', 'Claro'],
          ['dark', 'Escuro'],
        ] as const).map(([value, label]) => (
          <Button
            key={value}
            label={label}
            onPress={() => void setPreference(value)}
            style={styles.themeButton}
            variant={preference === value ? 'primary' : 'secondary'}
          />
        ))}
      </View>

      <Button label="Sair da conta" onPress={() => void signOut()} variant="secondary" />
    </Screen>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  title: { color: colors.ink, fontFamily: typography.display, fontSize: 42 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.ink, fontFamily: typography.display, fontSize: 30 },
  name: { color: colors.ink, fontFamily: typography.bodyBold, fontSize: 18 },
  email: { color: colors.muted, fontFamily: typography.body, marginTop: spacing.xs },
  section: {
    color: colors.muted,
    fontFamily: typography.bodyBold,
    fontSize: 11,
    letterSpacing: 1.3,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingCopy: { flex: 1 },
  settingTitle: { color: colors.ink, fontFamily: typography.bodyBold, fontSize: 16 },
  settingDescription: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plan: { color: colors.brand, fontFamily: typography.display, fontSize: 24, marginTop: spacing.xs },
  badge: {
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  badgeActive: { backgroundColor: colors.accent },
  badgeText: { color: colors.ink, fontFamily: typography.bodyBold, fontSize: 10 },
  divider: { height: 1, backgroundColor: colors.line, marginTop: spacing.md },
  themeOptions: { flexDirection: 'row', gap: spacing.sm },
  themeButton: { flex: 1, minHeight: 46, paddingHorizontal: spacing.xs },
  });
}
