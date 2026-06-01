import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Course } from '../../types/course.types';
import { scale, verticalScale, moderateScale } from '../../utils/responsive';

interface CourseCardProps {
  course: Course;
  onPress: (courseId: string) => void;
}

const DIFFICULTY_BG: Record<string, string> = {
  beginner: 'rgba(240, 127, 46, 0.08)',
  intermediate: 'rgba(240, 127, 46, 0.15)',
  advanced: 'rgba(240, 127, 46, 0.25)',
};

const DIFFICULTY_TEXT: Record<string, string> = {
  beginner: '#87553E',
  intermediate: '#5C250E',
  advanced: '#D94329', // Slight reddish-orange for advanced
};

// Category-driven visual theme so cards feel distinct even without real images
const CATEGORY_THEME: Record<string, { bg: string; accent: string; icon: string }> = {
  meditation: { bg: '#87553E', accent: '#5C250E', icon: '🧘' },
  yoga:       { bg: '#A64B29', accent: '#D97229', icon: '🧘‍♀️' },
  pranayama:  { bg: '#5C250E', accent: '#87553E', icon: '💨' },
  mindfulness:{ bg: '#C56127', accent: '#ED7624', icon: '🧠' },
  sleep:      { bg: '#3D1A0D', accent: '#5C250E', icon: '🌙' },
  stress:     { bg: '#ED7624', accent: '#F0A16C', icon: '🌸' },
  default:    { bg: '#87553E', accent: '#ED7624', icon: '🕊️' },
};

const getCategoryTheme = (category: string | null | undefined) =>
  CATEGORY_THEME[(category || '').toLowerCase()] || CATEGORY_THEME.default;

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const CourseCard = ({ course, onPress }: CourseCardProps) => {
  const diffBg = DIFFICULTY_BG[course.difficulty_level] || '#F3F4F6';
  const diffText = DIFFICULTY_TEXT[course.difficulty_level] || '#1F2937';
  const theme = getCategoryTheme(course.category);

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => onPress(course.id)}
      activeOpacity={0.7}
    >
      {/* Thumbnail — real image if provided, otherwise category-themed artwork.
          Badges live INSIDE the thumbnail so they anchor to its corners, not the
          bottom of the whole card. */}
      <View
        style={[
          s.thumbnail,
          !course.thumbnail_url && { backgroundColor: theme.bg },
        ]}
      >
        {course.thumbnail_url ? (
          <Image
            source={{ uri: course.thumbnail_url }}
            style={s.thumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <>
            <View style={[s.decorCircleLarge, { backgroundColor: theme.accent }]} />
            <View style={[s.decorCircleSmall, { backgroundColor: theme.accent }]} />
            <Text style={s.thumbnailEmoji}>{theme.icon}</Text>
            <Text style={s.thumbnailCategory}>
              {(course.category || '').toUpperCase()}
            </Text>
          </>
        )}
        {course.is_premium ? (
          <View style={[s.badge, s.badgePremium]}>
            <Text style={s.badgeText}>PREMIUM</Text>
          </View>
        ) : (
          <View style={[s.badge, s.badgeFree]}>
            <Text style={s.badgeText}>FREE</Text>
          </View>
        )}
        <View style={s.durationBadge}>
          <Text style={s.durationText}>
            {formatDuration(course.estimated_duration_minutes)}
          </Text>
        </View>
      </View>

      {/* Card body */}
      <View style={s.body}>
        <View style={s.metaRow}>
          <View style={[s.difficultyBadge, { backgroundColor: diffBg }]}>
            <Text
              style={[s.difficultyText, { color: diffText }]}
            >
              {course.difficulty_level}
            </Text>
          </View>
          <Text style={s.lessonCount}>
            {course.total_lessons} lessons
          </Text>
        </View>

        <Text style={s.title} numberOfLines={2}>
          {course.title}
        </Text>

        <Text style={s.instructor} numberOfLines={1}>
          {course.instructor_name}
        </Text>

        {course.short_description ? (
          <Text style={s.description} numberOfLines={2}>
            {course.short_description}
          </Text>
        ) : null}

        <View style={s.footer}>
          <View style={s.enrollRow}>
            <Text style={s.starIcon}>
              {'⭐'}
            </Text>
            <Text style={s.enrollText}>
              {course.enrollment_count} enrolled
            </Text>
          </View>
          <Text style={s.category}>
            {course.category}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
    overflow: 'hidden',
    marginBottom: verticalScale(16),
    marginHorizontal: scale(24),
  },
  thumbnail: {
    height: verticalScale(160),
    backgroundColor: 'rgba(27, 67, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailEmoji: {
    fontSize: moderateScale(44),
  },
  thumbnailCategory: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: moderateScale(11),
    fontWeight: '700',
    letterSpacing: moderateScale(2),
    marginTop: verticalScale(8),
  },
  decorCircleLarge: {
    position: 'absolute',
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    opacity: 0.15,
    top: verticalScale(-20),
    right: scale(-30),
  },
  decorCircleSmall: {
    position: 'absolute',
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    opacity: 0.2,
    bottom: verticalScale(-10),
    left: scale(-10),
  },
  badge: {
    position: 'absolute',
    top: verticalScale(12),
    right: scale(12),
    borderRadius: moderateScale(999),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
  },
  badgePremium: {
    backgroundColor: '#ED7624',
  },
  badgeFree: {
    backgroundColor: 'rgba(240, 127, 46, 0.6)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: 'bold',
  },
  durationBadge: {
    position: 'absolute',
    bottom: verticalScale(8),
    right: scale(8),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: moderateScale(999),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
  },
  body: {
    padding: scale(16),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  difficultyBadge: {
    borderRadius: moderateScale(999),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    marginRight: scale(8),
  },
  difficultyText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  lessonCount: {
    fontSize: moderateScale(12),
    color: '#87553E',
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#5C250E',
    marginBottom: verticalScale(4),
  },
  instructor: {
    fontSize: moderateScale(14),
    color: '#87553E',
    marginBottom: verticalScale(8),
  },
  description: {
    fontSize: moderateScale(12),
    color: '#87553E',
    marginBottom: verticalScale(8),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  enrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    fontSize: moderateScale(12),
    color: '#ED7624',
    marginRight: scale(4),
  },
  enrollText: {
    fontSize: moderateScale(12),
    color: '#87553E',
  },
  category: {
    fontSize: moderateScale(12),
    color: '#ED7624',
    fontWeight: '600',
  },
});
