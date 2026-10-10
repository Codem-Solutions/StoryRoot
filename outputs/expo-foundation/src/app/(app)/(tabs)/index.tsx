import { useMemo } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/features/auth/auth-provider';
import { usePurchases } from '@/features/purchases/purchases-provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, spacing, typography, type ColorPalette } from '@/theme/tokens';
import { Button } from '@/ui/button';
import { ActivitySparkline, HydrationRing } from '@/ui/graphics';
import { PremiumSurface } from '@/ui/premium-surface';
import { Screen } from '@/ui/screen';

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { session } = useAuth();
  const { isPremium } = usePurchases();

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>TERÇA, 28 DE JULHO</Text>
          <Text style={styles.title}>Olá, {session?.user.name.split(' ')[0]}.</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{session?.user.name.slice(0, 1)}</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.heroLabel}>SEU ESPAÇO</Text>
          <Ionicons color={colors.accent} name="sparkles-outline" size={22} />
        </View>
        <Text style={styles.heroTitle}>
          Uma fundação sólida para a sua próxima grande ideia.
        </Text>
        <Text style={styles.heroText}>
          Autenticação, segurança e monetização já conectadas à arquitetura.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Pronto para usar</Text>
      <View style={styles.grid}>
        <Feature icon="shield-checkmark-outline" label="Sessão segura" value="Ativa" />
        <Feature icon="scan-outline" label="Biometria" value="Disponível" />
        <Feature
          icon="diamond-outline"
          label="Seu plano"
          value={isPremium ? 'Premium' : 'Gratuito'}
        />
        <Feature icon="layers-outline" label="Arquitetura" value="Modular" />
      </View>

      <Text style={styles.sectionTitle}>Motion lab</Text>
      <View style={styles.motionBackdrop}>
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />
        <PremiumSurface style={styles.motionCard}>
          <View style={styles.motionCopy}>
            <Text style={styles.motionKicker}>HIDRATAÇÃO</Text>
            <Text style={styles.motionTitle}>1.750 ml</Text>
            <Text style={styles.motionMeta}>Meta diária · 2.500 ml</Text>
            <View style={styles.chartRow}>
              <ActivitySparkline data={[42, 56, 48, 71, 66, 82, 76, 91]} width={140} />
            </View>
          </View>
          <HydrationRing current={1750} goal={2500} progress={0.7} size={132} />
        </PremiumSurface>
        <Text style={styles.motionCaption}>
          SKIA · REANIMATED · LIQUID GLASS
        </Text>
      </View>

      {!isPremium ? (
        <View style={styles.offer}>
          <View style={styles.offerCopy}>
            <Text style={styles.offerKicker}>FOUNDATION PRO</Text>
            <Text style={styles.offerTitle}>Libere todo o potencial.</Text>
          </View>
          <Button label="Conhecer o Pro" onPress={() => router.push('/(app)/paywall')} />
        </View>
      ) : null}
    </Screen>
  );
}

function Feature({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.feature}>
      <Ionicons color={colors.brand} name={icon} size={24} />
      <Text style={styles.featureLabel}>{label}</Text>
      <Text style={styles.featureValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: {
    color: colors.muted,
    fontFamily: typography.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  title: { color: colors.ink, fontFamily: typography.display, fontSize: 36 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.ink, fontFamily: typography.bodyBold, fontSize: 18 },
  hero: {
    minHeight: 300,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.brandStrong,
    justifyContent: 'flex-end',
  },
  heroTop: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroLabel: {
    color: colors.accent,
    fontFamily: typography.bodyBold,
    fontSize: 12,
    letterSpacing: 1.3,
  },
  heroTitle: {
    color: colors.white,
    fontFamily: typography.display,
    fontSize: 35,
    lineHeight: 37,
    letterSpacing: -0.8,
  },
  heroText: {
    color: '#C8D5CE',
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  sectionTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 27 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  feature: {
    width: '47.5%',
    minHeight: 140,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  featureLabel: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 13,
    marginTop: 'auto',
  },
  featureValue: { color: colors.ink, fontFamily: typography.bodyBold, fontSize: 17 },
  offer: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    gap: spacing.lg,
  },
  offerCopy: { gap: spacing.xs },
  offerKicker: {
    color: colors.brandStrong,
    fontFamily: typography.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  offerTitle: { color: colors.ink, fontFamily: typography.display, fontSize: 29 },
  motionBackdrop: {
    minHeight: 260,
    borderRadius: radius.lg,
    backgroundColor: '#082D3C',
    padding: spacing.md,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  glowOne: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(38, 192, 225, 0.24)',
    top: -90,
    right: -40,
  },
  glowTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(214, 255, 75, 0.12)',
    bottom: -80,
    left: -35,
  },
  motionCard: {
    minHeight: 190,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 45, 60, 0.58)',
  },
  motionCopy: { flex: 1, gap: spacing.xs },
  motionKicker: {
    color: colors.accent,
    fontFamily: typography.bodyBold,
    fontSize: 10,
    letterSpacing: 1.25,
  },
  motionTitle: {
    color: colors.white,
    fontFamily: typography.display,
    fontSize: 30,
    letterSpacing: -0.6,
  },
  motionMeta: {
    color: '#A9C8D4',
    fontFamily: typography.body,
    fontSize: 12,
  },
  chartRow: { marginTop: spacing.md },
  motionCaption: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: typography.bodyBold,
    fontSize: 8,
    letterSpacing: 1.3,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  });
}
