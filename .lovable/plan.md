# Plano de Reformulação do Módulo de Expedição

Este plano visa transformar o módulo de Expedição em um sistema auxiliar simbiótico ao Auge ERP, garantindo rastreabilidade total desde o recebimento da peça até a liberação para faturamento.

## 1. Infraestrutura e Banco de Dados (Supabase)

- **expedicao_pecas**: Evoluir a tabela para suportar o fluxo completo.
  - Adicionar colunas: `pedido_id`, `item_pedido_id`, `cliente_id` (vinculado à `auge_clientes`), `picking_id` (FK para `expedicao_pickings`), `estrutura_temporaria_id`.
  - Novos estados: `AGUARDANDO_RECEBIMENTO`, `RECEBIDA_EXPEDICAO`, `ARMAZENADA_EXPEDICAO`, `EM_CONFERENCIA`, `CONFERIDA`, `VINCULADA_PICKING`, `AGUARDANDO_TRANSPORTADORA`, `ALOCADA_CARRINHO_TRANSPORTADORA`, `INCLUIDA_ROMANEIO`, `LIBERADA`, `DIVERGENTE`, `BLOQUEADA`, `CANCELADA`.
- **expedicao_estruturas_temporarias**: Nova tabela para gerir o pulmão da expedição (prateleiras/boxes).
- **expedicao_eventos**: Tabela de auditoria para registrar cada mudança de estado e o operador responsável.
- **RLS**: Reforçar que `auge_clientes` é estritamente read-only para usuários.

## 2. Backend e Integração Auge (Edge Functions)

- **auge-sync**:
  - Implementar consulta de pedidos e itens do pedido em tempo real.
  - Implementar ação "Liberar para Faturamento" enviando o status de volta ao Auge.
  - Adaptador de etiquetas: Camada de serviço que interpreta os QRs gerados pelo `etiquetaService.ts` e extrai os metadados do Auge (vínculo simbólico).

## 3. Fluxo de Conferência e Alocação (Frontend)

- **Nova Página de Recebimento**: Bipagem inicial para entrada no "Pulmão" (Estrutura Temporária).
- **Redesign da Página de Conferência**:
  - Fluxo: Bipar Peça -> Validar Pedido/Cliente no Auge -> Listar Pickings compatíveis -> Vincular.
- **Modal de Transportadora**:
  - Busca inteligente na `expedicao_transportadoras`.
  - Suporte a bipagem de transportadora.
- **Alocação em Carrinho**:
  - Validação de compatibilidade.
  - Criação automática de romaneio se não houver um aberto para o par ciclo/transportadora.

## 4. Fila de Faturamento

- **Painel de Liberação**: Lista consolidada de pedidos onde todas as peças atingiram o estado `LIBERADA`.
- Interface dedicada para o faturista validar o progresso antes de processar no ERP.

## Detalhes Técnicos

- **Preservação**: O serviço `etiquetaService.ts` e o hook `useEtiquetas.ts` não sofrerão alterações estruturais, apenas novos adaptadores de leitura.
- **Performance**: Uso de `TanStack Query` para sincronização eficiente e cache de dados do Auge.
- **Segurança**: Integrações sensíveis via backend seguro, sem exposição de tokens no frontend.

