import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [partiesRes, battlesRes] = await Promise.all([
    supabase.from('parties').select('id, name, is_active').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('battles').select('id, result, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
  ])

  const parties = partiesRes.data ?? []
  const recentBattles = battlesRes.data ?? []
  const activeParty = parties.find(p => p.is_active)

  const wins = recentBattles.filter(b => b.result === 'win').length
  const losses = recentBattles.filter(b => b.result === 'loss').length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="直近5戦 勝率" value={recentBattles.length > 0 ? `${Math.round((wins / recentBattles.length) * 100)}%` : '—'} />
        <StatCard label="勝 / 負" value={`${wins} / ${losses}`} />
        <StatCard label="登録パーティ数" value={String(parties.length)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">使用中のパーティ</h2>
            <Link href="/party" className="text-sm text-indigo-600 hover:underline">管理 →</Link>
          </div>
          {activeParty
            ? <p className="text-gray-700">{activeParty.name}</p>
            : <p className="text-gray-400 text-sm">パーティが設定されていません</p>
          }
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">クイックアクション</h2>
          </div>
          <div className="space-y-2">
            <Link href="/battle" className="block w-full text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
              対戦を始める
            </Link>
            <Link href="/party/new" className="block w-full text-center px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
              パーティを登録する
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">直近の対戦</h2>
          <Link href="/battle" className="text-sm text-indigo-600 hover:underline">すべて見る →</Link>
        </div>
        {recentBattles.length === 0
          ? <p className="text-gray-400 text-sm">対戦記録がありません</p>
          : (
            <ul className="divide-y divide-gray-100">
              {recentBattles.map(b => (
                <li key={b.id} className="flex items-center justify-between py-2">
                  <span className={`text-sm font-medium ${b.result === 'win' ? 'text-green-600' : b.result === 'loss' ? 'text-red-500' : 'text-gray-400'}`}>
                    {b.result === 'win' ? '勝利' : b.result === 'loss' ? '敗北' : '不明'}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(b.created_at).toLocaleDateString('ja-JP')}</span>
                  <Link href={`/review/${b.id}`} className="text-xs text-indigo-600 hover:underline">振り返り</Link>
                </li>
              ))}
            </ul>
          )
        }
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}
