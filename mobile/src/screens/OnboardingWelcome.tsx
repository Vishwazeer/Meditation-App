/**
 * File: OnboardingWelcome.tsx
 *
 * Description: First screen of the onboarding flow displaying app branding,
 * mission statement, and entry point to begin personalization or skip ahead.
 *
 * Author: Navnit(Ninjacode911)
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { OnboardingStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import apiClient from '../services/api';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingWelcome'>;

const OnboardingWelcome = () => {
  const navigation = useNavigation<NavigationProp>();
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const [isSkipping, setIsSkipping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const checkConnection = async () => {
      try {
        await apiClient.get('/health');
      } catch (err) {
        if (cancelled || !__DEV__) return;
        console.warn('[Onboarding] Backend unreachable on mount:', err);
        Alert.alert(
          'Connection Issue',
          'The app cannot reach the backend right now. Make sure the backend server is running and that your mobile/.env API_BASE_URL is set correctly for your setup (see docs/REQUIREMENTS.md).',
        );
      }
    };
    checkConnection();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSkip = async () => {
    if (isSkipping) return;
    setIsSkipping(true);
    try {
      await completeOnboarding(['meditation', 'mindfulness'], 10);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      Alert.alert('Could not complete onboarding', message);
    } finally {
      setIsSkipping(false);
    }
  };

  const handleGetStarted = () => {
    navigation.navigate('OnboardingInterests');
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.container}>
        <TouchableOpacity
          onPress={handleSkip}
          style={s.skipBtn}
          disabled={isSkipping}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={[s.skipText, isSkipping && s.skipTextDisabled]}>
            {isSkipping ? 'Skipping…' : 'Skip'}
          </Text>
        </TouchableOpacity>

        <View style={s.centerContent}>
          <View style={s.iconCircle}>
            <Text style={s.iconText}>{'🌸'}</Text>
          </View>

          <Text style={s.brandLabel}>
            Mata Amritanandamayi App
          </Text>

          <Text style={s.headline}>
            Begin your{'\n'}journey within
          </Text>

          <Text style={s.description}>
            Discover peace through meditation, yoga, pranayama, and spiritual wisdom guided by ancient traditions.
          </Text>
        </View>

        <View style={s.bottomSection}>
          <TouchableOpacity
            style={s.getStartedBtn}
            onPress={handleGetStarted}
            accessibilityRole="button"
            accessibilityLabel="Get started"
          >
            <Text style={s.getStartedText}>Get Started</Text>
          </TouchableOpacity>

          <View style={s.dotsRow}>
            <View style={s.dotActive} />
            <View style={s.dotInactive} />
            <View style={s.dotInactive} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF5EE',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(32),
  },
  skipBtn: {
    alignSelf: 'flex-end',
  },
  skipText: {
    color: '#87553E',
    fontSize: moderateScale(16),
  },
  skipTextDisabled: {
    opacity: 0.5,
  },
  centerContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconCircle: {
    width: scale(96),
    height: scale(96),
    borderRadius: scale(48),
    backgroundColor: '#ED7624',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(32),
  },
  iconText: {
    fontSize: moderateScale(36),
    color: '#FFFFFF',
  },
  brandLabel: {
    fontSize: moderateScale(14),
    letterSpacing: moderateScale(2),
    color: '#87553E',
    marginBottom: verticalScale(16),
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: moderateScale(30),
    fontFamily: 'PlayfairDisplay',
    fontWeight: 'bold',
    color: '#5C250E',
    textAlign: 'center',
    marginBottom: verticalScale(16),
  },
  description: {
    fontSize: moderateScale(16),
    color: '#87553E',
    textAlign: 'center',
    paddingHorizontal: scale(32),
    lineHeight: moderateScale(24),
  },
  bottomSection: {
    gap: verticalScale(12),
  },
  getStartedBtn: {
    width: '100%',
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(8),
    backgroundColor: '#ED7624',
    alignItems: 'center',
  },
  getStartedText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: moderateScale(18),
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(16),
    gap: scale(8),
  },
  dotActive: {
    width: scale(32),
    height: verticalScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#ED7624',
  },
  dotInactive: {
    width: scale(8),
    height: verticalScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: 'rgba(240, 127, 46, 0.2)',
  },
});

export default OnboardingWelcome;
