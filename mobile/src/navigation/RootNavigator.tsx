import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { useAuthStore } from '../store/authStore';
import { colors } from '../utils/styles';
import { TAB_ICONS } from '../components/CustomTabBar';

export const RootNavigator = () => {
  const session = useAuthStore((s) => s.session);
  const onboardingComplete = useAuthStore((s) => s.onboardingComplete);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const prefetchTasks = Object.values(TAB_ICONS).map((icon) => {
          if (typeof icon === 'number') {
            const uri = Image.resolveAssetSource(icon).uri;
            return Image.prefetch(uri);
          }
          return Promise.resolve();
        });
        await Promise.all([restoreSession(), ...prefetchTasks]);
      } catch (e) {
        console.warn('Error during initialization:', e);
        await restoreSession();
      }
      setIsInitializing(false);
    };
    init();
  }, [restoreSession]);

  if (isInitializing) {
    return (
      <View style={s.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!session ? (
        <AuthNavigator />
      ) : !onboardingComplete ? (
        <OnboardingNavigator />
      ) : (
        <MainTabNavigator />
      )}
    </NavigationContainer>
  );
};

const s = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
