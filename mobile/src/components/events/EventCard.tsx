import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Event } from '../../services/events.service';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EventsStackParamList } from '../../navigation/types';
import { scale, verticalScale, moderateScale } from '../../utils/responsive';

interface EventCardProps {
  event: Event;
  onToggleReminder?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onToggleReminder }) => {
  const navigation = useNavigation<NativeStackNavigationProp<EventsStackParamList>>();

  const handlePress = () => {
    navigation.navigate('EventDetail', { eventId: event.id });
  };

  const isLive = event.is_live;

  return (
    <TouchableOpacity 
      style={s.card}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={s.thumbnailContainer}>
        {event.thumbnail_url ? (
          <Image 
            source={{ uri: event.thumbnail_url }} 
            style={s.thumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <View style={s.noThumbnail}>
            <Text style={s.noThumbnailText}>No Thumbnail</Text>
          </View>
        )}
        
        {isLive && (
          <View style={s.liveBadge}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>LIVE NOW</Text>
          </View>
        )}

        {isLive && event.viewer_count > 0 && (
          <View style={s.viewerBadge}>
            <Text style={s.viewerText}>{event.viewer_count} viewers</Text>
          </View>
        )}
      </View>

      <View style={s.body}>
        <View style={s.headerRow}>
          <View style={s.titleContainer}>
            <Text style={s.categoryText}>{event.category}</Text>
            <Text style={s.titleText} numberOfLines={2}>{event.title}</Text>
          </View>
        </View>

        {!isLive && (
          <View style={s.footerRow}>
            <View>
              <Text style={s.dateText}>
                {new Date(event.event_date).toLocaleDateString()}
              </Text>
              <Text style={s.timeText}>
                {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={onToggleReminder}
              style={[s.reminderBtn, event.has_reminder ? s.reminderBtnActive : s.reminderBtnInactive]}
            >
              <Text style={[s.reminderText, event.has_reminder ? s.reminderTextActive : s.reminderTextInactive]}>
                {event.has_reminder ? 'Reminder Set' : 'Remind Me'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: '#f3f4f6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  thumbnailContainer: {
    position: 'relative',
    height: verticalScale(192), // h-48 equivalent roughly
    width: '100%',
    backgroundColor: '#e5e7eb',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  noThumbnail: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(237, 118, 36, 0.1)', // bg-primary/10
  },
  noThumbnailText: {
    color: '#ED7624',
    fontWeight: '500',
    fontSize: moderateScale(14),
  },
  liveBadge: {
    position: 'absolute',
    top: verticalScale(12),
    left: scale(12),
    backgroundColor: '#dc2626',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(999),
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#ffffff',
    marginRight: scale(8),
  },
  liveText: {
    color: '#ffffff',
    fontSize: moderateScale(12),
    fontWeight: 'bold',
    letterSpacing: moderateScale(1),
  },
  viewerBadge: {
    position: 'absolute',
    top: verticalScale(12),
    right: scale(12),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(999),
  },
  viewerText: {
    color: '#ffffff',
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  body: {
    padding: scale(16),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(8),
  },
  titleContainer: {
    flex: 1,
    paddingRight: scale(16),
  },
  categoryText: {
    fontSize: moderateScale(12),
    color: '#ED7624',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: verticalScale(4),
  },
  titleText: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#111827',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(8),
  },
  dateText: {
    fontSize: moderateScale(14),
    color: '#4b5563',
    fontWeight: '500',
  },
  timeText: {
    fontSize: moderateScale(12),
    color: '#6b7280',
  },
  reminderBtn: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(999),
    borderWidth: 1,
  },
  reminderBtnActive: {
    backgroundColor: '#ED7624',
    borderColor: '#ED7624',
  },
  reminderBtnInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#ED7624',
  },
  reminderText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  reminderTextActive: {
    color: '#ffffff',
  },
  reminderTextInactive: {
    color: '#ED7624',
  },
});
