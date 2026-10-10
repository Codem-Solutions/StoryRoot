export const lightColors = {
  canvas: '#F2EFE8',
  surface: '#FCFAF5',
  surfaceElevated: '#FFFFFF',
  ink: '#17211B',
  muted: '#647069',
  line: '#DAD8CE',
  brand: '#1D563B',
  brandStrong: '#123D29',
  accent: '#D6FF4B',
  danger: '#A13D2D',
  white: '#FFFFFF',
  overlay: 'rgba(23, 33, 27, 0.08)',
} as const;

export const darkColors: ColorPalette = {
  canvas: '#0E1511',
  surface: '#16201A',
  surfaceElevated: '#1C2921',
  ink: '#F3F6F1',
  muted: '#A7B3AA',
  line: '#334138',
  brand: '#72C996',
  brandStrong: '#A3E2BC',
  accent: '#C9F45A',
  danger: '#FF9B87',
  white: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.28)',
};

export type ColorPalette = {
  [Key in keyof typeof lightColors]: string;
};

/** @deprecated Use `useTheme().colors` in components that support themes. */
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 18,
  lg: 28,
  pill: 999,
} as const;

export const typography = {
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
  display: 'Newsreader_600SemiBold',
  displayItalic: 'Newsreader_600SemiBold_Italic',
} as const;
