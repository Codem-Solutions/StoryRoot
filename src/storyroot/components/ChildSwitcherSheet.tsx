import { router } from 'expo-router';
import { CheckCircle2, CircleUser, Pencil, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useChildStore, useCriancasDaConta } from '../store/childStore';
import { useMemoriesStore } from '../store/memoriesStore';
import { useRecordsStore } from '../store/recordsStore';
import { LIMITE_CRIANCAS_GRATUITO, usePodeAdicionarCrianca } from '../store/subscriptionStore';
import { colors, radius, spacing, typography } from '../theme';
import { formatarIdade } from '../utils/age';
import { BottomSheet } from './BottomSheet';

/** Usado como rota (modal transparente) de storyroot-main, para renderizar acima da FloatingTabBar. */
export function ChildSwitcherSheet() {
  const criancas = useCriancasDaConta();
  const criancaAtivaId = useChildStore(s => s.criancaAtivaId);
  const selecionarCriancaAtiva = useChildStore(s => s.selecionarCriancaAtiva);
  const removerCrianca = useChildStore(s => s.removerCrianca);
  const removerRegistrosDaCrianca = useRecordsStore(s => s.removerRegistrosDaCrianca);
  const removerOuDesvincularMemoriasDaCrianca = useMemoriesStore(
    s => s.removerOuDesvincularMemoriasDaCrianca,
  );
  const podeAdicionarCrianca = usePodeAdicionarCrianca();

  function onClose() {
    router.back();
  }

  function removerDaLista(id: string, nome: string) {
    if (criancas.length <= 1) {
      Alert.alert('Não é possível remover', 'É preciso ter pelo menos uma criança cadastrada.');
      return;
    }
    Alert.alert(
      `Remover ${nome}?`,
      'Todos os registros e memórias dessa criança serão apagados. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            removerCrianca(id);
            removerRegistrosDaCrianca(id);
            removerOuDesvincularMemoriasDaCrianca(id);
          },
        },
      ],
    );
  }

  function tentarAdicionarCrianca() {
    if (!podeAdicionarCrianca) {
      onClose();
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
    onClose();
    router.push('/(app)/storyroot-main/adicionar-crianca');
  }

  return (
    <BottomSheet onClose={onClose} fillHeight={false}>
      <Text style={[typography.h3, styles.title]}>Selecionar criança</Text>

      <View style={styles.list}>
        {criancas.map(crianca => {
          const ativa = crianca.id === criancaAtivaId;
          return (
            <TouchableOpacity
              key={crianca.id}
              style={[styles.row, ativa && styles.rowAtiva]}
              activeOpacity={0.85}
              onPress={() => {
                if (!ativa) selecionarCriancaAtiva(crianca.id);
                onClose();
              }}>
              {crianca.fotoUri ? (
                <Image source={{ uri: crianca.fotoUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <CircleUser size={24} color={colors.primary} />
                </View>
              )}
              <View style={styles.rowContent}>
                <Text style={typography.h4}>{crianca.nome}</Text>
                <Text style={typography.caption}>
                  {formatarIdade(crianca.dataNascimento)}
                </Text>
              </View>
              {ativa && <CheckCircle2 size={22} color={colors.primary} />}
              <TouchableOpacity
                style={styles.editButton}
                hitSlop={8}
                onPress={() => {
                  onClose();
                  router.push({
                    pathname: '/(app)/storyroot-main/editar-crianca',
                    params: { criancaId: crianca.id },
                  });
                }}>
                <Pencil size={16} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editButton}
                hitSlop={8}
                onPress={() => removerDaLista(crianca.id, crianca.nome)}>
                <Trash2 size={16} color={colors.red} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.addButton} onPress={tentarAdicionarCrianca}>
        <Text style={styles.addButtonText}>+ Adicionar outra criança</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  addButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
  },
  addButtonText: {
    ...typography.label,
    color: colors.primary,
  },
});
