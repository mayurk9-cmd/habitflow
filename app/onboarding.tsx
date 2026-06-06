import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Dimensions, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../hooks/useStore';
import { hapticTap, hapticComplete } from '../utils/haptics';
import { playChime } from '../utils/sound';
import { PRESET_CHALLENGES, HABIT_EMOJIS, TEXT, MUTED, BORDER } from '../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    gradient: ['#4F46E5', '#7C3AED'] as const,
    emoji: '🎯',
    title: 'Build habits\nthat actually stick',
    subtitle: 'Track daily habits, build streaks, and complete challenges. Let\'s make consistency feel great.',
  },
  {
    gradient: ['#10B981', '#059669'] as const,
    emoji: '🏆',
    title: 'Start with\na challenge',
    subtitle: 'Pick a challenge to kick things off. Completing it unlocks a special reward.',
  },
  {
    gradient: ['#F59E0B', '#D97706'] as const,
    emoji: '🌱',
    title: 'Plant your\nfirst habit',
    subtitle: 'Give your habit a name. You can add more later.',
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useStore();
  const scrollRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [page, setPage] = useState(0);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(PRESET_CHALLENGES[0].id);
  const [habitName, setHabitName] = useState('');
  const [habitEmoji, setHabitEmoji] = useState('💪');

  function goTo(next: number) {
    hapticTap();
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
    setPage(next);
    Animated.spring(slideAnim, { toValue: next, useNativeDriver: false, speed: 14 }).start();
  }

  function finish() {
    const name = habitName.trim() || 'My first habit';
    hapticComplete();
    playChime();
    completeOnboarding(name, habitEmoji, selectedChallenge);
  }

  const dotColors = SLIDES.map((s) => s.gradient[0]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <LinearGradient key={i} colors={slide.gradient} style={styles.slide} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.slideInner}>
              <Text style={styles.slideEmoji}>{slide.emoji}</Text>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideSub}>{slide.subtitle}</Text>

              {i === 1 && (
                <View style={styles.challengeList}>
                  {PRESET_CHALLENGES.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.challengeCard, selectedChallenge === c.id && styles.challengeCardActive]}
                      onPress={() => { setSelectedChallenge(c.id); hapticTap(); }}
                    >
                      <Text style={styles.challengeCardEmoji}>{c.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.challengeCardTitle}>{c.title}</Text>
                        <Text style={styles.challengeCardDesc}>{c.description}</Text>
                      </View>
                      {selectedChallenge === c.id && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.challengeCard, selectedChallenge === null && styles.challengeCardActive]}
                    onPress={() => { setSelectedChallenge(null); hapticTap(); }}
                  >
                    <Text style={styles.challengeCardEmoji}>⏭️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.challengeCardTitle}>Skip for now</Text>
                      <Text style={styles.challengeCardDesc}>Add a challenge later from the Challenges tab.</Text>
                    </View>
                    {selectedChallenge === null && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {i === 2 && (
                <View style={styles.habitForm}>
                  <TextInput
                    style={styles.habitInput}
                    placeholder="e.g. Morning workout"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={habitName}
                    onChangeText={setHabitName}
                    returnKeyType="done"
                    autoFocus={page === 2}
                  />
                  <Text style={styles.emojiPickLabel}>Pick an emoji</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow}>
                    {HABIT_EMOJIS.map((e) => (
                      <TouchableOpacity
                        key={e}
                        style={[styles.emojiBtn, habitEmoji === e && styles.emojiBtnActive]}
                        onPress={() => { setHabitEmoji(e); hapticTap(); }}
                      >
                        <Text style={{ fontSize: 24 }}>{e}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.footer}>
              <View style={styles.dots}>
                {SLIDES.map((_, di) => (
                  <View key={di} style={[styles.dot, page === di && styles.dotActive]} />
                ))}
              </View>

              {i < SLIDES.length - 1 ? (
                <TouchableOpacity style={styles.nextBtn} onPress={() => goTo(i + 1)}>
                  <Text style={styles.nextBtnText}>Continue →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.nextBtn} onPress={finish}>
                  <Text style={styles.nextBtnText}>Let's go! 🚀</Text>
                </TouchableOpacity>
              )}

              {i > 0 && (
                <TouchableOpacity onPress={() => goTo(i - 1)} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: { width, flex: 1, justifyContent: 'space-between' },
  slideInner: { flex: 1, paddingHorizontal: 28, paddingTop: 48, alignItems: 'center' },
  slideEmoji: { fontSize: 72, marginBottom: 24 },
  slideTitle: { fontSize: 32, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 40, marginBottom: 14 },
  slideSub: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24, marginBottom: 28 },

  challengeList: { width: '100%', gap: 10 },
  challengeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16,
    padding: 16, borderWidth: 2, borderColor: 'transparent',
  },
  challengeCardActive: { backgroundColor: 'rgba(255,255,255,0.3)', borderColor: '#fff' },
  challengeCardEmoji: { fontSize: 28 },
  challengeCardTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  challengeCardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  checkmark: { fontSize: 18, color: '#fff', fontWeight: '900' },

  habitForm: { width: '100%', gap: 12 },
  habitInput: {
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 14,
    padding: 16, fontSize: 18, color: '#fff', backgroundColor: 'rgba(255,255,255,0.15)',
  },
  emojiPickLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.8 },
  emojiRow: { gap: 8, paddingVertical: 4 },
  emojiBtn: { width: 48, height: 48, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  emojiBtnActive: { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.3)' },

  footer: { paddingHorizontal: 28, paddingBottom: Platform.OS === 'ios' ? 24 : 32, alignItems: 'center', gap: 12 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { width: 24, backgroundColor: '#fff' },

  nextBtn: { width: '100%', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  nextBtnText: { fontSize: 17, fontWeight: '800', color: '#4F46E5' },
  backBtn: { paddingVertical: 6 },
  backBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' },
});
