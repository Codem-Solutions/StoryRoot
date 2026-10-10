import { useFocusEffect, useRouter } from 'expo-router';
import { format } from 'date-fns';
import type * as Notifications from 'expo-notifications';
import { ArrowLeft, Bell, Trash2 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/EmptyState';
import { colors, radius, spacing, typography } from '../../theme';
import { isExpoGo } from '../../utils/expoEnv';

interface NotificacaoAgendada {
  id: string;
  titulo: string;
  corpo: string;
  data?: Date;
}

function extrairData(trigger: Notifications.NotificationTrigger | null): Date | undefined {
  if (trigger && typeof trigger === 'object' && 'value' in trigger && trigger.value) {
    return new Date(trigger.value as number);
  }
  return undefined;
}

export function NotificacoesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notificacoes, setNotificacoes] = useState<NotificacaoAgendada[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (isExpoGo) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const Notifications = await import('expo-notifications');
      const agendadas = await Notifications.getAllScheduledNotificationsAsync();
      const mapeadas = agendadas
        .map(n => ({
          id: n.identifier,
          titulo: n.content.title ?? 'Lembrete',
          corpo: n.content.body ?? '',
          data: extrairData(n.trigger),
        }))
        .sort((a, b) => (a.data?.getTime() ?? 0) - (b.data?.getTime() ?? 0));
      setNotificacoes(mapeadas);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function cancelar(id: string) {
    if (isExpoGo) return;
    const Notifications = await import('expo-notifications');
    await Notifications.cancelScheduledNotificationAsync(id);
    setNotificacoes(prev => prev.filter(n => n.id !== id));
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={typography.h3}>Notificações</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={notificacoes}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={carregando}
        onRefresh={carregar}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconWrapper}>
              <Bell size={18} color="#fff" />
            </View>
            <View style={styles.cardContent}>
              <Text style={typography.h4}>{item.titulo}</Text>
              {!!item.corpo && <Text style={typography.caption}>{item.corpo}</Text>}
              {!!item.data && (
                <Text style={styles.dataText}>
                  {format(item.data, "dd/MM/yyyy 'às' HH:mm")}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => cancelar(item.id)}
              hitSlop={8}>
              <Trash2 size={16} color={colors.red} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          !carregando ? (
            <EmptyState
              icon={Bell}
              title={isExpoGo ? 'Lembretes indisponíveis no Expo Go' : 'Nenhuma notificação agendada'}
              description={
                isExpoGo
                  ? 'A partir da SDK 53, o Expo Go não suporta notificações. Use um development build para testar lembretes.'
                  : 'Ative lembretes de remédio recorrentes para vê-los aqui.'
              }
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: 140,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  dataText: {
    ...typography.caption,
    color: colors.primary,
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
