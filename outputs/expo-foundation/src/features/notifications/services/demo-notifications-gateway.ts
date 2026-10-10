import type { NotificationsGateway } from '@/features/notifications/domain/notifications';
import { env } from '@/config/env';
import { httpNotificationsGateway } from '@/features/notifications/services/http-notifications-gateway';

/**
 * Adaptador seguro para desenvolvimento.
 *
 * Troque esta exportação por um gateway HTTP que persista o token por
 * usuário/aparelho. A interface do restante do app não precisa mudar.
 */
const demoNotificationsGateway: NotificationsGateway = {
  async registerDevice(registration) {
    if (__DEV__) {
      console.info('[push] aparelho pronto para sincronizar', {
        platform: registration.platform,
        hasExpoToken: Boolean(registration.expoPushToken),
      });
    }
  },
  async unregisterDevice() {},
  async updatePreference() {},
};

export const notificationsGateway: NotificationsGateway =
  env.notificationsEndpoint
    ? httpNotificationsGateway
    : demoNotificationsGateway;
