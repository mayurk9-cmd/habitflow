import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';
import { corsHeaders, corsResponse, jsonResponse } from '../_shared/cors.ts';

const COOLDOWN_HOURS = 12;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401);

    const { period = 'weekly' } = req.method === 'POST'
      ? await req.json().catch(() => ({}))
      : {};

    // ── Auth ─────────────────────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const type = period === 'monthly' ? 'monthly_summary' : 'weekly_summary';

    // ── Rate limit ───────────────────────────────────────────────────────────
    const { data: recent } = await supabase
      .from('ai_insights')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent) {
      const ageHrs = (Date.now() - new Date(recent.created_at).getTime()) / 3600000;
      if (ageHrs < COOLDOWN_HOURS) {
        return jsonResponse({
          error: `Summary generated recently. Next available in ${Math.ceil(COOLDOWN_HOURS - ageHrs)}h.`,
          cooldown: true,
        }, 429);
      }
    }

    // ── Fetch data ───────────────────────────────────────────────────────────
    const [{ data: habits }, { data: challenges }] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('challenges').select('*').eq('user_id', user.id),
    ]);

    if (!habits || habits.length === 0) {
      return jsonResponse({ error: 'No habits found — add some habits first!' }, 400);
    }

    // ── Build rich data context ──────────────────────────────────────────────
    const periodDays = period === 'monthly' ? 30 : 7;
    const now = Date.now();

    const habitAnalysis = habits.map((h: Record<string, unknown>) => {
      const ageInDays = Math.floor((now - Number(h.created_at)) / 86400000);
      const activeDays = Math.min(ageInDays, periodDays);
      // Estimate completion rate from streak (approximation without daily logs)
      const streak = Number(h.streak);
      const estimatedRate = activeDays > 0 ? Math.min(streak / activeDays, 1) : 0;
      const pct = Math.round(estimatedRate * 100);

      return {
        name: `${h.emoji} ${h.name}`,
        type: h.type,
        streak,
        estimatedCompletionPct: pct,
        targetCount: h.target_count,
        ageInDays,
      };
    });

    const completedChallenges = (challenges ?? []).filter((c: Record<string, unknown>) => c.completed_at);
    const activeChallenges = (challenges ?? []).filter((c: Record<string, unknown>) => !c.completed_at);

    const habitLines = habitAnalysis
      .sort((a, b) => b.estimatedCompletionPct - a.estimatedCompletionPct)
      .map(h =>
        `• ${h.name} (${h.type}): ${h.streak}-day streak, ~${h.estimatedCompletionPct}% consistency, ${h.ageInDays} days old`
      ).join('\n');

    const challLines = [
      ...activeChallenges.map((c: Record<string, unknown>) => `• 🔄 ${c.emoji} ${c.title}: ${c.days_completed}/${c.duration_days} days`),
      ...completedChallenges.map((c: Record<string, unknown>) => `• ✅ ${c.emoji} ${c.title}: COMPLETED`),
    ].join('\n') || '• No challenges yet';

    const overallAvg = Math.round(
      habitAnalysis.reduce((s, h) => s + h.estimatedCompletionPct, 0) / habitAnalysis.length
    );

    // ── Call Claude Sonnet ───────────────────────────────────────────────────
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: [
        {
          type: 'text',
          text: `You are a habit analytics coach writing a ${period} performance summary. Be honest, insightful, and data-driven. Sound like a thoughtful coach reviewing a player's game tape — specific, direct, and constructive.

Format your response with these exact sections (use these headers):
**This ${period === 'monthly' ? 'Month' : 'Week'} at a Glance**
One sentence overall assessment with the key number.

**What's Working**
1-2 bullet points on the strongest habits. Be specific about WHY they're working.

**Needs Attention**
1-2 bullet points on the weakest habits. Identify the real bottleneck, not just the symptom.

**Patterns & Observations**
1-2 sentences on any interesting trends across habits or challenges.

**Focus for Next ${period === 'monthly' ? 'Month' : 'Week'}**
One specific, actionable recommendation. Make it concrete enough to act on today.`,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Generate my ${period} habit summary.\n\nOverall consistency: ~${overallAvg}%\n\nHabits (sorted best to worst):\n${habitLines}\n\nChallenges:\n${challLines}`,
        },
      ],
    });

    const summary = response.content[0].type === 'text' ? response.content[0].text : '';

    // ── Persist ───────────────────────────────────────────────────────────────
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    await admin.from('ai_insights').insert({
      user_id: user.id,
      type,
      content: summary,
      model: 'claude-sonnet-4-6',
    });

    return jsonResponse({ summary, period });

  } catch (err) {
    console.error('weekly-summary error:', err);
    return jsonResponse({ error: 'Something went wrong. Try again.' }, 500);
  }
});
