import { router } from 'expo-router';
import { ArrowLeft, Syringe } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { useCriancaAtiva } from '../../store/childStore';
import { colors, radius, spacing, typography } from '../../theme';
import { CadernetaVacinas } from './CadernetaVacinas';

export function CadernetaVacinasScreen() {
  const insets = useSafeAreaInsets();
  const crianca = useCriancaAtiva();

  return (
    <View style={styles.container}>
      <View style={[styles.cabecalho, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity
          style={styles.voltar}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar">
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={typography.h2}>Caderneta de vacinas</Text>
      </View>
      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}>
        {crianca ? (
          <CadernetaVacinas crianca={crianca} />
        ) : (
          <EmptyState
            icon={Syringe}
            title="Nenhuma criança selecionada"
            description="Cadastre ou selecione uma criança para ver a caderneta."
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.md,
  },
  voltar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conteudo: {
    paddingHorizontal: spacing.xxl,
  },
});
