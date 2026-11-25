// Generated from the Supabase schema (project fjiaigbdmtpfkqlatfdv). Do not edit by hand.
// Regenerate with: npm run db:types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      active_tournament_player: {
        Row: {
          confirmed: boolean
          created_at: string
          id: number
          player_id: number
          tournament_id: number
        }
        Insert: {
          confirmed?: boolean
          created_at?: string
          id?: number
          player_id: number
          tournament_id: number
        }
        Update: {
          confirmed?: boolean
          created_at?: string
          id?: number
          player_id?: number
          tournament_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "active_tournament_player_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "premier_players"
            referencedColumns: ["premier_id"]
          },
          {
            foreignKeyName: "active_tournament_player_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      active_tournament_player_match_stats: {
        Row: {
          created_at: string
          games_played: number
          games_won: number
          id: number
          match_id: number
          player_id: number
          tournament_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          games_played?: number
          games_won?: number
          id?: number
          match_id: number
          player_id: number
          tournament_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          games_played?: number
          games_won?: number
          id?: number
          match_id?: number
          player_id?: number
          tournament_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_tournament_player_match_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "active_tournaments_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_tournament_player_match_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "premier_players"
            referencedColumns: ["premier_id"]
          },
          {
            foreignKeyName: "active_tournament_player_match_stats_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      active_tournaments_matches: {
        Row: {
          completed: boolean
          created_at: string
          id: number
          player1_id: number
          player2_id: number | null
          round_id: number
          score1: number | null
          score2: number | null
          tournament_id: number
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: number
          player1_id: number
          player2_id?: number | null
          round_id: number
          score1?: number | null
          score2?: number | null
          tournament_id: number
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: number
          player1_id?: number
          player2_id?: number | null
          round_id?: number
          score1?: number | null
          score2?: number | null
          tournament_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_tournaments_matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "premier_players"
            referencedColumns: ["premier_id"]
          },
          {
            foreignKeyName: "active_tournaments_matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "premier_players"
            referencedColumns: ["premier_id"]
          },
          {
            foreignKeyName: "active_tournaments_matches_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "active_tournaments_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_tournaments_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      active_tournaments_rounds: {
        Row: {
          created_at: string
          format: string
          id: number
          is_extra_round: boolean
          round_number: number
          subformat_id: number | null
          tournament_id: number
        }
        Insert: {
          created_at?: string
          format: string
          id?: number
          is_extra_round?: boolean
          round_number: number
          subformat_id?: number | null
          tournament_id: number
        }
        Update: {
          created_at?: string
          format?: string
          id?: number
          is_extra_round?: boolean
          round_number?: number
          subformat_id?: number | null
          tournament_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "active_tournaments_rounds_subformat_id_fkey"
            columns: ["subformat_id"]
            isOneToOne: false
            referencedRelation: "game_subformats"
            referencedColumns: ["subformat_id"]
          },
          {
            foreignKeyName: "active_tournaments_rounds_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      allowed_emails: {
        Row: {
          added_at: string | null
          email: string
          note: string | null
          premier_id: number | null
        }
        Insert: {
          added_at?: string | null
          email: string
          note?: string | null
          premier_id?: number | null
        }
        Update: {
          added_at?: string | null
          email?: string
          note?: string | null
          premier_id?: number | null
        }
        Relationships: []
      }
      archived_tournaments_matches: {
        Row: {
          completed: boolean
          created_at: string
          id: number
          player1_id: number
          player2_id: number | null
          round_id: number
          score1: number | null
          score2: number | null
          tournament_id: number
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: number
          player1_id: number
          player2_id?: number | null
          round_id: number
          score1?: number | null
          score2?: number | null
          tournament_id: number
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: number
          player1_id?: number
          player2_id?: number | null
          round_id?: number
          score1?: number | null
          score2?: number | null
          tournament_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "archived_tournaments_matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "premier_players"
            referencedColumns: ["premier_id"]
          },
          {
            foreignKeyName: "archived_tournaments_matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "premier_players"
            referencedColumns: ["premier_id"]
          },
          {
            foreignKeyName: "archived_tournaments_matches_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "archived_tournaments_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archived_tournaments_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      archived_tournaments_rounds: {
        Row: {
          created_at: string
          format: string
          id: number
          is_extra_round: boolean
          round_number: number
          subformat_id: number | null
          tournament_id: number
        }
        Insert: {
          created_at?: string
          format: string
          id?: number
          is_extra_round?: boolean
          round_number: number
          subformat_id?: number | null
          tournament_id: number
        }
        Update: {
          created_at?: string
          format?: string
          id?: number
          is_extra_round?: boolean
          round_number?: number
          subformat_id?: number | null
          tournament_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "archived_tournaments_rounds_subformat_id_fkey"
            columns: ["subformat_id"]
            isOneToOne: false
            referencedRelation: "game_subformats"
            referencedColumns: ["subformat_id"]
          },
          {
            foreignKeyName: "archived_tournaments_rounds_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      archived_tournaments_standings: {
        Row: {
          created_at: string
          final_position: number | null
          id: number
          losses: number
          matches_played: number
          player_id: number
          points: number
          ties: number
          total_matches: number
          total_points_scored: number
          tournament_id: number
          wins: number
        }
        Insert: {
          created_at?: string
          final_position?: number | null
          id?: number
          losses?: number
          matches_played?: number
          player_id: number
          points?: number
          ties?: number
          total_matches?: number
          total_points_scored?: number
          tournament_id: number
          wins?: number
        }
        Update: {
          created_at?: string
          final_position?: number | null
          id?: number
          losses?: number
          matches_played?: number
          player_id?: number
          points?: number
          ties?: number
          total_matches?: number
          total_points_scored?: number
          tournament_id?: number
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "archived_tournaments_standings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "premier_players"
            referencedColumns: ["premier_id"]
          },
          {
            foreignKeyName: "archived_tournaments_standings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      format_documents: {
        Row: {
          content: string
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      game_formats: {
        Row: {
          created_at: string
          format_acronym: string | null
          format_id: number
          format_name: string | null
          id: number
        }
        Insert: {
          created_at?: string
          format_acronym?: string | null
          format_id: number
          format_name?: string | null
          id?: number
        }
        Update: {
          created_at?: string
          format_acronym?: string | null
          format_id?: number
          format_name?: string | null
          id?: number
        }
        Relationships: []
      }
      game_subformats: {
        Row: {
          created_at: string
          id: number
          subformat_id: number
          subformat_name: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          subformat_id: number
          subformat_name?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          subformat_id?: number
          subformat_name?: string | null
        }
        Relationships: []
      }
      info_documents: {
        Row: {
          content: string
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      monthly_banlists: {
        Row: {
          banned_cards: Json
          created_at: string
          created_by: string | null
          format: string
          id: number
          limited_x1_cards: Json
          limited_x2_cards: Json
          month: number
          updated_at: string
          updated_by: string | null
          year: number
        }
        Insert: {
          banned_cards?: Json
          created_at?: string
          created_by?: string | null
          format: string
          id?: number
          limited_x1_cards?: Json
          limited_x2_cards?: Json
          month: number
          updated_at?: string
          updated_by?: string | null
          year: number
        }
        Update: {
          banned_cards?: Json
          created_at?: string
          created_by?: string | null
          format?: string
          id?: number
          limited_x1_cards?: Json
          limited_x2_cards?: Json
          month?: number
          updated_at?: string
          updated_by?: string | null
          year?: number
        }
        Relationships: []
      }
      premier_players: {
        Row: {
          created_at: string
          display_name: string | null
          id: number
          premier_id: number
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: number
          premier_id: number
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: number
          premier_id?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          favorite_format: string | null
          favorite_races: Json
          id: string
          is_public: boolean
          premier_player_id: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          favorite_format?: string | null
          favorite_races?: Json
          id: string
          is_public?: boolean
          premier_player_id?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          favorite_format?: string | null
          favorite_races?: Json
          id?: string
          is_public?: boolean
          premier_player_id?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      tournament_venues: {
        Row: {
          address: string
          created_at: string
          id: number
          name: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: never
          name: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: never
          name?: string
        }
        Relationships: []
      }
      tournament_player_races: {
        Row: {
          created_at: string
          id: number
          player_id: number
          race_format1: string | null
          race_format2: string | null
          tournament_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          player_id: number
          race_format1?: string | null
          race_format2?: string | null
          tournament_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          player_id?: number
          race_format1?: string | null
          race_format2?: string | null
          tournament_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_player_races_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "premier_players"
            referencedColumns: ["premier_id"]
          },
          {
            foreignKeyName: "tournament_player_races_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          archived_at: string | null
          created_at: string
          end_date: string | null
          format: string
          id: number
          is_active: boolean
          location_address: string | null
          location_name: string | null
          month: string
          name: string
          pairing_mode: string
          start_date: string | null
          subformat1_id: number | null
          subformat2_id: number | null
          tournament_type: string
          year: number
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          end_date?: string | null
          format: string
          id?: number
          is_active?: boolean
          location_address?: string | null
          location_name?: string | null
          month: string
          name: string
          pairing_mode?: string
          start_date?: string | null
          subformat1_id?: number | null
          subformat2_id?: number | null
          tournament_type: string
          year: number
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          end_date?: string | null
          format?: string
          id?: number
          is_active?: boolean
          location_address?: string | null
          location_name?: string | null
          month?: string
          name?: string
          pairing_mode?: string
          start_date?: string | null
          subformat1_id?: number | null
          subformat2_id?: number | null
          tournament_type?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_subformat1_id_fkey"
            columns: ["subformat1_id"]
            isOneToOne: false
            referencedRelation: "game_subformats"
            referencedColumns: ["subformat_id"]
          },
          {
            foreignKeyName: "tournaments_subformat2_id_fkey"
            columns: ["subformat2_id"]
            isOneToOne: false
            referencedRelation: "game_subformats"
            referencedColumns: ["subformat_id"]
          },
        ]
      }
      user_collections: {
        Row: {
          card_id: number
          copy_count: number
          created_at: string | null
          format: string
          id: number
          user_id: string
        }
        Insert: {
          card_id: number
          copy_count?: number
          created_at?: string | null
          format: string
          id?: number
          user_id: string
        }
        Update: {
          card_id?: number
          copy_count?: number
          created_at?: string | null
          format?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      user_collections_v2: {
        Row: {
          cards: Json
          format: string
          user_id: string
        }
        Insert: {
          cards?: Json
          format: string
          user_id: string
        }
        Update: {
          cards?: Json
          format?: string
          user_id?: string
        }
        Relationships: []
      }
      user_decks: {
        Row: {
          cards: Json
          created_at: string
          format: string
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cards?: Json
          created_at?: string
          format: string
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cards?: Json
          created_at?: string
          format?: string
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites_v2: {
        Row: {
          cards: Json
          format: string
          user_id: string
        }
        Insert: {
          cards?: Json
          format: string
          user_id: string
        }
        Update: {
          cards?: Json
          format?: string
          user_id?: string
        }
        Relationships: []
      }
      user_wishlist_v2: {
        Row: {
          cards: Json
          format: string
          user_id: string
        }
        Insert: {
          cards?: Json
          format: string
          user_id: string
        }
        Update: {
          cards?: Json
          format?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_tournament_standings: {
        Row: {
          display_name: string | null
          losses: number | null
          matches_played: number | null
          player_id: number | null
          points: number | null
          ties: number | null
          total_matches: number | null
          total_points_scored: number | null
          tournament_id: number | null
          wins: number | null
        }
        Relationships: [
          {
            foreignKeyName: "active_tournament_player_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "premier_players"
            referencedColumns: ["premier_id"]
          },
          {
            foreignKeyName: "active_tournament_player_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      append_active_round: { Args: { p_round: Json }; Returns: undefined }
      archive_active_tournament: {
        Args: { p_standings: Json }
        Returns: number
      }
      clear_active_tournament: {
        Args: { p_clear_players: boolean }
        Returns: undefined
      }
      create_tournament: {
        Args: {
          p_end_date: string
          p_format: string
          p_location_address: string
          p_location_name: string
          p_month: string
          p_name: string
          p_player_ids: number[]
          p_start_date: string
          p_subformat1_id: number
          p_subformat2_id: number
          p_tournament_type: string
          p_year: number
        }
        Returns: number
      }
      delete_active_round: { Args: { p_round_number: number }; Returns: undefined }
      is_email_allowed: { Args: { p_email: string }; Returns: boolean }
      is_tournament_admin: { Args: never; Returns: boolean }
      replace_active_fixture: { Args: { p_rounds: Json }; Returns: undefined }
      set_active_pairing_mode: { Args: { p_mode: string }; Returns: undefined }
      set_active_player_confirmed: {
        Args: { p_confirmed: boolean; p_player_id: number }
        Returns: undefined
      }
      sync_tournament_sequences: { Args: never; Returns: undefined }
      update_active_tournament: {
        Args: {
          p_end_date: string
          p_format: string
          p_location_address: string
          p_location_name: string
          p_month: string
          p_name: string
          p_player_ids: number[]
          p_start_date: string
          p_subformat1_id: number
          p_subformat2_id: number
          p_tournament_type: string
          p_year: number
        }
        Returns: undefined
      }
      update_match_score: {
        Args: { p_match_id: number; p_score1: number; p_score2: number }
        Returns: undefined
      }
      upsert_player_race: {
        Args: {
          p_player_id: number
          p_race_format1: string
          p_race_format2: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
