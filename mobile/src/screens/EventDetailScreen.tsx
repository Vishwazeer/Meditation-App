/**
 * File: EventDetailScreen.tsx
 *
 * Description: Detailed view of a single event showing description, schedule,
 * location, speaker info, and an embedded YouTube player for live events.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import YoutubePlayer from 'react-native-youtube-iframe';
import { eventsService, Event } from '../services/events.service';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import { colors } from '../utils/styles';

type Props = NativeStackScreenProps<{ EventDetail: { eventId: string } }, 'EventDetail'>;

const EventDetailScreen = ({ route, navigation }: Props) => {
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [togglingReminder, setTogglingReminder] = useState(false);

  const loadEvent = useCallback(async () => {
    try {
      const eventData = await eventsService.getEvent(eventId);
      setEvent(eventData);
    } catch {
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleToggleReminder = async () => {
    if (!event) return;
    setTogglingReminder(true);
    try {
      if (event.has_reminder) {
        await eventsService.deleteReminder(eventId);
        setEvent({ ...event, has_reminder: false });
        Alert.alert('Success', 'Reminder removed.');
      } else {
        await eventsService.setReminder(eventId);
        setEvent({ ...event, has_reminder: true });
        Alert.alert('Success', 'Reminder set!');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed';
      Alert.alert('Error', message);
    } finally {
      setTogglingReminder(false);
    }
  };

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
      Alert.alert('Stream Ended', 'The live stream has ended.');
    }
  }, []);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={s.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={s.errorContainer}>
        <Text style={s.errorText}>Event not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView style={s.flex1} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.backButton}
          >
            <Text style={s.backButtonText}>{"\u{2190}"}</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>
            Event Details
          </Text>
        </View>

        {/* Video Player or Hero */}
        {event.is_live && event.youtube_video_id ? (
          <View style={s.videoContainer}>
            <YoutubePlayer
              height={verticalScale(220)}
              play={playing}
              videoId={event.youtube_video_id}
              onChangeState={onStateChange}
            />
          </View>
        ) : (
          <View style={s.heroPlaceholder}>
             <Text style={s.heroIcon}>{"\u{1F3B5}"}</Text>
          </View>
        )}

        {/* Event Info */}
        <View style={s.infoSection}>
          <View style={s.badgesRow}>
            <View style={s.categoryBadge}>
               <Text style={s.categoryBadgeText}>{event.category}</Text>
            </View>
            {event.is_live && (
              <View style={s.liveBadge}>
                <View style={s.liveDot} />
                <Text style={s.liveBadgeText}>LIVE NOW</Text>
              </View>
            )}
          </View>
          
          <Text style={s.eventTitle}>
            {event.title}
          </Text>

          <View style={s.instructorCard}>
            <View style={s.instructorAvatar}>
              <Text style={s.instructorAvatarIcon}>{"\u{1F9D1}"}</Text>
            </View>
            <View>
              <Text style={s.instructorName}>
                {event.instructor_name}
              </Text>
              <Text style={s.instructorLabel}>Instructor</Text>
            </View>
          </View>

          {/* Details */}
          <View style={s.detailsCard}>
            <View style={s.detailRow}>
              <Text style={s.detailIcon}>{"\u{1F4C5}"}</Text>
              <Text style={s.detailText}>
                {formatDate(event.event_date)}
              </Text>
            </View>

            <View style={s.detailRow}>
              <Text style={s.detailIcon}>{"\u{23F1}"}</Text>
              <Text style={s.detailText}>
                {event.duration_minutes} minutes
              </Text>
            </View>

            <View style={s.detailRow}>
              <Text style={s.detailIcon}>{"\u{1F465}"}</Text>
              <Text style={s.detailText}>
                {event.viewer_count || 0} {event.is_live ? 'watching now' : 'interested'}
              </Text>
            </View>
            
            {event.is_premium && (
              <View style={s.premiumRow}>
                <Text style={s.detailIcon}>{"\u{1F3F7}"}</Text>
                <View style={s.premiumBadge}>
                  <Text style={s.premiumBadgeText}>Premium</Text>
                </View>
              </View>
            )}
          </View>

          {/* Description */}
          {event.description ? (
            <View style={s.descriptionSection}>
              <Text style={s.descriptionTitle}>
                About this event
              </Text>
              <Text style={s.descriptionText}>
                {event.description}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={s.bottomSpacer} />
      </ScrollView>

      {/* Sticky Footer */}
      {!event.is_live && (
        <View style={s.footer}>
          <TouchableOpacity
            style={[
              s.reminderBtn,
              event.has_reminder ? s.reminderBtnActive : s.reminderBtnInactive,
              togglingReminder && s.reminderBtnDisabled
            ]}
            onPress={handleToggleReminder}
            disabled={togglingReminder}
          >
            {togglingReminder ? (
              <ActivityIndicator color={event.has_reminder ? colors.primary : '#FFFFFF'} />
            ) : (
              <Text
                style={[
                  s.reminderBtnText,
                  event.has_reminder ? s.reminderBtnTextActive : s.reminderBtnTextInactive
                ]}
              >
                {event.has_reminder ? 'Reminder Set \u{2713}' : 'Set Reminder'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(24),
  },
  errorText: {
    color: '#6B7280',
    fontSize: moderateScale(16),
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  flex1: {
    flex: 1,
  },
  header: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  backButton: {
    marginRight: scale(12),
    padding: scale(8),
  },
  backButtonText: {
    fontSize: moderateScale(24),
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: verticalScale(-4),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  videoContainer: {
    width: '100%',
    backgroundColor: '#000000',
    aspectRatio: 16 / 9,
  },
  heroPlaceholder: {
    marginHorizontal: scale(16),
    marginTop: verticalScale(16),
    height: verticalScale(192),
    backgroundColor: colors.primary,
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    fontSize: moderateScale(36),
  },
  infoSection: {
    paddingHorizontal: scale(16),
    marginTop: verticalScale(16),
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  categoryBadge: {
    backgroundColor: 'rgba(27,67,50,0.2)',
    borderRadius: moderateScale(9999),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
  },
  categoryBadgeText: {
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
    fontSize: moderateScale(14),
  },
  liveBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(9999),
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#FFFFFF',
    marginRight: scale(8),
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: 'bold',
    letterSpacing: scale(1),
  },
  eventTitle: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#111827',
  },
  instructorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(12),
    backgroundColor: '#FFFFFF',
    padding: scale(12),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  instructorAvatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(27,67,50,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  instructorAvatarIcon: {
    fontSize: moderateScale(18),
  },
  instructorName: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#111827',
  },
  instructorLabel: {
    fontSize: moderateScale(14),
    color: '#6B7280',
  },
  detailsCard: {
    marginTop: verticalScale(24),
    backgroundColor: '#FFFFFF',
    padding: scale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  detailIcon: {
    fontSize: moderateScale(18),
    marginRight: scale(12),
  },
  detailText: {
    fontSize: moderateScale(16),
    color: '#111827',
  },
  premiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumBadge: {
    backgroundColor: 'rgba(27,67,50,0.1)',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(9999),
  },
  premiumBadgeText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  descriptionSection: {
    marginTop: verticalScale(24),
    marginBottom: verticalScale(32),
  },
  descriptionTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: verticalScale(8),
  },
  descriptionText: {
    fontSize: moderateScale(16),
    color: '#4B5563',
    lineHeight: moderateScale(24),
  },
  bottomSpacer: {
    height: verticalScale(96),
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(32),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 10,
  },
  reminderBtn: {
    width: '100%',
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  reminderBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  reminderBtnInactive: {
    backgroundColor: colors.primary,
  },
  reminderBtnDisabled: {
    opacity: 0.7,
  },
  reminderBtnText: {
    fontWeight: 'bold',
    fontSize: moderateScale(18),
  },
  reminderBtnTextActive: {
    color: colors.primary,
  },
  reminderBtnTextInactive: {
    color: '#FFFFFF',
  },
});

export default EventDetailScreen;
