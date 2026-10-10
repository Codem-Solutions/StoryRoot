import { useMemo, type PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import type { ColorPalette } from '@/theme/tokens';

type Props = PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose(): void;
}>;

export function AppModal({ visible, title, onClose, children }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Fechar modal"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityViewIsModal style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={onClose}>
              <Text style={styles.close}>Fechar</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ColorPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.48)',
    },
    card: {
      maxHeight: '85%',
      backgroundColor: colors.surfaceElevated,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      paddingBottom: 36,
      gap: 20,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    title: {
      color: colors.ink,
      fontFamily: 'Newsreader_600SemiBold',
      fontSize: 26,
    },
    close: {
      color: colors.brandStrong,
      fontFamily: 'DMSans_700Bold',
    },
  });
}
