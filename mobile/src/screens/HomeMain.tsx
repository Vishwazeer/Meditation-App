import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  Image,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/types';
import { homeService, HomeFeedData } from '../services/home.service';
import { ErrorBanner } from '../components/shared/ErrorBanner';
import { getDailyQuote, getRandomQuote } from '../data/ammaQuotes';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

const getGreetingTime = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const formatMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

// Fallback data shown when backend is unreachable — keeps the screen populated for demo
interface TrendingVideo {
  id: string;
  title: string;
  instructor: string;
  duration: string;
  views: string;
  youtubeId: string;
  thumbnailUrl: string;
}

const TRENDING_VIDEOS: TrendingVideo[] = [
  { id: '1', title: 'Muralidhara Gopala | Soulful Krishna Bhajan', instructor: 'Amma (Mata Amritanandamayi)', duration: '9:15', views: '1.5M', youtubeId: 'US-ejM6b1wE', thumbnailUrl: 'https://i.ytimg.com/vi/US-ejM6b1wE/hqdefault.jpg' },
  { id: '2', title: 'Integrated Amrita Meditation (IAM) Guided Practice', instructor: 'Amrita Live', duration: '20:00', views: '950K', youtubeId: '3DIWMA9OVs0', thumbnailUrl: 'https://i.ytimg.com/vi/3DIWMA9OVs0/hqdefault.jpg' },
  { id: '3', title: 'Varalunna Hridayattil | Soulful Devotional Bhajan', instructor: 'Amma (Mata Amritanandamayi)', duration: '8:30', views: '2.8M', youtubeId: '6QjD_uJ2GIk', thumbnailUrl: 'https://i.ytimg.com/vi/6QjD_uJ2GIk/hqdefault.jpg' },
  { id: '4', title: "7 Steps for a Joyful Life | Amma's Special Message", instructor: 'Amma (Mata Amritanandamayi)', duration: '18:24', views: '1.2M', youtubeId: 'tH_AbG1JMOE', thumbnailUrl: 'https://i.ytimg.com/vi/tH_AbG1JMOE/hqdefault.jpg' },
];

const ALL_TRENDING_VIDEOS: TrendingVideo[] = [
  { id: '1', title: 'Muralidhara Gopala | Soulful Krishna Bhajan', instructor: 'Amma (Mata Amritanandamayi)', duration: '9:15', views: '1.5M', youtubeId: 'US-ejM6b1wE', thumbnailUrl: 'https://i.ytimg.com/vi/US-ejM6b1wE/hqdefault.jpg' },
  { id: '2', title: 'Integrated Amrita Meditation (IAM) Guided Practice', instructor: 'Amrita Live', duration: '20:00', views: '950K', youtubeId: '3DIWMA9OVs0', thumbnailUrl: 'https://i.ytimg.com/vi/3DIWMA9OVs0/hqdefault.jpg' },
  { id: '3', title: 'Varalunna Hridayattil | Soulful Devotional Bhajan', instructor: 'Amma (Mata Amritanandamayi)', duration: '8:30', views: '2.8M', youtubeId: '6QjD_uJ2GIk', thumbnailUrl: 'https://i.ytimg.com/vi/6QjD_uJ2GIk/hqdefault.jpg' },
  { id: '4', title: "7 Steps for a Joyful Life | Amma's Special Message", instructor: 'Amma (Mata Amritanandamayi)', duration: '18:24', views: '1.2M', youtubeId: 'tH_AbG1JMOE', thumbnailUrl: 'https://i.ytimg.com/vi/tH_AbG1JMOE/hqdefault.jpg' },
  { id: '5', title: 'Lokah Samastah Sukhino Bhavantu | Chant for Peace', instructor: 'Amma (Mata Amritanandamayi)', duration: '12:45', views: '2.1M', youtubeId: 'B_iEiNyr88U', thumbnailUrl: 'https://i.ytimg.com/vi/B_iEiNyr88U/hqdefault.jpg' },
  { id: '6', title: 'Conversations with Amma | Wisdom & Teachings', instructor: 'Amma (Mata Amritanandamayi)', duration: '22:15', views: '870K', youtubeId: 'AbpBM_qKZ5g', thumbnailUrl: 'https://i.ytimg.com/vi/AbpBM_qKZ5g/hqdefault.jpg' },
];

const LIVE_EVENTS = [
  { id: 'le-1', title: 'Global Peace Meditation', event_date: new Date().toISOString(), instructor_name: 'Amma', thumbnail_url: null, is_live: true, category: 'meditation' },
  { id: 'le-2', title: 'Live Satsang & Bhajans', event_date: new Date(Date.now() + 86400000).toISOString(), instructor_name: 'Swami Amritaswarupananda Puri', thumbnail_url: null, is_live: true, category: 'wisdom' },
];

const FALLBACK_FEED: HomeFeedData = {
  greeting: 'Friend',
  dailyQuote: {
    quote_text: getDailyQuote(),
    author: 'Amma',
    category: 'wisdom',
  },
  trendingCourses: [
    { id: 'tc-1', title: 'Muralidhara Gopala | Soulful Krishna Bhajan', instructor_name: 'Amma (Mata Amritanandamayi)', thumbnail_url: 'https://i.ytimg.com/vi/US-ejM6b1wE/hqdefault.jpg', estimated_duration_minutes: 9, difficulty_level: 'beginner', is_premium: false } as HomeFeedData['trendingCourses'][number],
    { id: 'tc-2', title: 'Integrated Amrita Meditation (IAM) Guided Practice', instructor_name: 'Amrita Live', thumbnail_url: 'https://i.ytimg.com/vi/3DIWMA9OVs0/hqdefault.jpg', estimated_duration_minutes: 20, difficulty_level: 'beginner', is_premium: false } as HomeFeedData['trendingCourses'][number],
    { id: 'tc-3', title: 'Varalunna Hridayattil | Soulful Devotional Bhajan', instructor_name: 'Amma (Mata Amritanandamayi)', thumbnail_url: 'https://i.ytimg.com/vi/6QjD_uJ2GIk/hqdefault.jpg', estimated_duration_minutes: 8, difficulty_level: 'beginner', is_premium: false } as HomeFeedData['trendingCourses'][number],
    { id: 'tc-4', title: 'Conversations with Amma | Wisdom & Teachings', instructor_name: 'Amma (Mata Amritanandamayi)', thumbnail_url: 'https://i.ytimg.com/vi/AbpBM_qKZ5g/hqdefault.jpg', estimated_duration_minutes: 22, difficulty_level: 'intermediate', is_premium: false } as HomeFeedData['trendingCourses'][number],
    { id: 'tc-5', title: 'Guided Meditation & Chanting for Inner Peace', instructor_name: 'Amma (Mata Amritanandamayi)', thumbnail_url: 'https://i.ytimg.com/vi/B_iEiNyr88U/hqdefault.jpg', estimated_duration_minutes: 25, difficulty_level: 'beginner', is_premium: false } as HomeFeedData['trendingCourses'][number],
  ],
  upcomingEvents: [
    { id: 'ev-live', title: 'Global Peace Meditation (Live)', event_date: new Date().toISOString(), instructor_name: 'Amma Admin', thumbnail_url: null, is_live: true, category: 'meditation', booking_url: 'https://youtube.com/live' } as any,
    { id: 'ev-1', title: 'Bharat Yatra 2026: Amma Embraces Mangaluru', event_date: '2026-05-30T00:00:00.000Z', instructor_name: 'Amma', thumbnail_url: null, is_live: false, category: 'news', booking_url: 'https://amma.org/news/bharat-yatra-2026-amma-embraces-mangaluru/' } as any,
    { id: 'ev-2', title: 'Village Chronicles – Part 02: Disaster Preparedness and Community Resilience in Odisha', event_date: '2026-05-22T00:00:00.000Z', instructor_name: 'Amma', thumbnail_url: null, is_live: false, category: 'news', booking_url: 'https://amma.org/news/village-chronicles-part-02-disaster-preparedness-and-community-resilience-in-odisha/' } as any,
    { id: 'ev-3', title: 'UNESCO Chairs Are Among Our Greatest Strengths: Amrita University Hosts South Asia Round Table', event_date: '2026-05-15T00:00:00.000Z', instructor_name: 'Amma', thumbnail_url: null, is_live: false, category: 'news', booking_url: 'https://amma.org/news/unesco-chairs-are-among-our-greatest-strengths-amrita-university-hosts-south-asia-round-table/' } as any,
  ],
  stats: {
    totalMinutes: 0,
    currentStreak: 0,
  },
};

const SkeletonCard = () => <View style={s.skeletonCard} />;

const HomeMain = () => {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [feed, setFeed] = useState<HomeFeedData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [showAllTrending, setShowAllTrending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadFeed = useCallback(async () => {
    try {
      const data = await homeService.getHomeFeed();
      // If backend returns empty content, fall back to curated content
      const hasContent =
        data &&
        (data.trendingCourses?.length > 0 ||
          data.upcomingEvents?.length > 0 ||
          data.dailyQuote);
      setFeed(hasContent ? data : { ...FALLBACK_FEED, stats: data?.stats || FALLBACK_FEED.stats });
      setFeedError(null);
    } catch (err) {
      // Network or auth error — surface a banner so the user can retry,
      // but keep showing fallback content so the screen isn't empty.
      if (__DEV__) console.warn('[Home] Feed fetch failed:', err);
      setFeed(FALLBACK_FEED);
      setFeedError("We couldn't load your latest feed. Showing offline content.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Pick a fresh random Amma quote on every pull-to-refresh
    setFeed((prev) => prev ? {
      ...prev,
      dailyQuote: { quote_text: getRandomQuote(), author: 'Amma', category: 'wisdom' },
    } : prev);
    loadFeed();
  }, [loadFeed]);

  const handleBellPress = () => {
    Alert.alert(
      'Notifications',
      'You have no new notifications.',
      [{ text: 'OK', style: 'default' }],
    );
  };

  const handleTrendingVideoPress = (item: TrendingVideo) => {
    Linking.openURL(`https://www.youtube.com/watch?v=${item.youtubeId}`).catch(() =>
      Alert.alert('Error', 'Unable to open video')
    );
  };

  const handleEventPress = (item: any) => {
    if (item.booking_url) {
      Linking.openURL(item.booking_url).catch(() =>
        Alert.alert('Error', 'Unable to open booking page')
      );
    } else {
      Alert.alert('Event', `Opening "${item.title}"...\n\nEvent details available after backend setup.`);
    }
  };

  const liveEvents = feed?.upcomingEvents?.filter(e => e.is_live) || [];
  const recentEvents = feed?.upcomingEvents?.filter(e => !e.is_live) || [];

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <ScrollView
        style={s.flex1}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ED7624"
          />
        }
      >
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.greeting}>
              {getGreetingTime()}, {loading ? '...' : feed?.greeting || 'Friend'}
            </Text>
          </View>
          <TouchableOpacity
            style={s.bellBtn}
            onPress={handleBellPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Image
              source={require('../assets/icons/New folder/Bell.png')}
              style={s.bellIconImg}
            />
          </TouchableOpacity>
        </View>

        {feedError ? <ErrorBanner message={feedError} onRetry={loadFeed} /> : null}

        {/* Daily Quote */}
        {feed?.dailyQuote && (
          <View style={s.quoteCard}>
            <Text style={s.quoteLabel}>Daily Affirmation</Text>
            <Text style={s.quoteText}>"{feed.dailyQuote.quote_text}"</Text>
            <Text style={s.quoteAuthor}>— {feed.dailyQuote.author || 'Unknown'}</Text>
          </View>
        )}

        {/* Stats Pills */}
        <View style={s.statsRow}>
          <View style={s.statPill}>
            <Image
              source={require('../assets/icons/New folder/Clock.png')}
              style={s.statIconImg}
            />
            <Text style={s.statValue}>
              {loading ? '--' : formatMinutes(feed?.stats.totalMinutes ?? 0)}
            </Text>
            <Text style={s.statLabel}>Total Time</Text>
          </View>
          <View style={[s.statPill, s.statPillSpaced]}>
            <Image
              source={require('../assets/icons/New folder/Fire.png')}
              style={s.statIconImg}
            />
            <Text style={s.statValue}>
              {loading ? '--' : feed?.stats.currentStreak ?? 0}
            </Text>
            <Text style={s.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Live Events Section */}
        {liveEvents && liveEvents.length > 0 && (
          <View style={s.sectionWrap}>
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionTitleInline}>Live Events</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('EventsMain')}
              >
                <Text style={s.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.horizontalListPadding}
              data={liveEvents}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isNoLive = item.category === 'none';
                return (
                  <TouchableOpacity
                    style={[s.eventCard, isNoLive && s.eventCardMuted]}
                    onPress={() => isNoLive ? null : handleEventPress(item)}
                    activeOpacity={isNoLive ? 1 : 0.8}
                  >
                    {item.is_live ? (
                      <View style={s.liveBadge}>
                        <Text style={s.liveBadgeText}>LIVE</Text>
                      </View>
                    ) : isNoLive ? (
                      <View style={s.liveBadgeMuted}>
                        <Text style={s.liveBadgeMutedText}>NO LIVE</Text>
                      </View>
                    ) : null}
                    <Text style={[s.eventTitle, isNoLive && s.eventTitleMuted]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {!isNoLive && (
                      <Text style={s.eventDate}>
                        {new Date(item.event_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* Recent Events Banner */}
        {recentEvents.length > 0 && (
          <View style={s.sectionWrap}>
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionTitleInline}>Upcoming Events</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('EventsMain', { initialTab: 'past' })}
              >
                <Text style={s.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.horizontalListPadding}
              data={recentEvents}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isNoLive = item.category === 'none';
                return (
                  <TouchableOpacity
                    style={[s.eventCard, isNoLive && s.eventCardMuted]}
                    onPress={() => isNoLive ? null : handleEventPress(item)}
                    activeOpacity={isNoLive ? 1 : 0.8}
                  >
                    {item.is_live ? (
                      <View style={s.liveBadge}>
                        <Text style={s.liveBadgeText}>LIVE</Text>
                      </View>
                    ) : isNoLive ? (
                      <View style={s.liveBadgeMuted}>
                        <Text style={s.liveBadgeMutedText}>NO LIVE</Text>
                      </View>
                    ) : null}
                    <Text style={[s.eventTitle, isNoLive && s.eventTitleMuted]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {!isNoLive && (
                      <Text style={s.eventDate}>
                        {new Date(item.event_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* Trending Videos / Courses */}
        <View style={s.sectionWrap}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitleInline}>Trending Videos</Text>
            <TouchableOpacity
              onPress={() => setShowAllTrending(true)}
            >
              <Text style={s.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={s.skeletonRow}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : TRENDING_VIDEOS.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.horizontalListPadding}
              data={TRENDING_VIDEOS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.trendingCard}
                  onPress={() => handleTrendingVideoPress(item)}
                  activeOpacity={0.85}
                >
                  <View style={s.trendingThumb}>
                    <Image
                      source={{ uri: item.thumbnailUrl }}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode="cover"
                    />
                    <View style={s.durationBadge}>
                      <Text style={s.durationBadgeText}>{item.duration}</Text>
                    </View>
                    <View style={s.playOverlay}>
                      <Text style={s.playIcon}>{'\u{25B6}'}</Text>
                    </View>
                  </View>
                  <View style={s.trendingInfo}>
                    <Text style={s.trendingTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={s.trendingInstructor} numberOfLines={1}>
                      {item.instructor} · {item.views}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={s.emptyTrendingWrap}>
              <Text style={s.emptyTrendingText}>No trending videos right now</Text>
            </View>
          )}
        </View>

        <View style={s.bottomSpacer} />
      </ScrollView>

      <Modal
        visible={showAllTrending}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowAllTrending(false);
          setSearchQuery('');
        }}
      >
        <SafeAreaView style={s.modalContainer}>
          <View style={s.modalHeader}>
            <TouchableOpacity 
              style={s.modalCloseButton} 
              onPress={() => {
                setShowAllTrending(false);
                setSearchQuery('');
              }}
              activeOpacity={0.7}
            >
              <Text style={s.modalCloseText}>← Back</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>Trending Videos</Text>
            <View style={{ width: scale(50) }} />
          </View>

          <View style={s.searchBarContainer}>
            <TextInput
              style={s.searchInput}
              placeholder="Search trending videos..."
              placeholderTextColor="#87553E"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={ALL_TRENDING_VIDEOS.filter(video => 
              video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              video.instructor.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            keyExtractor={(item) => `all-${item.id}`}
            contentContainerStyle={s.modalListContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.modalVideoCard}
                onPress={() => handleTrendingVideoPress(item)}
                activeOpacity={0.85}
              >
                <View style={s.modalVideoThumb}>
                  <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                  <View style={s.durationBadge}>
                    <Text style={s.durationBadgeText}>{item.duration}</Text>
                  </View>
                  <View style={s.playOverlay}>
                    <Text style={s.playIcon}>{'\u{25B6}'}</Text>
                  </View>
                </View>
                <View style={s.modalVideoInfo}>
                  <Text style={s.modalVideoTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={s.modalVideoInstructor} numberOfLines={1}>
                    {item.instructor}
                  </Text>
                  <Text style={s.modalVideoViews}>
                    {item.views} views
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={s.modalEmptyContainer}>
                <Text style={s.modalEmptyText}>No videos match your search.</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF5EE' },
  flex1: { flex: 1 },
  statPillSpaced: { marginLeft: scale(12) },
  horizontalListPadding: { paddingHorizontal: scale(24) },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(8),
  },
  greeting: { fontSize: moderateScale(24), fontWeight: 'bold', color: '#5C250E' },
  bellBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: { fontSize: moderateScale(18) },
  bellIconImg: { width: scale(20), height: scale(20), resizeMode: 'contain' },
  statsRow: { flexDirection: 'row', paddingHorizontal: scale(24), marginTop: verticalScale(16) },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
  },
  statIcon: { fontSize: moderateScale(14), marginRight: scale(4) },
  statIconImg: { width: scale(18), height: scale(18), resizeMode: 'contain', marginRight: scale(4) },
  statValue: { fontSize: moderateScale(14), fontWeight: '600', color: '#5C250E' },
  statLabel: { fontSize: moderateScale(12), color: '#87553E', marginLeft: scale(4) },
  sectionWrap: { marginTop: verticalScale(24) },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(24),
    marginBottom: verticalScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#5C250E',
    paddingHorizontal: scale(24),
    marginBottom: verticalScale(12),
  },
  sectionTitleInline: { fontSize: moderateScale(18), fontWeight: 'bold', color: '#5C250E' },
  seeAllText: { color: '#ED7624', fontSize: moderateScale(14), fontWeight: '600' },
  skeletonRow: { flexDirection: 'row', paddingHorizontal: scale(24) },
  skeletonCard: {
    backgroundColor: 'rgba(240, 127, 46, 0.1)',
    borderRadius: moderateScale(12),
    height: verticalScale(128),
    width: scale(192),
    marginRight: scale(12),
  },
  eventCard: {
    backgroundColor: '#ED7624',
    borderRadius: moderateScale(12),
    width: scale(256),
    height: verticalScale(144),
    marginRight: scale(12),
    padding: scale(16),
    justifyContent: 'flex-end',
  },
  eventCardMuted: {
    backgroundColor: '#C4B5A8',
  },
  liveBadge: {
    position: 'absolute',
    top: verticalScale(12),
    left: scale(12),
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(24),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
  },
  liveBadgeText: { color: '#FFFFFF', fontSize: moderateScale(12), fontWeight: 'bold' },
  liveBadgeMuted: {
    position: 'absolute',
    top: verticalScale(12),
    left: scale(12),
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: moderateScale(24),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
  },
  liveBadgeMutedText: { color: 'rgba(255,255,255,0.7)', fontSize: moderateScale(11), fontWeight: '600' },
  eventTitle: { color: '#FFFFFF', fontWeight: 'bold', fontSize: moderateScale(16) },
  eventTitleMuted: { color: 'rgba(255,255,255,0.6)' },
  eventDate: { color: 'rgba(255, 255, 255, 0.7)', fontSize: moderateScale(12), marginTop: verticalScale(4) },
  trendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    width: scale(192),
    marginRight: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
    overflow: 'hidden',
  },
  trendingThumb: {
    height: verticalScale(112),
    backgroundColor: 'rgba(240, 127, 46, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trendingThumbIcon: { fontSize: moderateScale(30) },
  durationBadge: {
    position: 'absolute',
    bottom: verticalScale(8),
    right: scale(8),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: moderateScale(24),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
  },
  durationBadgeText: { color: '#FFFFFF', fontSize: moderateScale(12) },
  playOverlay: {
    position: 'absolute',
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    marginLeft: scale(2),
  },
  trendingInfo: { padding: scale(12) },
  trendingTitle: { fontSize: moderateScale(14), fontWeight: '600', color: '#5C250E' },
  trendingInstructor: { fontSize: moderateScale(12), color: '#87553E', marginTop: verticalScale(4) },
  emptyTrendingWrap: { paddingHorizontal: scale(24), paddingVertical: verticalScale(16), alignItems: 'center' },
  emptyTrendingText: { fontSize: moderateScale(14), color: '#87553E' },
  quoteCard: {
    marginHorizontal: scale(24),
    marginTop: verticalScale(12),
    marginBottom: verticalScale(8),
    padding: scale(20),
    backgroundColor: 'rgba(240, 127, 46, 0.05)',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.2)',
  },
  quoteLabel: {
    fontSize: moderateScale(12),
    textTransform: 'uppercase',
    letterSpacing: moderateScale(2),
    color: '#ED7624',
    marginBottom: verticalScale(12),
    fontWeight: '600',
  },
  quoteText: { fontSize: moderateScale(16), color: '#5C250E', lineHeight: moderateScale(24), fontStyle: 'italic' },
  quoteAuthor: { fontSize: moderateScale(14), color: '#87553E', marginTop: verticalScale(12) },
  bottomSpacer: { height: verticalScale(110) },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF5EE',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240, 127, 46, 0.1)',
  },
  modalCloseButton: {
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(16),
    backgroundColor: 'rgba(240, 127, 46, 0.1)',
  },
  modalCloseText: {
    color: '#ED7624',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#5C250E',
    textAlign: 'center',
    flex: 1,
  },
  searchBarContainer: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(24),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    fontSize: moderateScale(14),
    color: '#5C250E',
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.15)',
  },
  modalListContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(40),
  },
  modalVideoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.1)',
    overflow: 'hidden',
    height: verticalScale(100),
  },
  modalVideoThumb: {
    width: scale(140),
    height: '100%',
    backgroundColor: 'rgba(240, 127, 46, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalVideoInfo: {
    flex: 1,
    padding: scale(12),
    justifyContent: 'center',
  },
  modalVideoTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#5C250E',
    lineHeight: moderateScale(18),
  },
  modalVideoInstructor: {
    fontSize: moderateScale(12),
    color: '#87553E',
    marginTop: verticalScale(4),
  },
  modalVideoViews: {
    fontSize: moderateScale(11),
    color: '#A0705A',
    marginTop: verticalScale(2),
  },
  modalEmptyContainer: {
    paddingVertical: verticalScale(40),
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: moderateScale(14),
    color: '#87553E',
  },
});

export default HomeMain;
