import { Platform } from 'react-native';
import { isExpoGo } from './expoEnv';

const CANAL_REMEDIOS = 'remedios';
const CANAL_SAUDE = 'acompanhamento-saude';
const INTERVALO_ACOMPANHAMENTO_SAUDE_S = 8 * 60 * 60;
let canalCriado = false;

/**
 * `expo-notifications` não pode ser importado (nem estaticamente) dentro do Expo Go
 * na SDK 53+ — o próprio import já derruba o app no Android. Por isso o módulo só é
 * carregado sob demanda, e nunca quando `isExpoGo` é verdadeiro.
 */
function carregarNotifications() {
  return import('expo-notifications');
}

async function garantirCanalAndroid(Notifications: Awaited<ReturnType<typeof carregarNotifications>>) {
  if (Platform.OS !== 'android' || canalCriado) return;
  await Notifications.setNotificationChannelAsync(CANAL_REMEDIOS, {
    name: 'Lembretes de remédio',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
  await Notifications.setNotificationChannelAsync(CANAL_SAUDE, {
    name: 'Acompanhamento de sintomas',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
  canalCriado = true;
}

export async function solicitarPermissaoNotificacao(): Promise<boolean> {
  if (isExpoGo) return false;
  const Notifications = await carregarNotifications();
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return true;
  // No Android 13+ o pedido de permissão só aparece se já existir um canal.
  await garantirCanalAndroid(Notifications);
  const solicitada = await Notifications.requestPermissionsAsync();
  return solicitada.granted;
}

/**
 * - `ativa`: o aparelho permite notificações do app.
 * - `pendente`: ainda dá para mostrar o pedido nativo de permissão.
 * - `bloqueada`: o usuário negou e só dá para mudar nas configurações do aparelho.
 * - `indisponivel`: Expo Go, sem suporte a notificações.
 */
export type StatusNotificacao = 'ativa' | 'pendente' | 'bloqueada' | 'indisponivel';

export async function obterStatusNotificacao(): Promise<StatusNotificacao> {
  if (isExpoGo) return 'indisponivel';
  try {
    const Notifications = await carregarNotifications();
    const atual = await Notifications.getPermissionsAsync();
    if (atual.granted) return 'ativa';
    return atual.canAskAgain ? 'pendente' : 'bloqueada';
  } catch {
    return 'indisponivel';
  }
}

/**
 * Schedules one notification per (horário × dia) within `duracaoDias`, so
 * reminders naturally stop firing once the treatment period ends — no
 * background job needed to "turn off" anything.
 *
 * No Expo Go, lembretes não são agendados (retorna lista vazia) — use um
 * development build para testar essa funcionalidade.
 */
export async function agendarLembretesRemedio(
  nome: string,
  dosagem: string,
  horarios: string[],
  duracaoDias: number,
): Promise<string[]> {
  if (isExpoGo) return [];
  const permitido = await solicitarPermissaoNotificacao();
  if (!permitido) return [];
  const Notifications = await carregarNotifications();
  await garantirCanalAndroid(Notifications);

  const agora = new Date();
  const ids: string[] = [];

  for (let dia = 0; dia < Math.max(1, duracaoDias); dia++) {
    for (const horario of horarios) {
      if (!horario) continue;
      const referencia = new Date(horario);
      const disparo = new Date();
      disparo.setDate(disparo.getDate() + dia);
      disparo.setHours(referencia.getHours(), referencia.getMinutes(), 0, 0);

      if (disparo.getTime() <= agora.getTime()) continue;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Hora do remédio 💊',
          body: dosagem ? `${nome} · ${dosagem}` : nome,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: disparo,
          channelId: CANAL_REMEDIOS,
        },
      });
      ids.push(id);
    }
  }

  return ids;
}

/**
 * Lembrete repetido a cada 8 horas para atualizar o quadro de um registro de
 * saúde. Deve ser cancelado (com `cancelarLembretes`) quando o status chegar a
 * "Fim dos sintomas" ou "Finalizar registro". O `registroSaudeId` no `data`
 * permite abrir o registro ao tocar na notificação.
 */
export async function agendarAcompanhamentoSaude(
  registroId: string,
  nomeCrianca: string,
  sintomas: string,
): Promise<string[]> {
  if (isExpoGo) return [];
  const permitido = await solicitarPermissaoNotificacao();
  if (!permitido) return [];
  const Notifications = await carregarNotifications();
  await garantirCanalAndroid(Notifications);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Como ${nomeCrianca} está? 🩺`,
      body: `Atualize o quadro: ${sintomas}`,
      sound: true,
      data: { registroSaudeId: registroId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: INTERVALO_ACOMPANHAMENTO_SAUDE_S,
      repeats: true,
      channelId: CANAL_SAUDE,
    },
  });
  return [id];
}

export async function cancelarLembretes(ids?: string[]): Promise<void> {
  if (isExpoGo || !ids?.length) return;
  const Notifications = await carregarNotifications();
  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}
