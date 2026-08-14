# Plano de Implementação: Redesign Profundo da Expedição

Evolução do módulo de Expedição para um fluxo industrial multi-etapas com alocação atômica e agrupamento por romaneios.

## Entendimento da Tarefa
- **Objetivo**: Substituir o fluxo antigo de conferência por um processo robusto: Recebimento -> Pulmão -> Conferência -> Transportadora -> Carrinho -> Romaneio.
- **Status Atual**: Infraestrutura de `Recebimento` e `useExpedicaoStore` implementada. RLS e Tabelas básicas mapeadas.
- **Restrição Crítica**: Módulo de `Etiquetas` deve permanecer intacto. `auge_clientes` é somente leitura.

## Arquitetura e Mudanças

### 1. Infraestrutura (Banco de Dados)
- `expedicao_alocacoes`: Registro atômico de cada peça vinculada a um carrinho e transportadora.
- `expedicao_romaneios`: Agrupador de alocações para geração de romaneios por transportadora/ciclo.
- `expedicao_romaneio_itens`: Itens vinculados aos romaneios (com log de exclusão manual).

### 2. Backend (Edge Functions)
- Ações no `auge-sync`:
  - `expedicao_validar_peca`: Validação completa contra Auge (Status, Pedido, Cliente).
  - `expedicao_alocar`: Transação atômica que cria alocação, atualiza status da peça e vincula ao romaneio aberto.

### 3. Frontend (Fluxos Operacionais)
- **Recebimento**: Fluxo atômico de bipagem para o pulmão (Concluído).
- **Conferência/Alocação**:
  - Bipar Peça -> Validar -> Selecionar Transportadora (Modal) -> Bipar Carrinho.
  - O sistema sugere a última transportadora usada ou a definida no Picking do Auge.
- **Painel de Romaneios**: Visualização agrupada por transportadora com status de carregamento e coleta.

## Próximos Passos
1. Finalizar aplicação da migração SQL ajustada (contornando conflitos de tabelas existentes).
2. Implementar `CarrierSelectorDialog` e `CarrinhoSelectorDialog`.
3. Refatorar `ConferenciaPage.tsx` para usar o novo fluxo atômico.
4. Criar a nova visualização de Romaneios Agrupados.

## Riscos
- Migração de dados legados de status de peças (normalização de enums case-insensitive).
- Concorrência na abertura/fechamento de romaneios automáticos.
