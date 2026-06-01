import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEventStore } from '../../store/useEventStore';
import { EventCard } from '../../components/events/EventCard';

import { RouteProp, useRoute } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/types';

const EventsMainScreen = () => {
  const route = useRoute<RouteProp<HomeStackParamList, 'EventsMain'>>();
  const { liveEvents, upcomingEvents, pastEvents, isLoading, fetchEvents, toggleReminder } = useEventStore();
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'past'>(route.params?.initialTab || 'live');

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="px-4 pt-4 pb-2 bg-white flex-row justify-between items-center shadow-sm z-10">
        <Text className="text-2xl font-bold text-gray-900">Live Events</Text>
      </View>

      <View className="flex-row bg-white px-4 border-b border-gray-100">
        <TouchableOpacity 
          className={`py-3 mr-6 border-b-2 ${activeTab === 'live' ? 'border-primary' : 'border-transparent'}`}
          onPress={() => setActiveTab('live')}
        >
          <Text className={`font-semibold ${activeTab === 'live' ? 'text-primary' : 'text-gray-500'}`}>
            Live Now ({liveEvents.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className={`py-3 border-b-2 ${activeTab === 'upcoming' ? 'border-primary' : 'border-transparent'}`}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text className={`font-semibold ${activeTab === 'upcoming' ? 'text-primary' : 'text-gray-500'}`}>
            Upcoming ({upcomingEvents.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className={`py-3 ml-6 border-b-2 ${activeTab === 'past' ? 'border-primary' : 'border-transparent'}`}
          onPress={() => setActiveTab('past')}
        >
          <Text className={`font-semibold ${activeTab === 'past' ? 'text-primary' : 'text-gray-500'}`}>
            Past ({pastEvents.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchEvents} tintColor="#1B4332" />
        }
      >
        {activeTab === 'live' ? (
          <View>
            {liveEvents.length === 0 && !isLoading ? (
              <View className="items-center justify-center py-12">
                <Text className="text-gray-500 text-base">No live events right now.</Text>
              </View>
            ) : (
              liveEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                />
              ))
            )}
          </View>
        ) : activeTab === 'upcoming' ? (
          <View>
            {upcomingEvents.length === 0 && !isLoading ? (
              <View className="items-center justify-center py-12">
                <Text className="text-gray-500 text-base">No upcoming events scheduled.</Text>
              </View>
            ) : (
              upcomingEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onToggleReminder={() => toggleReminder(event.id, event.has_reminder || false)}
                />
              ))
            )}
            <View className="h-20" />
          </View>
        ) : (
          <View>
            {pastEvents.length === 0 && !isLoading ? (
              <View className="items-center justify-center py-12">
                <Text className="text-gray-500 text-base">No past events available.</Text>
              </View>
            ) : (
              pastEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                />
              ))
            )}
            <View className="h-20" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EventsMainScreen;
