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
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import type { ColorPalette } from '@/theme/tokens';

type ToastKind = 'success' | 'error' | 'info';
type ToastApi = { show(message: string, kind?: ToastKind, durationMs?: number): void };
const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const show = useCallback((message: string, kind: ToastKind = 'info', durationMs = 3200) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ message, kind });
    timeoutRef.current = setTimeout(() => setToast(null), durationMs);
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View accessibilityLiveRegion="polite" style={[styles.toast, styles[toast.kind]]}>
          <Text style={styles.text}>{toast.message}</Text>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast precisa estar dentro de ToastProvider');
  return value;
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    toast: {
      position: 'absolute',
      left: 20,
      right: 20,
      bottom: 28,
      borderRadius: 18,
      paddingHorizontal: 18,
      paddingVertical: 15,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 18,
      elevation: 8,
    },
    info: { backgroundColor: colors.ink },
    success: { backgroundColor: colors.brandStrong },
    error: { backgroundColor: colors.danger },
    text: {
      color: colors.canvas,
      fontFamily: 'DMSans_700Bold',
      textAlign: 'center',
    },
  });
}
