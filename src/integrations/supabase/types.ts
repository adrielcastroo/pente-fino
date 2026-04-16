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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_chat_history: {
        Row: {
          created_at: string
          id: string
          message: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      conferences: {
        Row: {
          conferente: string
          created_at: string
          finished_at: string | null
          id: string
          processo: string
          started_at: string | null
        }
        Insert: {
          conferente?: string
          created_at?: string
          finished_at?: string | null
          id?: string
          processo: string
          started_at?: string | null
        }
        Update: {
          conferente?: string
          created_at?: string
          finished_at?: string | null
          id?: string
          processo?: string
          started_at?: string | null
        }
        Relationships: []
      }
      estoque_posicoes: {
        Row: {
          coluna: string
          conferente_entrada: string | null
          conferente_saida: string | null
          created_at: string
          data_registro: string | null
          data_saida: string | null
          endereco: string | null
          estrutura: string
          id: string
          item: string | null
          largura: number | null
          lote: string | null
          lote_sistema: string | null
          m_linear: number | null
          m2: number | null
          nivel: number
          posicao: number
          proc: string | null
          registro_id: string | null
          status: string
        }
        Insert: {
          coluna: string
          conferente_entrada?: string | null
          conferente_saida?: string | null
          created_at?: string
          data_registro?: string | null
          data_saida?: string | null
          endereco?: string | null
          estrutura: string
          id?: string
          item?: string | null
          largura?: number | null
          lote?: string | null
          lote_sistema?: string | null
          m_linear?: number | null
          m2?: number | null
          nivel: number
          posicao: number
          proc?: string | null
          registro_id?: string | null
          status?: string
        }
        Update: {
          coluna?: string
          conferente_entrada?: string | null
          conferente_saida?: string | null
          created_at?: string
          data_registro?: string | null
          data_saida?: string | null
          endereco?: string | null
          estrutura?: string
          id?: string
          item?: string | null
          largura?: number | null
          lote?: string | null
          lote_sistema?: string | null
          m_linear?: number | null
          m2?: number | null
          nivel?: number
          posicao?: number
          proc?: string | null
          registro_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_posicoes_registro_id_fkey"
            columns: ["registro_id"]
            isOneToOne: false
            referencedRelation: "registros"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_saidas: {
        Row: {
          coluna: string | null
          conferente_entrada: string | null
          conferente_saida: string | null
          created_at: string | null
          data_registro: string | null
          data_saida: string | null
          endereco: string | null
          estrutura: string | null
          id: string
          item: string | null
          largura: number | null
          lote: string | null
          lote_sistema: string | null
          m_linear: number | null
          m2: number | null
          nivel: number | null
          posicao: number | null
          proc: string | null
          registro_id: string | null
        }
        Insert: {
          coluna?: string | null
          conferente_entrada?: string | null
          conferente_saida?: string | null
          created_at?: string | null
          data_registro?: string | null
          data_saida?: string | null
          endereco?: string | null
          estrutura?: string | null
          id?: string
          item?: string | null
          largura?: number | null
          lote?: string | null
          lote_sistema?: string | null
          m_linear?: number | null
          m2?: number | null
          nivel?: number | null
          posicao?: number | null
          proc?: string | null
          registro_id?: string | null
        }
        Update: {
          coluna?: string | null
          conferente_entrada?: string | null
          conferente_saida?: string | null
          created_at?: string | null
          data_registro?: string | null
          data_saida?: string | null
          endereco?: string | null
          estrutura?: string | null
          id?: string
          item?: string | null
          largura?: number | null
          lote?: string | null
          lote_sistema?: string | null
          m_linear?: number | null
          m2?: number | null
          nivel?: number | null
          posicao?: number | null
          proc?: string | null
          registro_id?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string
          id: string
          location: string | null
          name: string
          quantity: number | null
          sku: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          name: string
          quantity?: number | null
          sku: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          quantity?: number | null
          sku?: string
          updated_at?: string
        }
        Relationships: []
      }
      operation_logs: {
        Row: {
          conferente_name: string
          created_at: string
          description: string | null
          id: string
          item_id: string | null
          quantity: number | null
          type: string
          user_id: string | null
        }
        Insert: {
          conferente_name: string
          created_at?: string
          description?: string | null
          id?: string
          item_id?: string | null
          quantity?: number | null
          type: string
          user_id?: string | null
        }
        Update: {
          conferente_name?: string
          created_at?: string
          description?: string | null
          id?: string
          item_id?: string | null
          quantity?: number | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_customization_rules: string | null
          avatar_url: string | null
          created_at: string
          display_mode: string | null
          display_name: string | null
          email_notifications: boolean | null
          id: string
          opt_out_reports: boolean | null
          updated_at: string
        }
        Insert: {
          ai_customization_rules?: string | null
          avatar_url?: string | null
          created_at?: string
          display_mode?: string | null
          display_name?: string | null
          email_notifications?: boolean | null
          id: string
          opt_out_reports?: boolean | null
          updated_at?: string
        }
        Update: {
          ai_customization_rules?: string | null
          avatar_url?: string | null
          created_at?: string
          display_mode?: string | null
          display_name?: string | null
          email_notifications?: boolean | null
          id?: string
          opt_out_reports?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      registros: {
        Row: {
          conference_id: string | null
          created_at: string
          edited_at: string | null
          edited_by: string
          endereco: string
          id: string
          item: string
          largura: number
          lote: string
          lote_sistema: string
          m_linear: number
          m2: number
          modo_origem: string
          nf: string
          quantidade: number | null
          tipo_tecido: string
          was_edited: boolean
        }
        Insert: {
          conference_id?: string | null
          created_at?: string
          edited_at?: string | null
          edited_by?: string
          endereco?: string
          id?: string
          item: string
          largura?: number
          lote?: string
          lote_sistema?: string
          m_linear?: number
          m2?: number
          modo_origem?: string
          nf?: string
          quantidade?: number | null
          tipo_tecido?: string
          was_edited?: boolean
        }
        Update: {
          conference_id?: string | null
          created_at?: string
          edited_at?: string | null
          edited_by?: string
          endereco?: string
          id?: string
          item?: string
          largura?: number
          lote?: string
          lote_sistema?: string
          m_linear?: number
          m2?: number
          modo_origem?: string
          nf?: string
          quantidade?: number | null
          tipo_tecido?: string
          was_edited?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "registros_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
        ]
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
