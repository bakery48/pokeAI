/**
 * available_pokemon テーブルに特性を投入するスクリプト
 * 実行方法: npm run seed:abilities
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ABILITY_JA: Record<string, string> = {
  overgrow: 'しんりょく', blaze: 'もうか', torrent: 'げきりゅう', swarm: 'むしのしらせ',
  'keen-eye': 'するどいめ', 'tangled-feet': 'みだれあし', 'big-pecks': 'はとむね',
  'shed-skin': 'だっぴ', intimidate: 'いかく', 'run-away': 'にげあし',
  'lightning-rod': 'ひらいしん', static: 'せいでんき', 'volt-absorb': 'ちくでん',
  'water-absorb': 'ちょすい', 'oblivious': 'マイペース', 'cloud-nine': 'てんきや',
  'compound-eyes': 'ふくがん', 'tinted-lens': 'いろめがね', 'frisk': 'きけんよち',
  'hustle': 'はりきり', 'cute-charm': 'メロメロボディ', 'dry-skin': 'かんそうはだ',
  'download': 'ダウンロード', 'trace': 'トレース', 'synchronize': 'シンクロ',
  'inner-focus': 'せいしんりょく', 'magic-guard': 'マジックガード',
  'sand-veil': 'すながくれ', 'sand-rush': 'すなかき', 'sand-force': 'すなのちから',
  'sand-stream': 'すなおこし', 'swift-swim': 'すいすい', 'chlorophyll': 'ようりょくそ',
  'rain-dish': 'アメうけざら', 'drizzle': 'あめふらし', 'drought': 'ひでり',
  'snow-warning': 'ゆきふらし', 'slush-rush': 'ゆきかき', 'snow-cloak': 'ゆきがくれ',
  'thick-fat': 'ぶあつい脂肪', 'filter': 'フィルター', 'solid-rock': 'ハードロック',
  'prism-armor': 'プリズムアーマー', 'multiscale': 'マルチスケイル',
  'fur-coat': 'ファーコート', 'fluffy': 'もふもふ', 'heat-proof': 'たいねつ',
  'water-veil': 'みずのベール', 'levitate': 'ふゆう', 'wonderguard': 'ふしぎなまもり',
  'marvel-scale': 'ふしぎなうろこ', 'natural-cure': 'しぜんかいふく',
  'serene-grace': 'てんのめぐみ', 'poison-point': 'どくのトゲ',
  'flame-body': 'ほのおのからだ', 'static-touch': 'せいでんき',
  'rough-skin': 'さめはだ', 'iron-barbs': 'てつのとげ', 'effect-spore': 'ほうし',
  'gooey': 'ぬめぬめ', 'tanglinghair': 'もつれもつれ',
  'pressure': 'プレッシャー', 'mold-breaker': 'かたやぶり',
  'adaptability': 'てきおうりょく', 'reckless': 'すてみ', 'technician': 'テクニシャン',
  'skill-link': 'スキルリンク', 'sniper': 'スナイパー', 'iron-fist': 'てつのこぶし',
  'sheer-force': 'ちからずく', 'tough-claws': 'かたいつめ',
  'mega-launcher': 'メガランチャー', 'no-guard': 'ノーガード',
  'unburden': 'かるわざ', 'guts': 'こんじょう', 'quick-feet': 'はやあし',
  'swift-swim-2': 'すいすい', 'speed-boost': 'かそく', 'moody': 'ムラっけ',
  'own-tempo': 'マイペース', 'immunity': 'めんえき', 'limber': 'じゅうなん',
  'insomnia': 'ふみん', 'vital-spirit': 'やるき', 'soundproof': 'ぼうおん',
  'bulletproof': 'ぼうだん', 'overcoat': 'ぼうじん', 'magic-bounce': 'マジックミラー',
  'unaware': 'てんねん', 'scrappy': 'きもったま',
  'stench': 'あくしゅう', 'effect-power': 'ちからずく',
  'cursed-body': 'のろわれボディ', 'poison-touch': 'どくしゅ',
  'regenerator': 'さいせいりょく', 'analytic': 'アナライズ',
  'weak-armor': 'よわきよろい', 'heavy-metal': 'おもかわり', 'light-metal': 'かるわざ',
  'justified': 'せいぎのこころ', 'rattled': 'びびり', 'wonder-skin': 'ふしぎなまもり',
  'sap-sipper': 'そうしょく', 'storm-drain': 'よびみず', 'motor-drive': 'でんきエンジン',
  'water-compaction': 'すいてき', 'tangling-hair': 'もつれもつれ',
  'disguise': 'ばけのかわ', 'shields-down': 'シールドダウン',
  'power-of-alchemy': 'かがくへんかガス', 'receiver': 'かがくへんかガス',
  'beast-boost': 'じゅうてん', 'soul-heart': 'ソウルハート',
  'full-metal-body': 'メタルプロテクト', 'shadow-shield': 'ファントムガード',
  'prankster': 'いたずらごころ', 'infiltrator': 'すりぬけ',
  'pickpocket': 'わるいてぐせ', 'sticky-hold': 'ねんちゃく',
  'suction-cups': 'きゅうばん', 'guard-dog': 'ばんけん',
  'anger-point': 'いかりのつぼ', 'unnerve': 'きんちょうかん',
  'slow-start': 'スロースタート', 'truant': 'なまけ', 'defeatist': 'よわき',
  'zen-mode': 'ダルマモード', 'turboblaze': 'タービンブレイズ',
  'teravolt': 'テラボルテージ', 'aerilate': 'スカイスキン', 'refrigerate': 'フリーズスキン',
  'pixilate': 'フェアリースキン', 'galvanize': 'エレキスキン', 'normalize': 'ノーマルスキン',
  'contrary': 'あまのじゃく', 'simple': 'たんじゅん', 'white-smoke': 'しろいけむり',
  'clear-body': 'クリアボディ', 'full-metal-body-2': 'メタルプロテクト',
  'competitive': 'かちき', 'defiant': 'まけんき', 'anger-shell': 'いかりのこうら',
  'commander': 'そうすい', 'armor-tail': 'しっぽのよろい',
  'hadron-engine': 'ハドロンエンジン', 'orichalcum-pulse': 'ひひいろのこどう',
  'thermal-exchange': 'ねつこうかん', 'good-as-gold': 'きんのからだ',
  'well-baked-body': 'やきたて', 'wind-rider': 'かぜのり',
  'earth-eater': 'じきゅうしゃ', 'vessel-of-ruin': 'わざわいのうつわ',
  'sword-of-ruin': 'わざわいのつるぎ', 'tablets-of-ruin': 'わざわいのおふだ',
  'beads-of-ruin': 'わざわいのたま', 'ice-face': 'アイスフェイス',
  'power-spot': 'パワースポット', 'stalwart': 'かたいあご',
  'pastel-veil': 'パステルベール', 'ball-fetch': 'ボールひろい',
  'cotton-down': 'わたほうし', 'propeller-tail': 'スクリューおびれ',
  'mirror-armor': 'ミラーアーマー', 'hunger-switch': 'くいしんぼう',
  'ripen': 'じゅくせい', 'cotton-guard-ability': 'コットンキャンディ',
}

async function fetchAbilities(slug: string): Promise<{ ability1: string | null, ability2: string | null, ability_hidden: string | null }> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`)
  if (!res.ok) return { ability1: null, ability2: null, ability_hidden: null }
  const data = await res.json()

  let ability1: string | null = null
  let ability2: string | null = null
  let ability_hidden: string | null = null

  for (const a of data.abilities) {
    const ja = ABILITY_JA[a.ability.name] ?? a.ability.name
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
    if (!pokemon.pokeapi_slug) { fail++; continue }

    try {
      const abilities = await fetchAbilities(pokemon.pokeapi_slug)
      const { error: upErr } = await supabase
        .from('available_pokemon')
        .update(abilities)
        .eq('id', pokemon.id)

      if (upErr) throw upErr
      console.log(`✓ ${pokemon.name_ja} → ${abilities.ability1} / ${abilities.ability2 ?? '-'} / ${abilities.ability_hidden ?? '-'}`)
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
