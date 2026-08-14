# Plano de Implementação - Etapa 1: Infraestrutura e Sincronização de Peças Prontas

Este plano foca em estabelecer a base para o novo módulo de Expedição, garantindo a sincronização confiável do status "PRONTO" do Auge para o Pente Fino.

## 1. Banco de Dados (Migrations)

- Criar tabela `expedicao_pecas_auge_sync` para armazenar o estado operacional das peças recebidas do Auge.
- Incluir colunas para IDs do Auge (peça, pedido, cliente, item), códigos, quantidades, operador da produção e status local.
- Adicionar índices para buscas rápidas por código de etiqueta e ID do pedido.
- Habilitar RLS e garantir privilégios para `authenticated` e `service_role`.

## 2. Backend (Edge Function `auge-sync`)

- Implementar ação `expedicao_sync_prontos`:
    - Consultar o Auge por peças marcadas como "PRONTO" (usando os endpoints identificados nos HARs).
    - Realizar processamento idempotente para evitar duplicidade.
    - Fazer o "UPSERT" na tabela local `expedicao_pecas_auge_sync`.
- Implementar ação `expedicao_validar_peca_v2`:
    - Validar a peça contra a nova tabela de sincronização.
    - Garantir que apenas peças que vieram do Auge com status oficial possam ser processadas.

## 3. Frontend (Operacional)

- **Fila de Pendências (`PecasProntasPage.tsx`)**: Nova página para exibir as peças que acabaram de chegar do Auge e aguardam conferência.
- **Ajuste no `useExpedicaoFlow.ts`**: Atualizar o hook de validação para consumir a nova fonte de dados oficial (Auge Sync).
- **Refinamento da Conferência**: Integrar a validação rigorosa no fluxo de 3 passos (Peça -> Transportadora -> Carrinho).

## Detalhes Técnicos

```text
CREATE TABLE public.expedicao_pecas_auge_sync (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auge_peça_id text UNIQUE NOT NULL,
    codigo_etiqueta text NOT NULL,
    auge_pedido_id text,
    auge_pedido_codigo text,
    auge_cliente_id text,
    auge_cliente_nome text,
    status_auge text, -- ex: 'PRONTO'
    status_local text DEFAULT 'PRONTO_RECEBIDO_AUGE',
    operador_producao text,
    data_pronto_auge timestamptz,
    payload_original jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

**Segurança:** Todas as requisições ao Auge usarão as credenciais seguras já configuradas no sistema, sem exposição no frontend.
