import { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore, Habit } from '../../hooks/useStore';
import { hapticComplete, hapticCelebrate, hapticHeavy, hapticTap } from '../../utils/haptics';
import { playChime } from '../../utils/sound';
import { PRIMARY, BG, TEXT, MUTED, BORDER } from '../../constants/theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function HabitCard({ habit, onPress, onLongPress }: { habit: Habit; onPress: () => void; onLongPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const isDone = habit.completedCount >= habit.targetCount;

  function handlePress() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 40, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 12 }),
    ]).start();
    if (!isDone) {
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 180, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 600, useNativeDriver: false }),
      ]).start();
    }
    onPress();
  }

  const borderColor = glow.interpolate({ inputRange: [0, 1], outputRange: ['#E8E8F0', habit.color] });
  const isVolume = habit.type === 'volume';
  const pct = isVolume ? habit.completedCount / habit.targetCount : (isDone ? 1 : 0);

  return (
    <Animated.View style={[styles.cardWrap, { transform: [{ scale }] }]}>
      <Animated.View style={[styles.card, { borderColor }]}>
        <TouchableOpacity style={styles.cardInner} onPress={handlePress} onLongPress={onLongPress} activeOpacity={0.9}>
          <View style={[styles.emojiBox, { backgroundColor: habit.color + '20' }]}>
            <Text style={styles.emojiText}>{habit.emoji}</Text>
            {isDone && (
              <View style={[styles.doneBadge, { backgroundColor: habit.color }]}>
                <Text style={styles.doneTick}>✓</Text>
              </View>
            )}
          </View>

          <View style={styles.cardBody}>
            <View style={styles.cardTop}>
              <Text style={[styles.habitName, isDone && styles.habitNameDone]} numberOfLines={1}>
                {habit.name}
              </Text>
              <View style={[styles.typePill, { backgroundColor: habit.color + '20' }]}>
                <Text style={[styles.typeLabel, { color: habit.color }]}>
                  {isVolume ? `${habit.completedCount}/${habit.targetCount}×` : 'Daily'}
                </Text>
              </View>
            </View>

            {isVolume && (
              <View style={styles.volTrack}>
                <View style={[styles.volFill, { width: `${pct * 100}%` as any, backgroundColor: habit.color }]} />
              </View>
            )}

            <Text style={styles.streak}>🔥 {habit.streak} day streak</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

function StarBurst({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.delay(1200),
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
        Animated.spring(scale, { toValue: 1, speed: 12, bounciness: 10, useNativeDriver: true }),
      ]).start(() => scale.setValue(0.5));
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <Animated.View style={[styles.burst, { opacity, transform: [{ scale }] }]}>
      <LinearGradient colors={['#4F46E5', '#8B5CF6', '#EC4899']} style={styles.burstGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.burstText}>🎉 All done!</Text>
        <Text style={styles.burstSub}>Incredible work today</Text>
      </LinearGradient>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { habits, deleteHabit, incrementHabit, loading } = useStore();
  const router = useRouter();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const allDoneRef = useRef(false);
  const allDoneShown = useRef(false);

  const total = habits.length;
  const done = habits.filter((h) => h.completedCount >= h.targetCount).length;
  const progress = total > 0 ? done / total : 0;
  const allDone = total > 0 && done === total;

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: progress, duration: 500, useNativeDriver: false }).start();
  }, [progress]);

  useEffect(() => {
    if (allDone && !allDoneShown.current) {
      allDoneShown.current = true;
      allDoneRef.current = true;
      hapticCelebrate();
      playChime();
    } else if (!allDone) {
      allDoneShown.current = false;
      allDoneRef.current = false;
    }
  }, [allDone]);

  const handleToggle = useCallback(async (id: string) => {
    const result = incrementHabit(id);
    if (result === 'already_done') { hapticTap(); return; }
    if (result === 'completed') { hapticComplete(); playChime(); }
    else { hapticTap(); }
  }, [incrementHabit]);

  const handleDelete = useCallback((id: string, name: string) => {
    hapticHeavy();
    Alert.alert('Delete Habit', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(id) },
    ]);
  }, [deleteHabit]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  if (loading) return <View style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <StarBurst visible={allDone} />

      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.dateText}>{today}</Text>
        <Text style={styles.greetText}>{greeting()} 👋</Text>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{done}/{total} habits done</Text>
          <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {habits.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyHint}>Tap + to plant your first one</Text>
          </View>
        )}
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onPress={() => handleToggle(habit.id)}
            onLongPress={() => handleDelete(habit.id, habit.name)}
          />
        ))}
        {habits.length > 0 && <Text style={styles.hint}>Long-press a habit to delete</Text>}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-habit')} activeOpacity={0.85}>
        <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.fabGrad}>
          <Text style={styles.fabText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  dateText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3, marginBottom: 2 },
  greetText: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 20 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  progressPct: { fontSize: 13, color: '#fff', fontWeight: '800' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },

  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 110, gap: 12 },

  emptyWrap: { alignItems: 'center', marginTop: 64 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: TEXT, marginBottom: 6 },
  emptyHint: { fontSize: 14, color: MUTED },
  hint: { textAlign: 'center', color: '#ccc', fontSize: 12, marginTop: 8 },

  cardWrap: { borderRadius: 18 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1.5,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
    }),
  },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  emojiBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 26 },
  doneBadge: { position: 'absolute', bottom: -4, right: -4, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  doneTick: { fontSize: 9, color: '#fff', fontWeight: '800' },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  habitName: { fontSize: 15, fontWeight: '700', color: TEXT, flex: 1, marginRight: 8 },
  habitNameDone: { color: MUTED, textDecorationLine: 'line-through' },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeLabel: { fontSize: 11, fontWeight: '700' },
  volTrack: { height: 4, backgroundColor: '#F0F0F8', borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  volFill: { height: '100%', borderRadius: 2 },
  streak: { fontSize: 12, color: MUTED },

  fab: {
    position: 'absolute', bottom: 90, right: 24,
    width: 60, height: 60, borderRadius: 30, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: PRIMARY, shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 8 },
    }),
  },
  fabGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fabText: { fontSize: 32, color: '#fff', lineHeight: 36 },

  burst: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', zIndex: 100,
    pointerEvents: 'none',
  },
  burstGrad: { paddingHorizontal: 36, paddingVertical: 24, borderRadius: 24, alignItems: 'center' },
  burstText: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 6 },
  burstSub: { fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
});
