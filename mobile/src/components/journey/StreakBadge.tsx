import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { scale, verticalScale, moderateScale } from '../../utils/responsive';

interface StreakBadgeProps {
  count: number;
  label: string;
}

export const StreakBadge = ({ count, label }: StreakBadgeProps) => {
  return (
    <View style={s.badge}>
      <Image
        source={require('../../assets/icons/New folder/Fire.png')}
        style={s.fireIcon}
      />
      <Text style={s.count}>{count}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 127, 46, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.3)',
    borderRadius: moderateScale(999),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
  },
  fireIcon: {
    width: scale(16),
    height: scale(16),
    resizeMode: 'contain',
    marginRight: scale(4),
  },
  count: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: '#ED7624',
  },
  label: {
    fontSize: moderateScale(12),
    color: '#87553E',
    marginLeft: scale(4),
  },
});
