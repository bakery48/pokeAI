'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NATURES = ['さみしがり','やんちゃ','ゆうかん','いじっぱり','ひかえめ','おだやか','なまいき','おくびょう','うっかりや','のんき','わんぱく','のうてんき','おとなしい','しんちょう','れいせい','むじゃき','てれや','おっとり','きまぐれ','まじめ']
const ROLES = ['エース', 'リード', '受け', 'セッター', 'スイーパー']

interface MemberData {
  slot: number
  pokemon_id: number | ''
  nickname: string
  item: string
  ability: string
  role: string
  is_mega: boolean
  nature: string
  move1: string
  move2: string
  move3: string
  move4: string
  ev_hp: number
  ev_atk: number
  ev_def: number
  ev_spatk: number
  ev_spdef: number
  ev_spe: number
}

const defaultMember = (slot: number): MemberData => ({
  slot, pokemon_id: '', nickname: '', item: '', ability: '', role: '',
  is_mega: false, nature: 'まじめ',
  move1: '', move2: '', move3: '', move4: '',
  ev_hp: 0, ev_atk: 0, ev_def: 0, ev_spatk: 0, ev_spdef: 0, ev_spe: 0,
})

interface Props {
  partyId?: string
  initialName?: string
  initialIsActive?: boolean
  initialMembers?: MemberData[]
}

export function PartyForm({ partyId, initialName = '', initialIsActive = false, initialMembers }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [isActive, setIsActive] = useState(initialIsActive)
  const [members, setMembers] = useState<MemberData[]>(
    initialMembers ?? Array.from({ length: 6 }, (_, i) => defaultMember(i + 1))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateMember(slot: number, field: keyof MemberData, value: any) {
    setMembers(prev => prev.map(m => m.slot === slot ? { ...m, [field]: value } : m))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('パーティ名を入力してください'); return }
    setSaving(true)
    setError('')

    const validMembers = members.filter(m => m.pokemon_id !== '')

    const res = await fetch(partyId ? `/api/party/${partyId}` : '/api/party', {
      method: partyId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, is_active: isActive, members: validMembers }),
    })

    setSaving(false)
    if (res.ok) {
      router.push('/party')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? '保存に失敗しました')
    }
  }

  async function handleDelete() {
    if (!partyId || !confirm('このパーティを削除しますか？')) return
    await fetch(`/api/party/${partyId}`, { method: 'DELETE' })
    router.push('/party')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">パーティ名</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="例: メガガルーラ軸スタン"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
          このパーティを使用中に設定する
        </label>
      </div>

      {members.map(m => (
        <div key={m.slot} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-800">[{m.slot}] スロット {m.slot}</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="図鑑番号" type="number" value={m.pokemon_id} onChange={v => updateMember(m.slot, 'pokemon_id', v === '' ? '' : Number(v))} placeholder="例: 445 (ガブリアス)" />
            <Field label="ニックネーム" value={m.nickname} onChange={v => updateMember(m.slot, 'nickname', v)} placeholder="省略可" />
            <Field label="持ち物" value={m.item} onChange={v => updateMember(m.slot, 'item', v)} placeholder="例: こだわりスカーフ" />
            <Field label="特性" value={m.ability} onChange={v => updateMember(m.slot, 'ability', v)} placeholder="例: さめはだ" />
            <div>
              <label className="block text-xs text-gray-500 mb-1">役割</label>
              <select value={m.role} onChange={e => updateMember(m.slot, 'role', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">-</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">性格</label>
              <select value={m.nature} onChange={e => updateMember(m.slot, 'nature', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={m.is_mega} onChange={e => updateMember(m.slot, 'is_mega', e.target.checked)} className="rounded" />
            メガシンカあり
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field label="わざ1" value={m.move1} onChange={v => updateMember(m.slot, 'move1', v)} />
            <Field label="わざ2" value={m.move2} onChange={v => updateMember(m.slot, 'move2', v)} />
            <Field label="わざ3" value={m.move3} onChange={v => updateMember(m.slot, 'move3', v)} />
            <Field label="わざ4" value={m.move4} onChange={v => updateMember(m.slot, 'move4', v)} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">努力値 (合計: {m.ev_hp+m.ev_atk+m.ev_def+m.ev_spatk+m.ev_spdef+m.ev_spe})</p>
            <div className="grid grid-cols-3 gap-2">
              {(['ev_hp','ev_atk','ev_def','ev_spatk','ev_spdef','ev_spe'] as const).map(key => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-0.5">{EV_LABELS[key]}</label>
                  <input type="number" min={0} max={252} value={m[key]} onChange={e => updateMember(m.slot, key, Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors">
          {saving ? '保存中...' : '保存する'}
        </button>
        {partyId && (
          <button type="button" onClick={handleDelete} className="px-4 py-2.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
            削除
          </button>
        )}
      </div>
    </form>
  )
}

const EV_LABELS: Record<string, string> = {
  ev_hp: 'HP', ev_atk: '攻撃', ev_def: '防御', ev_spatk: '特攻', ev_spdef: '特防', ev_spe: '素早',
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: any; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  )
}
