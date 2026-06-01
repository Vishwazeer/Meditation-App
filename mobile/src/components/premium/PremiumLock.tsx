import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from '../../utils/responsive';

interface PremiumLockProps {
  children: React.ReactNode;
  isPremium: boolean;
  onUpgrade: () => void;
}

export const PremiumLock = ({
  children,
  isPremium,
  onUpgrade,
}: PremiumLockProps) => {
  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <View style={s.wrapper}>
      {/* Render children underneath the overlay */}
      <View style={s.childrenDimmed}>{children}</View>

      {/* Dark overlay with lock and CTA */}
      <View style={s.overlay}>
        {/* Lock Icon */}
        <View style={s.lockCircle}>
          <Text style={s.lockIcon}>{'\u{1F512}'}</Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          onPress={onUpgrade}
          style={s.upgradeButton}
        >
          <Text style={s.upgradeText}>
            Upgrade to Premium
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderRadius: moderateScale(12),
  },
  childrenDimmed: {
    opacity: 0.4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(16),
  },
  lockCircle: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(24),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(12),
  },
  lockIcon: {
    fontSize: moderateScale(24),
  },
  upgradeButton: {
    backgroundColor: '#1B4332',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(8),
  },
  upgradeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
});
