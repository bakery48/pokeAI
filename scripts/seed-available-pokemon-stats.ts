/**
 * available_pokemon テーブルに種族値・タイプを投入するスクリプト
 * 実行方法: npx tsx scripts/seed-available-pokemon-stats.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TYPE_JA: Record<string, string> = {
  normal: 'ノーマル', fire: 'ほのお', water: 'みず', electric: 'でんき',
  grass: 'くさ', ice: 'こおり', fighting: 'かくとう', poison: 'どく',
  ground: 'じめん', flying: 'ひこう', psychic: 'エスパー', bug: 'むし',
  rock: 'いわ', ghost: 'ゴースト', dragon: 'ドラゴン', dark: 'あく',
  steel: 'はがね', fairy: 'フェアリー',
}

// 日本語名 → PokeAPI スラッグ
const NAME_MAP: Record<string, string> = {
  'フシギバナ': 'venusaur',
  'メガフシギバナ': 'venusaur-mega',
  'リザードン': 'charizard',
  'メガリザードンX': 'charizard-mega-x',
  'メガリザードンY': 'charizard-mega-y',
  'カメックス': 'blastoise',
  'メガカメックス': 'blastoise-mega',
  'スピアー': 'beedrill',
  'メガスピアー': 'beedrill-mega',
  'ピジョット': 'pidgeot',
  'メガピジョット': 'pidgeot-mega',
  'アーボック': 'arbok',
  'ピカチュウ': 'pikachu',
  'ライチュウ': 'raichu',
  'アローラライチュウ': 'raichu-alola',
  'ピクシー': 'clefable',
  'メガピクシー': 'clefable',
  'キュウコン': 'ninetales',
  'アローラキュウコン': 'ninetales-alola',
  'ウインディ': 'arcanine',
  'ヒスイウインディ': 'arcanine-hisui',
  'フーディン': 'alakazam',
  'メガフーディン': 'alakazam-mega',
  'カイリキー': 'machamp',
  'ウツボット': 'victreebel',
  'メガウツボット': 'victreebel',
  'ヤドラン': 'slowbro',
  'ガラルヤドラン': 'slowbro-galar',
  'メガヤドラン': 'slowbro-mega',
  'ゲンガー': 'gengar',
  'メガゲンガー': 'gengar-mega',
  'ガルーラ': 'kangaskhan',
  'メガガルーラ': 'kangaskhan-mega',
  'スターミー': 'starmie',
  'メガスターミー': 'starmie',
  'カイロス': 'pinsir',
  'メガカイロス': 'pinsir-mega',
  'ケンタロス': 'tauros',
  'パルデアケンタロス': 'tauros-paldea-combat-breed',
  'ギャラドス': 'gyarados',
  'メガギャラドス': 'gyarados-mega',
  'メタモン': 'ditto',
  'シャワーズ': 'vaporeon',
  'サンダース': 'jolteon',
  'ブースター': 'flareon',
  'プテラ': 'aerodactyl',
  'メガプテラ': 'aerodactyl-mega',
  'カビゴン': 'snorlax',
  'カイリュー': 'dragonite',
  'メガカイリュー': 'dragonite',
  'メガニウム': 'meganium',
  'メガメガニウム': 'meganium',
  'バクフーン': 'typhlosion',
  'ヒスイバクフーン': 'typhlosion-hisui',
  'オーダイル': 'feraligatr',
  'メガオーダイル': 'feraligatr',
  'アリアドス': 'ariados',
  'デンリュウ': 'ampharos',
  'メガデンリュウ': 'ampharos-mega',
  'マリルリ': 'azumarill',
  'ニョロトノ': 'politoed',
  'エーフィ': 'espeon',
  'ブラッキー': 'umbreon',
  'ヤドキング': 'slowking',
  'ガラルヤドキング': 'slowking-galar',
  'フォレトス': 'forretress',
  'ハガネール': 'steelix',
  'メガハガネール': 'steelix-mega',
  'ハッサム': 'scizor',
  'メガハッサム': 'scizor-mega',
  'ヘラクロス': 'heracross',
  'メガヘラクロス': 'heracross-mega',
  'エアームド': 'skarmory',
  'メガエアームド': 'skarmory',
  'ヘルガー': 'houndoom',
  'メガヘルガー': 'houndoom-mega',
  'バンギラス': 'tyranitar',
  'メガバンギラス': 'tyranitar-mega',
  'ペリッパー': 'pelipper',
  'サーナイト': 'gardevoir',
  'メガサーナイト': 'gardevoir-mega',
  'ヤミラミ': 'sableye',
  'メガヤミラミ': 'sableye-mega',
  'ボスゴドラ': 'aggron',
  'メガボスゴドラ': 'aggron-mega',
  'チャーレム': 'medicham',
  'メガチャーレム': 'medicham-mega',
  'ライボルト': 'manectric',
  'メガライボルト': 'manectric-mega',
  'サメハダー': 'sharpedo',
  'メガサメハダー': 'sharpedo-mega',
  'バクーダ': 'camerupt',
  'メガバクーダ': 'camerupt-mega',
  'コータス': 'torkoal',
  'チルタリス': 'altaria',
  'メガチルタリス': 'altaria-mega',
  'ミロカロス': 'milotic',
  'ポワルン': 'castform',
  'ジュペッタ': 'shuppet',
  'メガジュペッタ': 'banette-mega',
  'チリーン': 'chimecho',
  'メガチリーン': 'chimecho',
  'アブソル': 'absol',
  'メガアブソル': 'absol-mega',
  'オニゴーリ': 'glalie',
  'メガオニゴーリ': 'glalie-mega',
  'ドダイトス': 'torterra',
  'ゴウカザル': 'infernape',
  'エンペルト': 'empoleon',
  'レントラー': 'luxray',
  'ロズレイド': 'roserade',
  'ラムパルド': 'rampardos',
  'トリデプス': 'bastiodon',
  'ミミロップ': 'lopunny',
  'メガミミロップ': 'lopunny-mega',
  'ミカルゲ': 'spiritomb',
  'ガブリアス': 'garchomp',
  'メガガブリアス': 'garchomp-mega',
  'ルカリオ': 'lucario',
  'メガルカリオ': 'lucario-mega',
  'カバルドン': 'hippowdon',
  'ドクロッグ': 'toxicroak',
  'ユキノオー': 'abomasnow',
  'メガユキノオー': 'abomasnow-mega',
  'マニューラ': 'weavile',
  'ドサイドン': 'rhyperior',
  'リーフィア': 'leafeon',
  'グレイシア': 'glaceon',
  'グライオン': 'gliscor',
  'マンムー': 'mamoswine',
  'エルレイド': 'gallade',
  'メガエルレイド': 'gallade-mega',
  'ユキメノコ': 'froslass',
  'メガユキメノコ': 'froslass',
  'ロトム': 'rotom',
  'ヒートロトム': 'rotom-heat',
  'ウォッシュロトム': 'rotom-wash',
  'フロストロトム': 'rotom-frost',
  'スピンロトム': 'rotom-fan',
  'カットロトム': 'rotom-mow',
  'ジャローダ': 'serperior',
  'エンブオー': 'emboar',
  'メガエンブオー': 'emboar',
  'ダイケンキ': 'samurott',
  'ヒスイダイケンキ': 'samurott-hisui',
  'ミルホッグ': 'watchog',
  'レパルダス': 'liepard',
  'ヤナッキー': 'simisage',
  'バオッキー': 'simisear',
  'ヒヤッキー': 'simipour',
  'ドリュウズ': 'excadrill',
  'メガドリュウズ': 'excadrill',
  'タブンネ': 'audino',
  'メガタブンネ': 'audino-mega',
  'ローブシン': 'conkeldurr',
  'エルフーン': 'whimsicott',
  'ワルビアル': 'krookodile',
  'デスカーン': 'cofagrigus',
  'ダストダス': 'garbodor',
  'ゾロアーク': 'zoroark',
  'ヒスイゾロアーク': 'zoroark-hisui',
  'ランクルス': 'reuniclus',
  'バイバニラ': 'vanilluxe',
  'エモンガ': 'emolga',
  'シャンデラ': 'chandelure',
  'メガシャンデラ': 'chandelure',
  'ツンベアー': 'beartic',
  'マッギョ': 'stunfisk',
  'ガラルマッギョ': 'stunfisk-galar',
  'ゴルーグ': 'golurk',
  'メガゴルーグ': 'golurk',
  'サザンドラ': 'hydreigon',
  'ウルガモス': 'volcarona',
  'ブリガロン': 'chesnaught',
  'メガブリガロン': 'chesnaught',
  'マフォクシー': 'delphox',
  'メガマフォクシー': 'delphox',
  'ゲッコウガ': 'greninja',
  'メガゲッコウガ': 'greninja',
  'ホルード': 'diggersby',
  'ファイアロー': 'talonflame',
  'ビビヨン': 'vivillon',
  'メガフラエッテ': 'florges',
  'フラージェス': 'florges',
  'ゴロンダ': 'pangoro',
  'トリミアン': 'furfrou',
  'ニャオニクス': 'meowstic-male',
  'メガニャオニクス': 'meowstic-male',
  'ギルガルド': 'aegislash-shield',
  'フレフワン': 'sylveon',
  'ペロリーム': 'slurpuff',
  'ブロスター': 'clawitzer',
  'エレザード': 'heliolisk',
  'ガチゴラス': 'tyrantrum',
  'アマルルガ': 'aurorus',
  'ニンフィア': 'sylveon',
  'ルチャブル': 'hawlucha',
  'メガルチャブル': 'hawlucha',
  'デデンネ': 'dedenne',
  'ヌメルゴン': 'goodra',
  'ヒスイヌメルゴン': 'goodra-hisui',
  'クレッフィ': 'klefki',
  'オーロット': 'trevenant',
  'パンプジン': 'gourgeist-average',
  'クレベース': 'avalugg',
  'ヒスイクレベース': 'avalugg-hisui',
  'オンバーン': 'noivern',
  'ジュナイパー': 'decidueye',
  'ヒスイジュナイパー': 'decidueye-hisui',
  'ガオガエン': 'incineroar',
  'アシレーヌ': 'primarina',
  'ドデカバシ': 'toucannon',
  'ケケンカニ': 'crabominable',
  'メガケケンカニ': 'crabominable',
  '真昼ルガルガン': 'lycanroc-midday',
  '黄昏ルガルガン': 'lycanroc-dusk',
  '真夜中ルガルガン': 'lycanroc-midnight',
  'ドヒドイデ': 'toxapex',
  'バンバドロ': 'mudsdale',
  'オニシズクモ': 'araquanid',
  'エンニュート': 'salazzle',
  'アマージョ': 'tsareena',
  'ヤレユータン': 'oranguru',
  'ナゲツケサル': 'passimian',
  'ミミッキュ': 'mimikyu-disguised',
  'ジジーロン': 'drampa',
  'メガジジーロン': 'drampa',
  'ジャラランガ': 'kommo-o',
  'アーマーガア': 'corviknight',
  'アップリュー': 'flapple',
  'タルップル': 'appletun',
  'サダイジャ': 'sandaconda',
  'ポットデス': 'polteageist',
  'ブリムオン': 'hatterene',
  'バリコオル': 'barraskewda',
  'デスバーン': 'cursola',
  'マホイップ': 'alcremie',
  'モルペコ': 'morpeko-full-belly',
  'ドラパルト': 'dragapult',
  'アヤシシ': 'wyrdeer',
  'バサギリ': 'kleavor',
  'オオニューラ': 'sneasler',
  'マスカーニャ': 'meowscarada',
  'ラウドボーン': 'skeledirge',
  'ウェーニバル': 'quaquaval',
  'イッカネズミ': 'maushold-family-of-four',
  'キョジオーン': 'garganacl',
  'グレンアルマ': 'armarouge',
  'ソウブレイズ': 'ceruledge',
  'ハラバリー': 'bellibolt',
  'スコヴィラン': 'scovillain',
  'メガスコヴィラン': 'scovillain',
  'クエスパトラ': 'espathra',
  'デカヌチャン': 'tinkaton',
  'イルカマン': 'palafin-zero',
  'ミミズズ': 'orthworm',
  'キラフロル': 'glimmora',
  'メガキラフロル': 'glimmora',
  'リキキリン': 'farigiraf',
  'ドドゲザン': 'kingambit',
  'ヤバソチャ': 'poltchageist',
  'ブリジュラス': 'duraludon',
  'カミツオロチ': 'hydrapple',
}

async function fetchStats(slug: string): Promise<{
  type1: string; type2: string | null
  hp: number; atk: number; def: number; spatk: number; spdef: number; spe: number
} | null> {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`)
    if (!res.ok) return null
    const data = await res.json()

    const statsMap = Object.fromEntries(data.stats.map((s: any) => [s.stat.name, s.base_stat]))
    const type1 = TYPE_JA[data.types[0]?.type.name] ?? data.types[0]?.type.name
    const type2 = data.types[1] ? (TYPE_JA[data.types[1].type.name] ?? data.types[1].type.name) : null

    return {
      type1, type2,
      hp: statsMap['hp'],
      atk: statsMap['attack'],
      def: statsMap['defense'],
      spatk: statsMap['special-attack'],
      spdef: statsMap['special-defense'],
      spe: statsMap['speed'],
    }
  } catch {
    return null
  }
}

async function main() {
  const entries = Object.entries(NAME_MAP)
  console.log(`${entries.length}匹の種族値を取得します...`)

  let success = 0
  let failed: string[] = []

  for (const [nameJa, slug] of entries) {
    const stats = await fetchStats(slug)

    if (!stats) {
      console.warn(`  ✗ ${nameJa} (${slug}) - 取得失敗`)
      failed.push(nameJa)
      continue
    }

    const { error } = await supabase
      .from('available_pokemon')
      .update({
        type1: stats.type1,
        type2: stats.type2,
        base_hp: stats.hp,
        base_atk: stats.atk,
        base_def: stats.def,
        base_spatk: stats.spatk,
        base_spdef: stats.spdef,
        base_spe: stats.spe,
        pokeapi_slug: slug,
      })
      .eq('name_ja', nameJa)

    if (error) {
      console.warn(`  ✗ ${nameJa} - DB更新失敗: ${error.message}`)
      failed.push(nameJa)
    } else {
      console.log(`  ✓ ${nameJa} (${stats.type1}${stats.type2 ? '/' + stats.type2 : ''}) HP:${stats.hp} 攻:${stats.atk} 防:${stats.def} 特攻:${stats.spatk} 特防:${stats.spdef} 速:${stats.spe}`)
      success++
    }

    // レート制限対策
    await new Promise(r => setTimeout(r, 150))
  }

  console.log(`\n完了: ${success}匹成功`)
  if (failed.length > 0) {
    console.log(`失敗: ${failed.join(', ')}`)
  }
}

main().catch(console.error)
