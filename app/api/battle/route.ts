import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('battles')
    .select('id, result, defeat_reason, created_at, parties(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const { data: activeParty } = await supabase
    .from('parties')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  const { data, error } = await supabase
    .from('battles')
    .insert({
      user_id: user.id,
      party_id: activeParty?.id ?? null,
      result: 'unknown',
      opponent_p1: body.opponentIds?.[0] ?? null,
      opponent_p2: body.opponentIds?.[1] ?? null,
      opponent_p3: body.opponentIds?.[2] ?? null,
      opponent_p4: body.opponentIds?.[3] ?? null,
      opponent_p5: body.opponentIds?.[4] ?? null,
      opponent_p6: body.opponentIds?.[5] ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
