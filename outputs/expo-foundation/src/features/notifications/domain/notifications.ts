export type NotificationRoute = 'home' | 'profile' | 'paywall';

export type DeviceRegistration = {
  userId: string;
  expoPushToken: string;
  nativePushToken?: string;
  platform: 'ios' | 'android';
  deviceName?: string | null;
};

export interface NotificationsGateway {
  registerDevice(
    registration: DeviceRegistration,
    accessToken?: string,
  ): Promise<void>;
  unregisterDevice(expoPushToken: string, accessToken?: string): Promise<void>;
  updatePreference(
    userId: string,
    enabled: boolean,
    accessToken?: string,
  ): Promise<void>;
}
