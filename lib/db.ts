import { supabase } from './supabase';
import type { Habit, ActiveChallenge } from '../hooks/useStore';

// ─── type shapes that match the DB columns ─────────────────────────────────

type DbHabit = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  type: 'daily' | 'volume';
  target_count: number;
  completed_count: number;
  streak: number;
  created_at: number;
};

type DbChallenge = {
  id: string;
  user_id: string;
  preset_id: string;
  title: string;
  description: string;
  duration_days: number;
  emoji: string;
  color: string;
  started_at: number;
  completed_at: number | null;
  days_completed: number;
  last_checked_date: string;
};


// ─── mapping helpers ───────────────────────────────────────────────────────

function habitToDb(h: Habit, userId: string): DbHabit {
  return {
    id: h.id,
    user_id: userId,
    name: h.name,
    emoji: h.emoji,
    color: h.color,
    type: h.type,
    target_count: h.targetCount,
    completed_count: h.completedCount,
    streak: h.streak,
    created_at: h.createdAt,
  };
}

function habitFromDb(h: DbHabit): Habit {
  return {
    id: h.id,
    name: h.name,
    emoji: h.emoji,
    color: h.color,
    type: h.type,
    targetCount: h.target_count,
    completedCount: h.completed_count,
    streak: h.streak,
    createdAt: h.created_at,
  };
}

function challengeToDb(c: ActiveChallenge, userId: string): DbChallenge {
  return {
    id: c.id,
    user_id: userId,
    preset_id: c.presetId,
    title: c.title,
    description: c.description,
    duration_days: c.durationDays,
    emoji: c.emoji,
    color: c.color,
    started_at: c.startedAt,
    completed_at: c.completedAt ?? null,
    days_completed: c.daysCompleted,
    last_checked_date: c.lastCheckedDate,
  };
}

function challengeFromDb(c: DbChallenge): ActiveChallenge {
  return {
    id: c.id,
    presetId: c.preset_id,
    title: c.title,
    description: c.description,
    durationDays: c.duration_days,
    emoji: c.emoji,
    color: c.color,
    startedAt: c.started_at,
    completedAt: c.completed_at ?? undefined,
    daysCompleted: c.days_completed,
    lastCheckedDate: c.last_checked_date,
  };
}

// ─── public API ───────────────────────────────────────────────────────────

export type RemoteStore = {
  habits: Habit[];
  challenges: ActiveChallenge[];
  hasOnboarded: boolean;
  lastResetDate: string;
};

/** Pull all user data from Supabase. Returns null on error. */
export async function fetchRemoteStore(userId: string): Promise<RemoteStore | null> {
  const [habitsRes, challengesRes, stateRes] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', userId),
    supabase.from('challenges').select('*').eq('user_id', userId),
    supabase.from('user_state').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  if (habitsRes.error || challengesRes.error) return null;

  return {
    habits: (habitsRes.data as DbHabit[]).map(habitFromDb),
    challenges: (challengesRes.data as DbChallenge[]).map(challengeFromDb),
    hasOnboarded: stateRes.data?.has_onboarded ?? false,
    lastResetDate: stateRes.data?.last_reset_date ?? '',
  };
}

/** Push full local store to Supabase (upsert everything). Fire-and-forget. */
export async function pushRemoteStore(
  userId: string,
  habits: Habit[],
  challenges: ActiveChallenge[],
  hasOnboarded: boolean,
  lastResetDate: string,
) {
  await Promise.all([
    habits.length > 0
      ? supabase.from('habits').upsert(habits.map((h) => habitToDb(h, userId)))
      : Promise.resolve(),
    challenges.length > 0
      ? supabase.from('challenges').upsert(challenges.map((c) => challengeToDb(c, userId)))
      : Promise.resolve(),
    supabase.from('user_state').upsert({ user_id: userId, has_onboarded: hasOnboarded, last_reset_date: lastResetDate }),
  ]);
}

/** Upsert a single habit. */
export async function upsertHabit(habit: Habit, userId: string) {
  await supabase.from('habits').upsert(habitToDb(habit, userId));
}

/** Delete a single habit. */
export async function removeHabit(id: string) {
  await supabase.from('habits').delete().eq('id', id);
}

/** Upsert a single challenge. */
export async function upsertChallenge(challenge: ActiveChallenge, userId: string) {
  await supabase.from('challenges').upsert(challengeToDb(challenge, userId));
}

/** Update user_state row. */
export async function upsertUserState(
  userId: string,
  hasOnboarded: boolean,
  lastResetDate: string,
) {
  await supabase
    .from('user_state')
    .upsert({ user_id: userId, has_onboarded: hasOnboarded, last_reset_date: lastResetDate });
}

// ─── AI insights ───────────────────────────────────────────────────────────

export type AiInsight = {
  id: string;
  type: 'coaching' | 'weekly_summary' | 'monthly_summary';
  content: string;
  model: string;
  created_at: string;
};

/** Fetch the most recent insight of a given type for the current user. */
export async function fetchLatestInsight(type: AiInsight['type']): Promise<AiInsight | null> {
  const { data, error } = await supabase
    .from('ai_insights')
    .select('id, type, content, model, created_at')
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data as AiInsight | null;
}

/** Invoke the coach-insight edge function. */
export async function generateCoachInsight(): Promise<{ insight?: string; error?: string; cooldown?: boolean }> {
  const { data, error } = await supabase.functions.invoke('coach-insight', { method: 'POST' });
  if (error) return { error: error.message };
  return data as { insight?: string; error?: string; cooldown?: boolean };
}

/** Invoke the weekly-summary edge function. */
export async function generateWeeklySummary(period: 'weekly' | 'monthly' = 'weekly'): Promise<{ summary?: string; error?: string; cooldown?: boolean }> {
  const { data, error } = await supabase.functions.invoke('weekly-summary', {
    method: 'POST',
    body: { period },
  });
  if (error) return { error: error.message };
  return data as { summary?: string; error?: string; cooldown?: boolean };
}
