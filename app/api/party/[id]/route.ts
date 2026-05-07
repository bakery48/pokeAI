import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data, error } = await supabase
    .from('parties')
    .select(`
      id, name, is_active,
      party_members (
        id, slot, pokemon_id, nickname, item, ability, role, is_mega, nature,
        move1, move2, move3, move4,
        ev_hp, ev_atk, ev_def, ev_spatk, ev_spdef, ev_spe,
        pokemon_master ( name_ja, type1, type2 )
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, is_active, members } = body

  if (is_active) {
    await supabase.from('parties').update({ is_active: false }).eq('user_id', user.id)
  }

  const { error: partyError } = await supabase
    .from('parties')
    .update({ name, is_active: is_active ?? false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (partyError) return NextResponse.json({ error: partyError.message }, { status: 500 })

  if (members) {
    await supabase.from('party_members').delete().eq('party_id', id)
    if (members.length > 0) {
      await supabase.from('party_members').insert(
        members.map((m: any) => ({ ...m, party_id: id }))
      )
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase.from('parties').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
