import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PartyListPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: parties } = await supabase
    .from('parties')
    .select('id, name, is_active, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">パーティ管理</h1>
        <Link href="/party/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          + 新しいパーティ
        </Link>
      </div>

      {!parties || parties.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 mb-4">パーティが登録されていません</p>
          <Link href="/party/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
            最初のパーティを登録する
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {parties.map(party => (
            <li key={party.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {party.is_active && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">使用中</span>
                )}
                <span className="font-medium text-gray-900">{party.name}</span>
                <span className="text-xs text-gray-400">{new Date(party.created_at).toLocaleDateString('ja-JP')}</span>
              </div>
              <Link href={`/party/${party.id}`} className="text-sm text-indigo-600 hover:underline">
                編集 →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
