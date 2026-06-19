# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Expo versioning

Before writing any code, read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ — Expo APIs change significantly between versions, and this project uses **Expo 54**.

## Commands

```bash
npm start          # Start dev server (Expo Go, web, emulators)
npm run android    # Start targeting Android emulator
npm run ios        # Start targeting iOS simulator
npm run web        # Start targeting web browser
```

Press `a` / `w` / `i` in the terminal to switch targets after `npm start`.

Web requires `react-dom` and `react-native-web` (already in `package.json`). If they go missing, `npm run web` will error asking you to install them with `--legacy-peer-deps`.

No test runner is configured. ESLint is in [eslint.config.js](eslint.config.js).

## Architecture

React Native + Expo habit tracker with Expo Router (file-based routing). New Architecture enabled (`newArchEnabled: true`).

### Screens (5 surfaces)

| Route | Surface |
|---|---|
| `app/onboarding.tsx` | Full-screen modal, shown once on first launch |
| `app/(tabs)/index.tsx` | Home — today's habits, animated progress bar |
| `app/(tabs)/challenges.tsx` | Active + available challenges |
| `app/(tabs)/stats.tsx` | Streak stats, achievements, per-habit bars |
| `app/add-habit.tsx` | Modal — create habit (type, emoji, color, frequency) |

### State (`hooks/useStore.ts`)

> **Gotcha**: `useStore.ts` is a `.ts` file (not `.tsx`), so it cannot contain JSX. The `StoreProvider` return uses `React.createElement(Ctx.Provider, { value }, children)` instead of `<Ctx.Provider>`. Don't convert it to JSX without renaming the file to `.tsx` first.

Single React Context (`StoreProvider`) backed by AsyncStorage (key: `habit_store_v2`). Wrap access with `useStore()`. On app open, if `lastResetDate !== today`, the store performs a **daily reset**: breaks streaks for incomplete habits, advances challenge `daysCompleted`, resets all `completedCount` to 0.

### Data model

```ts
type Habit = {
  id: string; name: string; emoji: string; color: string;
  type: 'daily' | 'volume';
  targetCount: number;   // 1 for daily, N for volume
  completedCount: number; // resets daily
  streak: number;
  createdAt: number;
};

type ActiveChallenge = {
  id: string; presetId: string; title: string; durationDays: number;
  daysCompleted: number; startedAt: number; completedAt?: number;
  // ...
};
```

`incrementHabit(id)` returns `'incremented' | 'completed' | 'already_done'` — callers use this to trigger haptics/sound conditionally.

### Utilities

- **`utils/haptics.ts`** — `hapticTap`, `hapticComplete`, `hapticCelebrate`, `hapticHeavy`
- **`utils/sound.ts`** — `initSound()` (call once at app start), `playChime()`. Programmatically generates a 880+1320 Hz bell WAV and writes to `FileSystem.cacheDirectory` on first run.
- **`utils/notifications.ts`** — `scheduleDailyReminders()` schedules 9 AM + 7 PM local notifications.

### Styling

`expo-linear-gradient` for headers and FAB. Each habit card has its own `color` accent from `constants/theme.ts#HABIT_COLORS`. All animations use React Native's built-in `Animated` API (no Reanimated — no babel plugin needed). Primary gradient: `['#4F46E5', '#7C3AED']`.

### Constants

`constants/theme.ts` exports: `HABIT_COLORS` (8 swatches), `HABIT_EMOJIS` (18 options), `PRESET_CHALLENGES` (3-day, 7-day, 30-day).

### Supabase + auth

**Credentials**: stored in `.env` (gitignored). Copy `.env.example` → `.env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Expo picks up `EXPO_PUBLIC_*` vars at build time.

**Database schema**: `supabase/schema.sql` — run once in Supabase SQL Editor. Three tables: `habits`, `challenges`, `user_state`, all with RLS policies scoped to `auth.uid()`.

**Auth flow** (`hooks/useAuth.ts` + `app/auth.tsx`): email/password via `@supabase/supabase-js`. Session persisted in `expo-secure-store` (native) or AsyncStorage (web) via a custom storage adapter in `lib/supabase.ts`. `_layout.tsx` routes: no session → `/auth`, session + not onboarded → `/onboarding`, otherwise → `/(tabs)`.

**Sync strategy** (`lib/db.ts` + `hooks/useStore.ts`):
- **Cache-first reads**: AsyncStorage loads instantly on open → Supabase syncs in background → state updates silently (`syncing` flag exposed from `useStore`).
- **Optimistic writes**: every action (addHabit, incrementHabit, etc.) writes to AsyncStorage + local state immediately, then fires a background upsert to Supabase. Failures are silently swallowed — next sync recovers.
- **Auth events**: `SIGNED_IN` triggers a full pull from Supabase into cache; `SIGNED_OUT` clears both.
- Supabase is source of truth; local cache is a speed layer.

### Claude Code plugin

`.claude/settings.json` enables the official Expo plugin (`expo@claude-plugins-official`).
