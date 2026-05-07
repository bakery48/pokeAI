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
