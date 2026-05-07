import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ReviewPanel } from '@/components/review/ReviewPanel'
import Link from 'next/link'

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { id } = await params
  const { data: battle } = await supabase
    .from('battles')
    .select('id, result, defeat_reason, memo, ai_analysis, created_at, parties(name)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!battle) notFound()

  const { data: turns } = await supabase
    .from('turn_logs')
    .select('turn_number, my_hp_pct, opp_hp_pct, actual_move')
    .eq('battle_id', id)
    .order('turn_number')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">振り返り</h1>
        <Link href="/battle" className="text-sm text-gray-400 hover:underline">← 対戦一覧</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
        <div className="flex items-center gap-3">
          <span className={`font-semibold ${battle.result === 'win' ? 'text-green-600' : battle.result === 'loss' ? 'text-red-500' : 'text-gray-400'}`}>
            {battle.result === 'win' ? '勝利' : battle.result === 'loss' ? '敗北' : '記録中'}
          </span>
          <span className="text-sm text-gray-500">{(battle.parties as any)?.name ?? '—'}</span>
          <span className="text-xs text-gray-400">{new Date(battle.created_at).toLocaleDateString('ja-JP')}</span>
        </div>
        {battle.ai_analysis && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
            {battle.ai_analysis}
          </div>
        )}
      </div>

      {turns && turns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">ターンログ</h2>
          <ul className="divide-y divide-gray-100">
            {turns.map(t => (
              <li key={t.turn_number} className="py-2 text-sm text-gray-600">
                T{t.turn_number}: 自{t.my_hp_pct ?? '?'}% vs 相{t.opp_hp_pct ?? '?'}%
                {t.actual_move && <span className="ml-2 text-gray-400">→ {t.actual_move}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ReviewPanel battleId={battle.id} existingAnalysis={battle.ai_analysis ?? ''} />
    </div>
  )
}
