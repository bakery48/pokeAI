export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      pokemon_master: {
        Row: {
          id: number
          name_ja: string
          name_en: string
          type1: string
          type2: string | null
          base_hp: number
          base_atk: number
          base_def: number
          base_spatk: number
          base_spdef: number
          base_spe: number
          can_mega: boolean
          mega_id: number | null
        }
        Insert: Omit<Database['public']['Tables']['pokemon_master']['Row'], never>
        Update: Partial<Database['public']['Tables']['pokemon_master']['Row']>
      }
      parties: {
        Row: {
          id: string
          user_id: string
          name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['parties']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['parties']['Row'], 'id'>>
      }
      party_members: {
        Row: {
          id: string
          party_id: string
          slot: number
          pokemon_id: number
          nickname: string | null
          item: string | null
          ability: string | null
          role: string | null
          is_mega: boolean
          move1: string | null
          move2: string | null
          move3: string | null
          move4: string | null
          ev_hp: number
          ev_atk: number
          ev_def: number
          ev_spatk: number
          ev_spdef: number
          ev_spe: number
          nature: string | null
        }
        Insert: Omit<Database['public']['Tables']['party_members']['Row'], 'id'>
        Update: Partial<Omit<Database['public']['Tables']['party_members']['Row'], 'id'>>
      }
      battles: {
        Row: {
          id: string
          user_id: string
          party_id: string | null
          result: 'win' | 'loss' | 'unknown' | null
          opponent_p1: number | null
          opponent_p2: number | null
          opponent_p3: number | null
          opponent_p4: number | null
          opponent_p5: number | null
          opponent_p6: number | null
          my_selection1: number | null
          my_selection2: number | null
          my_selection3: number | null
          memo: string | null
          ai_analysis: string | null
          defeat_reason: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['battles']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['battles']['Row'], 'id'>>
      }
      turn_logs: {
        Row: {
          id: string
          battle_id: string
          turn_number: number
          my_pokemon_id: number | null
          my_hp_pct: number | null
          opp_pokemon_id: number | null
          opp_hp_pct: number | null
          ai_prediction: string | null
          ai_recommendation: string | null
          ai_win_route: string | null
          actual_move: string | null
          damage_dealt: number | null
          damage_received: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['turn_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['turn_logs']['Row'], 'id'>>
      }
      ev_estimates: {
        Row: {
          id: string
          battle_id: string | null
          pokemon_id: number
          observed_damage: number | null
          attacker_id: number | null
          move_used: string | null
          estimated_ev_def: number | null
          estimated_ev_spdef: number | null
          estimated_item: string | null
          confidence: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ev_estimates']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['ev_estimates']['Row'], 'id'>>
      }
      meta_notes: {
        Row: {
          id: string
          user_id: string
          week_start: string
          content: string
          top_threats: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['meta_notes']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['meta_notes']['Row'], 'id'>>
      }
    }
    Functions: {
      get_weak_opponents: {
        Args: { p_user_id: string; p_limit: number }
        Returns: { pokemon_id: number; name_ja: string; loss_count: number }[]
      }
    }
  }
}
