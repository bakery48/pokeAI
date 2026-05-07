import { PartyForm } from '@/components/party/PartyForm'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

export default async function PartyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { id } = await params
  const { data: party } = await supabase
    .from('parties')
    .select(`
      id, name, is_active,
      party_members (
        id, slot, pokemon_id, nickname, item, ability, role, is_mega, nature,
        move1, move2, move3, move4,
        ev_hp, ev_atk, ev_def, ev_spatk, ev_spdef, ev_spe
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!party) notFound()

  const slots = Array.from({ length: 6 }, (_, i) => {
    const m = party.party_members?.find((pm: any) => pm.slot === i + 1)
    return m ? { ...m } : {
      slot: i + 1, pokemon_id: '' as any, nickname: '', item: '', ability: '', role: '',
      is_mega: false, nature: 'まじめ', move1: '', move2: '', move3: '', move4: '',
      ev_hp: 0, ev_atk: 0, ev_def: 0, ev_spatk: 0, ev_spdef: 0, ev_spe: 0,
    }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">パーティを編集</h1>
      <PartyForm
        partyId={party.id}
        initialName={party.name}
        initialIsActive={party.is_active}
        initialMembers={slots as any}
      />
    </div>
  )
}
