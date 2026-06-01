import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  OTP: { phone: string };
};

export type OnboardingStackParamList = {
  OnboardingWelcome: undefined;
  OnboardingInterests: undefined;
  OnboardingGoal: { interests: string[] };
};

export type HomeStackParamList = {
  HomeMain: undefined;
  EventsMain: { initialTab?: 'live' | 'upcoming' | 'past' } | undefined;
  EventDetail: { eventId: string };
};

export type CoursesStackParamList = {
  CoursesMain: undefined;
  CourseDetail: { courseId: string };
  Lesson: { lessonId: string; courseId: string; enrollmentId: string };
};

export type JourneyStackParamList = {
  JourneyMain: undefined;
  MeditationTimer: undefined;
};

export type DirectoryStackParamList = {
  DirectoryMain: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Paywall: undefined;
  Subscription: undefined;
};



export type MainTabParamList = {
  Journey: NavigatorScreenParams<JourneyStackParamList>;
  Courses: NavigatorScreenParams<CoursesStackParamList>;
  Home: NavigatorScreenParams<HomeStackParamList>;
  Directory: NavigatorScreenParams<DirectoryStackParamList>;
  Events: NavigatorScreenParams<EventsStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
