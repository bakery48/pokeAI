import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TurnAdvisor } from '@/components/battle/TurnAdvisor'
import Link from 'next/link'

export default async function BattleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { id } = await params
  const { data: battle } = await supabase
    .from('battles')
    .select('id, result, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!battle) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ターンサポート</h1>
        <div className="flex items-center gap-3">
          <Link href={`/review/${battle.id}`} className="text-sm text-gray-500 hover:underline">振り返り →</Link>
          <Link href="/battle" className="text-sm text-gray-400 hover:underline">← 一覧</Link>
        </div>
      </div>
      <TurnAdvisor battleId={battle.id} />
    </div>
  )
}
