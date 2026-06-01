/**
 * File: MeditationTimerScreen.tsx
 *
 * Description: Full-screen meditation timer with animated countdown circle,
 * ambient sound selection, session type picker, and session logging on completion.
 *
 * Author: Navnit(Ninjacode911)
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Image,
  ImageSourcePropType,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from '../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TimerCircle } from '../components/meditation/TimerCircle';
import { BreathingGuide } from '../components/meditation/BreathingGuide';
import { useMeditationStore } from '../store/meditationStore';
import { meditationService } from '../services/meditation.service';
import { JourneyStackParamList } from '../navigation/types';
import { audioService, SoundKey } from '../services/audio.service';

type TimerNav = NativeStackNavigationProp<JourneyStackParamList, 'MeditationTimer'>;

interface GuidedSession {
  id: string;
  title: string;
  durationSeconds: number;
  icon: any;
  description: string;
  soundKey: SoundKey;
}

const GUIDED_SESSIONS: GuidedSession[] = [
  {
    id: 'clarity',
    title: 'Morning Clarity',
    durationSeconds: 80, // Exactly 1m 20s as per the wav file length
    icon: require('../assets/icons/New folder/Morning clarity.png'),
    description: 'Awaken your mind and find focus.',
    soundKey: 'morning_clarity',
  },
  {
    id: 'anxiety',
    title: 'Anxiety Relief',
    durationSeconds: 40, // Exactly 40s as per the wav file length
    icon: require('../assets/icons/New folder/Anxiety relief.png'),
    description: 'Calm your nervous system.',
    soundKey: 'anxiety_relief',
  },
  {
    id: 'sleep',
    title: 'Deep Sleep',
    durationSeconds: 40, // Exactly 40s as per the wav file length
    icon: require('../assets/icons/New folder/Deep sleep.png'),
    description: 'Drift off into restful sleep.',
    soundKey: 'deep_sleep',
  },
  {
    id: 'focus',
    title: 'Mindful Focus',
    durationSeconds: 80, // Temporarily matching morning clarity wav file length
    icon: require('../assets/icons/New folder/Mindful focus.png'),
    description: 'Sharpen your concentration.',
    soundKey: 'mindful_focus',
  },
];

const formatGuidedDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
};

interface BreathingPhase {
  phase: 'inhale' | 'hold' | 'exhale' | 'hold_out';
  duration: number;
}

interface BreathingPattern {
  id: string;
  title: string;
  icon: any;
  description: string;
  sequence: BreathingPhase[];
}

const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: 'box',
    title: 'Box Breathing',
    icon: require('../assets/icons/New folder/Box breathing.png'),
    description: 'Equal 4s inhale, hold, exhale, hold ratios for deep focus.',
    sequence: [
      { phase: 'inhale', duration: 4 },
      { phase: 'hold', duration: 4 },
      { phase: 'exhale', duration: 4 },
      { phase: 'hold_out', duration: 4 },
    ],
  },
  {
    id: 'relax',
    title: '4-7-8 Relax',
    icon: require('../assets/icons/New folder/4 7 8 relax.png'),
    description: 'A natural tranquilizer that deeply settles the nervous system.',
    sequence: [
      { phase: 'inhale', duration: 4 },
      { phase: 'hold', duration: 7 },
      { phase: 'exhale', duration: 8 },
    ],
  },
  {
    id: 'equal',
    title: 'Equal Balance',
    icon: require('../assets/icons/New folder/Equal balance.png'),
    description: 'Simple equal 4s inhale and exhale breaths to center yourself.',
    sequence: [
      { phase: 'inhale', duration: 4 },
      { phase: 'exhale', duration: 4 },
    ],
  },
];

const DURATION_PRESETS = [3, 5, 10, 15, 20, 30] as const;

type SoundOption = 'nature' | 'rain' | 'ocean' | 'birds' | 'bowl';
type SessionType = 'free' | 'guided' | 'breathing';

const SOUND_OPTIONS: Array<{ key: SoundOption; label: string; icon?: string }> = [
  { key: 'nature', label: 'Nature', icon: '🌳' },
  { key: 'rain', label: 'Rain', icon: '🌧️' },
  { key: 'ocean', label: 'Ocean', icon: '🌊' },
  { key: 'birds', label: 'Birds', icon: '🐦' },
  { key: 'bowl', label: 'Bowl', icon: '🥣' },
];

const SOUND_ICONS: Record<SoundOption, ImageSourcePropType> = {
  nature: require('../assets/icons/New folder/Nature.png'),
  rain: require('../assets/icons/New folder/rain.png'),
  ocean: require('../assets/icons/New folder/ocean.png'),
  birds: require('../assets/icons/New folder/Birds.png'),
  bowl: require('../assets/icons/New folder/Bowl.png'),
};

const TIMER_ICONS = {
  back: require('../assets/icons/New folder/Back.png'),
  bell: require('../assets/icons/New folder/Bell.png'),
  mute: require('../assets/icons/New folder/Mute.png'),
  pause: require('../assets/icons/New folder/Pause.png'),
  play: require('../assets/icons/New folder/Play.png'),
  sound: require('../assets/icons/New folder/sound.png'),
  stop: require('../assets/icons/New folder/Finish.png'),
};

const SESSION_TYPES: Array<{ key: SessionType; label: string }> = [
  { key: 'free', label: 'Free' },
  { key: 'guided', label: 'Guided' },
  { key: 'breathing', label: 'Breathing' },
];

// Animated bars that pulse while a sound is selected \u2014 visual confirmation that
// playback is active. Actual audio playback requires a configured audio CDN.
const SoundWaveIndicator = ({
  soundLabel,
  isPaused,
  onToggle,
}: {
  soundLabel: string;
  isPaused: boolean;
  onToggle: () => void;
}) => {
  const bars = useRef([0, 0, 0, 0].map(() => new Animated.Value(0.3))).current;
  const loopsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    if (isPaused) {
      loopsRef.current.forEach((l) => l.stop());
      // Reset bars to resting state when paused
      bars.forEach((bar) =>
        Animated.timing(bar, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: false,
        }).start()
      );
      return;
    }

    loopsRef.current = bars.map((bar, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: 1,
            duration: 500 + i * 120,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: 0.3,
            duration: 500 + i * 120,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      );
      loop.start();
      return loop;
    });
    return () => loopsRef.current.forEach((l) => l.stop());
  }, [bars, isPaused]);

  return (
    <TouchableOpacity
      style={waveStyles.wrap}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={waveStyles.barsRow}>
        {bars.map((bar, i) => (
          <Animated.View
            key={i}
            style={[
              waveStyles.bar,
              {
                transform: [{ scaleY: bar }],
                opacity: bar.interpolate({
                  inputRange: [0.3, 1],
                  outputRange: [0.5, 1],
                }),
                backgroundColor: isPaused ? '#A86D53' : '#ED7624',
              },
            ]}
          />
        ))}
      </View>
      <Text style={waveStyles.label}>
        {isPaused ? `Paused: ${soundLabel}` : `Now playing: ${soundLabel}`}
      </Text>
    </TouchableOpacity>
  );
};

const waveStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(240, 127, 46, 0.06)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
    marginRight: 8,
  },
  bar: {
    width: 3,
    height: 16,
    backgroundColor: '#ED7624',
    borderRadius: 2,
    marginHorizontal: 1.5,
  },
  label: {
    color: '#C95A1E',
    fontSize: 13,
    fontWeight: '600',
  },
});

const interpolateColor = (color1: string, color2: string, factor: number) => {
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);

  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const SmoothGradient = ({
  color1,
  color2,
  height,
}: {
  color1: string;
  color2: string;
  height: number;
}) => {
  const steps = 15;
  const stepHeight = height / steps;
  
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {Array.from({ length: steps }).map((_, i) => {
        const factor = i / (steps - 1);
        const color = interpolateColor(color1, color2, factor);
        return (
          <View
            key={i}
            style={{
              height: stepHeight,
              backgroundColor: color,
              alignSelf: 'stretch',
            }}
          />
        );
      })}
    </View>
  );
};

const MeditationTimerScreen = () => {
  const navigation = useNavigation<TimerNav>();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isPreviewPaused, setIsPreviewPaused] = useState(false);
  const [selectedGuidedId, setSelectedGuidedId] = useState<string>('clarity');
  const [selectedBreathingPatternId, setSelectedBreathingPatternId] = useState<string>('box');
  const [showStopModal, setShowStopModal] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;

    // Stop audio immediately if screen loses focus/user navigates away
    const unsubscribe = navigation.addListener('blur', () => {
      audioService.stop();
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
      // Always stop audio when screen unmounts
      audioService.stop();
    };
  }, [navigation]);

  const {
    duration,
    remaining,
    isRunning,
    isPaused,
    selectedSound,
    sessionType,
    startedAt,
    setDuration,
    setSound,
    setSessionType,
    start,
    pause,
    resume,
    stop,
    tick,
    reset,
    isEndless,
    elapsedTime,
    intervalChimeEnabled,
    setIntervalChime,
  } = useMeditationStore();

  const selectedMinutes = isEndless ? '\u221E' : duration / 60;

  const handleSoundSelect = useCallback(
    (key: SoundOption) => {
      setSound(key);
      setIsPreviewPaused(false);
    },
    [setSound]
  );

  const getActiveSoundKey = useCallback((): SoundKey | null => {
    if (sessionType === 'guided') {
      const activeSession = GUIDED_SESSIONS.find((s) => s.id === selectedGuidedId);
      return activeSession ? activeSession.soundKey : null;
    }
    return selectedSound ? (selectedSound as SoundKey) : null;
  }, [sessionType, selectedGuidedId, selectedSound]);

  useEffect(() => {
    if (sessionType === 'guided') {
      const activeSession = GUIDED_SESSIONS.find((s) => s.id === selectedGuidedId);
      if (activeSession) {
        setDuration(activeSession.durationSeconds / 60);
      }
    }
  }, [sessionType, selectedGuidedId, setDuration]);

  useEffect(() => {
    if (sessionType === 'breathing') {
      setDuration(2);
    }
  }, [sessionType, setDuration]);

  // -- Audio: handle playback based on timer state and session type --
  useEffect(() => {
    if (showCompletion) {
      audioService.stop();
      return;
    }

    const activeKey = getActiveSoundKey();
    if (!activeKey) {
      audioService.stop();
      return;
    }

    const isMeditationActive = isRunning || isPaused;
    if (isMeditationActive) {
      if (isPaused) {
        audioService.pause();
      } else if (isRunning) {
        audioService.play(activeKey);
      }
    } else {
      if (sessionType === 'guided') {
        audioService.stop();
      } else {
        if (isPreviewPaused) {
          audioService.pause();
        } else {
          audioService.play(activeKey);
        }
      }
    }
  }, [isRunning, isPaused, sessionType, getActiveSoundKey, isPreviewPaused, showCompletion]);

  // Countdown interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, tick]);

  // Trigger interval chime every 5 minutes
  useEffect(() => {
    if (isRunning && intervalChimeEnabled && elapsedTime > 0 && elapsedTime % 300 === 0) {
      audioService.playChime();
    }
  }, [isRunning, elapsedTime, intervalChimeEnabled]);

  // Detect completion
  useEffect(() => {
    if (!isEndless && remaining === 0 && startedAt && !isRunning && !isPaused) {
      handleCompletion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleCompletion is defined below and stable via useCallback
  }, [remaining, startedAt, isRunning, isPaused, isEndless]);

  const handleCompletion = useCallback(async () => {
    if (!startedAt) return;

    // Stop ambient sound on completion
    audioService.stop();
    // Play completion chime
    if (intervalChimeEnabled) {
      audioService.playChime();
    }

    if (isMountedRef.current) setShowCompletion(true);

    try {
      const durationMinutes = duration / 60;
      // Backend createSession also auto-logs the meditation habit, so
      // we don't separately POST to /habits/log here.
      await meditationService.logSession({
        duration_minutes: durationMinutes,
        session_type: sessionType,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
      });
    } catch (err) {
      // Session logging is best-effort — never block the user.
      if (__DEV__) console.warn('[MeditationTimer] Session log failed:', err);
    }
  }, [startedAt, duration, sessionType, intervalChimeEnabled]);

  const handleDismissCompletion = useCallback(() => {
    setShowCompletion(false);
    reset();
    navigation.goBack();
  }, [reset, navigation]);

  const isActive = isRunning || isPaused;

  const handleStart = useCallback(() => {
    start();
    setIsPreviewPaused(false);
    const activeKey = getActiveSoundKey();
    if (activeKey) {
      audioService.play(activeKey, true); // Force replay from start
    }
  }, [start, getActiveSoundKey]);

  const handleTimerPress = useCallback(() => {
    if (!isActive) {
      handleStart();
      return;
    }

    if (isRunning) {
      pause();
    } else {
      resume();
    }
  }, [handleStart, isActive, isRunning, pause, resume]);

  const handleStop = useCallback(() => {
    setShowStopModal(true);
  }, []);

  const handleConfirmStop = useCallback(() => {
    setShowStopModal(false);
    stop();
    setIsPreviewPaused(false);
    const activeKey = getActiveSoundKey();
    if (activeKey && sessionType !== 'guided') {
      audioService.play(activeKey, true); // Restart preview from start on setup screen
    } else {
      audioService.stop(); // Strictly stop for guided mode
    }
  }, [stop, getActiveSoundKey, sessionType]);

  useEffect(() => {
    const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', (e) => {
      if (!isActive) {
        return;
      }

      e.preventDefault();
      handleStop();
    });

    return () => {
      unsubscribeBeforeRemove();
    };
  }, [navigation, isActive, handleStop]);

  if (showCompletion) {
    return (
      <SafeAreaView style={s.darkContainer} edges={['top', 'bottom']}>
        <View style={s.completionWrap}>
          <Text style={s.completionIcon}>{'\u{1F514}'}</Text>
          <Text style={s.completionTitle}>
            Session Complete
          </Text>
          <Text style={s.completionSubtitle}>
            You meditated for {selectedMinutes} minutes
          </Text>
          <Text style={s.completionNote}>
            Your practice has been logged. Namaste.
          </Text>

          <TouchableOpacity
            style={s.doneButton}
            onPress={handleDismissCompletion}
            activeOpacity={0.8}
          >
            <Text style={s.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.darkContainer} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.headerBackButton}
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Image source={TIMER_ICONS.back} style={s.headerBackIcon} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          Meditation
        </Text>
      </View>

      <ScrollView
        style={s.flex1}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isActive}
        contentContainerStyle={s.scrollContent}
      >
        {/* Timer circle or Breathing guide */}
        <View style={s.timerWrap}>
          <TimerCircle
            remaining={remaining}
            total={duration}
            isRunning={isRunning}
            isEndless={isEndless}
            elapsedTime={elapsedTime}
            onPress={handleTimerPress}
          >
            {sessionType === 'breathing' ? (
              <BreathingGuide
                isRunning={isRunning}
                isPaused={isPaused}
                embedded
                pattern={
                  BREATHING_PATTERNS.find((p) => p.id === selectedBreathingPatternId) ||
                  BREATHING_PATTERNS[0]
                }
              />
            ) : null}
          </TimerCircle>
        </View>

        {/* Duration presets */}
        {!isActive && sessionType === 'free' && (
          <View style={s.durationSection}>
            <Text style={s.sectionLabel}>
              Duration (minutes)
            </Text>
            <View style={s.durationRow}>
              {DURATION_PRESETS.map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    s.durationPresetOuter,
                    selectedMinutes === mins
                      ? s.durationPresetActive
                      : s.durationPresetInactive,
                  ]}
                  onPress={() => setDuration(mins)}
                  activeOpacity={0.7}
                >
                  <View style={s.durationPresetInner}>
                    {selectedMinutes === mins && <SmoothGradient color1="#FF9F59" color2="#D9531E" height={56} />}
                    <Text
                      style={[
                        s.durationPresetText,
                        selectedMinutes === mins
                          ? s.durationPresetTextActive
                          : s.durationPresetTextInactive,
                      ]}
                    >
                      {mins}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Endless Preset */}
              <TouchableOpacity
                style={[
                  s.durationPresetOuter,
                  isEndless ? s.durationPresetActive : s.durationPresetInactive,
                ]}
                onPress={() => setDuration(0)}
                activeOpacity={0.7}
              >
                <View style={s.durationPresetInner}>
                  {isEndless && <SmoothGradient color1="#FF9F59" color2="#D9531E" height={56} />}
                  <Text
                    style={[
                      s.durationPresetText,
                      isEndless ? s.durationPresetTextActive : s.durationPresetTextInactive,
                    ]}
                  >
                    {'\u221E'}
                  </Text>
                </View>
              </TouchableOpacity>

            </View>
          </View>
        )}

        {/* Breathing Duration presets */}
        {!isActive && sessionType === 'breathing' && (
          <View style={s.durationSection}>
            <Text style={s.sectionLabel}>
              Breathing Duration (minutes)
            </Text>
            <View style={s.durationRow}>
              {[2, 5, 10].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    s.durationPresetOuter,
                    selectedMinutes === mins
                      ? s.durationPresetActive
                      : s.durationPresetInactive,
                  ]}
                  onPress={() => setDuration(mins)}
                  activeOpacity={0.7}
                >
                  <View style={s.durationPresetInner}>
                    {selectedMinutes === mins && <SmoothGradient color1="#FF9F59" color2="#D9531E" height={56} />}
                    <Text
                      style={[
                        s.durationPresetText,
                        selectedMinutes === mins
                          ? s.durationPresetTextActive
                          : s.durationPresetTextInactive,
                      ]}
                    >
                      {mins}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Ambient sound picker */}
        {!isActive && sessionType !== 'guided' && (
          <View style={s.soundSection}>
            <Text style={s.sectionLabel}>
              Ambient Sound
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.horizontalListPadding}
            >
              {SOUND_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    s.soundOption,
                    selectedSound === opt.key
                      ? s.soundOptionActive
                      : s.soundOptionInactive,
                  ]}
                  onPress={() => handleSoundSelect(opt.key)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={SOUND_ICONS[opt.key]}
                    style={s.soundOptionIcon}
                  />
                  <Text
                    style={[
                      s.soundOptionLabel,
                      selectedSound === opt.key
                        ? s.soundOptionLabelActive
                        : s.soundOptionLabelInactive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {selectedSound && (
              <SoundWaveIndicator
                soundLabel={
                  SOUND_OPTIONS.find((o) => o.key === selectedSound)?.label || ''
                }
                isPaused={isPreviewPaused || isPaused}
                onToggle={() => {
                  if (!isActive) {
                    setIsPreviewPaused(!isPreviewPaused);
                  }
                }}
              />
            )}

            {/* Chime Toggle */}
            <TouchableOpacity
              style={s.chimeToggleWrap}
              onPress={() => setIntervalChime(!intervalChimeEnabled)}
              activeOpacity={0.7}
            >
              <Image source={TIMER_ICONS.bell} style={s.chimeToggleIcon} />
              <Text style={s.chimeToggleText}>
                {intervalChimeEnabled ? 'Interval Chimes: ON' : 'Interval Chimes: OFF'}
              </Text>
            </TouchableOpacity>

          </View>
        )}

        {/* Guided Sessions selector */}
        {!isActive && sessionType === 'guided' && (
          <View style={s.guidedSection}>
            <Text style={s.sectionLabel}>
              Choose a Guided Session
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.horizontalListPadding}
            >
              {GUIDED_SESSIONS.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={[
                    s.guidedCard,
                    selectedGuidedId === session.id
                      ? s.guidedCardActive
                      : s.guidedCardInactive,
                  ]}
                  onPress={() => setSelectedGuidedId(session.id)}
                  activeOpacity={0.7}
                >
                  {typeof session.icon === 'string' ? (
                    <Text style={s.guidedCardEmoji}>{session.icon}</Text>
                  ) : (
                    <Image source={session.icon} style={s.guidedCardIconImage} />
                  )}
                  <View>
                    <Text
                      style={[
                        s.guidedCardTitle,
                        selectedGuidedId === session.id
                          ? s.guidedCardTitleActive
                          : s.guidedCardTitleInactive,
                      ]}
                    >
                      {session.title}
                    </Text>
                    <Text style={s.guidedCardDuration}>
                      {formatGuidedDuration(session.durationSeconds)}
                    </Text>
                    <Text style={s.guidedCardDescription}>
                      {session.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

          </View>
        )}

        {/* Breathing Patterns selector */}
        {!isActive && sessionType === 'breathing' && (
          <View style={s.guidedSection}>
            <Text style={s.sectionLabel}>
              Choose a Breathing Pattern
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.horizontalListPadding}
            >
              {BREATHING_PATTERNS.map((pattern) => (
                <TouchableOpacity
                  key={pattern.id}
                  style={[
                    s.guidedCard,
                    selectedBreathingPatternId === pattern.id
                      ? s.guidedCardActive
                      : s.guidedCardInactive,
                  ]}
                  onPress={() => setSelectedBreathingPatternId(pattern.id)}
                  activeOpacity={0.7}
                >
                  {typeof pattern.icon === 'string' ? (
                    <Text style={s.guidedCardEmoji}>{pattern.icon}</Text>
                  ) : (
                    <Image source={pattern.icon} style={s.guidedCardIconImage} />
                  )}
                  <View>
                    <Text
                      style={[
                        s.guidedCardTitle,
                        selectedBreathingPatternId === pattern.id
                          ? s.guidedCardTitleActive
                          : s.guidedCardTitleInactive,
                      ]}
                    >
                      {pattern.title}
                    </Text>
                    <Text style={s.guidedCardDescription}>
                      {pattern.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Session type picker */}
        {!isActive && (
          <View style={s.sessionTypeSection}>
            <Text style={s.sectionLabel}>
              Session Type
            </Text>
            <View style={s.sessionTypeRow}>
              {SESSION_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    s.sessionTypeOption,
                    sessionType === type.key ? s.sessionTypeOptionActive : null,
                  ]}
                  onPress={() => setSessionType(type.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      s.sessionTypeText,
                      sessionType === type.key
                        ? s.sessionTypeTextActive
                        : s.sessionTypeTextInactive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Controls */}
        {isActive && (
          <View style={s.controlsRow}>
            <View style={s.activeControlsRow}>
              {/* Stop button */}
              <TouchableOpacity
                style={s.stopButton}
                onPress={handleStop}
                activeOpacity={0.8}
              >
                <Image source={TIMER_ICONS.stop} style={s.controlIcon} />
              </TouchableOpacity>

              {/* Pause/Resume Timer */}
              <TouchableOpacity
                style={s.playPauseButton}
                onPress={isRunning ? pause : resume}
                activeOpacity={0.8}
              >
                <Image
                  source={isRunning ? TIMER_ICONS.pause : TIMER_ICONS.play}
                  style={s.controlIcon}
                />
              </TouchableOpacity>

              {/* Ambient Sound Toggle or spacer placeholder for guided sessions */}
              {sessionType !== 'guided' ? (
                <TouchableOpacity
                  style={s.ambientToggleButton}
                  onPress={() => setIsPreviewPaused(!isPreviewPaused)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={isPreviewPaused ? TIMER_ICONS.mute : TIMER_ICONS.sound}
                    style={s.ambientToggleIcon}
                  />
                </TouchableOpacity>
              ) : (
                <View style={s.spacerButton} />
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Custom End Session Confirmation Modal */}
      <Modal
        visible={showStopModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStopModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>End Session?</Text>
            <Text style={s.modalSubtitle}>
              Are you sure you want to end this meditation session?
            </Text>
            <View style={s.modalButtonRow}>
              <TouchableOpacity
                style={[s.modalButton, s.modalCancelButton]}
                onPress={() => setShowStopModal(false)}
                activeOpacity={0.7}
              >
                <Text style={s.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalButton, s.modalConfirmButton]}
                onPress={handleConfirmStop}
                activeOpacity={0.7}
              >
                <Text style={s.modalConfirmButtonText}>End Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MeditationTimerScreen;

const s = StyleSheet.create({
  darkContainer: {
    flex: 1,
    backgroundColor: '#FFF5EE',
  },
  scrollContent: { alignItems: 'center', paddingBottom: verticalScale(40) },
  horizontalListPadding: { paddingHorizontal: scale(24) },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(8),
  },
  headerBackButton: {
    width: scale(56),
    height: scale(56),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  headerBackIcon: {
    width: scale(52),
    height: scale(52),
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: '#5C250E',
    flex: 1,
  },
  timerWrap: {
    marginTop: verticalScale(16),
    marginBottom: verticalScale(16),
  },
  sectionLabel: {
    fontSize: moderateScale(14),
    color: '#87553E',
    textAlign: 'center',
    marginBottom: verticalScale(12),
    fontWeight: '600',
  },
  durationSection: {
    marginBottom: verticalScale(24),
    alignSelf: 'stretch',
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: scale(24),
  },
  durationPresetOuter: {
    width: scale(56),
    height: scale(56),
    marginHorizontal: scale(6),
    marginBottom: verticalScale(8),
  },
  durationPresetInner: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(28),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  durationPresetActive: {
    backgroundColor: '#ED7624',
    borderRadius: moderateScale(28),
  },
  durationPresetInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
    borderRadius: moderateScale(28),
  },
  durationPresetText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    zIndex: 2,
    elevation: 2,
  },
  durationPresetTextActive: {
    color: '#FFFFFF',
  },
  durationPresetTextInactive: {
    color: '#87553E',
  },
  soundSection: {
    marginBottom: verticalScale(24),
    width: '100%',
  },
  soundOption: {
    alignItems: 'center',
    justifyContent: 'center',
    width: scale(88),
    marginRight: scale(18),
    paddingVertical: verticalScale(2),
  },
  soundOptionActive: {
    opacity: 1,
  },
  soundOptionInactive: {
    opacity: 0.8,
  },
  soundOptionIcon: {
    width: scale(64),
    height: scale(64),
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(6),
    resizeMode: 'contain',
  },
  soundOptionLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    textAlign: 'center',
  },
  soundOptionLabelActive: {
    color: '#ED7624',
    fontWeight: '700',
  },
  soundOptionLabelInactive: {
    color: '#87553E',
  },
  sessionTypeSection: {
    marginBottom: verticalScale(48),
    paddingHorizontal: scale(24),
    alignSelf: 'stretch',
  },
  sessionTypeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(240, 127, 46, 0.05)',
    borderRadius: moderateScale(999),
    padding: scale(4),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
  },
  sessionTypeOption: {
    flex: 1,
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(999),
    alignItems: 'center',
  },
  sessionTypeOptionActive: {
    backgroundColor: '#ED7624',
  },
  sessionTypeText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  sessionTypeTextActive: {
    color: '#FFFFFF',
  },
  sessionTypeTextInactive: {
    color: '#87553E',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(24),
  },
  activeControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopButton: {
    width: scale(72),
    height: scale(72),
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseButton: {
    width: scale(72),
    height: scale(72),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: scale(32),
  },
  ambientToggleButton: {
    width: scale(72),
    height: scale(72),
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacerButton: {
    width: scale(72),
    height: scale(72),
  },
  controlIcon: {
    width: scale(64),
    height: scale(64),
    borderRadius: moderateScale(32),
    resizeMode: 'contain',
  },
  ambientToggleIcon: {
    width: scale(64),
    height: scale(64),
    borderRadius: moderateScale(32),
    resizeMode: 'contain',
  },
  completionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(24),
  },
  completionIcon: {
    fontSize: moderateScale(48),
    marginBottom: verticalScale(24),
  },
  completionTitle: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    color: '#5C250E',
    marginBottom: verticalScale(12),
  },
  completionSubtitle: {
    fontSize: moderateScale(16),
    color: '#87553E',
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  completionNote: {
    fontSize: moderateScale(14),
    color: '#A86D53',
    textAlign: 'center',
    marginBottom: verticalScale(32),
  },
  doneButton: {
    backgroundColor: '#ED7624',
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(32),
    paddingVertical: verticalScale(14),
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: moderateScale(16),
  },
  chimeToggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(16),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    backgroundColor: 'rgba(240, 127, 46, 0.06)',
    alignSelf: 'center',
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
  },
  chimeToggleIcon: {
    width: scale(26),
    height: scale(26),
    borderRadius: moderateScale(8),
    marginRight: scale(8),
    resizeMode: 'contain',
  },
  chimeToggleText: {
    color: '#87553E',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  guidedSection: {
    marginBottom: verticalScale(24),
    width: '100%',
  },
  guidedCard: {
    width: scale(160),
    padding: scale(16),
    borderRadius: moderateScale(16),
    marginRight: scale(16),
    borderWidth: 1.5,
    justifyContent: 'space-between',
    minHeight: verticalScale(180),
  },
  guidedCardActive: {
    backgroundColor: 'rgba(240, 127, 46, 0.06)',
    borderColor: '#ED7624',
  },
  guidedCardInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(240, 127, 46, 0.12)',
  },
  guidedCardEmoji: {
    fontSize: moderateScale(28),
    marginBottom: verticalScale(8),
  },
  guidedCardIconImage: {
    width: scale(40),
    height: scale(40),
    marginBottom: verticalScale(8),
    resizeMode: 'contain',
  },
  guidedCardTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    marginBottom: verticalScale(4),
  },
  guidedCardTitleActive: {
    color: '#ED7624',
  },
  guidedCardTitleInactive: {
    color: '#5C250E',
  },
  guidedCardDuration: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#ED7624',
    marginBottom: verticalScale(6),
  },
  guidedCardDescription: {
    fontSize: moderateScale(11),
    color: '#A86D53',
    lineHeight: moderateScale(14),
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
    padding: scale(24),
    width: '100%',
    maxWidth: scale(340),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#5C250E',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: moderateScale(14),
    color: '#87553E',
    marginBottom: verticalScale(24),
    lineHeight: moderateScale(20),
    textAlign: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  modalButton: {
    flex: 1,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: 'rgba(240, 127, 46, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.2)',
  },
  modalCancelButtonText: {
    color: '#87553E',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  modalConfirmButton: {
    backgroundColor: '#ED7624',
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
});
