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
      audit_logs: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          changed_keys: string[] | null
          entity: string
          entity_id: string | null
          id: string
          occurred_at: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          changed_keys?: string[] | null
          entity: string
          entity_id?: string | null
          id?: string
          occurred_at?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          changed_keys?: string[] | null
          entity?: string
          entity_id?: string | null
          id?: string
          occurred_at?: string
          user_email?: string | null
          user_id?: string | null
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
          created_by: string | null
          finished_at: string | null
          id: string
          processo: string
          started_at: string | null
        }
        Insert: {
          conferente?: string
          created_at?: string
          created_by?: string | null
          finished_at?: string | null
          id?: string
          processo: string
          started_at?: string | null
        }
        Update: {
          conferente?: string
          created_at?: string
          created_by?: string | null
          finished_at?: string | null
          id?: string
          processo?: string
          started_at?: string | null
        }
        Relationships: []
      }
      configuracoes_inventario: {
        Row: {
          created_at: string | null
          curva: string
          dias_frequencia: number
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          curva: string
          dias_frequencia?: number
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          curva?: string
          dias_frequencia?: number
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contagem_itens_bipados: {
        Row: {
          bipado_em: string | null
          id: string
          lote: string | null
          quantidade: number | null
          tarefa_id: string | null
        }
        Insert: {
          bipado_em?: string | null
          id?: string
          lote?: string | null
          quantidade?: number | null
          tarefa_id?: string | null
        }
        Update: {
          bipado_em?: string | null
          id?: string
          lote?: string | null
          quantidade?: number | null
          tarefa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contagem_itens_bipados_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas_contagem"
            referencedColumns: ["id"]
          },
        ]
      }
      contagens_diarias_limite: {
        Row: {
          contagens_com_lote: number | null
          contagens_sem_lote: number | null
          data: string
          id: string
          user_id: string
        }
        Insert: {
          contagens_com_lote?: number | null
          contagens_sem_lote?: number | null
          data?: string
          id?: string
          user_id: string
        }
        Update: {
          contagens_com_lote?: number | null
          contagens_sem_lote?: number | null
          data?: string
          id?: string
          user_id?: string
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
      historico_contagens: {
        Row: {
          conferente_nome: string | null
          created_at: string | null
          data_conferencia: string | null
          detalhes_bipagem: Json | null
          diferenca: number
          id: string
          quantidade_contada: number
          quantidade_sistema: number
          tarefa_id: string | null
        }
        Insert: {
          conferente_nome?: string | null
          created_at?: string | null
          data_conferencia?: string | null
          detalhes_bipagem?: Json | null
          diferenca: number
          id?: string
          quantidade_contada: number
          quantidade_sistema?: number
          tarefa_id?: string | null
        }
        Update: {
          conferente_nome?: string | null
          created_at?: string | null
          data_conferencia?: string | null
          detalhes_bipagem?: Json | null
          diferenca?: number
          id?: string
          quantidade_contada?: number
          quantidade_sistema?: number
          tarefa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_contagens_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas_contagem"
            referencedColumns: ["id"]
          },
        ]
      }
      independent_reservations: {
        Row: {
          caixa_num: string | null
          codigo: string
          created_at: string | null
          descricao: string | null
          endereco: string
          id: string
          last_edited_at: string | null
          last_edited_field: string | null
          observacao: string | null
          quantidade: number
          quantidade_cx: number | null
          updated_at: string | null
          updated_by: string | null
          updated_by_name: string | null
        }
        Insert: {
          caixa_num?: string | null
          codigo: string
          created_at?: string | null
          descricao?: string | null
          endereco: string
          id?: string
          last_edited_at?: string | null
          last_edited_field?: string | null
          observacao?: string | null
          quantidade?: number
          quantidade_cx?: number | null
          updated_at?: string | null
          updated_by?: string | null
          updated_by_name?: string | null
        }
        Update: {
          caixa_num?: string | null
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          endereco?: string
          id?: string
          last_edited_at?: string | null
          last_edited_field?: string | null
          observacao?: string | null
          quantidade?: number
          quantidade_cx?: number | null
          updated_at?: string | null
          updated_by?: string | null
          updated_by_name?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string
          curva_abc: string | null
          data_entrada: string | null
          id: string
          location: string | null
          name: string
          quantity: number | null
          sku: string
          ultima_contagem: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          curva_abc?: string | null
          data_entrada?: string | null
          id?: string
          location?: string | null
          name: string
          quantity?: number | null
          sku: string
          ultima_contagem?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          curva_abc?: string | null
          data_entrada?: string | null
          id?: string
          location?: string | null
          name?: string
          quantity?: number | null
          sku?: string
          ultima_contagem?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_configs: {
        Row: {
          created_at: string | null
          curve_a_days: number
          curve_b_days: number
          curve_c_days: number
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          curve_a_days?: number
          curve_b_days?: number
          curve_c_days?: number
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          curve_a_days?: number
          curve_b_days?: number
          curve_c_days?: number
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_daily_limits: {
        Row: {
          counts_with_lote: number | null
          counts_without_lote: number | null
          date: string
          id: string
          user_id: string
        }
        Insert: {
          counts_with_lote?: number | null
          counts_without_lote?: number | null
          date?: string
          id?: string
          user_id: string
        }
        Update: {
          counts_with_lote?: number | null
          counts_without_lote?: number | null
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_task_items: {
        Row: {
          biped_at: string | null
          id: string
          lote: string | null
          quantity: number | null
          task_id: string | null
        }
        Insert: {
          biped_at?: string | null
          id?: string
          lote?: string | null
          quantity?: number | null
          task_id?: string | null
        }
        Update: {
          biped_at?: string | null
          id?: string
          lote?: string | null
          quantity?: number | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_task_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "inventory_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          counted_qty: number | null
          created_at: string | null
          divergence_details: Json | null
          expected_qty: number | null
          has_lote: boolean | null
          id: string
          item_id: string | null
          item_type: string
          scheduled_date: string | null
          status: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          counted_qty?: number | null
          created_at?: string | null
          divergence_details?: Json | null
          expected_qty?: number | null
          has_lote?: boolean | null
          id?: string
          item_id?: string | null
          item_type: string
          scheduled_date?: string | null
          status?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          counted_qty?: number | null
          created_at?: string | null
          divergence_details?: Json | null
          expected_qty?: number | null
          has_lote?: boolean | null
          id?: string
          item_id?: string | null
          item_type?: string
          scheduled_date?: string | null
          status?: string
        }
        Relationships: []
      }
      itens_cadastro: {
        Row: {
          codigo_fornecedor: string | null
          codigo_fornecedor_normalizado: string | null
          codigo_interno: string
          codigos_fornecedor: string[]
          codigos_fornecedor_normalizado: string[]
          created_at: string
          created_by: string | null
          descricao: string
          id: string
          last_edited_at: string | null
          last_edited_field: string | null
          updated_at: string
          updated_by: string | null
          updated_by_name: string | null
        }
        Insert: {
          codigo_fornecedor?: string | null
          codigo_fornecedor_normalizado?: string | null
          codigo_interno: string
          codigos_fornecedor?: string[]
          codigos_fornecedor_normalizado?: string[]
          created_at?: string
          created_by?: string | null
          descricao: string
          id?: string
          last_edited_at?: string | null
          last_edited_field?: string | null
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
        }
        Update: {
          codigo_fornecedor?: string | null
          codigo_fornecedor_normalizado?: string | null
          codigo_interno?: string
          codigos_fornecedor?: string[]
          codigos_fornecedor_normalizado?: string[]
          created_at?: string
          created_by?: string | null
          descricao?: string
          id?: string
          last_edited_at?: string | null
          last_edited_field?: string | null
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
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
      movimentacoes_endereco: {
        Row: {
          codigo_lote: string
          conferente_nome: string
          created_at: string | null
          data_movimentacao: string | null
          descricao_item: string | null
          endereco_anterior: string | null
          endereco_novo: string
          id: string
          item_id: string | null
          quantidade: number | null
          status_integracao: string | null
          tipo_estoque: string | null
        }
        Insert: {
          codigo_lote: string
          conferente_nome: string
          created_at?: string | null
          data_movimentacao?: string | null
          descricao_item?: string | null
          endereco_anterior?: string | null
          endereco_novo: string
          id?: string
          item_id?: string | null
          quantidade?: number | null
          status_integracao?: string | null
          tipo_estoque?: string | null
        }
        Update: {
          codigo_lote?: string
          conferente_nome?: string
          created_at?: string | null
          data_movimentacao?: string | null
          descricao_item?: string | null
          endereco_anterior?: string | null
          endereco_novo?: string
          id?: string
          item_id?: string | null
          quantidade?: number | null
          status_integracao?: string | null
          tipo_estoque?: string | null
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
          cargo: string | null
          created_at: string
          display_mode: string | null
          display_name: string | null
          email_notifications: boolean | null
          id: string
          opt_out_reports: boolean | null
          preferences: Json
          setor: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ai_customization_rules?: string | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          display_mode?: string | null
          display_name?: string | null
          email_notifications?: boolean | null
          id: string
          opt_out_reports?: boolean | null
          preferences?: Json
          setor?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ai_customization_rules?: string | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          display_mode?: string | null
          display_name?: string | null
          email_notifications?: boolean | null
          id?: string
          opt_out_reports?: boolean | null
          preferences?: Json
          setor?: string | null
          telefone?: string | null
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
          curva_abc: string | null
          data_entrada: string | null
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
          posicao: number | null
          quantidade: number | null
          status: string | null
          tipo_tecido: string
          ultima_contagem: string | null
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
          curva_abc?: string | null
          data_entrada?: string | null
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
          posicao?: number | null
          quantidade?: number | null
          status?: string | null
          tipo_tecido?: string
          ultima_contagem?: string | null
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
          curva_abc?: string | null
          data_entrada?: string | null
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
          posicao?: number | null
          quantidade?: number | null
          status?: string | null
          tipo_tecido?: string
          ultima_contagem?: string | null
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
          last_edited_at: string | null
          last_edited_field: string | null
          observacao: string | null
          quantidade: number
          quantidade_cx: number | null
          updated_at: string
          updated_by: string | null
          updated_by_name: string | null
        }
        Insert: {
          caixa_num?: string | null
          codigo: string
          created_at?: string
          descricao?: string | null
          endereco: string
          id?: string
          last_edited_at?: string | null
          last_edited_field?: string | null
          observacao?: string | null
          quantidade: number
          quantidade_cx?: number | null
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
        }
        Update: {
          caixa_num?: string | null
          codigo?: string
          created_at?: string
          descricao?: string | null
          endereco?: string
          id?: string
          last_edited_at?: string | null
          last_edited_field?: string | null
          observacao?: string | null
          quantidade?: number
          quantidade_cx?: number | null
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
        }
        Relationships: []
      }
      tarefas_contagem: {
        Row: {
          codigo_lote: string
          conferente_id: string | null
          created_at: string | null
          data_geracao: string | null
          has_lote: boolean | null
          id: string
          item_id: string | null
          item_name: string | null
          quantidade_esperada_sistema: number
          status: string
          updated_at: string | null
        }
        Insert: {
          codigo_lote: string
          conferente_id?: string | null
          created_at?: string | null
          data_geracao?: string | null
          has_lote?: boolean | null
          id?: string
          item_id?: string | null
          item_name?: string | null
          quantidade_esperada_sistema?: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          codigo_lote?: string
          conferente_id?: string | null
          created_at?: string | null
          data_geracao?: string | null
          has_lote?: boolean | null
          id?: string
          item_id?: string | null
          item_name?: string | null
          quantidade_esperada_sistema?: number
          status?: string
          updated_at?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
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
      check_reset_rate_limit: {
        Args: {
          max_attempts?: number
          target_email: string
          window_minutes?: number
        }
        Returns: boolean
      }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_at_least: {
        Args: { _min: Database["public"]["Enums"]["app_role"] }
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
      app_role: "admin" | "operador" | "user" | "supervisor" | "gerente"
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
      app_role: ["admin", "operador", "user", "supervisor", "gerente"],
    },
  },
} as const
