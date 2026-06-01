/**
 * File: CoursesMain.tsx
 *
 * Description: Courses screen with an active meditation course link and several
 * beautiful dummy placeholders for future meditation courses.
 *
 * Author: Navnit(Ninjacode911)
 */

import React, { useCallback } from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

interface CourseItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url?: string;
  actionText: string;
  isDummy?: boolean;
}

const COURSES_DATA: CourseItem[] = [
  {
    id: '1',
    title: 'Meditation Course',
    description: "Learn Amma's meditation practice and course guidance.",
    thumbnail: 'https://www.amritapuri.org/images/2020/02/19yatra-28-1200x462.jpg',
    url: 'https://na.amma.org/meeting-amma/guides/meditation-course',
    actionText: 'Open course',
  },
  {
    id: '2',
    title: 'Integrated Amrita Meditation (IAM)',
    description: 'A powerful combination of yoga, breathing exercises, and meditation for holistic stress management.',
    thumbnail: 'https://i.ytimg.com/vi/3DIWMA9OVs0/hqdefault.jpg',
    url: 'https://na.amma.org/meeting-amma/guides/meditation-course',
    actionText: 'Coming Soon',
    isDummy: true,
  },
  {
    id: '3',
    title: 'Amrita Yoga Foundations',
    description: "Explore physical yoga postures integrated with Amma's spiritual teachings to harmonize mind, body, and breath.",
    thumbnail: 'https://i.ytimg.com/vi/B_iEiNyr88U/hqdefault.jpg',
    url: 'https://na.amma.org/meeting-amma/guides/meditation-course',
    actionText: 'Coming Soon',
    isDummy: true,
  },
  {
    id: '4',
    title: 'Chantings & Bhajans Practice',
    description: 'Master spiritual chants and traditional bhajans to evoke devotion, peace, and inner vibration alignment.',
    thumbnail: 'https://i.ytimg.com/vi/6QjD_uJ2GIk/hqdefault.jpg',
    url: 'https://na.amma.org/meeting-amma/guides/meditation-course',
    actionText: 'Coming Soon',
    isDummy: true,
  },
];

const CoursesMain = () => {
  const handleCoursePress = useCallback((course: CourseItem) => {
    if (course.isDummy) {
      Alert.alert(
        'Coming Soon',
        `The "${course.title}" course will be available soon. Stay tuned for future updates!`
      );
      return;
    }
    if (course.url) {
      Linking.openURL(course.url).catch(() => {
        Alert.alert('Error', 'Unable to open meditation course page');
      });
    }
  }, []);

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.titleWrap}>
        <Text style={s.pageTitle}>Courses</Text>
        <Text style={s.pageSubtitle}>Explore Amma meditation guidance</Text>
      </View>

      <ScrollView
        style={s.flex1}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {COURSES_DATA.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={[s.courseCard, course.isDummy && s.dummyCard]}
            activeOpacity={0.75}
            onPress={() => handleCoursePress(course)}
          >
            <View style={s.courseArtwork}>
              <Image
                source={{ uri: course.thumbnail }}
                style={s.courseImage}
                resizeMode="cover"
              />
              {course.isDummy && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>Placeholder</Text>
                </View>
              )}
            </View>

            <View style={s.courseBody}>
              <Text style={s.courseTitle}>{course.title}</Text>
              <Text style={s.courseDescription}>
                {course.description}
              </Text>
              <Text style={[s.courseAction, course.isDummy && s.dummyAction]}>
                {course.actionText}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF5EE',
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(40),
  },
  titleWrap: {
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(16),
  },
  pageTitle: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#5C250E',
  },
  pageSubtitle: {
    fontSize: moderateScale(14),
    color: '#87553E',
    marginTop: verticalScale(4),
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
    overflow: 'hidden',
    marginHorizontal: scale(24),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(12),
    elevation: 2,
    shadowColor: '#ED7624',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  dummyCard: {
    borderColor: 'rgba(240, 127, 46, 0.08)',
    opacity: 0.9,
  },
  courseArtwork: {
    height: verticalScale(160),
    overflow: 'hidden',
    backgroundColor: '#87553E',
  },
  courseImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: verticalScale(12),
    right: scale(12),
    backgroundColor: 'rgba(92, 37, 14, 0.75)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(8),
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(11),
    fontWeight: 'bold',
  },
  courseBody: {
    padding: scale(16),
  },
  courseTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#5C250E',
    marginBottom: verticalScale(6),
  },
  courseDescription: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    color: '#87553E',
    marginBottom: verticalScale(12),
  },
  courseAction: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#ED7624',
  },
  dummyAction: {
    color: '#87553E',
  },
});

export default CoursesMain;
