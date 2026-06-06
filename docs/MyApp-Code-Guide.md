---
title: MyApp — Habit Tracker Code Guide
pdf_options:
  format: A4
  margin: 40px 50px
  printBackground: true
stylesheet: https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.1/github-markdown.min.css
body_class: markdown-body
css: |-
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; line-height: 1.7; color: #24292f; }
  h1 { font-size: 26px; border-bottom: 3px solid #4F46E5; padding-bottom: 10px; margin-top: 40px; color: #1A1A2E; }
  h2 { font-size: 18px; color: #4F46E5; margin-top: 32px; border-bottom: 1px solid #e8e8f0; padding-bottom: 6px; }
  h3 { font-size: 14px; color: #374151; margin-top: 20px; }
  code { background: #f4f4f8; padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 12px; color: #4F46E5; }
  pre { background: #1e1e2e; color: #cdd6f4; padding: 16px; border-radius: 10px; overflow-x: auto; font-size: 11.5px; line-height: 1.6; }
  pre code { background: none; color: inherit; padding: 0; font-size: inherit; }
  .page-break { page-break-after: always; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
  th { background: #4F46E5; color: white; padding: 8px 12px; text-align: left; }
  td { padding: 7px 12px; border-bottom: 1px solid #e8e8f0; }
  tr:nth-child(even) td { background: #f8f8ff; }
  blockquote { border-left: 4px solid #4F46E5; margin: 0; padding: 8px 16px; background: #f0efff; border-radius: 0 8px 8px 0; color: #374151; }
---

# MyApp — Habit Tracker
## Complete Code Guide

> **Stack:** React Native · Expo 54 · Expo Router 6 · TypeScript 5  
> **Platform:** iOS & Android  
> **Generated:** May 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Project Structure](#2-project-structure)
3. [Configuration Files](#3-configuration-files)
   - package.json
   - app.json
   - tsconfig.json
4. [App Entry — `_layout.tsx`](#4-app-entry--_layouttsx)
5. [Home Screen — `index.tsx`](#5-home-screen--indextsx)
   - Imports
   - Type definition
   - Seed data
   - State & derived values
   - Event handlers
   - JSX structure
   - StyleSheet
6. [Constants — `Colors.ts`](#6-constants--colorsts)
7. [Hooks — `useColorScheme.ts`](#7-hooks--usecolorschemets)
8. [Scripts — `reset-project.js`](#8-scripts--reset-projectjs)
9. [How to Run](#9-how-to-run)

<div class="page-break"></div>

---

# 1. Project Overview

MyApp is a **daily habit tracker** built with React Native and Expo. Users can:

- View today's habits in a scrollable card list
- Check off habits to track daily completion
- See a live progress bar showing how many habits are done
- Track per-habit streaks (days in a row completed)
- Add new habits via a bottom-sheet modal
- Delete habits with a long-press confirmation

The app uses **Expo Router** for file-based navigation (similar to Next.js for the web), and all state is managed locally with React's `useState` hook.

---

# 2. Project Structure

```
MyApp/
├── app/                    ← Screens (Expo Router file-based routing)
│   ├── _layout.tsx         ← Root navigator configuration
│   └── index.tsx           ← Home screen (the habit tracker)
├── assets/                 ← App icons, splash screen images
├── components/             ← Shared UI components (empty, ready to use)
├── constants/
│   └── Colors.ts           ← Light/dark colour tokens
├── hooks/
│   └── useColorScheme.ts   ← Re-exports React Native's useColorScheme
├── scripts/
│   └── reset-project.js    ← Dev utility: wipes app/ back to blank state
├── .vscode/
│   └── settings.json       ← Format-on-save, TypeScript SDK path
├── app.json                ← Expo project configuration
├── eslint.config.js        ← ESLint flat-config setup
├── package.json            ← Dependencies and npm scripts
└── tsconfig.json           ← TypeScript compiler options
```

### Why this structure?

| Folder | Purpose |
|---|---|
| `app/` | Every `.tsx` file here becomes a route automatically (Expo Router) |
| `components/` | Reusable UI pieces shared across multiple screens |
| `constants/` | Values that are used app-wide (colours, sizes, API URLs) |
| `hooks/` | Custom React hooks that encapsulate reusable logic |
| `scripts/` | Node.js utility scripts run manually during development |

<div class="page-break"></div>

---

# 3. Configuration Files

## package.json

```json
{
  "name": "myapp",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~54.0.33",
    "expo-constants": "~18.0.13",
    "expo-linking": "~8.0.12",
    "expo-router": "~6.0.23",
    "expo-status-bar": "~3.0.9",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0"
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "typescript": "~5.9.2"
  }
}
```

### Key points

**`"main": "expo-router/entry"`**
This is the most important line. Instead of pointing to your own `index.ts`, it hands control to Expo Router's entry point. Expo Router then reads the `app/` directory and automatically creates a navigator from the file structure.

**Dependencies explained:**

| Package | Why it's needed |
|---|---|
| `expo` | Core Expo SDK — device APIs, build tools |
| `expo-router` | File-based navigation (like Next.js App Router) |
| `expo-status-bar` | Cross-platform control of the iOS/Android status bar |
| `expo-constants` | Access to `app.json` values at runtime |
| `expo-linking` | Deep linking support (required by Expo Router) |
| `react-native-safe-area-context` | Padding for notches and home indicators |
| `react-native-screens` | Native screen components for better performance |

---

## app.json

```json
{
  "expo": {
    "name": "MyApp",
    "slug": "MyApp",
    "scheme": "myapp",
    "version": "1.0.0",
    "orientation": "portrait",
    "newArchEnabled": true,
    "web": {
      "bundler": "metro",
      "favicon": "./assets/favicon.png"
    },
    "plugins": ["expo-router"]
  }
}
```

### Key points

**`"scheme": "myapp"`**
The deep-link URL scheme for the app (e.g. `myapp://home`). Required by Expo Router so links can navigate between screens.

**`"newArchEnabled": true`**
Opts into React Native's New Architecture (Fabric renderer + JSI). This gives better performance but requires all native libraries to support it.

**`"web": { "bundler": "metro" }`**
Uses Metro (React Native's bundler) instead of webpack to bundle the web version. Required by Expo Router.

**`"plugins": ["expo-router"]`**
Tells Expo's build system to apply Expo Router's native configuration (registers the deep-link scheme, etc.) when building the native app.

---

## tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Key points

**`"extends": "expo/tsconfig.base"`**
Inherits Expo's recommended TypeScript settings — JSX mode set to `react-native`, correct module resolution, etc.

**`"strict": true`**
Enables all strict type checks: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, and more. This catches bugs at compile time rather than at runtime.

**`"paths": { "@/*": ["./*"] }`**
Creates an import alias so you can write `import { Colors } from '@/constants/Colors'` instead of `'../../constants/Colors'`. The `@/` prefix always refers to the project root.

<div class="page-break"></div>

---

# 4. App Entry — `_layout.tsx`

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
```

### How Expo Router works

In Expo Router, every file inside `app/` becomes a screen. The special file `_layout.tsx` defines the **navigator** that wraps those screens. Think of it like a picture frame — the layout is the frame, the screens are the pictures inside.

### Step by step

**`import { Stack } from 'expo-router'`**
Imports a Stack navigator — screens slide in from the right on iOS, or animate up on Android, just like standard native navigation.

**`export default function RootLayout()`**
This function must be the default export of `_layout.tsx`. Expo Router calls it automatically to render the navigator.

**`<Stack>`**
Renders the stack container. Any `app/*.tsx` files that aren't listed explicitly get default header styles.

**`<Stack.Screen name="index" options={{ headerShown: false }} />`**
Configures the `index.tsx` screen specifically. `headerShown: false` removes the default navigation bar at the top — we draw our own custom header inside `index.tsx` instead.

<div class="page-break"></div>

---

# 5. Home Screen — `index.tsx`

This is the main screen of the app. It contains all the habit tracker logic and UI. We'll break it down section by section.

---

## 5.1 Imports

```tsx
import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Modal, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
```

| Import | Purpose |
|---|---|
| `useState` | React hook for local state (habits list, modal visibility, input text) |
| `View` | The fundamental layout box — like `<div>` in HTML |
| `Text` | Renders text — all text must be wrapped in this in React Native |
| `StyleSheet` | Optimised way to define styles (validated at load time, not render time) |
| `ScrollView` | A scrollable container for the habit list |
| `TouchableOpacity` | A pressable wrapper that fades on press |
| `TextInput` | Text input field for typing a new habit name |
| `Modal` | Renders content on top of everything else (the add-habit sheet) |
| `Alert` | Native OS alert dialog (used for delete confirmation) |
| `Platform` | Detects iOS vs Android to apply platform-specific shadow styles |
| `SafeAreaView` | Automatically adds padding for notches and home indicators |
| `StatusBar` | Controls whether the status bar text is light or dark |

---

## 5.2 Type Definition

```tsx
type Habit = {
  id: string;
  name: string;
  completed: boolean;
  streak: number;
};
```

This TypeScript `type` describes the shape of a single habit object. Every habit in the app must have exactly these four fields.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier — used as React `key` and for targeting mutations |
| `name` | `string` | The habit label shown in the card |
| `completed` | `boolean` | Whether the habit is ticked off for today |
| `streak` | `number` | How many days in a row this habit has been completed |

---

## 5.3 Seed Data

```tsx
const INITIAL_HABITS: Habit[] = [
  { id: '1', name: 'Morning workout',        completed: false, streak: 7  },
  { id: '2', name: 'Read for 30 minutes',    completed: false, streak: 3  },
  { id: '3', name: 'Drink 8 glasses of water', completed: true, streak: 12 },
  { id: '4', name: 'Meditate',               completed: false, streak: 5  },
];
```

Four pre-seeded habits so the screen isn't empty on first launch. This is a module-level constant (outside the component), so it is created once when the module loads, not on every render.

`UPPER_SNAKE_CASE` naming is a convention for constants that never change.

---

## 5.4 State & Derived Values

```tsx
const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
const [modalVisible, setModalVisible] = useState(false);
const [newHabitName, setNewHabitName] = useState('');

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric',
});

const completedCount = habits.filter((h) => h.completed).length;
const progress = habits.length > 0 ? completedCount / habits.length : 0;
```

### State variables

| Variable | Initial value | Controls |
|---|---|---|
| `habits` | `INITIAL_HABITS` | The full list of habits — the source of truth |
| `modalVisible` | `false` | Whether the "Add habit" bottom sheet is open |
| `newHabitName` | `''` | The text being typed into the new-habit input |

### Derived values (computed, not stored)

`completedCount` and `progress` are **not** stored in state — they are recalculated from `habits` on every render. This is intentional: storing computed values separately creates the risk of them going out of sync.

`progress` is a number between `0` and `1`. Multiplied by `100` it becomes a percentage. The guard `habits.length > 0` prevents a division-by-zero if the user deletes all habits.

---

## 5.5 Event Handlers

### `toggleHabit`

```tsx
function toggleHabit(id: string) {
  setHabits((prev) =>
    prev.map((h) => {
      if (h.id !== id) return h;
      const completing = !h.completed;
      return {
        ...h,
        completed: completing,
        streak: completing ? h.streak + 1 : Math.max(0, h.streak - 1),
      };
    })
  );
}
```

Called when the user taps a habit card.

- `prev.map(...)` creates a **new array** — we never mutate state directly in React.
- `if (h.id !== id) return h` — all other habits pass through unchanged.
- `...h` spreads the existing fields, then we override only `completed` and `streak`.
- When completing: streak increments by 1.
- When un-completing: streak decrements but never goes below 0 (`Math.max(0, ...)`).
- The functional form `setHabits((prev) => ...)` is used instead of `setHabits(habits.map(...))` to avoid stale closures.

### `addHabit`

```tsx
function addHabit() {
  const name = newHabitName.trim();
  if (!name) return;
  setHabits((prev) => [
    ...prev,
    { id: Date.now().toString(), name, completed: false, streak: 0 },
  ]);
  setNewHabitName('');
  setModalVisible(false);
}
```

Called when the user confirms the modal.

- `.trim()` removes accidental leading/trailing spaces.
- `if (!name) return` guards against empty submissions.
- `Date.now().toString()` generates a unique ID from the current timestamp in milliseconds.
- `[...prev, newHabit]` appends to the end of the list without mutating.
- After adding, the input is cleared and the modal closes.

### `deleteHabit`

```tsx
function deleteHabit(id: string) {
  Alert.alert('Delete Habit', 'Remove this habit?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () => setHabits((prev) => prev.filter((h) => h.id !== id)),
    },
  ]);
}
```

Called on long-press of a habit card.

- `Alert.alert` renders a native OS dialog — it looks like a real system alert on both iOS and Android.
- `style: 'destructive'` renders the "Delete" button in red on iOS.
- `prev.filter((h) => h.id !== id)` returns a new array with the target habit removed.

<div class="page-break"></div>

---

## 5.6 JSX Structure

The component returns a tree of UI elements. Here is the high-level structure:

```
SafeAreaView (full screen, avoids notch)
├── StatusBar (dark text in system bar)
├── View [header]
│   ├── Text — date string
│   ├── Text — "My Habits" title
│   ├── View [progressRow] — "X/Y done" + percentage
│   └── View [progressTrack] — animated progress bar
├── ScrollView [habit list]
│   ├── (empty state message — shown if habits.length === 0)
│   ├── TouchableOpacity [card] × N (one per habit)
│   │   ├── View [checkbox]
│   │   │   └── Text "✓" (only when completed)
│   │   └── View [cardBody]
│   │       ├── Text — habit name
│   │       └── Text — "🔥 N day streak"
│   └── Text — long-press hint
├── TouchableOpacity [FAB] — "+" button
└── Modal [add habit sheet]
    └── View [overlay]
        └── View [modal]
            ├── Text — "New Habit" title
            ├── TextInput — habit name field
            └── View [modalButtons]
                ├── TouchableOpacity — Cancel
                └── TouchableOpacity — Add
```

### Progress bar technique

```tsx
<View style={styles.progressTrack}>
  <View style={[styles.progressFill, { flex: completedCount }]} />
  <View style={{ flex: habits.length - completedCount }} />
</View>
```

Instead of using percentage widths, this uses **flex ratios**. If 3 out of 5 habits are done, the filled portion gets `flex: 3` and the empty portion gets `flex: 2`. React Native distributes the available width proportionally. This avoids TypeScript issues with string percentage values.

### Conditional styles

```tsx
style={[styles.card, habit.completed && styles.cardDone]}
```

React Native's `style` prop accepts an **array of style objects**. When `habit.completed` is `false`, the expression `habit.completed && styles.cardDone` evaluates to `false`, which React Native ignores. When `true`, `cardDone` is merged on top of `card`.

<div class="page-break"></div>

---

## 5.7 StyleSheet

```tsx
const PRIMARY = '#4F46E5';   // Indigo-600
const BG = '#F4F4F8';        // Near-white with a slight blue tint
```

Two module-level colour constants drive the whole theme. Changing `PRIMARY` here updates every button, checkbox, progress bar, and accent in the app.

### Why `StyleSheet.create()` instead of plain objects?

```tsx
const styles = StyleSheet.create({ ... });
```

`StyleSheet.create` validates style properties at load time (so typos like `backgrondColor` throw immediately rather than silently doing nothing). It also sends the styles to the native layer once and references them by ID, avoiding repeated object serialisation on every render.

### Cross-platform shadows

```tsx
...Platform.select({
  ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 4 },
}),
```

iOS and Android use completely different shadow systems. `Platform.select` returns the right object for the current platform at runtime, and the spread operator merges it into the style. On the web, both are ignored gracefully.

### FAB (Floating Action Button)

```tsx
fab: {
  position: 'absolute',
  bottom: 32,
  right: 24,
  width: 58,
  height: 58,
  borderRadius: 29,   // exactly half of width/height = perfect circle
  backgroundColor: PRIMARY,
}
```

`position: 'absolute'` pulls the FAB out of the normal layout flow and pins it to the bottom-right corner of the `SafeAreaView`. `borderRadius: 29` (half of `58`) makes it a perfect circle.

<div class="page-break"></div>

---

# 6. Constants — `Colors.ts`

```ts
const tintColorLight = '#0a7ea4';
const tintColorDark  = '#fff';

export const Colors = {
  light: {
    text:           '#11181C',
    background:     '#fff',
    tint:           tintColorLight,
    icon:           '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text:           '#ECEDEE',
    background:     '#151718',
    tint:           tintColorDark,
    icon:           '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
```

### Purpose

This file is a centralised colour palette for both light and dark themes. Defining colours here (rather than scattering hex values across components) means you can:

- Change a colour app-wide by editing one line
- Ensure consistent values between components
- Easily support dark mode by switching between `Colors.light` and `Colors.dark`

### Usage pattern

```tsx
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const scheme = useColorScheme(); // 'light' | 'dark'
const colors = Colors[scheme ?? 'light'];

// Then use: colors.text, colors.background, etc.
```

---

# 7. Hooks — `useColorScheme.ts`

```ts
export { useColorScheme } from 'react-native';
```

### Why is this a one-liner?

This file re-exports React Native's built-in `useColorScheme` hook unchanged. The reason it exists as a separate file is **extensibility**: if you later want to override the system theme (e.g. let users manually pick dark mode), you only need to change this one file. All components importing from `@/hooks/useColorScheme` automatically get the new behaviour without touching any of them.

### What `useColorScheme` does

It returns `'light'`, `'dark'`, or `null` depending on the device's system appearance setting. It re-renders any component that uses it whenever the system theme changes.

---

# 8. Scripts — `reset-project.js`

```js
const fs   = require('fs');
const path = require('path');

const appDir    = path.join(__dirname, '..', 'app');
const indexFile = path.join(appDir, 'index.tsx');
const layoutFile = path.join(appDir, '_layout.tsx');

// Delete every file in app/
fs.readdirSync(appDir).forEach((file) => {
  fs.rmSync(path.join(appDir, file), { recursive: true, force: true });
});

// Re-write a blank index and layout
fs.writeFileSync(indexFile,  indexContent);
fs.writeFileSync(layoutFile, layoutContent);

console.log('Project reset to blank state.');
```

### Purpose

This is a **developer utility script** — it is never shipped to users. Run it when you want to wipe the `app/` directory back to a minimal blank state (useful when starting a new feature branch or demo from scratch).

### How to run it

```bash
node scripts/reset-project.js
```

### Key Node.js APIs used

| API | What it does |
|---|---|
| `path.join(__dirname, '..', 'app')` | Resolves the `app/` folder relative to the script's own location |
| `fs.readdirSync(appDir)` | Lists all files/folders in `app/` synchronously |
| `fs.rmSync(..., { recursive: true, force: true })` | Deletes a file or folder, including its contents |
| `fs.writeFileSync(file, content)` | Writes a string to a file, creating it if needed |

<div class="page-break"></div>

---

# 9. How to Run

## Start the development server

```bash
cd "Example Project/MyApp"
npx expo start
```

A QR code appears in the terminal.

## Test on your phone

1. Install **Expo Go** from the App Store (iOS) or Play Store (Android)
2. Make sure your phone and computer are on the **same Wi-Fi network**
3. Scan the QR code with:
   - **iOS** — the system Camera app
   - **Android** — the Expo Go app's built-in scanner

## Key commands in the Expo dev server

| Key | Action |
|---|---|
| `a` | Open Android emulator |
| `w` | Open in web browser |
| `r` | Reload the app |
| `j` | Open the JavaScript debugger |
| `Ctrl + C` | Stop the server |

## Build for production

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
eas login

# Configure builds
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS (requires Apple Developer account)
eas build --platform ios
```

---

*End of guide — MyApp Habit Tracker*
