import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('parties')
    .select('id, name, is_active, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, members } = body

  const { data: party, error: partyError } = await supabase
    .from('parties')
    .insert({ user_id: user.id, name })
    .select('id')
    .single()

  if (partyError) return NextResponse.json({ error: partyError.message }, { status: 500 })

  if (members?.length > 0) {
    const { error: membersError } = await supabase
      .from('party_members')
      .insert(members.map((m: any) => ({ ...m, party_id: party.id })))

    if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 })
  }

  return NextResponse.json({ id: party.id }, { status: 201 })
}
