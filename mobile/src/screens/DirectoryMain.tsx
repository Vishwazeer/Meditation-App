/**
 * File: DirectoryMain.tsx
 *
 * Description: Content directory screen with search, category tabs, and a
 * scrollable list of audio/video content cards with mini-player integration.
 *
 * Author: Navnit(Ninjacode911)
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MiniPlayer } from '../components/directory/MiniPlayer';
import YoutubePlayer from 'react-native-youtube-iframe';
import { scale, verticalScale, moderateScale } from '../utils/responsive';

interface ContentItem {
  id: string;
  title: string;
  instructor: string;
  category: string;
  duration: string;
  views: string;
  isPremium: boolean;
  icon: string;
  type: 'video' | 'audio';
  youtubeId?: string;
  thumbnailUrl?: string;
}

// Damerau-Levenshtein-ish edit distance, capped for performance on short strings
const editDistance = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
};

// Fuzzy score: lower is better. Combines substring match, prefix bonus, and edit distance per token.
const fuzzyScore = (haystack: string, needle: string): number => {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase().trim();
  if (!n) return 0;
  if (h.includes(n)) {
    // Substring match — strongest signal. Earlier match = better.
    return h.indexOf(n) === 0 ? 0 : 1;
  }
  // Token-level fuzzy: best edit distance between needle and any word in haystack
  const words = h.split(/\s+/).filter(Boolean);
  let best = Infinity;
  for (const word of words) {
    if (word.startsWith(n)) {
      best = Math.min(best, 1);
      continue;
    }
    const dist = editDistance(word, n);
    // Tolerance scales with needle length: ~30% allowed typos
    const tolerance = Math.max(1, Math.floor(n.length * 0.4));
    if (dist <= tolerance) {
      best = Math.min(best, 2 + dist);
    }
  }
  return best;
};

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'amritganga_s1', label: 'Amrit Ganga S1' },
  { key: 'amritganga_s2', label: 'Amrit Ganga S2' },
  { key: 'amritganga_s3', label: 'Amrit Ganga S3' },
  { key: 'amritganga_s4', label: 'Amrit Ganga S4' },
  { key: 'bhajan', label: 'Bhajans' },
  { key: 'meditation', label: 'Meditations' },
  { key: 'satsang', label: 'Satsangs' },
  { key: 'talk', label: 'Discourses' },
  { key: 'chanting', label: 'Chanting' },
];

// Convert "MM:SS" or "H:MM:SS" duration strings to seconds for the mini-player seek bar
const parseDurationToSeconds = (duration: string): number => {
  const parts = duration.split(':').map((p) => parseInt(p, 10) || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 180;
};

// Category-driven visual theme so content cards feel distinct without real images
const CATEGORY_THEME: Record<string, { bg: string; accent: string }> = {
  chanting:      { bg: '#5C250E', accent: '#87553E' },
  meditation:    { bg: '#87553E', accent: '#5C250E' },
  satsang:       { bg: '#C56127', accent: '#ED7624' },
  talk:          { bg: '#A64B29', accent: '#D97229' },
  bhajan:        { bg: '#3D1A0D', accent: '#5C250E' },
  amritganga_s1: { bg: '#8F3E1E', accent: '#ED7624' },
  amritganga_s2: { bg: '#A64B29', accent: '#FF9F59' },
  amritganga_s3: { bg: '#70280D', accent: '#ED7624' },
  amritganga_s4: { bg: '#B85021', accent: '#87553E' },
  default:       { bg: '#87553E', accent: '#ED7624' },
};
const getTheme = (cat: string) => CATEGORY_THEME[cat] || CATEGORY_THEME.default;

interface ContentThumbnailProps {
  item: ContentItem;
}

// Hoisted out of DirectoryMain so React doesn't see a "new" component type
// on every parent render (was causing the no-unstable-nested-components warning).
const ContentThumbnail = ({ item }: ContentThumbnailProps) => {
  const theme = getTheme(item.category);
  return (
    <View style={[s.thumb, { backgroundColor: theme.bg }]}>
      {item.thumbnailUrl ? (
        <Image source={{ uri: item.thumbnailUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <>
          <View style={[s.thumbDecorLarge, { backgroundColor: theme.accent }]} />
          <View style={[s.thumbDecorSmall, { backgroundColor: theme.accent }]} />
          <Text style={s.thumbIcon}>{item.icon}</Text>
        </>
      )}
      <View style={s.durationBadge}>
        <Text style={s.durationText}>{item.duration}</Text>
      </View>
      {item.type === 'video' && !item.thumbnailUrl && (
        <View style={s.playOverlay}>
          <Text style={s.playIcon}>{'\u{25B6}'}</Text>
        </View>
      )}
      {item.isPremium && (
        <View style={s.premiumBadge}>
          <Text style={s.premiumText}>PRO</Text>
        </View>
      )}
    </View>
  );
};

export const MOCK_CONTENT: ContentItem[] = [
  { id: 'm1', title: "Integrated Amrita Meditation (IAM) Guided Practice", instructor: "Amrita Live", category: 'meditation', duration: '20:00', views: '950K', isPremium: false, icon: '\u{1F9D8}', type: 'video', youtubeId: '3DIWMA9OVs0', thumbnailUrl: 'https://i.ytimg.com/vi/3DIWMA9OVs0/hqdefault.jpg' },
  { id: 'm3', title: "IAM-20 Quick Meditation | Mindful Breathing", instructor: "Amrita Virtual Academy", category: 'meditation', duration: '15:45', views: '320K', isPremium: false, icon: '\u{1F9D8}', type: 'video', youtubeId: '3DIWMA9OVs0', thumbnailUrl: 'https://i.ytimg.com/vi/3DIWMA9OVs0/hqdefault.jpg' },
  { id: 'b1', title: "Varalunna Hridayattil | Soulful Devotional Bhajan", instructor: "Amma (Mata Amritanandamayi)", category: 'bhajan', duration: '8:30', views: '2.8M', isPremium: false, icon: '\u{1F3B5}', type: 'video', youtubeId: '6QjD_uJ2GIk', thumbnailUrl: 'https://i.ytimg.com/vi/6QjD_uJ2GIk/hqdefault.jpg' },
  { id: 'b2', title: "Muralidhara Gopala | Soulful Krishna Bhajan", instructor: "Amma (Mata Amritanandamayi)", category: 'bhajan', duration: '9:15', views: '1.5M', isPremium: false, icon: '\u{1F3B5}', type: 'video', youtubeId: 'US-ejM6b1wE', thumbnailUrl: 'https://i.ytimg.com/vi/US-ejM6b1wE/hqdefault.jpg' },
  { id: 'b3', title: "Devotional Bhajans & Chants Live from Amritapuri", instructor: "Amma (Mata Amritanandamayi)", category: 'bhajan', duration: '12:45', views: '780K', isPremium: false, icon: '\u{1F3B5}', type: 'video', youtubeId: 'JDxKj5O48Bw', thumbnailUrl: 'https://i.ytimg.com/vi/JDxKj5O48Bw/hqdefault.jpg' },
  { id: 's1', title: "7 Steps for a Joyful Life | Amma's Special Message", instructor: "Amma (Mata Amritanandamayi)", category: 'satsang', duration: '18:24', views: '1.2M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'tH_AbG1JMOE', thumbnailUrl: 'https://i.ytimg.com/vi/tH_AbG1JMOE/hqdefault.jpg' },
  { id: 's2', title: "Beautiful moments of Amma's Europe Tour | Devotee Satsang", instructor: "Amrita Live", category: 'satsang', duration: '14:50', views: '520K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'lCF4K1Zxyck', thumbnailUrl: 'https://i.ytimg.com/vi/lCF4K1Zxyck/hqdefault.jpg' },
  { id: 't1', title: "Conversations with Amma | Wisdom & Spiritual Teachings", instructor: "Amma (Mata Amritanandamayi)", category: 'talk', duration: '22:15', views: '640K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'AbpBM_qKZ5g', thumbnailUrl: 'https://i.ytimg.com/vi/AbpBM_qKZ5g/hqdefault.jpg' },
  { id: 't2', title: "Why You Shouldn't Worry? | Soulful Satsang & Wisdom", instructor: "Amma (Mata Amritanandamayi)", category: 'talk', duration: '16:40', views: '850K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'ABmEmQxCmYM', thumbnailUrl: 'https://i.ytimg.com/vi/ABmEmQxCmYM/hqdefault.jpg' },
  { id: 'c1', title: "Om Lokah Samastah Sukhino Bhavantu | Peace Prayer", instructor: "Amma (Mata Amritanandamayi)", category: 'chanting', duration: '10:30', views: '3.5M', isPremium: false, icon: '\u{1F3B5}', type: 'video', youtubeId: '6QjD_uJ2GIk', thumbnailUrl: 'https://i.ytimg.com/vi/6QjD_uJ2GIk/hqdefault.jpg' },
  { id: 'c2', title: "Namah Shivaya Om | Sacred Chanting & Vibrations", instructor: "Amrita Live", category: 'chanting', duration: '1:08:00', views: '1.8M', isPremium: false, icon: '\u{1F3B5}', type: 'video', youtubeId: 'B_iEiNyr88U', thumbnailUrl: 'https://i.ytimg.com/vi/B_iEiNyr88U/hqdefault.jpg' },
  { id: 'ag_1_1', title: "Amrit Ganga Season 1 Teaser 1", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '0:55', views: '713K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'lKGGuCDUHgI', thumbnailUrl: 'https://i.ytimg.com/vi/lKGGuCDUHgI/hqdefault.jpg' },
  { id: 'ag_1_2', title: "Amrit Ganga Season 1 Teaser 2", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '0:39', views: '411K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'ke90HQkCmNE', thumbnailUrl: 'https://i.ytimg.com/vi/ke90HQkCmNE/hqdefault.jpg' },
  { id: 'ag_1_3', title: "Amrit Ganga Season 1 Teaser 3", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '2:13', views: '4.3M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '3-F58xf6HBM', thumbnailUrl: 'https://i.ytimg.com/vi/3-F58xf6HBM/hqdefault.jpg' },
  { id: 'ag_1_4', title: "Amrit Ganga Season 1 Teaser 4", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '0:46', views: '781K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '5AKQlh5ijI4', thumbnailUrl: 'https://i.ytimg.com/vi/5AKQlh5ijI4/hqdefault.jpg' },
  { id: 'ag_1_5', title: "Amrit Ganga Season 1 Teaser 5", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '0:43', views: '162K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'xgKJ4NkKxJ0', thumbnailUrl: 'https://i.ytimg.com/vi/xgKJ4NkKxJ0/hqdefault.jpg' },
  { id: 'ag_1_6', title: "Amrit Ganga Season 1 Teaser 6", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '0:55', views: '735K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'tPnvFmPO4nE', thumbnailUrl: 'https://i.ytimg.com/vi/tPnvFmPO4nE/hqdefault.jpg' },
  { id: 'ag_1_7', title: "Amrit Ganga Season 1 Teaser 7", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '0:55', views: '296K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'AgjZBRMglP8', thumbnailUrl: 'https://i.ytimg.com/vi/AgjZBRMglP8/hqdefault.jpg' },
  { id: 'ag_1_8', title: "Amrit Ganga Season 1 Teaser 8", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '0:39', views: '1.4M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'qWORNvwE7zo', thumbnailUrl: 'https://i.ytimg.com/vi/qWORNvwE7zo/hqdefault.jpg' },
  { id: 'ag_1_9', title: "Amrit Ganga Season 1 Teaser 9", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '2:13', views: '449K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '3hypBNMyYKw', thumbnailUrl: 'https://i.ytimg.com/vi/3hypBNMyYKw/hqdefault.jpg' },
  { id: 'ag_1_10', title: "Amrit Ganga Season 1 Teaser 10", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '0:46', views: '3.9M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '8_wc5djktiY', thumbnailUrl: 'https://i.ytimg.com/vi/8_wc5djktiY/hqdefault.jpg' },
  { id: 'ag_1_11', title: "Amrit Ganga Season 1 Teaser 11", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '0:39', views: '319K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'GGcWKnqZMIc', thumbnailUrl: 'https://i.ytimg.com/vi/GGcWKnqZMIc/hqdefault.jpg' },
  { id: 'ag_1_12', title: "Amrit Ganga - Season 1 Episode 1", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:18', views: '853K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'laAR8LnWcx4', thumbnailUrl: 'https://i.ytimg.com/vi/laAR8LnWcx4/hqdefault.jpg' },
  { id: 'ag_1_13', title: "Amrit Ganga - Season 1 Episode 2", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:14', views: '641K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'cN-7mR2fdEA', thumbnailUrl: 'https://i.ytimg.com/vi/cN-7mR2fdEA/hqdefault.jpg' },
  { id: 'ag_1_14', title: "Amrit Ganga - Season 1 Episode 3", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '19:57', views: '231K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'wJV_9ObEoO0', thumbnailUrl: 'https://i.ytimg.com/vi/wJV_9ObEoO0/hqdefault.jpg' },
  { id: 'ag_1_15', title: "Amrit Ganga - Season 1 Episode 4", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '19:53', views: '352K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'QvFx118xNvs', thumbnailUrl: 'https://i.ytimg.com/vi/QvFx118xNvs/hqdefault.jpg' },
  { id: 'ag_1_16', title: "Amrit Ganga - Season 1 Episode 5", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:00', views: '275K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'RDjMqyC1ktw', thumbnailUrl: 'https://i.ytimg.com/vi/RDjMqyC1ktw/hqdefault.jpg' },
  { id: 'ag_1_17', title: "Amrit Ganga - Season 1 Episode 6", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:01', views: '697K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'MNLk4bvgbkY', thumbnailUrl: 'https://i.ytimg.com/vi/MNLk4bvgbkY/hqdefault.jpg' },
  { id: 'ag_1_18', title: "Amrit Ganga - Season 1 Episode 7", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:01', views: '413K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'jBudhTq-q7Q', thumbnailUrl: 'https://i.ytimg.com/vi/jBudhTq-q7Q/hqdefault.jpg' },
  { id: 'ag_1_19', title: "Amrit Ganga - Season 1 Episode 8", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:03', views: '691K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '4o9mmPeKVdk', thumbnailUrl: 'https://i.ytimg.com/vi/4o9mmPeKVdk/hqdefault.jpg' },
  { id: 'ag_1_20', title: "Amrit Ganga - Season 1 Episode 9", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:03', views: '899K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'oPMxGgnE2nk', thumbnailUrl: 'https://i.ytimg.com/vi/oPMxGgnE2nk/hqdefault.jpg' },
  { id: 'ag_1_21', title: "Amrit Ganga - Season 1 Episode 10", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:01', views: '221K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'KqRNO0yV6Fw', thumbnailUrl: 'https://i.ytimg.com/vi/KqRNO0yV6Fw/hqdefault.jpg' },
  { id: 'ag_1_22', title: "Amrit Ganga - Season 1 Episode 11", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:50', views: '1.5M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'HFf_Ljdagv8', thumbnailUrl: 'https://i.ytimg.com/vi/HFf_Ljdagv8/hqdefault.jpg' },
  { id: 'ag_1_23', title: "Amrit Ganga - Season 1 Episode 12", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:51', views: '509K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'v2Y8n1rBQWY', thumbnailUrl: 'https://i.ytimg.com/vi/v2Y8n1rBQWY/hqdefault.jpg' },
  { id: 'ag_1_24', title: "Amrit Ganga - Season 1 Episode 13", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:35', views: '312K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '8n5fFV8WehM', thumbnailUrl: 'https://i.ytimg.com/vi/8n5fFV8WehM/hqdefault.jpg' },
  { id: 'ag_1_25', title: "Amrit Ganga - Season 1 Episode 14", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:42', views: '3.5M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'LoDYLettEAM', thumbnailUrl: 'https://i.ytimg.com/vi/LoDYLettEAM/hqdefault.jpg' },
  { id: 'ag_1_26', title: "Amrit Ganga - Season 1 Episode 15", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '21:01', views: '796K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'Uicrgw9OGDY', thumbnailUrl: 'https://i.ytimg.com/vi/Uicrgw9OGDY/hqdefault.jpg' },
  { id: 'ag_1_27', title: "Amrit Ganga - Season 1 Episode 16", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:52', views: '1.2M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '_Ghz6zl78YI', thumbnailUrl: 'https://i.ytimg.com/vi/_Ghz6zl78YI/hqdefault.jpg' },
  { id: 'ag_1_28', title: "Amrit Ganga - Season 1 Episode 17", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:51', views: '394K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'ow4AfBBm4UE', thumbnailUrl: 'https://i.ytimg.com/vi/ow4AfBBm4UE/hqdefault.jpg' },
  { id: 'ag_1_29', title: "Amrit Ganga - Season 1 Episode 18", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:44', views: '814K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'gzXLZnuvqDI', thumbnailUrl: 'https://i.ytimg.com/vi/gzXLZnuvqDI/hqdefault.jpg' },
  { id: 'ag_1_30', title: "Amrit Ganga - Season 1 Episode 19", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:51', views: '655K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'vY8R4c2xsn8', thumbnailUrl: 'https://i.ytimg.com/vi/vY8R4c2xsn8/hqdefault.jpg' },
  { id: 'ag_1_31', title: "Amrit Ganga - Season 1 Episode 20", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:55', views: '3.4M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'CgNl6X-kveA', thumbnailUrl: 'https://i.ytimg.com/vi/CgNl6X-kveA/hqdefault.jpg' },
  { id: 'ag_1_32', title: "Amrit Ganga - Season 1 Episode 21", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '21:02', views: '2.7M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'ltcBaqki338', thumbnailUrl: 'https://i.ytimg.com/vi/ltcBaqki338/hqdefault.jpg' },
  { id: 'ag_1_33', title: "Amrit Ganga - Season 1 Episode 22", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '21:07', views: '4.6M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'J30XdGjUnfY', thumbnailUrl: 'https://i.ytimg.com/vi/J30XdGjUnfY/hqdefault.jpg' },
  { id: 'ag_1_34', title: "Amrit Ganga - Season 1 Episode 23", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '21:10', views: '2.0M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'GqkKMQ2umu8', thumbnailUrl: 'https://i.ytimg.com/vi/GqkKMQ2umu8/hqdefault.jpg' },
  { id: 'ag_1_35', title: "Amrit Ganga - Season 1 Episode 24", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '21:06', views: '168K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'LKWig_Fd0HE', thumbnailUrl: 'https://i.ytimg.com/vi/LKWig_Fd0HE/hqdefault.jpg' },
  { id: 'ag_1_36', title: "Amrit Ganga - Season 1 Episode 25", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:55', views: '549K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'bmOGOPwd9nk', thumbnailUrl: 'https://i.ytimg.com/vi/bmOGOPwd9nk/hqdefault.jpg' },
  { id: 'ag_1_37', title: "Amrit Ganga - Season 1 Episode 26", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '21:05', views: '1.9M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '8UPLDlByeMo', thumbnailUrl: 'https://i.ytimg.com/vi/8UPLDlByeMo/hqdefault.jpg' },
  { id: 'ag_1_38', title: "Amrit Ganga - Season 1 Episode 27", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '21:02', views: '2.1M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'mJ2pQsPDPno', thumbnailUrl: 'https://i.ytimg.com/vi/mJ2pQsPDPno/hqdefault.jpg' },
  { id: 'ag_1_39', title: "Amrit Ganga - Season 1 Episode 28", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '21:01', views: '903K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'U_YwOVQCQJE', thumbnailUrl: 'https://i.ytimg.com/vi/U_YwOVQCQJE/hqdefault.jpg' },
  { id: 'ag_1_40', title: "Amrit Ganga - Season 1 Episode 29", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:59', views: '596K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'hp-4Xpx0uEo', thumbnailUrl: 'https://i.ytimg.com/vi/hp-4Xpx0uEo/hqdefault.jpg' },
  { id: 'ag_1_41', title: "Amrit Ganga - Season 1 Episode 30", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '21:02', views: '686K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '8meAt6qCuo8', thumbnailUrl: 'https://i.ytimg.com/vi/8meAt6qCuo8/hqdefault.jpg' },
  { id: 'ag_1_42', title: "Amrit Ganga - Season 1 Episode 31", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '20:54', views: '884K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'oBVK8uPiuOY', thumbnailUrl: 'https://i.ytimg.com/vi/oBVK8uPiuOY/hqdefault.jpg' },
  { id: 'ag_1_43', title: "Amrit Ganga - Season 1 Episode 32", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s1', duration: '21:05', views: '348K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'b-V0nvUNwgs', thumbnailUrl: 'https://i.ytimg.com/vi/b-V0nvUNwgs/hqdefault.jpg' },
  { id: 'ag_2_1', title: "Amrit Ganga - Season 2 Episode 1", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '21:29', views: '493K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'xaUlDWkJlxA', thumbnailUrl: 'https://i.ytimg.com/vi/xaUlDWkJlxA/hqdefault.jpg' },
  { id: 'ag_2_2', title: "Amrit Ganga - Season 2 Episode 2", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:33', views: '772K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'ayb6pgi5_xU', thumbnailUrl: 'https://i.ytimg.com/vi/ayb6pgi5_xU/hqdefault.jpg' },
  { id: 'ag_2_3', title: "Amrit Ganga - Season 2 Episode 3", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:41', views: '4.9M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'LlcWYML16cs', thumbnailUrl: 'https://i.ytimg.com/vi/LlcWYML16cs/hqdefault.jpg' },
  { id: 'ag_2_4', title: "Amrit Ganga - S 2 Ep 4", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:37', views: '211K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '6adP5DTy-7E', thumbnailUrl: 'https://i.ytimg.com/vi/6adP5DTy-7E/hqdefault.jpg' },
  { id: 'ag_2_5', title: "Amrit Ganga - S 2 Ep 5", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:41', views: '523K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'nY3Y2G6GaGQ', thumbnailUrl: 'https://i.ytimg.com/vi/nY3Y2G6GaGQ/hqdefault.jpg' },
  { id: 'ag_2_6', title: "Amrit Ganga - S 2 Ep 6", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:53', views: '195K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'ZQYOfdxEXrk', thumbnailUrl: 'https://i.ytimg.com/vi/ZQYOfdxEXrk/hqdefault.jpg' },
  { id: 'ag_2_7', title: "Amrit Ganga - S 2 Ep 7", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:42', views: '181K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'NIrHbozaDkY', thumbnailUrl: 'https://i.ytimg.com/vi/NIrHbozaDkY/hqdefault.jpg' },
  { id: 'ag_2_8', title: "Amrit Ganga - S 2 Ep 8", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:21', views: '1.6M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'JsdSRCbpSF8', thumbnailUrl: 'https://i.ytimg.com/vi/JsdSRCbpSF8/hqdefault.jpg' },
  { id: 'ag_2_9', title: "Amrit Ganga - S 2 Ep 9", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:42', views: '1.9M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'Jz-j-DtvICA', thumbnailUrl: 'https://i.ytimg.com/vi/Jz-j-DtvICA/hqdefault.jpg' },
  { id: 'ag_2_10', title: "Amrit Ganga - S 2 Ep 10", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:10', views: '4.4M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'AwijZdgf7kc', thumbnailUrl: 'https://i.ytimg.com/vi/AwijZdgf7kc/hqdefault.jpg' },
  { id: 'ag_2_11', title: "Amrit Ganga - S 2 Ep 11", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:47', views: '940K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'Ru8GutpBwdI', thumbnailUrl: 'https://i.ytimg.com/vi/Ru8GutpBwdI/hqdefault.jpg' },
  { id: 'ag_2_12', title: "Amrit Ganga - S 2 Ep 12", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:42', views: '408K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'Pzw9DvfKZ-M', thumbnailUrl: 'https://i.ytimg.com/vi/Pzw9DvfKZ-M/hqdefault.jpg' },
  { id: 'ag_2_13', title: "Amrit Ganga - S 2 Ep 13", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:42', views: '431K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'JTdUJ1g_DSA', thumbnailUrl: 'https://i.ytimg.com/vi/JTdUJ1g_DSA/hqdefault.jpg' },
  { id: 'ag_2_14', title: "Amrit Ganga - S 2 Ep 14", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:12', views: '679K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'KsG6FxhdN9g', thumbnailUrl: 'https://i.ytimg.com/vi/KsG6FxhdN9g/hqdefault.jpg' },
  { id: 'ag_2_15', title: "Amrit Ganga - S 2 Ep 15", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:35', views: '573K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '7msf_CW1KqI', thumbnailUrl: 'https://i.ytimg.com/vi/7msf_CW1KqI/hqdefault.jpg' },
  { id: 'ag_2_16', title: "Amrit Ganga - S 2 Ep 16", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:43', views: '630K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'waTq_AKXSwY', thumbnailUrl: 'https://i.ytimg.com/vi/waTq_AKXSwY/hqdefault.jpg' },
  { id: 'ag_2_17', title: "Amrit Ganga - S 2 Ep 17", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:53', views: '341K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'Ep0NIxWmqS8', thumbnailUrl: 'https://i.ytimg.com/vi/Ep0NIxWmqS8/hqdefault.jpg' },
  { id: 'ag_2_18', title: "Amrit Ganga - S 2 Ep 18", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:46', views: '473K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'ZWOYL3EnVcg', thumbnailUrl: 'https://i.ytimg.com/vi/ZWOYL3EnVcg/hqdefault.jpg' },
  { id: 'ag_2_19', title: "Amrit Ganga - S 2 Ep 19", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:23', views: '767K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'dp5zh2MopLg', thumbnailUrl: 'https://i.ytimg.com/vi/dp5zh2MopLg/hqdefault.jpg' },
  { id: 'ag_2_20', title: "Amrit Ganga - S 2 Ep 20", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:51', views: '453K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'uU0lkAyqB3U', thumbnailUrl: 'https://i.ytimg.com/vi/uU0lkAyqB3U/hqdefault.jpg' },
  { id: 'ag_2_21', title: "Amrit Ganga - S 2 Ep 21", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:45', views: '2.6M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'J14Y6sPGWV8', thumbnailUrl: 'https://i.ytimg.com/vi/J14Y6sPGWV8/hqdefault.jpg' },
  { id: 'ag_2_22', title: "Amrit Ganga - S 2 Ep 22", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:42', views: '1.8M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'IHya99qdiS8', thumbnailUrl: 'https://i.ytimg.com/vi/IHya99qdiS8/hqdefault.jpg' },
  { id: 'ag_2_23', title: "Amrit Ganga - S 2 Ep 23", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:42', views: '635K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'MmOpCnLGqys', thumbnailUrl: 'https://i.ytimg.com/vi/MmOpCnLGqys/hqdefault.jpg' },
  { id: 'ag_2_24', title: "Amrit Ganga - S 2 Ep 24", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:17', views: '369K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'IMyc62XuhIU', thumbnailUrl: 'https://i.ytimg.com/vi/IMyc62XuhIU/hqdefault.jpg' },
  { id: 'ag_2_25', title: "Amrit Ganga - S 2 Ep 25", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:47', views: '489K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'rB5sHvRsb8Q', thumbnailUrl: 'https://i.ytimg.com/vi/rB5sHvRsb8Q/hqdefault.jpg' },
  { id: 'ag_2_26', title: "Amrit Ganga - S 2 Ep 26", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:47', views: '799K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '3hQXKqtLQaE', thumbnailUrl: 'https://i.ytimg.com/vi/3hQXKqtLQaE/hqdefault.jpg' },
  { id: 'ag_2_27', title: "Amrit Ganga - S 2 Ep 27", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:42', views: '384K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '7G0WA5KbBKY', thumbnailUrl: 'https://i.ytimg.com/vi/7G0WA5KbBKY/hqdefault.jpg' },
  { id: 'ag_2_28', title: "Amrit Ganga - S 2 Ep 28", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:47', views: '4.0M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'sj5zUXEkDSY', thumbnailUrl: 'https://i.ytimg.com/vi/sj5zUXEkDSY/hqdefault.jpg' },
  { id: 'ag_2_29', title: "Amrit Ganga - S 2 Ep 29", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:36', views: '4.1M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'Y553RGk3Tpk', thumbnailUrl: 'https://i.ytimg.com/vi/Y553RGk3Tpk/hqdefault.jpg' },
  { id: 'ag_2_30', title: "Amrit Ganga - S 2 Ep 30", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:20', views: '163K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '63CHQl55jbU', thumbnailUrl: 'https://i.ytimg.com/vi/63CHQl55jbU/hqdefault.jpg' },
  { id: 'ag_2_31', title: "Amrit Ganga - S 2 Ep 31", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:46', views: '1.9M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'MINiMDqg1jQ', thumbnailUrl: 'https://i.ytimg.com/vi/MINiMDqg1jQ/hqdefault.jpg' },
  { id: 'ag_2_32', title: "Amrit Ganga - S 2 Ep 32", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:45', views: '4.1M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '-y0OI0lG-zo', thumbnailUrl: 'https://i.ytimg.com/vi/-y0OI0lG-zo/hqdefault.jpg' },
  { id: 'ag_2_33', title: "Amrit Ganga - S 2 Ep 33", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:40', views: '2.2M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'a0JAkyF3bxA', thumbnailUrl: 'https://i.ytimg.com/vi/a0JAkyF3bxA/hqdefault.jpg' },
  { id: 'ag_2_34', title: "Amrit Ganga - S 2 Ep 34", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:40', views: '488K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'Kq8p1z-Qk-E', thumbnailUrl: 'https://i.ytimg.com/vi/Kq8p1z-Qk-E/hqdefault.jpg' },
  { id: 'ag_2_35', title: "Amrit Ganga - S 2 Ep 35", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:43', views: '598K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'mLIMamps3gg', thumbnailUrl: 'https://i.ytimg.com/vi/mLIMamps3gg/hqdefault.jpg' },
  { id: 'ag_2_36', title: "Amrit Ganga - S 2 Ep 36", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:43', views: '222K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'cynuvabpxwY', thumbnailUrl: 'https://i.ytimg.com/vi/cynuvabpxwY/hqdefault.jpg' },
  { id: 'ag_2_37', title: "Amrit Ganga - S 2 Ep 37", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:41', views: '862K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'EyUeSxMWrAA', thumbnailUrl: 'https://i.ytimg.com/vi/EyUeSxMWrAA/hqdefault.jpg' },
  { id: 'ag_2_38', title: "Amrit Ganga - S 2 Ep 38", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:47', views: '540K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'FzsylTaG5HU', thumbnailUrl: 'https://i.ytimg.com/vi/FzsylTaG5HU/hqdefault.jpg' },
  { id: 'ag_2_39', title: "Amrit Ganga - S 2 Ep 39", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:57', views: '2.3M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'Xn3c8XjtWJc', thumbnailUrl: 'https://i.ytimg.com/vi/Xn3c8XjtWJc/hqdefault.jpg' },
  { id: 'ag_2_40', title: "Amrit Ganga - S 2 Ep 40", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:52', views: '2.5M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'T4xzSwTrcUU', thumbnailUrl: 'https://i.ytimg.com/vi/T4xzSwTrcUU/hqdefault.jpg' },
  { id: 'ag_2_41', title: "Amrit Ganga - S 2 Ep 41", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:36', views: '1.4M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'xBxVFXODrcc', thumbnailUrl: 'https://i.ytimg.com/vi/xBxVFXODrcc/hqdefault.jpg' },
  { id: 'ag_2_42', title: "Amrit Ganga - S 2 Ep 42", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:47', views: '502K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'zy9B_G-x0FM', thumbnailUrl: 'https://i.ytimg.com/vi/zy9B_G-x0FM/hqdefault.jpg' },
  { id: 'ag_2_43', title: "Amrit Ganga - S 2 Ep 43", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:55', views: '347K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'n9PoKd_a9GA', thumbnailUrl: 'https://i.ytimg.com/vi/n9PoKd_a9GA/hqdefault.jpg' },
  { id: 'ag_2_44', title: "Amrit Ganga - S 2 Ep 44", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:52', views: '172K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '-i6QYvz2vIs', thumbnailUrl: 'https://i.ytimg.com/vi/-i6QYvz2vIs/hqdefault.jpg' },
  { id: 'ag_2_45', title: "Amrit Ganga - S 2 Ep 45", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:49', views: '523K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'flZlyRgHcFk', thumbnailUrl: 'https://i.ytimg.com/vi/flZlyRgHcFk/hqdefault.jpg' },
  { id: 'ag_2_46', title: "Amrit Ganga - S 2 Ep 46", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '21:05', views: '415K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'MCS_McY533g', thumbnailUrl: 'https://i.ytimg.com/vi/MCS_McY533g/hqdefault.jpg' },
  { id: 'ag_2_47', title: "Amrit Ganga - S 2 Ep 47", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '21:00', views: '2.0M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'QQ-9YvbtGr4', thumbnailUrl: 'https://i.ytimg.com/vi/QQ-9YvbtGr4/hqdefault.jpg' },
  { id: 'ag_2_48', title: "Amrit Ganga - S 2 Ep 48", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '21:02', views: '3.9M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'UxWlIJp5s7I', thumbnailUrl: 'https://i.ytimg.com/vi/UxWlIJp5s7I/hqdefault.jpg' },
  { id: 'ag_2_49', title: "Amrit Ganga - S 2 Ep 49", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s2', duration: '20:54', views: '514K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'dBPv8LOAfa8', thumbnailUrl: 'https://i.ytimg.com/vi/dBPv8LOAfa8/hqdefault.jpg' },
  { id: 'ag_3_1', title: "Amrit Ganga - Season 3 Episode 1", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:00', views: '582K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'PhI5h6g6gAA', thumbnailUrl: 'https://i.ytimg.com/vi/PhI5h6g6gAA/hqdefault.jpg' },
  { id: 'ag_3_2', title: "Amrit Ganga - Season 3 Episode 2", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:00', views: '165K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'QWK6qjvT744', thumbnailUrl: 'https://i.ytimg.com/vi/QWK6qjvT744/hqdefault.jpg' },
  { id: 'ag_3_3', title: "Amrit Ganga - S 3 Ep 3", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:34', views: '3.5M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'ouNGISAOGyo', thumbnailUrl: 'https://i.ytimg.com/vi/ouNGISAOGyo/hqdefault.jpg' },
  { id: 'ag_3_4', title: "Amrit Ganga - S 3 Ep 4", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:49', views: '651K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'sUuFtLCG18Y', thumbnailUrl: 'https://i.ytimg.com/vi/sUuFtLCG18Y/hqdefault.jpg' },
  { id: 'ag_3_5', title: "Amrit Ganga - S 3 Ep 5", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:54', views: '415K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'SwIDXspwLsI', thumbnailUrl: 'https://i.ytimg.com/vi/SwIDXspwLsI/hqdefault.jpg' },
  { id: 'ag_3_6', title: "Amrit Ganga - S 3 Ep 6", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:52', views: '252K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'yxD-sKgc6hw', thumbnailUrl: 'https://i.ytimg.com/vi/yxD-sKgc6hw/hqdefault.jpg' },
  { id: 'ag_3_7', title: "Amrit Ganga - S 3 Ep 7", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:49', views: '743K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'L1NS4xAfi_w', thumbnailUrl: 'https://i.ytimg.com/vi/L1NS4xAfi_w/hqdefault.jpg' },
  { id: 'ag_3_8', title: "Amrit Ganga - S 3 Ep 8", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:58', views: '3.7M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'axPw-McUxLc', thumbnailUrl: 'https://i.ytimg.com/vi/axPw-McUxLc/hqdefault.jpg' },
  { id: 'ag_3_9', title: "Amrit Ganga - S 3 Ep 9", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:45', views: '2.0M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'V4NcIKPPVFg', thumbnailUrl: 'https://i.ytimg.com/vi/V4NcIKPPVFg/hqdefault.jpg' },
  { id: 'ag_3_10', title: "Amrit Ganga - S 3 Ep 10", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:46', views: '270K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'hIaJ_562DsM', thumbnailUrl: 'https://i.ytimg.com/vi/hIaJ_562DsM/hqdefault.jpg' },
  { id: 'ag_3_11', title: "Amrit Ganga - S 3 Ep 11", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:57', views: '553K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '1Oca6PFWdAc', thumbnailUrl: 'https://i.ytimg.com/vi/1Oca6PFWdAc/hqdefault.jpg' },
  { id: 'ag_3_12', title: "Amrit Ganga - S 3 Ep 12", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '21:00', views: '750K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'cMfP99O6xP0', thumbnailUrl: 'https://i.ytimg.com/vi/cMfP99O6xP0/hqdefault.jpg' },
  { id: 'ag_3_13', title: "Amrit Ganga - S 3 Ep 13", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:52', views: '529K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '89Co-SVr9Oo', thumbnailUrl: 'https://i.ytimg.com/vi/89Co-SVr9Oo/hqdefault.jpg' },
  { id: 'ag_3_14', title: "Amrit Ganga - S 3 Ep 14", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:39', views: '482K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'yLthlW15mzQ', thumbnailUrl: 'https://i.ytimg.com/vi/yLthlW15mzQ/hqdefault.jpg' },
  { id: 'ag_3_15', title: "Amrit Ganga - S 3 Ep 15", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:48', views: '559K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'AQlKH8H7VZc', thumbnailUrl: 'https://i.ytimg.com/vi/AQlKH8H7VZc/hqdefault.jpg' },
  { id: 'ag_3_16', title: "Amrit Ganga - S 3 Ep 16", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:39', views: '1.3M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'onZrE-4agxs', thumbnailUrl: 'https://i.ytimg.com/vi/onZrE-4agxs/hqdefault.jpg' },
  { id: 'ag_3_17', title: "Amrit Ganga - S 3 Ep 17", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '21:34', views: '687K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'hM1qdzoAXQc', thumbnailUrl: 'https://i.ytimg.com/vi/hM1qdzoAXQc/hqdefault.jpg' },
  { id: 'ag_3_18', title: "Amrit Ganga - S 3 Ep 18", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '21:00', views: '837K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'kTi_G2B_uY8', thumbnailUrl: 'https://i.ytimg.com/vi/kTi_G2B_uY8/hqdefault.jpg' },
  { id: 'ag_3_19', title: "Amrit Ganga - S 3 Ep 19", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:09', views: '848K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'zK9XmMOQx30', thumbnailUrl: 'https://i.ytimg.com/vi/zK9XmMOQx30/hqdefault.jpg' },
  { id: 'ag_3_20', title: "Amrit Ganga - S 3 Ep 20", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:16', views: '931K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'Q7hM5t8HBe0', thumbnailUrl: 'https://i.ytimg.com/vi/Q7hM5t8HBe0/hqdefault.jpg' },
  { id: 'ag_3_21', title: "Amrit Ganga - S 3 Ep 21", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '19:51', views: '741K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'pznFM2qLS0g', thumbnailUrl: 'https://i.ytimg.com/vi/pznFM2qLS0g/hqdefault.jpg' },
  { id: 'ag_3_22', title: "Amrit Ganga - S 3 Ep 22", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:40', views: '4.3M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'OluzQ5IrJj8', thumbnailUrl: 'https://i.ytimg.com/vi/OluzQ5IrJj8/hqdefault.jpg' },
  { id: 'ag_3_23', title: "Amrit Ganga - S 3 Ep 23", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:14', views: '469K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '0e1JwCJI28I', thumbnailUrl: 'https://i.ytimg.com/vi/0e1JwCJI28I/hqdefault.jpg' },
  { id: 'ag_3_24', title: "Amrit Ganga - S 3 Ep 24", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:39', views: '4.0M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'BANGbhn3OyI', thumbnailUrl: 'https://i.ytimg.com/vi/BANGbhn3OyI/hqdefault.jpg' },
  { id: 'ag_3_25', title: "Amrit Ganga - S 3 Ep 25", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:30', views: '350K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '3TU7JrHyots', thumbnailUrl: 'https://i.ytimg.com/vi/3TU7JrHyots/hqdefault.jpg' },
  { id: 'ag_3_26', title: "Amrit Ganga - S 3 Ep 26", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:28', views: '3.4M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'z8fQr81tZsU', thumbnailUrl: 'https://i.ytimg.com/vi/z8fQr81tZsU/hqdefault.jpg' },
  { id: 'ag_3_27', title: "Amrit Ganga - S 3 Ep 27", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '21:55', views: '472K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'ws3sjqBFgzI', thumbnailUrl: 'https://i.ytimg.com/vi/ws3sjqBFgzI/hqdefault.jpg' },
  { id: 'ag_3_28', title: "Amrit Ganga - S 3 Ep 28", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:44', views: '4.9M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'uDMNvb56jCU', thumbnailUrl: 'https://i.ytimg.com/vi/uDMNvb56jCU/hqdefault.jpg' },
  { id: 'ag_3_29', title: "Amrit Ganga - S 3 Ep 29", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '25:03', views: '888K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'JZWaiF07uxo', thumbnailUrl: 'https://i.ytimg.com/vi/JZWaiF07uxo/hqdefault.jpg' },
  { id: 'ag_3_30', title: "Amrit Ganga - S 3 Ep 30", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '21:56', views: '2.3M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'cv5drv4abiQ', thumbnailUrl: 'https://i.ytimg.com/vi/cv5drv4abiQ/hqdefault.jpg' },
  { id: 'ag_3_31', title: "Amrit Ganga - S 3 Ep 31", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:44', views: '592K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'eYsRbqrO7Fw', thumbnailUrl: 'https://i.ytimg.com/vi/eYsRbqrO7Fw/hqdefault.jpg' },
  { id: 'ag_3_32', title: "Amrit Ganga - S 3 Ep 32", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:49', views: '620K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '8AHh5GouzA4', thumbnailUrl: 'https://i.ytimg.com/vi/8AHh5GouzA4/hqdefault.jpg' },
  { id: 'ag_3_33', title: "Amrit Ganga - S 3 Ep 33", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:50', views: '1.5M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '44EsNlqHXww', thumbnailUrl: 'https://i.ytimg.com/vi/44EsNlqHXww/hqdefault.jpg' },
  { id: 'ag_3_34', title: "Amrit Ganga - S 3 Ep 34", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:20', views: '894K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'ffiM0aUs8yM', thumbnailUrl: 'https://i.ytimg.com/vi/ffiM0aUs8yM/hqdefault.jpg' },
  { id: 'ag_3_35', title: "Amrit Ganga - S 3 Ep 35", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:27', views: '751K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'hi8sQJfqtSQ', thumbnailUrl: 'https://i.ytimg.com/vi/hi8sQJfqtSQ/hqdefault.jpg' },
  { id: 'ag_3_36', title: "Amrit Ganga - S 3 Ep 36", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '24:05', views: '330K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'pChmPinHUME', thumbnailUrl: 'https://i.ytimg.com/vi/pChmPinHUME/hqdefault.jpg' },
  { id: 'ag_3_37', title: "Amrit Ganga - S 3 Ep 37", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '21:13', views: '943K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'j4kG9WRBKCc', thumbnailUrl: 'https://i.ytimg.com/vi/j4kG9WRBKCc/hqdefault.jpg' },
  { id: 'ag_3_38', title: "Amrit Ganga - S 3 Ep 38", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:46', views: '662K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'QYR8X_Xd7dQ', thumbnailUrl: 'https://i.ytimg.com/vi/QYR8X_Xd7dQ/hqdefault.jpg' },
  { id: 'ag_3_39', title: "Amrit Ganga - S 3 Ep 39", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '24:31', views: '472K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'C8hs0LwPJ4k', thumbnailUrl: 'https://i.ytimg.com/vi/C8hs0LwPJ4k/hqdefault.jpg' },
  { id: 'ag_3_40', title: "Amrit Ganga - S 3 Ep 40", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '21:06', views: '1.7M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'gRCQQkPRIsg', thumbnailUrl: 'https://i.ytimg.com/vi/gRCQQkPRIsg/hqdefault.jpg' },
  { id: 'ag_3_41', title: "Amrit Ganga - S 3 Ep 41", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:47', views: '251K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'MTs5UiOTIbw', thumbnailUrl: 'https://i.ytimg.com/vi/MTs5UiOTIbw/hqdefault.jpg' },
  { id: 'ag_3_42', title: "Amrit Ganga - S 3 Ep 42", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:41', views: '323K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'ChvaE2B8QWU', thumbnailUrl: 'https://i.ytimg.com/vi/ChvaE2B8QWU/hqdefault.jpg' },
  { id: 'ag_3_43', title: "Amrit Ganga - S 3 Ep 43", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:50', views: '496K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'oW3zQedhuGE', thumbnailUrl: 'https://i.ytimg.com/vi/oW3zQedhuGE/hqdefault.jpg' },
  { id: 'ag_3_44', title: "Amrit Ganga - S 3 Ep 44", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:45', views: '271K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'euTWwCXkq2c', thumbnailUrl: 'https://i.ytimg.com/vi/euTWwCXkq2c/hqdefault.jpg' },
  { id: 'ag_3_45', title: "Amrit Ganga - S 3 Ep 45", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:48', views: '644K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'porgZ-t0krc', thumbnailUrl: 'https://i.ytimg.com/vi/porgZ-t0krc/hqdefault.jpg' },
  { id: 'ag_3_46', title: "Amrit Ganga - S 3 Ep 46", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:47', views: '2.2M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'G1JSSf4jWa0', thumbnailUrl: 'https://i.ytimg.com/vi/G1JSSf4jWa0/hqdefault.jpg' },
  { id: 'ag_3_47', title: "Amrit Ganga - S 3 Ep 47", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:51', views: '751K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'JOw8vXxe-Ww', thumbnailUrl: 'https://i.ytimg.com/vi/JOw8vXxe-Ww/hqdefault.jpg' },
  { id: 'ag_3_48', title: "Amrit Ganga - S 3 Ep 48", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:44', views: '436K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'GO0wIBUg9hQ', thumbnailUrl: 'https://i.ytimg.com/vi/GO0wIBUg9hQ/hqdefault.jpg' },
  { id: 'ag_3_49', title: "Amrit Ganga - S 3 Ep 49", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:32', views: '678K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '7fs-MnS-4Lg', thumbnailUrl: 'https://i.ytimg.com/vi/7fs-MnS-4Lg/hqdefault.jpg' },
  { id: 'ag_3_50', title: "Amrit Ganga - S 3 Ep 50", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '25:03', views: '624K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'qj0epBpG_fE', thumbnailUrl: 'https://i.ytimg.com/vi/qj0epBpG_fE/hqdefault.jpg' },
  { id: 'ag_3_51', title: "Amrit Ganga - S 3 Ep 51", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:38', views: '730K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'uM2msBd5OyQ', thumbnailUrl: 'https://i.ytimg.com/vi/uM2msBd5OyQ/hqdefault.jpg' },
  { id: 'ag_3_52', title: "Amrit Ganga - S 3 Ep 52", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:50', views: '787K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'omIw05wTOYs', thumbnailUrl: 'https://i.ytimg.com/vi/omIw05wTOYs/hqdefault.jpg' },
  { id: 'ag_3_53', title: "Amrit Ganga - S 3 Ep 53", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:39', views: '588K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'lSWPpAWqYrw', thumbnailUrl: 'https://i.ytimg.com/vi/lSWPpAWqYrw/hqdefault.jpg' },
  { id: 'ag_3_54', title: "Amrit Ganga - S 3 Ep 54", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:40', views: '885K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'eH0rqkQ0upE', thumbnailUrl: 'https://i.ytimg.com/vi/eH0rqkQ0upE/hqdefault.jpg' },
  { id: 'ag_3_55', title: "Amrit Ganga - S 3 Ep 55", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:50', views: '622K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '5ToGbbSTfSw', thumbnailUrl: 'https://i.ytimg.com/vi/5ToGbbSTfSw/hqdefault.jpg' },
  { id: 'ag_3_56', title: "Amrita Ganga - S 3 Ep 56", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:46', views: '1.0M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'VH-3ozuv4gU', thumbnailUrl: 'https://i.ytimg.com/vi/VH-3ozuv4gU/hqdefault.jpg' },
  { id: 'ag_3_57', title: "Amrit Ganga - S 3 Ep 57", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:53', views: '613K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'XVSMRfbyUwI', thumbnailUrl: 'https://i.ytimg.com/vi/XVSMRfbyUwI/hqdefault.jpg' },
  { id: 'ag_3_58', title: "Amrit Ganga - S 3 Ep 58", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:41', views: '245K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '_8q9ugBOcCA', thumbnailUrl: 'https://i.ytimg.com/vi/_8q9ugBOcCA/hqdefault.jpg' },
  { id: 'ag_3_59', title: "Amrit Ganga - S 3 Ep 59", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:53', views: '421K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'EQaUu_gJG1Q', thumbnailUrl: 'https://i.ytimg.com/vi/EQaUu_gJG1Q/hqdefault.jpg' },
  { id: 'ag_3_60', title: "Amrit Ganga - S 3 Ep 60", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:33', views: '1.9M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '4kyn7Ezwxno', thumbnailUrl: 'https://i.ytimg.com/vi/4kyn7Ezwxno/hqdefault.jpg' },
  { id: 'ag_3_61', title: "Amrit Ganga - S 3 Ep 61", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:56', views: '208K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '3jqhEvJb97I', thumbnailUrl: 'https://i.ytimg.com/vi/3jqhEvJb97I/hqdefault.jpg' },
  { id: 'ag_3_62', title: "Amrit Ganga - S 3 Ep 62", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:44', views: '309K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'opA_xKJfHYc', thumbnailUrl: 'https://i.ytimg.com/vi/opA_xKJfHYc/hqdefault.jpg' },
  { id: 'ag_3_63', title: "Amrit Ganga - S 3 Ep 63", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '23:00', views: '3.5M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '_AvHSLsmwFE', thumbnailUrl: 'https://i.ytimg.com/vi/_AvHSLsmwFE/hqdefault.jpg' },
  { id: 'ag_3_64', title: "Amrit Ganga - S 3 Ep 64", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:55', views: '196K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'm4dc-ny5nDo', thumbnailUrl: 'https://i.ytimg.com/vi/m4dc-ny5nDo/hqdefault.jpg' },
  { id: 'ag_3_65', title: "Amrit Ganga - S 3 Ep 65", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:43', views: '687K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'LyiX0ynf7y0', thumbnailUrl: 'https://i.ytimg.com/vi/LyiX0ynf7y0/hqdefault.jpg' },
  { id: 'ag_3_66', title: "Amrit Ganga - S 3 Ep 66", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:42', views: '310K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'vbvXwrkKplg', thumbnailUrl: 'https://i.ytimg.com/vi/vbvXwrkKplg/hqdefault.jpg' },
  { id: 'ag_3_67', title: "Amrit Ganga - S 3 Ep 67", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:45', views: '1.8M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'nY6sbxPPKvU', thumbnailUrl: 'https://i.ytimg.com/vi/nY6sbxPPKvU/hqdefault.jpg' },
  { id: 'ag_3_68', title: "Amrit Ganga - S 3 Ep 68", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:46', views: '4.1M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'uGJztIxGWBQ', thumbnailUrl: 'https://i.ytimg.com/vi/uGJztIxGWBQ/hqdefault.jpg' },
  { id: 'ag_3_69', title: "Amrit Ganga - S 3 Ep 69", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:41', views: '258K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'B32xnMpc8i8', thumbnailUrl: 'https://i.ytimg.com/vi/B32xnMpc8i8/hqdefault.jpg' },
  { id: 'ag_3_70', title: "Amrit Ganga - S 3 Ep 70", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:42', views: '678K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '3a25UWrIRf4', thumbnailUrl: 'https://i.ytimg.com/vi/3a25UWrIRf4/hqdefault.jpg' },
  { id: 'ag_3_71', title: "Amrit Ganga - S 3 Ep 71", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '23:03', views: '716K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '9ada-2cRl-k', thumbnailUrl: 'https://i.ytimg.com/vi/9ada-2cRl-k/hqdefault.jpg' },
  { id: 'ag_3_72', title: "Amrit Ganga - S 3 Ep 72", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:35', views: '812K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'xv_mMNTU11k', thumbnailUrl: 'https://i.ytimg.com/vi/xv_mMNTU11k/hqdefault.jpg' },
  { id: 'ag_3_73', title: "Amrit Ganga - S 3 Ep 73", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:48', views: '585K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'a-ZTXC26Uns', thumbnailUrl: 'https://i.ytimg.com/vi/a-ZTXC26Uns/hqdefault.jpg' },
  { id: 'ag_3_74', title: "Amrit Ganga - S 3 Ep 74", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:38', views: '771K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'rg8Nmg7E1Yk', thumbnailUrl: 'https://i.ytimg.com/vi/rg8Nmg7E1Yk/hqdefault.jpg' },
  { id: 'ag_3_75', title: "Amrit Ganga - S 3 Ep 75", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:44', views: '552K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'PvUxUaLZEtw', thumbnailUrl: 'https://i.ytimg.com/vi/PvUxUaLZEtw/hqdefault.jpg' },
  { id: 'ag_3_76', title: "Amrit Ganga - S 3 Ep 76", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:42', views: '633K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'aCt6hUblJf4', thumbnailUrl: 'https://i.ytimg.com/vi/aCt6hUblJf4/hqdefault.jpg' },
  { id: 'ag_3_77', title: "Amrit Ganga - S 3 Ep 77", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:50', views: '317K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '0ytltEk8evM', thumbnailUrl: 'https://i.ytimg.com/vi/0ytltEk8evM/hqdefault.jpg' },
  { id: 'ag_3_78', title: "Amrit Ganga - S 3 Ep 78", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:44', views: '197K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'PH8DB-pZKDg', thumbnailUrl: 'https://i.ytimg.com/vi/PH8DB-pZKDg/hqdefault.jpg' },
  { id: 'ag_3_79', title: "Amrit Ganga - S 3 Ep 79", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:40', views: '2.6M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'QBfVvcgmXmU', thumbnailUrl: 'https://i.ytimg.com/vi/QBfVvcgmXmU/hqdefault.jpg' },
  { id: 'ag_3_80', title: "Amrit Ganga - S 3 Ep 80", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:44', views: '411K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'K4Q52l27jnQ', thumbnailUrl: 'https://i.ytimg.com/vi/K4Q52l27jnQ/hqdefault.jpg' },
  { id: 'ag_3_81', title: "Amrit Ganga - S 3 Ep 81", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:15', views: '486K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'rRiM_dsqO64', thumbnailUrl: 'https://i.ytimg.com/vi/rRiM_dsqO64/hqdefault.jpg' },
  { id: 'ag_3_82', title: "Amrit Ganga - S 3 Ep 82", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:39', views: '3.7M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'bqPEH02SXzo', thumbnailUrl: 'https://i.ytimg.com/vi/bqPEH02SXzo/hqdefault.jpg' },
  { id: 'ag_3_83', title: "Amrit Ganga - S 3 Ep 83", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:38', views: '319K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '8uibX92XVzk', thumbnailUrl: 'https://i.ytimg.com/vi/8uibX92XVzk/hqdefault.jpg' },
  { id: 'ag_3_84', title: "Amrit Ganga - S 3 Ep 84", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:45', views: '155K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '5S8DRHnIhN0', thumbnailUrl: 'https://i.ytimg.com/vi/5S8DRHnIhN0/hqdefault.jpg' },
  { id: 'ag_3_85', title: "Amrit Ganga - S 3 Ep 85", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:50', views: '388K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 't8a4sl0Hc5E', thumbnailUrl: 'https://i.ytimg.com/vi/t8a4sl0Hc5E/hqdefault.jpg' },
  { id: 'ag_3_86', title: "Amrit Ganga - S 3 Ep 86", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:52', views: '3.7M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'huOoQlMDAkA', thumbnailUrl: 'https://i.ytimg.com/vi/huOoQlMDAkA/hqdefault.jpg' },
  { id: 'ag_3_87', title: "Amrit Ganga - S 3 Ep 87", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:51', views: '587K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'GOPL6V99TtA', thumbnailUrl: 'https://i.ytimg.com/vi/GOPL6V99TtA/hqdefault.jpg' },
  { id: 'ag_3_88', title: "Amrit Ganga - S 3 Ep 88", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:54', views: '153K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'vR3LL1UEAkw', thumbnailUrl: 'https://i.ytimg.com/vi/vR3LL1UEAkw/hqdefault.jpg' },
  { id: 'ag_3_89', title: "Amrit Ganga - S 3 Ep 89", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '20:47', views: '926K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'SQlxMtOnUm0', thumbnailUrl: 'https://i.ytimg.com/vi/SQlxMtOnUm0/hqdefault.jpg' },
  { id: 'ag_3_90', title: "Amrit Ganga - S 3 Ep 90", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:46', views: '816K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'JD-oeeUs5_0', thumbnailUrl: 'https://i.ytimg.com/vi/JD-oeeUs5_0/hqdefault.jpg' },
  { id: 'ag_3_91', title: "Amrit Ganga - S 3 Ep 91", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:53', views: '3.9M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'xnhKNFumwI0', thumbnailUrl: 'https://i.ytimg.com/vi/xnhKNFumwI0/hqdefault.jpg' },
  { id: 'ag_3_92', title: "Amrit Ganga - S 3 Ep 92", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:46', views: '325K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'J7FVhAMKz9c', thumbnailUrl: 'https://i.ytimg.com/vi/J7FVhAMKz9c/hqdefault.jpg' },
  { id: 'ag_3_93', title: "Amrit Ganga - S 3 Ep 93", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '24:44', views: '264K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'lOzTJJ93jU8', thumbnailUrl: 'https://i.ytimg.com/vi/lOzTJJ93jU8/hqdefault.jpg' },
  { id: 'ag_3_94', title: "Amrit Ganga - S 3 Ep 94", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:50', views: '4.0M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'XoVM_VAXEHc', thumbnailUrl: 'https://i.ytimg.com/vi/XoVM_VAXEHc/hqdefault.jpg' },
  { id: 'ag_3_95', title: "Amrit Ganga - S 3 Ep 95", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:43', views: '363K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'T4F5pCS11tM', thumbnailUrl: 'https://i.ytimg.com/vi/T4F5pCS11tM/hqdefault.jpg' },
  { id: 'ag_3_96', title: "Amrit Ganga - S 3 Ep 96", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '24:22', views: '893K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '6Ov_1kbQitU', thumbnailUrl: 'https://i.ytimg.com/vi/6Ov_1kbQitU/hqdefault.jpg' },
  { id: 'ag_3_97', title: "Amrit Ganga - S 3 Ep 97", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:47', views: '187K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '5JrSDpNDDHg', thumbnailUrl: 'https://i.ytimg.com/vi/5JrSDpNDDHg/hqdefault.jpg' },
  { id: 'ag_3_98', title: "Amrit Ganga - S 3 Ep 98", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:47', views: '275K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'CTyY0RR7-VM', thumbnailUrl: 'https://i.ytimg.com/vi/CTyY0RR7-VM/hqdefault.jpg' },
  { id: 'ag_3_99', title: "Amrit Ganga - S 3 Ep 99", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:47', views: '755K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'zGqYnk-tXK0', thumbnailUrl: 'https://i.ytimg.com/vi/zGqYnk-tXK0/hqdefault.jpg' },
  { id: 'ag_3_100', title: "Amrit Ganga - S 3 Ep 100", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:47', views: '278K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'gyIa5eUwXbY', thumbnailUrl: 'https://i.ytimg.com/vi/gyIa5eUwXbY/hqdefault.jpg' },
  { id: 'ag_3_101', title: "Amrit Ganga - S 3 Ep 101", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:53', views: '3.7M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '0n2qLQaQBOI', thumbnailUrl: 'https://i.ytimg.com/vi/0n2qLQaQBOI/hqdefault.jpg' },
  { id: 'ag_3_102', title: "Amrit Ganga - S 3 Ep 102", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s3', duration: '22:42', views: '414K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '2LUCQ0EgbKU', thumbnailUrl: 'https://i.ytimg.com/vi/2LUCQ0EgbKU/hqdefault.jpg' },
  { id: 'ag_4_1', title: "Amrit Ganga - S 4 Ep 1", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:53', views: '414K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'KME13B9v0oc', thumbnailUrl: 'https://i.ytimg.com/vi/KME13B9v0oc/hqdefault.jpg' },
  { id: 'ag_4_2', title: "Amrit Ganga - S 4 Ep 2", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '26:33', views: '166K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'qV9C9LCwAqw', thumbnailUrl: 'https://i.ytimg.com/vi/qV9C9LCwAqw/hqdefault.jpg' },
  { id: 'ag_4_3', title: "Amrit Ganga - S 4 Ep 3", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '28:01', views: '487K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'n5dA3ag9w68', thumbnailUrl: 'https://i.ytimg.com/vi/n5dA3ag9w68/hqdefault.jpg' },
  { id: 'ag_4_4', title: "Amrit Ganga - S 4 Ep 4", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:45', views: '770K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'Ii_8bFu8BAc', thumbnailUrl: 'https://i.ytimg.com/vi/Ii_8bFu8BAc/hqdefault.jpg' },
  { id: 'ag_4_5', title: "Amrit Ganga - S 4 Ep 5", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:41', views: '3.9M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'BPeYRsz5o9o', thumbnailUrl: 'https://i.ytimg.com/vi/BPeYRsz5o9o/hqdefault.jpg' },
  { id: 'ag_4_6', title: "Amrit Ganga - S 4 Ep 6", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:36', views: '407K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'I2VfFgQ7f2I', thumbnailUrl: 'https://i.ytimg.com/vi/I2VfFgQ7f2I/hqdefault.jpg' },
  { id: 'ag_4_7', title: "Amrit Ganga - S 4 Ep 7", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:44', views: '4.6M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'L0wv_NzIr9k', thumbnailUrl: 'https://i.ytimg.com/vi/L0wv_NzIr9k/hqdefault.jpg' },
  { id: 'ag_4_8', title: "Amrit Ganga - S 4 Ep 8", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:44', views: '395K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '8zME4_ZpeKA', thumbnailUrl: 'https://i.ytimg.com/vi/8zME4_ZpeKA/hqdefault.jpg' },
  { id: 'ag_4_9', title: "Amrit Ganga - S 4 Ep 9", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:39', views: '264K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'mXfeKIhnhgc', thumbnailUrl: 'https://i.ytimg.com/vi/mXfeKIhnhgc/hqdefault.jpg' },
  { id: 'ag_4_10', title: "Amrit Ganga - S 4 Ep 10", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:45', views: '681K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '7szYl4Ai93I', thumbnailUrl: 'https://i.ytimg.com/vi/7szYl4Ai93I/hqdefault.jpg' },
  { id: 'ag_4_11', title: "Amrit Ganga - S 4 Ep 11", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '0:46', views: '572K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'XwsHJ-pNXoc', thumbnailUrl: 'https://i.ytimg.com/vi/XwsHJ-pNXoc/hqdefault.jpg' },
  { id: 'ag_4_12', title: "Amrit Ganga - S 4 Ep 11", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:41', views: '570K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'k3mSKN1OZzg', thumbnailUrl: 'https://i.ytimg.com/vi/k3mSKN1OZzg/hqdefault.jpg' },
  { id: 'ag_4_13', title: "Amrit Ganga - S 4 Ep 12", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '0:43', views: '2.6M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'YKtYVfx_Tt4', thumbnailUrl: 'https://i.ytimg.com/vi/YKtYVfx_Tt4/hqdefault.jpg' },
  { id: 'ag_4_14', title: "Amrit Ganga - S 4 Ep 12", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:42', views: '315K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'cWxPVxrjE6g', thumbnailUrl: 'https://i.ytimg.com/vi/cWxPVxrjE6g/hqdefault.jpg' },
  { id: 'ag_4_15', title: "Amrit Ganga - S 4 Ep 13", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '21:11', views: '1.4M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'fic9nzsqdxA', thumbnailUrl: 'https://i.ytimg.com/vi/fic9nzsqdxA/hqdefault.jpg' },
  { id: 'ag_4_16', title: "Amrit Ganga - S 4 Ep 14", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:20', views: '2.1M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'AP-_-Y0WGcQ', thumbnailUrl: 'https://i.ytimg.com/vi/AP-_-Y0WGcQ/hqdefault.jpg' },
  { id: 'ag_4_17', title: "Amrit Ganga - S 4 Ep 15", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '21:19', views: '248K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'ySzmXfAM5zA', thumbnailUrl: 'https://i.ytimg.com/vi/ySzmXfAM5zA/hqdefault.jpg' },
  { id: 'ag_4_18', title: "Amrit Ganga - S 4 Ep 16", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:48', views: '299K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '9S6GKOmDYec', thumbnailUrl: 'https://i.ytimg.com/vi/9S6GKOmDYec/hqdefault.jpg' },
  { id: 'ag_4_19', title: "Amrit Ganga - S 4 Ep 17", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '0:40', views: '917K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'iT14eTi3krg', thumbnailUrl: 'https://i.ytimg.com/vi/iT14eTi3krg/hqdefault.jpg' },
  { id: 'ag_4_20', title: "Amrit Ganga - S 4 Ep 17", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:49', views: '161K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'tqt-yOq1kv8', thumbnailUrl: 'https://i.ytimg.com/vi/tqt-yOq1kv8/hqdefault.jpg' },
  { id: 'ag_4_21', title: "Amrit Ganga - S 4 Ep 18", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:42', views: '290K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'ICA-vNIqmyQ', thumbnailUrl: 'https://i.ytimg.com/vi/ICA-vNIqmyQ/hqdefault.jpg' },
  { id: 'ag_4_22', title: "Amrit Ganga - S 4 Ep 19", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '21:50', views: '427K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'CbzuzpA02sU', thumbnailUrl: 'https://i.ytimg.com/vi/CbzuzpA02sU/hqdefault.jpg' },
  { id: 'ag_4_23', title: "Amrit Ganga - S 4 Ep 20", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:41', views: '483K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'fjvWQQ6KDTU', thumbnailUrl: 'https://i.ytimg.com/vi/fjvWQQ6KDTU/hqdefault.jpg' },
  { id: 'ag_4_24', title: "Amrit Ganga - S 4 Ep 21", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:45', views: '3.5M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'rO6CP5JX33M', thumbnailUrl: 'https://i.ytimg.com/vi/rO6CP5JX33M/hqdefault.jpg' },
  { id: 'ag_4_25', title: "Amrit Ganga - S 4 Ep 22", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:55', views: '4.1M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '3SQtUb4m32w', thumbnailUrl: 'https://i.ytimg.com/vi/3SQtUb4m32w/hqdefault.jpg' },
  { id: 'ag_4_26', title: "Amrit Ganga - S 4 Ep 23", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:17', views: '871K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'bC2Yd4kwXkk', thumbnailUrl: 'https://i.ytimg.com/vi/bC2Yd4kwXkk/hqdefault.jpg' },
  { id: 'ag_4_27', title: "Amrit Ganga - S 4 Ep 24", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:44', views: '693K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'pR--DciIt0g', thumbnailUrl: 'https://i.ytimg.com/vi/pR--DciIt0g/hqdefault.jpg' },
  { id: 'ag_4_28', title: "Amrit Ganga - S 4 Ep 25", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:59', views: '924K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'JXDoY-KnBaQ', thumbnailUrl: 'https://i.ytimg.com/vi/JXDoY-KnBaQ/hqdefault.jpg' },
  { id: 'ag_4_29', title: "Amrit Ganga - S 4 Ep 26", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:42', views: '327K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'JoDzrOErwPs', thumbnailUrl: 'https://i.ytimg.com/vi/JoDzrOErwPs/hqdefault.jpg' },
  { id: 'ag_4_30', title: "Amrit Ganga - S 4 Ep 27", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:11', views: '739K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '38MNrxzA70g', thumbnailUrl: 'https://i.ytimg.com/vi/38MNrxzA70g/hqdefault.jpg' },
  { id: 'ag_4_31', title: "Amrit Ganga - S 4 Ep 28", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '24:15', views: '856K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '_NaEHvnNuY8', thumbnailUrl: 'https://i.ytimg.com/vi/_NaEHvnNuY8/hqdefault.jpg' },
  { id: 'ag_4_32', title: "Amrit Ganga - S 4 Ep 29", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:45', views: '2.4M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'yFNikjPDYxo', thumbnailUrl: 'https://i.ytimg.com/vi/yFNikjPDYxo/hqdefault.jpg' },
  { id: 'ag_4_33', title: "Amrit Ganga - S 4 Ep 30", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:47', views: '562K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '_-K_4Zo_FKA', thumbnailUrl: 'https://i.ytimg.com/vi/_-K_4Zo_FKA/hqdefault.jpg' },
  { id: 'ag_4_34', title: "Amrit Ganga - S 4 Ep 31", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '24:28', views: '647K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'u2vHZfXCJhc', thumbnailUrl: 'https://i.ytimg.com/vi/u2vHZfXCJhc/hqdefault.jpg' },
  { id: 'ag_4_35', title: "Amrit Ganga - S 4 Ep 32", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '23:51', views: '418K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'UzjEtEd0YyM', thumbnailUrl: 'https://i.ytimg.com/vi/UzjEtEd0YyM/hqdefault.jpg' },
  { id: 'ag_4_36', title: "Amrit Ganga - S 4 Ep 33", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:41', views: '303K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '-1MpFHgfR0E', thumbnailUrl: 'https://i.ytimg.com/vi/-1MpFHgfR0E/hqdefault.jpg' },
  { id: 'ag_4_37', title: "Amrit Ganga - S 4 Ep 34", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '24:08', views: '524K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'aCqW_Tusy-I', thumbnailUrl: 'https://i.ytimg.com/vi/aCqW_Tusy-I/hqdefault.jpg' },
  { id: 'ag_4_38', title: "Amrit Ganga - S 4 Ep 35", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '21:41', views: '2.3M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '-xqsLPXHLJw', thumbnailUrl: 'https://i.ytimg.com/vi/-xqsLPXHLJw/hqdefault.jpg' },
  { id: 'ag_4_39', title: "Amrit Ganga - S 4 Ep 36", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:59', views: '561K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'ZH-0rPbSZtU', thumbnailUrl: 'https://i.ytimg.com/vi/ZH-0rPbSZtU/hqdefault.jpg' },
  { id: 'ag_4_40', title: "Amrit Ganga - S 4 Ep 37", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:29', views: '204K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'bjoq7gHRlq4', thumbnailUrl: 'https://i.ytimg.com/vi/bjoq7gHRlq4/hqdefault.jpg' },
  { id: 'ag_4_41', title: "Amrit Ganga - S 4 Ep 38", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:42', views: '943K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'HcAto8HbWLc', thumbnailUrl: 'https://i.ytimg.com/vi/HcAto8HbWLc/hqdefault.jpg' },
  { id: 'ag_4_42', title: "Amrit Ganga - S 4 Ep 39", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:57', views: '714K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '2secRqgTBLM', thumbnailUrl: 'https://i.ytimg.com/vi/2secRqgTBLM/hqdefault.jpg' },
  { id: 'ag_4_43', title: "Amrit Ganga - S 4 Ep 40", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:56', views: '496K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'OU6_y_qHdgI', thumbnailUrl: 'https://i.ytimg.com/vi/OU6_y_qHdgI/hqdefault.jpg' },
  { id: 'ag_4_44', title: "Amrit Ganga - S 4 Ep 41", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:56', views: '828K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '-pZgHvudj_A', thumbnailUrl: 'https://i.ytimg.com/vi/-pZgHvudj_A/hqdefault.jpg' },
  { id: 'ag_4_45', title: "Amrit Ganga - S 4 Ep 42", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:52', views: '817K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'Fhh3Sr3WIwY', thumbnailUrl: 'https://i.ytimg.com/vi/Fhh3Sr3WIwY/hqdefault.jpg' },
  { id: 'ag_4_46', title: "Amrit Ganga - S 4 Ep 43", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '23:10', views: '785K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'mrUEQLixe9w', thumbnailUrl: 'https://i.ytimg.com/vi/mrUEQLixe9w/hqdefault.jpg' },
  { id: 'ag_4_47', title: "Amrit Ganga - S 4 Ep 44", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:58', views: '922K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '-lp-96z7q0s', thumbnailUrl: 'https://i.ytimg.com/vi/-lp-96z7q0s/hqdefault.jpg' },
  { id: 'ag_4_48', title: "Amrit Ganga - S 4 Ep 45", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:56', views: '410K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'GTVfkFi331I', thumbnailUrl: 'https://i.ytimg.com/vi/GTVfkFi331I/hqdefault.jpg' },
  { id: 'ag_4_49', title: "Amrit Ganga - S 4 Ep 46", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '24:32', views: '738K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '1shwTjr-QIU', thumbnailUrl: 'https://i.ytimg.com/vi/1shwTjr-QIU/hqdefault.jpg' },
  { id: 'ag_4_50', title: "Amrit Ganga - S 4 Ep 47", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:20', views: '1.5M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'gwiqU1zUt_k', thumbnailUrl: 'https://i.ytimg.com/vi/gwiqU1zUt_k/hqdefault.jpg' },
  { id: 'ag_4_51', title: "Amrit Ganga - S 4 Ep 48", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '24:01', views: '793K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'BRBlcXwUvA8', thumbnailUrl: 'https://i.ytimg.com/vi/BRBlcXwUvA8/hqdefault.jpg' },
  { id: 'ag_4_52', title: "Amrit Ganga - S 4 Ep 49", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:08', views: '398K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'UYqYmeSPYiU', thumbnailUrl: 'https://i.ytimg.com/vi/UYqYmeSPYiU/hqdefault.jpg' },
  { id: 'ag_4_53', title: "Amrit Ganga - S 4 Ep 50", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:47', views: '279K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'Bn7WPU_UXt4', thumbnailUrl: 'https://i.ytimg.com/vi/Bn7WPU_UXt4/hqdefault.jpg' },
  { id: 'ag_4_54', title: "Amrit Ganga - S 4 Ep 51", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '25:25', views: '2.4M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'J1OvM-FP6Sc', thumbnailUrl: 'https://i.ytimg.com/vi/J1OvM-FP6Sc/hqdefault.jpg' },
  { id: 'ag_4_55', title: "Amrit Ganga - S 4 Ep 52", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '23:21', views: '914K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'a_GCxT72Q08', thumbnailUrl: 'https://i.ytimg.com/vi/a_GCxT72Q08/hqdefault.jpg' },
  { id: 'ag_4_56', title: "Amrit Ganga - S 4 Ep 53", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '23:36', views: '4.5M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'Z202gW3g1Aw', thumbnailUrl: 'https://i.ytimg.com/vi/Z202gW3g1Aw/hqdefault.jpg' },
  { id: 'ag_4_57', title: "Amrit Ganga - S 4 Ep 54", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '23:03', views: '264K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'aCEAjA7S71I', thumbnailUrl: 'https://i.ytimg.com/vi/aCEAjA7S71I/hqdefault.jpg' },
  { id: 'ag_4_58', title: "Amrit Ganga - S 4 Ep 55", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:45', views: '490K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '6_Q2-GsS7Bs', thumbnailUrl: 'https://i.ytimg.com/vi/6_Q2-GsS7Bs/hqdefault.jpg' },
  { id: 'ag_4_59', title: "Amrit Ganga - S 4 Ep 57", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '24:44', views: '178K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'SenNRN158mo', thumbnailUrl: 'https://i.ytimg.com/vi/SenNRN158mo/hqdefault.jpg' },
  { id: 'ag_4_60', title: "Amrit Ganga - S 4 Ep 58", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '23:01', views: '498K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'OF9oIrOe9Ws', thumbnailUrl: 'https://i.ytimg.com/vi/OF9oIrOe9Ws/hqdefault.jpg' },
  { id: 'ag_4_61', title: "Amrit Ganga - S 4 Ep 59", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '21:05', views: '845K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'r1tTwADf5DY', thumbnailUrl: 'https://i.ytimg.com/vi/r1tTwADf5DY/hqdefault.jpg' },
  { id: 'ag_4_62', title: "Amrit Ganga - S 4 Ep 60", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '25:26', views: '1.8M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '3Iq5dDBfWXo', thumbnailUrl: 'https://i.ytimg.com/vi/3Iq5dDBfWXo/hqdefault.jpg' },
  { id: 'ag_4_63', title: "Amrit Ganga - S 4 Ep 61", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:52', views: '444K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'wGSTIqtqGCI', thumbnailUrl: 'https://i.ytimg.com/vi/wGSTIqtqGCI/hqdefault.jpg' },
  { id: 'ag_4_64', title: "Amrit Ganga - S 4 Ep 62", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '23:13', views: '270K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'UpkxOfu10X8', thumbnailUrl: 'https://i.ytimg.com/vi/UpkxOfu10X8/hqdefault.jpg' },
  { id: 'ag_4_65', title: "Amrit Ganga - S 4 Ep 63", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:51', views: '481K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'J9e9ol43rDc', thumbnailUrl: 'https://i.ytimg.com/vi/J9e9ol43rDc/hqdefault.jpg' },
  { id: 'ag_4_66', title: "Amrit Ganga - S 4 Ep 64", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '23:55', views: '4.3M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'O_PrxI56IjE', thumbnailUrl: 'https://i.ytimg.com/vi/O_PrxI56IjE/hqdefault.jpg' },
  { id: 'ag_4_67', title: "Amrit Ganga - S 4 Ep 65", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '23:16', views: '771K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'Yq74L9htoak', thumbnailUrl: 'https://i.ytimg.com/vi/Yq74L9htoak/hqdefault.jpg' },
  { id: 'ag_4_68', title: "Amrit Ganga - S 4 Ep 66", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:43', views: '1.6M', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'K3qSBYQmaGs', thumbnailUrl: 'https://i.ytimg.com/vi/K3qSBYQmaGs/hqdefault.jpg' },
  { id: 'ag_4_69', title: "Amrit Ganga - S 4 Ep 67", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '25:02', views: '565K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'aTZ1yvOsd1w', thumbnailUrl: 'https://i.ytimg.com/vi/aTZ1yvOsd1w/hqdefault.jpg' },
  { id: 'ag_4_70', title: "Amrit Ganga - S 4 Ep 68", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:58', views: '832K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '32lFfWJeVgk', thumbnailUrl: 'https://i.ytimg.com/vi/32lFfWJeVgk/hqdefault.jpg' },
  { id: 'ag_4_71', title: "Amrit Ganga - S 4 Ep 69", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:56', views: '904K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '-UIc03TQcvI', thumbnailUrl: 'https://i.ytimg.com/vi/-UIc03TQcvI/hqdefault.jpg' },
  { id: 'ag_4_72', title: "Amrit Ganga - S 4 Ep 70", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:59', views: '574K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'lPdt2GIOZzo', thumbnailUrl: 'https://i.ytimg.com/vi/lPdt2GIOZzo/hqdefault.jpg' },
  { id: 'ag_4_73', title: "Amrit Ganga - S 4 Ep 71", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:53', views: '878K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'MS9qJMXBvfw', thumbnailUrl: 'https://i.ytimg.com/vi/MS9qJMXBvfw/hqdefault.jpg' },
  { id: 'ag_4_74', title: "Amrit Ganga - S 4 Ep 72", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '24:08', views: '407K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'QnCZqmxwkZU', thumbnailUrl: 'https://i.ytimg.com/vi/QnCZqmxwkZU/hqdefault.jpg' },
  { id: 'ag_4_75', title: "Amrit Ganga - S 4 Ep 73", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:58', views: '722K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'BeAjFC_Pvpo', thumbnailUrl: 'https://i.ytimg.com/vi/BeAjFC_Pvpo/hqdefault.jpg' },
  { id: 'ag_4_76', title: "Amrit Ganga - S 4 Ep 74", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:47', views: '807K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'jLGUUHYjzyA', thumbnailUrl: 'https://i.ytimg.com/vi/jLGUUHYjzyA/hqdefault.jpg' },
  { id: 'ag_4_77', title: "Amrit Ganga - S 4 Ep 75", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:49', views: '455K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '82IHQQUnf04', thumbnailUrl: 'https://i.ytimg.com/vi/82IHQQUnf04/hqdefault.jpg' },
  { id: 'ag_4_78', title: "Amrit Ganga - S 4 Ep 76", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '26:47', views: '354K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'FzNN8aVE-nI', thumbnailUrl: 'https://i.ytimg.com/vi/FzNN8aVE-nI/hqdefault.jpg' },
  { id: 'ag_4_79', title: "Amrit Ganga - S 4 Ep 77", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '23:00', views: '163K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '7z0wPIA48rA', thumbnailUrl: 'https://i.ytimg.com/vi/7z0wPIA48rA/hqdefault.jpg' },
  { id: 'ag_4_80', title: "Amrit Ganga - S 4 Ep 78", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:54', views: '750K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'J3wCL4bUoP0', thumbnailUrl: 'https://i.ytimg.com/vi/J3wCL4bUoP0/hqdefault.jpg' },
  { id: 'ag_4_81', title: "Amrit Ganga - S 4 Ep 79", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '21:43', views: '914K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: 'CfZWzzqLZjU', thumbnailUrl: 'https://i.ytimg.com/vi/CfZWzzqLZjU/hqdefault.jpg' },
  { id: 'ag_4_82', title: "Amrit Ganga - S 4 Ep 80", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '23:28', views: '533K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '9NCDksVDKkk', thumbnailUrl: 'https://i.ytimg.com/vi/9NCDksVDKkk/hqdefault.jpg' },
  { id: 'ag_4_83', title: "Amrit Ganga - S 4 Ep 81", instructor: "Amma (Mata Amritanandamayi)", category: 'amritganga_s4', duration: '22:38', views: '483K', isPremium: false, icon: '\u{1F3AC}', type: 'video', youtubeId: '-CAh9xtNrjg', thumbnailUrl: 'https://i.ytimg.com/vi/-CAh9xtNrjg/hqdefault.jpg' },
];



const DirectoryMain = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [currentPlaying, setCurrentPlaying] = useState<ContentItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { filteredContent, suggestion } = useMemo(() => {
    const inCategory = MOCK_CONTENT.filter(
      (item) => selectedCategory === 'all' || item.category === selectedCategory,
    );

    const q = searchQuery.trim();
    if (!q) {
      return { filteredContent: inCategory, suggestion: null as string | null };
    }

    // Score every item — combines title and instructor fuzzy matches
    const scored = inCategory
      .map((item) => {
        const titleScore = fuzzyScore(item.title, q);
        const instructorScore = fuzzyScore(item.instructor, q);
        return { item, score: Math.min(titleScore, instructorScore) };
      })
      .filter((entry) => entry.score < Infinity)
      .sort((a, b) => a.score - b.score);

    const matches = scored.map((entry) => entry.item);

    // If no exact substring match but we have fuzzy matches, surface a "did you mean"
    const exactMatchExists = inCategory.some(
      (item) =>
        item.title.toLowerCase().includes(q.toLowerCase()) ||
        item.instructor.toLowerCase().includes(q.toLowerCase()),
    );
    let suggest: string | null = null;
    if (!exactMatchExists && matches.length > 0) {
      // Suggest the closest title's first matching word
      const top = matches[0];
      const lowerQ = q.toLowerCase();
      const candidates = `${top.title} ${top.instructor}`
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length >= Math.max(3, lowerQ.length - 2));
      let bestWord = '';
      let bestDist = Infinity;
      for (const w of candidates) {
        const d = editDistance(w, lowerQ);
        if (d < bestDist) {
          bestDist = d;
          bestWord = w;
        }
      }
      if (bestWord && bestDist <= Math.max(1, Math.floor(lowerQ.length * 0.5))) {
        suggest = bestWord;
      }
    }

    return { filteredContent: matches, suggestion: suggest };
  }, [searchQuery, selectedCategory]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Directory</Text>
        <Text style={s.headerSubtitle}>Browse bhajans, meditations & satsangs</Text>
      </View>

      {/* Search Bar */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Image source={require('../assets/icons/New folder/Search.png')} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Search teachings, bhajans..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={s.clearIcon}>{'\u{2715}'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Did-you-mean suggestion (fuzzy match fallback) */}
      {suggestion && searchQuery.trim() && (
        <TouchableOpacity
          style={s.suggestionBar}
          onPress={() => setSearchQuery(suggestion)}
          activeOpacity={0.7}
        >
          <Text style={s.suggestionLabel}>Did you mean</Text>
          <Text style={s.suggestionWord}>{` "${suggestion}"`}</Text>
          <Text style={s.suggestionTap}> ?</Text>
        </TouchableOpacity>
      )}

      {/* Category Tabs */}
      <View style={s.tabRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.key}
          contentContainerStyle={s.tabListPadding}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item.key)}
              style={[s.tab, selectedCategory === item.key ? s.tabActive : s.tabInactive]}
            >
              <Text style={[s.tabText, selectedCategory === item.key ? s.tabTextActive : s.tabTextInactive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Content List */}
      <FlatList
        data={filteredContent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          s.contentListPadding,
          currentPlaying ? s.contentListPaddingPlaying : s.contentListPaddingIdle,
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ED7624" />}
        renderItem={({ item }) => (
          <View>
            <TouchableOpacity
              style={s.card}
              onPress={() => {
                if (item.youtubeId) {
                  setExpandedId(expandedId === item.id ? null : item.id);
                } else {
                  setCurrentPlaying(item);
                  setIsPlaying(true);
                }
              }}
              activeOpacity={0.7}
            >
              {/* Thumbnail \u2014 category-themed artwork */}
              <ContentThumbnail item={item} />
  
              {/* Info */}
              <View style={s.info}>
                <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={s.cardInstructor} numberOfLines={1}>{item.instructor}</Text>
                <View style={s.cardMeta}>
                  <Text style={s.viewCount}>{'\u{25B6}'} {item.views}</Text>
                  <TouchableOpacity onPress={() => toggleBookmark(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={[s.bookmark, bookmarkedIds.has(item.id) && s.bookmarkActive]}>
                      {bookmarkedIds.has(item.id) ? '\u{2605}' : '\u{2606}'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>

            {/* Embedded YouTube Player */}
            {expandedId === item.id && item.youtubeId && (
              <View style={s.webviewContainer}>
                <YoutubePlayer
                  height={200}
                  play={true}
                  videoId={item.youtubeId}
                />
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyIcon}>{'\u{1F50D}'}</Text>
            <Text style={s.emptyTitle}>No results found</Text>
            <Text style={s.emptyText}>Try a different search or category</Text>
          </View>
        }
      />

      {/* Mini Player */}
      {currentPlaying && (
        <MiniPlayer
          title={currentPlaying.title}
          artist={currentPlaying.instructor}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onClose={() => { setCurrentPlaying(null); setIsPlaying(false); }}
          durationSeconds={parseDurationToSeconds(currentPlaying.duration)}
        />
      )}
    </SafeAreaView>
  );
};

export default DirectoryMain;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5EE' },
  header: { paddingHorizontal: scale(20), paddingTop: verticalScale(16), paddingBottom: verticalScale(4) },
  headerTitle: { fontSize: moderateScale(26), fontWeight: 'bold', color: '#5C250E' },
  headerSubtitle: { fontSize: moderateScale(14), color: '#87553E', marginTop: verticalScale(4) },
  searchWrap: { paddingHorizontal: scale(16), paddingTop: verticalScale(12), paddingBottom: verticalScale(4) },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: moderateScale(12), borderWidth: 1, borderColor: 'rgba(240, 127, 46, 0.12)', paddingHorizontal: scale(14) },
  searchIcon: { width: scale(18), height: scale(18), resizeMode: 'contain', marginRight: scale(8) },
  searchInput: { flex: 1, paddingVertical: verticalScale(12), fontSize: moderateScale(15), color: '#5C250E' },
  clearIcon: { color: '#87553E', fontSize: moderateScale(16) },
  tabRow: { paddingVertical: verticalScale(12) },
  tab: { marginRight: scale(10), paddingHorizontal: scale(20), paddingVertical: verticalScale(12), borderRadius: moderateScale(25), height: verticalScale(44), justifyContent: 'center' as const, alignItems: 'center' as const },
  tabActive: { backgroundColor: '#ED7624' },
  tabInactive: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: 'rgba(240, 127, 46, 0.2)' },
  tabText: { fontSize: moderateScale(14), fontWeight: '700' },
  tabTextActive: { color: '#FFFFFF' },
  tabTextInactive: { color: '#87553E' },
  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: moderateScale(12), marginBottom: verticalScale(12), borderWidth: 1, borderColor: 'rgba(240, 127, 46, 0.12)', overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  thumb: { width: scale(120), backgroundColor: '#87553E', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', alignSelf: 'stretch' },
  thumbIcon: { fontSize: moderateScale(32), color: '#FFFFFF' },
  thumbDecorLarge: { position: 'absolute', width: scale(60), height: scale(60), borderRadius: moderateScale(30), opacity: 0.18, top: verticalScale(-30), right: scale(-30) },
  thumbDecorSmall: { position: 'absolute', width: scale(30), height: scale(30), borderRadius: moderateScale(15), opacity: 0.22, bottom: verticalScale(-15), left: scale(-15) },
  durationBadge: { position: 'absolute', bottom: verticalScale(6), right: scale(6), backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: moderateScale(4), paddingHorizontal: scale(6), paddingVertical: verticalScale(2) },
  durationText: { color: '#FFFFFF', fontSize: moderateScale(11), fontWeight: '600' },
  playOverlay: { position: 'absolute', width: scale(32), height: scale(32), borderRadius: moderateScale(16), backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: '#FFFFFF', fontSize: moderateScale(14), marginLeft: scale(2) },
  premiumBadge: { position: 'absolute', top: verticalScale(6), left: scale(6), backgroundColor: '#ED7624', borderRadius: moderateScale(4), paddingHorizontal: scale(6), paddingVertical: verticalScale(2) },
  premiumText: { color: '#FFFFFF', fontSize: moderateScale(9), fontWeight: 'bold' },
  info: { flex: 1, padding: scale(12), justifyContent: 'space-between' },
  cardTitle: { fontSize: moderateScale(14), fontWeight: '600', color: '#5C250E', lineHeight: moderateScale(20) },
  cardInstructor: { fontSize: moderateScale(12), color: '#87553E', marginTop: verticalScale(4) },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: verticalScale(8) },
  viewCount: { fontSize: moderateScale(12), color: 'rgba(135, 85, 62, 0.7)' },
  bookmark: { fontSize: moderateScale(20), color: 'rgba(240, 127, 46, 0.3)' },
  bookmarkActive: { color: '#ED7624' },
  suggestionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: scale(16),
    marginTop: verticalScale(4),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    backgroundColor: 'rgba(64, 145, 108, 0.1)',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(64, 145, 108, 0.3)',
  },
  suggestionLabel: { fontSize: moderateScale(13), color: '#87553E' },
  suggestionWord: { fontSize: moderateScale(13), color: '#5C250E', fontWeight: '700' },
  suggestionTap: { fontSize: moderateScale(13), color: '#ED7624', fontWeight: '700' },
  emptyWrap: { alignItems: 'center', paddingVertical: verticalScale(60) },
  emptyIcon: { fontSize: moderateScale(40), marginBottom: verticalScale(12) },
  emptyTitle: { fontSize: moderateScale(18), fontWeight: 'bold', color: '#5C250E', marginBottom: verticalScale(4) },
  emptyText: { fontSize: moderateScale(14), color: '#87553E' },
  tabListPadding: { paddingHorizontal: scale(16) },
  contentListPadding: { paddingHorizontal: scale(16) },
  contentListPaddingPlaying: { paddingBottom: verticalScale(160) },
  contentListPaddingIdle: { paddingBottom: verticalScale(110) },
  cardExpanded: {
    marginBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  webviewContainer: {
    height: verticalScale(200),
    marginBottom: verticalScale(16),
    borderTopLeftRadius: moderateScale(12),
    borderTopRightRadius: moderateScale(12),
    borderBottomLeftRadius: moderateScale(12),
    borderBottomRightRadius: moderateScale(12),
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(240, 127, 46, 0.12)',
  },
  webview: {
    flex: 1,
  },
});
