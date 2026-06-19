import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { fetchRemoteStore, upsertHabit, removeHabit, upsertChallenge, upsertUserState } from '../lib/db';

export type HabitType = 'daily' | 'volume';

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: HabitType;
  targetCount: number;
  completedCount: number;
  streak: number;
  createdAt: number;
};

export type ActiveChallenge = {
  id: string;
  presetId: string;
  title: string;
  description: string;
  durationDays: number;
  emoji: string;
  color: string;
  startedAt: number;
  completedAt?: number;
  daysCompleted: number;
  lastCheckedDate: string;
};

type Store = {
  habits: Habit[];
  challenges: ActiveChallenge[];
  hasOnboarded: boolean;
  lastResetDate: string;
};

type StoreCtx = Store & {
  loading: boolean;
  syncing: boolean;
  addHabit: (h: Omit<Habit, 'id' | 'completedCount' | 'streak' | 'createdAt'>) => void;
  deleteHabit: (id: string) => void;
  incrementHabit: (id: string) => 'incremented' | 'completed' | 'already_done';
  joinChallenge: (preset: { id: string; title: string; description: string; durationDays: number; emoji: string; color: string }) => void;
  completeOnboarding: (habitName: string, habitEmoji: string, challengePresetId: string | null) => void;
  getCompletedToday: () => number;
};

const KEY = 'habit_store_v2';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function defaultStore(): Store {
  return { habits: [], challenges: [], hasOnboarded: false, lastResetDate: todayStr() };
}

function applyDailyReset(saved: Store): Store {
  const today = todayStr();
  if (saved.lastResetDate === today) return saved;

  const yesterday = saved.lastResetDate;
  const updatedChallenges = saved.challenges.map((c) => {
    if (c.completedAt) return c;
    if (c.lastCheckedDate === yesterday) return c;
    const allDone = saved.habits.every((h) => h.completedCount >= h.targetCount);
    const newDays = allDone ? c.daysCompleted + 1 : c.daysCompleted;
    const completed = newDays >= c.durationDays ? Date.now() : undefined;
    return { ...c, daysCompleted: newDays, completedAt: completed, lastCheckedDate: yesterday };
  });
  const updatedHabits = saved.habits.map((h) => ({
    ...h,
    streak: h.completedCount >= h.targetCount ? h.streak : 0,
    completedCount: 0,
  }));
  return { ...saved, habits: updatedHabits, challenges: updatedChallenges, lastResetDate: today };
}

const Ctx = createContext<StoreCtx>(null!);

export function StoreProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [store, setStore] = useState<Store>(defaultStore());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const saveRef = useRef(false);

  // Phase 1: load cache immediately; Phase 2: sync from Supabase in background
  useEffect(() => {
    const init = async () => {
      // ── Phase 1: cache (instant) ────────────────────────────────────────
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        try {
          const parsed: Store = JSON.parse(raw);
          const reset = applyDailyReset(parsed);
          setStore(reset);
          if (reset !== parsed) AsyncStorage.setItem(KEY, JSON.stringify(reset));
        } catch {
          setStore(defaultStore());
        }
      }
      setLoading(false);

      // ── Phase 2: Supabase (background) ──────────────────────────────────
      try {
        setSyncing(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const remote = await fetchRemoteStore(user.id);
        if (!remote) return;

        // Remote is source of truth; apply daily reset then update
        const reset = applyDailyReset(remote);
        setStore(reset);
        AsyncStorage.setItem(KEY, JSON.stringify(reset));
      } catch {
        // Network unavailable — cache is sufficient
      } finally {
        setSyncing(false);
      }
    };

    init();
  }, []);

  // Persist to AsyncStorage on every store change; push to Supabase in background
  useEffect(() => {
    if (loading) return;
    if (!saveRef.current) { saveRef.current = true; return; }

    AsyncStorage.setItem(KEY, JSON.stringify(store));

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      upsertUserState(user.id, store.hasOnboarded, store.lastResetDate).catch(() => {});
    });
  }, [store, loading]);

  // React to auth events: populate on sign-in, clear on sign-out
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          setSyncing(true);
          const remote = await fetchRemoteStore(session.user.id);
          if (remote) {
            const reset = applyDailyReset(remote);
            setStore(reset);
            AsyncStorage.setItem(KEY, JSON.stringify(reset));
          }
        } catch {} finally {
          setSyncing(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setStore(defaultStore());
        AsyncStorage.removeItem(KEY);
        saveRef.current = false;
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const addHabit = useCallback((h: Omit<Habit, 'id' | 'completedCount' | 'streak' | 'createdAt'>) => {
    const newHabit: Habit = { ...h, id: Date.now().toString(), completedCount: 0, streak: 0, createdAt: Date.now() };
    setStore((prev) => ({ ...prev, habits: [...prev.habits, newHabit] }));
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) upsertHabit(newHabit, user.id).catch(() => {});
    });
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setStore((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== id) }));
    removeHabit(id).catch(() => {});
  }, []);

  const incrementHabit = useCallback((id: string): 'incremented' | 'completed' | 'already_done' => {
    let result: 'incremented' | 'completed' | 'already_done' = 'incremented';
    let updatedHabit: Habit | null = null;

    setStore((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== id) return h;
        if (h.completedCount >= h.targetCount) { result = 'already_done'; return h; }
        const next = h.completedCount + 1;
        if (next >= h.targetCount) result = 'completed';
        updatedHabit = { ...h, completedCount: next, streak: next >= h.targetCount ? h.streak + 1 : h.streak };
        return updatedHabit;
      }),
    }));

    if (updatedHabit) {
      const habit = updatedHabit;
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) upsertHabit(habit, user.id).catch(() => {});
      });
    }

    return result;
  }, []);

  const joinChallenge = useCallback((preset: { id: string; title: string; description: string; durationDays: number; emoji: string; color: string }) => {
    setStore((prev) => {
      if (prev.challenges.some((c) => c.presetId === preset.id && !c.completedAt)) return prev;
      const c: ActiveChallenge = {
        id: Date.now().toString(),
        presetId: preset.id,
        title: preset.title,
        description: preset.description,
        durationDays: preset.durationDays,
        emoji: preset.emoji,
        color: preset.color,
        startedAt: Date.now(),
        daysCompleted: 0,
        lastCheckedDate: todayStr(),
      };
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) upsertChallenge(c, user.id).catch(() => {});
      });
      return { ...prev, challenges: [...prev.challenges, c] };
    });
  }, []);

  const completeOnboarding = useCallback((habitName: string, habitEmoji: string, challengePresetId: string | null) => {
    setStore((prev) => {
      const habit: Habit = {
        id: Date.now().toString(),
        name: habitName,
        emoji: habitEmoji,
        color: '#4F46E5',
        type: 'daily',
        targetCount: 1,
        completedCount: 0,
        streak: 0,
        createdAt: Date.now(),
      };
      let challenges = prev.challenges;
      if (challengePresetId) {
        const { PRESET_CHALLENGES } = require('../constants/theme');
        const preset = PRESET_CHALLENGES.find((p: { id: string }) => p.id === challengePresetId);
        if (preset) {
          const c: ActiveChallenge = {
            id: (Date.now() + 1).toString(),
            presetId: preset.id,
            title: preset.title,
            description: preset.description,
            durationDays: preset.durationDays,
            emoji: preset.emoji,
            color: preset.color,
            startedAt: Date.now(),
            daysCompleted: 0,
            lastCheckedDate: todayStr(),
          };
          challenges = [...challenges, c];
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) upsertChallenge(c, user.id).catch(() => {});
          });
        }
      }
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          upsertHabit(habit, user.id).catch(() => {});
          upsertUserState(user.id, true, todayStr()).catch(() => {});
        }
      });
      return { ...prev, habits: [habit], challenges, hasOnboarded: true };
    });
  }, []);

  const getCompletedToday = useCallback(() => {
    return store.habits.filter((h) => h.completedCount >= h.targetCount).length;
  }, [store.habits]);

  const value = { ...store, loading, syncing, addHabit, deleteHabit, incrementHabit, joinChallenge, completeOnboarding, getCompletedToday };
  return React.createElement(Ctx.Provider, { value }, children);
}

export function useStore() {
  return useContext(Ctx);
}
