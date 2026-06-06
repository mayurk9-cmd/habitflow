import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../hooks/useStore';
import { BG, TEXT, MUTED, BORDER } from '../../constants/theme';

function StatBox({ value, label, color }: { value: string | number; label: string; color: string }) {
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 10, delay: 100 }).start();
  }, []);

  return (
    <Animated.View style={[styles.statBox, { transform: [{ scale }] }]}>
      <LinearGradient colors={[color, color + 'AA']} style={styles.statBoxGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function StreakBar({ habit }: { habit: { name: string; emoji: string; color: string; streak: number; targetCount: number } }) {
  const barWidth = useRef(new Animated.Value(0)).current;
  const maxStreak = 30;
  const pct = Math.min(habit.streak / maxStreak, 1);

  useEffect(() => {
    Animated.timing(barWidth, { toValue: pct, duration: 700, useNativeDriver: false, delay: 300 }).start();
  }, [pct]);

  const animWidth = barWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.streakRow}>
      <View style={styles.streakLeft}>
        <Text style={styles.streakEmoji}>{habit.emoji}</Text>
        <Text style={styles.streakName} numberOfLines={1}>{habit.name}</Text>
      </View>
      <View style={styles.streakBarWrap}>
        <View style={styles.streakTrack}>
          <Animated.View style={[styles.streakFill, { width: animWidth, backgroundColor: habit.color }]} />
        </View>
        <Text style={[styles.streakDays, { color: habit.color }]}>{habit.streak}d</Text>
      </View>
    </View>
  );
}

function AchievementBadge({ emoji, title, unlocked }: { emoji: string; title: string; unlocked: boolean }) {
  return (
    <View style={[styles.badge, !unlocked && styles.badgeLocked]}>
      <Text style={[styles.badgeEmoji, !unlocked && styles.badgeEmojiLocked]}>{emoji}</Text>
      <Text style={[styles.badgeTitle, !unlocked && styles.badgeTitleLocked]}>{title}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const { habits, challenges, loading } = useStore();

  if (loading) return <View style={{ flex: 1, backgroundColor: BG }} />;

  const totalHabits = habits.length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const completedToday = habits.filter((h) => h.completedCount >= h.targetCount).length;
  const completedChallenges = challenges.filter((c) => !!c.completedAt).length;

  const achievements = [
    { emoji: '🌱', title: 'First Habit', unlocked: totalHabits >= 1 },
    { emoji: '🔥', title: '3-Day Streak', unlocked: bestStreak >= 3 },
    { emoji: '⚡', title: '7-Day Streak', unlocked: bestStreak >= 7 },
    { emoji: '💎', title: '30-Day Streak', unlocked: bestStreak >= 30 },
    { emoji: '🏆', title: 'Challenge Done', unlocked: completedChallenges >= 1 },
    { emoji: '🎯', title: 'Perfect Day', unlocked: totalHabits > 0 && completedToday === totalHabits },
  ];

  const sortedHabits = [...habits].sort((a, b) => b.streak - a.streak);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.headerTitle}>Your Progress</Text>
        <Text style={styles.headerSub}>Keep the momentum going 📈</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stat boxes */}
        <View style={styles.statGrid}>
          <StatBox value={totalHabits} label="Habits" color="#4F46E5" />
          <StatBox value={bestStreak} label="Best Streak" color="#F59E0B" />
          <StatBox value={`${completedToday}/${totalHabits}`} label="Today" color="#10B981" />
          <StatBox value={completedChallenges} label="Challenges" color="#EC4899" />
        </View>

        {/* Per-habit streaks */}
        {sortedHabits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Habit Streaks</Text>
            <View style={styles.sectionCard}>
              {sortedHabits.map((h) => <StreakBar key={h.id} habit={h} />)}
            </View>
          </View>
        )}

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.badgeGrid}>
            {achievements.map((a) => <AchievementBadge key={a.title} {...a} />)}
          </View>
        </View>

        {totalHabits === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>Add some habits to see your stats here.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  content: { padding: 16, gap: 20, paddingBottom: 40 },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: { flex: 1, minWidth: '45%', borderRadius: 18, overflow: 'hidden' },
  statBoxGrad: { padding: 20, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.6 },

  section: { gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },

  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 120 },
  streakEmoji: { fontSize: 18 },
  streakName: { fontSize: 13, fontWeight: '600', color: TEXT, flex: 1 },
  streakBarWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  streakTrack: { flex: 1, height: 8, backgroundColor: '#F0F0F8', borderRadius: 4, overflow: 'hidden' },
  streakFill: { height: '100%', borderRadius: 4 },
  streakDays: { fontSize: 12, fontWeight: '800', width: 28, textAlign: 'right' },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 16, flex: 1, minWidth: '30%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  badgeLocked: { backgroundColor: '#F8F8FC', borderWidth: 1.5, borderColor: BORDER },
  badgeEmoji: { fontSize: 28, marginBottom: 6 },
  badgeEmojiLocked: { opacity: 0.3 },
  badgeTitle: { fontSize: 11, fontWeight: '700', color: TEXT, textAlign: 'center' },
  badgeTitleLocked: { color: MUTED },

  empty: { alignItems: 'center', marginTop: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: MUTED, textAlign: 'center' },
});
