'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CopyPromptButton } from '@/components/shared/CopyPromptButton'

export function BattleStart() {
  const router = useRouter()
  const [opponents, setOpponents] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [battleId, setBattleId] = useState('')

  function updateOpponent(i: number, v: string) {
    setOpponents(prev => prev.map((o, idx) => idx === i ? v : o))
  }

  async function handleGetAdvice() {
    const filled = opponents.filter(Boolean)
    if (filled.length < 3) {
      alert('相手パーティを最低3匹入力してください')
      return
    }
    setLoading(true)

    const battleRes = await fetch('/api/battle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opponentIds: [] }),
    })
    const battleData = await battleRes.json()
    setBattleId(battleData.id)

    const res = await fetch('/api/battle/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'selection', payload: { opponentParty: filled } }),
    })
    const data = await res.json()
    setPrompt(data.prompt)
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <h2 className="font-semibold text-gray-800">選出アドバイスを取得</h2>

      <div>
        <p className="text-sm text-gray-600 mb-3">相手パーティを入力（日本語名）</p>
        <div className="grid grid-cols-2 gap-2">
          {opponents.map((o, i) => (
            <input
              key={i}
              value={o}
              onChange={e => updateOpponent(i, e.target.value)}
              placeholder={`${i + 1}匹目`}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ))}
        </div>
      </div>

      <button
        onClick={handleGetAdvice}
        disabled={loading}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
      >
        {loading ? '生成中...' : 'Claudeへのプロンプトを生成'}
      </button>

      {prompt && (
        <div className="space-y-3">
          <CopyPromptButton prompt={prompt} label="選出プロンプトをコピー" />
          {battleId && (
            <a href={`/battle/${battleId}`} className="block text-center text-sm text-indigo-600 hover:underline">
              対戦を開始してターンサポートを使う →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
