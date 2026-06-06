export const PRIMARY = '#4F46E5';
export const BG = '#F4F4F8';
export const CARD = '#FFFFFF';
export const TEXT = '#1A1A2E';
export const MUTED = '#888';
export const BORDER = '#E8E8F0';

export const HABIT_COLORS = [
  '#4F46E5', // indigo
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#14B8A6', // teal
];

export const HABIT_EMOJIS = [
  '💪', '📚', '💧', '🧘', '🏃', '🎯',
  '✍️', '🌱', '🎵', '🍎', '😴', '🧠',
  '🚴', '🏋️', '🥗', '☀️', '🧹', '💊',
];

export const PRESET_CHALLENGES = [
  {
    id: 'kickstart-3',
    title: '3-Day Kickstart',
    description: 'Prove to yourself you can do 3 days straight.',
    durationDays: 3,
    emoji: '🚀',
    color: '#10B981',
  },
  {
    id: 'week-7',
    title: '7-Day Streak',
    description: 'One full week of showing up every day.',
    durationDays: 7,
    emoji: '🔥',
    color: '#F59E0B',
  },
  {
    id: 'transform-30',
    title: '30-Day Transform',
    description: 'Science says 30 days rewires the brain.',
    durationDays: 30,
    emoji: '⚡',
    color: '#8B5CF6',
  },
] as const;
