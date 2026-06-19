import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  async function handleSubmit() {
    setError('');
    setSuccess('');
    const e = email.trim();
    const p = password.trim();

    if (!e || !p) { setError('Please enter your email and password.'); return; }
    if (p.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await signUp(e, p);
        if (error) { setError(error.message); return; }
        setSuccess('Account created! Check your email to confirm, then sign in.');
        setMode('signin');
      } else {
        const { error } = await signIn(e, p);
        if (error) { setError(error.message); return; }
        // _layout.tsx will redirect once session is detected
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError('');
    setSuccess('');
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.appName}>HabitFlow</Text>
          <Text style={styles.tagline}>Build habits that actually stick</Text>
        </LinearGradient>

        <View style={styles.form}>
          <Text style={styles.formTitle}>{mode === 'signin' ? 'Welcome back' : 'Create account'}</Text>

          {!!success && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}

          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#bbb"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#bbb"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              style={styles.submitGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleMode} style={styles.toggleBtn}>
            <Text style={styles.toggleText}>
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1 },

  hero: {
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 40,
    alignItems: 'center',
  },
  appName: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 8 },

  form: { flex: 1, padding: 28, gap: 4 },
  formTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 16 },

  label: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8E8F0',
    borderRadius: 14,
    padding: 15,
    fontSize: 16,
    color: '#1A1A2E',
    backgroundColor: '#F8F8FC',
  },

  successBanner: { backgroundColor: '#D1FAE5', borderRadius: 12, padding: 14, marginBottom: 4 },
  successText: { color: '#065F46', fontSize: 14, fontWeight: '500' },
  errorBanner: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, marginBottom: 4 },
  errorText: { color: '#991B1B', fontSize: 14, fontWeight: '500' },

  submitBtn: { marginTop: 24, borderRadius: 14, overflow: 'hidden' },
  submitGrad: { paddingVertical: 17, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  toggleBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },
  toggleText: { color: '#4F46E5', fontSize: 14, fontWeight: '600' },
});
