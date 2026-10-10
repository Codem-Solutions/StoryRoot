import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RECORD_TYPES } from '../constants/recordTypes';
import { colors, radius, spacing, typography } from '../theme';
import type { TipoRegistro } from '../types';

interface RecordTypeCardProps {
  tipo: TipoRegistro;
  onPress: () => void;
}

export function RecordTypeCard({ tipo, onPress }: RecordTypeCardProps) {
  const meta = RECORD_TYPES[tipo];
  const Icon = meta.icon;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.card}>
      <View style={[styles.circle, { backgroundColor: meta.color }]}>
        <Icon size={20} color="#fff" />
      </View>
      <Text
        style={[typography.label, styles.label]}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {meta.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    flexBasis: '22%',
    flexGrow: 1,
    paddingHorizontal: spacing.xs,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
  },
});
