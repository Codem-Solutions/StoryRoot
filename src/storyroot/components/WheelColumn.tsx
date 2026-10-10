import React, { useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, typography } from '../theme';

export const WHEEL_ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
export const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * VISIBLE_ITEMS;
const PADDING = (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2;

interface WheelColumnProps {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export function WheelColumn({ values, selectedIndex, onChange }: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);

  function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(values.length - 1, index));
    if (clamped !== selectedIndex) onChange(clamped);
  }

  return (
    <View style={styles.wrapper}>
      <View pointerEvents="none" style={styles.highlight} />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: PADDING }}
        contentOffset={{ x: 0, y: selectedIndex * WHEEL_ITEM_HEIGHT }}
        onMomentumScrollEnd={handleMomentumEnd}>
        {values.map((v, i) => (
          <View key={`${v}-${i}`} style={styles.item}>
            <Text
              style={[
                typography.h3,
                styles.itemText,
                i === selectedIndex && styles.itemTextActive,
              ]}>
              {v}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 72,
    height: WHEEL_HEIGHT,
  },
  highlight: {
    position: 'absolute',
    top: PADDING,
    left: 0,
    right: 0,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTint,
  },
  item: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    color: colors.placeholder,
    fontSize: 20,
  },
  itemTextActive: {
    color: colors.primary,
    fontSize: 24,
  },
});
