import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { StreakBadge } from './StreakBadge';
import { scale, verticalScale, moderateScale } from '../../utils/responsive';

interface HabitLogEntry {
  date: string;
  completed: boolean;
}

interface HabitGridProps {
  habitType: string;
  habitIcon: any;
  habitName: string;
  logs: HabitLogEntry[];
  streakCount: number;
  onLogToday: () => void;
  onToggleDate?: (dateStr: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const HabitGrid = ({
  habitIcon,
  habitName,
  logs,
  streakCount,
  onLogToday,
  onToggleDate,
}: HabitGridProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const logMap = new Map<string, boolean>();
  for (const log of logs) {
    logMap.set(log.date, log.completed);
  }

  // Get current date details
  const today = new Date();
  
  // Format to local date string matching log entries (YYYY-MM-DD)
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Day of week of the 1st of the month (0 = Sun, 6 = Sat)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Create an array for calendar cells (including empty padding for start of month)
  const calendarCells = [];
  
  // Padding cells at start
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }

  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentYear, currentMonth, d);
    const dateStr = [
      dateObj.getFullYear(),
      String(dateObj.getMonth() + 1).padStart(2, '0'),
      String(dateObj.getDate()).padStart(2, '0'),
    ].join('-');
    
    calendarCells.push({
      day: d,
      dateStr: dateStr,
      isToday: dateStr === todayStr,
      completed: logMap.get(dateStr) ?? false,
    });
  }

  // Padding cells at end to complete the last week
  const totalCells = calendarCells.length;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    calendarCells.push(null);
  }

  // Group cells into weeks (rows of 7)
  const weeks = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(calendarCells.slice(i, i + 7));
  }

  return (
    <View style={s.card}>
      {/* Compact Header row */}
      <TouchableOpacity 
        style={s.header} 
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={s.headerLeft}>
          {typeof habitIcon === 'string' ? (
            <Text style={s.habitIcon}>{habitIcon}</Text>
          ) : (
            <Image source={habitIcon} style={s.habitIconImage} />
          )}
          <Text style={s.habitName} numberOfLines={1} adjustsFontSizeToFit>{habitName}</Text>
        </View>

        <View style={s.headerRight}>
          <StreakBadge count={streakCount} label="Days" />
          <TouchableOpacity 
            style={s.addButton} 
            onPress={(e) => {
              e?.stopPropagation?.(); // Prevent expanding the card when clicking + Add
              onLogToday();
            }}
            activeOpacity={0.7}
          >
            <Text style={s.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Expanded Calendar View */}
      {isExpanded && (
        <View style={s.calendarContainer}>
          {/* Weekday headers */}
          <View style={s.weekdayRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={s.weekdayText}>{day}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={s.calendarGrid}>
            {weeks.map((week, weekIdx) => (
              <View key={`week-${weekIdx}`} style={s.weekRow}>
                {week.map((cell, cellIdx) => {
                  if (!cell) {
                    // Empty padding cell
                    return <View key={`empty-${weekIdx}-${cellIdx}`} style={s.calendarCell} />;
                  }

                  const isPastOrToday = cell.dateStr <= todayStr;

                  const cellContent = (
                    <Text
                      style={[
                        s.cellText,
                        cell.completed ? s.cellTextCompleted : s.cellTextEmpty,
                        cell.isToday && cell.completed ? s.cellTextTodayCompleted : null,
                        !isPastOrToday && !cell.completed ? s.cellTextFuture : null
                      ]}
                    >
                      {cell.day}
                    </Text>
                  );

                  return (
                    <TouchableOpacity
                      key={cell.dateStr}
                      style={[
                        s.calendarCell,
                        cell.completed ? s.cellCompleted : s.cellEmpty,
                        cell.isToday ? (cell.completed ? s.cellTodayCompleted : s.cellToday) : null
                      ]}
                      onPress={() => {
                        if (onToggleDate) {
                          onToggleDate(cell.dateStr);
                        }
                      }}
                      activeOpacity={onToggleDate ? 0.7 : 1}
                      disabled={!onToggleDate}
                    >
                      {cellContent}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(240, 127, 46, 0.12)',
    marginHorizontal: scale(24),
    marginBottom: verticalScale(16),
    padding: scale(16),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: scale(12),
  },
  habitIcon: {
    fontSize: moderateScale(18),
    marginRight: scale(8),
  },
  habitIconImage: {
    width: scale(24),
    height: scale(24),
    marginRight: scale(8),
    resizeMode: 'contain',
  },
  habitName: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#5C250E',
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: 'rgba(240, 127, 46, 0.1)',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(10),
    marginLeft: scale(8),
  },
  addButtonText: {
    color: '#ED7624',
    fontWeight: '600',
    fontSize: moderateScale(12),
  },
  calendarContainer: {
    marginTop: verticalScale(16),
    paddingTop: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(240, 127, 46, 0.12)',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: moderateScale(12),
    color: '#87553E',
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'column',
    width: '100%',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  calendarCell: {
    width: '14.28%', // 100% / 7 columns
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(4),
    borderRadius: moderateScale(8),
  },
  cellEmpty: {
    backgroundColor: 'transparent',
  },
  cellCompleted: {
    backgroundColor: '#ED7624',
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: '#ED7624',
    backgroundColor: 'rgba(240, 127, 46, 0.05)',
  },
  cellTodayCompleted: {
    borderWidth: 1.5,
    borderColor: '#5C250E',
    backgroundColor: '#ED7624',
  },
  cellTextTodayCompleted: {
    color: '#5C250E',
    fontWeight: 'bold',
  },
  cellText: {
    fontSize: moderateScale(14),
  },
  cellTextCompleted: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cellTextEmpty: {
    color: '#5C250E',
  },
  cellTextFuture: {
    color: 'rgba(92, 37, 14, 0.3)', // Faded out for future days
  }
});
