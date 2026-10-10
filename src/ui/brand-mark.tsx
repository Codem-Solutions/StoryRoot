import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, typography } from '@/theme/tokens';

export function BrandMark() {
  return (
    <View style={styles.mark}>
      <Text style={styles.letter}>F</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.brandStrong,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-7deg' }],
  },
  letter: {
    color: colors.accent,
    fontFamily: typography.displayItalic,
    fontSize: 28,
    transform: [{ rotate: '7deg' }],
  },
});
