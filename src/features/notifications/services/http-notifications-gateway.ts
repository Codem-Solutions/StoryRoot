import { env } from '@/config/env';
import type { NotificationsGateway } from '@/features/notifications/domain/notifications';

function headers(accessToken?: string) {
  return {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

async function assertResponse(response: Response) {
  if (!response.ok) {
    throw new Error(`Falha ao sincronizar push (${response.status})`);
  }
}

export const httpNotificationsGateway: NotificationsGateway = {
  async registerDevice(registration, accessToken) {
    if (!env.notificationsEndpoint) return;
    await assertResponse(
      await fetch(env.notificationsEndpoint, {
        method: 'POST',
        headers: headers(accessToken),
        body: JSON.stringify(registration),
      }),
    );
  },

  async unregisterDevice(expoPushToken, accessToken) {
    if (!env.notificationsEndpoint) return;
    await assertResponse(
      await fetch(
        `${env.notificationsEndpoint}/${encodeURIComponent(expoPushToken)}`,
        {
          method: 'DELETE',
          headers: headers(accessToken),
        },
      ),
    );
  },

  async updatePreference(userId, enabled, accessToken) {
    if (!env.notificationsEndpoint) return;
    await assertResponse(
      await fetch(`${env.notificationsEndpoint}/preference`, {
        method: 'PATCH',
        headers: headers(accessToken),
        body: JSON.stringify({ userId, enabled }),
      }),
    );
  },
};
