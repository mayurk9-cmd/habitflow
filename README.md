# HabitFlow

A React Native habit tracker built with Expo. Track daily habits, build streaks, and complete challenges — with haptic feedback, a programmatically generated chime sound, and daily push notification reminders.

## Features

- **Two habit types** — *Daily* (check off once) and *Volume* (tap N times, e.g. "Drink water 4×")
- **Streak tracking** — streaks increment on completion and break on a missed day (auto-reset at midnight)
- **Challenges** — join 3-day, 7-day, or 30-day challenges; completion triggers a celebration
- **Onboarding** — 3-slide first-launch flow: intro → pick a challenge → create first habit
- **Reward loop** — scale-bounce animation + haptic feedback + bell chime on every completion
- **Daily notifications** — 9 AM and 7 PM local reminders
- **Persistent state** — AsyncStorage-backed store with daily reset logic

## Screens

| Screen | Route |
|---|---|
| Today | `app/(tabs)/index.tsx` |
| Challenges | `app/(tabs)/challenges.tsx` |
| Stats & Achievements | `app/(tabs)/stats.tsx` |
| Add Habit | `app/add-habit.tsx` (modal) |
| Onboarding | `app/onboarding.tsx` (first launch) |

## Getting started

```bash
npm install
npm start        # press w for web, a for Android, i for iOS
npm run web      # web directly
```

> Web requires `react-dom` + `react-native-web` (in `package.json`). If reinstalling use `--legacy-peer-deps`.

## Tech stack

- [Expo](https://expo.dev) SDK 54 · React Native 0.81 · React 19
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- expo-haptics · expo-av · expo-notifications · expo-linear-gradient
- AsyncStorage · TypeScript strict · React Native `Animated` API

## Reset to blank scaffold

```bash
node scripts/reset-project.js
```
