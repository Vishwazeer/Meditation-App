import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

export const TAB_ICONS: Record<string, ImageSourcePropType> = {
  Journey: require('../assets/icons/New folder/My journey.png'),
  Courses: require('../assets/icons/New folder/Courses.png'),
  Home: require('../assets/icons/New folder/Home.png'),
  Directory: require('../assets/icons/New folder/Directory.png'),
  Profile: require('../assets/icons/New folder/Profile.png'),
};

export const CustomTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { bottom: Math.max(insets.bottom, verticalScale(10)) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;
        const isCenter = route.name === 'Home';
        const icon = TAB_ICONS[route.name] || TAB_ICONS.Home;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={`tab-${route.name}`}
            onPress={onPress}
            style={s.tabButton}
          >
            {isCenter ? (
              <View style={s.centerIcon}>
                <Image
                  source={icon}
                  style={[
                    s.centerIconImage,
                    isFocused ? s.iconFocused : s.iconUnfocused,
                  ]}
                />
              </View>
            ) : (
              <Image
                source={icon}
                style={[
                  (route.name === 'Journey' || route.name === 'Directory' || route.name === 'Profile')
                    ? s.iconImageBigger
                    : s.iconImage,
                  isFocused ? s.iconFocused : s.iconUnfocused,
                ]}
              />
            )}
            <Text
              style={[
                s.label,
                isFocused ? s.labelFocused : s.labelUnfocused,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {label as string}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    left: scale(12),
    right: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    height: verticalScale(64),
    backgroundColor: '#FFF9F5',
    paddingVertical: verticalScale(7),
    paddingHorizontal: scale(10),
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
    shadowColor: '#7A3E1E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 14,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(50),
  },

  centerIcon: {
    width: scale(42),
    height: scale(42),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(2),
  },
  centerIconImage: {
    width: scale(42),
    height: scale(42),
    minWidth: 42,
    minHeight: 42,
    resizeMode: 'contain',
  },
  iconImage: {
    width: scale(28),
    height: scale(28),
    minWidth: 28,
    minHeight: 28,
    borderRadius: moderateScale(8),
    resizeMode: 'contain',
  },
  iconImageBigger: {
    width: scale(42),
    height: scale(42),
    minWidth: 42,
    minHeight: 42,
    borderRadius: moderateScale(8),
    resizeMode: 'contain',
  },
  iconFocused: {
    opacity: 1,
  },
  iconUnfocused: {
    opacity: 0.55,
  },
  label: {
    fontSize: moderateScale(10),
    marginTop: verticalScale(2),
  },
  labelFocused: {
    color: '#ED7624',
    fontWeight: '700',
  },
  labelUnfocused: {
    color: '#9F9693',
  },
});
