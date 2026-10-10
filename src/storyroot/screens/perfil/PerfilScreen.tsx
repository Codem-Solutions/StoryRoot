import { router } from 'expo-router';
import {
  CheckCircle2,
  ChevronRight,
  CircleUser,
  Crown,
  LogOut,
  MoreVertical,
  Users,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from '../../components/BottomSheet';
import { useAuthStore } from '../../store/authStore';
import { useChildStore, useCriancaAtiva, useCriancasDaConta } from '../../store/childStore';
import { useMemoriesStore } from '../../store/memoriesStore';
import { useRecordsStore } from '../../store/recordsStore';
import {
  LIMITE_CRIANCAS_GRATUITO,
  usePodeAdicionarCrianca,
  useSubscriptionStore,
} from '../../store/subscriptionStore';
import { useVacinasStore } from '../../store/vacinasStore';
import { colors, radius, spacing, typography } from '../../theme';
import type { Crianca } from '../../types';
import { formatarIdade } from '../../utils/age';
import { cancelarLembretes } from '../../utils/notifications';
import { SegurancaSection } from './SegurancaSection';

export function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const criancas = useCriancasDaConta();
  const criancaAtiva = useCriancaAtiva();
  const sair = useAuthStore(state => state.sair);
  const removerCrianca = useChildStore(s => s.removerCrianca);
  const removerRegistrosDaCrianca = useRecordsStore(s => s.removerRegistrosDaCrianca);
  const removerOuDesvincularMemoriasDaCrianca = useMemoriesStore(
    s => s.removerOuDesvincularMemoriasDaCrianca,
  );
  const removerVacinasDaCrianca = useVacinasStore(s => s.removerVacinasDaCrianca);
  const plano = useSubscriptionStore(state => state.plano);
  const podeAdicionarCrianca = usePodeAdicionarCrianca();

  const [criancaParaVincular, setCriancaParaVincular] = useState<Crianca | null>(null);

  function nomeDeIrmaos(crianca: Crianca): string {
    return crianca.irmaosIds
      .map(id => criancas.find(c => c.id === id)?.nome)
      .filter(Boolean)
      .join(', ');
  }

  function confirmarLogout() {
    Alert.alert('Sair da conta?', 'Você precisará entrar novamente para acessar os dados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          sair();
        },
      },
    ]);
  }

  function tentarAdicionarCrianca() {
    if (!podeAdicionarCrianca) {
      Alert.alert(
        'Limite do plano gratuito',
        `O plano gratuito permite até ${LIMITE_CRIANCAS_GRATUITO} crianças cadastradas. Assine o Premium para cadastrar quantas quiser.`,
        [
          { text: 'Agora não', style: 'cancel' },
          { text: 'Ver Premium', onPress: () => router.push('/(app)/storyroot-main/premium') },
        ],
      );
      return;
    }
    router.push('/(app)/storyroot-main/adicionar-crianca');
  }

  function abrirOpcoes(crianca: Crianca) {
    Alert.alert(crianca.nome, undefined, [
      {
        text: 'Editar perfil',
        onPress: () => router.push({ pathname: '/(app)/storyroot-main/editar-crianca', params: { criancaId: crianca.id } }),
      },
      { text: 'Vincular irmão(a)', onPress: () => setCriancaParaVincular(crianca) },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => confirmarRemocao(crianca),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function confirmarRemocao(crianca: Crianca) {
    Alert.alert(
      `Remover ${crianca.nome}?`,
      'Todos os registros e memórias dessa criança serão apagados. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            const lembretes = useRecordsStore
              .getState()
              .registros.filter(r => r.criancaId === crianca.id)
              .flatMap(r => r.notificacaoIds ?? []);
            void cancelarLembretes(lembretes);
            removerCrianca(crianca.id);
            removerRegistrosDaCrianca(crianca.id);
            removerOuDesvincularMemoriasDaCrianca(crianca.id);
            removerVacinasDaCrianca(crianca.id);
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <Text style={typography.h2}>Perfil</Text>

      {!!criancaAtiva && (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => router.push('/(app)/storyroot-main/selecionar-crianca')}>
          {criancaAtiva.fotoUri ? (
            <Image source={{ uri: criancaAtiva.fotoUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <CircleUser size={28} color={colors.primary} />
            </View>
          )}
          <View style={styles.cardContent}>
            <Text style={typography.h4}>{criancaAtiva.nome}</Text>
            <Text style={typography.caption}>
              {formatarIdade(criancaAtiva.dataNascimento)}
            </Text>
            {criancas.length > 1 && (
              <Text style={styles.switcherHint}>
                {criancas.findIndex(c => c.id === criancaAtiva.id) + 1} de {criancas.length} ·
                Toque para trocar
              </Text>
            )}
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => router.push({ pathname: '/(app)/storyroot-main/editar-crianca', params: { criancaId: criancaAtiva.id } })}>
              <Text style={styles.editProfileButtonText}>Editar perfil</Text>
            </TouchableOpacity>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.planCard}
        onPress={() => router.push('/(app)/storyroot-main/premium')}>
        <View style={styles.planIconWrapper}>
          <Crown size={20} color={colors.amber} />
        </View>
        <View style={styles.cardContent}>
          <Text style={typography.h4}>Assinatura</Text>
          <Text style={typography.caption}>
            {plano === 'premium'
              ? 'Plano Premium ativo · Espaço e crianças ilimitados'
              : `Plano Gratuito · Até ${LIMITE_CRIANCAS_GRATUITO} crianças · Toque para conhecer o Premium`}
          </Text>
        </View>
        <ChevronRight size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <SegurancaSection />

      <TouchableOpacity style={styles.logoutButton} onPress={confirmarLogout} activeOpacity={0.85}>
        <LogOut size={18} color={colors.red} />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={typography.h3}>Meus filhos</Text>

        {criancas.map(crianca => (
          <TouchableOpacity
            key={crianca.id}
            style={styles.childRow}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/(app)/storyroot-main/editar-crianca', params: { criancaId: crianca.id } })}>
            {crianca.fotoUri ? (
              <Image source={{ uri: crianca.fotoUri }} style={styles.childAvatar} />
            ) : (
              <View style={[styles.childAvatar, styles.avatarPlaceholder]}>
                <CircleUser size={20} color={colors.primary} />
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={typography.h4}>{crianca.nome}</Text>
              <Text style={typography.caption}>{formatarIdade(crianca.dataNascimento)}</Text>
              {!!crianca.irmaosIds.length && (
                <View style={styles.siblingRow}>
                  <Users size={12} color={colors.primary} />
                  <Text style={styles.siblingText}>irmãos: {nomeDeIrmaos(crianca)}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => abrirOpcoes(crianca)}
              hitSlop={8}>
              <MoreVertical size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.addChildButton} onPress={tentarAdicionarCrianca}>
          <Text style={styles.addChildButtonText}>+ Adicionar outra criança</Text>
        </TouchableOpacity>
        {!podeAdicionarCrianca && (
          <Text style={styles.limiteText}>
            Limite de {LIMITE_CRIANCAS_GRATUITO} crianças do plano gratuito atingido.
          </Text>
        )}
      </View>

      {!!criancaParaVincular && (
        <VincularIrmaosSheet
          crianca={criancaParaVincular}
          onClose={() => setCriancaParaVincular(null)}
        />
      )}
    </ScrollView>
  );
}

function VincularIrmaosSheet({
  crianca,
  onClose,
}: {
  crianca: Crianca;
  onClose: () => void;
}) {
  const criancas = useCriancasDaConta();
  const vincularIrmaos = useChildStore(s => s.vincularIrmaos);
  const desvincularIrmaos = useChildStore(s => s.desvincularIrmaos);
  const criancaAtual = criancas.find(c => c.id === crianca.id) ?? crianca;
  const outras = criancas.filter(c => c.id !== crianca.id);

  return (
    <BottomSheet onClose={onClose} fillHeight={false}>
      <Text style={[typography.h3, styles.title]}>Vincular irmão(a) de {crianca.nome}</Text>

      {outras.length === 0 ? (
        <Text style={typography.body}>
          Cadastre outra criança para poder vinculá-las como irmãos.
        </Text>
      ) : (
        <View style={styles.list}>
          {outras.map(outra => {
            const vinculada = criancaAtual.irmaosIds.includes(outra.id);
            return (
              <TouchableOpacity
                key={outra.id}
                style={[styles.row, vinculada && styles.rowAtiva]}
                activeOpacity={0.85}
                onPress={() =>
                  vinculada
                    ? desvincularIrmaos(crianca.id, outra.id)
                    : vincularIrmaos(crianca.id, outra.id)
                }>
                <View style={styles.cardContent}>
                  <Text style={typography.h4}>{outra.nome}</Text>
                </View>
                {vinculada && <CheckCircle2 size={22} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  switcherHint: {
    ...typography.caption,
    color: colors.primary,
  },
  editProfileButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceTint,
  },
  editProfileButtonText: {
    ...typography.label,
    color: colors.primary,
    fontSize: 12,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  planIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    height: 48,
  },
  logoutText: {
    ...typography.label,
    color: colors.red,
  },
  section: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  siblingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  siblingText: {
    ...typography.caption,
    color: colors.primary,
  },
  moreButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addChildButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
  },
  addChildButtonText: {
    ...typography.label,
    color: colors.primary,
  },
  limiteText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  title: {
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  rowAtiva: {
    backgroundColor: colors.badgeBg,
  },
});
