import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore, ActiveChallenge } from '../../hooks/useStore';
import { hapticComplete, hapticTap, hapticCelebrate } from '../../utils/haptics';
import { playChime } from '../../utils/sound';
import { PRESET_CHALLENGES, BG, TEXT, MUTED, BORDER } from '../../constants/theme';

function daysLeft(c: ActiveChallenge): number {
  return Math.max(0, c.durationDays - c.daysCompleted);
}

function ChallengeCard({ challenge }: { challenge: ActiveChallenge }) {
  const pct = challenge.durationDays > 0 ? challenge.daysCompleted / challenge.durationDays : 0;
  const widthAnim = useRef(new Animated.Value(0)).current;
  const isComplete = !!challenge.completedAt;

  useEffect(() => {
    Animated.timing(widthAnim, { toValue: pct, duration: 700, useNativeDriver: false, delay: 200 }).start();
  }, [pct]);

  const barWidth = widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const left = daysLeft(challenge);

  return (
    <View style={[styles.activeCard, isComplete && styles.activeCardDone]}>
      <LinearGradient
        colors={isComplete ? ['#10B981', '#059669'] : [challenge.color, challenge.color + 'BB']}
        style={styles.activeCardGrad}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={styles.activeCardHeader}>
          <Text style={styles.activeCardEmoji}>{challenge.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.activeCardTitle}>{challenge.title}</Text>
            <Text style={styles.activeCardStatus}>
              {isComplete ? '🎉 Completed!' : `Day ${challenge.daysCompleted} of ${challenge.durationDays}`}
            </Text>
          </View>
          {isComplete && <Text style={styles.trophy}>🏆</Text>}
        </View>

        {!isComplete && (
          <>
            <View style={styles.activeCardTrack}>
              <Animated.View style={[styles.activeCardFill, { width: barWidth }]} />
            </View>
            <Text style={styles.activeCardLeft}>
              {left === 0 ? 'Final push today!' : `${left} day${left !== 1 ? 's' : ''} remaining`}
            </Text>
          </>
        )}
      </LinearGradient>
    </View>
  );
}

function PresetCard({ preset, alreadyActive }: { preset: typeof PRESET_CHALLENGES[number]; alreadyActive: boolean }) {
  const { joinChallenge } = useStore();
  const scale = useRef(new Animated.Value(1)).current;

  function handleJoin() {
    if (alreadyActive) return;
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 30 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 12 }),
    ]).start();
    hapticComplete();
    playChime();
    joinChallenge(preset);
  }

  return (
    <Animated.View style={[styles.presetCard, { transform: [{ scale }] }]}>
      <View style={[styles.presetEmojiBg, { backgroundColor: preset.color + '18' }]}>
        <Text style={styles.presetEmoji}>{preset.emoji}</Text>
      </View>
      <View style={styles.presetBody}>
        <Text style={styles.presetTitle}>{preset.title}</Text>
        <Text style={styles.presetDesc}>{preset.description}</Text>
        <Text style={styles.presetDays}>{preset.durationDays} days</Text>
      </View>
      <TouchableOpacity
        style={[styles.joinBtn, { backgroundColor: alreadyActive ? '#E0E0F0' : preset.color }]}
        onPress={handleJoin}
        disabled={alreadyActive}
      >
        <Text style={[styles.joinBtnText, alreadyActive && { color: MUTED }]}>
          {alreadyActive ? 'Active' : 'Join'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ChallengesScreen() {
  const { challenges, loading } = useStore();
  const activeChallenges = challenges.filter((c) => !c.completedAt);
  const completedChallenges = challenges.filter((c) => !!c.completedAt);

  useEffect(() => {
    const justCompleted = challenges.filter(
      (c) => c.completedAt && Date.now() - c.completedAt < 5000
    );
    if (justCompleted.length > 0) {
      hapticCelebrate();
      playChime();
      Alert.alert('Challenge Complete! 🏆', `You finished "${justCompleted[0].title}"! Amazing work!`);
    }
  }, [challenges]);

  if (loading) return <View style={{ flex: 1, backgroundColor: BG }} />;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.headerTitle}>Challenges</Text>
        <Text style={styles.headerSub}>Push yourself further 💪</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeChallenges.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Active</Text>
            {activeChallenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
          </>
        )}

        {completedChallenges.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Completed 🏆</Text>
            {completedChallenges.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
          </>
        )}

        <Text style={styles.sectionTitle}>Available</Text>
        {PRESET_CHALLENGES.map((p) => (
          <PresetCard
            key={p.id}
            preset={p}
            alreadyActive={activeChallenges.some((c) => c.presetId === p.id)}
          />
        ))}

        {activeChallenges.length === 0 && completedChallenges.length === 0 && (
          <View style={styles.emptyBanner}>
            <Text style={styles.emptyBannerText}>👆 Join a challenge above to get started!</Text>
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

  content: { padding: 16, gap: 12, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8, marginBottom: 4 },

  activeCard: { borderRadius: 20, overflow: 'hidden' },
  activeCardDone: {},
  activeCardGrad: { padding: 20 },
  activeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  activeCardEmoji: { fontSize: 36 },
  activeCardTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 2 },
  activeCardStatus: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  trophy: { fontSize: 32 },
  activeCardTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  activeCardFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  activeCardLeft: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  presetCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 2 },
    }),
  },
  presetEmojiBg: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  presetEmoji: { fontSize: 28 },
  presetBody: { flex: 1 },
  presetTitle: { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 3 },
  presetDesc: { fontSize: 12, color: MUTED, marginBottom: 4, lineHeight: 17 },
  presetDays: { fontSize: 12, fontWeight: '700', color: MUTED },
  joinBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  joinBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  emptyBanner: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: BORDER, borderStyle: 'dashed' },
  emptyBannerText: { fontSize: 14, color: MUTED, fontWeight: '600' },
});
