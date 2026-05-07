import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { buildBattleContext } from '@/lib/semantic/context-builder'
import { buildReviewPrompt } from '@/lib/claude/prompts'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { battleId } = await req.json()

  const [turnsRes, battleRes] = await Promise.all([
    supabase
      .from('turn_logs')
      .select('*')
      .eq('battle_id', battleId)
      .order('turn_number'),
    supabase
      .from('battles')
      .select('result, parties(name)')
      .eq('id', battleId)
      .single(),
  ])

  const turns = turnsRes.data ?? []
  const battle = battleRes.data

  const turnSummary = turns.length > 0
    ? turns.map(t =>
        `T${t.turn_number}: 自${t.my_hp_pct ?? '?'}% vs 相${t.opp_hp_pct ?? '?'}%${t.actual_move ? ` → ${t.actual_move}` : ''}`
      ).join('\n')
    : '記録なし'

  const context = await buildBattleContext(user.id)
  const prompt = buildReviewPrompt(context, battle?.result ?? 'unknown', turnSummary)

  return NextResponse.json({ prompt })
}
