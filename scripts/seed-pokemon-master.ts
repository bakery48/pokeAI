/**
 * pokemon_master テーブルへのデータ投入スクリプト
 * 実行方法: npx tsx scripts/seed-pokemon-master.ts
 *
 * 必要な環境変数:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PokeAPIのタイプ名を日本語に変換
const TYPE_MAP: Record<string, string> = {
  normal: 'ノーマル', fire: 'ほのお', water: 'みず', electric: 'でんき',
  grass: 'くさ', ice: 'こおり', fighting: 'かくとう', poison: 'どく',
  ground: 'じめん', flying: 'ひこう', psychic: 'エスパー', bug: 'むし',
  rock: 'いわ', ghost: 'ゴースト', dragon: 'ドラゴン', dark: 'あく',
  steel: 'はがね', fairy: 'フェアリー',
}

// メガシンカ対応ポケモン（通常IDとメガID）
const MEGA_MAP: Record<number, number> = {
  3: 10033,   // フシギバナ → メガフシギバナ
  6: 10034,   // リザードン → メガリザードンX
  9: 10036,   // カメックス → メガカメックス
  65: 10037,  // フーディン → メガフーディン
  94: 10038,  // ゲンガー → メガゲンガー
  115: 10039, // ガルーラ → メガガルーラ
  127: 10040, // カイロス → メガカイロス
  130: 10041, // ギャラドス → メガギャラドス
  142: 10042, // プテラ → メガプテラ
  143: 10043, // カビゴン → メガカビゴン（※存在しないため除外予定）
  149: 10044, // カイリュー → メガカイリュー（※存在しないため除外予定）
  150: 10045, // ミュウツー → メガミュウツーX
  181: 10046, // アンペロス → メガアンペロス（デンリュウ）
  212: 10047, // ハッサム → メガハッサム
  214: 10048, // ヘラクロス → メガヘラクロス
  229: 10049, // ヘルガー → メガヘルガー
  248: 10050, // バンギラス → メガバンギラス
  282: 10051, // サーナイト → メガサーナイト
  303: 10052, // クチート → メガクチート
  306: 10053, // ボスゴドラ → メガボスゴドラ
  308: 10054, // ハリテヤマ → メガハリテヤマ（※存在しないため除外予定）
  310: 10055, // ライボルト → メガライボルト
  354: 10056, // ジュペッタ → メガジュペッタ
  359: 10057, // アブソル → メガアブソル
  362: 10058, // オニゴーリ → メガオニゴーリ（※存在しないため除外予定）
  373: 10059, // ボーマンダ → メガボーマンダ
  376: 10060, // メタグロス → メガメタグロス
  380: 10061, // ラティアス → メガラティアス
  381: 10062, // ラティオス → メガラティオス
  384: 10063, // レックウザ → メガレックウザ
  428: 10064, // ミミロップ → メガミミロップ
  445: 10065, // ガブリアス → メガガブリアス
  448: 10066, // ルカリオ → メガルカリオ
  460: 10067, // ユキノオー → メガユキノオー
  475: 10068, // エルレイド → メガエルレイド
  531: 10069, // チラチーノ → メガチラチーノ（※存在しない）
  719: 10075, // ジガルデ → メガジガルデ（※存在しない）
}

interface PokeAPISpecies {
  names: { name: string; language: { name: string } }[]
}

interface PokeAPIPokemon {
  id: number
  types: { type: { name: string } }[]
  stats: { base_stat: number; stat: { name: string } }[]
  species: { url: string }
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return res
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)))
        continue
      }
      throw new Error(`HTTP ${res.status}`)
    } catch (e) {
      if (i === retries - 1) throw e
      await new Promise(r => setTimeout(r, 500))
    }
  }
  throw new Error('Max retries exceeded')
}

async function fetchPokemonData(id: number) {
  const res = await fetchWithRetry(`https://pokeapi.co/api/v2/pokemon/${id}`)
  const data: PokeAPIPokemon = await res.json()

  const speciesRes = await fetchWithRetry(data.species.url)
  const speciesData: PokeAPISpecies = await speciesRes.json()

  const nameJa = speciesData.names.find(n => n.language.name === 'ja-Hrkt')?.name ?? ''
  const nameEn = speciesData.names.find(n => n.language.name === 'en')?.name ?? ''

  const statsMap = Object.fromEntries(data.stats.map(s => [s.stat.name, s.base_stat]))
  const type1 = TYPE_MAP[data.types[0]?.type.name] ?? data.types[0]?.type.name ?? ''
  const type2 = data.types[1] ? (TYPE_MAP[data.types[1].type.name] ?? data.types[1].type.name) : null

  return {
    id,
    name_ja: nameJa,
    name_en: nameEn,
    type1,
    type2,
    base_hp: statsMap['hp'] ?? 0,
    base_atk: statsMap['attack'] ?? 0,
    base_def: statsMap['defense'] ?? 0,
    base_spatk: statsMap['special-attack'] ?? 0,
    base_spdef: statsMap['special-defense'] ?? 0,
    base_spe: statsMap['speed'] ?? 0,
    can_mega: id in MEGA_MAP,
    mega_id: MEGA_MAP[id] ?? null,
  }
}

async function main() {
  console.log('pokemon_masterデータ投入開始...')

  // 第1世代〜第7世代（ポケモンチャンピオンズはSMまでが対象）
  const MAX_ID = 807
  const BATCH_SIZE = 20
  const allPokemon = []

  for (let start = 1; start <= MAX_ID; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE - 1, MAX_ID)
    console.log(`取得中: ${start}〜${end}`)

    const batch = await Promise.all(
      Array.from({ length: end - start + 1 }, (_, i) => fetchPokemonData(start + i))
    )
    allPokemon.push(...batch)

    // レート制限対策
    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`${allPokemon.length}匹のデータを取得完了。Supabaseに投入中...`)

  const UPSERT_BATCH = 100
  for (let i = 0; i < allPokemon.length; i += UPSERT_BATCH) {
    const chunk = allPokemon.slice(i, i + UPSERT_BATCH)
    const { error } = await supabase
      .from('pokemon_master')
      .upsert(chunk, { onConflict: 'id' })

    if (error) {
      console.error(`投入エラー (${i}〜${i + UPSERT_BATCH}):`, error)
    } else {
      console.log(`投入完了: ${i + 1}〜${Math.min(i + UPSERT_BATCH, allPokemon.length)}`)
    }
  }

  console.log('完了!')
}

main().catch(console.error)
