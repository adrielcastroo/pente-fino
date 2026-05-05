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
      auth_audit_logs: {
        Row: {
          created_at: string
          email: string
          error_message: string | null
          event_type: string
          id: string
          ip_address: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          error_message?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          status: string
        }
        Update: {
          created_at?: string
          email?: string
          error_message?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          status?: string
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
          codigo_cor: string | null
          coluna: string
          composicao: string | null
          conferente_entrada: string | null
          conferente_saida: string | null
          created_at: string
          data_registro: string | null
          data_saida: string | null
          endereco: string | null
          estoque_minimo: number | null
          estrutura: string
          fornecedor: string | null
          gramatura: number | null
          id: string
          item: string | null
          largura: number | null
          largura_util: number | null
          lote: string | null
          lote_sistema: string | null
          m_linear: number | null
          m2: number | null
          nivel: number
          posicao: number
          preco_metro: number | null
          proc: string | null
          registro_id: string | null
          status: string
        }
        Insert: {
          codigo_cor?: string | null
          coluna: string
          composicao?: string | null
          conferente_entrada?: string | null
          conferente_saida?: string | null
          created_at?: string
          data_registro?: string | null
          data_saida?: string | null
          endereco?: string | null
          estoque_minimo?: number | null
          estrutura: string
          fornecedor?: string | null
          gramatura?: number | null
          id?: string
          item?: string | null
          largura?: number | null
          largura_util?: number | null
          lote?: string | null
          lote_sistema?: string | null
          m_linear?: number | null
          m2?: number | null
          nivel: number
          posicao: number
          preco_metro?: number | null
          proc?: string | null
          registro_id?: string | null
          status?: string
        }
        Update: {
          codigo_cor?: string | null
          coluna?: string
          composicao?: string | null
          conferente_entrada?: string | null
          conferente_saida?: string | null
          created_at?: string
          data_registro?: string | null
          data_saida?: string | null
          endereco?: string | null
          estoque_minimo?: number | null
          estrutura?: string
          fornecedor?: string | null
          gramatura?: number | null
          id?: string
          item?: string | null
          largura?: number | null
          largura_util?: number | null
          lote?: string | null
          lote_sistema?: string | null
          m_linear?: number | null
          m2?: number | null
          nivel?: number
          posicao?: number
          preco_metro?: number | null
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
          codigo_cor: string | null
          coluna: string | null
          composicao: string | null
          conferente_entrada: string | null
          conferente_saida: string | null
          created_at: string | null
          data_registro: string | null
          data_saida: string | null
          endereco: string | null
          estrutura: string | null
          fornecedor: string | null
          gramatura: number | null
          id: string
          item: string | null
          largura: number | null
          largura_util: number | null
          lote: string | null
          lote_sistema: string | null
          m_linear: number | null
          m2: number | null
          nivel: number | null
          observacoes: string | null
          posicao: number | null
          preco_metro: number | null
          proc: string | null
          registro_id: string | null
        }
        Insert: {
          codigo_cor?: string | null
          coluna?: string | null
          composicao?: string | null
          conferente_entrada?: string | null
          conferente_saida?: string | null
          created_at?: string | null
          data_registro?: string | null
          data_saida?: string | null
          endereco?: string | null
          estrutura?: string | null
          fornecedor?: string | null
          gramatura?: number | null
          id?: string
          item?: string | null
          largura?: number | null
          largura_util?: number | null
          lote?: string | null
          lote_sistema?: string | null
          m_linear?: number | null
          m2?: number | null
          nivel?: number | null
          observacoes?: string | null
          posicao?: number | null
          preco_metro?: number | null
          proc?: string | null
          registro_id?: string | null
        }
        Update: {
          codigo_cor?: string | null
          coluna?: string | null
          composicao?: string | null
          conferente_entrada?: string | null
          conferente_saida?: string | null
          created_at?: string | null
          data_registro?: string | null
          data_saida?: string | null
          endereco?: string | null
          estrutura?: string | null
          fornecedor?: string | null
          gramatura?: number | null
          id?: string
          item?: string | null
          largura?: number | null
          largura_util?: number | null
          lote?: string | null
          lote_sistema?: string | null
          m_linear?: number | null
          m2?: number | null
          nivel?: number | null
          observacoes?: string | null
          posicao?: number | null
          preco_metro?: number | null
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
      lotes_mestres: {
        Row: {
          cor_hex: string
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          cor_hex?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          cor_hex?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      madeira_quadrantes: {
        Row: {
          capacidade: number
          coluna: string
          created_at: string
          estrutura: string
          id: string
          nivel: number
          tipo_ocupacao: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          capacidade?: number
          coluna: string
          created_at?: string
          estrutura?: string
          id?: string
          nivel: number
          tipo_ocupacao?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          capacidade?: number
          coluna?: string
          created_at?: string
          estrutura?: string
          id?: string
          nivel?: number
          tipo_ocupacao?: string
          updated_at?: string
          updated_by?: string | null
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
          acabamento: string | null
          avaria_descricao: string | null
          avaria_foto_url: string | null
          avaria_tipo: string | null
          composicao: string | null
          conference_id: string | null
          created_at: string
          edited_at: string | null
          edited_by: string
          endereco: string
          espessura: number | null
          estoque_minimo: number | null
          fornecedor: string | null
          id: string
          item: string
          largura: number
          lote: string
          lote_mestre_id: string | null
          lote_sistema: string
          m_linear: number
          m2: number
          modo_origem: string
          nf: string
          quantidade: number | null
          status: string | null
          tipo_tecido: string
          was_edited: boolean
        }
        Insert: {
          acabamento?: string | null
          avaria_descricao?: string | null
          avaria_foto_url?: string | null
          avaria_tipo?: string | null
          composicao?: string | null
          conference_id?: string | null
          created_at?: string
          edited_at?: string | null
          edited_by?: string
          endereco?: string
          espessura?: number | null
          estoque_minimo?: number | null
          fornecedor?: string | null
          id?: string
          item: string
          largura?: number
          lote?: string
          lote_mestre_id?: string | null
          lote_sistema?: string
          m_linear?: number
          m2?: number
          modo_origem?: string
          nf?: string
          quantidade?: number | null
          status?: string | null
          tipo_tecido?: string
          was_edited?: boolean
        }
        Update: {
          acabamento?: string | null
          avaria_descricao?: string | null
          avaria_foto_url?: string | null
          avaria_tipo?: string | null
          composicao?: string | null
          conference_id?: string | null
          created_at?: string
          edited_at?: string | null
          edited_by?: string
          endereco?: string
          espessura?: number | null
          estoque_minimo?: number | null
          fornecedor?: string | null
          id?: string
          item?: string
          largura?: number
          lote?: string
          lote_mestre_id?: string | null
          lote_sistema?: string
          m_linear?: number
          m2?: number
          modo_origem?: string
          nf?: string
          quantidade?: number | null
          status?: string | null
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
          {
            foreignKeyName: "registros_lote_mestre_id_fkey"
            columns: ["lote_mestre_id"]
            isOneToOne: false
            referencedRelation: "lotes_mestres"
            referencedColumns: ["id"]
          },
        ]
      }
      report_logs: {
        Row: {
          error_message: string | null
          id: string
          recipient_count: number | null
          report_type: string
          sent_at: string | null
          status: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          recipient_count?: number | null
          report_type: string
          sent_at?: string | null
          status: string
        }
        Update: {
          error_message?: string | null
          id?: string
          recipient_count?: number | null
          report_type?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      report_settings: {
        Row: {
          created_at: string | null
          daily_enabled: boolean | null
          email_recipients: string[]
          id: string
          monthly_enabled: boolean | null
          updated_at: string | null
          user_id: string | null
          weekly_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          daily_enabled?: boolean | null
          email_recipients: string[]
          id?: string
          monthly_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          weekly_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          daily_enabled?: boolean | null
          email_recipients?: string[]
          id?: string
          monthly_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          weekly_enabled?: boolean | null
        }
        Relationships: []
      }
      reservas: {
        Row: {
          caixa_num: string | null
          codigo: string
          created_at: string
          descricao: string | null
          endereco: string
          id: string
          observacao: string | null
          quantidade: number
          quantidade_cx: number | null
        }
        Insert: {
          caixa_num?: string | null
          codigo: string
          created_at?: string
          descricao?: string | null
          endereco: string
          id?: string
          observacao?: string | null
          quantidade: number
          quantidade_cx?: number | null
        }
        Update: {
          caixa_num?: string | null
          codigo?: string
          created_at?: string
          descricao?: string | null
          endereco?: string
          id?: string
          observacao?: string | null
          quantidade?: number
          quantidade_cx?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_reset_rate_limit: {
        Args: {
          max_attempts?: number
          target_email: string
          window_minutes?: number
        }
        Returns: boolean
      }
      log_auth_event: {
        Args: {
          p_email?: string
          p_event_type: string
          p_metadata?: Json
          p_status?: string
          p_user_id?: string
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
