import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';

interface BottomSheetProps {
  onClose: () => void;
  children: React.ReactNode;
  /** Set false for shorter sheets (e.g. audio recorder, confirmation pickers). */
  fillHeight?: boolean;
}

/**
 * Renders via RN's native `Modal` (like `DatePickerSheet`) instead of a plain View, so it
 * always portals above the current screen — including the floating tab bar — regardless of
 * where it's mounted (e.g. rendered locally inside a tab screen instead of as a root stack
 * screen). A plain View here would get visually clipped/stuck behind sibling-level overlays
 * such as `FloatingTabBar`.
 */
export function BottomSheet({ onClose, children, fillHeight = true }: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent>
      <GestureHandlerRootView style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTap} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={[
              styles.sheet,
              fillHeight ? styles.sheetFillHeight : styles.sheetCompact,
              { paddingBottom: Math.max(insets.bottom, spacing.xxl) },
            ]}>
            <View style={styles.grabberRow}>
              <View style={styles.grabber} />
            </View>
            {children}
          </View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,13,19,0.6)',
    elevation: 20,
    zIndex: 20,
  },
  overlayTap: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    maxHeight: '100%',
    elevation: 20,
    zIndex: 20,
    
  },
  sheetFillHeight: {
    height: '80%',
    minHeight: '80%',
  },
  sheetCompact: {
    height: '80%',
    minHeight: '42%',
    marginHorizontal: 2,
  },
  grabberRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.xxl,
    gap: 20,
    display: "none"
  },
  grabber: {
    width: 48,
    height: 8,
    borderRadius: 2.5,
    backgroundColor: colors.border,
  },
});
