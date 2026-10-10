import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { useAuth } from '@/features/auth/auth-provider';
import type { Plan } from '@/features/purchases/domain/purchases';
import { purchasesGateway } from '@/features/purchases/services/revenuecat-gateway';

type PurchasesContextValue = {
  loading: boolean;
  isPremium: boolean;
  plans: Plan[];
  purchase(plan: Plan): Promise<boolean>;
  restore(): Promise<boolean>;
  refresh(): Promise<void>;
};

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

export function PurchasesProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isPremium, setPremium] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);

  const refresh = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      await purchasesGateway.configure(session.user.id);
      const state = await purchasesGateway.getState();
      setPremium(state.isPremium);
      setPlans(state.plans);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const timeout = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timeout);
  }, [refresh]);

  const purchase = useCallback(async (plan: Plan) => {
    setLoading(true);
    try {
      const active = await purchasesGateway.purchase(plan);
      setPremium(active);
      return active;
    } finally {
      setLoading(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setLoading(true);
    try {
      const active = await purchasesGateway.restore();
      setPremium(active);
      return active;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ loading, isPremium, plans, purchase, restore, refresh }),
    [isPremium, loading, plans, purchase, refresh, restore],
  );

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases() {
  const value = useContext(PurchasesContext);
  if (!value) throw new Error('usePurchases precisa estar dentro de PurchasesProvider');
  return value;
}
