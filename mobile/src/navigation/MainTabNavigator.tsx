import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { CustomTabBar } from '../components/CustomTabBar';
import {
  HomeStack,
  CoursesStack,
  JourneyStack,
  DirectoryStack,
  ProfileStack,
} from './StackNavigators';

const Tab = createBottomTabNavigator<MainTabParamList>();

const renderTabBar = (props: BottomTabBarProps) => <CustomTabBar {...props} />;

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        lazy: false,
        tabBarTransparent: true,
        tabBarBackground: () => null,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      } as any}
    >
      <Tab.Screen
        name="Journey"
        component={JourneyStack}
        options={{ tabBarLabel: 'My Journey' }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesStack}
        options={{ tabBarLabel: 'Courses' }}
      />
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Directory"
        component={DirectoryStack}
        options={{ tabBarLabel: 'Directory' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};
