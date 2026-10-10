import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BellRing,
  CloudUpload,
  Crown,
  EggOff,
  UsersRound,
  X,
} from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIMITE_CRIANCAS_GRATUITO, useSubscriptionStore } from '../../store/subscriptionStore';
import { colors, radius, spacing, typography } from '../../theme';

const FEATURES = [
  {
    icon: CloudUpload,
    color: colors.primary,
    title: 'Espaço Ilimitado',
    desc: 'Guarde fotos, vídeos e áudios de rotina e memórias sem limite.',
  },
  {
    icon: BellRing,
    color: colors.accent,
    title: 'Alarmes de Lembretes',
    desc: 'Ative lembretes recorrentes de remédios e cuidados.',
  },
  {
    icon: UsersRound,
    color: colors.indigo,
    title: 'Crianças Ilimitadas',
    desc: `No plano gratuito você cadastra até ${LIMITE_CRIANCAS_GRATUITO} crianças. No Premium, quantas quiser.`,
  },
];

export function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const plano = useSubscriptionStore(state => state.plano);
  const definirPlano = useSubscriptionStore(state => state.definirPlano);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.topHeader, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity style={styles.closeCircle} onPress={() => router.back()}>
          <X size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Configurações</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.heroWrapper}>
        <LinearGradient
          colors={colors.gradientPremium}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}>
          <EggOff
            size={140}
            color="#ffffff"
            strokeWidth={1}
            style={styles.heroBgIcon}
          />
          <View style={styles.rowCrown}>
            <View style={styles.crownCircle}>
              <Crown size={24} color={colors.amber} />
            </View>
            <View style={styles.planActiveBadge}>
              <Text style={styles.planActiveBadgeText}>
                Plano Ativo: {plano === 'premium' ? 'Premium' : 'Gratuito'}
              </Text>
            </View>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>
              Garanta que nenhuma memória se perca.
            </Text>
            <Text style={styles.heroDesc}>
              No plano gratuito suas mídias expiram em 30 dias. Com o Story Root
              Premium você eterniza cada segundo para sempre.
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.featuresList}>
        {FEATURES.map(feature => (
          <View key={feature.title} style={styles.featureRow}>
            <View style={[styles.featureTile, { backgroundColor: feature.color }]}>
              <feature.icon size={24} color="#fff" />
            </View>
            <View style={styles.featureTextGroup}>
              <Text style={typography.h4}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.pricingSection}>
        <View style={styles.pricingCard}>
          <Text style={styles.planName}>Assinatura Anual</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>R$ 5,99</Text>
            <Text style={styles.period}>/mês</Text>
          </View>
          {plano === 'premium' ? (
            <View style={styles.activeNotice}>
              <Text style={typography.body}>Você já é Premium ✓</Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.subscribeWrapper}
              onPress={() => {
                definirPlano('premium');
                router.back();
              }}>
              <LinearGradient
                colors={colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.subscribeCta}>
                <Text style={styles.subscribeLabel}>Assinar Premium Agora</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <Text style={styles.fineprint}>
            Cancele a qualquer momento. 7 dias grátis para testar.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  closeCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  navTitle: {
    ...typography.label,
    fontSize: 16,
  },
  spacer: {
    width: 40,
  },
  heroWrapper: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  heroCard: {
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    gap: spacing.lg,
    overflow: 'hidden',
  },
  heroBgIcon: {
    position: 'absolute',
    right: -30,
    top: -10,
    opacity: 0.15,
  },
  rowCrown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  crownCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planActiveBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  planActiveBadgeText: {
    ...typography.label,
    color: '#fff',
    fontSize: 11,
  },
  heroText: {
    gap: spacing.sm,
  },
  heroTitle: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 24,
    lineHeight: 29,
    color: '#fff',
  },
  heroDesc: {
    ...typography.bodySmall,
    color: '#fff',
    opacity: 0.85,
  },
  featuresList: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  featureTile: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextGroup: {
    flex: 1,
    gap: 2,
  },
  featureDesc: {
    ...typography.caption,
  },
  pricingSection: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  pricingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  planName: {
    ...typography.label,
    color: colors.primary,
    fontSize: 13,
    alignSelf: 'flex-start',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  price: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 32,
    lineHeight: 39,
    color: colors.text,
  },
  period: {
    ...typography.body,
    color: colors.textMuted,
  },
  subscribeWrapper: {
    width: '100%',
  },
  subscribeCta: {
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeLabel: {
    ...typography.button,
  },
  activeNotice: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  fineprint: {
    ...typography.caption,
    textAlign: 'center',
  },
});
