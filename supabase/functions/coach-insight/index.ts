import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';
import { corsHeaders, corsResponse, jsonResponse } from '../_shared/cors.ts';

const COOLDOWN_MINUTES = 30; // prevent hammering the API

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401);

    // ── Verify caller identity via JWT ──────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

    // ── Rate limit: 1 insight per COOLDOWN_MINUTES ──────────────────────────
    const { data: recent } = await supabase
      .from('ai_insights')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('type', 'coaching')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent) {
      const age = (Date.now() - new Date(recent.created_at).getTime()) / 60000;
      if (age < COOLDOWN_MINUTES) {
        return jsonResponse({
          error: `Cooldown active. Try again in ${Math.ceil(COOLDOWN_MINUTES - age)} minutes.`,
          cooldown: true,
        }, 429);
      }
    }

    // ── Fetch user's habit + challenge data ─────────────────────────────────
    const [{ data: habits }, { data: challenges }] = await Promise.all([
      supabase.from('habits').select('name,emoji,type,streak,completed_count,target_count,created_at').eq('user_id', user.id),
      supabase.from('challenges').select('title,emoji,days_completed,duration_days,completed_at').eq('user_id', user.id),
    ]);

    if (!habits || habits.length === 0) {
      return jsonResponse({ error: 'No habits found — add some habits first!' }, 400);
    }

    // ── Build data summary for the prompt ───────────────────────────────────
    const habitLines = habits.map((h: Record<string, unknown>) => {
      const daysOld = Math.floor((Date.now() - Number(h.created_at)) / 86400000);
      const isVolume = h.type === 'volume';
      const completedToday = isVolume
        ? `${h.completed_count}/${h.target_count} times today`
        : Number(h.completed_count) >= Number(h.target_count) ? 'done today ✅' : 'not done today ❌';
      return `• ${h.emoji} ${h.name}: ${h.streak}-day streak, ${completedToday}, habit is ${daysOld} days old`;
    }).join('\n');

    const activeChalls = (challenges ?? []).filter((c: Record<string, unknown>) => !c.completed_at);
    const challLines = activeChalls.length
      ? activeChalls.map((c: Record<string, unknown>) => `• ${c.emoji} ${c.title}: day ${c.days_completed}/${c.duration_days}`).join('\n')
      : '• No active challenges';

    // ── Call Claude Sonnet with prompt caching on the system prompt ──────────
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 350,
      system: [
        {
          type: 'text',
          text: `You are a sharp, warm personal habit coach. Your job is to give a personalized, data-driven coaching insight that feels like it came from a knowledgeable friend — not a generic app.

Rules:
- Always reference specific habit names and real numbers from the data
- Lead with the biggest win (highest streak or most consistent habit)
- Identify the clearest gap (lowest streak or missed today)
- End with exactly ONE specific, immediately actionable tip — not vague advice
- Maximum 3 sentences. Be direct. Never use filler phrases like "Great job!" or "Keep it up!"
- Tone: honest, encouraging, specific`,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Analyze my habits and give me a coaching insight:\n\nHabits:\n${habitLines}\n\nActive challenges:\n${challLines}`,
        },
      ],
    });

    const insight = response.content[0].type === 'text' ? response.content[0].text : '';

    // ── Store in DB using service role (bypasses RLS for insert) ────────────
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    await admin.from('ai_insights').insert({
      user_id: user.id,
      type: 'coaching',
      content: insight,
      model: 'claude-sonnet-4-6',
    });

    return jsonResponse({ insight });

  } catch (err) {
    console.error('coach-insight error:', err);
    return jsonResponse({ error: 'Something went wrong. Try again.' }, 500);
  }
});
