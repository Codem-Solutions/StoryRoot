import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type PurchasesPackage } from 'react-native-purchases';

import { env } from '@/config/env';
import type {
  Plan,
  PurchaseState,
  PurchasesGateway,
} from '@/features/purchases/domain/purchases';

const fallbackPlans: Plan[] = [
  {
    id: 'annual',
    title: 'Anual',
    subtitle: '7 dias grátis, depois renovação anual',
    price: 'R$ 199,90 / ano',
    badge: 'Economize 42%',
  },
  {
    id: 'monthly',
    title: 'Mensal',
    subtitle: 'Flexibilidade para cancelar quando quiser',
    price: 'R$ 28,90 / mês',
  },
];

let configured = false;
let nativePackages = new Map<string, PurchasesPackage>();

function getApiKey() {
  return Platform.OS === 'ios'
    ? env.revenueCatAppleKey
    : env.revenueCatGoogleKey;
}

function hasEntitlement(customerInfo: Awaited<ReturnType<typeof Purchases.getCustomerInfo>>) {
  return Boolean(customerInfo.entitlements.active[env.entitlement]);
}

export const purchasesGateway: PurchasesGateway = {
  async configure(userId) {
    const apiKey = getApiKey();
    if (!apiKey || configured || Platform.OS === 'web') return;
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey, appUserID: userId });
    configured = true;
  },

  async getState(): Promise<PurchaseState> {
    if (!getApiKey() || Platform.OS === 'web') {
      return { isPremium: false, plans: fallbackPlans };
    }

    const [offerings, customerInfo] = await Promise.all([
      Purchases.getOfferings(),
      Purchases.getCustomerInfo(),
    ]);
    const packages = offerings.current?.availablePackages ?? [];
    nativePackages = new Map(packages.map((item) => [item.identifier, item]));

    return {
      isPremium: hasEntitlement(customerInfo),
      plans: packages.length
        ? packages.map((item) => ({
            id: item.identifier,
            packageId: item.identifier,
            title: item.product.title,
            subtitle: item.product.description,
            price: item.product.priceString,
          }))
        : fallbackPlans,
    };
  },

  async purchase(plan) {
    const nativePackage = plan.packageId ? nativePackages.get(plan.packageId) : undefined;
    if (!getApiKey() || !nativePackage || Platform.OS === 'web') {
      await new Promise((resolve) => setTimeout(resolve, 900));
      return true;
    }
    const { customerInfo } = await Purchases.purchasePackage(nativePackage);
    return hasEntitlement(customerInfo);
  },

  async restore() {
    if (!getApiKey() || Platform.OS === 'web') return false;
    return hasEntitlement(await Purchases.restorePurchases());
  },
};
