import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import type { Session } from '@/features/auth/domain/auth';
import { configureApiClient } from '@/core/api/api-client';
import { authGateway } from '@/features/auth/services/demo-auth-gateway';
import {
  authenticateWithBiometrics,
  getBiometricCapability,
  type BiometricCapability,
} from '@/features/auth/services/biometrics';

const SESSION_KEY = 'foundation.session.v1';
const BIOMETRIC_KEY = 'foundation.biometrics.enabled';

type AuthStatus = 'booting' | 'unauthenticated' | 'locked' | 'authenticated';

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  biometrics: BiometricCapability;
  biometricsEnabled: boolean;
  signIn(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  setBiometricsEnabled(enabled: boolean): Promise<boolean>;
  unlock(): Promise<boolean>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('booting');
  const [session, setSession] = useState<Session | null>(null);
  const [biometrics, setBiometrics] = useState<BiometricCapability>({
    available: false,
    label: 'biometria',
  });
  const [biometricsEnabled, setBiometricsEnabledState] = useState(false);

  useEffect(() => {
    void Promise.all([
      SecureStore.getItemAsync(SESSION_KEY),
      SecureStore.getItemAsync(BIOMETRIC_KEY),
      getBiometricCapability(),
    ]).then(([savedSession, savedBiometrics, capability]) => {
      setBiometrics(capability);
      setBiometricsEnabledState(savedBiometrics === 'true');
      if (!savedSession) {
        setStatus('unauthenticated');
        return;
      }
      setSession(JSON.parse(savedSession) as Session);
      setStatus(savedBiometrics === 'true' && capability.available ? 'locked' : 'authenticated');
    });
  }, []);

  const persistSession = useCallback(async (nextSession: Session) => {
    setSession(nextSession);
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(nextSession), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    setStatus('authenticated');
  }, []);

  useEffect(() => {
    configureApiClient({
      getAccessToken: () => session?.accessToken ?? null,
      refreshAccessToken: session
        ? async () => {
            const refreshed = await authGateway.refresh(session.refreshToken);
            await persistSession(refreshed);
            return refreshed.accessToken;
          }
        : undefined,
    });
  }, [persistSession, session]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await persistSession(await authGateway.signIn(email, password));
    },
    [persistSession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await persistSession(await authGateway.register(name, email, password));
    },
    [persistSession],
  );

  const setBiometricsEnabled = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        const capability = await getBiometricCapability();
        setBiometrics(capability);
        if (!capability.available) return false;
        const result = await authenticateWithBiometrics();
        if (!result.success) return false;
      }
      await SecureStore.setItemAsync(BIOMETRIC_KEY, String(enabled));
      setBiometricsEnabledState(enabled);
      return true;
    },
    [],
  );

  const unlock = useCallback(async () => {
    const result = await authenticateWithBiometrics();
    if (result.success && session) setStatus('authenticated');
    return result.success;
  }, [session]);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setSession(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      biometrics,
      biometricsEnabled,
      signIn,
      register,
      requestPasswordReset: authGateway.requestPasswordReset,
      setBiometricsEnabled,
      unlock,
      signOut,
    }),
    [
      biometrics,
      biometricsEnabled,
      register,
      session,
      setBiometricsEnabled,
      signIn,
      signOut,
      status,
      unlock,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return value;
}
