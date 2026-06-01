/**
 * File: MiniPlayer.tsx
 *
 * Description: Persistent mini-player overlay shown at the bottom of the
 * Directory screen. Renders track info, an interactive draggable seek bar,
 * and a prominent play/pause button.
 *
 * Author: Navnit(Ninjacode911)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { scale, verticalScale, moderateScale } from '../../utils/responsive';

interface MiniPlayerProps {
  title: string;
  artist: string | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onClose: () => void;
  /** Total track duration in seconds. Defaults to 180s for demo content. */
  durationSeconds?: number;
}

const formatTime = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const MiniPlayer = ({
  title,
  artist,
  isPlaying,
  onPlayPause,
  onClose,
  durationSeconds = 180,
}: MiniPlayerProps) => {
  const [position, setPosition] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Refs so PanResponder (created once in useRef) always reads latest values,
  // not the trackWidth=0 / durationSeconds=180 captured in the first render.
  const trackWidthRef = useRef(0);
  const durationRef = useRef(durationSeconds);
  trackWidthRef.current = trackWidth;
  durationRef.current = durationSeconds;

  // Tick the position forward while playing (no real audio backend yet)
  useEffect(() => {
    if (!isPlaying || isDragging) return;
    const id = setInterval(() => {
      setPosition((prev) => {
        const next = prev + 1;
        return next >= durationSeconds ? 0 : next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, isDragging, durationSeconds]);

  // Reset position when track changes
  useEffect(() => {
    setPosition(0);
  }, [title]);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (e) => {
        setIsDragging(true);
        const w = trackWidthRef.current;
        if (w <= 0) return;
        // locationX is relative to the hit area; track spans its full width
        const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / w));
        setPosition(Math.floor(ratio * durationRef.current));
      },
      onPanResponderMove: (e) => {
        const w = trackWidthRef.current;
        if (w <= 0) return;
        const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / w));
        setPosition(Math.floor(ratio * durationRef.current));
      },
      onPanResponderRelease: () => setIsDragging(false),
      onPanResponderTerminate: () => setIsDragging(false),
    }),
  ).current;

  const progressRatio = durationSeconds > 0 ? position / durationSeconds : 0;
  const fillWidth = trackWidth * progressRatio;

  return (
    <View style={s.container}>
      {/* Top row: thumbnail, info, play, close */}
      <View style={s.topRow}>
        <View style={s.thumbnailCircle}>
          <Text style={s.thumbnailIcon}>{'\u{1F3B5}'}</Text>
        </View>

        <View style={s.info}>
          <Text style={s.title} numberOfLines={1}>
            {title}
          </Text>
          {artist && (
            <Text style={s.artist} numberOfLines={1}>
              {artist}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={onPlayPause}
          style={s.playButton}
          activeOpacity={0.8}
        >
          <Text style={s.playIcon}>
            {isPlaying ? '\u{23F8}' : '\u{25B6}'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={s.closeButton}
        >
          <Text style={s.closeIcon}>{'\u{2715}'}</Text>
        </TouchableOpacity>
      </View>

      {/* Seek bar row: time + draggable track.
          onLayout is attached to the hit area so locationX and trackWidth
          share the same coordinate frame — no offset math needed. */}
      <View style={s.seekRow}>
        <Text style={s.timeText}>{formatTime(position)}</Text>

        <View
          style={s.trackHitArea}
          onLayout={onTrackLayout}
          {...panResponder.panHandlers}
        >
          <View style={s.track}>
            <View style={[s.trackFill, { width: fillWidth }]} />
            <View
              style={[
                s.thumb,
                {
                  left: Math.max(0, fillWidth - scale(8)),
                  transform: [{ scale: isDragging ? 1.3 : 1 }],
                },
              ]}
            />
          </View>
        </View>

        <Text style={s.timeText}>{formatTime(durationSeconds)}</Text>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    backgroundColor: '#FFF5EE',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(240, 127, 46, 0.12)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailCircle: {
    width: scale(44),
    height: scale(44),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(240, 127, 46, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  thumbnailIcon: {
    fontSize: moderateScale(20),
    color: '#ED7624',
  },
  info: {
    flex: 1,
    marginRight: scale(12),
  },
  title: {
    color: '#5C250E',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  artist: {
    color: '#87553E',
    fontSize: moderateScale(12),
    marginTop: verticalScale(2),
  },
  playButton: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: '#ED7624',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(8),
    elevation: 4,
    shadowColor: '#ED7624',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: moderateScale(22),
    fontWeight: 'bold',
  },
  closeButton: {
    width: scale(32),
    height: scale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: '#87553E',
    fontSize: moderateScale(18),
  },
  seekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(10),
  },
  timeText: {
    color: '#87553E',
    fontSize: moderateScale(11),
    fontWeight: '600',
    width: scale(38),
    textAlign: 'center',
  },
  trackHitArea: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    marginHorizontal: scale(6),
  },
  track: {
    height: verticalScale(4),
    backgroundColor: 'rgba(240, 127, 46, 0.2)',
    borderRadius: moderateScale(2),
    position: 'relative',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#ED7624',
    borderRadius: moderateScale(2),
  },
  thumb: {
    position: 'absolute',
    top: verticalScale(-6),
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#ED7624',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});
