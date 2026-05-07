import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BattleStart } from '@/components/battle/BattleStart'

export default async function BattlePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: battles } = await supabase
    .from('battles')
    .select('id, result, created_at, parties(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">対戦</h1>
        <BattleStart />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">対戦履歴</h2>
        {!battles || battles.length === 0 ? (
          <p className="text-gray-400 text-sm">対戦記録がありません</p>
        ) : (
          <ul className="space-y-2">
            {battles.map(b => (
              <li key={b.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${b.result === 'win' ? 'text-green-600' : b.result === 'loss' ? 'text-red-500' : 'text-gray-400'}`}>
                    {b.result === 'win' ? '勝利' : b.result === 'loss' ? '敗北' : '記録中'}
                  </span>
                  <span className="text-sm text-gray-500">{(b.parties as any)?.name ?? '—'}</span>
                  <span className="text-xs text-gray-400">{new Date(b.created_at).toLocaleDateString('ja-JP')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <a href={`/battle/${b.id}`} className="text-xs text-indigo-600 hover:underline">ターンサポート</a>
                  <a href={`/review/${b.id}`} className="text-xs text-gray-500 hover:underline">振り返り</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
