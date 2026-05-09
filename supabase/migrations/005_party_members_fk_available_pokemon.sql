-- party_members.pokemon_id を available_pokemon.id に紐付ける
ALTER TABLE party_members
  ADD CONSTRAINT party_members_pokemon_id_fkey
  FOREIGN KEY (pokemon_id) REFERENCES available_pokemon(id);
