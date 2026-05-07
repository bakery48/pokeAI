'use client'

import { useState } from 'react'
import { CopyPromptButton } from '@/components/shared/CopyPromptButton'

interface Props {
  battleId: string
  existingAnalysis: string
}

export function ReviewPanel({ battleId, existingAnalysis }: Props) {
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [memo, setMemo] = useState('')
  const [savedMemo, setSavedMemo] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    const res = await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ battleId }),
    })
    const data = await res.json()
    setPrompt(data.prompt)
    setLoading(false)
  }

  async function saveMemo() {
    await fetch(`/api/battle/${battleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memo }),
    })
    setSavedMemo(true)
    setTimeout(() => setSavedMemo(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="font-semibold text-gray-800">振り返りプロンプトを生成</h2>
        <p className="text-sm text-gray-500">
          Claudeに振り返りをしてもらうためのプロンプトを生成します。
          コピーして Claude.ai に貼り付けてください。
        </p>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? '生成中...' : '振り返りプロンプトを生成'}
        </button>
        {prompt && <CopyPromptButton prompt={prompt} label="振り返りプロンプトをコピー" />}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="font-semibold text-gray-800">メモ</h2>
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          rows={4}
          placeholder="対戦のメモ、Claudeからもらったアドバイスなどを記録..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <button
          onClick={saveMemo}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {savedMemo ? '保存しました ✓' : 'メモを保存'}
        </button>
      </div>
    </div>
  )
}
