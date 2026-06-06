import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const Ctx = createContext<StoreCtx>(null!);

export function StoreProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [store, setStore] = useState<Store>(defaultStore());
  const [loading, setLoading] = useState(true);
  const saveRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          const saved: Store = JSON.parse(raw);
          const today = todayStr();
          // Daily reset logic
          if (saved.lastResetDate !== today) {
            const yesterday = saved.lastResetDate;
            // Update challenge progress before resetting habits
            const updatedChallenges = saved.challenges.map((c) => {
              if (c.completedAt) return c;
              if (c.lastCheckedDate === yesterday) return c; // already counted yesterday
              // Check if all associated habits were completed yesterday
              const allDone = saved.habits.every((h) => h.completedCount >= h.targetCount);
              const newDays = allDone ? c.daysCompleted + 1 : c.daysCompleted;
              const completed = newDays >= c.durationDays ? Date.now() : undefined;
              return { ...c, daysCompleted: newDays, completedAt: completed, lastCheckedDate: yesterday };
            });
            // Reset each habit; if it wasn't completed, break streak
            const updatedHabits = saved.habits.map((h) => ({
              ...h,
              streak: h.completedCount >= h.targetCount ? h.streak : 0,
              completedCount: 0,
            }));
            const next = { ...saved, habits: updatedHabits, challenges: updatedChallenges, lastResetDate: today };
            setStore(next);
            AsyncStorage.setItem(KEY, JSON.stringify(next));
          } else {
            setStore(saved);
          }
        } catch {
          setStore(defaultStore());
        }
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading) {
      if (saveRef.current) {
        AsyncStorage.setItem(KEY, JSON.stringify(store));
      } else {
        saveRef.current = true;
      }
    }
  }, [store, loading]);

  const addHabit = useCallback((h: Omit<Habit, 'id' | 'completedCount' | 'streak' | 'createdAt'>) => {
    setStore((prev) => ({
      ...prev,
      habits: [...prev.habits, { ...h, id: Date.now().toString(), completedCount: 0, streak: 0, createdAt: Date.now() }],
    }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setStore((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== id) }));
  }, []);

  const incrementHabit = useCallback((id: string): 'incremented' | 'completed' | 'already_done' => {
    let result: 'incremented' | 'completed' | 'already_done' = 'incremented';
    setStore((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== id) return h;
        if (h.completedCount >= h.targetCount) { result = 'already_done'; return h; }
        const next = h.completedCount + 1;
        if (next >= h.targetCount) { result = 'completed'; }
        return { ...h, completedCount: next, streak: next >= h.targetCount ? h.streak + 1 : h.streak };
      }),
    }));
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
          challenges = [...challenges, {
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
          }];
        }
      }
      return { ...prev, habits: [habit], challenges, hasOnboarded: true };
    });
  }, []);

  const getCompletedToday = useCallback(() => {
    return store.habits.filter((h) => h.completedCount >= h.targetCount).length;
  }, [store.habits]);

  const value = { ...store, loading, addHabit, deleteHabit, incrementHabit, joinChallenge, completeOnboarding, getCompletedToday };
  return React.createElement(Ctx.Provider, { value }, children);
}

export function useStore() {
  return useContext(Ctx);
}
