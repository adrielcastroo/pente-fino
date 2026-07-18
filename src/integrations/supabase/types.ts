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
      app_releases: {
        Row: {
          created_at: string
          id: string
          is_current: boolean
          is_stable: boolean
          notes: string | null
          released_at: string
          released_by: string | null
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_current?: boolean
          is_stable?: boolean
          notes?: string | null
          released_at?: string
          released_by?: string | null
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          id?: string
          is_current?: boolean
          is_stable?: boolean
          notes?: string | null
          released_at?: string
          released_by?: string | null
          updated_at?: string
          version?: string
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
      auge_depositos: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string
          empresa: string | null
          filial: string | null
          id: string
          localizacao: string | null
          nome: string | null
          raw: Json | null
          synced_at: string
          tipo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string
          empresa?: string | null
          filial?: string | null
          id?: string
          localizacao?: string | null
          nome?: string | null
          raw?: Json | null
          synced_at?: string
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string
          empresa?: string | null
          filial?: string | null
          id?: string
          localizacao?: string | null
          nome?: string | null
          raw?: Json | null
          synced_at?: string
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      auge_lotes: {
        Row: {
          codigo_produto: string
          created_at: string
          data_fabricacao: string | null
          data_validade: string | null
          deposito: string | null
          id: string
          lote: string
          quantidade: number | null
          raw: Json | null
          synced_at: string
          updated_at: string
        }
        Insert: {
          codigo_produto: string
          created_at?: string
          data_fabricacao?: string | null
          data_validade?: string | null
          deposito?: string | null
          id?: string
          lote: string
          quantidade?: number | null
          raw?: Json | null
          synced_at?: string
          updated_at?: string
        }
        Update: {
          codigo_produto?: string
          created_at?: string
          data_fabricacao?: string | null
          data_validade?: string | null
          deposito?: string | null
          id?: string
          lote?: string
          quantidade?: number | null
          raw?: Json | null
          synced_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      auge_movimentacoes: {
        Row: {
          cd_transferencia: string | null
          codigo_produto: string | null
          created_at: string
          data_movimento: string | null
          deposito: string | null
          documento: string | null
          documento_tipo: string | null
          ds_efetivacao: string | null
          ds_situacao: string | null
          dt_efetivacao: string | null
          id: string
          id_externo: string | null
          observacao: string | null
          quantidade: number
          raw: Json | null
          situacao: string | null
          synced_at: string
          tipo: string
          usuario_criacao: string | null
          usuario_efetivacao: string | null
          valor: number | null
        }
        Insert: {
          cd_transferencia?: string | null
          codigo_produto?: string | null
          created_at?: string
          data_movimento?: string | null
          deposito?: string | null
          documento?: string | null
          documento_tipo?: string | null
          ds_efetivacao?: string | null
          ds_situacao?: string | null
          dt_efetivacao?: string | null
          id?: string
          id_externo?: string | null
          observacao?: string | null
          quantidade?: number
          raw?: Json | null
          situacao?: string | null
          synced_at?: string
          tipo: string
          usuario_criacao?: string | null
          usuario_efetivacao?: string | null
          valor?: number | null
        }
        Update: {
          cd_transferencia?: string | null
          codigo_produto?: string | null
          created_at?: string
          data_movimento?: string | null
          deposito?: string | null
          documento?: string | null
          documento_tipo?: string | null
          ds_efetivacao?: string | null
          ds_situacao?: string | null
          dt_efetivacao?: string | null
          id?: string
          id_externo?: string | null
          observacao?: string | null
          quantidade?: number
          raw?: Json | null
          situacao?: string | null
          synced_at?: string
          tipo?: string
          usuario_criacao?: string | null
          usuario_efetivacao?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      auge_produtos: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          codigo: string
          created_at: string
          descricao: string | null
          id: string
          id_compra: boolean | null
          id_estoque: boolean | null
          id_venda: boolean | null
          ncm: string | null
          qt_disponivel: number | null
          qt_entrada_prevista: number | null
          qt_estoque: number | null
          qt_saida_prevista: number | null
          raw: Json | null
          synced_at: string
          unidade: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          codigo: string
          created_at?: string
          descricao?: string | null
          id?: string
          id_compra?: boolean | null
          id_estoque?: boolean | null
          id_venda?: boolean | null
          ncm?: string | null
          qt_disponivel?: number | null
          qt_entrada_prevista?: number | null
          qt_estoque?: number | null
          qt_saida_prevista?: number | null
          raw?: Json | null
          synced_at?: string
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          codigo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          id_compra?: boolean | null
          id_estoque?: boolean | null
          id_venda?: boolean | null
          ncm?: string | null
          qt_disponivel?: number | null
          qt_entrada_prevista?: number | null
          qt_estoque?: number | null
          qt_saida_prevista?: number | null
          raw?: Json | null
          synced_at?: string
          unidade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      auge_produtos_saldo: {
        Row: {
          codigo: string
          created_at: string
          deposito: string
          descricao: string | null
          id: string
          quantidade: number
          raw: Json | null
          synced_at: string
          unidade: string | null
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          deposito?: string
          descricao?: string | null
          id?: string
          quantidade?: number
          raw?: Json | null
          synced_at?: string
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          deposito?: string
          descricao?: string | null
          id?: string
          quantidade?: number
          raw?: Json | null
          synced_at?: string
          unidade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      auge_sync_runs: {
        Row: {
          created_at: string
          detalhes: Json | null
          entidade: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          metadata: Json | null
          rows_processed: number
          rows_upserted: number
          started_at: string
          status: string
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          detalhes?: Json | null
          entidade?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json | null
          rows_processed?: number
          rows_upserted?: number
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          detalhes?: Json | null
          entidade?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json | null
          rows_processed?: number
          rows_upserted?: number
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      auge_sync_state: {
        Row: {
          entidade: string
          last_error: string | null
          last_max_dt: string | null
          last_status: string | null
          last_synced_at: string | null
          updated_at: string
        }
        Insert: {
          entidade: string
          last_error?: string | null
          last_max_dt?: string | null
          last_status?: string | null
          last_synced_at?: string | null
          updated_at?: string
        }
        Update: {
          entidade?: string
          last_error?: string | null
          last_max_dt?: string | null
          last_status?: string | null
          last_synced_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      auge_transferencias: {
        Row: {
          codigo_produto: string | null
          created_at: string
          data_movimento: string | null
          deposito_destino: string | null
          deposito_origem: string | null
          detalhe_sincronizado_em: string | null
          documento: string | null
          ds_efetivacao: string | null
          ds_situacao: string | null
          id: string
          id_externo: string
          nr_efetivacao: string | null
          observacao: string | null
          quantidade: number | null
          raw: Json | null
          situacao: string | null
          synced_at: string
          updated_at: string
          usuario_criacao: string | null
          usuario_efetivacao: string | null
          usuario_enviou_logistica: string | null
          usuario_recebido_logistica: string | null
          valor: number | null
        }
        Insert: {
          codigo_produto?: string | null
          created_at?: string
          data_movimento?: string | null
          deposito_destino?: string | null
          deposito_origem?: string | null
          detalhe_sincronizado_em?: string | null
          documento?: string | null
          ds_efetivacao?: string | null
          ds_situacao?: string | null
          id?: string
          id_externo: string
          nr_efetivacao?: string | null
          observacao?: string | null
          quantidade?: number | null
          raw?: Json | null
          situacao?: string | null
          synced_at?: string
          updated_at?: string
          usuario_criacao?: string | null
          usuario_efetivacao?: string | null
          usuario_enviou_logistica?: string | null
          usuario_recebido_logistica?: string | null
          valor?: number | null
        }
        Update: {
          codigo_produto?: string | null
          created_at?: string
          data_movimento?: string | null
          deposito_destino?: string | null
          deposito_origem?: string | null
          detalhe_sincronizado_em?: string | null
          documento?: string | null
          ds_efetivacao?: string | null
          ds_situacao?: string | null
          id?: string
          id_externo?: string
          nr_efetivacao?: string | null
          observacao?: string | null
          quantidade?: number | null
          raw?: Json | null
          situacao?: string | null
          synced_at?: string
          updated_at?: string
          usuario_criacao?: string | null
          usuario_efetivacao?: string | null
          usuario_enviou_logistica?: string | null
          usuario_recebido_logistica?: string | null
          valor?: number | null
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
      compras_pedidos: {
        Row: {
          created_at: string
          created_by: string | null
          fornecedor: string
          id: string
          itens: number
          numero: string
          observacao: string | null
          previsao: string | null
          status: Database["public"]["Enums"]["compras_pedido_status"]
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fornecedor: string
          id?: string
          itens?: number
          numero: string
          observacao?: string | null
          previsao?: string | null
          status?: Database["public"]["Enums"]["compras_pedido_status"]
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fornecedor?: string
          id?: string
          itens?: number
          numero?: string
          observacao?: string | null
          previsao?: string | null
          status?: Database["public"]["Enums"]["compras_pedido_status"]
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: []
      }
      compras_starcolor_ops: {
        Row: {
          created_at: string
          created_by: string | null
          data_envio: string | null
          data_retorno: string | null
          descricao: string | null
          id: string
          numero_nf: string | null
          numero_op: string
          observacoes: string | null
          quantidade: number | null
          status: Database["public"]["Enums"]["compras_starcolor_op_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_envio?: string | null
          data_retorno?: string | null
          descricao?: string | null
          id?: string
          numero_nf?: string | null
          numero_op: string
          observacoes?: string | null
          quantidade?: number | null
          status?: Database["public"]["Enums"]["compras_starcolor_op_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_envio?: string | null
          data_retorno?: string | null
          descricao?: string | null
          id?: string
          numero_nf?: string | null
          numero_op?: string
          observacoes?: string | null
          quantidade?: number | null
          status?: Database["public"]["Enums"]["compras_starcolor_op_status"]
          updated_at?: string
        }
        Relationships: []
      }
      compras_starcolor_romaneio_itens: {
        Row: {
          codigo: string | null
          created_at: string
          id: string
          op_id: string | null
          op_texto: string | null
          ordem: number
          peso_liq: number | null
          qtd_pecas: number | null
          romaneio_id: string
          tam_barras: number | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          id?: string
          op_id?: string | null
          op_texto?: string | null
          ordem?: number
          peso_liq?: number | null
          qtd_pecas?: number | null
          romaneio_id: string
          tam_barras?: number | null
        }
        Update: {
          codigo?: string | null
          created_at?: string
          id?: string
          op_id?: string | null
          op_texto?: string | null
          ordem?: number
          peso_liq?: number | null
          qtd_pecas?: number | null
          romaneio_id?: string
          tam_barras?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_starcolor_romaneio_itens_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "compras_starcolor_ops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_starcolor_romaneio_itens_romaneio_id_fkey"
            columns: ["romaneio_id"]
            isOneToOne: false
            referencedRelation: "compras_starcolor_romaneios"
            referencedColumns: ["id"]
          },
        ]
      }
      compras_starcolor_romaneios: {
        Row: {
          acabamento: string | null
          cor: string
          created_at: string
          created_by: string | null
          data_emissao: string
          id: string
          numero: string
          numero_nf: string
          observacoes: string | null
          servico_adicional: string | null
          status: string
          updated_at: string
        }
        Insert: {
          acabamento?: string | null
          cor: string
          created_at?: string
          created_by?: string | null
          data_emissao?: string
          id?: string
          numero: string
          numero_nf: string
          observacoes?: string | null
          servico_adicional?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          acabamento?: string | null
          cor?: string
          created_at?: string
          created_by?: string | null
          data_emissao?: string
          id?: string
          numero?: string
          numero_nf?: string
          observacoes?: string | null
          servico_adicional?: string | null
          status?: string
          updated_at?: string
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
      etiqueta_historico: {
        Row: {
          criado_em: string
          id: string
          impressora: string | null
          quantidade: number
          template_id: string | null
          template_nome: string
          usuario_id: string | null
          usuario_nome: string | null
          variaveis_usadas: Json
        }
        Insert: {
          criado_em?: string
          id?: string
          impressora?: string | null
          quantidade?: number
          template_id?: string | null
          template_nome: string
          usuario_id?: string | null
          usuario_nome?: string | null
          variaveis_usadas?: Json
        }
        Update: {
          criado_em?: string
          id?: string
          impressora?: string | null
          quantidade?: number
          template_id?: string | null
          template_nome?: string
          usuario_id?: string | null
          usuario_nome?: string | null
          variaveis_usadas?: Json
        }
        Relationships: [
          {
            foreignKeyName: "etiqueta_historico_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "etiqueta_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      etiqueta_templates: {
        Row: {
          ativo: boolean
          atualizado_em: string
          categoria: string
          criado_em: string
          criado_por: string | null
          dimensoes: Json
          id: string
          nome: string
          variaveis: Json
          versao: number
          zpl: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          categoria: string
          criado_em?: string
          criado_por?: string | null
          dimensoes?: Json
          id?: string
          nome: string
          variaveis?: Json
          versao?: number
          zpl?: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: string
          criado_em?: string
          criado_por?: string | null
          dimensoes?: Json
          id?: string
          nome?: string
          variaveis?: Json
          versao?: number
          zpl?: string
        }
        Relationships: []
      }
      expedicao_carga_romaneios: {
        Row: {
          carga_id: string
          created_at: string
          romaneio_id: string
        }
        Insert: {
          carga_id: string
          created_at?: string
          romaneio_id: string
        }
        Update: {
          carga_id?: string
          created_at?: string
          romaneio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedicao_carga_romaneios_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "expedicao_cargas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedicao_carga_romaneios_romaneio_id_fkey"
            columns: ["romaneio_id"]
            isOneToOne: false
            referencedRelation: "expedicao_romaneios"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicao_cargas: {
        Row: {
          created_at: string
          criado_por: string | null
          custo_frete: number | null
          data_coleta: string | null
          id: string
          motorista_doc: string | null
          motorista_nome: string | null
          numero: string
          observacao: string | null
          rota: string | null
          status: string
          transportadora_tipo: string | null
          updated_at: string
          veiculo_id: string | null
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          custo_frete?: number | null
          data_coleta?: string | null
          id?: string
          motorista_doc?: string | null
          motorista_nome?: string | null
          numero: string
          observacao?: string | null
          rota?: string | null
          status?: string
          transportadora_tipo?: string | null
          updated_at?: string
          veiculo_id?: string | null
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          custo_frete?: number | null
          data_coleta?: string | null
          id?: string
          motorista_doc?: string | null
          motorista_nome?: string | null
          numero?: string
          observacao?: string | null
          rota?: string | null
          status?: string
          transportadora_tipo?: string | null
          updated_at?: string
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expedicao_cargas_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "expedicao_veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicao_carrinhos: {
        Row: {
          aguardando_desde: string | null
          codigo: string
          conferente_id: string | null
          conferido_at: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["expedicao_carrinho_status"]
          transportadora_id: string | null
          updated_at: string
        }
        Insert: {
          aguardando_desde?: string | null
          codigo: string
          conferente_id?: string | null
          conferido_at?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["expedicao_carrinho_status"]
          transportadora_id?: string | null
          updated_at?: string
        }
        Update: {
          aguardando_desde?: string | null
          codigo?: string
          conferente_id?: string | null
          conferido_at?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["expedicao_carrinho_status"]
          transportadora_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedicao_carrinhos_transportadora_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "expedicao_transportadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicao_comprovantes: {
        Row: {
          assinatura_base64: string | null
          carga_id: string
          created_at: string
          criado_por: string | null
          data_hora: string
          foto_path: string | null
          id: string
          observacao: string | null
          recebedor_doc: string | null
          recebedor_nome: string | null
        }
        Insert: {
          assinatura_base64?: string | null
          carga_id: string
          created_at?: string
          criado_por?: string | null
          data_hora?: string
          foto_path?: string | null
          id?: string
          observacao?: string | null
          recebedor_doc?: string | null
          recebedor_nome?: string | null
        }
        Update: {
          assinatura_base64?: string | null
          carga_id?: string
          created_at?: string
          criado_por?: string | null
          data_hora?: string
          foto_path?: string | null
          id?: string
          observacao?: string | null
          recebedor_doc?: string | null
          recebedor_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expedicao_comprovantes_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "expedicao_cargas"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicao_conferencias_itens: {
        Row: {
          carrinho_id: string
          codigo_bipado: string
          conferente_id: string | null
          created_at: string
          detalhes: Json | null
          id: string
          peca_id: string | null
          resultado: string
        }
        Insert: {
          carrinho_id: string
          codigo_bipado: string
          conferente_id?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          peca_id?: string | null
          resultado: string
        }
        Update: {
          carrinho_id?: string
          codigo_bipado?: string
          conferente_id?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          peca_id?: string | null
          resultado?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedicao_conferencias_itens_carrinho_id_fkey"
            columns: ["carrinho_id"]
            isOneToOne: false
            referencedRelation: "expedicao_carrinhos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedicao_conferencias_itens_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "expedicao_pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicao_pecas: {
        Row: {
          alocada_at: string | null
          carrinho_id: string | null
          codigo_etiqueta: string
          codigo_peca: string | null
          conferente_id: string | null
          conferida_at: string | null
          created_at: string
          descricao: string | null
          embalador_id: string | null
          etiquetada_at: string
          faturada_at: string | null
          id: string
          romaneio_id: string | null
          status: Database["public"]["Enums"]["expedicao_peca_status"]
          updated_at: string
        }
        Insert: {
          alocada_at?: string | null
          carrinho_id?: string | null
          codigo_etiqueta: string
          codigo_peca?: string | null
          conferente_id?: string | null
          conferida_at?: string | null
          created_at?: string
          descricao?: string | null
          embalador_id?: string | null
          etiquetada_at?: string
          faturada_at?: string | null
          id?: string
          romaneio_id?: string | null
          status?: Database["public"]["Enums"]["expedicao_peca_status"]
          updated_at?: string
        }
        Update: {
          alocada_at?: string | null
          carrinho_id?: string | null
          codigo_etiqueta?: string
          codigo_peca?: string | null
          conferente_id?: string | null
          conferida_at?: string | null
          created_at?: string
          descricao?: string | null
          embalador_id?: string | null
          etiquetada_at?: string
          faturada_at?: string | null
          id?: string
          romaneio_id?: string | null
          status?: Database["public"]["Enums"]["expedicao_peca_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedicao_pecas_carrinho_id_fkey"
            columns: ["carrinho_id"]
            isOneToOne: false
            referencedRelation: "expedicao_carrinhos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedicao_pecas_romaneio_id_fkey"
            columns: ["romaneio_id"]
            isOneToOne: false
            referencedRelation: "expedicao_romaneios"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicao_pecas_historico: {
        Row: {
          acao: string
          carrinho_destino_id: string | null
          carrinho_origem_id: string | null
          created_at: string
          detalhes: Json | null
          id: string
          peca_id: string
          romaneio_id: string | null
          usuario_email: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          carrinho_destino_id?: string | null
          carrinho_origem_id?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          peca_id: string
          romaneio_id?: string | null
          usuario_email?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          carrinho_destino_id?: string | null
          carrinho_origem_id?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          peca_id?: string
          romaneio_id?: string | null
          usuario_email?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expedicao_pecas_historico_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "expedicao_pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicao_picking_itens: {
        Row: {
          bipado_at: string | null
          bipado_por: string | null
          codigo_peca: string
          created_at: string
          descricao: string | null
          id: string
          picking_id: string
          qtd_bipada: number
          qtd_prevista: number
          updated_at: string
        }
        Insert: {
          bipado_at?: string | null
          bipado_por?: string | null
          codigo_peca: string
          created_at?: string
          descricao?: string | null
          id?: string
          picking_id: string
          qtd_bipada?: number
          qtd_prevista?: number
          updated_at?: string
        }
        Update: {
          bipado_at?: string | null
          bipado_por?: string | null
          codigo_peca?: string
          created_at?: string
          descricao?: string | null
          id?: string
          picking_id?: string
          qtd_bipada?: number
          qtd_prevista?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedicao_picking_itens_picking_id_fkey"
            columns: ["picking_id"]
            isOneToOne: false
            referencedRelation: "expedicao_pickings"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicao_pickings: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          carrinho_id: string | null
          cidade: string | null
          cliente: string
          created_at: string
          created_by: string | null
          faturado_at: string | null
          finished_at: string | null
          id: string
          motivo_cancelamento: string | null
          nfe_chave: string | null
          nfe_numero: string | null
          nfe_valor: number | null
          numero: string
          observacao: string | null
          regiao: string | null
          status: Database["public"]["Enums"]["expedicao_picking_status"]
          total_pecas: number
          transportadora_id: string | null
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          carrinho_id?: string | null
          cidade?: string | null
          cliente: string
          created_at?: string
          created_by?: string | null
          faturado_at?: string | null
          finished_at?: string | null
          id?: string
          motivo_cancelamento?: string | null
          nfe_chave?: string | null
          nfe_numero?: string | null
          nfe_valor?: number | null
          numero: string
          observacao?: string | null
          regiao?: string | null
          status?: Database["public"]["Enums"]["expedicao_picking_status"]
          total_pecas?: number
          transportadora_id?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          carrinho_id?: string | null
          cidade?: string | null
          cliente?: string
          created_at?: string
          created_by?: string | null
          faturado_at?: string | null
          finished_at?: string | null
          id?: string
          motivo_cancelamento?: string | null
          nfe_chave?: string | null
          nfe_numero?: string | null
          nfe_valor?: number | null
          numero?: string
          observacao?: string | null
          regiao?: string | null
          status?: Database["public"]["Enums"]["expedicao_picking_status"]
          total_pecas?: number
          transportadora_id?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expedicao_pickings_carrinho_id_fkey"
            columns: ["carrinho_id"]
            isOneToOne: false
            referencedRelation: "expedicao_carrinhos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedicao_pickings_transportadora_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "expedicao_transportadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicao_romaneio_nfe: {
        Row: {
          nfe_id: string
          romaneio_id: string
          vinculada_at: string
          vinculada_por: string | null
        }
        Insert: {
          nfe_id: string
          romaneio_id: string
          vinculada_at?: string
          vinculada_por?: string | null
        }
        Update: {
          nfe_id?: string
          romaneio_id?: string
          vinculada_at?: string
          vinculada_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expedicao_romaneio_nfe_nfe_id_fkey"
            columns: ["nfe_id"]
            isOneToOne: false
            referencedRelation: "nfe_importadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedicao_romaneio_nfe_romaneio_id_fkey"
            columns: ["romaneio_id"]
            isOneToOne: false
            referencedRelation: "expedicao_romaneios"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicao_romaneios: {
        Row: {
          cancelado_at: string | null
          cancelado_por: string | null
          created_at: string
          created_by: string | null
          faturado_at: string | null
          id: string
          motivo_cancelamento: string | null
          numero: string
          observacao: string | null
          status: Database["public"]["Enums"]["expedicao_romaneio_status"]
          transportadora_id: string | null
          updated_at: string
        }
        Insert: {
          cancelado_at?: string | null
          cancelado_por?: string | null
          created_at?: string
          created_by?: string | null
          faturado_at?: string | null
          id?: string
          motivo_cancelamento?: string | null
          numero: string
          observacao?: string | null
          status?: Database["public"]["Enums"]["expedicao_romaneio_status"]
          transportadora_id?: string | null
          updated_at?: string
        }
        Update: {
          cancelado_at?: string | null
          cancelado_por?: string | null
          created_at?: string
          created_by?: string | null
          faturado_at?: string | null
          id?: string
          motivo_cancelamento?: string | null
          numero?: string
          observacao?: string | null
          status?: Database["public"]["Enums"]["expedicao_romaneio_status"]
          transportadora_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedicao_romaneios_transportadora_id_fkey"
            columns: ["transportadora_id"]
            isOneToOne: false
            referencedRelation: "expedicao_transportadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicao_transportadoras: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          regra_nf: Database["public"]["Enums"]["expedicao_regra_nf"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          regra_nf?: Database["public"]["Enums"]["expedicao_regra_nf"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          regra_nf?: Database["public"]["Enums"]["expedicao_regra_nf"]
          updated_at?: string
        }
        Relationships: []
      }
      expedicao_veiculos: {
        Row: {
          ativo: boolean
          capacidade_kg: number | null
          created_at: string
          id: string
          modelo: string | null
          observacao: string | null
          placa: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          capacidade_kg?: number | null
          created_at?: string
          id?: string
          modelo?: string | null
          observacao?: string | null
          placa: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          capacidade_kg?: number | null
          created_at?: string
          id?: string
          modelo?: string | null
          observacao?: string | null
          placa?: string
          updated_at?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          key: string
          rollout_roles: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          rollout_roles?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          rollout_roles?: string[]
          updated_at?: string
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
      import_log: {
        Row: {
          atualizados: number
          created_at: string
          detalhes: Json | null
          erro: string | null
          file_name: string | null
          id: string
          ignorados: number
          inseridos: number
          resultado: string
          total_linhas: number
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          atualizados?: number
          created_at?: string
          detalhes?: Json | null
          erro?: string | null
          file_name?: string | null
          id?: string
          ignorados?: number
          inseridos?: number
          resultado: string
          total_linhas?: number
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          atualizados?: number
          created_at?: string
          detalhes?: Json | null
          erro?: string | null
          file_name?: string | null
          id?: string
          ignorados?: number
          inseridos?: number
          resultado?: string
          total_linhas?: number
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      integrations: {
        Row: {
          category: string
          config: Json
          created_at: string
          enabled: boolean
          id: string
          is_coming_soon: boolean
          key: string
          last_checked_at: string | null
          last_error: string | null
          name: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          is_coming_soon?: boolean
          key: string
          last_checked_at?: string | null
          last_error?: string | null
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          is_coming_soon?: boolean
          key?: string
          last_checked_at?: string | null
          last_error?: string | null
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
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
          codigo_interno_normalizado: string | null
          codigos_fornecedor: string[]
          codigos_fornecedor_normalizado: string[]
          created_at: string
          created_by: string | null
          descricao: string
          id: string
          last_edited_at: string | null
          last_edited_field: string | null
          pacote_estocagem: number | null
          pacote_fornecedor: number | null
          unidade: string | null
          updated_at: string
          updated_by: string | null
          updated_by_name: string | null
        }
        Insert: {
          codigo_fornecedor?: string | null
          codigo_fornecedor_normalizado?: string | null
          codigo_interno: string
          codigo_interno_normalizado?: string | null
          codigos_fornecedor?: string[]
          codigos_fornecedor_normalizado?: string[]
          created_at?: string
          created_by?: string | null
          descricao: string
          id?: string
          last_edited_at?: string | null
          last_edited_field?: string | null
          pacote_estocagem?: number | null
          pacote_fornecedor?: number | null
          unidade?: string | null
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
        }
        Update: {
          codigo_fornecedor?: string | null
          codigo_fornecedor_normalizado?: string | null
          codigo_interno?: string
          codigo_interno_normalizado?: string | null
          codigos_fornecedor?: string[]
          codigos_fornecedor_normalizado?: string[]
          created_at?: string
          created_by?: string | null
          descricao?: string
          id?: string
          last_edited_at?: string | null
          last_edited_field?: string | null
          pacote_estocagem?: number | null
          pacote_fornecedor?: number | null
          unidade?: string | null
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
      melhor_envio_credentials: {
        Row: {
          access_token: string | null
          environment: string
          expires_at: string | null
          id: number
          refresh_token: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          environment?: string
          expires_at?: string | null
          id?: number
          refresh_token?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          environment?: string
          expires_at?: string | null
          id?: number
          refresh_token?: string | null
          updated_at?: string
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
      nfe_cache: {
        Row: {
          cache_key: string
          cnpj: string
          created_at: string
          expires_at: string
          id: string
          payload: Json
          tipo: string
        }
        Insert: {
          cache_key: string
          cnpj: string
          created_at?: string
          expires_at: string
          id?: string
          payload: Json
          tipo: string
        }
        Update: {
          cache_key?: string
          cnpj?: string
          created_at?: string
          expires_at?: string
          id?: string
          payload?: Json
          tipo?: string
        }
        Relationships: []
      }
      nfe_consulta_log: {
        Row: {
          cache_hit: boolean
          chave_acesso: string | null
          cnpj: string
          created_at: string
          detalhes: Json | null
          id: string
          motivo: string | null
          status: string | null
          tipo: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          cache_hit?: boolean
          chave_acesso?: string | null
          cnpj: string
          created_at?: string
          detalhes?: Json | null
          id?: string
          motivo?: string | null
          status?: string | null
          tipo: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          cache_hit?: boolean
          chave_acesso?: string | null
          cnpj?: string
          created_at?: string
          detalhes?: Json | null
          id?: string
          motivo?: string | null
          status?: string | null
          tipo?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      nfe_entrada: {
        Row: {
          chave_acesso: string
          cnpj_emitente: string | null
          created_at: string
          danfe_path: string | null
          data_emissao: string | null
          id: string
          manifestada_at: string | null
          manifestada_por: string | null
          nome_emitente: string | null
          nsu: string | null
          numero: string | null
          observacao: string | null
          origem: string | null
          protocolo_manifestacao: string | null
          serie: string | null
          situacao_manifestacao: string | null
          tracking_last_sync_at: string | null
          tracking_provider: string | null
          tracking_status: string
          tracking_url: string | null
          transportadora: string | null
          updated_at: string
          valor_total: number | null
          xml_path: string | null
        }
        Insert: {
          chave_acesso: string
          cnpj_emitente?: string | null
          created_at?: string
          danfe_path?: string | null
          data_emissao?: string | null
          id?: string
          manifestada_at?: string | null
          manifestada_por?: string | null
          nome_emitente?: string | null
          nsu?: string | null
          numero?: string | null
          observacao?: string | null
          origem?: string | null
          protocolo_manifestacao?: string | null
          serie?: string | null
          situacao_manifestacao?: string | null
          tracking_last_sync_at?: string | null
          tracking_provider?: string | null
          tracking_status?: string
          tracking_url?: string | null
          transportadora?: string | null
          updated_at?: string
          valor_total?: number | null
          xml_path?: string | null
        }
        Update: {
          chave_acesso?: string
          cnpj_emitente?: string | null
          created_at?: string
          danfe_path?: string | null
          data_emissao?: string | null
          id?: string
          manifestada_at?: string | null
          manifestada_por?: string | null
          nome_emitente?: string | null
          nsu?: string | null
          numero?: string | null
          observacao?: string | null
          origem?: string | null
          protocolo_manifestacao?: string | null
          serie?: string | null
          situacao_manifestacao?: string | null
          tracking_last_sync_at?: string | null
          tracking_provider?: string | null
          tracking_status?: string
          tracking_url?: string | null
          transportadora?: string | null
          updated_at?: string
          valor_total?: number | null
          xml_path?: string | null
        }
        Relationships: []
      }
      nfe_entrada_eventos: {
        Row: {
          created_at: string
          detalhes: Json | null
          id: string
          nfe_entrada_id: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          detalhes?: Json | null
          id?: string
          nfe_entrada_id: string
          tipo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          detalhes?: Json | null
          id?: string
          nfe_entrada_id?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfe_entrada_eventos_nfe_entrada_id_fkey"
            columns: ["nfe_entrada_id"]
            isOneToOne: false
            referencedRelation: "nfe_entrada"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_entrada_tracking_eventos: {
        Row: {
          created_at: string
          data_evento: string
          descricao: string | null
          fonte: string | null
          id: string
          local: string | null
          nfe_entrada_id: string
          raw: Json | null
          status: string | null
        }
        Insert: {
          created_at?: string
          data_evento: string
          descricao?: string | null
          fonte?: string | null
          id?: string
          local?: string | null
          nfe_entrada_id: string
          raw?: Json | null
          status?: string | null
        }
        Update: {
          created_at?: string
          data_evento?: string
          descricao?: string | null
          fonte?: string | null
          id?: string
          local?: string | null
          nfe_entrada_id?: string
          raw?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfe_entrada_tracking_eventos_nfe_entrada_id_fkey"
            columns: ["nfe_entrada_id"]
            isOneToOne: false
            referencedRelation: "nfe_entrada"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_importadas: {
        Row: {
          chave_acesso: string
          cnpj_destinatario: string | null
          cnpj_emitente: string | null
          consultado_sefaz_at: string | null
          created_at: string
          danfe_path: string | null
          data_autorizacao: string | null
          data_emissao: string | null
          id: string
          imported_at: string
          imported_by: string | null
          itens: Json | null
          nome_destinatario: string | null
          nome_emitente: string | null
          numero: string
          peso_bruto: number | null
          peso_liquido: number | null
          picking_id: string | null
          protocolo_autorizacao: string | null
          serie: string | null
          situacao_sefaz: string | null
          transportadora: string | null
          updated_at: string
          valor_frete: number | null
          valor_produtos: number | null
          valor_total: number | null
          volumes: number | null
          xml_path: string | null
          xml_raw: string | null
        }
        Insert: {
          chave_acesso: string
          cnpj_destinatario?: string | null
          cnpj_emitente?: string | null
          consultado_sefaz_at?: string | null
          created_at?: string
          danfe_path?: string | null
          data_autorizacao?: string | null
          data_emissao?: string | null
          id?: string
          imported_at?: string
          imported_by?: string | null
          itens?: Json | null
          nome_destinatario?: string | null
          nome_emitente?: string | null
          numero: string
          peso_bruto?: number | null
          peso_liquido?: number | null
          picking_id?: string | null
          protocolo_autorizacao?: string | null
          serie?: string | null
          situacao_sefaz?: string | null
          transportadora?: string | null
          updated_at?: string
          valor_frete?: number | null
          valor_produtos?: number | null
          valor_total?: number | null
          volumes?: number | null
          xml_path?: string | null
          xml_raw?: string | null
        }
        Update: {
          chave_acesso?: string
          cnpj_destinatario?: string | null
          cnpj_emitente?: string | null
          consultado_sefaz_at?: string | null
          created_at?: string
          danfe_path?: string | null
          data_autorizacao?: string | null
          data_emissao?: string | null
          id?: string
          imported_at?: string
          imported_by?: string | null
          itens?: Json | null
          nome_destinatario?: string | null
          nome_emitente?: string | null
          numero?: string
          peso_bruto?: number | null
          peso_liquido?: number | null
          picking_id?: string | null
          protocolo_autorizacao?: string | null
          serie?: string | null
          situacao_sefaz?: string | null
          transportadora?: string | null
          updated_at?: string
          valor_frete?: number | null
          valor_produtos?: number | null
          valor_total?: number | null
          volumes?: number | null
          xml_path?: string | null
          xml_raw?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfe_importadas_picking_id_fkey"
            columns: ["picking_id"]
            isOneToOne: false
            referencedRelation: "expedicao_pickings"
            referencedColumns: ["id"]
          },
        ]
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
          modules: string[]
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
          modules?: string[]
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
          modules?: string[]
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
      tracking_links: {
        Row: {
          carrier: string
          carrier_raw: Json | null
          created_at: string
          created_by: string | null
          events: Json
          id: string
          last_event: Json | null
          linked_id: string | null
          linked_type: string | null
          status: string
          tracking_code: string
          updated_at: string
        }
        Insert: {
          carrier: string
          carrier_raw?: Json | null
          created_at?: string
          created_by?: string | null
          events?: Json
          id?: string
          last_event?: Json | null
          linked_id?: string | null
          linked_type?: string | null
          status?: string
          tracking_code: string
          updated_at?: string
        }
        Update: {
          carrier?: string
          carrier_raw?: Json | null
          created_at?: string
          created_by?: string | null
          events?: Json
          id?: string
          last_event?: Json | null
          linked_id?: string | null
          linked_type?: string | null
          status?: string
          tracking_code?: string
          updated_at?: string
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
      auge_kardex: {
        Row: {
          codigo_produto: string | null
          data_movimento: string | null
          deposito_destino: string | null
          deposito_origem: string | null
          documento: string | null
          ds_situacao: string | null
          operacao: string | null
          origem: string | null
          quantidade: number | null
          ref_id: string | null
          synced_at: string | null
          usuario_criacao: string | null
          valor: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      aplicar_descricao_cadastro: {
        Args: {
          _codigo_interno: string
          _codigos_norm: string[]
          _descricao: string
        }
        Returns: undefined
      }
      check_reset_rate_limit: {
        Args: {
          max_attempts?: number
          target_email: string
          window_minutes?: number
        }
        Returns: boolean
      }
      expedicao_has_at_least: {
        Args: { _min: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      get_my_modules: { Args: never; Returns: string[] }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_module: { Args: { _module: string }; Returns: boolean }
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
      normalizar_codigo: { Args: { v: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "operador" | "user" | "supervisor" | "gerente"
      compras_pedido_status:
        | "pendente"
        | "em_andamento"
        | "recebido"
        | "atrasado"
        | "cancelado"
      compras_starcolor_op_status:
        | "aberta"
        | "na_starcolor"
        | "retornou"
        | "finalizada"
      expedicao_carrinho_status: "livre" | "em_uso" | "manutencao"
      expedicao_carrinho_status_v2:
        | "montando"
        | "aguardando_conferencia"
        | "em_conferencia"
        | "conferido"
        | "romaneio_gerado"
        | "livre"
      expedicao_peca_status:
        | "etiquetada"
        | "no_carrinho"
        | "conferida"
        | "no_romaneio"
        | "faturada"
        | "cancelada"
      expedicao_picking_status:
        | "aguardando"
        | "em_separacao"
        | "em_conferencia"
        | "conferido"
        | "faturado"
        | "cancelado"
      expedicao_regra_nf: "uma_nf" | "multiplas_nf"
      expedicao_romaneio_status: "aberto" | "faturado" | "cancelado"
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
      compras_pedido_status: [
        "pendente",
        "em_andamento",
        "recebido",
        "atrasado",
        "cancelado",
      ],
      compras_starcolor_op_status: [
        "aberta",
        "na_starcolor",
        "retornou",
        "finalizada",
      ],
      expedicao_carrinho_status: ["livre", "em_uso", "manutencao"],
      expedicao_carrinho_status_v2: [
        "montando",
        "aguardando_conferencia",
        "em_conferencia",
        "conferido",
        "romaneio_gerado",
        "livre",
      ],
      expedicao_peca_status: [
        "etiquetada",
        "no_carrinho",
        "conferida",
        "no_romaneio",
        "faturada",
        "cancelada",
      ],
      expedicao_picking_status: [
        "aguardando",
        "em_separacao",
        "em_conferencia",
        "conferido",
        "faturado",
        "cancelado",
      ],
      expedicao_regra_nf: ["uma_nf", "multiplas_nf"],
      expedicao_romaneio_status: ["aberto", "faturado", "cancelado"],
    },
  },
} as const
