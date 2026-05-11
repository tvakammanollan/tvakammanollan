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
      bug_reports: {
        Row: {
          created_at: string
          id: string
          message: string
          page: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          page?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          page?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      elo_history: {
        Row: {
          created_at: string
          elo_after: number
          elo_before: number
          elo_change: number
          id: string
          match_id: string
          match_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          elo_after: number
          elo_before: number
          elo_change: number
          id?: string
          match_id: string
          match_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          elo_after?: number
          elo_before?: number
          elo_change?: number
          id?: string
          match_id?: string
          match_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "elo_history_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elo_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      match_answers: {
        Row: {
          answered_at: string
          difficulty: number | null
          id: string
          is_correct: boolean
          is_training: boolean
          match_id: string | null
          question_id: string
          selected_answer: string | null
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          answered_at?: string
          difficulty?: number | null
          id?: string
          is_correct: boolean
          is_training?: boolean
          match_id?: string | null
          question_id: string
          selected_answer?: string | null
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          answered_at?: string
          difficulty?: number | null
          id?: string
          is_correct?: boolean
          is_training?: boolean
          match_id?: string | null
          question_id?: string
          selected_answer?: string | null
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_answers_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      match_invites: {
        Row: {
          created_at: string
          expires_at: string
          from_user: string
          id: string
          match_id: string
          match_type: string
          status: string
          to_user: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          from_user: string
          id?: string
          match_id: string
          match_type: string
          status?: string
          to_user: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          from_user?: string
          id?: string
          match_id?: string
          match_type?: string
          status?: string
          to_user?: string
        }
        Relationships: []
      }
      match_questions: {
        Row: {
          id: string
          match_id: string
          question_id: string
          question_order: number
        }
        Insert: {
          id?: string
          match_id: string
          question_id: string
          question_order: number
        }
        Update: {
          id?: string
          match_id?: string
          question_id?: string
          question_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_questions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          bot_elo: number | null
          created_at: string
          id: string
          is_bot_match: boolean
          is_ranked: boolean
          match_type: string
          player1_id: string
          player1_score: number | null
          player1_submitted_at: string | null
          player2_id: string | null
          player2_score: number | null
          player2_submitted_at: string | null
          room_code: string | null
          status: string
          winner_id: string | null
        }
        Insert: {
          bot_elo?: number | null
          created_at?: string
          id?: string
          is_bot_match?: boolean
          is_ranked?: boolean
          match_type: string
          player1_id: string
          player1_score?: number | null
          player1_submitted_at?: string | null
          player2_id?: string | null
          player2_score?: number | null
          player2_submitted_at?: string | null
          room_code?: string | null
          status?: string
          winner_id?: string | null
        }
        Update: {
          bot_elo?: number | null
          created_at?: string
          id?: string
          is_bot_match?: boolean
          is_ranked?: boolean
          match_type?: string
          player1_id?: string
          player1_score?: number | null
          player1_submitted_at?: string | null
          player2_id?: string | null
          player2_score?: number | null
          player2_submitted_at?: string | null
          room_code?: string | null
          status?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matchmaking_queue: {
        Row: {
          id: string
          joined_at: string
          match_id: string | null
          match_type: string
          player_elo: number
          player_id: string
          status: string
        }
        Insert: {
          id?: string
          joined_at?: string
          match_id?: string | null
          match_type: string
          player_elo: number
          player_id: string
          status?: string
        }
        Update: {
          id?: string
          joined_at?: string
          match_id?: string | null
          match_type?: string
          player_elo?: number
          player_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "matchmaking_queue_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchmaking_queue_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ord_practice_stats: {
        Row: {
          correct_count: number
          total_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_count?: number
          total_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_count?: number
          total_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_reports: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          question_id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          question_id: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          question_id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_reports_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          category: string
          clean_status: string
          cleaned_at: string | null
          cleaned_options: Json | null
          cleaned_question_text: string | null
          correct_answer: string
          created_at: string
          difficulty: number | null
          explanation: string | null
          id: string
          options: Json
          passage_id: string | null
          passage_text: string | null
          question_text: string
          source: string | null
          subject_type: string
          tags: string[]
        }
        Insert: {
          category: string
          clean_status?: string
          cleaned_at?: string | null
          cleaned_options?: Json | null
          cleaned_question_text?: string | null
          correct_answer: string
          created_at?: string
          difficulty?: number | null
          explanation?: string | null
          id?: string
          options: Json
          passage_id?: string | null
          passage_text?: string | null
          question_text: string
          source?: string | null
          subject_type: string
          tags?: string[]
        }
        Update: {
          category?: string
          clean_status?: string
          cleaned_at?: string | null
          cleaned_options?: Json | null
          cleaned_question_text?: string | null
          correct_answer?: string
          created_at?: string
          difficulty?: number | null
          explanation?: string | null
          id?: string
          options?: Json
          passage_id?: string | null
          passage_text?: string | null
          question_text?: string
          source?: string | null
          subject_type?: string
          tags?: string[]
        }
        Relationships: []
      }
      user_word_correct: {
        Row: {
          first_correct_at: string
          question_id: string
          user_id: string
        }
        Insert: {
          first_correct_at?: string
          question_id: string
          user_id: string
        }
        Update: {
          first_correct_at?: string
          question_id?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          bot_matches_today: number
          created_at: string
          current_streak: number
          elo_math: number
          elo_math_peak: number
          elo_verbal: number
          elo_verbal_peak: number
          email: string | null
          games_played: number
          id: string
          is_admin: boolean
          last_active_date: string | null
          last_bot_match_date: string | null
          longest_streak: number
          losses: number
          onboarding_completed: boolean
          preferred_type: string | null
          profile_public: boolean
          target_score: number | null
          username: string
          wins: number
        }
        Insert: {
          bot_matches_today?: number
          created_at?: string
          current_streak?: number
          elo_math?: number
          elo_math_peak?: number
          elo_verbal?: number
          elo_verbal_peak?: number
          email?: string | null
          games_played?: number
          id: string
          is_admin?: boolean
          last_active_date?: string | null
          last_bot_match_date?: string | null
          longest_streak?: number
          losses?: number
          onboarding_completed?: boolean
          preferred_type?: string | null
          profile_public?: boolean
          target_score?: number | null
          username: string
          wins?: number
        }
        Update: {
          bot_matches_today?: number
          created_at?: string
          current_streak?: number
          elo_math?: number
          elo_math_peak?: number
          elo_verbal?: number
          elo_verbal_peak?: number
          email?: string | null
          games_played?: number
          id?: string
          is_admin?: boolean
          last_active_date?: string | null
          last_bot_match_date?: string | null
          longest_streak?: number
          losses?: number
          onboarding_completed?: boolean
          preferred_type?: string | null
          profile_public?: boolean
          target_score?: number | null
          username?: string
          wins?: number
        }
        Relationships: []
      }
      weekly_challenge_entries: {
        Row: {
          challenge_id: string
          completed_at: string
          id: string
          player_id: string
          score: number
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          id?: string
          player_id: string
          score?: number
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          id?: string
          player_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_challenge_entries_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_challenge_entries_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_challenges: {
        Row: {
          created_at: string
          id: string
          match_type: string
          question_ids: Json
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_type: string
          question_ids?: Json
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          match_type?: string
          question_ids?: Json
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_user_by_username: {
        Args: { _username: string }
        Returns: {
          id: string
          username: string
        }[]
      }
      get_leaderboard: {
        Args: { _match_type: string }
        Returns: {
          elo: number
          games_played: number
          losses: number
          rank: number
          user_id: string
          username: string
          wins: number
        }[]
      }
      get_match_review: {
        Args: { _match_id: string }
        Returns: {
          category: string
          correct_answer: string
          difficulty: number
          explanation: string
          options: Json
          passage_id: string
          passage_text: string
          question_id: string
          question_order: number
          question_text: string
          subject_type: string
        }[]
      }
      get_ord_leaderboard: {
        Args: never
        Returns: {
          accuracy: number
          correct_count: number
          rank: number
          total_count: number
          user_id: string
          username: string
        }[]
      }
      get_users_basic: {
        Args: { _ids: string[] }
        Returns: {
          elo_math: number
          elo_verbal: number
          id: string
          username: string
        }[]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      match_visible_to_user: {
        Args: { _match_id: string; _user_id: string }
        Returns: boolean
      }
      pair_ranked_match: {
        Args: { p_creator: string; p_match_id: string; p_opponent: string }
        Returns: boolean
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
