# PokeAI システム概要

ポケモンチャンピオンズ向けの対戦コーチング Web アプリ。  
**Anthropic API は使用しない。** Claude.ai に貼り付けるプロンプトを生成してコピーする設計。

---

## 技術スタック

| 要素 | 内容 |
|------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| スタイル | Tailwind CSS v4 |
| DB / Auth | Supabase (PostgreSQL + Google OAuth) |
| AI | Claude.ai へのコピペ（API 呼び出しなし） |

---

## 画面構成

```
/ (ダッシュボード)
  パーティ数・勝率・直近対戦の概要

/party
  パーティ一覧

/party/new
/party/[id]
  パーティ登録・編集
  ポケモン名検索（ひらがな対応）/ 持ち物・技オートコンプリート / 特性プルダウン

/battle
  対戦履歴 + 新規対戦開始

/battle/[id]
  対戦中アドバイス
  選出提案プロンプト生成 → コピー → Claude.ai
  ターンごとの行動提案プロンプト生成 → コピー → Claude.ai

/review/[id]
  対戦後レビュー
  振り返りプロンプト生成 → コピー → Claude.ai
```

---

## DB テーブル構成

```
available_pokemon          ← ポケチャン登場ポケモン（約260匹）
  id, name_ja, pokeapi_slug
  type1, type2
  base_hp/atk/def/spatk/spdef/spe
  ability1, ability2, ability_hidden

parties                    ← ユーザーのパーティ
  id, user_id, name, is_active

party_members              ← パーティメンバー（最大6匹）
  id, party_id, slot
  pokemon_id → available_pokemon.id
  nickname, item, ability, role, nature, is_mega
  move1-4, ev_hp/atk/def/spatk/spdef/spe

battles                    ← 対戦記録
  id, user_id, party_id
  opponent_party (JSON), result, memo, battle_date

turn_logs                  ← ターンログ（任意）
  id, battle_id, turn_number, my_action, opponent_action, memo

ev_estimates               ← 対戦相手の努力値推定メモ
meta_notes                 ← 環境メモ
```

マイグレーション順:
```
001_initial_schema.sql
002_rls_policies.sql
003_available_pokemon.sql
004_available_pokemon_stats.sql
005_party_members_fk_available_pokemon.sql
006_available_pokemon_abilities.sql
```

---

## プロンプト生成フロー

```
ユーザー操作
    ↓
context-builder.ts        ← パーティ・対戦状況を Supabase から取得
    +
静的知識DB（lib/data/）   ← タイプ相性 / 技DB / 特性DB / 持ち物 / バトル理論 等
    ↓
prompts.ts                ← 目的別プロンプト組み立て
    ↓
CopyPromptButton          ← クリップボードへコピー
    ↓
ユーザーが Claude.ai に貼り付け
```

---

## 静的知識DB（lib/data/）

| ファイル | 内容 |
|----------|------|
| `type-chart.ts` | 18タイプ相性表（2倍/半減/無効） |
| `damage-formula.ts` | ダメージ計算式・全補正 |
| `stat-formula.ts` | 種族値→実数値変換・努力値逆算 |
| `moves.ts` | 技DB（約300技、タイプ/分類/威力/命中/備考） |
| `abilities.ts` | 特性DB（約80特性、カテゴリ別） |
| `battle-conditions.ts` | 持ち物/天候/場の状態（ポケチャン限定品目） |
| `battle-theory.ts` | 環境考察/構築/選出/行動選択の考え方 |
| `item-names.ts` | 持ち物名リスト（オートコンプリート用） |
| `move-names.ts` | 技名リスト（オートコンプリート用） |

---

## API エンドポイント

| メソッド | パス | 内容 |
|----------|------|------|
| GET | `/api/available-pokemon` | 使用可能ポケモン一覧（名前・タイプ・特性） |
| GET/POST | `/api/party` | パーティ一覧取得・作成 |
| GET/PUT/DELETE | `/api/party/[id]` | パーティ取得・更新・削除 |
| POST | `/api/party/analyze` | パーティ分析プロンプト生成 |
| GET/POST | `/api/battle` | 対戦履歴取得・記録作成 |
| GET/PUT | `/api/battle/[id]` | 対戦詳細取得・結果更新 |
| POST | `/api/battle/predict` | 選出/行動提案プロンプト生成 |
| POST | `/api/review` | 対戦後レビュープロンプト生成 |

---

## シードスクリプト

```bash
npm run seed:stats      # PokeAPI から種族値・タイプを取得して available_pokemon に投入
npm run seed:abilities  # PokeAPI から特性（日本語名）を取得して available_pokemon に投入
```

- `seed:stats` は `scripts/seed-available-pokemon-stats.ts` の `NAME_MAP`（日本語名 → PokeAPI スラッグ）を参照
- `seed:abilities` は `/ability/{name}` エンドポイントから日本語名を直接取得（手動マッピングなし）

---

## 環境変数

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 未実装・今後の課題

- 対戦相手ポケモンの特性/持ち物推定の精度向上
- ポケモン画像表示
- 勝率統計の詳細化（パーティ別・相手ポケモン別）
- 管理画面（available_pokemon の特性を UI から修正）
