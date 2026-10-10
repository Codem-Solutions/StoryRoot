import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { DeviceRegistration } from '@/features/notifications/domain/notifications';

export const DEFAULT_NOTIFICATION_CHANNEL = 'default';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type RegistrationResult =
  | { status: 'registered'; registration: DeviceRegistration }
  | {
      status:
        | 'denied'
        | 'simulator'
        | 'unsupported'
        | 'missing-project-id'
        | 'failed';
      message: string;
    };

function getProjectId() {
  return (
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra?.eas?.projectId as string | undefined)
  );
}

async function configureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL, {
    name: 'Notificações gerais',
    description: 'Atualizações importantes e lembretes do aplicativo.',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 180, 120, 180],
    lightColor: '#D6FF4B',
    sound: 'default',
  });
}

export async function registerForPushNotifications(
  userId: string,
): Promise<RegistrationResult> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return {
      status: 'unsupported',
      message: 'Push remoto está disponível apenas no iOS e Android.',
    };
  }

  if (!Device.isDevice) {
    return {
      status: 'simulator',
      message: 'Use um aparelho real para gerar um token de push.',
    };
  }

  try {
    await configureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    const permission =
      current.status === 'granted'
        ? current
        : await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
            },
          });

    if (permission.status !== 'granted') {
      return {
        status: 'denied',
        message: 'A permissão de notificações não foi concedida.',
      };
    }

    const projectId = getProjectId();
    if (!projectId) {
      return {
        status: 'missing-project-id',
        message: 'Configure EAS_PROJECT_ID para gerar o Expo Push Token.',
      };
    }

    const [expoToken, nativeToken] = await Promise.all([
      Notifications.getExpoPushTokenAsync({ projectId }),
      Notifications.getDevicePushTokenAsync().catch(() => null),
    ]);

    return {
      status: 'registered',
      registration: {
        userId,
        expoPushToken: expoToken.data,
        nativePushToken: nativeToken
          ? typeof nativeToken.data === 'string'
            ? nativeToken.data
            : JSON.stringify(nativeToken.data)
          : undefined,
        platform: Platform.OS,
        deviceName: Device.deviceName,
      },
    };
  } catch {
    return {
      status: 'failed',
      message: 'Não foi possível registrar este aparelho agora.',
    };
  }
}

export async function scheduleTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Notificações funcionando ✨',
      body: 'A base está pronta para receber mensagens do seu backend.',
      data: { route: 'profile' },
      sound: 'default',
    },
    trigger: null,
  });
}

export function getNotificationRoute(
  response: Notifications.NotificationResponse,
) {
  const route = response.notification.request.content.data?.route;
  return route === 'home' || route === 'profile' || route === 'paywall'
    ? route
    : null;
}
