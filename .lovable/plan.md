---
title: Plano de Integração Simbiótica - Módulo de Clientes Auge
date: 2026-08-14
author: Claude Opus 4.8
---

# Plano de Integração de Clientes Auge

Este plano descreve a implementação da primeira etapa da integração simbiótica entre o Pente Fino e o Auge ERP, focada no cadastro de clientes.

## 1. Infraestrutura de Dados (Supabase)

### Tabela `auge_clientes`
Criação da tabela para armazenar os dados espelhados do Auge, permitindo consulta rápida e offline no Pente Fino.

```sql
CREATE TABLE public.auge_clientes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo text UNIQUE NOT NULL, -- cdParticipante no Auge
    nome text,
    nome_fantasia text,
    razao_social text,
    cpf_cnpj text,
    email text,
    telefone text,
    celular text,
    endereco text,
    numero text,
    complemento text,
    bairro text,
    cidade text,
    uf text,
    cep text,
    situacao text,
    raw jsonb,
    synced_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### Segurança (RLS)
- Habilitar RLS em `auge_clientes`.
- `GRANT SELECT, INSERT, UPDATE` para `authenticated` e `service_role`.
- Política de leitura global para usuários autenticados.

## 2. Backend (Edge Function `auge-sync`)

### Descoberta e Integração
1. **Novos Endpoints (Tentativos):** Adicionar lógica para encontrar o endpoint de participantes (Clientes/Fornecedores) no Auge.
   - Candidatos: `/l.unilux/modComercial/ajax/getParticipantes.php`, `/l.unilux/modCRM/ajax/getParticipantes.php`.
2. **Ação `sync_clientes`:**
   - Implementar paginação (start/length) padrão DataTables do Auge.
   - Normalização de dados (limpeza de strings, máscaras de CPF/CNPJ).
   - Upsert no Supabase (`onConflict: 'codigo'`).
   - Registro de erros individuais e progresso em `auge_sync_runs`.

## 3. Frontend (Interface Industrial)

### Página de Clientes (`src/pages/admin/ClientesPage.tsx`)
- Tabela responsiva com filtros avançados (Nome, CPF/CNPJ, Cidade, UF).
- Indicador visual de sincronização (Badge "Auge" com timestamp).
- Botão de "Sincronizar Agora" (Individual e Global).

### Painel de Controle (`src/components/auge/AugeAdminPanel.tsx`)
- Inclusão da entidade "Clientes" na lista de sincronizáveis.
- Exibição de métricas (Total de clientes, última sync).

## 4. Detalhes Técnicos
- **Deduplicação:** Chave única baseada no código interno do Auge (`cdParticipante`).
- **Performance:** Sincronização em chunks de 500-1000 registros para evitar timeouts.
- **Auditoria:** Registro completo da resposta bruta (`raw jsonb`) para auditoria e rastreabilidade.

## 5. Próximos Passos
- Após a aprovação, a migração SQL será executada e a Edge Function atualizada.
- A interface de Clientes será criada sob o módulo de Administração/Auge.
