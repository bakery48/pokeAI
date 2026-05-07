# ポケモンチャンピオンズ AIコーチングシステム 設計書

> Claude Codeへの指示書。このドキュメントをそのまま渡して実装を開始できるレベルを目指す。

---

## 0. 概要

### システムの目的
ポケモンチャンピオンズのランクバトルで勝率を上げるため、以下をAIが一貫サポートする：
1. 環境分析（使用率・流行構築の把握）
2. パーティ構築提案
3. 対戦中の選出・行動決定サポート
4. 対戦後の振り返り・改善提案

### アーキテクチャ概要
```
[Next.js フロントエンド]
        ↕
[Next.js API Routes（セマンティックレイヤー）]
        ↕
[Claude API (claude-sonnet-4-5)]
        ↕
[Supabase (PostgreSQL)]
```

### 技術スタック
| レイヤー | 技術 | 備考 |
|---|---|---|
| フロントエンド | Next.js 14 (App Router) | TypeScript |
| スタイリング | Tailwind CSS | shadcn/ui コンポーネント |
| バックエンド/API | Next.js API Routes | セマンティックレイヤーを兼ねる |
| AI | Anthropic Claude API | claude-sonnet-4-5 |
| DB | Supabase (PostgreSQL) | RLS有効 |
| 認証 | Supabase Auth | Googleログイン |
| デプロイ | Vercel | 環境変数管理もVercelで |

---

## 1. ディレクトリ構成

```
pokemon-coach/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # ダッシュボード
│   ├── party/
│   │   ├── page.tsx                # パーティ管理
│   │   └── [id]/page.tsx           # パーティ詳細
│   ├── battle/
│   │   ├── page.tsx                # 対戦開始・選出サポート
│   │   └── [id]/page.tsx           # 対戦中ターンサポート
│   └── review/
│       └── [id]/page.tsx           # 振り返り
├── app/api/
│   ├── analyze/route.ts            # 環境分析
│   ├── party/
│   │   ├── route.ts                # パーティCRUD
│   │   └── suggest/route.ts        # パーティ提案
│   ├── battle/
│   │   ├── route.ts                # 対戦記録CRUD
│   │   ├── predict/route.ts        # 選出・行動予測
│   │   └── damage/route.ts         # ダメージ計算・型推測
│   └── review/route.ts             # 振り返り分析
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # クライアント初期化
│   │   └── types.ts                # DB型定義（自動生成）
│   ├── semantic/
│   │   ├── context-builder.ts      # セマンティックレイヤーの核心
│   │   ├── query-engine.ts         # 自然言語→SQLクエリ
│   │   └── writeback-manager.ts    # 推論結果→DB保存
│   ├── pokemon/
│   │   ├── damage-calc.ts          # ダメージ計算ロジック
│   │   ├── master-data.ts          # ポケモン種族値・タイプ等
│   │   └── ev-estimator.ts         # 努力値推定ロジック
│   └── claude/
│       ├── client.ts               # Claude API クライアント
│       └── prompts.ts              # プロンプトテンプレート集
├── components/
│   ├── party/
│   │   ├── PartyCard.tsx
│   │   ├── PokemonSlot.tsx
│   │   └── MoveSelector.tsx
│   ├── battle/
│   │   ├── SelectionAdvisor.tsx    # 選出アドバイスUI
│   │   ├── TurnAdvisor.tsx         # ターンサポートUI
│   │   └── HPTracker.tsx
│   └── review/
│       └── ReviewPanel.tsx
├── types/
│   └── index.ts                    # アプリ全体の型定義
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql
        └── 002_rls_policies.sql
```

---

## 2. Supabase スキーマ設計

### マイグレーション: `001_initial_schema.sql`

```sql
-- ポケモンマスターデータ（読み取り専用）
CREATE TABLE pokemon_master (
  id          INTEGER PRIMARY KEY,  -- 全国図鑑番号
  name_ja     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  type1       TEXT NOT NULL,
  type2       TEXT,
  base_hp     INTEGER NOT NULL,
  base_atk    INTEGER NOT NULL,
  base_def    INTEGER NOT NULL,
  base_spatk  INTEGER NOT NULL,
  base_spdef  INTEGER NOT NULL,
  base_spe    INTEGER NOT NULL,
  can_mega    BOOLEAN DEFAULT false,
  mega_id     INTEGER             -- メガシンカ後のID（あれば）
);

-- ユーザーのパーティ
CREATE TABLE parties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,          -- 例: "メガガルーラ軸スタン"
  is_active   BOOLEAN DEFAULT false,  -- 現在使用中のパーティ
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- パーティ内の各ポケモン（6匹）
CREATE TABLE party_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id      UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  slot          INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 6),
  pokemon_id    INTEGER NOT NULL REFERENCES pokemon_master(id),
  nickname      TEXT,
  item          TEXT,               -- 持ち物（日本語名）
  ability       TEXT,               -- 特性
  role          TEXT,               -- 'ace' | 'lead' | 'receiver' | 'setter' | 'sweeper'
  is_mega       BOOLEAN DEFAULT false,
  -- 技（最大4つ）
  move1         TEXT,
  move2         TEXT,
  move3         TEXT,
  move4         TEXT,
  -- 努力値
  ev_hp         INTEGER DEFAULT 0 CHECK (ev_hp BETWEEN 0 AND 252),
  ev_atk        INTEGER DEFAULT 0 CHECK (ev_atk BETWEEN 0 AND 252),
  ev_def        INTEGER DEFAULT 0 CHECK (ev_def BETWEEN 0 AND 252),
  ev_spatk      INTEGER DEFAULT 0 CHECK (ev_spatk BETWEEN 0 AND 252),
  ev_spdef      INTEGER DEFAULT 0 CHECK (ev_spdef BETWEEN 0 AND 252),
  ev_spe        INTEGER DEFAULT 0 CHECK (ev_spe BETWEEN 0 AND 252),
  nature        TEXT,               -- 性格
  UNIQUE(party_id, slot)
);

-- 対戦記録
CREATE TABLE battles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_id        UUID REFERENCES parties(id),
  result          TEXT CHECK (result IN ('win', 'loss', 'unknown')),
  -- 相手パーティ（6匹）
  opponent_p1     INTEGER REFERENCES pokemon_master(id),
  opponent_p2     INTEGER REFERENCES pokemon_master(id),
  opponent_p3     INTEGER REFERENCES pokemon_master(id),
  opponent_p4     INTEGER REFERENCES pokemon_master(id),
  opponent_p5     INTEGER REFERENCES pokemon_master(id),
  opponent_p6     INTEGER REFERENCES pokemon_master(id),
  -- 自分の選出
  my_selection1   INTEGER REFERENCES pokemon_master(id),
  my_selection2   INTEGER REFERENCES pokemon_master(id),
  my_selection3   INTEGER REFERENCES pokemon_master(id),
  -- 対戦メモ・AIの敗因分析
  memo            TEXT,
  ai_analysis     TEXT,             -- AIが生成した振り返りテキスト
  defeat_reason   TEXT,             -- 'selection' | 'move' | 'party' | 'luck'
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ターンログ（対戦中の各ターンの状態・AIアドバイス）
CREATE TABLE turn_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id       UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  turn_number     INTEGER NOT NULL,
  -- 状態スナップショット
  my_pokemon_id   INTEGER REFERENCES pokemon_master(id),
  my_hp_pct       INTEGER,          -- 残りHP%
  opp_pokemon_id  INTEGER REFERENCES pokemon_master(id),
  opp_hp_pct      INTEGER,
  -- AI推論
  ai_prediction   TEXT,             -- 「相手はXXする確率が高い」
  ai_recommendation TEXT,           -- 「Yを選択すべき」
  ai_win_route    TEXT,             -- 「このまま進めばZ勝ち筋」
  -- 実際の行動
  actual_move     TEXT,
  damage_dealt    INTEGER,
  damage_received INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 型推測ログ（⑤の推測結果を蓄積）
CREATE TABLE ev_estimates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id       UUID REFERENCES battles(id) ON DELETE CASCADE,
  pokemon_id      INTEGER NOT NULL REFERENCES pokemon_master(id),
  -- 観測データ
  observed_damage INTEGER,
  attacker_id     INTEGER REFERENCES pokemon_master(id),
  move_used       TEXT,
  -- 推定結果
  estimated_ev_def  INTEGER,
  estimated_ev_spdef INTEGER,
  estimated_item  TEXT,             -- 「スカーフ確定」「珠疑惑」
  confidence      TEXT,             -- 'confirmed' | 'likely' | 'possible'
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 環境メモ（週次で更新）
CREATE TABLE meta_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL,
  content     TEXT NOT NULL,        -- AI生成 or 手動入力
  top_threats JSONB,                -- ["メガゲンガー", "ガブリアス", ...]
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_battles_user_id ON battles(user_id);
CREATE INDEX idx_battles_created_at ON battles(created_at DESC);
CREATE INDEX idx_party_members_party_id ON party_members(party_id);
CREATE INDEX idx_turn_logs_battle_id ON turn_logs(battle_id);
```

### マイグレーション: `002_rls_policies.sql`

```sql
-- RLS有効化
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE turn_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ev_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_notes ENABLE ROW LEVEL SECURITY;

-- ポリシー: 自分のデータのみ操作可能
CREATE POLICY "users_own_parties" ON parties
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_party_members" ON party_members
  FOR ALL USING (
    party_id IN (SELECT id FROM parties WHERE user_id = auth.uid())
  );

CREATE POLICY "users_own_battles" ON battles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_turn_logs" ON turn_logs
  FOR ALL USING (
    battle_id IN (SELECT id FROM battles WHERE user_id = auth.uid())
  );

CREATE POLICY "users_own_ev_estimates" ON ev_estimates
  FOR ALL USING (
    battle_id IN (SELECT id FROM battles WHERE user_id = auth.uid())
  );

CREATE POLICY "users_own_meta_notes" ON meta_notes
  FOR ALL USING (auth.uid() = user_id);

-- pokemon_masterは全員読み取り可
CREATE POLICY "pokemon_master_readable" ON pokemon_master
  FOR SELECT USING (true);
```

---

## 3. セマンティックレイヤー実装

### `lib/semantic/context-builder.ts`

```typescript
import { createClient } from '@/lib/supabase/client'

/**
 * セマンティックレイヤーの核心。
 * DBの生データをClaudeが推論しやすい自然言語コンテキストに変換する。
 */
export async function buildBattleContext(userId: string): Promise<string> {
  const supabase = createClient()

  // 1. アクティブパーティを取得
  const { data: party } = await supabase
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
    .single()

  // 2. 直近10戦の戦績
  const { data: recentBattles } = await supabase
    .from('battles')
    .select('result, defeat_reason, ai_analysis, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  // 3. 苦手な相手ポケモンを集計
  const { data: weakOpponents } = await supabase.rpc('get_weak_opponents', {
    p_user_id: userId,
    p_limit: 5
  })

  // 4. 今週の環境メモ
  const { data: metaNote } = await supabase
    .from('meta_notes')
    .select('content, top_threats')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(1)
    .single()

  // 5. 敗因パターンを集計
  const defeatReasons = recentBattles
    ?.filter(b => b.result === 'loss')
    .reduce((acc, b) => {
      if (b.defeat_reason) acc[b.defeat_reason] = (acc[b.defeat_reason] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  const winRate = recentBattles
    ? Math.round((recentBattles.filter(b => b.result === 'win').length / recentBattles.length) * 100)
    : 0

  // 6. 自然言語コンテキストを生成
  const partyDescription = party?.party_members
    ?.sort((a, b) => a.slot - b.slot)
    .map(m => {
      const p = m.pokemon_master
      const name = m.is_mega ? `メガ${p.name_ja}` : p.name_ja
      const evSummary = buildEvSummary(m)
      return `  [${m.slot}] ${name}（${m.role || '役割未設定'}）/ ${m.item || '持ち物不明'} / ${evSummary}`
    })
    .join('\n') ?? '  パーティ未登録'

  const context = `
=== AIコーチ コンテキスト ===

【使用中のパーティ: ${party?.name ?? '未設定'}】
${partyDescription}

【直近${recentBattles?.length ?? 0}戦の戦績】
  勝率: ${winRate}%
  敗因内訳: ${formatDefeatReasons(defeatReasons ?? {})}

【苦手な相手（優先的に対策すべき）】
${weakOpponents?.map((o: any) => `  - ${o.name_ja}: ${o.loss_count}敗`).join('\n') ?? '  データなし'}

【今週の環境】
${metaNote?.content ?? '  環境メモ未記録'}
${metaNote?.top_threats ? `  脅威ポケモン: ${(metaNote.top_threats as string[]).join(', ')}` : ''}

=== ここまでがコンテキスト ===
`.trim()

  return context
}

function buildEvSummary(member: any): string {
  const parts: string[] = []
  if (member.ev_atk >= 200) parts.push('攻撃特化')
  else if (member.ev_spatk >= 200) parts.push('特攻特化')
  if (member.ev_hp >= 200) parts.push('HP特化')
  if (member.ev_def >= 150) parts.push('物理耐久')
  if (member.ev_spdef >= 150) parts.push('特殊耐久')
  if (member.ev_spe >= 200) parts.push('素早さ最速')
  return parts.length > 0 ? parts.join('・') : '努力値未設定'
}

function formatDefeatReasons(reasons: Record<string, number>): string {
  const labels: Record<string, string> = {
    selection: '選出ミス',
    move: '技選択ミス',
    party: '構築の穴',
    luck: '運負け'
  }
  return Object.entries(reasons)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${labels[k] ?? k}: ${v}回`)
    .join(' / ') || 'データなし'
}
```

### `lib/semantic/context-builder.ts` の補足：Supabase RPC

```sql
-- get_weak_opponents: 敗戦時に相手にいたポケモンを集計
CREATE OR REPLACE FUNCTION get_weak_opponents(p_user_id UUID, p_limit INTEGER)
RETURNS TABLE(pokemon_id INTEGER, name_ja TEXT, loss_count BIGINT)
LANGUAGE sql AS $$
  SELECT
    pm.id AS pokemon_id,
    pm.name_ja,
    COUNT(*) AS loss_count
  FROM battles b
  CROSS JOIN LATERAL (
    VALUES (b.opponent_p1),(b.opponent_p2),(b.opponent_p3),
           (b.opponent_p4),(b.opponent_p5),(b.opponent_p6)
  ) AS opp(pid)
  JOIN pokemon_master pm ON pm.id = opp.pid
  WHERE b.user_id = p_user_id
    AND b.result = 'loss'
    AND opp.pid IS NOT NULL
  GROUP BY pm.id, pm.name_ja
  ORDER BY loss_count DESC
  LIMIT p_limit;
$$;
```

---

## 4. Claude API クライアント

### `lib/claude/client.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const CLAUDE_MODEL = 'claude-sonnet-4-5'

export interface ClaudeRequest {
  systemPrompt: string
  userMessage: string
  maxTokens?: number
}

export async function askClaude({ systemPrompt, userMessage, maxTokens = 1000 }: ClaudeRequest): Promise<string> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
}
```

### `lib/claude/prompts.ts`

```typescript
export const BASE_COACH_PROMPT = `
あなたはポケモンチャンピオンズのマスター帯AIコーチです。
以下の原則を守ってください：
- 常に具体的な行動を提案する（「Xよりも良い」ではなく「Xを使え」）
- 確率・リスクを定量的に示す（「60%の確率でスカーフ」など）
- 勝ち筋を常に1つ以上明示する
- 回答はMarkdown形式、200字以内に要約を先頭に置く
`.trim()

export function buildSelectionPrompt(context: string): string {
  return `
${BASE_COACH_PROMPT}

${context}

上記のコンテキストを踏まえ、対戦開始時の選出サポートを行います。
相手パーティを受け取ったら：
1. 最適な選出3匹を提案（理由付き）
2. 初手の推奨ポケモンと理由
3. 勝ち筋シナリオを2つ提示
`.trim()
}

export function buildTurnPrompt(context: string): string {
  return `
${BASE_COACH_PROMPT}

${context}

対戦中のターンサポートを行います。
現在の対面状況（自分のポケモン・HP・相手・HP・残り手持ち）を受け取ったら：
1. 相手の行動予測（確率付き）
2. 自分の推奨行動（第1・第2候補）
3. このターン後の勝ち筋
`.trim()
}

export function buildReviewPrompt(context: string): string {
  return `
${BASE_COACH_PROMPT}

${context}

敗戦の振り返り分析を行います。
対戦の流れを受け取ったら：
1. 敗因を1つに特定（選出/技選択/構築/運）
2. 分岐点となったターンを指摘
3. 次戦への具体的な改善案（パーティ変更案を含む）
`.trim()
}
```

---

## 5. API Routes 実装

### `app/api/battle/predict/route.ts`（選出・行動予測）

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { buildBattleContext } from '@/lib/semantic/context-builder'
import { askClaude } from '@/lib/claude/client'
import { buildSelectionPrompt, buildTurnPrompt } from '@/lib/claude/prompts'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { mode, payload } = body
  // mode: 'selection' | 'turn'

  const context = await buildBattleContext(user.id)

  let systemPrompt: string
  let userMessage: string

  if (mode === 'selection') {
    systemPrompt = buildSelectionPrompt(context)
    const opponentNames = payload.opponentParty.join('、')
    userMessage = `相手パーティ: ${opponentNames}\n\n選出と初手を教えてください。`
  } else {
    systemPrompt = buildTurnPrompt(context)
    userMessage = `
ターン${payload.turn}
自分: ${payload.myPokemon}（HP ${payload.myHp}%）
相手: ${payload.oppPokemon}（HP ${payload.oppHp}%）
自分の残り手持ち: ${payload.myRemaining.join('、')}
相手の残り手持ち: ${payload.oppRemaining.join('、')}
最善手を教えてください。
    `.trim()
  }

  const advice = await askClaude({ systemPrompt, userMessage })

  // ターンログに保存
  if (mode === 'turn' && payload.battleId) {
    await supabase.from('turn_logs').insert({
      battle_id: payload.battleId,
      turn_number: payload.turn,
      my_pokemon_id: payload.myPokemonId,
      my_hp_pct: payload.myHp,
      opp_pokemon_id: payload.oppPokemonId,
      opp_hp_pct: payload.oppHp,
      ai_recommendation: advice,
    })
  }

  return NextResponse.json({ advice })
}
```

### `app/api/review/route.ts`（振り返り）

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { buildBattleContext } from '@/lib/semantic/context-builder'
import { askClaude } from '@/lib/claude/client'
import { buildReviewPrompt } from '@/lib/claude/prompts'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { battleId } = await req.json()

  // ターンログを全件取得
  const { data: turns } = await supabase
    .from('turn_logs')
    .select('*')
    .eq('battle_id', battleId)
    .order('turn_number')

  const { data: battle } = await supabase
    .from('battles')
    .select('*, parties(name)')
    .eq('id', battleId)
    .single()

  const context = await buildBattleContext(user.id)
  const systemPrompt = buildReviewPrompt(context)

  const turnSummary = turns?.map(t =>
    `T${t.turn_number}: 自${t.my_hp_pct}% vs 相${t.opp_hp_pct}% → ${t.actual_move ?? '未記録'}`
  ).join('\n') ?? '記録なし'

  const userMessage = `
対戦結果: ${battle?.result === 'win' ? '勝利' : '敗北'}
使用パーティ: ${(battle?.parties as any)?.name}

【ターン経過】
${turnSummary}

敗因と改善点を分析してください。
  `.trim()

  const analysis = await askClaude({ systemPrompt, userMessage, maxTokens: 1500 })

  // 分析結果を保存
  await supabase.from('battles').update({
    ai_analysis: analysis,
    defeat_reason: extractDefeatReason(analysis),
  }).eq('id', battleId)

  return NextResponse.json({ analysis })
}

function extractDefeatReason(analysis: string): string {
  if (analysis.includes('選出')) return 'selection'
  if (analysis.includes('技選択') || analysis.includes('技を')) return 'move'
  if (analysis.includes('構築') || analysis.includes('パーティ')) return 'party'
  if (analysis.includes('運') || analysis.includes('乱数')) return 'luck'
  return 'unknown'
}
```

---

## 6. 環境変数

### `.env.local`（ローカル開発用テンプレート）

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # API Routes専用

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 7. 実装優先順位（Claude Codeへの作業指示）

### Phase 1: 基盤（まず動かす）
1. `npx create-next-app@latest pokemon-coach --typescript --tailwind --app` で初期化
2. Supabase プロジェクト作成 → マイグレーション実行
3. `lib/supabase/client.ts` 実装（SSR対応の公式パターンを使う）
4. Supabase Auth（Googleログイン）をセットアップ
5. `pokemon_master` テーブルにデータを投入（ポケモンSVまでの全国図鑑 + メガシンカ対応分）

### Phase 2: セマンティックレイヤー
6. `lib/semantic/context-builder.ts` 実装
7. `get_weak_opponents` RPC をSupabaseで定義
8. `lib/claude/client.ts` + `prompts.ts` 実装
9. `/api/battle/predict` エンドポイント実装・動作確認

### Phase 3: コア機能UI
10. パーティ登録UI（6匹・技・努力値を入力できるフォーム）
11. 対戦開始画面（相手パーティ入力→選出アドバイス表示）
12. ターンサポート画面（HP入力→推奨行動表示）
13. 振り返り画面（`/api/review` を呼んで分析表示）

### Phase 4: 品質向上
14. ダメージ計算ロジック実装（`lib/pokemon/damage-calc.ts`）
15. 型推測ロジック実装（`lib/pokemon/ev-estimator.ts`）
16. 環境分析ページ（使用率データをスクレイピングorAPI取得）
17. Vercel デプロイ・本番環境変数設定

---

## 8. データフロー詳細（Claude Codeが迷わないよう明記）

### 選出サポートの流れ
```
[ユーザー] 相手パーティ6匹を入力
    ↓
[POST /api/battle/predict] mode='selection'
    ↓
[buildBattleContext(userId)]
  → Supabaseから: アクティブパーティ + 直近戦績 + 苦手相手 + 環境メモ
  → 自然言語コンテキスト文字列を生成
    ↓
[askClaude(systemPrompt, "相手パーティ: ガブリアス...")]
    ↓
[レスポンス] 推奨選出3匹 + 初手 + 勝ち筋2案
```

### ターンサポートの流れ
```
[ユーザー] 現在のHP・対面状況を入力
    ↓
[POST /api/battle/predict] mode='turn'
    ↓
[buildBattleContext + ターン状況]
    ↓
[Claude推論]
    ↓
[turn_logsに保存] ← このデータが後の振り返りに使われる
    ↓
[レスポンス] 相手行動予測 + 推奨行動 + 現在の勝ち筋
```

---

## 9. 注意事項・既知の制約

- **ポケモンマスターデータ**: 種族値・タイプ・技データは自前で用意する必要がある。Pokémon APIやwikiからスクレイピングして`pokemon_master`に投入すること
- **メガシンカ**: `party_members.is_mega = true` のとき、`mega_id`を参照して種族値を上書きして計算する
- **ダメージ計算式**: 第7世代ルール（ポケモンチャンピオンズはXY/ORAS時代のルール）に基づく
- **レート制限**: Anthropic APIは1分あたりのトークン上限あり。ターンサポートで連打されるとエラーになるため、クライアント側でdebounce（1秒）を入れる
- **Supabase RLS**: `createClient()`はanon keyを使う。API Routesからサービスロールが必要な場合は`SUPABASE_SERVICE_ROLE_KEY`を使った別クライアントを作る

---

*この設計書はClaude Code (claude-sonnet-4-5) に渡して実装を開始することを想定しています。*
*Phase 1から順に「このファイルを実装して」と指示してください。*
