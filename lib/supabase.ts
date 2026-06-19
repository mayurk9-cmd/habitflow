import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// SecureStore keys must only contain alphanumeric, dots, dashes, underscores
function sanitize(key: string) {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// SecureStore is native-only; fall back to AsyncStorage on web
const storage =
  Platform.OS === 'web'
    ? {
        getItem: (key: string) => AsyncStorage.getItem(key),
        setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
        removeItem: (key: string) => AsyncStorage.removeItem(key),
      }
    : {
        getItem: (key: string) => SecureStore.getItemAsync(sanitize(key)),
        setItem: (key: string, value: string) =>
          SecureStore.setItemAsync(sanitize(key), value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(sanitize(key)),
      };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
