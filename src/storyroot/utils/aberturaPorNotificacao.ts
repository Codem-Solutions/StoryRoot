import { router } from 'expo-router';
import { useEffect } from 'react';
import { isExpoGo } from './expoEnv';

/**
 * Ao tocar no lembrete de acompanhamento de saúde, abre o registro
 * correspondente — tanto com o app aberto quanto ao iniciar pelo toque.
 */
export function useAberturaPorNotificacao() {
  useEffect(() => {
    if (isExpoGo) return;
    let ativo = true;
    let assinatura: { remove: () => void } | undefined;

    void import('expo-notifications').then(Notifications => {
      if (!ativo) return;
      const abrir = (resposta: { notification: { request: { content: { data?: Record<string, unknown> } } } } | null) => {
        const registroId = resposta?.notification.request.content.data?.registroSaudeId;
        if (typeof registroId !== 'string') return false;
        router.push({ pathname: '/(app)/storyroot-main/registro-saude', params: { registroId } });
        return true;
      };
      assinatura = Notifications.addNotificationResponseReceivedListener(abrir);
      void Notifications.getLastNotificationResponseAsync().then(resposta => {
        if (ativo && abrir(resposta)) void Notifications.clearLastNotificationResponseAsync();
      });
    });

    return () => {
      ativo = false;
      assinatura?.remove();
    };
  }, []);
}
