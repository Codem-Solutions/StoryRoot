export type Plan = {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  badge?: string;
  packageId?: string;
};

export type PurchaseState = {
  isPremium: boolean;
  plans: Plan[];
};

export interface PurchasesGateway {
  configure(userId: string): Promise<void>;
  getState(): Promise<PurchaseState>;
  purchase(plan: Plan): Promise<boolean>;
  restore(): Promise<boolean>;
}
