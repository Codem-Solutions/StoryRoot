import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, spacing } from '../theme';

const MAX_ML_SERINGA = 5;
const MAX_ML_COPO = 10;

function extrairMl(dosagem: string, max: number): number {
  const match = dosagem.match(/(\d+([.,]\d+)?)/);
  if (!match) return 0;
  return Math.min(max, Math.max(0, parseFloat(match[1].replace(',', '.'))));
}

function formatarMl(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(1);
}

interface DosageIllustrationProps {
  forma: 'Seringa' | 'Copo dosador';
  dosagem: string;
}

export function DosageIllustration({ forma, dosagem }: DosageIllustrationProps) {
  return (
    <View style={styles.wrapper}>
      {forma === 'Seringa' ? (
        <Seringa dosagem={dosagem} />
      ) : (
        <CopoDosador dosagem={dosagem} />
      )}
    </View>
  );
}

function Seringa({ dosagem }: { dosagem: string }) {
  const ml = extrairMl(dosagem, MAX_ML_SERINGA);
  const fracao = ml / MAX_ML_SERINGA;

  const barrelX = 30;
  const barrelW = 150;
  const barrelY = 34;
  const barrelH = 32;
  const fillW = fracao * barrelW;

  const ticks = Array.from({ length: MAX_ML_SERINGA + 1 }, (_, i) => i);

  return (
    <Svg width="100%" height={110} viewBox="0 0 220 110">
      {/* bico (sem agulha) */}
      <Rect x={16} y={barrelY + 10} width={14} height={12} rx={2} fill={colors.border} />
      <Rect
        x={8}
        y={barrelY + 13}
        width={8}
        height={6}
        rx={1.5}
        fill={colors.textMuted}
      />

      {/* corpo da seringa */}
      <Rect
        x={barrelX}
        y={barrelY}
        width={barrelW}
        height={barrelH}
        rx={4}
        fill={colors.surface}
        stroke={colors.primary}
        strokeWidth={2}
      />

      {/* líquido */}
      {fillW > 0 && (
        <Rect
          x={barrelX + 2}
          y={barrelY + 2}
          width={Math.max(0, fillW - 4)}
          height={barrelH - 4}
          rx={2}
          fill={colors.violet}
          opacity={0.55}
        />
      )}

      {/* êmbolo (pistão) na marca da dose */}
      <Rect
        x={barrelX + fillW - 2}
        y={barrelY - 4}
        width={4}
        height={barrelH + 8}
        fill={colors.primaryDark}
      />

      {/* marcações de mL */}
      {ticks.map(i => {
        const x = barrelX + (i / MAX_ML_SERINGA) * barrelW;
        return (
          <React.Fragment key={i}>
            <Line
              x1={x}
              y1={barrelY}
              x2={x}
              y2={barrelY - 8}
              stroke={colors.textMuted}
              strokeWidth={1.5}
            />
            <SvgText
              x={x}
              y={barrelY - 12}
              fontSize={10}
              fill={colors.textMuted}
              textAnchor="middle">
              {i}
            </SvgText>
          </React.Fragment>
        );
      })}
      <SvgText
        x={barrelX + barrelW + 14}
        y={barrelY + barrelH / 2 + 4}
        fontSize={10}
        fill={colors.textMuted}>
        mL
      </SvgText>

      {/* haste + rebite do êmbolo, à direita */}
      <Rect
        x={barrelX + barrelW}
        y={barrelY + barrelH / 2 - 2}
        width={26}
        height={4}
        fill={colors.border}
      />
      <Rect
        x={barrelX + barrelW + 24}
        y={barrelY - 6}
        width={8}
        height={barrelH + 12}
        rx={2}
        fill={colors.border}
      />

      {/* dose selecionada */}
      <SvgText
        x={barrelX + barrelW / 2}
        y={barrelY + barrelH + 22}
        fontSize={12}
        fontWeight="bold"
        fill={colors.primary}
        textAnchor="middle">
        {formatarMl(ml)} mL
      </SvgText>
    </Svg>
  );
}

function CopoDosador({ dosagem }: { dosagem: string }) {
  const ml = extrairMl(dosagem, MAX_ML_COPO);
  const fracao = ml / MAX_ML_COPO;

  const topY = 14;
  const bottomY = 144;
  const topXLeft = 18;
  const topXRight = 112;
  const bottomXLeft = 40;
  const bottomXRight = 90;

  function edge(f: number) {
    const y = bottomY - f * (bottomY - topY);
    const xLeft = bottomXLeft + f * (topXLeft - bottomXLeft);
    const xRight = bottomXRight + f * (topXRight - bottomXRight);
    return { y, xLeft, xRight };
  }

  const marcas = [0.25, 0.5, 0.75, 1];
  const fill = edge(fracao);
  const base = edge(0);

  const fillPath = `M ${base.xLeft} ${base.y} L ${base.xRight} ${base.y} L ${fill.xRight} ${fill.y} L ${fill.xLeft} ${fill.y} Z`;

  return (
    <Svg width="100%" height={170} viewBox="0 0 140 170">
      {/* contorno do copo */}
      <Path
        d={`M ${topXLeft} ${topY} L ${topXRight} ${topY} L ${bottomXRight} ${bottomY} L ${bottomXLeft} ${bottomY} Z`}
        fill="none"
        stroke={colors.primary}
        strokeWidth={2}
      />

      {/* líquido preenchido até a dose exata */}
      {fracao > 0 && <Path d={fillPath} fill={colors.accent} opacity={0.55} />}

      {/* marcações padrão */}
      {marcas.map(f => {
        const e = edge(f);
        const destacado = Math.abs(f - fracao) < 0.02;
        return (
          <React.Fragment key={f}>
            <Line
              x1={e.xLeft}
              y1={e.y}
              x2={e.xRight}
              y2={e.y}
              stroke={destacado ? colors.primaryDark : colors.border}
              strokeWidth={destacado ? 2.5 : 1.5}
            />
            <SvgText x={e.xRight + 6} y={e.y + 3} fontSize={9} fill={colors.textMuted}>
              {formatarMl(f * MAX_ML_COPO)} mL
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* linha grossa na dose exata escolhida, quando fora das marcas padrão */}
      <Line
        x1={fill.xLeft}
        y1={fill.y}
        x2={fill.xRight}
        y2={fill.y}
        stroke={colors.primaryDark}
        strokeWidth={3}
      />

      <SvgText
        x={(bottomXLeft + bottomXRight) / 2}
        y={bottomY + 20}
        fontSize={12}
        fontWeight="bold"
        fill={colors.primary}
        textAnchor="middle">
        {formatarMl(ml)} mL
      </SvgText>
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
