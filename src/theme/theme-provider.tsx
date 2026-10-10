import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme } from 'react-native';

import {
  darkColors,
  lightColors,
  radius,
  spacing,
  typography,
  type ColorPalette,
} from '@/theme/tokens';

const THEME_KEY = 'foundation.theme.preference.v1';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

type AppTheme = {
  colors: ColorPalette;
  radius: typeof radius;
  spacing: typeof spacing;
  typography: typeof typography;
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference(preference: ThemePreference): Promise<void>;
};

const ThemeContext = createContext<AppTheme | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    void AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setPreferenceState(saved);
      }
    }).catch(() => undefined);
  }, []);

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    await AsyncStorage.setItem(THEME_KEY, next).catch(() => undefined);
  }, []);

  const resolved: ResolvedTheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<AppTheme>(
    () => ({
      colors: resolved === 'dark' ? darkColors : lightColors,
      radius,
      spacing,
      typography,
      preference,
      resolved,
      setPreference,
    }),
    [preference, resolved, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme precisa estar dentro de ThemeProvider');
  return value;
}
