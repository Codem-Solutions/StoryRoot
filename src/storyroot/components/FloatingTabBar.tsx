import { router, usePathname, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CircleUser,
  HeartPulse,
  House,
  LucideIcon,
  Plus,
  Undo2,
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../theme';

type TabName = 'home' | 'saude' | 'rotina' | 'perfil';

const TABS: { name: TabName; href: Href; label: string; icon: LucideIcon }[] = [
  { name: 'home', href: '/(app)/storyroot-main/(tabs)/home', label: 'História', icon: House },
  { name: 'saude', href: '/(app)/storyroot-main/(tabs)/saude', label: 'Saúde', icon: HeartPulse },
  { name: 'rotina', href: '/(app)/storyroot-main/(tabs)/rotina', label: 'Rotina', icon: Undo2 },
  { name: 'perfil', href: '/(app)/storyroot-main/(tabs)/perfil', label: 'Perfil', icon: CircleUser },
];

/**
 * Tab bar flutuante do StoryRoot. Fica oculta enquanto uma rota que não é aba
 * (bottom sheets em transparentModal: registrar, audio-recorder, video-trim,
 * photo-preview, selecionar-crianca) está em foco, já que a sheet é
 * transparente e a barra apareceria por baixo dela.
 */
export function FloatingTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const ultimoSegmento = pathname.split('/').filter(Boolean).pop();
  const abaAtual = TABS.find(tab => tab.name === ultimoSegmento)?.name;

  if (!abaAtual) return null;

  const mostrarFab = abaAtual !== 'perfil';

  function renderTab(tab: (typeof TABS)[number]) {
    const focused = tab.name === abaAtual;
    const Icon = tab.icon;
    const color = focused ? colors.primary : colors.placeholder;

    return (
      <TouchableOpacity
        key={tab.name}
        activeOpacity={0.8}
        style={styles.tab}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={tab.label}
        onPress={() => router.navigate(tab.href)}>
        <View style={[styles.activeBar, focused && { backgroundColor: colors.primary }]} />
        <Icon size={22} color={color} />
        <Text
          style={[styles.tabLabel, { color }]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  }

  const meio = Math.ceil(TABS.length / 2);

  return (
    <View style={[styles.anchor, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        {TABS.slice(0, meio).map(renderTab)}
        {mostrarFab ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.fabSlot}
            accessibilityRole="button"
            accessibilityLabel="Novo registro"
            onPress={() => router.push('/(app)/storyroot-main/registrar')}>
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fab}>
              <Plus size={26} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.fabSlot} />
        )}
        {TABS.slice(meio).map(renderTab)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    paddingTop: 8,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 80,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xl + 8,
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tab: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: 2,
  },
  activeBar: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'transparent',
  },
  tabLabel: {
    ...typography.label,
    fontSize: 9,
  },
  fabSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
});
