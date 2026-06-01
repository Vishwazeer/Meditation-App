/**
 * File: JourneyMain.tsx
 *
 * Description: Journey tracking screen displaying meditation streaks, habit
 * grids, weekly progress stats, and session history for the user.
 *
 * Author: Navnit(Ninjacode911)
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HabitGrid } from '../components/journey/HabitGrid';
import { ErrorBanner } from '../components/shared/ErrorBanner';
import {
  habitsService,
  HabitLog,
  PerformanceRating,
} from '../services/habits.service';
import { homeService } from '../services/home.service';
import { JourneyStackParamList } from '../navigation/types';

type JourneyNav = NativeStackNavigationProp<JourneyStackParamList, 'JourneyMain'>;

interface HabitConfig {
  type: string;
  name: string;
  icon: any;
}

const HABITS: HabitConfig[] = [
  { type: 'meditation', name: 'Meditation', icon: require('../assets/icons/New folder/Yoga.png') },
  { type: 'exercise', name: 'Exercise', icon: require('../assets/icons/New folder/Exercise.png') },
  { type: 'cold_shower', name: 'Cold Shower', icon: require('../assets/icons/New folder/Shower.png') },
  { type: 'early_wakeup', name: 'Early Wakeup', icon: require('../assets/icons/New folder/Clock.png') },
];

interface JourneyData {
  habitLogs: HabitLog[];
  streaks: Record<string, { current_streak: number; longest_streak: number }>;
  weeklyPerformance: PerformanceRating[];
  dailyQuote: { quote_text: string; author: string } | null;
}

const SkeletonBlock = ({ height }: { height: number }) => (
  <View
    style={[s.skeletonBlock, { height }]}
  />
);

const PerformanceBar = ({
  rating,
  dayLabel,
}: {
  rating: number;
  dayLabel: string;
}) => {
  const barHeight = Math.max(rating * 10, 4);
  return (
    <View style={s.perfBarWrap}>
      <View
        style={[s.perfBar, { height: barHeight }]}
      />
      <Text style={s.perfBarLabel}>{dayLabel}</Text>
    </View>
  );
};

const JourneyMain = () => {
  const navigation = useNavigation<JourneyNav>();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Local-only state so the "Log Today" button works even without backend connectivity
  const [localLogs, setLocalLogs] = useState<Record<string, Record<string, boolean>>>({
    meditation: {},
    exercise: {},
    cold_shower: {},
    early_wakeup: {},
  });
  const [localStreaks, setLocalStreaks] = useState<Record<string, number>>({
    meditation: 0,
    exercise: 0,
    cold_shower: 0,
    early_wakeup: 0,
  });
  // Local-only state so Rate Today works even without backend
  const [localRatings, setLocalRatings] = useState<Record<string, number>>({});
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratedAlertOpen, setRatedAlertOpen] = useState(false);
  const [ratedRatingValue, setRatedRatingValue] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        habitsService.getAllHabits(),
        habitsService.getWeeklyPerformance(),
        homeService.getHomeFeed(),
      ]);
      const [habitsData, perfData, feedData] = results;

      const habits =
        habitsData.status === 'fulfilled' ? habitsData.value : { streaks: {}, logs: [] };
      const perf =
        perfData.status === 'fulfilled' ? perfData.value : [];
      const feed =
        feedData.status === 'fulfilled' ? feedData.value : null;

      setData({
        habitLogs: habits.logs || [],
        streaks: habits.streaks || {},
        weeklyPerformance: perf || [],
        dailyQuote: feed?.dailyQuote ?? null,
      });

      // Track which sub-fetches failed so we can show one consolidated banner
      // instead of swallowing the failures silently.
      const failed = results
        .map((r, i) => (r.status === 'rejected' ? i : -1))
        .filter((i) => i >= 0);
      if (failed.length === results.length) {
        setLoadError("Couldn't reach the backend. Pull to refresh once you're connected.");
      } else if (failed.length > 0) {
        setLoadError('Some sections of your journey failed to load. Pull to refresh to try again.');
      } else {
        setLoadError(null);
      }
      if (__DEV__ && failed.length > 0) {
        const sectionNames = ['habits', 'performance', 'feed'];
        failed.forEach((i) =>
          console.warn(`[Journey] ${sectionNames[i]} fetch failed:`, (results[i] as PromiseRejectedResult).reason),
        );
      }
    } catch (err) {
      if (__DEV__) console.warn('[Journey] Unexpected loadData error:', err);
      setLoadError('Something went wrong loading your journey. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleLogHabit = useCallback(
    async (habitType: string) => {
      const today = new Date().toISOString().split('T')[0];
      const alreadyLogged = localLogs[habitType]?.[today] === true;

      if (alreadyLogged) {
        Alert.alert('Already Logged', 'You already logged this habit today.');
        return;
      }

      // Update local state immediately for responsive UX
      setLocalLogs((prev) => {
        const next = { ...prev };
        next[habitType] = { ...next[habitType], [today]: true };
        return next;
      });
      setLocalStreaks((prev) => ({
        ...prev,
        [habitType]: (prev[habitType] || 0) + 1,
      }));

      const habitName = HABITS.find((h) => h.type === habitType)?.name || habitType;
      Alert.alert('Logged!', `${habitName} logged for today. Keep it up!`);

      // Best-effort backend sync — don't fail if offline
      habitsService.logHabit(habitType, { completed: true }).catch(() => {
        // Silent fail — local state already updated
      });
    },
    [localLogs],
  );

  const getHabitLogs = useCallback(
    (habitType: string): Array<{ date: string; completed: boolean }> => {
      const logsArray = Array.isArray(data?.habitLogs) ? data.habitLogs : [];

      const remoteLogs = logsArray
        .filter((log) => log && log.habit_type === habitType)
        .map((log) => ({
          date: log.logged_at,
          completed: log.completed,
        }));

      const localMap = localLogs[habitType] || {};
      const mergedMap = new Map<string, boolean>();

      for (const log of remoteLogs) {
        mergedMap.set(log.date, log.completed);
      }
      for (const [dateStr, isCompleted] of Object.entries(localMap)) {
        mergedMap.set(dateStr, isCompleted);
      }

      return Array.from(mergedMap.entries()).map(([date, completed]) => ({
        date,
        completed,
      }));
    },
    [data, localLogs],
  );

  const handleToggleHabitDate = useCallback(
    async (habitType: string, dateStr: string) => {
      const currentLogs = getHabitLogs(habitType);
      const wasCompleted = currentLogs.find((l) => l.date === dateStr)?.completed ?? false;
      const nextCompleted = !wasCompleted;

      // Update local state immediately for instant responsive UI feedback
      setLocalLogs((prev) => {
        const next = { ...prev };
        next[habitType] = { ...next[habitType], [dateStr]: nextCompleted };
        return next;
      });

      // Adjust streak count based on toggle
      setLocalStreaks((prev) => {
        const currentStreak = prev[habitType] || 0;
        return {
          ...prev,
          [habitType]: nextCompleted ? currentStreak + 1 : Math.max(0, currentStreak - 1),
        };
      });

      // Best-effort backend sync — don't fail if offline
      try {
        await habitsService.logHabit(habitType, { completed: nextCompleted, logged_at: dateStr } as any);
      } catch {
        // Silent fail — local state already holds the true value
      }
    },
    [getHabitLogs],
  );

  const getStreakCount = (habitType: string): number => {
    const remote = data?.streaks?.[habitType]?.current_streak ?? 0;
    const local = localStreaks[habitType] ?? 0;
    return Math.max(remote, local);
  };

  const getWeekDayLabels = (): string[] => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push(days[d.getDay()]);
    }
    return result;
  };

  const getPerformanceForDay = (daysAgo: number): number => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - daysAgo));
    const dateStr = d.toISOString().split('T')[0];
    
    const local = localRatings[dateStr];
    if (local !== undefined) return local;

    const perfArray = Array.isArray(data?.weeklyPerformance) ? data.weeklyPerformance : [];
    if (perfArray.length === 0) return 0;

    const entry = perfArray.find((p) => p && p.rated_at === dateStr);
    return entry?.rating ?? 0;
  };

  const handleRateToday = useCallback(
    (rating: number) => {
      const today = new Date().toISOString().split('T')[0];
      setLocalRatings((prev) => ({ ...prev, [today]: rating }));
      setRatingModalOpen(false);
      setRatedRatingValue(rating);
      setRatedAlertOpen(true);
      // Best-effort backend sync — don't fail on offline
      habitsService.ratePerformance(rating).catch(() => {});
    },
    [],
  );


  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <ScrollView style={s.flex1} showsVerticalScrollIndicator={false}>
          <View style={s.skeletonHeaderWrap}>
            <View style={s.skeletonHeaderBar} />
          </View>
          <SkeletonBlock height={200} />
          <SkeletonBlock height={200} />
          <SkeletonBlock height={120} />
          <SkeletonBlock height={100} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView
        style={s.flex1}
        contentContainerStyle={[s.scrollContent, { paddingBottom: Math.max(insets.bottom, 10) + 60 }]}
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
        <View style={s.headerWrap}>
          <Text style={s.headerTitle}>
            My Journey
          </Text>
          <Text style={s.headerSubtitle}>
            Track your daily sadhana
          </Text>
        </View>

        {loadError ? <ErrorBanner message={loadError} onRetry={loadData} /> : null}

        {/* Start Meditation Giant CTA */}
        <TouchableOpacity
          style={s.meditationCta}
          onPress={() => navigation.navigate('MeditationTimer')}
          activeOpacity={0.85}
        >
          <View style={s.meditationCtaContent}>
            <View style={s.meditationCtaIconWrap}>
              <Image source={require('../assets/icons/New folder/Yoga.png')} style={s.meditationCtaIconImage} />
            </View>
            <View style={s.meditationCtaTextWrap}>
              <Text style={s.meditationCtaTitle}>
                Start Meditation
              </Text>
              <Text style={s.meditationCtaSubtitle}>
                Find your center. Begin your daily practice now.
              </Text>
            </View>
          </View>
          <View style={s.meditationCtaPlayWrap}>
            <Text style={s.meditationCtaPlayText}>{'\u25B6'}   BEGIN</Text>
          </View>
        </TouchableOpacity>

        {/* Habit Grids */}
        {HABITS.map((habit) => (
          <HabitGrid
            key={habit.type}
            habitType={habit.type}
            habitIcon={habit.icon}
            habitName={habit.name}
            logs={getHabitLogs(habit.type)}
            streakCount={getStreakCount(habit.type)}
            onLogToday={() => handleLogHabit(habit.type)}
            onToggleDate={(dateStr) => handleToggleHabitDate(habit.type, dateStr)}
          />
        ))}

        {/* Performance Tracker */}
        <View style={s.perfCard}>
          <Text style={s.perfCardTitle}>
            Performance Tracker
          </Text>
          <Text style={s.perfCardSubtitle}>
            Rate your daily performance
          </Text>

          <View style={s.perfChartRow}>
            {getWeekDayLabels().map((dayLabel, index) => (
              <PerformanceBar
                key={`perf-${index}`}
                rating={getPerformanceForDay(index)}
                dayLabel={dayLabel}
              />
            ))}
          </View>

          <TouchableOpacity
            style={s.rateTodayButton}
            onPress={() => setRatingModalOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={s.rateTodayText}>
              Rate Today
            </Text>
          </TouchableOpacity>
        </View>

        {/* Daily Affirmation */}
        {data?.dailyQuote && (
          <View style={s.affirmationCard}>
            <Text style={s.affirmationLabel}>
              Daily Affirmation
            </Text>
            <Text style={s.affirmationQuote}>
              "{data.dailyQuote.quote_text}"
            </Text>
            <Text style={s.affirmationAuthor}>
              — {data.dailyQuote.author || 'Unknown'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Rating Modal */}
      <Modal
        visible={ratingModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Rate Today</Text>
            <Text style={s.modalSubtitle}>
              How was your practice today? Tap a number from 1 to 10.
            </Text>
            <View style={s.ratingGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={s.ratingChip}
                  onPress={() => handleRateToday(n)}
                  activeOpacity={0.7}
                >
                  <Text style={s.ratingChipText}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={s.modalCancel}
              onPress={() => setRatingModalOpen(false)}
            >
              <Text style={s.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Rated! Success Modal */}
      <Modal
        visible={ratedAlertOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRatedAlertOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { alignItems: 'center', padding: 24 }]}>
            <View style={s.modalCheckWrap}>
              <Text style={s.modalCheckIcon}>{'\u{2713}'}</Text>
            </View>
            <Text style={[s.modalTitle, { textAlign: 'center' }]}>Rated!</Text>
            <Text style={s.modalBody}>
              Today's performance logged as {ratedRatingValue}/10. Keep it up!
            </Text>
            <TouchableOpacity
              onPress={() => setRatedAlertOpen(false)}
              style={s.modalButton}
              activeOpacity={0.8}
            >
              <Text style={s.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default JourneyMain;

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5EE',
  },
  horizontalListPadding: { paddingHorizontal: scale(24) },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    // paddingBottom is handled dynamically based on safe area bottom inset
  },
  skeletonBlock: {
    backgroundColor: 'rgba(240, 127, 46, 0.12)',
    borderRadius: moderateScale(12),
    marginHorizontal: scale(24),
    marginBottom: verticalScale(16),
  },
  skeletonHeaderWrap: {
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(8),
  },
  skeletonHeaderBar: {
    backgroundColor: 'rgba(240, 127, 46, 0.12)',
    height: verticalScale(32),
    width: scale(160),
    borderRadius: moderateScale(12),
  },
  headerWrap: {
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(8),
  },
  headerTitle: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    color: '#5C250E',
  },
  headerSubtitle: {
    fontSize: moderateScale(14),
    color: '#87553E',
    marginTop: verticalScale(4),
  },
  meditationCta: {
    marginHorizontal: scale(24),
    marginTop: verticalScale(16),
    marginBottom: verticalScale(16),
    backgroundColor: '#ED7624',
    borderRadius: moderateScale(24),
    padding: scale(24),
    shadowColor: '#ED7624',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  meditationCtaContent: {
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  meditationCtaIconWrap: {
    width: scale(80),
    height: scale(80),
    borderRadius: moderateScale(40),
    backgroundColor: '#FFF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(16),
  },
  meditationCtaIcon: {
    fontSize: moderateScale(48),
  },
  meditationCtaIconImage: {
    width: scale(52),
    height: scale(52),
    resizeMode: 'contain',
  },
  meditationCtaTextWrap: {
    alignItems: 'center',
  },
  meditationCtaTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: moderateScale(26),
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  meditationCtaSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: moderateScale(15),
    textAlign: 'center',
    lineHeight: moderateScale(22),
    paddingHorizontal: scale(16),
  },
  meditationCtaPlayWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(32),
    width: '100%',
    height: verticalScale(60),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  meditationCtaPlayText: {
    color: '#ED7624',
    fontSize: moderateScale(20),
    fontWeight: '800',
    marginLeft: scale(8),
  },
  perfCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
    marginHorizontal: scale(24),
    marginBottom: verticalScale(16),
    padding: scale(16),
  },
  perfCardTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#5C250E',
    marginBottom: verticalScale(4),
  },
  perfCardSubtitle: {
    fontSize: moderateScale(12),
    color: '#87553E',
    marginBottom: verticalScale(16),
  },
  perfChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: verticalScale(112),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(240, 127, 46, 0.12)',
    paddingBottom: verticalScale(8),
  },
  perfBarWrap: {
    alignItems: 'center',
    flex: 1,
  },
  perfBar: {
    width: scale(24),
    backgroundColor: '#ED7624',
    borderTopLeftRadius: moderateScale(2),
    borderTopRightRadius: moderateScale(2),
  },
  perfBarLabel: {
    fontSize: moderateScale(12),
    color: '#87553E',
    marginTop: verticalScale(4),
  },
  rateTodayButton: {
    backgroundColor: 'rgba(240, 127, 46, 0.1)',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(10),
    alignItems: 'center',
    marginTop: verticalScale(12),
  },
  rateTodayText: {
    color: '#5C250E',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  affirmationCard: {
    marginHorizontal: scale(24),
    marginBottom: verticalScale(16),
    padding: scale(20),
    backgroundColor: 'rgba(240, 127, 46, 0.05)',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.15)',
  },
  affirmationLabel: {
    fontSize: moderateScale(12),
    textTransform: 'uppercase',
    letterSpacing: scale(2),
    color: '#ED7624',
    marginBottom: verticalScale(12),
    fontWeight: '600',
  },
  affirmationQuote: {
    fontSize: moderateScale(16),
    color: '#5C250E',
    lineHeight: moderateScale(24),
    fontStyle: 'italic',
  },
  affirmationAuthor: {
    fontSize: moderateScale(14),
    color: '#87553E',
    marginTop: verticalScale(12),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(24),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: scale(20),
    width: '100%',
    maxWidth: scale(360),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#5C250E',
    marginBottom: verticalScale(4),
  },
  modalSubtitle: {
    fontSize: moderateScale(13),
    color: '#87553E',
    marginBottom: verticalScale(16),
    lineHeight: moderateScale(18),
  },
  ratingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
  },
  ratingChip: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: moderateScale(8),
    backgroundColor: 'rgba(240, 127, 46, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(8),
  },
  ratingChipText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#5C250E',
  },
  visionPresetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
  },
  visionPresetItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(240, 127, 46, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(8),
  },
  visionPresetIcon: {
    fontSize: moderateScale(28),
    marginBottom: verticalScale(4),
  },
  visionPresetCaption: {
    fontSize: moderateScale(11),
    color: '#5C250E',
    fontWeight: '600',
  },
  modalCancel: {
    paddingVertical: verticalScale(10),
    alignItems: 'center',
    borderRadius: moderateScale(8),
    backgroundColor: 'rgba(240, 127, 46, 0.05)',
  },
  modalCancelText: {
    color: '#87553E',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  modalCheckWrap: {
    width: scale(64),
    height: scale(64),
    borderRadius: moderateScale(32),
    backgroundColor: 'rgba(240, 127, 46, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(16),
  },
  modalCheckIcon: {
    fontSize: moderateScale(30),
    color: '#ED7624',
  },
  modalBody: {
    fontSize: moderateScale(14),
    color: '#87553E',
    textAlign: 'center',
    marginBottom: verticalScale(24),
    lineHeight: moderateScale(20),
  },
  modalButton: {
    backgroundColor: '#ED7624',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(32),
    borderRadius: moderateScale(8),
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
