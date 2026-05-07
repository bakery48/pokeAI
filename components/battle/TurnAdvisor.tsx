'use client'

import { useState } from 'react'
import { CopyPromptButton } from '@/components/shared/CopyPromptButton'

interface Props { battleId: string }

export function TurnAdvisor({ battleId }: Props) {
  const [turn, setTurn] = useState(1)
  const [myPokemon, setMyPokemon] = useState('')
  const [myHp, setMyHp] = useState(100)
  const [oppPokemon, setOppPokemon] = useState('')
  const [oppHp, setOppHp] = useState(100)
  const [myRemaining, setMyRemaining] = useState('')
  const [oppRemaining, setOppRemaining] = useState('')
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')

  async function handleGenerate() {
    if (!myPokemon || !oppPokemon) { alert('自分と相手のポケモンを入力してください'); return }
    setLoading(true)

    const res = await fetch('/api/battle/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'turn',
        payload: {
          battleId,
          turn,
          myPokemon, myHp,
          oppPokemon, oppHp,
          myRemaining: myRemaining.split(/[,、\s]+/).filter(Boolean),
          oppRemaining: oppRemaining.split(/[,、\s]+/).filter(Boolean),
        },
      }),
    })
    const data = await res.json()
    setPrompt(data.prompt)
    setLoading(false)
  }

  async function recordResult(result: 'win' | 'loss') {
    await fetch(`/api/battle/${battleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result }),
    })
    alert(`${result === 'win' ? '勝利' : '敗北'}を記録しました`)
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">ターン</label>
          <input type="number" min={1} value={turn} onChange={e => setTurn(Number(e.target.value))}
            className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-indigo-600">自分</p>
            <input value={myPokemon} onChange={e => setMyPokemon(e.target.value)} placeholder="ポケモン名"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 w-8">HP%</label>
              <input type="number" min={0} max={100} value={myHp} onChange={e => setMyHp(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <input value={myRemaining} onChange={e => setMyRemaining(e.target.value)} placeholder="残り手持ち (カンマ区切り)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-500">相手</p>
            <input value={oppPokemon} onChange={e => setOppPokemon(e.target.value)} placeholder="ポケモン名"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 w-8">HP%</label>
              <input type="number" min={0} max={100} value={oppHp} onChange={e => setOppHp(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <input value={oppRemaining} onChange={e => setOppRemaining(e.target.value)} placeholder="残り手持ち (カンマ区切り)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <button onClick={handleGenerate} disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors">
          {loading ? '生成中...' : 'プロンプトを生成'}
        </button>

        {prompt && <CopyPromptButton prompt={prompt} label="ターンプロンプトをコピー" />}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-700 mb-3">対戦結果を記録</p>
        <div className="flex gap-3">
          <button onClick={() => recordResult('win')}
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
            勝利
          </button>
          <button onClick={() => recordResult('loss')}
            className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
            敗北
          </button>
        </div>
      </div>
    </div>
  )
}
