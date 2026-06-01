/**
 * File: ErrorBanner.tsx
 *
 * Description: Inline error banner shown above content when an API call has
 * failed. Surfaces a concrete message instead of the silent-fallback-to-mock
 * pattern, with a retry callback so the user can recover without leaving the
 * screen. Use this for non-fatal screen-level errors; prefer Alert.alert for
 * destructive confirmations.
 *
 * Author: Navnit(Ninjacode911)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AccessibilityInfo } from 'react-native';
import { colors } from '../../utils/styles';
import { scale, verticalScale, moderateScale } from '../../utils/responsive';

export interface ErrorBannerProps {
  /** Short message shown to the user (1 sentence). */
  message: string;
  /** Optional retry callback — when present, a "Retry" button is rendered. */
  onRetry?: () => void;
  /** Visual variant: 'soft' inline (default), or 'prominent' for full-card warnings. */
  variant?: 'soft' | 'prominent';
}

export const ErrorBanner = ({ message, onRetry, variant = 'soft' }: ErrorBannerProps) => {
  React.useEffect(() => {
    // Announce via screen reader so non-sighted users notice the failure.
    AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  return (
    <View
      style={[s.container, variant === 'prominent' && s.containerProminent]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={s.icon}>{'⚠'}</Text>
      <Text style={s.message} numberOfLines={3}>
        {message}
      </Text>
      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          style={s.retryButton}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text style={s.retryText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(12),
    marginHorizontal: scale(16),
    marginVertical: verticalScale(8),
    gap: scale(10),
  },
  containerProminent: {
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
  },
  icon: {
    fontSize: moderateScale(16),
  },
  message: {
    flex: 1,
    color: colors.error,
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
  },
  retryButton: {
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(6),
    backgroundColor: colors.error,
  },
  retryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: moderateScale(12),
    letterSpacing: scale(0.3),
  },
});

export default ErrorBanner;
