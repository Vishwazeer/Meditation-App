/**
 * File: styles.ts
 *
 * Description: Centralized StyleSheet definitions replacing NativeWind className
 * utility classes. Provides themed styles matching the MAA design system.
 *
 * Author: Navnit(Ninjacode911)
 */

import { StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from './responsive';

export const colors = {
  primary: '#ED7624',
  primaryLight: '#FF9F59',
  primaryDark: '#5C250E',
  secondary: '#87553E',
  accent: '#ED7624',
  background: '#FFF5EE',
  surface: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#DC2626',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
  gray800: '#1F2937',
};

export const fonts = {
  sans: 'Inter',
  serif: 'PlayfairDisplay',
};

export const gs = StyleSheet.create({
  // Layout
  flex1: { flex: 1 },
  flexRow: { flexDirection: 'row' },
  flexWrap: { flexWrap: 'wrap' },
  itemsCenter: { alignItems: 'center' },
  justifyCenter: { justifyContent: 'center' },
  justifyBetween: { justifyContent: 'space-between' },
  justifyEnd: { justifyContent: 'flex-end' },
  selfEnd: { alignSelf: 'flex-end' },

  // Background
  bgBackground: { backgroundColor: colors.background },
  bgSurface: { backgroundColor: colors.surface },
  bgPrimary: { backgroundColor: colors.primary },
  bgPrimaryLight: { backgroundColor: colors.primaryLight },
  bgPrimaryDark: { backgroundColor: colors.primaryDark },
  bgAccent: { backgroundColor: colors.accent },
  bgWhite: { backgroundColor: colors.white },
  bgGray50: { backgroundColor: colors.gray50 },
  bgGray100: { backgroundColor: colors.gray100 },
  bgGray200: { backgroundColor: colors.gray200 },
  bgError: { backgroundColor: colors.error },

  // Text Colors
  textPrimary: { color: colors.primary },
  textPrimaryDark: { color: colors.primaryDark },
  textWhite: { color: colors.white },
  textAccent: { color: colors.accent },
  textMain: { color: colors.textPrimary },
  textSecondary: { color: colors.textSecondary },
  textGray400: { color: colors.gray400 },
  textGray500: { color: colors.gray500 },
  textGray700: { color: colors.gray700 },
  textGray800: { color: colors.gray800 },
  textError: { color: colors.error },

  // Font Sizes (moderately scaled)
  textXs: { fontSize: moderateScale(12) },
  textSm: { fontSize: moderateScale(14) },
  textBase: { fontSize: moderateScale(16) },
  textLg: { fontSize: moderateScale(18) },
  textXl: { fontSize: moderateScale(20) },
  text2xl: { fontSize: moderateScale(24) },
  text3xl: { fontSize: moderateScale(30) },
  text4xl: { fontSize: moderateScale(36) },

  // Font Weight
  fontBold: { fontWeight: 'bold' },
  fontSemibold: { fontWeight: '600' },
  fontMedium: { fontWeight: '500' },

  // Font Family
  fontSerif: { fontFamily: fonts.serif },
  fontSans: { fontFamily: fonts.sans },

  // Spacing
  p4: { padding: scale(16) },
  p5: { padding: scale(20) },
  p6: { padding: scale(24) },
  px4: { paddingHorizontal: scale(16) },
  px6: { paddingHorizontal: scale(24) },
  px8: { paddingHorizontal: scale(32) },
  py2: { paddingVertical: verticalScale(8) },
  py3: { paddingVertical: verticalScale(12) },
  py4: { paddingVertical: verticalScale(16) },
  pt4: { paddingTop: verticalScale(16) },
  pb2: { paddingBottom: verticalScale(8) },
  mt1: { marginTop: verticalScale(4) },
  mt2: { marginTop: verticalScale(8) },
  mt3: { marginTop: verticalScale(12) },
  mt4: { marginTop: verticalScale(16) },
  mt6: { marginTop: verticalScale(24) },
  mb2: { marginBottom: verticalScale(8) },
  mb3: { marginBottom: verticalScale(12) },
  mb4: { marginBottom: verticalScale(16) },
  mb6: { marginBottom: verticalScale(24) },
  mb8: { marginBottom: verticalScale(32) },
  mb10: { marginBottom: verticalScale(40) },
  mr2: { marginRight: scale(8) },
  mr3: { marginRight: scale(12) },
  mx3: { marginHorizontal: scale(12) },
  mx6: { marginHorizontal: scale(24) },

  // Border
  border: { borderWidth: 1, borderColor: colors.border },
  borderR: { borderRightWidth: 1, borderRightColor: colors.border },
  borderT: { borderTopWidth: 1, borderTopColor: colors.border },
  borderB: { borderBottomWidth: 1, borderBottomColor: colors.border },
  roundedXl: { borderRadius: moderateScale(12) },
  roundedCard: { borderRadius: moderateScale(12) },
  roundedButton: { borderRadius: moderateScale(8) },
  roundedPill: { borderRadius: moderateScale(24) },
  roundedFull: { borderRadius: moderateScale(9999) },

  // Width/Height
  wFull: { width: '100%' },
  hPx: { height: 1 },

  // Overflow
  overflowHidden: { overflow: 'hidden' },

  // Text align
  textCenter: { textAlign: 'center' },

  // Uppercase
  uppercase: { textTransform: 'uppercase' },
  trackingWide: { letterSpacing: moderateScale(2) },
});

