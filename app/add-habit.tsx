import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../hooks/useStore';
import { hapticTap, hapticComplete } from '../utils/haptics';
import { playChime } from '../utils/sound';
import { HABIT_COLORS, HABIT_EMOJIS, TEXT, MUTED, BORDER, BG } from '../constants/theme';

const VOLUME_OPTIONS = [2, 3, 4, 5, 6];

export default function AddHabitScreen() {
  const router = useRouter();
  const { addHabit } = useStore();

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💪');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [type, setType] = useState<'daily' | 'volume'>('daily');
  const [targetCount, setTargetCount] = useState(3);

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    addHabit({ name: trimmed, emoji, color, type, targetCount: type === 'daily' ? 1 : targetCount });
    hapticComplete();
    playChime();
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.handle} />

        <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.title}>New Habit</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
          {/* Name */}
          <Text style={styles.label}>Habit name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Go for a walk"
            placeholderTextColor="#bbb"
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            autoFocus
          />

          {/* Emoji */}
          <Text style={styles.label}>Pick an emoji</Text>
          <View style={styles.emojiGrid}>
            {HABIT_EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiBtn, emoji === e && { borderColor: color, backgroundColor: color + '18' }]}
                onPress={() => { setEmoji(e); hapticTap(); }}
              >
                <Text style={styles.emojiBtnText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Color */}
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorRow}>
            {HABIT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                onPress={() => { setColor(c); hapticTap(); }}
              />
            ))}
          </View>

          {/* Type */}
          <Text style={styles.label}>Habit type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'daily' && { backgroundColor: color, borderColor: color }]}
              onPress={() => { setType('daily'); hapticTap(); }}
            >
              <Text style={[styles.typeBtnLabel, type === 'daily' && { color: '#fff' }]}>☑️ Daily</Text>
              <Text style={[styles.typeBtnSub, type === 'daily' && { color: 'rgba(255,255,255,0.8)' }]}>Once a day</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'volume' && { backgroundColor: color, borderColor: color }]}
              onPress={() => { setType('volume'); hapticTap(); }}
            >
              <Text style={[styles.typeBtnLabel, type === 'volume' && { color: '#fff' }]}>🔁 Volume</Text>
              <Text style={[styles.typeBtnSub, type === 'volume' && { color: 'rgba(255,255,255,0.8)' }]}>Multiple times</Text>
            </TouchableOpacity>
          </View>

          {type === 'volume' && (
            <>
              <Text style={styles.label}>Times per day</Text>
              <View style={styles.volumeRow}>
                {VOLUME_OPTIONS.map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.volumeBtn, targetCount === n && { backgroundColor: color, borderColor: color }]}
                    onPress={() => { setTargetCount(n); hapticTap(); }}
                  >
                    <Text style={[styles.volumeNum, targetCount === n && { color: '#fff' }]}>{n}×</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!name.trim()}
          >
            <LinearGradient
              colors={name.trim() ? [color, color + 'CC'] : ['#ccc', '#bbb']}
              style={styles.addBtnGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={styles.addBtnText}>Add Habit</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  handle: { width: 40, height: 4, backgroundColor: '#E0E0F0', borderRadius: 2, alignSelf: 'center', marginTop: 10 },

  header: { paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  body: { flex: 1 },
  bodyContent: { padding: 24, gap: 8, paddingBottom: 40 },

  label: { fontSize: 13, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 8 },

  input: { borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, padding: 15, fontSize: 17, color: TEXT, backgroundColor: BG },

  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 48, height: 48, borderRadius: 12, borderWidth: 2, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  emojiBtnText: { fontSize: 22 },

  colorRow: { flexDirection: 'row', gap: 10 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotActive: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 },

  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 2, borderColor: BORDER, alignItems: 'center' },
  typeBtnLabel: { fontSize: 15, fontWeight: '700', color: TEXT, marginBottom: 3 },
  typeBtnSub: { fontSize: 12, color: MUTED },

  volumeRow: { flexDirection: 'row', gap: 10 },
  volumeBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: BORDER, alignItems: 'center' },
  volumeNum: { fontSize: 16, fontWeight: '800', color: TEXT },

  footer: { padding: 24, paddingTop: 12 },
  addBtn: { borderRadius: 16, overflow: 'hidden' },
  addBtnDisabled: { opacity: 0.5 },
  addBtnGrad: { paddingVertical: 17, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
