/**
 * available_pokemon テーブルに特性を投入するスクリプト
 * PokeAPI の /ability/{name} エンドポイントから日本語名を直接取得する
 * 実行方法: npm run seed:abilities
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const abilityNameCache = new Map<string, string>()

async function fetchAbilityJa(abilitySlug: string): Promise<string> {
  if (abilityNameCache.has(abilitySlug)) return abilityNameCache.get(abilitySlug)!

  const res = await fetch(`https://pokeapi.co/api/v2/ability/${abilitySlug}`)
  if (!res.ok) {
    abilityNameCache.set(abilitySlug, abilitySlug)
    return abilitySlug
  }
  const data = await res.json()

  // 'ja' を優先、なければ 'ja-Hrkt'
  const jaEntry = data.names.find((n: any) => n.language.name === 'ja')
    ?? data.names.find((n: any) => n.language.name === 'ja-Hrkt')
  const name = jaEntry?.name ?? abilitySlug

  abilityNameCache.set(abilitySlug, name)
  await new Promise(r => setTimeout(r, 100))
  return name
}

async function fetchAbilities(slug: string): Promise<{
  ability1: string | null
  ability2: string | null
  ability_hidden: string | null
}> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`)
  if (!res.ok) return { ability1: null, ability2: null, ability_hidden: null }
  const data = await res.json()

  let ability1: string | null = null
  let ability2: string | null = null
  let ability_hidden: string | null = null

  for (const a of data.abilities) {
    const ja = await fetchAbilityJa(a.ability.name)
    if (a.is_hidden) ability_hidden = ja
    else if (a.slot === 1) ability1 = ja
    else if (a.slot === 2) ability2 = ja
  }

  return { ability1, ability2, ability_hidden }
}

async function main() {
  const { data: pokemons, error } = await supabase
    .from('available_pokemon')
    .select('id, name_ja, pokeapi_slug')
    .order('id')

  if (error) { console.error(error); process.exit(1) }

  let success = 0, fail = 0

  for (const pokemon of pokemons!) {
    if (!pokemon.pokeapi_slug) {
      console.log(`- ${pokemon.name_ja} スラッグなし、スキップ`)
      fail++
      continue
    }

    try {
      const abilities = await fetchAbilities(pokemon.pokeapi_slug)
      const { error: upErr } = await supabase
        .from('available_pokemon')
        .update(abilities)
        .eq('id', pokemon.id)

      if (upErr) throw upErr
      console.log(`✓ ${pokemon.name_ja} → ${abilities.ability1 ?? '-'} / ${abilities.ability2 ?? '-'} / ${abilities.ability_hidden ?? '-'}`)
      success++
    } catch (e: any) {
      console.log(`✗ ${pokemon.name_ja} - エラー: ${e.message}`)
      fail++
    }

    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\n完了: ${success}匹成功 / ${fail}匹失敗`)
}

main()
