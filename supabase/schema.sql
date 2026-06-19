-- HabitFlow schema
-- Run this in Supabase: SQL Editor → New query → paste → Run

-- ─── habits ───────────────────────────────────────────────────────────────
create table if not exists public.habits (
  id               text      primary key,
  user_id          uuid      references auth.users(id) on delete cascade not null,
  name             text      not null,
  emoji            text      not null default '💪',
  color            text      not null default '#4F46E5',
  type             text      not null check (type in ('daily', 'volume')),
  target_count     integer   not null default 1,
  completed_count  integer   not null default 0,
  streak           integer   not null default 0,
  created_at       bigint    not null,
  updated_at       timestamptz not null default now()
);

alter table public.habits enable row level security;

create policy "users_own_habits" on public.habits
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── challenges ───────────────────────────────────────────────────────────
create table if not exists public.challenges (
  id                 text      primary key,
  user_id            uuid      references auth.users(id) on delete cascade not null,
  preset_id          text      not null,
  title              text      not null,
  description        text      not null default '',
  duration_days      integer   not null,
  emoji              text      not null default '🎯',
  color              text      not null default '#4F46E5',
  started_at         bigint    not null,
  completed_at       bigint,
  days_completed     integer   not null default 0,
  last_checked_date  text      not null default '',
  updated_at         timestamptz not null default now()
);

alter table public.challenges enable row level security;

create policy "users_own_challenges" on public.challenges
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── user_state ───────────────────────────────────────────────────────────
create table if not exists public.user_state (
  user_id          uuid    references auth.users(id) on delete cascade primary key,
  last_reset_date  text    not null default '',
  has_onboarded    boolean not null default false,
  updated_at       timestamptz not null default now()
);

alter table public.user_state enable row level security;

create policy "users_own_state" on public.user_state
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
