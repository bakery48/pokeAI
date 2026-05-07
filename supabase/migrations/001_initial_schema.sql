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
  name        TEXT NOT NULL,
  is_active   BOOLEAN DEFAULT false,
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
  item          TEXT,
  ability       TEXT,
  role          TEXT,
  is_mega       BOOLEAN DEFAULT false,
  move1         TEXT,
  move2         TEXT,
  move3         TEXT,
  move4         TEXT,
  ev_hp         INTEGER DEFAULT 0 CHECK (ev_hp BETWEEN 0 AND 252),
  ev_atk        INTEGER DEFAULT 0 CHECK (ev_atk BETWEEN 0 AND 252),
  ev_def        INTEGER DEFAULT 0 CHECK (ev_def BETWEEN 0 AND 252),
  ev_spatk      INTEGER DEFAULT 0 CHECK (ev_spatk BETWEEN 0 AND 252),
  ev_spdef      INTEGER DEFAULT 0 CHECK (ev_spdef BETWEEN 0 AND 252),
  ev_spe        INTEGER DEFAULT 0 CHECK (ev_spe BETWEEN 0 AND 252),
  nature        TEXT,
  UNIQUE(party_id, slot)
);

-- 対戦記録
CREATE TABLE battles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  party_id        UUID REFERENCES parties(id),
  result          TEXT CHECK (result IN ('win', 'loss', 'unknown')),
  opponent_p1     INTEGER REFERENCES pokemon_master(id),
  opponent_p2     INTEGER REFERENCES pokemon_master(id),
  opponent_p3     INTEGER REFERENCES pokemon_master(id),
  opponent_p4     INTEGER REFERENCES pokemon_master(id),
  opponent_p5     INTEGER REFERENCES pokemon_master(id),
  opponent_p6     INTEGER REFERENCES pokemon_master(id),
  my_selection1   INTEGER REFERENCES pokemon_master(id),
  my_selection2   INTEGER REFERENCES pokemon_master(id),
  my_selection3   INTEGER REFERENCES pokemon_master(id),
  memo            TEXT,
  ai_analysis     TEXT,
  defeat_reason   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ターンログ
CREATE TABLE turn_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id       UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  turn_number     INTEGER NOT NULL,
  my_pokemon_id   INTEGER REFERENCES pokemon_master(id),
  my_hp_pct       INTEGER,
  opp_pokemon_id  INTEGER REFERENCES pokemon_master(id),
  opp_hp_pct      INTEGER,
  ai_prediction   TEXT,
  ai_recommendation TEXT,
  ai_win_route    TEXT,
  actual_move     TEXT,
  damage_dealt    INTEGER,
  damage_received INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 型推測ログ
CREATE TABLE ev_estimates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id       UUID REFERENCES battles(id) ON DELETE CASCADE,
  pokemon_id      INTEGER NOT NULL REFERENCES pokemon_master(id),
  observed_damage INTEGER,
  attacker_id     INTEGER REFERENCES pokemon_master(id),
  move_used       TEXT,
  estimated_ev_def  INTEGER,
  estimated_ev_spdef INTEGER,
  estimated_item  TEXT,
  confidence      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 環境メモ
CREATE TABLE meta_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL,
  content     TEXT NOT NULL,
  top_threats JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_battles_user_id ON battles(user_id);
CREATE INDEX idx_battles_created_at ON battles(created_at DESC);
CREATE INDEX idx_party_members_party_id ON party_members(party_id);
CREATE INDEX idx_turn_logs_battle_id ON turn_logs(battle_id);

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
