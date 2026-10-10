import { colors } from './colors';

export const fonts = {
  headingBlack: 'Inter_900Black',
  headingExtraBold: 'Inter_800ExtraBold',
  bodyRegular: 'PlusJakartaSans_400Regular',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
  bodyExtraBold: 'PlusJakartaSans_800ExtraBold',
};

export const typography = {
  h1: {
    fontFamily: fonts.headingBlack,
    fontSize: 32,
    lineHeight: 38,
    color: colors.primaryDark,
  },
  h2: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 24,
    lineHeight: 29,
    color: colors.text,
  },
  h3: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 20,
    lineHeight: 24,
    color: colors.text,
  },
  h4: {
    fontFamily: fonts.headingExtraBold,
    fontSize: 16,
    lineHeight: 19,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.bodyRegular,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  bodySmall: {
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  caption: {
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    lineHeight: 15,
    color: colors.placeholder,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  button: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.surface,
  },
};
