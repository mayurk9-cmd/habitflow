import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  fetchLatestInsight, generateCoachInsight,
  generateWeeklySummary, type AiInsight,
} from '../../lib/db';
import { useStore } from '../../hooks/useStore';
import { hapticComplete, hapticTap } from '../../utils/haptics';
import { BG, MUTED, BORDER, TEXT } from '../../constants/theme';

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function InsightCard({ insight, accent }: { insight: AiInsight; accent: string }) {
  return (
    <View style={[styles.insightCard, { borderLeftColor: accent }]}>
      <Text style={styles.insightText}>{insight.content}</Text>
      <Text style={styles.insightMeta}>
        {insight.model} · {timeAgo(insight.created_at)}
      </Text>
    </View>
  );
}

function SummaryCard({ insight }: { insight: AiInsight }) {
  const lines = insight.content.split('\n').filter(Boolean);
  return (
    <View style={styles.summaryCard}>
      {lines.map((line, i) => {
        const isBold = line.startsWith('**') && line.endsWith('**');
        const text = isBold ? line.slice(2, -2) : line;
        return (
          <Text key={i} style={isBold ? styles.summaryHeading : styles.summaryLine}>
            {text}
          </Text>
        );
      })}
      <Text style={styles.insightMeta}>{insight.model} · {timeAgo(insight.created_at)}</Text>
    </View>
  );
}

function ActionButton({
  label, emoji, onPress, loading, disabled, color,
}: {
  label: string; emoji: string; onPress: () => void;
  loading: boolean; disabled: boolean; color: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={disabled ? ['#C8C8D8', '#B8B8C8'] : [color, color + 'CC']}
        style={styles.actionBtnGrad}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      >
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.actionBtnText}>{emoji}  {label}</Text>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function CoachScreen() {
  const { habits, loading: storeLoading } = useStore();
  const [coaching, setCoaching] = useState<AiInsight | null>(null);
  const [summary, setSummary] = useState<AiInsight | null>(null);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [coachError, setCoachError] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  const [summaryPeriod, setSummaryPeriod] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    Promise.all([
      fetchLatestInsight('coaching'),
      fetchLatestInsight('weekly_summary'),
    ]).then(([c, s]) => {
      setCoaching(c);
      setSummary(s);
      setInitialLoad(false);
    });
  }, []);

  const handleGetInsight = useCallback(async () => {
    hapticTap();
    setLoadingCoach(true);
    setCoachError('');
    const { insight, error, cooldown } = await generateCoachInsight();
    if (error) {
      setCoachError(cooldown ? '⏳ ' + error : error);
    } else if (insight) {
      hapticComplete();
      const fresh = await fetchLatestInsight('coaching');
      setCoaching(fresh);
    }
    setLoadingCoach(false);
  }, []);

  const handleGetSummary = useCallback(async () => {
    hapticTap();
    setLoadingSummary(true);
    setSummaryError('');
    const { summary: text, error, cooldown } = await generateWeeklySummary(summaryPeriod);
    if (error) {
      setSummaryError(cooldown ? '⏳ ' + error : error);
    } else if (text) {
      hapticComplete();
      const type = summaryPeriod === 'monthly' ? 'monthly_summary' : 'weekly_summary';
      const fresh = await fetchLatestInsight(type);
      setSummary(fresh);
    }
    setLoadingSummary(false);
  }, [summaryPeriod]);

  const hasHabits = habits.length > 0;

  if (storeLoading || initialLoad) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator color="#4F46E5" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.headerTitle}>AI Coach</Text>
        <Text style={styles.headerSub}>Powered by Claude Sonnet 🤖</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Daily Coaching ───────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Daily Coaching</Text>

        {coaching
          ? <InsightCard insight={coaching} accent="#4F46E5" />
          : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>💡</Text>
              <Text style={styles.emptyText}>
                {hasHabits
                  ? 'Tap below to get your first personalized coaching insight.'
                  : 'Add some habits first, then come back for coaching.'}
              </Text>
            </View>
          )
        }

        {!!coachError && <Text style={styles.errorText}>{coachError}</Text>}

        <ActionButton
          label={coaching ? 'Refresh Insight' : 'Get Coaching Insight'}
          emoji="✨"
          onPress={handleGetInsight}
          loading={loadingCoach}
          disabled={!hasHabits}
          color="#4F46E5"
        />

        {/* ── Weekly / Monthly Summary ─────────────────────────────────── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Reflection Summary</Text>
          <View style={styles.periodToggle}>
            {(['weekly', 'monthly'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, summaryPeriod === p && styles.periodBtnActive]}
                onPress={() => { setSummaryPeriod(p); hapticTap(); }}
              >
                <Text style={[styles.periodBtnText, summaryPeriod === p && styles.periodBtnTextActive]}>
                  {p === 'weekly' ? 'Week' : 'Month'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {summary
          ? <SummaryCard insight={summary} />
          : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📊</Text>
              <Text style={styles.emptyText}>
                {hasHabits
                  ? `Generate your first ${summaryPeriod} summary below.`
                  : 'Add habits and track them for a few days to unlock summaries.'}
              </Text>
            </View>
          )
        }

        {!!summaryError && <Text style={styles.errorText}>{summaryError}</Text>}

        <ActionButton
          label={`Generate ${summaryPeriod === 'monthly' ? 'Monthly' : 'Weekly'} Summary`}
          emoji="📈"
          onPress={handleGetSummary}
          loading={loadingSummary}
          disabled={!hasHabits}
          color="#7C3AED"
        />

        <Text style={styles.footerNote}>
          Insights are generated by Claude Sonnet and cached to avoid redundant API calls.
          Coaching refreshes every 30 min · Summaries every 12 h.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  content: { padding: 16, gap: 12, paddingBottom: 48 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8 },

  periodToggle: { flexDirection: 'row', backgroundColor: '#E8E8F0', borderRadius: 10, padding: 2 },
  periodBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  periodBtnActive: { backgroundColor: '#fff' },
  periodBtnText: { fontSize: 12, fontWeight: '600', color: MUTED },
  periodBtnTextActive: { color: '#4F46E5' },

  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderLeftWidth: 4,
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
    }),
  },
  insightText: { fontSize: 15, color: TEXT, lineHeight: 23, fontWeight: '500' },
  insightMeta: { fontSize: 11, color: MUTED, fontWeight: '500' },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    gap: 6,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
    }),
  },
  summaryHeading: { fontSize: 14, fontWeight: '800', color: '#4F46E5', marginTop: 8, marginBottom: 2 },
  summaryLine: { fontSize: 14, color: TEXT, lineHeight: 21 },

  emptyCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 24,
    alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: BORDER, borderStyle: 'dashed',
  },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 20 },

  actionBtn: { borderRadius: 16, overflow: 'hidden' },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnGrad: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center', minHeight: 52 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '500', textAlign: 'center', paddingHorizontal: 8 },

  footerNote: { fontSize: 11, color: MUTED, textAlign: 'center', lineHeight: 16, marginTop: 8 },
});
