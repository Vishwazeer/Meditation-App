import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeMain from '../screens/HomeMain';
import CoursesMain from '../screens/CoursesMain';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import LessonScreen from '../screens/LessonScreen';
import JourneyMain from '../screens/JourneyMain';
import MeditationTimerScreen from '../screens/MeditationTimerScreen';
import DirectoryMain from '../screens/DirectoryMain';
import EventDetailScreen from '../screens/EventDetailScreen';
import ProfileMain from '../screens/ProfileMain';
import PaywallScreen from '../screens/PaywallScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import EventsMainScreen from '../screens/events/EventsMainScreen';
import {
  HomeStackParamList,
  CoursesStackParamList,
  JourneyStackParamList,
  DirectoryStackParamList,
  ProfileStackParamList,
  EventsStackParamList,
} from './types';

const Home = createNativeStackNavigator<HomeStackParamList>();
export const HomeStack = () => (
  <Home.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
    <Home.Screen name="HomeMain" component={HomeMain} />
    <Home.Screen name="EventsMain" component={EventsMainScreen as any} />
    <Home.Screen name="EventDetail" component={EventDetailScreen as React.ComponentType<any>} />
  </Home.Navigator>
);

const Courses = createNativeStackNavigator<CoursesStackParamList>();
export const CoursesStack = () => (
  <Courses.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
    <Courses.Screen name="CoursesMain" component={CoursesMain} />
    <Courses.Screen name="CourseDetail" component={CourseDetailScreen} />
    <Courses.Screen name="Lesson" component={LessonScreen as React.ComponentType<any>} />
  </Courses.Navigator>
);

const Journey = createNativeStackNavigator<JourneyStackParamList>();
export const JourneyStack = () => (
  <Journey.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
    <Journey.Screen name="JourneyMain" component={JourneyMain} />
    <Journey.Screen name="MeditationTimer" component={MeditationTimerScreen} />
  </Journey.Navigator>
);

const Directory = createNativeStackNavigator<DirectoryStackParamList>();
export const DirectoryStack = () => (
  <Directory.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
    <Directory.Screen name="DirectoryMain" component={DirectoryMain} />
  </Directory.Navigator>
);

const Profile = createNativeStackNavigator<ProfileStackParamList>();
export const ProfileStack = () => (
  <Profile.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
    <Profile.Screen name="ProfileMain" component={ProfileMain} />
    <Profile.Screen name="Paywall" component={PaywallScreen} />
    <Profile.Screen name="Subscription" component={SubscriptionScreen} />
  </Profile.Navigator>
);


