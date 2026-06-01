import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from '../../utils/responsive';

interface ContentCardProps {
  id: string;
  title: string;
  instructorName: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  category: string;
  viewCount: number;
  isPremium: boolean;
  isBookmarked: boolean;
  onPress: () => void;
  onBookmark: () => void;
}

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return '';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${String(mins).padStart(2, '0')}:00`;
};

export const ContentCard = ({
  title,
  instructorName: _instructorName,
  thumbnailUrl,
  durationSeconds,
  viewCount,
  isPremium,
  isBookmarked,
  onPress,
  onBookmark,
}: ContentCardProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={s.card}
    >
      {/* Thumbnail */}
      <View style={s.thumbnail}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={s.thumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={s.thumbnailEmoji}>{'\u{1F3B5}'}</Text>
        )}
        {durationSeconds ? (
          <View style={s.durationBadge}>
            <Text style={s.durationText}>
              {formatDuration(durationSeconds)}
            </Text>
          </View>
        ) : null}
        {isPremium && (
          <View style={s.proBadge}>
            <Text style={s.proText}>PRO</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={s.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={s.footer}>
          <View style={s.viewRow}>
            <Text style={s.viewText}>
              {'\u{25B6}'} {viewCount >= 1000 ? `${Math.floor(viewCount / 1000)}k` : viewCount}
            </Text>
          </View>
          <TouchableOpacity onPress={onBookmark} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[s.bookmarkIcon, isBookmarked ? s.bookmarkActive : s.bookmarkInactive]}>
              {isBookmarked ? '\u{1F516}' : '\u{1F517}'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  thumbnail: {
    width: scale(128),
    height: verticalScale(96),
    backgroundColor: 'rgba(45, 106, 79, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailEmoji: {
    fontSize: moderateScale(24),
  },
  durationBadge: {
    position: 'absolute',
    bottom: verticalScale(4),
    right: scale(4),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: moderateScale(999),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  proBadge: {
    position: 'absolute',
    top: verticalScale(4),
    left: scale(4),
    backgroundColor: '#40916C',
    borderRadius: moderateScale(999),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
  },
  proText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    padding: scale(12),
    justifyContent: 'space-between',
  },
  title: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#1A1A2E',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(8),
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewText: {
    fontSize: moderateScale(12),
    color: '#6B7280',
  },
  bookmarkIcon: {
    fontSize: moderateScale(18),
  },
  bookmarkActive: {
    color: '#40916C',
  },
  bookmarkInactive: {
    color: '#D1D5DB',
  },
});
