/**
 * File: LessonScreen.tsx
 *
 * Description: Individual lesson player screen with video/audio content,
 * progress tracking, lesson completion marking, and navigation between lessons.
 *
 * Author: Navnit(Ninjacode911)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { coursesService } from '../services/courses.service';
import { Lesson } from '../types/course.types';
import { CoursesStackParamList } from '../navigation/types';

type LessonRoute = RouteProp<CoursesStackParamList, 'Lesson'>;
type LessonNav = NativeStackNavigationProp<CoursesStackParamList, 'Lesson'>;

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const LessonScreen = () => {
  const navigation = useNavigation<LessonNav>();
  const route = useRoute<LessonRoute>();
  const { lessonId, courseId, enrollmentId } = route.params;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

  const totalDuration = lesson ? lesson.duration_minutes * 60 : 0;
  const progress = totalDuration > 0 ? currentTime / totalDuration : 0;

  const loadLesson = useCallback(async () => {
    try {
      const courseData = await coursesService.getCourseById(courseId);
      const lessonData = courseData.lessons.find((l: Lesson) => l.id === lessonId);
      if (lessonData) {
        setLesson(lessonData);
      }
      setAllLessons(courseData.lessons);
    } catch {
      Alert.alert('Error', 'Failed to load lesson.');
    } finally {
      setLoading(false);
    }
  }, [lessonId, courseId]);

  React.useEffect(() => {
    loadLesson();
  }, [loadLesson]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleSkipForward = useCallback(() => {
    setCurrentTime((prev) => Math.min(prev + 15, totalDuration));
  }, [totalDuration]);

  const handleSkipBack = useCallback(() => {
    setCurrentTime((prev) => Math.max(prev - 15, 0));
  }, []);

  const handleComplete = useCallback(async () => {
    if (!lesson || !allLessons.length) return;

    try {
      const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
      const completedCount = currentIndex + 1;
      const totalCount = allLessons.length;
      const progressPct = Math.round((completedCount / totalCount) * 100);

      await coursesService.updateProgress(enrollmentId, {
        lessons_completed: completedCount,
        progress_percentage: progressPct,
        last_lesson_id: lesson.id,
        status: completedCount >= totalCount ? 'completed' : 'active',
      });

      Alert.alert(
        completedCount >= totalCount ? 'Course Completed!' : 'Lesson Complete!',
        completedCount >= totalCount
          ? 'Congratulations! You have completed this course.'
          : 'Great job! Moving to the next lesson.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (completedCount < totalCount) {
                handleNextLesson();
              } else {
                navigation.goBack();
              }
            },
          },
        ],
      );
    } catch {
      Alert.alert('Error', 'Failed to update progress.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- handleNextLesson is stable via useCallback with same deps
  }, [lesson, allLessons, enrollmentId, navigation]);

  const handleNextLesson = useCallback(() => {
    if (!lesson || !allLessons.length) return;

    const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
    const nextLesson = allLessons[currentIndex + 1];

    if (nextLesson) {
      setLesson(nextLesson);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [lesson, allLessons]);

  const hasNextLesson = (() => {
    if (!lesson || !allLessons.length) return false;
    const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
    return currentIndex < allLessons.length - 1;
  })();

  if (loading || !lesson) {
    return (
      <SafeAreaView style={s.loadingContainer}>
        <Text style={s.loadingText}>Loading lesson...</Text>
      </SafeAreaView>
    );
  }

  const mediaIcon =
    lesson.lesson_type === 'video'
      ? '\u{1F3AC}'
      : lesson.lesson_type === 'audio'
        ? '\u{1F3B5}'
        : '\u{1F4C4}';

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={s.backButtonText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <View style={s.headerTitleWrap}>
          <Text
            style={s.headerTitle}
            numberOfLines={1}
          >
            {lesson.title}
          </Text>
          <Text style={s.headerSubtitle}>
            Lesson {lesson.lesson_number}
          </Text>
        </View>
      </View>

      <ScrollView
        style={s.flex1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* Media placeholder */}
        <View style={s.mediaPlaceholder}>
          <Text style={s.mediaIcon}>{mediaIcon}</Text>
          <Text style={s.mediaLabel}>
            {lesson.lesson_type === 'video'
              ? 'Video Player'
              : lesson.lesson_type === 'audio'
                ? 'Audio Player'
                : 'Reading Material'}
          </Text>
          <Text style={s.mediaSubLabel}>
            Media playback requires native integration
          </Text>
        </View>

        {/* Progress bar */}
        <View style={s.progressWrap}>
          <View style={s.progressTrack}>
            <View
              style={[s.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <View style={s.progressTimeRow}>
            <Text style={s.progressTimeText}>
              {formatTime(currentTime)}
            </Text>
            <Text style={s.progressTimeText}>
              {formatTime(totalDuration)}
            </Text>
          </View>
        </View>

        {/* Controls row */}
        <View style={s.controlsRow}>
          {/* Playback speed */}
          <View style={s.speedMenuWrap}>
            <TouchableOpacity
              style={s.speedButton}
              onPress={() => setSpeedMenuOpen((prev) => !prev)}
            >
              <Text style={s.speedButtonText}>
                {playbackSpeed}x
              </Text>
            </TouchableOpacity>
            {speedMenuOpen && (
              <View style={s.speedDropdown}>
                {PLAYBACK_SPEEDS.map((speed) => (
                  <TouchableOpacity
                    key={speed}
                    style={[
                      s.speedOption,
                      playbackSpeed === speed ? s.speedOptionActive : null,
                    ]}
                    onPress={() => {
                      setPlaybackSpeed(speed);
                      setSpeedMenuOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        s.speedOptionText,
                        playbackSpeed === speed
                          ? s.speedOptionTextActive
                          : null,
                      ]}
                    >
                      {speed}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Skip back */}
          <TouchableOpacity
            style={s.skipButton}
            onPress={handleSkipBack}
          >
            <Text style={s.skipButtonText}>{'\u23EA'}</Text>
          </TouchableOpacity>

          {/* Play/Pause */}
          <TouchableOpacity
            style={s.playPauseButton}
            onPress={handlePlayPause}
          >
            <Text style={s.playPauseText}>
              {isPlaying ? '\u23F8' : '\u25B6'}
            </Text>
          </TouchableOpacity>

          {/* Skip forward */}
          <TouchableOpacity
            style={s.skipForwardButton}
            onPress={handleSkipForward}
          >
            <Text style={s.skipButtonText}>{'\u23E9'}</Text>
          </TouchableOpacity>
        </View>

        {/* Lesson info */}
        <View style={s.lessonInfo}>
          <Text style={s.lessonTitle}>
            {lesson.title}
          </Text>
          <View style={s.lessonMeta}>
            <Text style={s.lessonMetaText}>
              {'\u23F1'} {lesson.duration_minutes} min
            </Text>
            <Text style={[s.lessonMetaText, s.lessonMetaType]}>
              {lesson.lesson_type}
            </Text>
          </View>
          {lesson.description ? (
            <Text style={s.lessonDescription}>
              {lesson.description}
            </Text>
          ) : null}
        </View>

        {/* Action buttons */}
        <View style={s.actions}>
          <TouchableOpacity
            style={s.completeButton}
            onPress={handleComplete}
            activeOpacity={0.8}
          >
            <Text style={s.completeButtonText}>
              Mark as Complete
            </Text>
          </TouchableOpacity>

          {hasNextLesson && (
            <TouchableOpacity
              style={s.nextLessonButton}
              onPress={handleNextLesson}
              activeOpacity={0.8}
            >
              <Text style={s.nextLessonButtonText}>
                Next Lesson {'\u2192'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LessonScreen;

const s = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAFAF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6B7280',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAF5',
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(32),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  backButtonText: {
    fontSize: moderateScale(18),
    lineHeight: moderateScale(20),
    textAlign: 'center',
    includeFontPadding: false,
    marginTop: verticalScale(-2),
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#1A1A2E',
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    color: '#6B7280',
  },
  mediaPlaceholder: {
    marginHorizontal: scale(24),
    marginTop: verticalScale(16),
    height: verticalScale(224),
    backgroundColor: '#0B2B1F',
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaIcon: {
    fontSize: moderateScale(48),
    marginBottom: verticalScale(8),
  },
  mediaLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: moderateScale(14),
  },
  mediaSubLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: moderateScale(12),
    marginTop: verticalScale(4),
  },
  progressWrap: {
    marginHorizontal: scale(24),
    marginTop: verticalScale(16),
  },
  progressTrack: {
    height: verticalScale(6),
    backgroundColor: '#E5E7EB',
    borderRadius: moderateScale(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#40916C',
    borderRadius: moderateScale(3),
  },
  progressTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(4),
  },
  progressTimeText: {
    fontSize: moderateScale(12),
    color: '#6B7280',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: scale(24),
    marginTop: verticalScale(24),
    marginBottom: verticalScale(24),
  },
  speedMenuWrap: {
    position: 'relative',
  },
  speedButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    marginRight: scale(24),
  },
  speedButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#1A1A2E',
  },
  speedDropdown: {
    position: 'absolute',
    top: verticalScale(48),
    left: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: moderateScale(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 10,
    paddingVertical: verticalScale(4),
  },
  speedOption: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
  },
  speedOptionActive: {
    backgroundColor: 'rgba(27,67,50,0.1)',
  },
  speedOptionText: {
    fontSize: moderateScale(14),
    color: '#1A1A2E',
  },
  speedOptionTextActive: {
    color: '#1B4332',
    fontWeight: '700',
  },
  skipButton: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(16),
  },
  skipForwardButton: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scale(16),
  },
  skipButtonText: {
    fontSize: moderateScale(16),
    color: '#1A1A2E',
  },
  playPauseButton: {
    width: scale(64),
    height: scale(64),
    borderRadius: moderateScale(32),
    backgroundColor: '#1B4332',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: scale(8),
  },
  playPauseText: {
    fontSize: moderateScale(24),
    color: '#FFFFFF',
  },
  lessonInfo: {
    marginHorizontal: scale(24),
    marginBottom: verticalScale(24),
  },
  lessonTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: verticalScale(8),
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  lessonMetaText: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    marginRight: scale(12),
  },
  lessonMetaType: {
    textTransform: 'capitalize',
  },
  lessonDescription: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    lineHeight: moderateScale(20),
  },
  actions: {
    marginHorizontal: scale(24),
  },
  completeButton: {
    backgroundColor: '#1B4332',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(14),
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: moderateScale(16),
  },
  nextLessonButton: {
    backgroundColor: 'rgba(64,145,108,0.1)',
    borderWidth: 1,
    borderColor: '#40916C',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(14),
    alignItems: 'center',
  },
  nextLessonButtonText: {
    color: '#40916C',
    fontWeight: '700',
    fontSize: moderateScale(16),
  },
});
