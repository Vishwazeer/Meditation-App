/**
 * File: OnboardingInterests.tsx
 *
 * Description: Second onboarding screen where users select their spiritual
 * interests (meditation, yoga, pranayama, etc.) to personalize their experience.
 *
 * Author: Navnit(Ninjacode911)
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { OnboardingStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingInterests'>;

const INTERESTS = [
  { id: 'meditation', label: 'Meditation', icon: '\u{1F9D8}' },
  { id: 'yoga', label: 'Yoga', icon: '\u{1F3CB}' },
  { id: 'pranayama', label: 'Pranayama', icon: '\u{1F32C}' },
  { id: 'chanting', label: 'Chanting', icon: '\u{1F3B6}' },
  { id: 'sleep', label: 'Sleep', icon: '\u{1F319}' },
  { id: 'stress', label: 'Stress Relief', icon: '\u{1F33F}' },
  { id: 'focus', label: 'Focus', icon: '\u{1F3AF}' },
  { id: 'spirituality', label: 'Spirituality', icon: '\u{2728}' },
];

const OnboardingInterests = () => {
  const navigation = useNavigation<NavigationProp>();
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');

  const toggleInterest = (id: string) => {
    setError('');
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleNext = () => {
    if (selected.length === 0) {
      setError('Please select at least one interest');
      return;
    }
    navigation.navigate('OnboardingGoal', { interests: selected });
  };

  const handleSkip = async () => {
    await completeOnboarding(['meditation', 'mindfulness'], 10);
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.container}>
        <TouchableOpacity onPress={handleSkip} style={s.skipBtn}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>

        <Text style={s.title}>
          What interests you?
        </Text>
        <Text style={s.subtitle}>
          Select topics you'd like to explore. You can always change these later.
        </Text>

        <ScrollView style={s.flex1} showsVerticalScrollIndicator={false}>
          <View style={s.grid}>
            {INTERESTS.map((interest) => {
              const isSelected = selected.includes(interest.id);
              return (
                <TouchableOpacity
                  key={interest.id}
                  onPress={() => toggleInterest(interest.id)}
                  style={[
                    s.chip,
                    isSelected ? s.chipSelected : s.chipUnselected,
                  ]}
                >
                  <Text style={s.chipIcon}>{interest.icon}</Text>
                  <Text
                    style={[
                      s.chipLabel,
                      isSelected ? s.chipLabelSelected : s.chipLabelUnselected,
                    ]}
                  >
                    {interest.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : null}

        <TouchableOpacity
          style={[
            s.nextBtn,
            selected.length > 0 ? s.nextBtnActive : s.nextBtnDisabled,
          ]}
          onPress={handleNext}
        >
          <Text style={s.nextBtnText}>Next</Text>
        </TouchableOpacity>

        <View style={s.dotsRow}>
          <View style={s.dotInactive} />
          <View style={s.dotActive} />
          <View style={s.dotInactive} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF5EE',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  flex1: {
    flex: 1,
  },
  skipBtn: {
    alignSelf: 'flex-end',
  },
  skipText: {
    color: '#87553E',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay',
    fontWeight: 'bold',
    color: '#5C250E',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#87553E',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chip: {
    width: '48%',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  chipSelected: {
    borderColor: '#ED7624',
    backgroundColor: 'rgba(240, 127, 46, 0.1)',
  },
  chipUnselected: {
    borderColor: 'rgba(240, 127, 46, 0.12)',
    backgroundColor: '#FFFFFF',
  },
  chipIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: '#ED7624',
  },
  chipLabelUnselected: {
    color: '#5C250E',
  },
  errorText: {
    color: '#D94329',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 8,
  },
  nextBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  nextBtnActive: {
    backgroundColor: '#ED7624',
  },
  nextBtnDisabled: {
    backgroundColor: 'rgba(240, 127, 46, 0.2)',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  dotActive: {
    width: 32,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ED7624',
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(240, 127, 46, 0.2)',
  },
});

export default OnboardingInterests;
