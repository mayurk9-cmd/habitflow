-- HabitFlow AI schema addition
-- Run this in Supabase: SQL Editor → New query → paste → Run

-- ─── ai_insights ──────────────────────────────────────────────────────────
-- Stores Claude-generated coaching messages and weekly summaries
create table if not exists public.ai_insights (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  type        text        not null check (type in ('coaching', 'weekly_summary', 'monthly_summary')),
  content     text        not null,
  model       text        not null default 'claude-sonnet-4-6',
  created_at  timestamptz not null default now()
);

alter table public.ai_insights enable row level security;

create policy "users_own_insights" on public.ai_insights
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index so fetching the latest insight is fast
create index if not exists ai_insights_user_type_created
  on public.ai_insights (user_id, type, created_at desc);
