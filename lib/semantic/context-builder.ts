import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TYPE_CHART_TEXT } from '@/lib/data/type-chart'
import { DAMAGE_FORMULA_TEXT } from '@/lib/data/damage-formula'
import { STAT_FORMULA_TEXT } from '@/lib/data/stat-formula'
import { MOVES_DB_TEXT } from '@/lib/data/moves'
import { ABILITIES_DB_TEXT } from '@/lib/data/abilities'
import { BATTLE_CONDITIONS_TEXT } from '@/lib/data/battle-conditions'

export async function buildBattleContext(userId: string): Promise<string> {
  const supabase = await createServerSupabaseClient()

  const [partyRes, battlesRes, weakRes, metaRes, availableRes] = await Promise.all([
    supabase
      .from('parties')
      .select(`
        id, name,
        party_members (
          slot, role, item, ability, is_mega, nature,
          move1, move2, move3, move4,
          ev_hp, ev_atk, ev_def, ev_spatk, ev_spdef, ev_spe,
          pokemon_master ( name_ja, type1, type2, base_hp, base_atk, base_def, base_spatk, base_spdef, base_spe )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single(),

    supabase
      .from('battles')
      .select('result, defeat_reason, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),

    supabase.rpc('get_weak_opponents', { p_user_id: userId, p_limit: 5 }),

    supabase
      .from('meta_notes')
      .select('content, top_threats')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(1)
      .single(),

    supabase
      .from('available_pokemon')
      .select('name_ja, type1, type2, base_hp, base_atk, base_def, base_spatk, base_spdef, base_spe')
      .order('id'),
  ])

  const party = partyRes.data
  const recentBattles = battlesRes.data ?? []
  const weakOpponents = weakRes.data ?? []
  const metaNote = metaRes.data
  const availablePokemon = availableRes.data ?? []

  const winRate = recentBattles.length > 0
    ? Math.round((recentBattles.filter(b => b.result === 'win').length / recentBattles.length) * 100)
    : 0

  const defeatReasons = recentBattles
    .filter(b => b.result === 'loss')
    .reduce((acc, b) => {
      if (b.defeat_reason) acc[b.defeat_reason] = (acc[b.defeat_reason] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  const partyDescription = party?.party_members
    ?.sort((a: any, b: any) => a.slot - b.slot)
    .map((m: any) => {
      const p = m.pokemon_master
      const name = m.is_mega ? `メガ${p.name_ja}` : p.name_ja
      const moves = [m.move1, m.move2, m.move3, m.move4].filter(Boolean).join('/')
      const evSummary = buildEvSummary(m)
      return `  [${m.slot}] ${name}（${m.role ?? '役割未設定'}）持ち物:${m.item ?? '不明'} 技:${moves || '未設定'} ${evSummary}`
    })
    .join('\n') ?? '  パーティ未登録'

  const defeatLabel: Record<string, string> = {
    selection: '選出ミス', move: '技選択ミス', party: '構築の穴', luck: '運負け',
  }
  const defeatSummary = Object.entries(defeatReasons)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${defeatLabel[k] ?? k}:${v}回`)
    .join(' / ') || 'データなし'

  return `
=== AIコーチ コンテキスト ===

【使用中のパーティ: ${party?.name ?? '未設定'}】
${partyDescription}

【直近${recentBattles.length}戦の戦績】
  勝率: ${winRate}%
  敗因内訳: ${defeatSummary}

【苦手な相手（優先的に対策すべき）】
${weakOpponents.length > 0
    ? weakOpponents.map((o: any) => `  - ${o.name_ja}: ${o.loss_count}敗`).join('\n')
    : '  データなし'}

【今週の環境】
${metaNote?.content ?? '  環境メモ未記録'}
${metaNote?.top_threats ? `  脅威ポケモン: ${(metaNote.top_threats as string[]).join(', ')}` : ''}

${TYPE_CHART_TEXT}

${DAMAGE_FORMULA_TEXT}

${STAT_FORMULA_TEXT}

${MOVES_DB_TEXT}

${ABILITIES_DB_TEXT}

${BATTLE_CONDITIONS_TEXT}

【ポケモンチャンピオンズ 使用可能ポケモン一覧（全${availablePokemon.length}匹）】
${availablePokemon.length > 0 ? availablePokemon.map((p: any) => {
  const type = p.type2 ? `${p.type1}/${p.type2}` : p.type1
  return `${p.name_ja}（${type ?? '?'}）H${p.base_hp ?? '?'} A${p.base_atk ?? '?'} B${p.base_def ?? '?'} C${p.base_spatk ?? '?'} D${p.base_spdef ?? '?'} S${p.base_spe ?? '?'}`
}).join('\n') : '  データなし'}

=== ここまでがコンテキスト ===
`.trim()
}

function buildEvSummary(member: any): string {
  const parts: string[] = []
  if (member.ev_atk >= 200) parts.push('攻撃特化')
  else if (member.ev_spatk >= 200) parts.push('特攻特化')
  if (member.ev_hp >= 200) parts.push('HP特化')
  if (member.ev_spe >= 200) parts.push('素早さ最速')
  return parts.length > 0 ? `[${parts.join('・')}]` : ''
}
