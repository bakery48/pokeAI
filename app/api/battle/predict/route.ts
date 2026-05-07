import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { buildBattleContext } from '@/lib/semantic/context-builder'
import { buildSelectionPrompt, buildTurnPrompt } from '@/lib/claude/prompts'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { mode, payload } = body

  const context = await buildBattleContext(user.id)

  let prompt: string

  if (mode === 'selection') {
    prompt = buildSelectionPrompt(context, payload.opponentParty)
  } else {
    prompt = buildTurnPrompt(
      context,
      payload.turn,
      payload.myPokemon,
      payload.myHp,
      payload.oppPokemon,
      payload.oppHp,
      payload.myRemaining,
      payload.oppRemaining,
    )

    if (payload.battleId) {
      await supabase.from('turn_logs').insert({
        battle_id: payload.battleId,
        turn_number: payload.turn,
        my_pokemon_id: payload.myPokemonId ?? null,
        my_hp_pct: payload.myHp,
        opp_pokemon_id: payload.oppPokemonId ?? null,
        opp_hp_pct: payload.oppHp,
      })
    }
  }

  return NextResponse.json({ prompt })
}
