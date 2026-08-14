# Plano de Reformulação Profunda do Módulo de Expedição

Refatoração completa do fluxo operacional de Expedição, mantendo a integridade absoluta do módulo de Etiquetas e integrando-se de forma simbiótica com os dados do Auge/ERP.

## 1. Infraestrutura (Banco de Dados)

### Migrations Aditivas
- **Ajuste Carrinhos**: Adicionar `transportadora_id` e `ciclo_id` à `expedicao_carrinhos`.
- **Evolução Romaneios**:
  - Tabela `expedicao_romaneios` (número, transportadora_id, ciclo_id, status: ABERTO, EM_CARREGAMENTO, AGUARDANDO_COLETA, FECHADO, COLETADO, CANCELADO).
  - Tabela `expedicao_romaneio_itens` (romaneio_id, peca_id, alocacao_id, picking_id, status, metadata).
- **Alocações**: Tabela `expedicao_alocacoes` para persistir o vínculo Peca + Carrinho + Transportadora + Romaneio.
- **Auditoria**: Garantir que `expedicao_eventos` cubra todos os novos estados (`RECEBIDA_EXPEDICAO`, `CONFERIDA`, `ALOCADA`, `NO_ROMANEIO`, `LIBERADO_FATURAMENTO`).

## 2. Backend (Auge Sync & RPCs)

### Ações Auge-Sync
- **`validar_peca_expedicao`**: Recebe código de etiqueta, retorna dados da peça, cliente (Auge), pedido e item.
- **`transacao_alocacao`**: RPC/Edge Function transacional que executa:
  1. Validações de status e integridade.
  2. Localização/Criação de romaneio aberto para a transportadora.
  3. Registro da alocação e item do romaneio.
  4. Atualização de status da peça e pedido.
  5. Registro de eventos de auditoria.

## 3. Interface e Fluxos (Frontend)

### Nova Página: Recebimento (/expedicao/recebimento)
- Operação de bipagem inicial.
- Alocação rápida em Estrutura Temporária (Pulmão).
- Validação imediata contra o espelho de Clientes Auge.

### Nova Página: Conferência e Alocação (/expedicao/conferencia)
- Bipagem de peça do Pulmão.
- Seleção de Picking compatível.
- **Modal de Transportadora**: Bipagem/Pesquisa/Seleção de transportadora + vinculação de carrinho.
- Confirmação final disparando a transação atômica no backend.

### Reformulação: Romaneios (/expedicao/romaneios)
- Listagem agrupada por transportadora.
- Visão detalhada de itens, pedidos e volumes.
- Status operacional em tempo real via Realtime.

### Painel de Liberação (/expedicao/liberacao)
- Fila de pedidos com status `LIBERADO_FATURAMENTO`.

## 4. Proteções e Regras
- **Etiquetas**: Nenhum arquivo sob `src/components/expedicao/etiquetas` ou `src/pages/expedicao/etiquetas` será modificado. A expedição consumirá os dados via hooks de leitura existentes.
- **Clientes**: Acesso somente leitura à tabela `auge_clientes`. Sem botões de CRUD.
- **Transacionalidade**: A alocação no romaneio é atômica; falha em qualquer passo reverte tudo.

## Detalhes Técnicos
- Utilização de `TanStack Query` para cache de transportadoras e clientes.
- `Zustand` para estado da sessão de bipagem (evitar perda de contexto).
- Padrão de design industrial (ERP profissional) com centralização rígida de modais.
