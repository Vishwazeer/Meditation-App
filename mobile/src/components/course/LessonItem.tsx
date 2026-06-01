import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Lesson } from '../../types/course.types';
import { scale, verticalScale, moderateScale } from '../../utils/responsive';

interface LessonItemProps {
  lesson: Lesson;
  isEnrolled: boolean;
  isCompleted: boolean;
  onPress: (lessonId: string) => void;
}

const LESSON_TYPE_ICONS: Record<string, string> = {
  video: '🎬',
  audio: '🎵',
  text: '📄',
  exercise: '🏋️',
};

export const LessonItem = ({
  lesson,
  isEnrolled,
  isCompleted,
  onPress,
}: LessonItemProps) => {
  const icon = LESSON_TYPE_ICONS[lesson.lesson_type] || '📄';
  const isLocked = !isEnrolled && !lesson.is_preview;

  return (
    <TouchableOpacity
      style={[s.row, isLocked ? s.locked : undefined]}
      onPress={() => {
        if (!isLocked) {
          onPress(lesson.id);
        }
      }}
      activeOpacity={isLocked ? 1 : 0.7}
      disabled={isLocked}
    >
      {/* Lesson number */}
      <View
        style={[
          s.numberCircle,
          isCompleted ? s.numberCompleted : s.numberDefault,
        ]}
      >
        {isCompleted ? (
          <Text style={s.checkText}>{'✓'}</Text>
        ) : (
          <Text style={s.numberText}>
            {lesson.lesson_number}
          </Text>
        )}
      </View>

      {/* Content */}
      <View style={s.content}>
        <View style={s.titleRow}>
          <Text style={s.typeIcon}>{icon}</Text>
          <Text style={s.lessonTitle} numberOfLines={1}>
            {lesson.title}
          </Text>
        </View>
        <Text style={s.meta}>
          {lesson.duration_minutes} min {'·'}{' '}
          {lesson.lesson_type.charAt(0).toUpperCase() +
            lesson.lesson_type.slice(1)}
          {lesson.is_preview ? ' · Preview' : ''}
        </Text>
      </View>

      {/* Status icon */}
      {isLocked ? (
        <Text style={s.statusLocked}>{'🔒'}</Text>
      ) : (
        <Text style={s.statusPlay}>{'▶️'}</Text>
      )}
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  locked: {
    opacity: 0.5,
  },
  numberCircle: {
    width: scale(32),
    height: scale(32),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  numberCompleted: {
    backgroundColor: '#16A34A',
  },
  numberDefault: {
    backgroundColor: 'rgba(27, 67, 50, 0.1)',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: 'bold',
  },
  numberText: {
    color: '#1B4332',
    fontSize: moderateScale(12),
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginRight: scale(12),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(2),
  },
  typeIcon: {
    fontSize: moderateScale(14),
    marginRight: scale(4),
  },
  lessonTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#1A1A2E',
    flex: 1,
  },
  meta: {
    fontSize: moderateScale(12),
    color: '#6B7280',
  },
  statusLocked: {
    fontSize: moderateScale(16),
    color: '#9CA3AF',
  },
  statusPlay: {
    fontSize: moderateScale(16),
    color: '#40916C',
  },
});
