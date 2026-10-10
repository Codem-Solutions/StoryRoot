import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import type { Plan } from '@/features/purchases/domain/purchases';
import { usePurchases } from '@/features/purchases/purchases-provider';
import { useTheme } from '@/theme/theme-provider';
import { radius, spacing, typography, type ColorPalette } from '@/theme/tokens';
import { Button } from '@/ui/button';
import { Screen } from '@/ui/screen';

const benefits = [
  'Acesso ilimitado a todos os recursos',
  'Sincronização entre seus dispositivos',
  'Novidades premium assim que forem lançadas',
];

export default function PaywallScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { plans, loading, purchase, restore } = usePurchases();
  const [selectedId, setSelectedId] = useState(plans[0]?.id);
  const selected = useMemo(
    () => plans.find((plan) => plan.id === selectedId) ?? plans[0],
    [plans, selectedId],
  );

  const handlePurchase = async () => {
    if (!selected) return;
    try {
      if (await purchase(selected)) {
        Alert.alert('Tudo pronto!', 'Seu acesso Premium está ativo.');
        router.back();
      }
    } catch (error) {
      const cancelled =
        typeof error === 'object' &&
        error !== null &&
        'userCancelled' in error &&
        error.userCancelled;
      if (!cancelled) Alert.alert('Compra não concluída', 'Tente novamente em instantes.');
    }
  };

  const handleRestore = async () => {
    const restored = await restore();
    Alert.alert(
      restored ? 'Compra restaurada' : 'Nenhuma compra encontrada',
      restored ? 'Seu acesso foi reativado.' : 'Não encontramos compras para esta conta.',
    );
  };

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="Fechar" hitSlop={12} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={colors.ink} />
        </Pressable>
        <Text style={styles.pro}>FOUNDATION PRO</Text>
        <View style={{ width: 28 }} />
      </View>

      <LinearGradient colors={[colors.brandStrong, colors.brand]} style={styles.hero}>
        <View style={styles.orbitOne} />
        <View style={styles.orbitTwo} />
        <View style={styles.spark}>
          <Ionicons name="diamond-outline" size={28} color={colors.brandStrong} />
        </View>
        <Text style={styles.heroTitle}>Mais espaço para{'\n'}ir além.</Text>
        <Text style={styles.heroSubtitle}>
          Tudo o que você precisa, sem limites e sem distrações.
        </Text>
      </LinearGradient>

      <View style={styles.benefits}>
        {benefits.map((benefit) => (
          <View key={benefit} style={styles.benefit}>
            <View style={styles.check}>
              <Ionicons name="checkmark" size={16} color={colors.brandStrong} />
            </View>
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>

      <View style={styles.plans}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selected?.id === plan.id}
            onPress={() => setSelectedId(plan.id)}
          />
        ))}
      </View>

      <Button
        label={selected ? `Continuar com ${selected.title}` : 'Carregando planos'}
        loading={loading}
        disabled={!selected}
        onPress={() => void handlePurchase()}
      />
      <Text style={styles.legal}>
        A assinatura é renovada automaticamente. Cancele a qualquer momento nos ajustes da
        App Store ou Google Play.
      </Text>
      <Pressable onPress={() => void handleRestore()}>
        <Text style={styles.restore}>Restaurar compras</Text>
      </Pressable>
    </Screen>
  );
}

function PlanCard({
  plan,
  selected,
  onPress,
}: {
  plan: Plan;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.plan, selected && styles.planSelected]}>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.planCopy}>
        <View style={styles.planTitleRow}>
          <Text style={styles.planTitle}>{plan.title}</Text>
          {plan.badge ? <Text style={styles.planBadge}>{plan.badge}</Text> : null}
        </View>
        <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
      </View>
      <Text style={styles.planPrice}>{plan.price}</Text>
    </Pressable>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
  content: { paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pro: {
    color: colors.brandStrong,
    fontFamily: typography.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  hero: {
    minHeight: 280,
    borderRadius: radius.lg,
    padding: spacing.lg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  orbitOne: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    right: -70,
    top: -100,
  },
  orbitTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    right: -25,
    top: -58,
  },
  spark: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '8deg' }],
  },
  heroTitle: {
    color: colors.white,
    fontFamily: typography.display,
    fontSize: 42,
    lineHeight: 42,
    letterSpacing: -1,
  },
  heroSubtitle: {
    color: '#D9E4DD',
    fontFamily: typography.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
    maxWidth: 300,
  },
  benefits: { gap: spacing.md },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  check: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { color: colors.ink, fontFamily: typography.bodyMedium, flex: 1 },
  plans: { gap: spacing.sm },
  plan: {
    minHeight: 86,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  planSelected: { borderWidth: 2, borderColor: colors.brandStrong },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.brandStrong },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.brandStrong },
  planCopy: { flex: 1 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  planTitle: { color: colors.ink, fontFamily: typography.bodyBold, fontSize: 16 },
  planBadge: {
    color: colors.brandStrong,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    fontFamily: typography.bodyBold,
    fontSize: 10,
    overflow: 'hidden',
  },
  planSubtitle: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  planPrice: {
    color: colors.ink,
    fontFamily: typography.bodyBold,
    fontSize: 13,
    maxWidth: 88,
    textAlign: 'right',
  },
  legal: {
    color: colors.muted,
    fontFamily: typography.body,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  restore: {
    color: colors.brandStrong,
    fontFamily: typography.bodyBold,
    fontSize: 13,
    textAlign: 'center',
  },
  });
}
