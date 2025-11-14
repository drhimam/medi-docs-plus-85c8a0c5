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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      patients: {
        Row: {
          address: string | null
          alcohol_consumption: string
          allergic_history_drug: Json | null
          allergic_history_env: Json | null
          allergic_history_food: Json | null
          blood_group: string | null
          completion_status: string
          contact_number: string
          created_at: string
          date_of_birth: string
          diet: string | null
          email: string | null
          exercise_habits: string | null
          family_history: string | null
          first_name: string
          gender: string
          health_card_number: string | null
          hospitalization_history: string | null
          id: string
          last_name: string
          living_environment: string | null
          medical_history_ongoing: string | null
          medical_history_past: string | null
          mental_health_history: string | null
          occupation: string | null
          ongoing_medications: Json | null
          recreational_drug_use: string | null
          smoking_status: string
          supplements: Json | null
          surgical_history: string | null
          updated_at: string
          user_id: string
          vaccinations: Json | null
        }
        Insert: {
          address?: string | null
          alcohol_consumption: string
          allergic_history_drug?: Json | null
          allergic_history_env?: Json | null
          allergic_history_food?: Json | null
          blood_group?: string | null
          completion_status?: string
          contact_number: string
          created_at?: string
          date_of_birth: string
          diet?: string | null
          email?: string | null
          exercise_habits?: string | null
          family_history?: string | null
          first_name: string
          gender: string
          health_card_number?: string | null
          hospitalization_history?: string | null
          id?: string
          last_name: string
          living_environment?: string | null
          medical_history_ongoing?: string | null
          medical_history_past?: string | null
          mental_health_history?: string | null
          occupation?: string | null
          ongoing_medications?: Json | null
          recreational_drug_use?: string | null
          smoking_status: string
          supplements?: Json | null
          surgical_history?: string | null
          updated_at?: string
          user_id: string
          vaccinations?: Json | null
        }
        Update: {
          address?: string | null
          alcohol_consumption?: string
          allergic_history_drug?: Json | null
          allergic_history_env?: Json | null
          allergic_history_food?: Json | null
          blood_group?: string | null
          completion_status?: string
          contact_number?: string
          created_at?: string
          date_of_birth?: string
          diet?: string | null
          email?: string | null
          exercise_habits?: string | null
          family_history?: string | null
          first_name?: string
          gender?: string
          health_card_number?: string | null
          hospitalization_history?: string | null
          id?: string
          last_name?: string
          living_environment?: string | null
          medical_history_ongoing?: string | null
          medical_history_past?: string | null
          mental_health_history?: string | null
          occupation?: string | null
          ongoing_medications?: Json | null
          recreational_drug_use?: string | null
          smoking_status?: string
          supplements?: Json | null
          surgical_history?: string | null
          updated_at?: string
          user_id?: string
          vaccinations?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
