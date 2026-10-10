import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { useAuth } from '@/features/auth/auth-provider';
import { notificationsGateway } from '@/features/notifications/services/demo-notifications-gateway';
import {
  getNotificationRoute,
  registerForPushNotifications,
  scheduleTestNotification,
} from '@/features/notifications/services/notifications-service';

const ENABLED_KEY = 'foundation.notifications.enabled';
const TOKEN_KEY = 'foundation.notifications.expo-token';

type NotificationStatus =
  | 'idle'
  | 'registering'
  | 'enabled'
  | 'denied'
  | 'unavailable'
  | 'configuration-required'
  | 'error';

type NotificationsContextValue = {
  enabled: boolean;
  status: NotificationStatus;
  statusMessage: string;
  expoPushToken: string | null;
  enable(): Promise<boolean>;
  disable(): Promise<void>;
  sendTest(): Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const routeMap = {
  home: '/(app)/(tabs)',
  profile: '/(app)/(tabs)/profile',
  paywall: '/(app)/paywall',
} as const;

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<NotificationStatus>('idle');
  const [statusMessage, setStatusMessage] = useState(
    'Ative para receber atualizações e lembretes.',
  );
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const sessionRef = useRef(session);
  const previousSessionRef = useRef(session);
  const lastSyncedUserRef = useRef<string | null>(null);
  const autoAttemptedUserRef = useRef<string | null>(null);

  useEffect(() => {
    const previousSession = previousSessionRef.current;
    if (
      previousSession &&
      !session &&
      expoPushToken
    ) {
      void notificationsGateway.unregisterDevice(
        expoPushToken,
        previousSession.accessToken,
      );
      lastSyncedUserRef.current = null;
    }
    previousSessionRef.current = session;
    sessionRef.current = session;
  }, [expoPushToken, session]);

  const handleResponse = useCallback(
    (response: Notifications.NotificationResponse | null) => {
      if (!response || !sessionRef.current) return;
      const destination = getNotificationRoute(response);
      if (destination) {
        router.push(routeMap[destination]);
        void Notifications.clearLastNotificationResponseAsync();
      }
    },
    [],
  );

  const enable = useCallback(async () => {
    if (!session) return false;
    setStatus('registering');
    setStatusMessage('Preparando este aparelho...');

    const result = await registerForPushNotifications(session.user.id);
    if (result.status !== 'registered') {
      const nextStatus: NotificationStatus =
        result.status === 'denied'
          ? 'denied'
          : result.status === 'missing-project-id'
            ? 'configuration-required'
            : result.status === 'failed'
              ? 'error'
              : 'unavailable';
      setStatus(nextStatus);
      setStatusMessage(result.message);
      return false;
    }

    try {
      await Promise.all([
        notificationsGateway.registerDevice(
          result.registration,
          session.accessToken,
        ),
        notificationsGateway.updatePreference(
          session.user.id,
          true,
          session.accessToken,
        ),
        SecureStore.setItemAsync(ENABLED_KEY, 'true'),
        SecureStore.setItemAsync(TOKEN_KEY, result.registration.expoPushToken),
      ]);
    } catch {
      setStatus('error');
      setStatusMessage('O aparelho não pôde ser sincronizado com o backend.');
      return false;
    }
    setExpoPushToken(result.registration.expoPushToken);
    lastSyncedUserRef.current = session.user.id;
    setEnabled(true);
    setStatus('enabled');
    setStatusMessage('Este aparelho está registrado para notificações.');
    return true;
  }, [session]);

  const disable = useCallback(async () => {
    const userId = session?.user.id;
    const savedToken =
      expoPushToken ?? (await SecureStore.getItemAsync(TOKEN_KEY));
    await Promise.all([
      savedToken
        ? notificationsGateway.unregisterDevice(
            savedToken,
            session?.accessToken,
          )
        : Promise.resolve(),
      userId
        ? notificationsGateway.updatePreference(
            userId,
            false,
            session?.accessToken,
          )
        : Promise.resolve(),
      SecureStore.setItemAsync(ENABLED_KEY, 'false'),
      SecureStore.deleteItemAsync(TOKEN_KEY),
    ]);
    setEnabled(false);
    setExpoPushToken(null);
    setStatus('idle');
    setStatusMessage('Notificações desativadas neste aparelho.');
  }, [expoPushToken, session?.accessToken, session?.user]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      SecureStore.getItemAsync(ENABLED_KEY),
      SecureStore.getItemAsync(TOKEN_KEY),
    ]).then(([savedEnabled, savedToken]) => {
      if (!active) return;
      setEnabled(savedEnabled === 'true');
      setExpoPushToken(savedToken);
      if (savedEnabled === 'true') {
        setStatus('enabled');
        setStatusMessage('Este aparelho está registrado para notificações.');
      }
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      () => {
        // O handler global apresenta a notificação. Features podem adicionar
        // estado de inbox sem modificar o registro do aparelho.
      },
    );
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);

    return () => {
      active = false;
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [handleResponse]);

  useEffect(() => {
    if (!session) return;
    void Notifications.getLastNotificationResponseAsync().then(handleResponse);
  }, [handleResponse, session]);

  useEffect(() => {
    if (
      session &&
      enabled &&
      status !== 'registering' &&
      lastSyncedUserRef.current !== session.user.id &&
      autoAttemptedUserRef.current !== session.user.id
    ) {
      autoAttemptedUserRef.current = session.user.id;
      void enable();
    }
  }, [enable, enabled, session, status]);

  useEffect(() => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
    const subscription = Notifications.addPushTokenListener((nativeToken) => {
      const activeSession = sessionRef.current;
      if (
        !activeSession ||
        !enabled ||
        !expoPushToken ||
        (Platform.OS !== 'ios' && Platform.OS !== 'android')
      ) {
        return;
      }
      void notificationsGateway.registerDevice(
        {
          userId: activeSession.user.id,
          expoPushToken,
          nativePushToken:
            typeof nativeToken.data === 'string'
              ? nativeToken.data
              : JSON.stringify(nativeToken.data),
          platform: Platform.OS,
          deviceName: Device.deviceName,
        },
        activeSession.accessToken,
      );
    });
    return () => subscription.remove();
  }, [enabled, expoPushToken]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      enabled,
      status,
      statusMessage,
      expoPushToken,
      enable,
      disable,
      sendTest: scheduleTestNotification,
    }),
    [disable, enable, enabled, expoPushToken, status, statusMessage],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const value = useContext(NotificationsContext);
  if (!value) {
    throw new Error('useNotifications precisa estar dentro de NotificationsProvider');
  }
  return value;
}
