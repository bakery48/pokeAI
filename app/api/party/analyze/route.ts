import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { buildBattleContext } from '@/lib/semantic/context-builder'
import { buildPartyAnalysisPrompt } from '@/lib/claude/prompts'

export async function POST(_req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const context = await buildBattleContext(user.id)
  const prompt = buildPartyAnalysisPrompt(context)

  return NextResponse.json({ prompt })
}
