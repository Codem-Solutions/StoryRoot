import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, spacing } from '../theme';

/** Ilustração esquemática (perfil) da pega correta do bebê no peito. */
export function PegaCorretaIlustracao() {
  return (
    <View style={styles.wrapper}>
      <Svg width="100%" height={140} viewBox="0 0 240 140">
        {/* peito */}
        <Path
          d="M 30 120 C 30 60 70 20 110 20 C 150 20 170 55 168 90 C 166 112 150 122 130 122 L 30 122 Z"
          fill={colors.accent}
          fillOpacity={0.18}
          stroke={colors.accent}
          strokeWidth={2}
        />
        {/* auréola / mamilo */}
        <Circle cx={150} cy={78} r={16} fill={colors.accent} fillOpacity={0.35} />

        {/* cabeça do bebê (perfil), boca bem aberta cobrindo a auréola */}
        <Path
          d="M 236 96 C 236 60 206 30 176 34 C 158 36 146 48 140 62 C 132 62 122 70 122 82 C 122 94 132 100 142 100 C 148 112 162 122 180 122 C 210 122 236 128 236 96 Z"
          fill={colors.surface}
          stroke={colors.primary}
          strokeWidth={2.5}
        />

        {/* nariz, alinhado ao mamilo, livre para respirar */}
        <Path
          d="M 140 62 L 132 66"
          stroke={colors.primary}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />

        {/* queixo tocando o peito */}
        <Circle cx={142} cy={100} r={3} fill={colors.primaryDark} />
        <Circle cx={150} cy={78} r={3} fill={colors.primaryDark} />
      </Svg>
    </View>
  );
}

/** Ilustração esquemática da ordenha de estímulo (mão em "C" ao redor da auréola). */
export function OrdenhaEstimuloIlustracao() {
  return (
    <View style={styles.wrapper}>
      <Svg width="100%" height={140} viewBox="0 0 240 140">
        {/* peito */}
        <Path
          d="M 60 120 C 40 90 40 40 100 24 C 160 40 160 90 140 120 Z"
          fill={colors.accent}
          fillOpacity={0.18}
          stroke={colors.accent}
          strokeWidth={2}
        />
        <Circle cx={100} cy={90} r={16} fill={colors.accent} fillOpacity={0.35} />

        {/* mão em "C" ao redor da auréola */}
        <Path
          d="M 60 70 C 40 78 40 104 60 112"
          stroke={colors.primary}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M 140 70 C 160 78 160 104 140 112"
          stroke={colors.primary}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
        />

        {/* setas indicando o movimento de compressão suave para trás e liberação */}
        <Path
          d="M 55 65 L 68 72"
          stroke={colors.primaryDark}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M 145 65 L 132 72"
          stroke={colors.primaryDark}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
