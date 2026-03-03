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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      allocation_cycles: {
        Row: {
          created_at: string
          id: string
          is_current: boolean
          is_visible: boolean
          label: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_current?: boolean
          is_visible?: boolean
          label: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_current?: boolean
          is_visible?: boolean
          label?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      client_cycles: {
        Row: {
          client_id: string
          created_at: string
          cycle_id: string
          id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          cycle_id: string
          id?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          cycle_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_cycles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_cycles_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "allocation_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          client_id: string
          created_at: string
          id: string
          question_1: string | null
          question_10: string | null
          question_2: string | null
          question_3: string | null
          question_4: string | null
          question_5: string | null
          question_6: string | null
          question_7: string | null
          question_8: string | null
          question_9: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          question_1?: string | null
          question_10?: string | null
          question_2?: string | null
          question_3?: string | null
          question_4?: string | null
          question_5?: string | null
          question_6?: string | null
          question_7?: string | null
          question_8?: string | null
          question_9?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          question_1?: string | null
          question_10?: string | null
          question_2?: string | null
          question_3?: string | null
          question_4?: string | null
          question_5?: string | null
          question_6?: string | null
          question_7?: string | null
          question_8?: string | null
          question_9?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      gt_handoff_surveys: {
        Row: {
          client_id: string
          communication_notes: string | null
          created_at: string
          cycle_id: string
          difficulty_level: string | null
          id: string
          key_learnings: string | null
          recommendations: string | null
          updated_at: string
          user_id: string
          work_style: string | null
        }
        Insert: {
          client_id: string
          communication_notes?: string | null
          created_at?: string
          cycle_id: string
          difficulty_level?: string | null
          id?: string
          key_learnings?: string | null
          recommendations?: string | null
          updated_at?: string
          user_id: string
          work_style?: string | null
        }
        Update: {
          client_id?: string
          communication_notes?: string | null
          created_at?: string
          cycle_id?: string
          difficulty_level?: string | null
          id?: string
          key_learnings?: string | null
          recommendations?: string | null
          updated_at?: string
          user_id?: string
          work_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gt_handoff_surveys_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_handoff_surveys_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "allocation_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      gt_members: {
        Row: {
          client_id: string
          created_at: string
          cycle_id: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          cycle_id: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          cycle_id?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gt_members_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gt_members_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "allocation_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      leadership_positions: {
        Row: {
          created_at: string
          directorate_id: string
          id: string
          position_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          directorate_id: string
          id?: string
          position_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          directorate_id?: string
          id?: string
          position_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      member_allocations: {
        Row: {
          coordination_id: string
          created_at: string
          cycle_id: string
          gt_client_id: string | null
          gt_role: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coordination_id: string
          created_at?: string
          cycle_id: string
          gt_client_id?: string | null
          gt_role?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coordination_id?: string
          created_at?: string
          cycle_id?: string
          gt_client_id?: string | null
          gt_role?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_allocations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "allocation_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_allocations_gt_client_id_fkey"
            columns: ["gt_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          profile_activities: string | null
          profile_collaboration_tools: string | null
          profile_communication_style: string | null
          profile_competencies: string | null
          profile_feedback_preference: string | null
          profile_leadership_style: string | null
          profile_learning_style: string | null
          profile_preferred_directorate: string | null
          profile_problem_solving: string | null
          profile_project_type: string | null
          profile_skills: string | null
          profile_stress_handling: string | null
          profile_team_role: string | null
          profile_time_management: string | null
          profile_work_style: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          profile_activities?: string | null
          profile_collaboration_tools?: string | null
          profile_communication_style?: string | null
          profile_competencies?: string | null
          profile_feedback_preference?: string | null
          profile_leadership_style?: string | null
          profile_learning_style?: string | null
          profile_preferred_directorate?: string | null
          profile_problem_solving?: string | null
          profile_project_type?: string | null
          profile_skills?: string | null
          profile_stress_handling?: string | null
          profile_team_role?: string | null
          profile_time_management?: string | null
          profile_work_style?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          profile_activities?: string | null
          profile_collaboration_tools?: string | null
          profile_communication_style?: string | null
          profile_competencies?: string | null
          profile_feedback_preference?: string | null
          profile_leadership_style?: string | null
          profile_learning_style?: string | null
          profile_preferred_directorate?: string | null
          profile_problem_solving?: string | null
          profile_project_type?: string | null
          profile_skills?: string | null
          profile_stress_handling?: string | null
          profile_team_role?: string | null
          profile_time_management?: string | null
          profile_work_style?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
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
    Enums: {
      app_role: ["admin", "member"],
    },
  },
} as const
