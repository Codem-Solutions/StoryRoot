import { z } from 'zod';

const envSchema = z.object({
  appName: z.string().min(1),
  apiUrl: z.url(),
  revenueCatAppleKey: z.string().optional(),
  revenueCatGoogleKey: z.string().optional(),
  entitlement: z.string().min(1),
  notificationsEndpoint: z.url().optional(),
});

export const env = envSchema.parse({
  appName: process.env.EXPO_PUBLIC_APP_NAME ?? 'Foundation',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com',
  revenueCatAppleKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY,
  revenueCatGoogleKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY,
  entitlement: process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT ?? 'premium',
  notificationsEndpoint:
    process.env.EXPO_PUBLIC_NOTIFICATIONS_ENDPOINT || undefined,
});
