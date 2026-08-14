# Plano de Implementação - Etapa 1: Infraestrutura e Sincronização de Peças Prontas (CORRIGIDO)

Este plano estabelece a base para o novo módulo de Expedição, garantindo a sincronização confiável do status "PRONTO" do Auge para o Pente Fino e implementando o fluxo operacional rigoroso.

## 1. Banco de Dados (Migrations)

- Criar tabela `expedicao_pecas_auge_sync` (sem caracteres acentuados) para armazenar o estado operacional das peças recebidas do Auge.
- Incluir colunas: `auge_peca_id`, `auge_evento_id`, `codigo_peca`, `codigo_etiqueta`, `auge_pedido_id`, `auge_pedido_codigo`, `auge_cliente_id`, `auge_cliente_codigo`, `auge_cliente_nome`, `auge_item_id`, `auge_item_codigo`, `descricao_item`, `quantidade`, `status_auge`, `status_local`, `operador_producao_id`, `operador_producao_nome`, `data_pronto_auge`, `recebido_em`, `processado_em`, `picking_id`, `carrinho_id`, `romaneio_id`.
- Habilitar RLS e garantir privilégios para `authenticated` e `service_role`.

## 2. Backend (Edge Function `auge-sync`)

- Implementar ação `expedicao_sync_prontos`: Sincronização automática de peças "PRONTO" do Auge.
- Implementar ação `expedicao_validar_peca`: Validação rigorosa contra a tabela `sync`.
- Implementar ação `expedicao_alocar`: Alocação atômica que vincula transportadora e carrinho apenas após validação do picking.

## 3. Frontend (Operacional)

- **Fluxo de Conferência Corrigido (`ConferenciaPage.tsx`)**:
    1. Bipagem/Identificação da Peça (oficial Auge).
    2. Bipagem/Validação do Picking (Comparação de Cliente/Pedido/Item).
    3. Seleção da Transportadora (Modal abre somente após picking validado).
    4. Alocação no Carrinho e inserção automática no Romaneio.
- **Store (`useExpedicaoStore.ts`)**: Adicionar controle de `fluxoPasso` ('peca' -> 'picking' -> 'transportadora' -> 'carrinho').

## 4. Segurança e Proteção

- **Módulo de Etiquetas**: Permanecerá 100% intacto, atuando apenas como fornecedor de dados via adaptadores.
- **Auge Client Mirror**: Acesso somente leitura aos dados de clientes sincronizados.

---
*Aprovado como base. Iniciando implementação da infraestrutura de dados.*
