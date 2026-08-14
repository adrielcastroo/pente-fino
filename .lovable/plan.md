# Plano de Reformulação do Módulo de Expedição

Este plano visa transformar o módulo de Expedição em um sistema auxiliar simbiótico ao Auge ERP, garantindo rastreabilidade total desde o recebimento da peça até a liberação para faturamento.

## 1. Infraestrutura e Banco de Dados (Supabase)

- **expedicao_pecas**: Evoluir a tabela para suportar o fluxo completo.
  - Adicionar , ,  (vinculado à ).
  - Adicionar  (FK para ).
  - Adicionar .
  - Estados: `AGUARDANDO_RECEBIMENTO`, `RECEBIDA_EXPEDICAO`, `ARMAZENADA_EXPEDICAO`, `EM_CONFERENCIA`, `CONFERIDA`, `VINCULADA_PICKING`, `AGUARDANDO_TRANSPORTADORA`, `ALOCADA_CARRINHO_TRANSPORTADORA`, `INCLUIDA_ROMANEIO`, `LIBERADA`, `DIVERGENTE`, `BLOQUEADA`, `CANCELADA`.
- **expedicao_estruturas_temporarias**: Nova tabela para gerir o pulmão da expedição.
- **expedicao_eventos**: Tabela de auditoria para registrar cada mudança de estado e operador.
- **RLS**: Garantir que  permaneça estritamente read-only para usuários, com permissões de escrita apenas via .

## 2. Backend e Integração Auge (Edge Functions)

- **auge-sync**:
  - Implementar consulta de pedidos e itens do pedido em tempo real.
  - Implementar lógica de "Liberar para Faturamento" enviando o status de volta ao Auge (via adaptador seguro).
  - Adaptador de etiquetas: Criar camada de serviço que interpreta os QRs atuais e extrai o vínculo com o Auge.

## 3. Fluxo de Conferência e Alocação (Frontend)

- **Nova Página de Recebimento**: Bipagem inicial para entrada no "Pulmão" (Estrutura Temporária).
- **Página de Conferência (Redesign)**:
  - Fluxo: Bipar Peça -> Validar com Auge (Pedido/Cliente) -> Mostrar Pickings compatíveis -> Vincular.
- **Modal de Transportadora**:
  - Busca inteligente na .
  - Bipagem de código da transportadora.
- **Alocação em Carrinho**:
  - Validação de compatibilidade (mesma transportadora no carrinho).
  - Criação automática de romaneio se não houver um aberto para o ciclo/transportadora.

## 4. Fila de Faturamento

- **Painel de Liberação**: Lista de pedidos onde todas as peças atingiram o estado `LIBERADA`.
- Interface simplificada para o faturista visualizar o que o sistema "Pente Fino" já validou 100%.

## Detalhes Técnicos

- **Preservação**: O serviço  e o hook  não serão alterados, apenas consumidos.
- **Performance**: Uso intensivo de  para cache de clientes e pedidos do Auge.
- **Segurança**: Credenciais do Auge residem apenas no cofre do Supabase, nunca expostas ao browser.

