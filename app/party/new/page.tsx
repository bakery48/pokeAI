import { PartyForm } from '@/components/party/PartyForm'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function NewPartyPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">新しいパーティを登録</h1>
      <PartyForm />
    </div>
  )
}
